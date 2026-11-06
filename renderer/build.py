"""Baut eine komplette Folge: Hauptvideo, Shorts, Thumbnails, Untertitel, Upload-Plan.

Aufruf:  python renderer/build.py episodes/01_vermieter.json [--only main|shorts|thumbs] [--preview]
"""
import argparse
import json
import os
import re
import subprocess
import sys
import wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PIL import Image, ImageDraw  # noqa: E402

import scenes  # noqa: E402
from core import AMBER, INK, WHITE, background, font, text_block, tw  # noqa: E402
from thumbs import thumbnail  # noqa: E402
from tts import SR, norm, synth  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30


def make_cue(words, dur):
    toks = [norm(w[2]) for w in words]
    state = {"i": 0}

    def cue(at, frac):
        if at:
            parts = [norm(p) for p in at.split() if norm(p)]
            for start in (state["i"], 0):
                for i in range(start, len(toks) - len(parts) + 1):
                    if all((toks[i + j] == parts[j]) if len(parts[j]) <= 2 else toks[i + j].startswith(parts[j])
                           for j in range(len(parts))):
                        state["i"] = i + 1
                        return max(0.0, words[i][0] - 0.05)
            print(f"   ! Cue nicht gefunden: '{at}'")
        if frac is None:
            return None
        return frac * dur
    return cue


def align_tokens(text, words):
    """Ordnet die Original-Wörter (mit Satzzeichen) den Zeitstempeln zu."""
    toks = text.split()
    out, wi = [], 0
    for t in toks:
        nt = norm(t)
        st = None
        for k in range(wi, min(wi + 4, len(words))):
            if nt and (norm(words[k][2]) == nt or nt.startswith(norm(words[k][2])) or norm(words[k][2]).startswith(nt)):
                st, en = words[k][0], words[k][1]
                wi = k + 1
                break
        if st is None:
            st = out[-1][1] if out else (words[wi][0] if wi < len(words) else 0)
            en = st + 0.25
        out.append([st, en, t])
    return out


def chunks(tokens, max_chars=42, max_words=None):
    res, cur = [], []
    for tk in tokens:
        cand = " ".join(x[2] for x in cur + [tk])
        if cur and (len(cand) > max_chars or (max_words and len(cur) >= max_words)):
            res.append(cur)
            cur = []
        cur.append(tk)
        if re.search(r"[.!?:]$", tk[2]) and len(" ".join(x[2] for x in cur)) > 12:
            res.append(cur)
            cur = []
    if cur:
        res.append(cur)
    return res


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def caption_img(text, W):
    f = font(64, "Black")
    lines = text_block(text.upper(), 64, W - 200, WHITE, "Black", "center", 1.15)
    pad = 28
    img = Image.new("RGBA", (lines.width + 2 * pad, lines.height + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, img.width - 1, img.height - 1), 26, fill=(10, 12, 18, 225))
    img.alpha_composite(lines, (pad, pad))
    return img


def expand_words(words):
    """edge-tts fasst manchmal mehrere Wörter zusammen ("seit 2003") -> einzeln aufteilen."""
    out = []
    for st, en, w in words:
        parts = w.split()
        if len(parts) <= 1:
            out.append([st, en, w])
            continue
        step = (en - st) / len(parts)
        for k, p in enumerate(parts):
            out.append([st + k * step, st + (k + 1) * step, p])
    return out


def synth_scene(sc, voice, rate):
    """Unterstützt Denkpausen: Text mit ' ... ' wird geteilt und mit Stille verbunden."""
    parts = [p.strip() for p in sc["say"].split(" ... ") if p.strip()]
    if len(parts) == 1:
        return synth(parts[0], voice, rate)
    gap = sc.get("think", 1.6)
    out = f"/tmp/ddd_scene_{abs(hash(sc['say']))}.wav"
    allw, t = [], 0.0
    with wave.open(out, "wb") as wo:
        wo.setnchannels(1); wo.setsampwidth(2); wo.setframerate(SR)
        for k, ptxt in enumerate(parts):
            wav, d, words = synth(ptxt, voice, rate)
            with wave.open(wav) as wi:
                data = wi.readframes(wi.getnframes())
            wo.writeframes(data)
            allw += [[w[0] + t, w[1] + t, w[2]] for w in words]
            t += len(data) / 2 / SR
            if k < len(parts) - 1:
                wo.writeframes(b"\x00\x00" * int(gap * SR))
                t += gap
    return out, t, allw


def render_video(spec, scs, W, H, out_mp4, voice, rate, captions=False, preview_dir=None):
    L = scenes.Layout(W, H)
    bg = background(W, H)
    prepared, t0 = [], 0.0
    srt_tokens = []
    for i, sc in enumerate(scs):
        wav, adur, words = synth_scene(sc, voice, rate)
        words = expand_words(words)
        pad = sc.get("pause", 0.45)
        dur = adur + pad
        prepared.append((sc, wav, adur, dur, words, t0))
        for tk in align_tokens(sc["say"].replace(" ... ", " "), words):
            srt_tokens.append([tk[0] + t0, tk[1] + t0, tk[2]])
        t0 += dur
    total = t0
    print(f"   {os.path.basename(out_mp4)}: {len(scs)} Szenen, {total:.1f}s")

    # Audio zusammensetzen
    full_wav = out_mp4 + ".wav"
    with wave.open(full_wav, "wb") as wo:
        wo.setnchannels(1)
        wo.setsampwidth(2)
        wo.setframerate(SR)
        written = 0
        for sc, wav, adur, dur, words, st in prepared:
            target = int(round(st * SR))
            if target > written:
                wo.writeframes(b"\x00\x00" * (target - written))
                written = target
            with wave.open(wav) as wi:
                data = wi.readframes(wi.getnframes())
            wo.writeframes(data)
            written += len(data) // 2
        end = int(round(total * SR))
        if end > written:
            wo.writeframes(b"\x00\x00" * (end - written))

    cap_chunks = []
    if captions:
        for ch in chunks(srt_tokens, 22, 4):
            cap_chunks.append((ch[0][0], " ".join(x[2] for x in ch).rstrip(",")))

    if preview_dir:
        os.makedirs(preview_dir, exist_ok=True)

    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", full_wav, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-shortest",
           "-movflags", "+faststart", out_mp4]
    proc = None if preview_dir else subprocess.Popen(cmd, stdin=subprocess.PIPE)
    fidx = 0
    nframes = int(round(total * FPS))
    cap_cache = {}
    for si, (sc, wav, adur, dur, words, st) in enumerate(prepared):
        cue = make_cue(words, adur)
        blocks = scenes.build(sc, L, cue)
        last_key, last_bytes = None, None
        end_f = nframes if si == len(prepared) - 1 else int(round((st + dur) * FPS))
        while fidx < end_f:
            t = fidx / FPS - st
            gt = fidx / FPS
            states = tuple(b.state(t) for b in blocks)
            cap = None
            if cap_chunks:
                for cs, ctext in cap_chunks:
                    if cs <= gt + 0.05:
                        cap = ctext
                    else:
                        break
            key = (states, cap)
            if key != last_key:
                fr = bg.copy()
                for b, s in zip(blocks, states):
                    if s is not None:
                        b.draw(fr, s)
                if cap:
                    if cap not in cap_cache:
                        cap_cache[cap] = caption_img(cap, W)
                    ci = cap_cache[cap]
                    fr.paste(ci, ((W - ci.width) // 2, 1470), ci)
                last_key, last_bytes = key, fr.tobytes()
                if preview_dir and t > dur - 0.6 and not os.path.exists(f"{preview_dir}/s{si:02d}.jpg"):
                    fr.save(f"{preview_dir}/s{si:02d}.jpg", quality=80)
            if preview_dir:
                fidx = end_f
                fr2 = Image.frombytes("RGB", (W, H), last_bytes)
                fr2.save(f"{preview_dir}/s{si:02d}.jpg", quality=80)
                break
            proc.stdin.write(last_bytes)
            fidx += 1
        if preview_dir:
            # Endzustand der Szene rendern
            fr = bg.copy()
            for b in blocks:
                s = b.state(dur + 5)
                if s is not None:
                    b.draw(fr, s)
            fr.save(f"{preview_dir}/s{si:02d}.jpg", quality=80)
    if proc:
        proc.stdin.close()
        proc.wait()
        os.remove(full_wav)
    return prepared, srt_tokens, total


def write_srt(tokens, path):
    out = []
    for i, ch in enumerate(chunks(tokens, 42), 1):
        text = " ".join(x[2] for x in ch)
        if len(text) > 30:
            words = text.split()
            best = min(range(1, len(words)), key=lambda k: abs(len(" ".join(words[:k])) - len(text) / 2)) if len(words) > 1 else 1
            text = " ".join(words[:best]) + "\n" + " ".join(words[best:])
        out.append(f"{i}\n{srt_time(ch[0][0])} --> {srt_time(ch[-1][1])}\n{text}\n")
    open(path, "w").write("\n".join(out))


def fmt_ts(s):
    s = int(s)
    return f"{s // 60}:{s % 60:02d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("episode")
    ap.add_argument("--only", default="all")
    ap.add_argument("--preview", action="store_true")
    a = ap.parse_args()
    ep = json.load(open(a.episode))
    slug = ep["slug"]
    out = os.path.join(ROOT, "up", slug)
    os.makedirs(out, exist_ok=True)
    voice, rate = ep.get("voice", "de-DE-SeraphinaMultilingualNeural"), ep.get("rate", "+0%")
    plan_path = os.path.join(ROOT, "up", "plan.json")
    plan = json.load(open(plan_path)) if os.path.exists(plan_path) else []
    entry = {k: ep[k] for k in ("title", "date", "tags", "pin") if k in ep}
    entry["v"] = slug

    if a.only in ("all", "main"):
        mp4 = os.path.join(out, f"{slug}_video.mp4")
        prev = os.path.join(ROOT, "preview", slug, "main") if a.preview else None
        prepared, toks, total = render_video(ep, ep["scenes"], 1920, 1080, mp4, voice, rate, False, prev)
        if not a.preview:
            write_srt(toks, os.path.join(out, "untertitel_de.srt"))
        chap = []
        for sc, wav, adur, dur, words, st in prepared:
            if sc.get("chapter"):
                chap.append(f"{fmt_ts(st if chap else 0)} {sc['chapter']}")
        entry["file"] = f"{slug}_video.mp4"
        entry["desc"] = ep["desc"].replace("{kapitel}", "\n".join(chap))
        entry["duration"] = round(total, 1)

    if a.only in ("all", "shorts"):
        entry["shorts"] = []
        for i, sh in enumerate(ep.get("shorts", []), 1):
            fn = f"short_{i}_{sh['slug']}.mp4"
            prev = os.path.join(ROOT, "preview", slug, f"short{i}") if a.preview else None
            _, _, total = render_video(ep, sh["scenes"], 1080, 1920, os.path.join(out, fn), voice, rate, True, prev)
            entry["shorts"].append({"file": fn, "title": sh["title"], "date": sh["date"], "duration": round(total, 1)})

    if a.only in ("all", "thumbs"):
        for k, th in ep.get("thumbs", {}).items():
            thumbnail(th).save(os.path.join(out if not a.preview else os.path.join(ROOT, "preview", slug),
                                            f"thumbnail_{k}.png"))

    if not a.preview and a.only == "all":
        plan = [p for p in plan if p.get("v") != slug] + [entry]
        plan.sort(key=lambda p: p.get("date", ""))
        json.dump(plan, open(plan_path, "w"), ensure_ascii=False, indent=1)
    print("fertig:", out)


if __name__ == "__main__":
    main()
