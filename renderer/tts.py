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


_WHISPER = None


def _whisper_words(wav):
    """Wortzeiten per faster-whisper (läuft auf GitHub; lokal ggf. nicht verfügbar)."""
    global _WHISPER
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None
    if _WHISPER is None:
        _WHISPER = WhisperModel(os.environ.get("WHISPER_MODEL", "small"), device="cpu", compute_type="int8")
    segs, _ = _WHISPER.transcribe(wav, language="de", word_timestamps=True, vad_filter=False)
    return [[w.start, w.end, w.word.strip()] for s in segs for w in (s.words or [])]


def _align(text, heard, total):
    """Ordnet die Skript-Wörter den erkannten Wörtern zu (difflib). Gibt (words, Übereinstimmung) zurück."""
    import difflib
    toks = text.split()
    nt = [norm(t) for t in toks]
    nh = [norm(h[2]) for h in heard]
    sm = difflib.SequenceMatcher(a=nt, b=nh, autojunk=False)
    times = [None] * len(toks)
    for a, b, size in sm.get_matching_blocks():
        for k in range(size):
            times[a + k] = (heard[b + k][0], heard[b + k][1])
    # Lücken linear auffüllen
    known = [i for i, t in enumerate(times) if t]
    if not known:
        step = total / max(1, len(toks))
        return [[i * step, (i + 0.8) * step, t] for i, t in enumerate(toks)], 0.0
    for i in range(len(toks)):
        if times[i]:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        t0 = times[prev][1] if prev is not None else 0.0
        t1 = times[nxt][0] if nxt is not None else total
        lo = prev if prev is not None else -1
        hi = nxt if nxt is not None else len(toks)
        frac = (i - lo) / (hi - lo)
        st = t0 + (t1 - t0) * frac
        times[i] = (st, st + 0.2)
    ratio = sm.ratio()
    return [[round(a, 3), round(b, 3), t] for (a, b), t in zip(times, toks)], ratio


def _google_chirp(text, voice, mp3):
    import base64, urllib.request
    body = json.dumps({"input": {"text": text}, "voice": {"languageCode": voice[:5], "name": voice},
                       "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 24000}}).encode()
    req = urllib.request.Request(f"https://texttospeech.googleapis.com/v1/text:synthesize?key={os.environ['GOOGLE_TTS_KEY']}",
                                 data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read())
    open(mp3, "wb").write(base64.b64decode(data["audioContent"]))


def synth(text, voice, rate="+0%"):
    """Google Chirp 3 HD (Name enthält 'Chirp3-HD'): Wortzeiten per Spracherkennung, die auch prüft,
    ob jedes Wort gesprochen wurde.
    HD-Stimmen (Name enthält ':DragonHD') über Azure, sonst edge-tts.
    Wortzeiten für HD: aus edge-tts (gleiche Sprecherin, Standardmodell) auf die HD-Aufnahme gestreckt."""
    if "Chirp3-HD" in voice:
        if not os.environ.get("GOOGLE_TTS_KEY"):
            fb = os.environ.get("FALLBACK_VOICE", "de-DE-FlorianMultilingualNeural")
            print(f"   ! Kein GOOGLE_TTS_KEY – nutze {fb} als Ersatz")
            return _synth_edge(text, fb, rate)
        os.makedirs(CACHE, exist_ok=True)
        key = hashlib.sha1(f"{voice}|{text}".encode()).hexdigest()[:16]
        mp3 = os.path.join(CACHE, key + ".mp3")
        meta = os.path.join(CACHE, key + ".json")
        wav = os.path.join("/tmp", "ddd_" + key + ".wav")
        if os.path.exists(mp3) and os.path.exists(meta):
            _wav_from_mp3(mp3, wav)
            return wav, _duration(wav), json.load(open(meta))["words"]
        best = None
        for attempt in range(3):
            for k in range(4):
                try:
                    _google_chirp(text, voice, mp3)
                    break
                except Exception as e:
                    print("Google-TTS-Fehler, neuer Versuch:", e)
                    import time
                    time.sleep(3 + k * 5)
            _wav_from_mp3(mp3, wav)
            total = _duration(wav)
            heard = _whisper_words(wav)
            if heard is None:
                words, ratio = _align(text, [], total)
                break
            words, ratio = _align(text, heard, total)
            print(f"   Abgleich Skript/Aufnahme: {ratio:.0%}")
            if best is None or ratio > best[1]:
                best = (open(mp3, "rb").read(), ratio, words)
            if ratio >= 0.85:
                break
        if best and best[1] > ratio:
            open(mp3, "wb").write(best[0])
            words, ratio = best[2], best[1]
            _wav_from_mp3(mp3, wav)
        json.dump({"text": text, "voice": voice, "words": words, "match": round(ratio, 3)}, open(meta, "w"), ensure_ascii=False)
        return wav, _duration(wav), words
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
