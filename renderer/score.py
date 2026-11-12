"""Eigene Filmmusik je Folge, passend zur Zeitleiste (wie bei Tales in Ink, aber komplett synthetisch).

Statt eines Loops wird für jede Folge eine Musik komponiert, die den Szenen folgt:
- hell (Intro, Fakten, Listen, Outro): Marimba-Arpeggien, E-Piano, leichter Beat
- Spannung (Quiz, Stimmt oder Mythos?): Moll, Tick-Tack, kein Beat
- Groove (Ablauf, Spezialszenen, Geschichte): voller Beat mit Bass
- groß (große Zahlen): Riser + Schlag
Akzente: Erkennungsmotiv am Anfang/Ende, Glockenspiel bei der Quiz-Auflösung,
Dur-Lauf bei "Stimmt", absteigendes "Wah-wah" bei "Mythos".
Während Lupo spricht, wird die Musik leiser (Ducking), in Denkpausen kommt sie nach vorn.

Aufruf (macht build.py automatisch, wenn die Folge "music": "score" hat):
    python renderer/score.py remotion/public/ep/<slug>/main_props.json out.mp3
Alles selbst erzeugt (numpy/scipy), keine Samples, keine Lizenzfragen.
"""
import json
import subprocess
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 100
BEAT = 60 / BPM
rng = np.random.default_rng(11)

# --- Tonmaterial (F-Dur / d-Moll) ---------------------------------------
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7,
        "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def hz(n):
    """'A4' -> 440.0"""
    name, octv = n[:-1], int(n[-1])
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octv + 1) - 69) / 12)


# Akkorde: (Bass, [Akkordtöne])
CH = {
    "F": ("F2", ["F4", "A4", "C5"]), "C/E": ("E2", ["E4", "G4", "C5"]), "C": ("C3", ["E4", "G4", "C5"]),
    "Dm": ("D2", ["D4", "F4", "A4"]), "Bb": ("Bb1", ["D4", "F4", "Bb4"]), "Am": ("A1", ["C4", "E4", "A4"]),
    "Gm": ("G1", ["D4", "G4", "Bb4"]), "A": ("A1", ["C#4", "E4", "A4"]), "Gm7": ("G1", ["F4", "Bb4", "D5"]),
    "C7": ("C2", ["E4", "Bb4", "C5"]),
}
MOOD = {
    "bright": ["F", "C/E", "Dm", "Bb"],
    "tense": ["Dm", "Bb", "Gm", "A"],
    "groove": ["F", "Am", "Bb", "C"],
    "big": ["Bb", "C", "Dm", "F"],
    "calm": ["F", "Bb", "Gm7", "C7"],
}
TYPE_MOOD = {"title": "bright", "chips": "bright", "fact": "calm", "list": "bright", "outro": "bright",
             "quiz": "tense", "case": "tense", "bignum": "big", "flow": "groove", "story": "groove",
             "split": "calm", "money": "groove", "machine": "groove"}


def mood_of(s):
    return TYPE_MOOD.get(s.get("type"), "groove")  # Spezialszenen (ampel, aufzug, mikrowelle …) = Groove


# --- Instrumente ---------------------------------------------------------
def tt(d):
    return np.arange(int(SR * d)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def marimba(f, vel=0.7, d=1.2):
    t = tt(d)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2)
         + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 14)
         + 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40))
    n = int(0.004 * SR)
    x[:n] *= np.linspace(0, 1, n)
    x[:int(0.01 * SR)] += bp(rng.standard_normal(int(0.01 * SR)), 1500, 5000) * 0.05
    return x * vel


def epiano(f, vel=0.5, d=1.6):
    t = tt(d)
    idx = 1.6 * np.exp(-t * 5)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * np.exp(-t * 1.8)
    x *= 1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)
    n = int(0.003 * SR)
    x[:n] *= np.linspace(0, 1, n)
    return x * vel


def glock(f, vel=0.5, d=2.0):
    t = tt(d)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
         + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12))
    return x * vel


def bass(f, vel=0.8, d=0.5):
    t = tt(d)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.006) * np.exp(-t * 2.5)
    rel = int(0.04 * SR)
    env[-rel:] *= np.linspace(1, 0, rel)
    return lp(x * env, 900) * vel


def pad(freqs, d, vel=0.25):
    t = tt(d)
    x = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ph = rng.uniform(0, 1)
            x += 2 * ((f * (1 + det / 100) * t + ph) % 1) - 1
    x = lp(x / (3 * len(freqs)), 1400, 2)
    a = min(0.5, d / 3)
    env = np.minimum(1, t / a) * np.minimum(1, (d - t) / a)
    return x * env * vel


def kick(vel=0.9):
    t = tt(0.35)
    f = 48 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * vel


def snare(vel=0.5):
    t = tt(0.22)
    x = bp(rng.standard_normal(len(t)), 900, 6000) * np.exp(-t * 18) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return x * vel


def hat(vel=0.25, d=0.05):
    t = tt(d)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 70) * vel


def tick(high=True, vel=0.35):
    t = tt(0.06)
    f = 1900 if high else 1350
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t * 90) * vel


def riser(d, vel=0.35):
    t = tt(d)
    x = rng.standard_normal(len(t))
    out = np.zeros_like(x)
    seg = int(0.05 * SR)
    for i in range(0, len(x), seg):  # Filter wandert nach oben
        fc = 400 + 7000 * (i / len(x)) ** 2
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 18000))
    return out * (t / d) ** 2 * vel


def boom(vel=0.8):
    t = tt(1.6)
    f = 40 + 50 * np.exp(-t * 6)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    x += lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 10) * 0.3
    return x * vel


def wahwah(vel=0.5):
    """Absteigendes Posaunen-'Wah-wah' für Mythos."""
    out = []
    for k, n in enumerate(["A3", "G#3", "G3", "F#3"]):
        d = 0.32 if k < 3 else 0.9
        t = tt(d)
        f = hz(n) * (1 - (0.03 * t / d if k == 3 else 0))
        x = 2 * ((np.cumsum(np.full(len(t), f)) / SR) % 1) - 1
        cut = 500 + 1600 * np.sin(np.pi * np.minimum(1, t / (d * 0.8))) ** 2
        y = np.zeros_like(x)
        seg = int(0.02 * SR)
        for i in range(0, len(x), seg):
            y[i:i + seg] = lp(x[i:i + seg], float(cut[i]))
        env = np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.06)
        out.append(y * env)
    return np.concatenate(out) * vel


# --- Mischen -------------------------------------------------------------
def add(buf, x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i < 0:
        return
    x = x[:len(buf) - i] * g
    buf[i:i + len(x), 0] += x * np.sqrt(0.5 * (1 - pan))
    buf[i:i + len(x), 1] += x * np.sqrt(0.5 * (1 + pan))


def motif(buf, t, end=False):
    """Erkennungsmotiv 'Durch-schaut!' (C – F – A, am Ende bis C)."""
    notes = ["C5", "F5", "A5"] + (["C6"] if end else [])
    for k, n in enumerate(notes):
        add(buf, marimba(hz(n), 0.8, 1.6), t + k * BEAT / 2, 0.9, -0.2 + 0.2 * k)
        add(buf, glock(hz(n) * 2, 0.25), t + k * BEAT / 2, 0.6, 0.3)


def voice_activity(scenes, fps, total):
    """1 = Lupo spricht, 0 = Pause. Aus den Wortzeiten jeder Szene."""
    act = np.zeros(int(total * 100) + 1)
    for s in scenes:
        t0 = s["start"] / fps
        for a, b, _w in s.get("words", []):
            act[int((t0 + a) * 100):int((t0 + b + 0.15) * 100) + 1] = 1
    # glätten (ca. 200 ms)
    k = np.ones(20) / 20
    return np.clip(np.convolve(act, k, mode="same"), 0, 1)


def compose(props):
    fps, scenes = props["fps"], props["scenes"]
    total = props["totalFrames"] / fps
    buf = np.zeros((int((total + 2) * SR), 2))
    nbeats = int(total / BEAT) + 1
    # Szene je Schlag bestimmen (Wechsel immer auf dem nächsten Schlag)
    starts = [s["start"] / fps for s in scenes]

    def scene_at(t):
        i = max(0, np.searchsorted(starts, t, side="right") - 1)
        return i, scenes[i]

    last_idx = -1
    for b in range(nbeats):
        t = b * BEAT
        idx, s = scene_at(t)
        m = mood_of(s)
        if idx != last_idx:
            last_idx = idx
            if idx > 0 and m != "tense":
                add(buf, hat(0.4, 0.4), t, 0.5, 0.4)  # kleiner Becken-Akzent beim Szenenwechsel
        beat_in_bar = b % 4
        bar = b // 4
        chord = CH[MOOD[m][bar % 4]]
        is_outro = s.get("type") == "outro"
        last = idx == len(scenes) - 1 and t > total - 4 * BEAT
        if last:
            continue
        # Pad auf jedem Takt
        if beat_in_bar == 0:
            pv = {"tense": 0.22, "big": 0.28, "calm": 0.24}.get(m, 0.18)
            add(buf, pad([hz(n) / 2 for n in chord[1]], 4 * BEAT + 0.3, pv), t, 1.0)
        # Bass
        if m in ("groove", "bright", "big") and beat_in_bar in (0, 2):
            add(buf, bass(hz(chord[0]), 0.8, BEAT * 1.6), t, 0.9)
        if m == "groove" and beat_in_bar == 3:
            add(buf, bass(hz(chord[0]) * 2, 0.5, BEAT * 0.5), t + BEAT / 2, 0.7)
        if m == "calm" and beat_in_bar == 0:
            add(buf, bass(hz(chord[0]), 0.7, BEAT * 3.5), t, 0.8)
        # Beat
        if m in ("groove", "bright", "big"):
            if beat_in_bar in (0, 2):
                add(buf, kick(0.8 if m != "bright" else 0.6), t, 0.8)
            if beat_in_bar in (1, 3):
                add(buf, snare(0.45 if m == "groove" else 0.3), t, 0.6, 0.1)
            for h in (0, 0.5):
                add(buf, hat(0.22 if h else 0.3), t + h * BEAT, 0.6, 0.35)
        if m == "calm":
            add(buf, hat(0.15), t + BEAT / 2, 0.5, 0.35)
        if m == "tense":
            add(buf, tick(beat_in_bar % 2 == 0, 0.4), t, 0.8, -0.3 if beat_in_bar % 2 else 0.3)
        # Marimba-Arpeggio (Achtel), Muster je Stimmung
        tones = chord[1]
        pat = {"bright": [0, 1, 2, 1, 0, 2, 1, 2], "groove": [0, 2, 1, 2, 0, 2, 1, 0],
               "big": [0, 1, 2, 3, 2, 1, 2, 3], "calm": [0, None, 2, None, 1, None, 2, None],
               "tense": [0, None, None, 1, None, None, 2, None]}[m]
        for h in range(2):
            p = pat[(beat_in_bar * 2 + h) % 8]
            if p is None:
                continue
            f = hz(tones[p % 3]) * (2 if p == 3 else 1)
            inst = epiano if m in ("calm", "tense") else marimba
            add(buf, inst(f, 0.45 if h else 0.55), t + h * BEAT / 2, 0.55, -0.35 + 0.35 * (p % 3))
        if is_outro and beat_in_bar == 0:
            add(buf, glock(hz(tones[0]) * 2, 0.25), t, 0.5, 0.4)

    # --- Akzente an Cue-Zeiten ---
    motif(buf, 0.15)
    for s in scenes:
        t0 = s["start"] / fps
        d = s["dur"] / fps
        if s.get("type") == "bignum":
            add(buf, riser(min(3.0, d * 0.4), 0.3), t0, 0.7)
            for it in s.get("items", []):
                if isinstance(it.get("at"), (int, float)):
                    add(buf, boom(0.6), t0 + it["at"], 0.6)
                    add(buf, glock(hz("C6"), 0.3), t0 + it["at"], 0.5, 0.3)
        if isinstance(s.get("reveal_at"), (int, float)):
            for k, n in enumerate(["F5", "A5", "C6", "F6"]):
                add(buf, glock(hz(n), 0.5), t0 + s["reveal_at"] + k * 0.09, 0.7, 0.2)
        if isinstance(s.get("verdict_at"), (int, float)):
            tv = t0 + s["verdict_at"]
            if str(s.get("verdict", "")).upper().startswith("STIMMT"):
                for k, n in enumerate(["C5", "E5", "G5", "C6"]):
                    add(buf, marimba(hz(n), 0.8), tv + k * 0.08, 0.8, -0.2 + 0.15 * k)
                add(buf, glock(hz("C6") * 2, 0.35), tv + 0.32, 0.6)
            else:
                add(buf, wahwah(0.45), tv, 0.6)
        if isinstance(s.get("stamp_at"), (int, float)):
            add(buf, boom(0.5), t0 + s["stamp_at"], 0.5)
    motif(buf, max(0, total - 4 * BEAT), end=True)
    add(buf, pad([hz("F3"), hz("A3"), hz("C4")], 4 * BEAT + 1.5, 0.25), max(0, total - 4 * BEAT) + 1.5 * BEAT, 1.0)

    # --- Ducking unter der Stimme ---
    act = voice_activity(scenes, fps, total + 2)
    g = 1.0 - 0.5 * np.interp(np.arange(len(buf)) / SR, np.arange(len(act)) / 100, act)
    buf *= g[:, None]
    # Ausblenden am Ende
    fade = int(1.5 * SR)
    e = int(total * SR)
    buf[e - fade:e] *= np.linspace(1, 0, fade)[:, None]
    buf[e:] = 0
    buf = buf[:e]
    # Pegel: gleiche Lautheit (RMS) wie bisher der Lo-Fi-Loop
    rms = np.sqrt(np.mean(buf ** 2)) + 1e-9
    buf *= 10 ** (-17 / 20) / rms
    return 0.95 * np.tanh(buf / 0.95)  # weicher Limiter statt Pegel absenken


def write(buf, path):
    wav = path.rsplit(".", 1)[0] + ".wav"
    data = (np.clip(buf, -1, 1) * 32767).astype(np.int16)
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    if path.endswith(".mp3"):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "192k", path], check=True)
        import os
        os.remove(wav)
    return path


if __name__ == "__main__":
    props = json.load(open(sys.argv[1]))
    print("Musik:", write(compose(props), sys.argv[2]))
