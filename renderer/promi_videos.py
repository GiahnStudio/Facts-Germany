"""Promi-Vergleiche (Ranking-Countdown) – 9:16 Shorts. Keine Fotos: Initialen-Avatare + Flagge + Kategorie."""
import os, sys, math, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFilter
import data_videos as dv
from data_videos import W, H, FPS, font, ease, ease_io, layer_text, wrap, M

BG = (12, 10, 20); PANEL = (26, 22, 40); FG = (248, 246, 240); MUTED = (156, 150, 176)
GOLD = (255, 200, 60); SILVER = (200, 208, 222); BRONZE = (214, 140, 80)
fK = font("Inter-Bold.otf", 36); fMid = font("InterDisplay-Bold.otf", 66); fBody = font("Inter-Medium.otf", 42)
fSmall = font("Inter-Medium.otf", 32); fTiny = font("Inter-Medium.otf", 26); fBrand = font("Inter-Bold.otf", 28)
fName = font("InterDisplay-Bold.otf", 84); fLbl = font("Inter-Bold.otf", 36)
def fD(s): return font("InterDisplay-Bold.otf", int(s))

# ---------- Flaggen (gezeichnet, keine Bilder) ----------
def flag(img, x, y, code, w=96):
    h = int(w * 0.62); F = Image.new("RGBA", (w, h)); d = ImageDraw.Draw(F)
    if code == "US":
        for i in range(13):
            d.rectangle([0, i * h / 13, w, (i + 1) * h / 13], fill=(178, 34, 52) if i % 2 == 0 else (255, 255, 255))
        d.rectangle([0, 0, w * 0.4, h * 7 / 13], fill=(60, 59, 110))
        for r in range(4):
            for c in range(5):
                cx = w * 0.04 + c * w * 0.08; cy = h * 0.06 + r * h * 0.12
                d.ellipse([cx, cy, cx + 3, cy + 3], fill=(255, 255, 255))
    elif code == "BB":
        d.rectangle([0, 0, w / 3, h], fill=(0, 38, 127)); d.rectangle([w / 3, 0, 2 * w / 3, h], fill=(255, 199, 38))
        d.rectangle([2 * w / 3, 0, w, h], fill=(0, 38, 127))
        cx = w / 2; k = (0, 0, 0)
        d.line([cx, h * 0.25, cx, h * 0.82], fill=k, width=3)
        d.line([cx - w * 0.09, h * 0.42, cx + w * 0.09, h * 0.42], fill=k, width=3)
        d.line([cx - w * 0.09, h * 0.42, cx - w * 0.09, h * 0.22], fill=k, width=3)
        d.line([cx + w * 0.09, h * 0.42, cx + w * 0.09, h * 0.22], fill=k, width=3)
    elif code == "DE":
        for i, c in enumerate([(0, 0, 0), (221, 0, 0), (255, 206, 0)]): d.rectangle([0, i * h / 3, w, (i + 1) * h / 3], fill=c)
    elif code == "GB":
        d.rectangle([0, 0, w, h], fill=(1, 33, 105))
        d.line([0, 0, w, h], fill=(255, 255, 255), width=10); d.line([0, h, w, 0], fill=(255, 255, 255), width=10)
        d.line([0, 0, w, h], fill=(200, 16, 46), width=4); d.line([0, h, w, 0], fill=(200, 16, 46), width=4)
        d.rectangle([w / 2 - 9, 0, w / 2 + 9, h], fill=(255, 255, 255)); d.rectangle([0, h / 2 - 9, w, h / 2 + 9], fill=(255, 255, 255))
        d.rectangle([w / 2 - 5, 0, w / 2 + 5, h], fill=(200, 16, 46)); d.rectangle([0, h / 2 - 5, w, h / 2 + 5], fill=(200, 16, 46))
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=8, fill=255)
    img.paste(F, (int(x), int(y)), m)

# ---------- Initialen-Avatar ----------
def avatar(img, cx, cy, r, initials, col, a=1.0, ring=None):
    if a <= 0: return
    S = 2 * r + 40; A = Image.new("RGBA", (S, S)); d = ImageDraw.Draw(A)
    c2 = tuple(max(0, int(v * 0.45)) for v in col)
    for i in range(r, 0, -2):  # radialer Verlauf
        t = i / r; c = tuple(int(c2[k] + (col[k] - c2[k]) * (1 - t * 0.8)) for k in range(3))
        d.ellipse([S / 2 - i, S / 2 - i, S / 2 + i, S / 2 + i], fill=c + (255,))
    if ring: d.ellipse([S / 2 - r - 8, S / 2 - r - 8, S / 2 + r + 8, S / 2 + r + 8], outline=ring + (255,), width=8)
    d.text((S / 2, S / 2 + 4), initials, font=fD(r * 0.78), fill=(255, 255, 255, 255), anchor="mm")
    if a < 1: A.putalpha(A.getchannel("A").point(lambda v: int(v * a)))
    img.alpha_composite(A, (int(cx - S / 2), int(cy - S / 2)))

def money(v, L):  # v in Mrd. USD
    if L == "de": return f"{v:.1f}".replace(".", ",") + " Mrd. $"
    return f"${v:.1f}B"

RANKCOL = {1: GOLD, 2: SILVER, 3: BRONZE}

# ---------- Szenen ----------
def sc_hook(img, d, lt, s, v):
    layer_text(img, (W / 2, 470), s["kicker"], fK, GOLD, ease(lt / 0.3), "ma")
    y = 560
    for i, ln in enumerate(wrap(d, s["setup"], fMid, W - 2 * M)):
        layer_text(img, (W / 2, y + i * 80), ln, fMid, FG, ease(lt / 0.3), "ma")
    y += 80 * len(wrap(d, s["setup"], fMid, W - 2 * M)) + 30
    # Reihe mit "?"-Avataren
    n = s["n"]; gap = 150
    for i in range(n):
        a = ease((lt - 0.35 - i * 0.08) / 0.3)
        avatar(img, W / 2 + (i - (n - 1) / 2) * gap, y + 80, 62, "?", (90, 80, 130), a)
    y2 = y + 220
    for i, ln in enumerate(wrap(d, s["question"], fMid, W - 2 * M)):
        layer_text(img, (W / 2, y2 + i * 80), ln, fMid, MUTED, ease((lt - 0.9) / 0.35), "ma")
    if lt > 1.6:
        layer_text(img, (W / 2, 1560), s["tip"], fSmall, MUTED, ease((lt - 1.6) / 0.4), "ma")

def person_card(img, y, p, lt, t0, v, rank_txt, big=False):
    a = ease((lt - t0) / 0.35); dy = (1 - a) * 60
    if a <= 0: return
    col = RANKCOL.get(p.get("rank"), (140, 120, 255))
    avatar(img, W / 2, y + 170 + dy, 150 if big else 130, p["ini"], p["col"], a, ring=col if p.get("rank", 9) <= 3 else None)
    layer_text(img, (W / 2, y + 360 + dy), p["name"], fName, FG, a, "ma")
    # Flagge + Kategorie
    d = ImageDraw.Draw(img); tw = d.textlength(p["cat"][v["lang"]], font=fBody)
    x0 = W / 2 - (tw + 116) / 2
    if a > 0.5: flag(img, x0, y + 478 + dy, p["flag"])
    layer_text(img, (x0 + 116, y + 476 + dy), p["cat"][v["lang"]], fBody, MUTED, a)
    layer_text(img, (W / 2, y - 120 + dy), rank_txt, fD(110), col, a, "ma")

def sc_rank(img, d, lt, s, v):
    p = s["p"]; L = v["lang"]
    person_card(img, 370, p, lt, 0.0, v, f"#{p['rank']}")
    g = ease_io((lt - 0.45) / 1.0)
    layer_text(img, (W / 2, 960), money(p["v"] * g, L), fD(170), RANKCOL.get(p["rank"], FG), ease((lt - 0.4) / 0.2), "ma")
    # Balken relativ zur Nr. 1
    bw = W - 2 * M; y = 1190
    ImageDraw.Draw(img).rounded_rectangle([M, y, M + bw, y + 44], radius=22, fill=PANEL)
    wbar = int(bw * p["v"] / v["vmax"] * g)
    if wbar > 10: ImageDraw.Draw(img).rounded_rectangle([M, y, M + wbar, y + 44], radius=22, fill=RANKCOL.get(p["rank"], (140, 120, 255)))
    if p.get("note"):
        for i, ln in enumerate(wrap(d, p["note"][L], fBody, W - 2 * M)):
            layer_text(img, (W / 2, 1290 + i * 58), ln, fBody, FG, ease((lt - 1.1) / 0.4), "ma")

def sc_tie(img, d, lt, s, v):
    L = v["lang"]
    layer_text(img, (W / 2, 290), s["head"][L], fD(110), (140, 120, 255), ease(lt / 0.3), "ma")
    layer_text(img, (W / 2, 420), s["sub"][L], fBody, MUTED, ease((lt - 0.2) / 0.3), "ma")
    for i, p in enumerate(s["ps"]):
        t0 = 0.4 + i * 0.45; a = ease((lt - t0) / 0.35)
        if a <= 0: continue
        y = 560 + i * 270; dx = (1 - a) * -80
        P = Image.new("RGBA", img.size); ImageDraw.Draw(P).rounded_rectangle([M - 20 + dx, y, W - M + 20 + dx, y + 230], radius=34, fill=PANEL + (int(255 * a),))
        img.alpha_composite(P)
        avatar(img, M + 95 + dx, y + 115, 80, p["ini"], p["col"], a)
        layer_text(img, (M + 210 + dx, y + 42), p["name"], fD(64), FG, a)
        if a > 0.5: flag(img, M + 212 + dx, y + 140, p["flag"], 72)
        layer_text(img, (M + 300 + dx, y + 134), p["cat"][L], fSmall, MUTED, a)
    if lt > 1.9:
        k = ease((lt - 1.9) / 0.3); sc = 1 + 0.25 * (1 - k)
        layer_text(img, (W / 2, 1400), s["each"][L] + " " + money(s["v"], L), fD(78 * sc), FG, k, "ma")

def sc_reveal(img, d, lt, s, v):
    p = s["p"]; L = v["lang"]
    # Spannung: Drumroll-Phase mit "?"-Avatar, dann Reveal
    tr = s.get("reveal_at", 1.1)
    if lt < tr:
        pulse = 1 + 0.05 * math.sin(lt * 18)
        layer_text(img, (W / 2, 250), "#1", fD(110), GOLD, 1, "ma")
        avatar(img, W / 2, 540, int(150 * pulse), "?", (90, 80, 130))
        layer_text(img, (W / 2, 780), s["teaser"][L], fMid, MUTED, 1, "ma")
        return
    lt2 = lt - tr
    # Lichtstrahlen
    G = Image.new("RGBA", img.size); gd = ImageDraw.Draw(G)
    for k in range(14):
        ang = k * math.pi / 7 + lt2 * 0.4
        gd.polygon([(W / 2, 540), (W / 2 + 1400 * math.cos(ang - 0.08), 540 + 1400 * math.sin(ang - 0.08)),
                    (W / 2 + 1400 * math.cos(ang + 0.08), 540 + 1400 * math.sin(ang + 0.08))], fill=GOLD + (int(26 * ease(lt2 / 0.5)),))
    img.alpha_composite(G.filter(ImageFilter.GaussianBlur(6)))
    person_card(img, 370, p, lt2, 0.0, v, "#1", big=True)
    g = ease_io((lt2 - 0.3) / 0.9)
    layer_text(img, (W / 2, 990), money(p["v"] * g, L), fD(190), GOLD, ease((lt2 - 0.25) / 0.2), "ma")
    for i, ln in enumerate(wrap(d, p["note"][L], fBody, W - 2 * M)):
        layer_text(img, (W / 2, 1240 + i * 58), ln, fBody, FG, ease((lt2 - 1.0) / 0.4), "ma")

def sc_board(img, d, lt, s, v):
    L = v["lang"]
    layer_text(img, (W / 2, 250), s["head"][L], fK, GOLD, ease(lt / 0.3), "ma")
    rows = sorted(v["people"], key=lambda p: -p["v"])
    for i, p in enumerate(rows):
        t0 = 0.2 + i * 0.18; g = ease_io((lt - t0) / 0.8); a = ease((lt - t0) / 0.3)
        if a <= 0: continue
        y = 360 + i * 175
        rc = RANKCOL.get(p["rank"], (140, 120, 255))
        layer_text(img, (M - 10, y + 40), f"{p['rank']}", fD(58), rc, a)
        avatar(img, M + 110, y + 75, 58, p["ini"], p["col"], a)
        layer_text(img, (M + 190, y + 12), p["name"], fLbl, FG, a)
        bw = W - M - (M + 190) - 10; wbar = int(bw * p["v"] / v["vmax"] * g)
        if wbar > 8: ImageDraw.Draw(img).rounded_rectangle([M + 190, y + 66, M + 190 + wbar, y + 116], radius=16, fill=rc)
        val = money(p["v"], L); vw = d.textlength(val, font=fLbl)
        if wbar > vw + 40: layer_text(img, (M + 190 + wbar - 18, y + 72), val, fLbl, BG, a, "ra")
        else: layer_text(img, (M + 200 + wbar, y + 72), val, fLbl, FG, a)
    if lt > 2.2:
        for i, ln in enumerate(wrap(d, s["foot"][L], fBody, W - 2 * M)):
            layer_text(img, (W / 2, 1460 + i * 56), ln, fBody, MUTED, ease((lt - 2.2) / 0.4), "ma")

def sc_cta(img, d, lt, s, v):
    L = v["lang"]; a = ease(lt / 0.35); y = 640
    lines = wrap(d, s["q"][L], fMid, W - 2 * M)
    for i, ln in enumerate(lines): layer_text(img, (W / 2, y + i * 82), ln, fMid, FG, a, "ma")
    y += 82 * len(lines) + 60
    layer_text(img, (W / 2, y), s["c"][L], fBody, MUTED, ease((lt - 0.4) / 0.4), "ma")
    a2 = ease((lt - 0.9) / 0.4)
    P = Image.new("RGBA", img.size); bw = 640
    ImageDraw.Draw(P).rounded_rectangle([(W - bw) / 2, y + 140, (W + bw) / 2, y + 250], radius=55, fill=GOLD + (int(255 * a2),))
    img.alpha_composite(P)
    layer_text(img, (W / 2, y + 168), s["btn"][L], fLbl, BG, a2, "ma")

SC = {"hook": sc_hook, "rank": sc_rank, "tie": sc_tie, "reveal": sc_reveal, "board": sc_board, "cta": sc_cta}

def frame(v, t):
    sc = v["scenes"]; total = sum(s["dur"] for s in sc)
    img = Image.new("RGBA", (W, H), BG + (255,))
    acc = 0
    for s in sc:
        if t < acc + s["dur"] or s is sc[-1]: break
        acc += s["dur"]
    lt = t - acc
    SC[s["type"]](img, ImageDraw.Draw(img), lt, s, v)
    if s is not sc[-1] and lt > s["dur"] - 0.18:
        img.alpha_composite(Image.new("RGBA", img.size, BG + (int(255 * ease((lt - (s["dur"] - 0.18)) / 0.18)),)))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 8], fill=(34, 30, 50)); d.rectangle([0, 0, int(W * t / total), 8], fill=GOLD)
    w = d.textlength(v["brand"], font=fBrand); d.text(((W - w) / 2, 150), v["brand"], font=fBrand, fill=MUTED)
    src = ("Quelle: " if v["lang"] == "de" else "Source: ") + v["source"][v["lang"]]
    for i, ln in enumerate(wrap(d, src, fTiny, W - 2 * M)):
        lw = d.textlength(ln, font=fTiny); d.text(((W - lw) / 2, H - 190 + i * 36), ln, font=fTiny, fill=(112, 106, 130))
    return img.convert("RGB")

def render(v, out_dir):
    os.makedirs(out_dir, exist_ok=True); os.makedirs(dv.SCR, exist_ok=True)
    total = sum(s["dur"] for s in v["scenes"])
    # Audio: bestehender Synth-Beat; 'stat'-Pop beim Reveal
    av = {"scenes": [dict(s, type=("stat" if s["type"] in ("reveal", "rank") else s["type"])) for s in v["scenes"]]}
    wav = f"{dv.SCR}/{v['slug']}.wav"; dv.audio(av, wav)
    out = f"{out_dir}/{v['slug']}.mp4"
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                          "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
                          "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for i in range(int(total * FPS)): p.stdin.write(frame(v, i / FPS).tobytes())
    p.stdin.close(); p.wait()
    return out, total
