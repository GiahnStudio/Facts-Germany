import sys, os, json
ROOT = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, ROOT)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 44.1
N = int(DUR * SR)
rng = np.random.default_rng(1703)
S.seed(17)
def bpf(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lpf(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hpf(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def st(): return np.zeros((N, 2), np.float32)
stems = {k: st() for k in ['shamisen', 'shakuhachi', 'taiko', 'hyoshigi', 'other']}
EVENTS = []  # (t, stem, note)
def mark(t, k, d): EVENTS.append((round(t, 3), k, d))

# ——————————————— hyoshigi (two hardwood sticks struck together) ———————————————
def hyoshigi(v=1.0):
    L = int(.5 * SR); t = np.arange(L) / SR
    y = np.zeros(L)
    for f, a, tau in [(1180, 1., .05), (2460, .7, .035), (3870, .45, .022), (5300, .25, .012), (760, .35, .07)]:
        y += a * np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / tau)
    cl = rng.standard_normal(L) * np.exp(-t / .0018); y += 1.6 * bpf(cl, 1500, 9000)
    y /= np.abs(y).max()
    s1 = S.hit('world_perc', 'claves', .9); s2 = S.hit('woodblock', 'a', .9)
    out = np.zeros(L); out[:min(L, len(s1))] += s1[:L] / (np.abs(s1).max() + 1e-9) * .8; out[:min(L, len(s2))] += s2[:L] / (np.abs(s2).max() + 1e-9) * .45
    out += y * .9
    # the two pieces hit almost together: a second transient 3 ms later
    d = int(.003 * SR); out[d:] += .35 * out[:-d]
    return (out / np.abs(out).max() * .85 * v).astype(np.float32)

# ——————————————— taiko ———————————————
def odaiko(v=1.0, big=False):
    L = int(2.4 * SR); t = np.arange(L) / SR
    f = 58 + 62 * np.exp(-t / .045)                       # pitch drops after the head is struck
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / (.55 if big else .42)) + .35 * np.sin(1.59 * ph + 1) * np.exp(-t / .22) + .18 * np.sin(2.14 * ph) * np.exp(-t / .12)
    don = bpf(rng.standard_normal(L), 90, 900) * np.exp(-t / .02) * .8   # the "don" of the struck head
    stick = bpf(rng.standard_normal(L), 1200, 5000) * np.exp(-t / .004) * .25  # stick
    syn = body + don + stick
    syn /= np.abs(syn).max()
    out = syn * .85
    for inst, var, g in [('gran_cassa', 'hit', .55), ('toms', 'low_mallet', .35), ('frame_drum', 'large', .3)]:
        s = S.hit(inst, var, min(1, .55 + .45 * v)); s = s[:L] / (np.abs(s).max() + 1e-9)
        out[:len(s)] += s * g
    out = lpf(out, 3500)
    return (out / np.abs(out).max() * v).astype(np.float32)
def cut(x, d):
    n = int(d * SR)
    if n >= len(x): return x
    x = x[:n].copy(); k = min(n, int(.08 * SR)); x[-k:] *= np.linspace(1, 0, k); return x
def shime(v=.6):
    L = int(.6 * SR); t = np.arange(L) / SR
    f = 390 + 140 * np.exp(-t / .01); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / .07) + .5 * bpf(rng.standard_normal(L), 800, 4000) * np.exp(-t / .006)
    s = S.hit('frame_drum', 'small_muted', .7); s = s[:L] / (np.abs(s).max() + 1e-9)
    y = y / np.abs(y).max() * .7; y[:len(s)] += s * .5
    return (y / np.abs(y).max() * v).astype(np.float32)

# ——————————————— shamisen ———————————————
def sam(p, v=.7, dur=None, **kw):
    kw.setdefault('buzz', .7)
    return P.pluck('shamisen', p, dur, v, **kw)

# ——————————————— shakuhachi (recorder+flute samples → vibrato removed, slides, breath noise) ———————————————
def _f0track(y, f):
    hop, Nw = 480, 2048; out = []
    for s in range(0, max(1, len(y) - Nw), hop):
        fr = y[s:s + Nw] * np.hanning(Nw); sp = np.abs(np.fft.rfft(fr, 8 * Nw)); fq = np.fft.rfftfreq(8 * Nw, 1 / SR)
        m = (fq > f * .85) & (fq < f * 1.18); out.append(fq[m][np.argmax(sp[m])] if sp[m].max() > 1e-6 else f)
    return np.array(out), hop
def shaku(p, dur, v=.7, slide=-1.5, fall=0.0, kari=0.0, swell=.5, breath=1.0, rel=.35):
    """p: actual pitch; slide: attack slides in from this many semitones below (0 = no slide); fall: meri drop in semitones at the phrase end (negative); kari: upward lift at the phrase end (positive)
    swell: amount of crescendo in the middle of the note; breath: proportion of breath noise"""
    m = S.midi(p); f = 440 * 2 ** ((m - 69) / 12)
    ext = dur + rel + .8
    a = S.note('recorder', max(m, S.midi('F4') - 3), ext, .7, release=.2)
    b = S.note('flute', max(m, S.midi('C4')), ext, .6, release=.2)
    n = min(len(a), len(b)); y = .62 * a[:n] / (np.abs(a).max() + 1e-9) + .38 * b[:n] / (np.abs(b).max() + 1e-9)
    y = y.astype(np.float64)
    # 1) remove amplitude tremolo: divide by the smoothed envelope
    w = int(.06 * SR); e = np.sqrt(np.convolve(y ** 2, np.ones(w) / w, 'same')) + 1e-4
    e = np.convolve(e, np.ones(w) / w, 'same'); y = y / e
    y[:int(.03 * SR)] *= np.linspace(0, 1, int(.03 * SR))
    # 2) remove pitch vibrato + apply slides: variable-rate resampling
    tr, hop = _f0track(y, f); dev = 12 * np.log2(tr / np.median(tr[3:]))  # semitones
    dev = np.clip(dev, -.6, .6)
    tt = np.arange(n) / SR; devs = np.interp(tt, np.arange(len(dev)) * hop / SR + 1024 / SR, dev)
    L = int((dur + rel) * SR); to = np.arange(L) / SR
    bend = np.zeros(L)
    if slide: sl = .16; bend += np.where(to < sl, slide * (1 - np.sin(np.clip(to / sl, 0, 1) * np.pi / 2)), 0)
    if fall: k = np.clip((to - (dur - .45)) / .5, 0, 1); bend += fall * k * k
    if kari: k = np.clip((to - (dur - .3)) / .3, 0, 1); bend += kari * np.sin(k * np.pi / 2)
    dv = np.interp(to + .05, tt, devs)
    phase = .05 * SR + np.concatenate([[0], np.cumsum(2 ** ((bend[:-1] - dv[:-1]) / 12))])
    phase = np.minimum(phase, n - 2)
    z = np.interp(phase, np.arange(n), y)
    # 3) our own envelope: breath first, tone after; swells in the middle then falls back (shakuhachi-style breathing)
    at = .12; envl = np.clip(to / at, 0, 1) ** 1.6
    mid = 1 + swell * np.sin(np.clip(to / max(dur, .1), 0, 1) * np.pi) ** 1.5 * .8
    relk = np.clip((to - dur) / rel, 0, 1); envl = envl * mid * (1 - relk) ** 2
    z = z * envl
    # a bit darker, a bit hollower
    z = lpf(z, 3200) * .8 + bpf(z, 900, 1600) * .5
    # 4) breath noise: 1–4 kHz band-passed noise, stronger at the attack (muraiki, the forced breathy attack)
    nz = bpf(rng.standard_normal(L), 1000, 4000, 3)
    be = .22 * envl + .9 * np.exp(-np.clip(to, 0, None) / .07) * np.clip(to / .012, 0, 1)
    z = z / (np.abs(z).max() + 1e-9) + breath * .5 * nz / (np.abs(nz).max() + 1e-9) * be
    z[-min(len(z), 480):] *= np.linspace(1, 0, min(len(z), 480))
    return (z / (np.abs(z).max() + 1e-9) * v).astype(np.float32)

def put(k, x, t, g=1.0, pan=0.0, note=None):
    add(stems[k], x, t, g, pan)
    if note: mark(t, k, note)


# =============== The Two Monks — cues (E miyako-bushi: E F A B C) ===============
PR = [[10.6, 10.85, 11.1, 11.35], [19.5, 19.7, 19.9, 20.1], [27.3, 27.5, 27.7, 27.9]]
for i, lst in enumerate(PR):
    for k, t in enumerate(lst): put('hyoshigi', hyoshigi(.6 + .06 * k), t, .8, (-.2, .15, -.1, .2)[k], f'print {i+1}' if k == 0 else None)
for t in [10.3, 19.2, 27.1]: put('hyoshigi', hyoshigi(.7), t, .7, .1)
# hook: a sharp shamisen question over the rain
put('shamisen', P.strum('shamisen', ['E3', 'B3', 'E4'], None, .8, spread=.02, buzz=.8, t60=1.8), 0.0, .9, -.1, 'hook')
put('shamisen', sam('B4', .6, buzz=.5), 1.1, .8, .2); put('shamisen', sam('C5', .55, buzz=.5, t60=1.6), 1.4, .8, .2)
for i in range(6): put('taiko', shime(.3 + (.15 if i % 3 == 0 else 0)), .05 + i * .5, .45, (-.1, .1)[i % 2])
# the river and the vow: a low, breathing shakuhachi
put('shakuhachi', shaku('E4', 2.6, .45, slide=-1, swell=.5), 3.7, .8, .1, 'river')
put('shakuhachi', shaku('A4', 2.0, .45, slide=-2, fall=-1.0, swell=.4), 7.6, .8, .1, 'vow')
# the crossing: slow odaiko on each wading step, a rising shamisen line
t = 12.4
while t < 15.4: put('taiko', cut(odaiko(.45), .6), t, .6, 0, 'wade' if t == 12.4 else None); t += .84
for k, n in enumerate(['E4', 'F4', 'A4', 'B4', 'C5', 'B4']): put('shamisen', sam(n, .45, buzz=.3), 12.6 + k * .5, .55, (-.2, .2)[k % 2])
# she bows and is gone: one bright phrase
put('shakuhachi', shaku('B4', 1.8, .5, slide=-2, swell=.6), 16.4, .8, .1, 'bow')
# the long road: a walking ostinato that sinks lower and slower — the anger getting heavier
seq = ['E4', 'A4', 'B4', 'A4']; b = 20.2; i = 0; bt = .5
while b < 27.0:
    oct_down = b > 23.8
    n = seq[i % 4]
    if oct_down: n = n[:-1] + str(int(n[-1]) - 1)
    put('shamisen', sam(n, .42 + (.1 if oct_down else 0), buzz=.3 + (.3 if oct_down else 0)), b, .55, (-.2, .2)[i % 2], 'road' if i == 0 else ('heavier' if oct_down and seq[i % 4] == 'E4' and b < 24.4 else None))
    i += 1; b += bt * (1.06 if oct_down else 1.0)
t = 24.3; g = .9
while t < 27.0: put('taiko', cut(odaiko(.35 + .25 * (t - 24.3) / 2.7), .5), t, .6, 0); t += g; g = max(.4, g * .85)
# the outburst
put('taiko', odaiko(1.0, big=True), 29.35, 1.0, 0, 'burst'); put('shamisen', P.strum('shamisen', ['E3', 'F4', 'B4'], .3, .8, spread=.01, buzz=1.0), 29.35, .8, 0)
put('taiko', cut(odaiko(.6), .5), 30.2, .6, 0); put('taiko', cut(odaiko(.7), .5), 30.75, .6, 0)
# ma 31.7–32.5 — then the old monk, gently
put('shakuhachi', shaku('A4', 3.0, .45, slide=-1, swell=.5, breath=1.1, rel=.6), 32.6, .8, .1, 'smile')
put('shamisen', sam('E5', .5, buzz=.2, t60=2.4), 34.6, .6, .2)
# "Why are you still carrying her?" — one question, and the burden washes away
put('shamisen', sam('B4', .55, buzz=.5), 36.5, .8, .2, 'question'); put('shamisen', sam('C5', .5, buzz=.5, t60=2.0), 36.85, .8, .2)
put('shakuhachi', shaku('E5', 2.8, .5, slide=-2, swell=.7, breath=1.2, rel=.7), 37.6, .7, .1, 'release')
gaps = [.5, .4, .32, .25, .2, .16, .13]; t = 39.6
for k, g in enumerate(gaps):
    if t + g > 41.56: break
    put('hyoshigi', hyoshigi(.5 + k * .05), t, .7, (-.15, .15)[k % 2], 'curtain call' if k == 0 else None); t += g
put('taiko', odaiko(.9, big=True), 41.6, 1.0, 0, 'moral seal'); put('hyoshigi', hyoshigi(.95), 41.6, .8, 0)
put('shamisen', P.strum('shamisen', ['E3', 'B3', 'E4'], None, .8, spread=.02, buzz=.85, t60=1.6), 41.6, .9, 0)

wet = {'shamisen': (.45, .2), 'shakuhachi': (.6, .3), 'taiko': (.65, .22), 'hyoshigi': (.35, .12), 'other': (.5, .2)}
for k, (sz, mx) in wet.items():
    if np.abs(stems[k]).max() > 0: stems[k] = S.room(stems[k], size=sz, mix=mx).astype(np.float32)
GAIN = {'shamisen': 1.0, 'shakuhachi': .8, 'taiko': .95, 'hyoshigi': .85, 'other': 1.0}
MA0, MA1 = 31.7, 32.5
a0, a1 = int(MA0 * SR), int(MA1 * SR); fade = int(.25 * SR); tail = N - int(.5 * SR)
for k in stems:
    x = stems[k] * GAIN[k]
    x[a0:a0 + fade] *= np.linspace(1, 0, fade)[:, None]; x[a0 + fade:a1] = 0
    x[tail:] *= np.linspace(1, 0, N - tail)[:, None]
    stems[k] = x.astype(np.float32)
mix = sum(stems.values()); sc = .89 / np.abs(mix).max(); mix *= sc
for k in stems: stems[k] *= sc
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
for k, x in stems.items(): sf.write(os.path.join(HERE, 'stems', k + '.wav'), x, SR, subtype='FLOAT')
json.dump(EVENTS, open(os.path.join(HERE, 'score.json'), 'w'), indent=0)
print('score ok', len(EVENTS), 'marked cues')
