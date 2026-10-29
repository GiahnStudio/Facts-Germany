"""Stilisierte Comic-Avatare aus Merkmalen (keine Porträts, keine Fotos).
look = {skin, hair, hair_col, beard, beard_col, glasses, lips, shirt, acc:[chain, headphones, hoops, studs]}"""
from functools import lru_cache
from PIL import Image, ImageDraw, ImageChops

S = 600
SKIN = {"light": (246, 214, 190), "fair": (236, 196, 166), "tan": (214, 166, 128), "medium": (184, 132, 96),
        "brown": (150, 100, 70), "dark": (110, 72, 50)}

def _m():
    return Image.new("L", (S, S), 0)

def _shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c)

HEAD = [190, 135, 410, 405]

def _head_mask():
    m = _m(); ImageDraw.Draw(m).ellipse(HEAD, fill=255); return m

def _paint(img, mask, col):
    img.paste(Image.new("RGBA", (S, S), col + (255,)), (0, 0), mask)

def draw_look(look, bg):
    img = Image.new("RGBA", (S, S), bg + (255,)); d = ImageDraw.Draw(img)
    # dezenter Hintergrundverlauf
    for i in range(0, S, 6):
        d.rectangle([0, i, S, i + 6], fill=_shade(bg, 1.15 - 0.35 * i / S) + (255,))
    skin = SKIN[look.get("skin", "fair")]; hc = look.get("hair_col", (40, 30, 25)); style = look.get("hair", "short")
    shirt = look.get("shirt", (40, 40, 50))
    # lange Haare hinten
    if style in ("long", "long_bangs", "wavy"):
        hm = _m(); hd = ImageDraw.Draw(hm)
        hd.rounded_rectangle([165, 150, 435, 560], radius=110, fill=255)
        if style == "wavy":
            for y in range(260, 560, 55):
                hd.ellipse([140, y, 210, y + 80], fill=255); hd.ellipse([390, y, 460, y + 80], fill=255)
        _paint(img, hm, _shade(hc, 0.85))
    # Körper
    d.ellipse([70, 440, 530, 820], fill=shirt + (255,))
    d.polygon([(255, 440), (345, 440), (300, 500)], fill=_shade(skin, 0.92) + (255,))  # V-Ausschnitt
    d.rectangle([262, 370, 338, 455], fill=_shade(skin, 0.9) + (255,))  # Hals
    # Ohren + Kopf
    for x in (178, 392):
        d.ellipse([x, 245, x + 30, 315], fill=_shade(skin, 0.95) + (255,))
    d.ellipse(HEAD, fill=skin + (255,))
    # Bart
    beard = look.get("beard")
    if beard:
        bc = look.get("beard_col", hc)
        bm = _m(); bd = ImageDraw.Draw(bm); bd.ellipse([HEAD[0] - 4, HEAD[1], HEAD[2] + 4, HEAD[3] + (14 if beard == "full" else 6)], fill=255)
        cut = _m(); ImageDraw.Draw(cut).rectangle([0, 312 if beard != "goatee" else 335, S, S], fill=255)
        bm = ImageChops.multiply(bm, cut)
        if beard == "goatee":
            g = _m(); ImageDraw.Draw(g).ellipse([250, 300, 350, 425], fill=255); bm = ImageChops.multiply(bm, g)
        if beard == "short":
            g = _m(); ImageDraw.Draw(g).ellipse([222, 230, 378, 422], fill=255); bm = ImageChops.multiply(bm, g)
        if beard == "stubble":
            bm = bm.point(lambda v: int(v * 0.3))
        _paint(img, bm, bc)
        if beard in ("short", "full", "goatee"):  # Schnurrbart
            ImageDraw.Draw(img).rounded_rectangle([262, 322, 338, 342], radius=10, fill=bc + (255,))
    d = ImageDraw.Draw(img)
    # Gesicht
    ink = (40, 28, 26)
    for x in (255, 345):
        d.ellipse([x - 11, 258, x + 11, 284], fill=ink + (255,))
        d.ellipse([x - 4, 263, x + 2, 270], fill=(255, 255, 255, 255))
    bcol = _shade(hc, 0.9) if style != "bald" else _shade(skin, 0.6)
    d.line([232, 238, 276, 232], fill=bcol + (255,), width=9); d.line([324, 232, 368, 238], fill=bcol + (255,), width=9)
    d.arc([286, 285, 314, 312], 20, 160, fill=_shade(skin, 0.72) + (255,), width=5)
    if look.get("lips"):
        d.chord([266, 336, 334, 372], 0, 180, fill=look["lips"] + (255,))
        d.line([268, 352, 332, 352], fill=_shade(look["lips"], 0.7) + (255,), width=3)
    else:
        d.arc([268, 322, 332, 362], 25, 155, fill=(120, 50, 50, 255), width=6)
    d.ellipse([222, 300, 252, 318], fill=(240, 130, 120, 60)); d.ellipse([348, 300, 378, 318], fill=(240, 130, 120, 60))
    # Haare vorne
    if style != "bald":
        top = _m(); td = ImageDraw.Draw(top)
        if style == "buzz":
            td.ellipse([186, 122, 414, 360], fill=255); line = 175
        else:
            td.ellipse([176, 108, 424, 380], fill=255); line = {"short": 185, "long": 190, "wavy": 190, "long_bangs": 232, "bun": 205, "curly": 215}.get(style, 210)
        cut = _m(); cd = ImageDraw.Draw(cut)
        if style == "long_bangs":
            cd.rectangle([0, 0, S, line], fill=255)
            cd.rectangle([0, 0, 212, 380], fill=255); cd.rectangle([388, 0, S, 380], fill=255)
        else:
            cut = Image.new("L", (S, S), 255); cd = ImageDraw.Draw(cut)
            w = 112 if style not in ("long", "wavy") else 104
            cd.ellipse([300 - w, line, 300 + w, line + 300], fill=0)
            if style in ("buzz", "short", "curly", "bun"):
                cd.rectangle([0, 300, S, S], fill=0)
        hm = ImageChops.multiply(top, cut)
        if style == "curly":
            h2 = ImageDraw.Draw(hm)
            for x in range(185, 420, 38): h2.ellipse([x - 30, 95, x + 30, 160], fill=255)
        if style == "bun":
            ImageDraw.Draw(hm).ellipse([255, 55, 345, 140], fill=255)
        _paint(img, hm, hc)
        # Glanzlicht
        hl = ImageChops.multiply(hm, _ellipse_mask([230, 120, 330, 170])).point(lambda v: int(v * 0.25))
        _paint(img, hl, (255, 255, 255))
    d = ImageDraw.Draw(img)
    # Brille
    g = look.get("glasses")
    if g == "sun":
        for x in (255, 345):
            d.rounded_rectangle([x - 38, 250, x + 38, 292], radius=16, fill=(20, 20, 26, 255))
            d.line([x - 20, 258, x - 6, 258], fill=(110, 110, 130, 255), width=4)
        d.line([293, 262, 307, 262], fill=(20, 20, 26, 255), width=7)
    elif g == "round":
        for x in (255, 345): d.ellipse([x - 32, 240, x + 32, 302], outline=(30, 30, 30, 255), width=6)
        d.line([287, 268, 313, 268], fill=(30, 30, 30, 255), width=6)
    # Accessoires
    acc = look.get("acc", [])
    gold = (240, 190, 60)
    if "chain" in acc:
        d.arc([215, 380, 385, 545], 20, 160, fill=gold + (255,), width=10)
        d.ellipse([286, 520, 314, 552], fill=gold + (255,))
    if "headphones" in acc:
        d.arc([150, 400, 450, 560], 190, 350, fill=(30, 30, 34, 255), width=22)
        for x in (140, 384):
            d.ellipse([x, 420, x + 76, 530], fill=(200, 30, 40, 255))
            d.ellipse([x + 18, 440, x + 58, 510], fill=(150, 20, 30, 255))
    if "hoops" in acc:
        for x in (186, 414): d.ellipse([x - 18, 305, x + 18, 352], outline=gold + (255,), width=6)
    if "studs" in acc:
        for x in (190, 410): d.ellipse([x - 8, 305, x + 8, 321], fill=(235, 235, 250, 255))
    return img

def _ellipse_mask(b):
    m = _m(); ImageDraw.Draw(m).ellipse(b, fill=255); return m

_KEY = {}
def look_key(look, bg):
    k = repr(sorted(look.items())) + repr(bg)
    _KEY.setdefault(k, (look, bg)); return k

@lru_cache(maxsize=256)
def rendered(key, size):
    look, bg = _KEY[key]
    im = draw_look(look, bg).crop((105, 85, 495, 475)).resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im
