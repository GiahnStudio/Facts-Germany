"""Sprachausgabe mit Microsoft-Neuralstimmen (edge-tts, kostenlos).
Ergebnisse werden in audio_cache/ gespeichert, damit nichts doppelt erzeugt wird.
Ohne Netz (OFFLINE=1) entsteht eine stumme Platzhalter-Spur mit geschätzten Zeiten.
"""
import asyncio
import hashlib
import json
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "audio_cache")
SR = 24000


def norm(w):
    return re.sub(r"[^0-9a-zäöüß]", "", w.lower())


async def _edge(text, voice, rate, mp3):
    import edge_tts
    try:
        com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    except TypeError:
        com = edge_tts.Communicate(text, voice, rate=rate)
    words = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                words.append([s, s + ch["duration"] / 1e7, ch["text"]])
    return words


def _wav_from_mp3(mp3, wav):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", str(SR), wav], check=True)


def _silence(wav, dur):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono",
                    "-t", f"{dur:.3f}", wav], check=True)


def synth(text, voice, rate="+0%"):
    """Gibt (wav_pfad, dauer_s, words) zurück. words = [[start, ende, wort], ...]"""
    os.makedirs(CACHE, exist_ok=True)
    key = hashlib.sha1(f"{voice}|{rate}|{text}".encode()).hexdigest()[:16]
    mp3 = os.path.join(CACHE, key + ".mp3")
    meta = os.path.join(CACHE, key + ".json")
    wav = os.path.join("/tmp", "ddd_" + key + ".wav")
    offline = os.environ.get("OFFLINE") == "1"
    if os.path.exists(meta) and os.path.exists(mp3):
        words = json.load(open(meta))["words"]
        _wav_from_mp3(mp3, wav)
    elif not offline:
        for attempt in range(4):
            try:
                words = asyncio.run(_edge(text, voice, rate, mp3))
                if os.path.getsize(mp3) > 1000:
                    break
            except Exception as e:  # Netzwerk-Wackler
                print("TTS-Fehler, neuer Versuch:", e)
        json.dump({"text": text, "voice": voice, "rate": rate, "words": words}, open(meta, "w"), ensure_ascii=False)
        _wav_from_mp3(mp3, wav)
    else:
        toks = text.split()
        dur = max(1.0, len(text) / 15.5)
        step = dur / max(1, len(toks))
        words = [[0.1 + i * step, 0.1 + (i + 0.8) * step, norm(t)] for i, t in enumerate(toks)]
        _silence(wav, dur + 0.2)
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav],
                         capture_output=True, text=True)
    return wav, float(out.stdout.strip()), words
