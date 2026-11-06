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


REMOTION = os.path.join(ROOT, "remotion")


def amp_string(wav, frames):
    """Lautstärke pro Videoframe als Ziffern 0-9 (für Lupos Mundbewegung)."""
    import numpy as np
    with wave.open(wav) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)
    hop = sr / FPS
    vals = []
    for i in range(frames):
        seg = x[int(i * hop):int((i + 1) * hop)]
        vals.append(float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0)
    v = np.array(vals)
    ref = np.percentile(v[v > 0], 90) if (v > 0).any() else 1
    q = np.clip(v / (ref + 1e-9), 0, 1)
    return "".join(str(int(round(a * 9))) for a in q)


def resolve_cues(obj, cue):
    """Ersetzt alle 'at'/'*_at'-Texte (in Dokument-Reihenfolge) durch Sekunden."""
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if (k == "at" or k.endswith("_at")) and isinstance(v, str):
                out[k] = cue(v, None)
            else:
                out[k] = resolve_cues(v, cue)
        return out
    if isinstance(obj, list):
        return [resolve_cues(x, cue) for x in obj]
    return obj


def remotion_cmd(*args):
    cmd = ["npx", "remotion", *args]
    if os.environ.get("CHROME"):
        cmd += ["--browser-executable", os.environ["CHROME"]]
    return cmd


def render_video(spec, scs, W, H, out_mp4, voice, rate, captions=False, preview_dir=None, tag="main"):
    slug = spec["slug"]
    epdir = os.path.join(REMOTION, "public", "ep", slug)
    os.makedirs(epdir, exist_ok=True)
    scenes_out, srt_tokens, t0 = [], [], 0.0
    prepared = []
    for i, sc in enumerate(scs):
        wav, adur, words = synth_scene(sc, voice, rate)
        words = expand_words(words)
        dur = adur + sc.get("pause", 0.45)
        rel = f"ep/{slug}/{tag}_{i:02d}.mp3"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "128k", os.path.join(REMOTION, "public", rel)], check=True)
        cue = make_cue(words, adur)
        res = resolve_cues({k: v for k, v in sc.items() if k != "say"}, cue)
        f0, fd = int(round(t0 * FPS)), int(round(dur * FPS))
        res.update({"start": f0, "dur": fd, "adur": adur, "audio": rel, "amp": amp_string(wav, fd),
                    "words": [[round(a, 3), round(b, 3), w] for a, b, w in align_tokens(sc["say"].replace(" ... ", " "), words)]})
        scenes_out.append(res)
        prepared.append((sc, wav, adur, dur, words, t0))
        for tk in align_tokens(sc["say"].replace(" ... ", " "), words):
            srt_tokens.append([tk[0] + t0, tk[1] + t0, tk[2]])
        t0 += fd / FPS
    total = sum(s["dur"] for s in scenes_out)
    props = {"fps": FPS, "width": W, "height": H, "totalFrames": total, "captions": captions,
             "scenes": scenes_out, "slug": slug, "music": "music/lofi.mp3"}
    props_path = os.path.join(epdir, f"{tag}_props.json")
    json.dump(props, open(props_path, "w"), ensure_ascii=False)
    print(f"   {os.path.basename(out_mp4)}: {len(scs)} Szenen, {total / FPS:.1f}s")
    if preview_dir:
        os.makedirs(preview_dir, exist_ok=True)
        bundle = os.path.join(REMOTION, "out", "bundle")
        if not os.path.exists(bundle) or os.environ.get("REBUNDLE"):
            subprocess.run(["npx", "remotion", "bundle", "src/index.ts", "--out-dir", bundle], cwd=REMOTION, check=True,
                           stdout=subprocess.DEVNULL)
        for i, s in enumerate(scenes_out):
            fr = s["start"] + int(s["dur"] * 0.82)
            subprocess.run(remotion_cmd("still", bundle, "Video", os.path.join(preview_dir, f"s{i:02d}.jpg"),
                                        f"--props={props_path}", f"--frame={fr}", "--jpeg-quality=80", "--log=error"),
                           cwd=REMOTION, check=True)
    else:
        subprocess.run(remotion_cmd("render", "src/index.ts", "Video", out_mp4, f"--props={props_path}",
                                    "--codec=h264", "--crf=24", "--log=error",
                                    f"--concurrency={os.environ.get('CONCURRENCY', '100%')}"),
                       cwd=REMOTION, check=True)
        # GitHub erlaubt max. 100 MB pro Datei
        if os.path.getsize(out_mp4) > 85 * 1024 * 1024:
            tmp = out_mp4 + ".tmp.mp4"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out_mp4, "-c:v", "libx264", "-preset", "veryfast",
                            "-crf", "28", "-c:a", "copy", "-movflags", "+faststart", tmp], check=True)
            os.replace(tmp, out_mp4)
        loudnorm(out_mp4)
    return prepared, srt_tokens, total / FPS


def loudnorm(mp4):
    """Lautheit auf YouTube-Niveau (ca. -15 LUFS) bringen, Bild wird nur kopiert."""
    tmp = mp4 + ".ln.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp4, "-c:v", "copy", "-af", "loudnorm=I=-15:TP=-1.5:LRA=11",
                    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, mp4)


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
    entry = {k: ep[k] for k in ("title", "date", "time", "tags", "pin") if k in ep}
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
            _, _, total = render_video(ep, sh["scenes"], 1080, 1920, os.path.join(out, fn), voice, rate, True, prev, tag=f"short{i}")
            entry["shorts"].append({"file": fn, "title": sh["title"], "date": sh["date"], "time": sh.get("time", "12:00"), "duration": round(total, 1)})

    if a.only in ("all", "thumbs"):
        tdir = out if not a.preview else os.path.join(ROOT, "preview", slug)
        os.makedirs(tdir, exist_ok=True)
        for k, th in ep.get("thumbs", {}).items():
            pj = os.path.join(REMOTION, "out", f"thumb_{k}.json")
            os.makedirs(os.path.dirname(pj), exist_ok=True)
            json.dump(th, open(pj, "w"), ensure_ascii=False)
            subprocess.run(remotion_cmd("still", "src/index.ts", "Thumb", os.path.join(tdir, f"thumbnail_{k}.png"),
                                        f"--props={pj}", "--log=error"), cwd=REMOTION, check=True)

    if not a.preview and a.only == "all":
        plan = [p for p in plan if p.get("v") != slug] + [entry]
        plan.sort(key=lambda p: p.get("date", ""))
        json.dump(plan, open(plan_path, "w"), ensure_ascii=False, indent=1)
    print("fertig:", out)


if __name__ == "__main__":
    main()
