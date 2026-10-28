import subprocess, math, wave, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
import os
OUT = os.environ.get("FG_OUT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "videos"))
SCR = os.environ.get("FG_TMP", "/tmp/fg_tmp")
F = "/usr/share/fonts/opentype/inter/"
def font(n, s): return ImageFont.truetype(F + n, s)

BG = (10, 12, 18); PANEL = (22, 26, 36); GRID = (40, 46, 60)
FG = (246, 246, 242); MUTED = (150, 156, 170); ACC = (255, 204, 0); RED = (255, 84, 84); GREEN = (80, 220, 140)
BRAND = "DEUTSCHLAND IN ZAHLEN"
M = 90

fK = font("Inter-Bold.otf", 36); fH = font("InterDisplay-Black.otf", 96) if False else font("InterDisplay-Bold.otf", 96)
fHuge = font("InterDisplay-Bold.otf", 230); fBig = font("InterDisplay-Bold.otf", 150)
fMid = font("InterDisplay-Bold.otf", 64); fBody = font("Inter-Medium.otf", 44); fSmall = font("Inter-Medium.otf", 32)
fTiny = font("Inter-Medium.otf", 26); fBrand = font("Inter-Bold.otf", 28); fAxis = font("Inter-SemiBold.otf", 28)
fLbl = font("Inter-Bold.otf", 34)

def eur(v, dec=2):
    s = f"{v:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return s + " €"

def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def ease_io(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)

def ctext(d, y, txt, fnt, col):
    w = d.textlength(txt, font=fnt); d.text(((W - w) / 2, y), txt, font=fnt, fill=col)

def layer_text(img, xy, txt, fnt, col, a=1.0, anchor="la"):
    if a <= 0: return
    L = Image.new("RGBA", img.size, (0, 0, 0, 0)); ImageDraw.Draw(L).text(xy, txt, font=fnt, fill=col + (int(255 * a),), anchor=anchor)
    img.alpha_composite(L)

def wrap(d, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=fnt) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

# ---------------- scenes ----------------
def sc_hook(img, d, lt, s):
    # kicker, setup line, known value, then "?" pulsing
    a1 = 1.0
    layer_text(img, (W / 2, 470), s["kicker"], fK, ACC, a1, "ma")
    y = 560
    for i, ln in enumerate(wrap(d, s["setup"], fMid, W - 2 * M)):
        layer_text(img, (W / 2, y + i * 78), ln, fMid, FG, 1.0, "ma")
    y += 78 * len(wrap(d, s["setup"], fMid, W - 2 * M)) + 20
    layer_text(img, (W / 2, y), s["known"], fBig, FG, 1.0, "ma")
    y2 = y + 230
    for i, ln in enumerate(wrap(d, s["question"], fMid, W - 2 * M)):
        layer_text(img, (W / 2, y2 + i * 78), ln, fMid, MUTED, ease((lt - 0.7) / 0.35), "ma")
    y3 = y2 + 78 * len(wrap(d, s["question"], fMid, W - 2 * M)) + 10
    if lt > 1.0:
        pulse = 1 + 0.06 * math.sin((lt - 1.0) * 9)
        f = font("InterDisplay-Bold.otf", int(230 * pulse))
        layer_text(img, (W / 2, y3), "?", f, ACC, ease((lt - 1.0) / 0.25), "ma")
    if lt > 1.6:
        layer_text(img, (W / 2, 1560), "Tipp in die Kommentare", fSmall, MUTED, ease((lt - 1.6) / 0.4), "ma")

def step_val(series, x):
    v = series[0][1]
    for xx, vv in series:
        if xx <= x + 1e-9: v = vv
    return v

def sc_line(img, d, lt, s):
    ser = s["series"]; x0, x1 = s["xrange"]; vmax = s["vmax"]
    L, R, T, B = M + 20, W - M - 20, 760, 1430
    p = ease_io((lt - 0.3) / (s["dur"] - 1.6))
    xc = x0 + p * (x1 - x0)
    def X(x): return L + (x - x0) / (x1 - x0) * (R - L)
    def Y(v): return B - v / vmax * (B - T)
    # grid
    for g in s["grid"]:
        d.line([L, Y(g), R, Y(g)], fill=GRID, width=2)
        d.text((L - 12, Y(g)), eur(g, s.get("dec", 2)).replace(",00 €", " €"), font=fTiny, fill=MUTED, anchor="rm") if False else None
    for yr in s["ticks"]:
        d.text((X(yr), B + 22), str(yr), font=fAxis, fill=MUTED, anchor="ma")
    # path
    pts = []; prev = ser[0][1]; pts.append((X(ser[0][0]), Y(prev)))
    for xx, vv in ser[1:]:
        if xx > xc: break
        pts.append((X(xx), Y(prev))); pts.append((X(xx), Y(vv))); prev = vv
    pts.append((X(xc), Y(prev)))
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.line(pts, fill=ACC + (120,), width=22, joint="curve")
    glow = glow.filter(ImageFilter.GaussianBlur(14)); img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    # area fill
    poly = pts + [(X(xc), B), (X(ser[0][0]), B)]
    A = Image.new("RGBA", img.size, (0, 0, 0, 0)); ImageDraw.Draw(A).polygon(poly, fill=ACC + (28,)); img.alpha_composite(A)
    d = ImageDraw.Draw(img)
    d.line(pts, fill=ACC, width=8, joint="curve")
    hx, hy = pts[-1]; d.ellipse([hx - 16, hy - 16, hx + 16, hy + 16], fill=FG)
    # value labels at passed steps
    for i, (xx, vv) in enumerate(ser):
        if xx <= xc and (i == 0 or i in s.get("label_idx", [])):
            lx = X(xx); ly = Y(vv)
            d.text((lx + 10, ly - 18), eur(vv, s.get("dec", 2)), font=fLbl, fill=FG, anchor="lb")
    # big counter
    v = step_val(ser, xc)
    layer_text(img, (W / 2, 300), s["title"], fK, ACC, ease(lt / 0.3), "ma")
    d = ImageDraw.Draw(img)
    ctext(d, 370, eur(v, s.get("dec", 2)), fBig, FG)
    yl = s["xlabel"](xc)
    ctext(d, 550, yl, fBody, MUTED)

def sc_stat(img, d, lt, s):
    a = ease(lt / 0.35)
    layer_text(img, (W / 2, 560), s["pre"], fMid, FG, a, "ma")
    sc = 0.6 + 0.4 * ease(lt / 0.45)
    f = font("InterDisplay-Bold.otf", int(s.get("size", 250) * sc))
    layer_text(img, (W / 2, 700 + (1 - sc) * 120), s["big"], f, s.get("col", RED), a, "ma")
    y = 1010
    for i, ln in enumerate(s["lines"]):
        al = ease((lt - 0.6 - i * 0.5) / 0.4)
        for j, w in enumerate(wrap(d, ln, fBody, W - 2 * M)):
            layer_text(img, (W / 2, y), w, fBody, FG if i == 0 else MUTED, al, "ma"); y += 62
        y += 30

def sc_list(img, d, lt, s):
    layer_text(img, (W / 2, 300), s["title"], fK, ACC, ease(lt / 0.3), "ma")
    for i, ln in enumerate(wrap(d, s["head"], fMid, W - 2 * M)):
        layer_text(img, (W / 2, 360 + i * 76), ln, fMid, FG, ease(lt / 0.3), "ma")
    per = s["per"]
    for i, it in enumerate(s["items"]):
        t0 = 0.6 + i * per
        a = ease((lt - t0) / 0.35)
        if a <= 0: continue
        y = 600 + i * 230; dy = (1 - a) * 50
        P = Image.new("RGBA", img.size, (0, 0, 0, 0)); pd = ImageDraw.Draw(P)
        hl = i == len(s["items"]) - 1
        pd.rounded_rectangle([M - 20, y + dy, W - M + 20, y + 200 + dy], radius=28, fill=(PANEL if not hl else (48, 22, 26)) + (int(255 * a),),
                             outline=(RED + (int(255 * a),)) if hl else None, width=4 if hl else 0)
        img.alpha_composite(P)
        layer_text(img, (M + 20, y + 30 + dy), it["name"], fLbl, FG, a)
        layer_text(img, (M + 20, y + 95 + dy), it["old"] + "  →  " + it["new"], fMid, MUTED, a)
        layer_text(img, (W - M - 10, y + 70 + dy), it["pct"], font("InterDisplay-Bold.otf", 78), it.get("col", RED), a, "ra")

def sc_bars(img, d, lt, s):
    layer_text(img, (W / 2, 330), s["title"], fK, ACC, ease(lt / 0.3), "ma")
    for i, ln in enumerate(wrap(d, s["head"], fMid, W - 2 * M)):
        layer_text(img, (W / 2, 400 + i * 76), ln, fMid, FG, ease(lt / 0.3), "ma")
    vmax = max(b["v"] for b in s["bars"])
    for i, b in enumerate(s["bars"]):
        t0 = 0.4 + i * 0.7; g = ease_io((lt - t0) / 0.9)
        if lt < t0: continue
        y = 720 + i * 250
        layer_text(img, (M, y), b["label"], fLbl, MUTED, ease((lt - t0) / 0.3))
        wbar = int((W - 2 * M) * b["v"] / vmax * g)
        ImageDraw.Draw(img).rounded_rectangle([M, y + 55, M + max(wbar, 20), y + 165], radius=20, fill=b["col"])
        val = eur(b["v"] * g) + b.get("suf", "")
        tw = d.textlength(val, font=fMid)
        if wbar > tw + 50: layer_text(img, (M + wbar - 24, y + 72), val, fMid, BG, 1, "ra")
        else: layer_text(img, (M + wbar + 20, y + 72), val, fMid, FG, 1)

def sc_cta(img, d, lt, s):
    a = ease(lt / 0.35)
    y = 680
    for i, ln in enumerate(wrap(d, s["q"], fMid, W - 2 * M)):
        layer_text(img, (W / 2, y + i * 80), ln, fMid, FG, a, "ma")
    y += 80 * len(wrap(d, s["q"], fMid, W - 2 * M)) + 60
    layer_text(img, (W / 2, y), "Schreib's in die Kommentare", fBody, MUTED, ease((lt - 0.4) / 0.4), "ma")
    a2 = ease((lt - 0.9) / 0.4)
    P = Image.new("RGBA", img.size, (0, 0, 0, 0)); pd = ImageDraw.Draw(P)
    bw = 620; pd.rounded_rectangle([(W - bw) / 2, y + 140, (W + bw) / 2, y + 250], radius=55, fill=ACC + (int(255 * a2),))
    img.alpha_composite(P)
    layer_text(img, (W / 2, y + 168), "Folgen für mehr Zahlen", fLbl, BG, a2, "ma")

SCENES = {"hook": sc_hook, "line": sc_line, "stat": sc_stat, "list": sc_list, "bars": sc_bars, "cta": sc_cta}

def frame(v, t):
    total = sum(s["dur"] for s in v["scenes"])
    img = Image.new("RGBA", (W, H), BG + (255,)); d = ImageDraw.Draw(img)
    acc = 0
    for s in v["scenes"]:
        if t < acc + s["dur"] or s is v["scenes"][-1]: break
        acc += s["dur"]
    lt = t - acc
    SCENES[s["type"]](img, ImageDraw.Draw(img), lt, s)
    # fade out at scene end (except last)
    if s is not v["scenes"][-1] and lt > s["dur"] - 0.2:
        k = ease((lt - (s["dur"] - 0.2)) / 0.2)
        img.alpha_composite(Image.new("RGBA", img.size, BG + (int(255 * k),)))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 8], fill=(30, 34, 46)); d.rectangle([0, 0, int(W * t / total), 8], fill=ACC)
    ctext(d, 150, BRAND, fBrand, MUTED)
    for i, ln in enumerate(wrap(d, "Quelle: " + v["source"], fTiny, W - 2 * M)):
        ctext(d, H - 190 + i * 36, ln, fTiny, (110, 116, 130))
    return img.convert("RGB")

# ---------------- audio ----------------
def audio(v, path):
    sr = 44100; total = sum(s["dur"] for s in v["scenes"]); n = int(total * sr); t = np.arange(n) / sr
    a = np.zeros(n); bpm = 112; beat = 60 / bpm
    chords = [[110.0, 164.81, 220.0, 261.63], [87.31, 130.81, 174.61, 220.0], [130.81, 196.0, 261.63, 329.63], [98.0, 146.83, 196.0, 246.94]]
    bar = beat * 4
    for ci in range(int(total / bar) + 2):
        st = int(ci * bar * sr)
        if st >= n: break
        en = min(n, int((ci + 1) * bar * sr)); loc = t[st:en] - ci * bar
        for k in range(8):
            o = loc - k * beat / 2; m = o >= 0
            env = np.where(m, np.exp(-np.maximum(o, 0) * 6), 0)
            for f in chords[ci % 4][1:]:
                a[st:en] += env * np.sin(2 * np.pi * f * 2 * loc) * 0.018
        a[st:en] += np.sin(2 * np.pi * chords[ci % 4][0] * loc) * 0.05
    for k in range(int(total / beat)):
        st = int(k * beat * sr); ln = int(0.22 * sr)
        if st + ln > n: break
        lo = np.arange(ln) / sr
        a[st:st + ln] += np.sin(2 * np.pi * (45 + 90 * np.exp(-lo * 35)) * lo) * np.exp(-lo * 12) * 0.35
        hs = st + int(beat / 2 * sr); hl = int(0.05 * sr)
        if hs + hl < n: a[hs:hs + hl] += np.random.uniform(-1, 1, hl) * np.exp(-np.arange(hl) / sr * 80) * 0.05
    # sfx: whoosh at scene changes, pop at stat
    acc = 0
    for s in v["scenes"]:
        st = int(acc * sr); ln = int(0.35 * sr)
        if st + ln < n and acc > 0:
            lo = np.arange(ln) / sr
            a[st:st + ln] += np.random.uniform(-1, 1, ln) * np.sin(np.pi * lo / 0.35) * 0.12
        if s["type"] == "stat":
            ln = int(0.3 * sr); lo = np.arange(ln) / sr
            if st + ln < n: a[st:st + ln] += np.sin(2 * np.pi * 880 * lo) * np.exp(-lo * 14) * 0.25 + np.sin(2 * np.pi * 1320 * lo) * np.exp(-lo * 18) * 0.12
        acc += s["dur"]
    a *= np.minimum(1, t / 0.3) * np.minimum(1, (total - t) / 1.0)
    a = a / np.max(np.abs(a)) * 0.8
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a * 32767).astype(np.int16).tobytes())

def render(v):
    import os; os.makedirs(OUT, exist_ok=True); os.makedirs(SCR, exist_ok=True)
    total = sum(s["dur"] for s in v["scenes"])
    wav = f"{SCR}/{v['slug']}.wav"; audio(v, wav)
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                          "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
                          "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", f"{OUT}/{v['slug']}.mp4"], stdin=subprocess.PIPE)
    for i in range(int(total * FPS)):
        p.stdin.write(frame(v, i / FPS).tobytes())
    p.stdin.close(); p.wait()
    return v["slug"], total
