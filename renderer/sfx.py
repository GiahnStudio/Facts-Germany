"""Erzeugt Soundeffekte und einen dezenten Lo-Fi-Musikloop (alles synthetisch, lizenzfrei)."""
import os
import subprocess
import wave

import numpy as np

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "remotion", "public")
rng = np.random.default_rng(7)


def t(d):
    return np.linspace(0, d, int(SR * d), endpoint=False)


def env(x, a=0.005, r=None):
    n = len(x)
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    if r:
        e *= np.exp(-np.linspace(0, n / SR, n) / r)
    return x * e


def lowpass(x, k):
    k = max(1, int(k))
    return np.convolve(x, np.ones(k) / k, mode="same")


def save(name, x, vol=0.8, folder="sfx"):
    os.makedirs(os.path.join(OUT, folder), exist_ok=True)
    x = x / (np.max(np.abs(x)) + 1e-9) * vol
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, folder, name + ".wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def sweep(f0, f1, d):
    tt = t(d)
    f = np.linspace(f0, f1, len(tt))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def main():
    save("pop", env(sweep(900, 300, 0.09), 0.002, 0.03), 0.7)
    nz = rng.standard_normal(int(SR * 0.45))
    wh = lowpass(nz, 6) * np.sin(np.linspace(0, np.pi, len(nz))) ** 2
    save("whoosh", wh, 0.6)
    th = env(sweep(140, 45, 0.35), 0.002, 0.12) + 0.4 * env(lowpass(rng.standard_normal(int(SR * 0.35)), 3), 0.001, 0.03)
    save("thud", th, 0.95)
    tt = t(1.2)
    ding = sum(np.sin(2 * np.pi * f * tt) * a for f, a in ((1320, 1), (1980, .45), (2640, .2)))
    save("ding", env(ding, 0.002, 0.35), 0.6)
    save("tick", env(rng.standard_normal(int(SR * 0.03)), 0.0005, 0.004) + env(np.sin(2 * np.pi * 2500 * t(0.03)), 0.0005, 0.006), 0.5)
    nz = rng.standard_normal(int(SR * 0.25))
    save("swipe", lowpass(nz, 3) * np.linspace(1, 0, len(nz)) ** 2 * np.linspace(0, 1, len(nz)) ** 0.3, 0.5)
    tt = t(0.5)
    coin = env(np.sin(2 * np.pi * 1975 * tt) + 0.5 * np.sin(2 * np.pi * 2637 * tt), 0.001, 0.12)
    coin[int(0.07 * SR):] += env(np.sin(2 * np.pi * 2637 * t(0.5 - 0.07)), 0.001, 0.15)
    save("coin", coin, 0.55)
    cash = np.concatenate([env(np.sin(2 * np.pi * 1568 * t(0.12)), 0.001, 0.05), env(sum(np.sin(2 * np.pi * f * t(0.8)) for f in (2093, 2637, 3136)), 0.001, 0.25)])
    save("cash", cash, 0.55)
    tt = t(1.4)
    scan = np.sin(2 * np.pi * (1200 + 300 * np.sin(2 * np.pi * 3 * tt)) * tt) * (0.5 + 0.5 * (np.sin(2 * np.pi * 14 * tt) > 0))
    save("scan", env(scan, 0.01) * np.linspace(1, 0.3, len(tt)), 0.25)
    tt = t(0.7)
    blips = np.zeros(len(tt))
    for k in range(7):
        s = int(k * 0.09 * SR)
        b = env(np.sin(2 * np.pi * (900 + 180 * (k % 3)) * t(0.05)), 0.001, 0.015)
        blips[s:s + len(b)] += b
    save("data", blips, 0.35)
    nz = rng.standard_normal(int(SR * 0.45))
    crunch = env(nz * (rng.random(len(nz)) > 0.6), 0.001, 0.12) + env(sweep(220, 60, 0.45), 0.001, 0.1)
    save("crunch", crunch, 0.9)
    nz = rng.standard_normal(int(SR * 0.8))
    roll = lowpass(nz, 40) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * t(0.8))) * np.sin(np.linspace(0, np.pi, len(nz)))
    save("roll", roll, 0.6)
    music()


def music():
    """Lo-Fi-Loop, 85 BPM, 8 Takte: weiche Akkorde, Bass, Kick, Snare, Hi-Hat, Knistern."""
    bpm = 85
    beat = 60 / bpm
    bars = 8
    n = int(SR * beat * 4 * bars)
    out = np.zeros(n)
    chords = [[57, 60, 64, 67], [55, 59, 62, 65], [53, 57, 60, 64], [52, 55, 59, 62]]  # Am7, G7sus-ish, Fmaj7, Em7
    def midi(m):
        return 440 * 2 ** ((m - 69) / 12)
    for bar in range(bars):
        ch = chords[bar % 4]
        s0 = int(bar * 4 * beat * SR)
        d = 4 * beat
        tt = t(d)
        pad = np.zeros(len(tt))
        for m in ch:
            f = midi(m)
            pad += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * (1 + 0.15 * np.sin(2 * np.pi * 4.5 * tt))
        pad *= np.minimum(1, tt / 0.08) * np.exp(-tt / 3.5)
        out[s0:s0 + len(tt)] += pad * 0.12
        # Bass
        for b in (0, 2.5):
            bs = s0 + int(b * beat * SR)
            bt = t(beat * 1.2)
            bass = np.sin(2 * np.pi * midi(ch[0] - 24) * bt) * np.exp(-bt / 0.6)
            out[bs:bs + len(bt)] += bass[: max(0, min(len(bt), n - bs))] * 0.35
        # Drums
        for k in range(8):
            ps = s0 + int(k * beat / 2 * SR)
            if k in (0, 5):
                kt = t(0.3)
                kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-kt / 0.03)) * kt) * np.exp(-kt / 0.12)
                out[ps:ps + len(kt)] += kick[: max(0, n - ps)] * 0.6
            if k in (2, 6):
                st = t(0.25)
                sn = lowpass(rng.standard_normal(len(st)), 4) * np.exp(-st / 0.07)
                out[ps:ps + len(st)] += sn[: max(0, n - ps)] * 0.22
            ht = t(0.05)
            hh = rng.standard_normal(len(ht)) * np.exp(-ht / 0.012)
            hh = hh - lowpass(hh, 8)
            out[ps:ps + len(ht)] += hh[: max(0, n - ps)] * (0.12 if k % 2 else 0.07)
    out += lowpass(rng.standard_normal(n) * (rng.random(n) > 0.9995) * 3, 2) * 0.05
    out = lowpass(out, 3)
    save("lofi", out, 0.8, "music")
    src = os.path.join(OUT, "music", "lofi.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-b:a", "128k", src[:-4] + ".mp3"], check=True)
    os.remove(src)


if __name__ == "__main__":
    main()
