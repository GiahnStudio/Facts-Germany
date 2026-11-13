"""Eigene Sprachaufnahmen (z. B. aus Voice Studio) statt Text-to-Speech.

Folge mit  "voice": "files"  ->  Aufnahmen liegen in  voice_in/<slug>/ :
  Variante 1 (einfach):  eine Datei pro Video:  main.wav, short1.wav, short2.wav
                         (der ganze Sprechtext am Stück; wird per Spracherkennung in Szenen zerlegt)
  Variante 2 (genau):    eine Datei pro Abschnitt, z. B. main_03.wav, main_05_2.wav
                         (Dateinamen und Texte stehen in voice_in/<slug>/SPRECHTEXT.md)
Erlaubte Formate: wav, mp3, m4a, flac, ogg.  Wortzeiten kommen aus faster-whisper, der Abgleich
Skript/Aufnahme steht als "match" in audio_cache/*.json (Ziel >= 0,85).

    python renderer/recorded.py episodes/10_toilette.json   # schreibt SPRECHTEXT.md + prüft, was fehlt
"""
import hashlib
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "audio_cache")
EXTS = ("wav", "mp3", "m4a", "flac", "ogg")
SR = 24000


def videos(ep):
    """[(tag, Szenenliste, Titel)] für Hauptvideo und Shorts."""
    out = [("main", ep["scenes"], "Hauptvideo")]
    if ep.get("voice_shorts", ep.get("voice")) != "files":  # Shorts behalten ihre bisherige Stimme
        return out
    for i, sh in enumerate(ep.get("shorts", []), 1):
        out.append((f"short{i}", sh["scenes"], f"Short {i}: {sh['title']}"))
    return out


def clips(scenes, tag):
    """[(clip_id, text)] – Szenen mit Denkpause (' ... ') werden in Teile _1, _2 … zerlegt."""
    res = []
    for i, sc in enumerate(scenes):
        parts = [p.strip() for p in sc["say"].split(" ... ") if p.strip()]
        for k, p in enumerate(parts):
            res.append((f"{tag}_{i:02d}" + (f"_{k + 1}" if len(parts) > 1 else ""), p))
    return res


def find(d, name):
    for e in EXTS:
        p = os.path.join(d, f"{name}.{e}")
        if os.path.exists(p):
            return p
    return None


def _to_wav(src, dst, trim=True):
    af = ["loudnorm=I=-18:TP=-2"]
    if trim:  # Stille am Anfang und Ende entfernen
        af = ["silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05",
              "areverse", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1", "areverse"] + af
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-af", ",".join(af), dst],
                   check=True)


def _dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True)
    return float(out.stdout.strip())


def split_whole(whole, items, outdir, tag):
    """Zerlegt eine durchgehende Aufnahme anhand der erkannten Wörter in die einzelnen Abschnitte."""
    import difflib
    from tts import _whisper_words, norm
    os.makedirs(outdir, exist_ok=True)
    tmp = os.path.join("/tmp", f"rec_{tag}_whole.wav")
    _to_wav(whole, tmp, trim=False)
    heard = _whisper_words(tmp)
    if heard is None:
        raise RuntimeError("faster-whisper fehlt – Aufnahme kann nicht zerlegt werden")
    nh = [norm(h[2]) for h in heard]
    toks, owner = [], []
    for ci, (_cid, text) in enumerate(items):
        for t in text.split():
            if norm(t):
                toks.append(norm(t))
                owner.append(ci)
    sm = difflib.SequenceMatcher(a=toks, b=nh, autojunk=False)
    first, last = {}, {}
    for a, b, size in sm.get_matching_blocks():
        for k in range(size):
            ci = owner[a + k]
            first.setdefault(ci, b + k)
            last[ci] = b + k
    total = _dur(tmp)
    print(f"   {tag}: Abgleich ganze Aufnahme/Skript {sm.ratio():.0%}")
    for ci, (cid, _text) in enumerate(items):
        if ci not in first:
            raise RuntimeError(f"Abschnitt {cid} in {os.path.basename(whole)} nicht gefunden")
        st = max(0.0, heard[first[ci]][0] - 0.12)
        nxt = [first[c] for c in range(ci + 1, len(items)) if c in first]
        en = heard[last[ci]][1] + 0.25
        if nxt:
            en = min(en, heard[nxt[0]][0] - 0.05)
        en = min(en, total)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-ss", f"{st:.3f}", "-to", f"{en:.3f}",
                        os.path.join(outdir, f"{cid}.wav")], check=True)


def prepare(ep):
    """Stellt sicher, dass für jeden Abschnitt eine Datei da ist. Gibt die Liste fehlender Aufnahmen zurück."""
    d = os.path.join(ROOT, "voice_in", ep["slug"])
    missing = []
    for tag, scenes, _title in videos(ep):
        items = clips(scenes, tag)
        if all(find(d, cid) for cid, _ in items):
            continue
        whole = find(d, tag)
        if whole:
            os.makedirs("/tmp/rec_split", exist_ok=True)
            split_whole(whole, items, "/tmp/rec_split", tag)
            continue
        missing += [cid for cid, _ in items if not find(d, cid)]
    return missing


def clip_file(slug, cid):
    return find(os.path.join(ROOT, "voice_in", slug), cid) or find("/tmp/rec_split", cid)


def synth_clip(slug, cid, text):
    """Wie tts.synth, aber aus der Aufnahme: (wav, dauer, words)."""
    from tts import _align, _whisper_words
    src = clip_file(slug, cid)
    if not src and os.environ.get("REC_PLACEHOLDER"):  # Vorschau ohne Aufnahmen: stumme Platzhalter
        from tts import _synth_edge
        os.environ["OFFLINE"] = "1"
        return _synth_edge(text, "placeholder")
    if not src:
        raise RuntimeError(f"Aufnahme fehlt: voice_in/{slug}/{cid}.wav")
    h = hashlib.sha1(open(src, "rb").read() + text.encode()).hexdigest()[:16]
    os.makedirs(CACHE, exist_ok=True)
    meta = os.path.join(CACHE, f"rec_{h}.json")
    wav = os.path.join("/tmp", f"rec_{h}.wav")
    _to_wav(src, wav)
    total = _dur(wav)
    if os.path.exists(meta):
        return wav, total, json.load(open(meta))["words"]
    heard = _whisper_words(wav)
    words, ratio = _align(text, heard or [], total)
    if heard is not None:
        print(f"   {cid}: Abgleich Skript/Aufnahme {ratio:.0%}" + ("  <-- bitte anhören" if ratio < 0.85 else ""))
        json.dump({"text": text, "voice": "files", "clip": cid, "words": words, "match": round(ratio, 3)},
                  open(meta, "w"), ensure_ascii=False)
    return wav, total, words


def write_script(ep):
    """SPRECHTEXT.md: alles, was GIAHN in Voice Studio einsprechen lässt."""
    d = os.path.join(ROOT, "voice_in", ep["slug"])
    os.makedirs(d, exist_ok=True)
    L = [f"# Sprechtext: {ep['title']}", "",
         "Variante 1 (einfach): Pro Video den ganzen Block unten am Stück erzeugen und als "
         + ", ".join(f"`{tag}.wav`" for tag, _s, _t in videos(ep)) + " in diesen Ordner legen.", "",
         "Variante 2 (genau): Jeden Abschnitt einzeln erzeugen und unter dem angegebenen Namen speichern "
         "(z. B. `main_03.wav`).", "",
         "Formate: wav, mp3, m4a, flac oder ogg. Kurze Pausen zwischen den Absätzen sind gut, der Rest wird automatisch geschnitten.", ""]
    for tag, scenes, title in videos(ep):
        items = clips(scenes, tag)
        L += [f"## {title}  →  `{tag}.wav`", "", "```", "\n\n".join(t for _, t in items), "```", "",
              "<details><summary>Einzeln</summary>", ""]
        L += [f"- `{cid}.wav`: {t}" for cid, t in items]
        L += ["", "</details>", ""]
    p = os.path.join(d, "SPRECHTEXT.md")
    open(p, "w").write("\n".join(L))
    return p


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    e = json.load(open(sys.argv[1]))
    print("Sprechtext:", write_script(e))
    m = prepare(e)
    print("Fehlende Aufnahmen:", ", ".join(m) if m else "keine")
