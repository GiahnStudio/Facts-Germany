"""Mix: material foley (washi / wood / water / glass, all synthesised) + narration + original score (ducked under dialogue) + per-picture ambience → mix.wav
Usage: .venv/bin/python styles/ukiyoe/demo/mix.py (run core/render/events.mjs, tts and music/score.py first)"""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')), 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, compress, limit, add
from scipy.signal import resample_poly
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
rng = np.random.default_rng(17)
def nz(d): return rng.standard_normal(int(round(d * SR)))
def brown(d):
    w = np.cumsum(nz(d)); w -= np.linspace(w[0], w[-1], len(w)); return norm(hp(w, 20))
def fade(x, a=.005, r=.02):
    n = len(x); x = x.copy(); A, R = min(n, int(a * SR)), min(n, int(r * SR))
    if A: x[:A] *= np.linspace(0, 1, A)
    if R: x[n - R:] *= np.linspace(1, 0, R)
    return x
def sines(fs, d, taus, amps):
    tt = t_(d); return sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau) for f, tau, a in zip(fs, taus, amps))
def slow(d, rate, depth, seed=0):   # slowly undulating envelope
    k = max(2, int(d * rate) + 3); r = np.random.default_rng(seed).random(k)
    return 1 - depth + depth * np.interp(np.linspace(0, k - 1, int(round(d * SR))), np.arange(k), r)

# —— Paper ——
def baren(d=.36, v=1):   # baren (馬連, hand rubbing pad) circling on the back of the paper: band-passed noise + roughly 9 Hz circular modulation
    tt = t_(d); m = .55 + .45 * np.abs(np.sin(2 * np.pi * 4.6 * tt)); e = np.sin(np.pi * tt / d) ** .7
    return norm(bp(nz(d), 700, 5200) * m * e + lp(nz(d), 500) * e * .3) * v
def slip(v=1):   # paper slip dropping / peeling off
    d = .28; tt = t_(d); return norm(hp(nz(d), 1800) * np.sin(np.pi * tt / d) ** 2 * (1 - tt / d * .5)) * v
def seal(v=1):   # vermilion seal pressed on paper: dull thud + fine tack of the seal paste pulling away
    d = .35; x = sines([88, 180], d, [.07, .03], [1, .4]); x[:int(.012 * SR)] += bp(nz(.012), 200, 1500) * .9
    y = np.zeros(int(.45 * SR)); y[:len(x)] += x; k = int(.22 * SR); c = hp(nz(.08), 3000) * env_exp(.08, .02) * .15; y[k:k + len(c)] += c
    return norm(lp(y, 2500)) * v
def scroll(d, v=1):   # handscroll pan: long paper slide + small crinkles
    tt = t_(d); e = np.sin(np.pi * np.minimum(tt / d, 1)) ** 1.2
    f = np.interp(tt, [0, d], [1200, 3200]); x = np.zeros_like(tt); blk = 2400
    src = nz(d)
    for i in range(0, len(tt), blk): x[i:i + blk] = bp(src[max(0, i - 4800):i + blk], f[i] * .6, f[i] * 1.6)[-len(x[i:i + blk]):]
    cr = hp(nz(d), 4000) * (rng.random(len(tt)) > .9985) * 3
    return norm(x * e + lp(cr, 9000) * e * .4) * v
# —— Wood ——
def block(v=1):   # woodblock set down on the bench
    d = .2; x = sines([180, 410, 960], d, [.05, .03, .015], [1, .6, .3]); x[:int(.004 * SR)] += nz(.004) * .5; return norm(lp(x, 3000)) * v
def step(m='dirt', v=1):
    if m == 'wood':
        d = .18; x = sines([170, 390, 720], d, [.06, .03, .012], [1, .5, .25]); x[:int(.01 * SR)] += bp(nz(.01), 300, 2500) * .6; return norm(lp(x, 2200)) * v
    d = .11; tt = t_(d); return norm(bp(nz(d), 300, 2600) * np.exp(-tt / .03) * (1 + .5 * np.sin(2 * np.pi * 60 * tt))) * v * .7
def cup(v=1):
    d = .5; x = sines([2780, 4120, 6400, 180], d, [.25, .15, .08, .03], [.6, .4, .2, .8]); x[:int(.003 * SR)] += nz(.003) * .4; return norm(x) * v
# —— Glass / metal ——
def chime(v=1):   # wind chime: glass bell + light strikes of the clapper
    d = 2.2; x = sines([2360, 5150, 7980, 2372], d, [.8, .4, .2, .8], [1, .45, .2, .5]); x[:int(.002 * SR)] += nz(.002) * .3
    y = np.zeros(int(2.6 * SR)); y[:len(x)] += x; k = int(.33 * SR); x2 = sines([2360, 5150], 1.8, [.6, .3], [.5, .2]); y[k:k + len(x2)] += x2; return norm(y) * v
# —— Creatures ——
def lark(v=1):
    out = np.zeros(int(1.2 * SR)); t0 = 0
    for i in range(7):
        d = .05 + rng.random() * .05; f0, f1 = 3200 + rng.random() * 1500, 4500 + rng.random() * 2000
        tt = t_(d); f = np.interp(tt, [0, d], [f0, f1]); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d)
        k = int(t0 * SR); out[k:k + len(s)] += s; t0 += d + .03 + rng.random() * .06
    return norm(out) * v
def geese(v=1):
    out = np.zeros(int(1.6 * SR))
    for i, t0 in enumerate([0, .35, .5, .95]):
        d = .16; tt = t_(d); f = 420 + 60 * np.sin(np.pi * tt / d); ph = np.cumsum(f) / SR
        s = (2 * (ph % 1) - 1) * np.sin(np.pi * tt / d) ** .5; s = bp(s, 500, 2200)
        k = int(t0 * SR); out[k:k + len(s)] += s * (1 - i * .15)
    return norm(lp(out, 2500)) * v
def kite(v=1):   # kite (bird) call pii-hyoro: long downward glide + trill tail
    d1, d2 = .55, .7; t1 = t_(d1); f1 = np.interp(t1, [0, .1, d1], [2100, 2600, 2150])
    s1 = np.sin(2 * np.pi * np.cumsum(f1) / SR) * np.minimum(1, t1 / .05) * np.exp(-t1 / .8)
    t2 = t_(d2); f2 = 1900 + 250 * np.sin(2 * np.pi * 9 * t2) - 300 * t2 / d2
    s2 = np.sin(2 * np.pi * np.cumsum(f2) / SR) * np.sin(np.pi * t2 / d2) * .7
    y = np.zeros(int(1.5 * SR)); y[:len(s1)] += s1; k = int(.62 * SR); y[k:k + len(s2)] += s2; return norm(y) * v
def sip(v=1):
    d = .35; tt = t_(d); return norm(bp(nz(d), 900, 3500) * np.sin(np.pi * tt / d) ** 3 * (.6 + .4 * np.sin(2 * np.pi * 14 * tt))) * v
def hat(v=1):   # kasa hat (woven straw) rustle
    d = .5; tt = t_(d); return norm(bp(nz(d), 1500, 7000) * np.sin(np.pi * tt / d) ** 2 * (rng.random(len(tt)) > .5)) * v
# —— Wind and water ——
def wind(d, v=1, lo=150, hi=900, seed=1):
    return norm(bp(brown(d) + nz(d) * .02, lo, hi) * slow(d, .6, .6, seed)) * v
def gust(v=1):
    d = 2.2; tt = t_(d); return norm(bp(nz(d), 300, 1800) * np.sin(np.pi * tt / d) ** 2) * v
def rise(d, v=1):   # low rumble of the wave standing up, growing fuller
    tt = t_(d); e = (tt / d) ** 1.6
    return norm(lp(brown(d), 380) * e + bp(nz(d), 600, 3000) * e ** 2 * .35 + np.sin(2 * np.pi * 42 * tt) * e * .25) * v
def crash_(v=1):
    d = .5; tt = t_(d); x = lp(nz(d), 5000) * np.exp(-tt / .25) + sines([48, 70], d, [.3, .2], [1.2, .6]) + hp(nz(d), 3000) * np.exp(-tt / .1) * .5
    return norm(x) * v
# —— water, frog, splash ——
def drip(v=1):   # a single drop into still water inside a stone shaft: pitched plink with a falling chirp
    d = .5; tt = t_(d); f = 1400 * np.exp(-tt / .03) + 900
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .07) * .7 + bp(nz(d), 2000, 6000) * np.exp(-tt / .005) * .3
    return norm(x) * v
def croak(v=1):   # frog croak: buzzy 150 Hz pulse train through a throat formant
    d = .32; tt = t_(d); env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** .6
    pulses = (np.sin(2 * np.pi * 34 * tt) > .2).astype(float)
    src = np.sign(np.sin(2 * np.pi * 150 * tt)) * pulses
    return norm(bp(src, 300, 1400) * env) * v
def splash(v=1):
    d = .6; tt = t_(d); return norm(bp(nz(d), 500, 5000) * np.exp(-tt / .12) + lp(nz(d), 300) * np.exp(-tt / .06) * .5) * v
# —— Stone, metal, bell, thunder ——
def tap(v=1, big=0):   # iron chisel struck on granite: bright ring + dull stone thud + grit
    d = .45; x = sines([2930, 4410, 6120, 3310], d, [.09, .05, .03, .07], [1, .55, .3, .4]) * .6
    x[:int(.003 * SR)] += nz(.003) * 1.2
    th = sines([140, 260], d, [.04, .02], [1, .5]) * (1.4 if big else .9)
    grit = bp(nz(.06), 2000, 8000) * env_exp(.06, .012) * .5; y = x + th; y[:len(grit)] += grit
    return norm(y) * v
def fan(v=1):
    d = .3; tt = t_(d); return norm(bp(nz(d), 400, 2200) * np.sin(np.pi * tt / d) ** 2) * v
def thunder(v=1):
    d = 3.0; tt = t_(d); e = np.exp(-tt / 1.0) * (1 - np.exp(-tt / .05))
    return norm(lp(brown(d), 160) * e * (1 + .5 * slow(d, 6, .9, 4)) + bp(nz(d), 300, 1200) * np.exp(-tt / .3) * .4) * v
def bell(v=1):
    d = 4.0; return norm(sines([523, 1310, 2093, 2770, 528], d, [2.4, 1.4, .8, .5, 2.2], [1, .5, .35, .2, .6])) * v
def amb(w, d):
    tt = t_(d)
    if w == 'well':   # damp stone room: low air + slow resonant hum
        return norm(lp(brown(d), 220) * .7 + np.sin(2 * np.pi * 92 * tt) * .05 * slow(d, .3, .6, 2)) * .7
    if w == 'sea':
        sw = .55 + .45 * np.sin(2 * np.pi * tt / 5.5); return norm(bp(nz(d), 200, 1800) * sw + lp(brown(d), 150) * .5)
    if w == 'earth': return norm(lp(brown(d), 160)) * .5
    if w == 'quarry': return wind(d, .5, 140, 800, 3)
    if w == 'cicada':
        s = np.sin(2 * np.pi * 4300 * tt) * (.5 + .5 * np.sin(2 * np.pi * 38 * tt)) * slow(d, .8, .7, 5)
        return norm(s * .25 + wind(d, .3, 200, 900, 6))
    if w == 'heat': return norm(wind(d, .6, 90, 400, 7) + np.sin(2 * np.pi * 55 * tt) * .08)
    if w == 'rain':
        bed = hp(nz(d), 900) * .5 + bp(nz(d), 300, 2000) * .3
        return norm(bed + lp(brown(d), 300) * .45) * .8
    if w == 'high': return wind(d, .35, 400, 1600, 9) + wind(d, .25, 90, 300, 10)
    if w == 'dusk':
        out = wind(d, .3, 150, 700, 11) * .6; tick = np.zeros_like(tt)
        for k in rng.integers(0, len(tt) - 3000, int(d * 3)): tick[k:k + 600] += np.sin(2 * np.pi * 4800 * np.arange(600) / SR) * np.exp(-np.arange(600) / 120)
        return out + tick * .12
    return np.zeros_like(tt)

fx, ab, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
VOICE = {}
for e in E['ev']:
    t, ty, v = e['t'], e['type'], e.get('v', 1)
    if ty == 'vo':
        y, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = resample_poly(y, SR, sr); VOICE[e['id']] = (t, len(y) / SR); add(vo, y, t, 1.0, 0)
    elif ty == 'baren': add(fx, baren(e['d'], v), t, .3, .1)
    elif ty == 'block': add(fx, block(v), t, .28, -.1)
    elif ty == 'slip': add(fx, slip(v), t, .18, .2)
    elif ty == 'seal': add(fx, seal(v), t, .5, 0)
    elif ty == 'scroll': add(fx, scroll(e['d'], v), t, .22, 0)
    elif ty == 'step': add(fx, step(e.get('m', 'dirt'), v), t, .12, .15)
    elif ty == 'tap': add(fx, tap(v, e.get('big', 0)), t, .42 if e.get('big') else .22, -.15)
    elif ty == 'geese': add(fx, geese(v), t, .06, -.3)
    elif ty == 'fan': add(fx, fan(v), t, .07, -.2)
    elif ty == 'gust': add(ab, gust(v), t, .12, .2)
    elif ty == 'thunder': add(ab, thunder(v), t, .3, 0)
    elif ty == 'rise': add(ab, rise(e['d'], v), t, .22, 0)
    elif ty == 'spill': add(ab, rise(e['d'], v) * .6 + fade(hp(nz(e['d']), 1200) * .5, .3, .6), t, .16, 0)
    elif ty == 'bell': add(fx, bell(v), t, .2, 0)
    elif ty == 'drip': add(fx, drip(v), t, .16, -.2)
    elif ty == 'croak': add(fx, croak(v), t, .14, .1)
    elif ty == 'splash': add(fx, splash(v), t, .12, 0)
    elif ty == 'amb':
        a = amb(e['w'], e['d']); a = fade(a, .4, .4); add(ab, a, t, .09 if e['w'] == 'rain' else .2, 0)

SONG = any(e['type'] == 'song' for e in E['ev'])
if SONG:
    # sung version: the Suno song carries voice and music; block/print noises and ambience stay quietly underneath
    sj = json.load(open(os.path.join(HERE, 'song', 'song.json')))
    mu, sr = sf.read(os.path.join(HERE, 'song', 'song.wav'))
    if mu.ndim == 1: mu = np.stack([mu, mu], 1)
    if sr != SR: mu = resample_poly(mu, SR, sr, axis=0)
    i0 = int(sj.get('start', 0) * SR); mu = mu[i0:i0 + N]; mu = np.pad(mu, ((0, N - len(mu)), (0, 0)))
    mu = mu * (.9 / (np.abs(mu).max() + 1e-9))
    MIX = mu * 1.0 + fx * .5 + ab * .45
    k = int((DUR - .8) * SR); MIX[k:] *= np.linspace(1, 0, N - k)[:, None]
else:
    vm = compress(vo[:, 0] * 1.414, .2, 3, .004, .1); vo = np.stack([vm, vm], 1) / 1.414
    room = np.zeros_like(vo); dl = int(.023 * SR); room[dl:] = vo[:-dl] * .12; vo = vo + lp(room, 3000)
    mu, _ = sf.read(os.path.join(HERE, 'music/score.wav'))
    if mu.ndim == 1: mu = np.stack([mu, mu], 1)
    mu = np.pad(mu[:N], ((0, max(0, N - len(mu[:N]))), (0, 0)))
    duck = np.ones(N)
    for id_, (t0, d) in VOICE.items():
        a, b = int((t0 - .25) * SR), int((t0 + d + .3) * SR); duck[a:b] = np.minimum(duck[a:b], .4)
    duck = uniform_filter1d(duck, int(.25 * SR))
    mu *= duck[:, None]; ab *= np.sqrt(duck)[:, None]
    MIX = mu * 1.7 + vo * 1.3 + fx * 1.0 + ab * 1.0
    # the ma on the mountain: ambience out, only voice and the taps
    MA = E.get('ma') or [0, 0]
    a, b = int(MA[0] * SR), int(MA[1] * SR); ab_cut = np.ones(N); ab_cut[a:b] = 0; ab_cut = uniform_filter1d(ab_cut, int(.4 * SR))
    MIX = MIX - ab * (1 - ab_cut)[:, None]
    k = int((DUR - .25) * SR); MIX[k:] *= np.linspace(1, 0, N - k)[:, None]   # tiny tail fade only: the film loops
MIX = limit(MIX, .92)
sf.write(os.path.join(HERE, 'mix.wav'), MIX.astype(np.float32), SR)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for a in range(0, int(DUR), 8):
    s = slice(int(a * SR), int(min(DUR, a + 8) * SR)); print(f'{a:3d}-{a+8:<3d} mix {db(MIX[s]):6.1f} vo {db(vo[s] * 1.3):6.1f} mu {db(mu[s]):6.1f} fx {db(fx[s]):6.1f} amb {db(ab[s]):6.1f}')
print('peak', np.abs(MIX).max())
