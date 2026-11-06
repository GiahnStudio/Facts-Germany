"""Durchschaut – Zeichen-Engine (Pillow).

Jede Szene wird in "Blöcke" (RGBA-Sprites) zerlegt, die zu einem Zeitpunkt
(an ein gesprochenes Wort gekoppelt) einblenden. Statische Frames werden
wiederverwendet, damit das Rendern schnell bleibt.
"""
import math
import os
from functools import lru_cache

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "fonts")

BG = (13, 21, 36)
GRID = (21, 32, 52)
CARD = (247, 244, 237)
INK = (16, 19, 27)
MUTED = (108, 114, 126)
SOFT = (226, 221, 210)
AMBER = (40, 214, 186)  # Akzentfarbe Türkis
RED = (226, 55, 52)
GREEN = (36, 168, 106)
BLUE = (66, 128, 230)
WHITE = (255, 255, 255)
YELLOW = (255, 196, 0)
COLORS = {"yellow": YELLOW, "red": RED, "green": GREEN, "amber": AMBER, "blue": BLUE, "ink": INK}

BRAND = "DURCHSCHAUT"


@lru_cache(maxsize=None)
def font(size, weight="Bold"):
    return ImageFont.truetype(os.path.join(FONTS, f"Inter-{weight}.otf"), int(size))


def tw(text, f):
    b = f.getbbox(text)
    return b[2] - b[0]


def wrap(text, f, width):
    lines = []
    for para in text.split("\n"):
        words, cur = para.split(), ""
        for w in words:
            t = (cur + " " + w).strip()
            if tw(t, f) <= width or not cur:
                cur = t
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
    return lines


def text_block(text, size, width, color=INK, weight="Bold", align="left", lh=1.22):
    f = font(size, weight)
    lines = wrap(text, f, width)
    asc, desc = f.getmetrics()
    line_h = int(size * lh)
    h = line_h * (len(lines) - 1) + asc + desc
    real_w = max(tw(l, f) for l in lines) if lines else 1
    W = width if align != "tight" else real_w
    img = Image.new("RGBA", (max(1, W), max(1, h)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, l in enumerate(lines):
        x = 0
        if align == "center":
            x = (W - tw(l, f)) // 2
        d.text((x - f.getbbox(l)[0], i * line_h), l, font=f, fill=color)
    return img


def rounded(w, h, r, fill, outline=None, ow=0, shadow=False):
    pad = 30 if shadow else 0
    img = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 10, pad + w, pad + h + 10), r, fill=(0, 0, 0, 110))
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(14)))
    ImageDraw.Draw(img).rounded_rectangle((pad, pad, pad + w - 1, pad + h - 1), r, fill=fill,
                                          outline=outline, width=ow)
    return img, pad


def card(content_imgs, width, pad=56, gap=26, fill=CARD, r=34, accent=None, shadow=True):
    """Stapelt Bilder vertikal auf eine Karte."""
    h = pad * 2 + sum(i.height for i in content_imgs) + gap * (len(content_imgs) - 1)
    img, sp = rounded(width, h, r, fill, shadow=shadow)
    if accent:
        ImageDraw.Draw(img).rounded_rectangle((sp, sp, sp + 14, sp + h - 1), 7, fill=accent)
    y = sp + pad
    for c in content_imgs:
        img.alpha_composite(c, (sp + pad + (12 if accent else 0), y))
        y += c.height + gap
    return img, sp


def chip(text, size=34, fg=INK, bg=AMBER, padx=26, pady=12, weight="ExtraBold"):
    f = font(size, weight)
    w = tw(text, f) + 2 * padx
    asc, desc = f.getmetrics()
    h = asc + desc + 2 * pady - 6
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), h // 2, fill=bg)
    d.text((padx - f.getbbox(text)[0], pady - 4), text, font=f, fill=fg)
    return img


def stamp(text, color, size=78):
    f = font(size, "Black")
    w = tw(text, f) + 80
    asc, desc = f.getmetrics()
    h = asc + desc + 36
    img = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((20, 20, 20 + w, 20 + h), 18, outline=color + (255,), width=10)
    d.rounded_rectangle((34, 34, 6 + w, 6 + h), 10, outline=color + (150,), width=3)
    d.text((60 - f.getbbox(text)[0], 30), text, font=f, fill=color)
    return img.rotate(-7, resample=Image.BICUBIC, expand=True)


# ---------------------------------------------------------------- Icons
def icon(name, s=300, color=INK, accent=AMBER):
    S = s * 2
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    lw = S // 22
    if name == "door":
        d.rounded_rectangle((S * .27, S * .08, S * .73, S * .94), S * .03, fill=color)
        d.rounded_rectangle((S * .33, S * .15, S * .67, S * .48), S * .02, fill=accent)
        d.rounded_rectangle((S * .33, S * .54, S * .67, S * .87), S * .02, fill=(60, 66, 80))
        d.ellipse((S * .6, S * .5, S * .66, S * .56), fill=WHITE)
    elif name == "key":
        d.ellipse((S * .1, S * .3, S * .48, S * .68), fill=accent)
        d.ellipse((S * .2, S * .43, S * .3, S * .53), fill=(0, 0, 0, 0))
        d.rectangle((S * .44, S * .45, S * .9, S * .53), fill=accent)
        d.rectangle((S * .74, S * .53, S * .8, S * .66), fill=accent)
        d.rectangle((S * .84, S * .53, S * .9, S * .62), fill=accent)
    elif name == "drop":
        d.polygon([(S * .5, S * .06), (S * .22, S * .55), (S * .78, S * .55)], fill=BLUE)
        d.ellipse((S * .2, S * .36, S * .8, S * .94), fill=BLUE)
        d.ellipse((S * .33, S * .58, S * .43, S * .72), fill=(200, 225, 255))
    elif name == "flame":
        d.ellipse((S * .2, S * .38, S * .8, S * .95), fill=RED)
        d.polygon([(S * .5, S * .04), (S * .2, S * .62), (S * .8, S * .62)], fill=RED)
        d.ellipse((S * .34, S * .6, S * .66, S * .92), fill=AMBER)
        d.polygon([(S * .5, S * .38), (S * .34, S * .74), (S * .66, S * .74)], fill=AMBER)
    elif name == "camera":
        d.rounded_rectangle((S * .08, S * .28, S * .92, S * .82), S * .07, fill=color)
        d.rounded_rectangle((S * .32, S * .18, S * .6, S * .32), S * .03, fill=color)
        d.ellipse((S * .32, S * .36, S * .68, S * .74), fill=accent)
        d.ellipse((S * .41, S * .45, S * .59, S * .65), fill=color)
    elif name == "calendar":
        d.rounded_rectangle((S * .1, S * .16, S * .9, S * .9), S * .06, fill=WHITE, outline=color, width=lw)
        d.rectangle((S * .1 + lw / 2, S * .16 + lw / 2, S * .9 - lw / 2, S * .36), fill=RED)
        for i in range(3):
            for j in range(3):
                x, y = S * (.22 + i * .2), S * (.45 + j * .14)
                d.rounded_rectangle((x, y, x + S * .12, y + S * .08), 6, fill=color if (i, j) != (1, 1) else accent)
        d.rectangle((S * .28, S * .08, S * .34, S * .24), fill=color)
        d.rectangle((S * .66, S * .08, S * .72, S * .24), fill=color)
    elif name == "smoke":
        d.ellipse((S * .1, S * .3, S * .9, S * .7), fill=WHITE, outline=color, width=lw)
        d.ellipse((S * .38, S * .42, S * .62, S * .58), fill=SOFT, outline=color, width=lw // 2)
        d.ellipse((S * .7, S * .46, S * .76, S * .52), fill=RED)
    elif name == "house":
        d.polygon([(S * .5, S * .08), (S * .06, S * .48), (S * .94, S * .48)], fill=accent)
        d.rectangle((S * .16, S * .46, S * .84, S * .92), fill=color)
        d.rounded_rectangle((S * .42, S * .62, S * .58, S * .92), S * .02, fill=accent)
    elif name == "gavel":
        g = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        gd = ImageDraw.Draw(g)
        gd.rounded_rectangle((S * .3, S * .2, S * .7, S * .42), S * .04, fill=color)
        gd.rectangle((S * .26, S * .23, S * .3, S * .39), fill=accent)
        gd.rectangle((S * .7, S * .23, S * .74, S * .39), fill=accent)
        gd.rounded_rectangle((S * .47, S * .4, S * .53, S * .85), S * .02, fill=(120, 80, 40))
        g = g.rotate(35, resample=Image.BICUBIC, center=(S * .5, S * .5))
        img.alpha_composite(g)
        d.rounded_rectangle((S * .5, S * .82, S * .95, S * .92), S * .02, fill=color)
    elif name == "para":
        d.ellipse((S * .04, S * .04, S * .96, S * .96), fill=accent)
        f = font(S * .62, "Black")
        bx = f.getbbox("§")
        d.text((S / 2 - (bx[0] + bx[2]) / 2, S / 2 - (bx[1] + bx[3]) / 2), "§", font=f, fill=color)
    elif name == "warn":
        d.polygon([(S * .5, S * .08), (S * .04, S * .9), (S * .96, S * .9)], fill=accent)
        d.rounded_rectangle((S * .46, S * .34, S * .54, S * .66), 8, fill=color)
        d.ellipse((S * .45, S * .72, S * .55, S * .82), fill=color)
    elif name == "person":
        d.ellipse((S * .34, S * .08, S * .66, S * .4), fill=color)
        d.rounded_rectangle((S * .2, S * .45, S * .8, S * .95), S * .2, fill=color)
    elif name == "bell":
        d.ellipse((S * .2, S * .15, S * .8, S * .75), fill=accent)
        d.rectangle((S * .2, S * .45, S * .8, S * .78), fill=accent)
        d.rounded_rectangle((S * .1, S * .72, S * .9, S * .82), 10, fill=accent)
        d.ellipse((S * .42, S * .8, S * .58, S * .94), fill=accent)
    elif name == "lens":
        d.ellipse((S * .04, S * .04, S * .96, S * .96), fill=accent)
        d.ellipse((S * .2, S * .18, S * .66, S * .64), outline=color, width=int(S * .08))
        d.line((S * .6, S * .58, S * .8, S * .8), fill=color, width=int(S * .11))
    elif name == "bottle":
        d.rounded_rectangle((S * .42, S * .04, S * .58, S * .14), S * .02, fill=accent)
        d.polygon([(S * .43, S * .14), (S * .57, S * .14), (S * .68, S * .32), (S * .32, S * .32)], fill=(120, 190, 240))
        d.rounded_rectangle((S * .3, S * .28, S * .7, S * .96), S * .07, fill=(120, 190, 240))
        d.rectangle((S * .3, S * .5, S * .7, S * .74), fill=WHITE)
        d.rectangle((S * .36, S * .55, S * .64, S * .69), fill=color)
        for i in range(7):
            d.rectangle((S * (.38 + i * .035), S * .57, S * (.38 + i * .035) + S * .015, S * .67), fill=WHITE)
    elif name == "can":
        d.rounded_rectangle((S * .28, S * .1, S * .72, S * .92), S * .06, fill=(200, 205, 214))
        d.rectangle((S * .28, S * .3, S * .72, S * .74), fill=RED)
        d.ellipse((S * .28, S * .04, S * .72, S * .16), fill=(170, 176, 186))
        d.ellipse((S * .44, S * .4, S * .56, S * .64), fill=WHITE)
    elif name == "coin":
        d.ellipse((S * .06, S * .06, S * .94, S * .94), fill=YELLOW)
        d.ellipse((S * .16, S * .16, S * .84, S * .84), outline=(200, 140, 0), width=int(S * .03))
        f = font(S * .34, "Black")
        bx = f.getbbox("25")
        d.text((S / 2 - (bx[0] + bx[2]) / 2, S / 2 - (bx[1] + bx[3]) / 2), "25", font=f, fill=(120, 80, 0))
    elif name == "barcode":
        d.rounded_rectangle((S * .06, S * .2, S * .94, S * .8), S * .05, fill=WHITE)
        import random
        rnd = random.Random(4)
        x = S * .14
        while x < S * .84:
            w = S * rnd.choice([.012, .02, .035])
            d.rectangle((x, S * .28, x + w, S * .66), fill=color)
            x += w + S * rnd.choice([.012, .02])
        d.rectangle((S * .1, S * .48, S * .9, S * .5), fill=RED)
    elif name == "eye":
        d.ellipse((S * .04, S * .25, S * .96, S * .75), fill=WHITE)
        d.ellipse((S * .32, S * .27, S * .68, S * .73), fill=accent)
        d.ellipse((S * .42, S * .38, S * .58, S * .62), fill=color)
    elif name == "chip":
        d.rounded_rectangle((S * .2, S * .2, S * .8, S * .8), S * .06, fill=color)
        d.rounded_rectangle((S * .32, S * .32, S * .68, S * .68), S * .03, fill=accent)
        for i in range(4):
            o = S * (.28 + i * .13)
            for (a, b, c, e) in ((o, S * .08, o + S * .05, S * .2), (o, S * .8, o + S * .05, S * .92),
                                 (S * .08, o, S * .2, o + S * .05), (S * .8, o, S * .92, o + S * .05)):
                d.rectangle((a, b, c, e), fill=color)
    elif name == "press":
        d.rectangle((S * .15, S * .1, S * .85, S * .26), fill=color)
        d.rectangle((S * .44, S * .26, S * .56, S * .44), fill=(90, 96, 110))
        d.rectangle((S * .25, S * .44, S * .75, S * .54), fill=color)
        d.polygon([(S * .3, S * .62), (S * .7, S * .62), (S * .76, S * .9), (S * .24, S * .9)], fill=(120, 190, 240))
        d.rectangle((S * .1, S * .9, S * .9, S * .96), fill=color)
    elif name == "crate":
        d.rounded_rectangle((S * .08, S * .4, S * .92, S * .92), S * .04, fill=accent)
        for i in range(4):
            x = S * (.16 + i * .19)
            d.rounded_rectangle((x, S * .1, x + S * .12, S * .5), S * .04, fill=(70, 120, 60))
        d.rectangle((S * .18, S * .56, S * .82, S * .64), fill=(0, 0, 0, 60))
    elif name == "recycle":
        import math as _m
        for k in range(3):
            a0 = k * 120 + 15
            d.arc((S * .14, S * .14, S * .86, S * .86), a0, a0 + 85, fill=GREEN, width=int(S * .1))
            a = _m.radians(a0 + 92)
            cx, cy = S * .5 + S * .36 * _m.cos(a), S * .5 + S * .36 * _m.sin(a)
            t = _m.radians(a0 + 182)
            r = S * .1
            d.polygon([(cx + r * _m.cos(t + _m.pi / 2), cy + r * _m.sin(t + _m.pi / 2)),
                       (cx - r * _m.cos(t + _m.pi / 2), cy - r * _m.sin(t + _m.pi / 2)),
                       (cx + r * 1.4 * _m.cos(t + _m.pi), cy + r * 1.4 * _m.sin(t + _m.pi))], fill=GREEN)
    elif name == "factory":
        d.polygon([(S * .06, S * .9), (S * .06, S * .5), (S * .3, S * .36), (S * .3, S * .5), (S * .54, S * .36),
                   (S * .54, S * .5), (S * .78, S * .36), (S * .78, S * .9)], fill=color)
        d.rectangle((S * .8, S * .14, S * .92, S * .9), fill=color)
        for i in range(3):
            d.rectangle((S * (.12 + i * .22), S * .62, S * (.22 + i * .22), S * .74), fill=accent)
    elif name == "shop":
        d.rectangle((S * .1, S * .42, S * .9, S * .92), fill=color)
        for i in range(5):
            d.rectangle((S * (.06 + i * .176), S * .2, S * (.06 + (i + 1) * .176), S * .42),
                        fill=accent if i % 2 == 0 else WHITE)
        d.rectangle((S * .4, S * .6, S * .6, S * .92), fill=accent)
    elif name == "receipt":
        d.polygon([(S * .2, S * .06), (S * .8, S * .06), (S * .8, S * .94), (S * .7, S * .88), (S * .6, S * .94),
                   (S * .5, S * .88), (S * .4, S * .94), (S * .3, S * .88), (S * .2, S * .94)], fill=WHITE)
        for i in range(4):
            d.rectangle((S * .3, S * (.2 + i * .12), S * (.6 if i % 2 else .7), S * (.24 + i * .12)), fill=(170, 175, 185))
        d.rectangle((S * .3, S * .7, S * .7, S * .76), fill=color)
    elif name == "server":
        for i in range(3):
            y = S * (.12 + i * .27)
            d.rounded_rectangle((S * .14, y, S * .86, y + S * .22), S * .04, fill=color)
            d.ellipse((S * .7, y + S * .08, S * .76, y + S * .14), fill=accent)
            d.rectangle((S * .22, y + S * .09, S * .5, y + S * .13), fill=(90, 96, 110))
    elif name == "wash":
        d.ellipse((S * .1, S * .1, S * .9, S * .9), fill=(120, 190, 240))
        for (x, y, r) in ((.35, .4, .1), (.6, .35, .07), (.55, .6, .12), (.3, .65, .06)):
            d.ellipse((S * (x - r), S * (y - r), S * (x + r), S * (y + r)), outline=WHITE, width=int(S * .025))
    else:
        d.ellipse((S * .1, S * .1, S * .9, S * .9), fill=accent)
    return img.resize((s, s), Image.LANCZOS)


def check_box(s, state, color=GREEN):
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if state == "x":
        d.rounded_rectangle((0, 0, s - 1, s - 1), s // 5, fill=RED)
        m = s * .28
        d.line((m, m, s - m, s - m), fill=WHITE, width=s // 9)
        d.line((m, s - m, s - m, m), fill=WHITE, width=s // 9)
    elif state == "ok":
        d.rounded_rectangle((0, 0, s - 1, s - 1), s // 5, fill=color)
        d.line((s * .22, s * .52, s * .43, s * .72, s * .78, s * .3), fill=WHITE, width=s // 9, joint="curve")
    else:
        d.rounded_rectangle((0, 0, s - 1, s - 1), s // 5, outline=MUTED, width=s // 12)
    return img


# ---------------------------------------------------------------- Background
@lru_cache(maxsize=4)
def background(W, H):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    step = 80
    for x in range(0, W, step):
        d.line((x, 0, x, H), fill=GRID, width=2)
    for y in range(0, H, step):
        d.line((0, y, W, y), fill=GRID, width=2)
    # Vignette
    v = Image.new("L", (W, H), 0)
    ImageDraw.Draw(v).ellipse((-W * .3, -H * .3, W * 1.3, H * 1.3), fill=255)
    v = v.filter(ImageFilter.GaussianBlur(min(W, H) // 5))
    dark = Image.new("RGB", (W, H), (6, 10, 18))
    img = Image.composite(img, dark, v)
    # Logo
    vertical = H > W
    lx, ly = (70, 60) if not vertical else (70, 150)
    para = icon("lens", 64)
    img.paste(para, (lx, ly), para)
    f = font(36, "Black")
    ImageDraw.Draw(img).text((lx + 84, ly + 10), BRAND, font=f, fill=WHITE)
    return img


# ---------------------------------------------------------------- Easing
def ease(p):
    p = max(0.0, min(1.0, p))
    return 1 - (1 - p) ** 3


def back(p):
    p = max(0.0, min(1.0, p))
    c1, c3 = 1.9, 2.9
    return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2


class Block:
    def __init__(self, img, x, y, t=0.0, anim="rise", t2=None, img2=None, dim_t=None):
        self.img, self.x, self.y, self.t = img, int(x), int(y), t
        self.anim, self.t2, self.img2, self.dim_t = anim, t2, img2, dim_t

    def state(self, t):
        if t < self.t:
            return None
        dur = 0.32 if self.anim == "stamp" else 0.42
        p = min(1.0, (t - self.t) / dur)
        p = round(p, 2)
        alt = self.t2 is not None and t >= self.t2
        dim = self.dim_t is not None and t >= self.dim_t
        dp = round(min(1.0, (t - self.dim_t) / 0.3), 2) if dim else 0
        ap = round(min(1.0, (t - self.t2) / 0.3), 2) if alt else 0
        return (p, ap, dp)

    def draw(self, frame, st):
        p, ap, dp = st
        img = self.img2 if (self.img2 is not None and ap > 0) else self.img
        alpha = ease(p) * (1 - 0.62 * ease(dp))
        x, y = self.x, self.y
        if self.anim == "rise":
            y += int((1 - ease(p)) * 40)
        elif self.anim == "left":
            x -= int((1 - ease(p)) * 60)
        elif self.anim == "stamp":
            sc = 1.8 - 0.8 * ease(p)
            if sc != 1.0:
                nw, nh = int(img.width * sc), int(img.height * sc)
                img = img.resize((nw, nh), Image.BILINEAR)
                x -= (nw - self.img.width) // 2
                y -= (nh - self.img.height) // 2
            alpha = min(1.0, p * 2.2)
        elif self.anim == "pop":
            sc = 0.6 + 0.4 * back(p)
            if abs(sc - 1.0) > 1e-3:
                nw, nh = max(1, int(img.width * sc)), max(1, int(img.height * sc))
                img = img.resize((nw, nh), Image.BILINEAR)
                x -= (nw - self.img.width) // 2
                y -= (nh - self.img.height) // 2
        if alpha <= 0.01:
            return
        if alpha < 0.999:
            a = img.getchannel("A").point(lambda v: int(v * alpha))
            img = img.copy()
            img.putalpha(a)
        frame.paste(img, (x, y), img)
