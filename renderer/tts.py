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


def _azure_hd(text, voice, mp3):
    """Azure Speech HD-Stimme per REST (kostenloser F0-Tarif). Liefert keine Wortzeiten."""
    import urllib.request
    from xml.sax.saxutils import escape
    key, region = os.environ["AZURE_SPEECH_KEY"], os.environ.get("AZURE_SPEECH_REGION", "westeurope")
    lang = voice[:5]
    ssml = (f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{lang}'>"
            f"<voice name='{voice}'>{escape(text)}</voice></speak>")
    req = urllib.request.Request(
        f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1", data=ssml.encode("utf-8"),
        headers={"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml",
                 "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3", "User-Agent": "durchschaut-renderer"})
    with urllib.request.urlopen(req, timeout=120) as r, open(mp3, "wb") as f:
        f.write(r.read())


def _duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True)
    return float(out.stdout.strip())


def _speech_bounds(wav):
    """Start/Ende der eigentlichen Sprache (ohne Stille am Rand)."""
    import wave as _w
    import numpy as np
    with _w.open(wav) as w:
        sr = w.getframerate()
        x = np.abs(np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32))
    hop = int(sr * 0.01)
    env = np.array([x[i:i + hop].mean() for i in range(0, len(x), hop)]) if len(x) else np.zeros(1)
    thr = max(200.0, env.max() * 0.05)
    idx = np.where(env > thr)[0]
    if not len(idx):
        return 0.0, len(x) / sr
    return idx[0] * 0.01, (idx[-1] + 1) * 0.01


def synth(text, voice, rate="+0%"):
    """HD-Stimmen (Name enthält ':DragonHD') über Azure, sonst edge-tts.
    Wortzeiten für HD: aus edge-tts (gleiche Sprecherin, Standardmodell) auf die HD-Aufnahme gestreckt."""
    if ":DragonHD" in voice:
        if not os.environ.get("AZURE_SPEECH_KEY"):
            base = voice.split(":")[0] + "MultilingualNeural"
            print(f"   ! Kein AZURE_SPEECH_KEY – nutze {base} als Ersatz")
            return synth(text, base, rate)
        os.makedirs(CACHE, exist_ok=True)
        key = hashlib.sha1(f"{voice}|{text}".encode()).hexdigest()[:16]
        mp3 = os.path.join(CACHE, key + ".mp3")
        meta = os.path.join(CACHE, key + ".json")
        wav = os.path.join("/tmp", "ddd_" + key + ".wav")
        if not (os.path.exists(mp3) and os.path.exists(meta)):
            for attempt in range(4):
                try:
                    _azure_hd(text, voice, mp3)
                    break
                except Exception as e:
                    print("Azure-Fehler, neuer Versuch:", e)
                    import time
                    time.sleep(3 + attempt * 5)
            _wav_from_mp3(mp3, wav)
            # Referenz-Zeiten von der Standard-Stimme holen und strecken
            ref_wav, _, ref_words = synth(text, voice.split(":")[0] + "MultilingualNeural", "+0%")
            r0, r1 = _speech_bounds(ref_wav)
            h0, h1 = _speech_bounds(wav)
            k = (h1 - h0) / max(0.1, r1 - r0)
            words = [[round(h0 + (a - r0) * k, 3), round(h0 + (b - r0) * k, 3), w] for a, b, w in ref_words]
            json.dump({"text": text, "voice": voice, "words": words, "timing": "scaled"}, open(meta, "w"), ensure_ascii=False)
        else:
            words = json.load(open(meta))["words"]
            _wav_from_mp3(mp3, wav)
        return wav, _duration(wav), words
    return _synth_edge(text, voice, rate)


def _synth_edge(text, voice, rate="+0%"):
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
