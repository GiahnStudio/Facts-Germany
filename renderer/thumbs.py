"""Thumbnails (1280x720) und Kanal-Grafiken."""
from PIL import Image, ImageDraw, ImageFilter

from core import (AMBER, BG, BRAND, COLORS, INK, RED, WHITE, background, chip, font, icon, stamp,
                  text_block, tw)


def glow(img, color=(255, 184, 0), r=60):
    a = img.getchannel("A").filter(ImageFilter.GaussianBlur(r))
    g = Image.new("RGBA", img.size, color + (0,))
    g.putalpha(a.point(lambda v: int(v * 0.55)))
    return g


def thumbnail(th):
    W, H = 1280, 720
    base = background(1920, 1080).resize((W, H), Image.LANCZOS).convert("RGBA")
    # Logo-Ecke neu (größer lesbar)
    d = ImageDraw.Draw(base)
    d.rectangle((0, 0, 560, 110), fill=BG)
    p = icon("para", 64)
    base.alpha_composite(p, (44, 30))
    d.text((122, 38), BRAND, font=font(40, "Black"), fill=WHITE)
    # Icon links
    ic = icon(th.get("icon", "door"), th.get("icon_size", 400))
    pad = Image.new("RGBA", (ic.width + 200, ic.height + 200), (0, 0, 0, 0))
    pad.alpha_composite(ic, (100, 100))
    base.alpha_composite(glow(pad), (th.get("icon_x", 20), th.get("icon_y", 150)))
    base.alpha_composite(pad, (th.get("icon_x", 20), th.get("icon_y", 150)))
    # Großer Text rechts
    x0 = th.get("text_x", 560)
    big = text_block(th["big"], th.get("big_size", 118), W - x0 - 40, WHITE, "Black", "left", 1.02)
    y = th.get("text_y", 150)
    base.alpha_composite(big, (x0, y))
    y += big.height + 30
    if th.get("chip"):
        c = chip(th["chip"], 52, INK, AMBER, 30, 16)
        base.alpha_composite(c, (x0, y))
        y += c.height + 20
    if th.get("stamp"):
        st = stamp(th["stamp"], COLORS[th.get("stamp_color", "red")], th.get("stamp_size", 86))
        sx = th.get("stamp_x", W - st.width - 30)
        sy = th.get("stamp_y", H - st.height - 20)
        base.alpha_composite(st, (sx, sy))
    return base.convert("RGB")


def channel_assets(out):
    import os
    os.makedirs(out, exist_ok=True)
    # Profilbild
    S = 800
    pb = Image.new("RGB", (S, S), BG)
    p = icon("para", 500)
    pb.paste(p, ((S - 500) // 2 - 30, (S - 500) // 2 - 40), p)
    q = text_block("?", 210, 160, WHITE, "Black", "center")
    pb.paste(q, (520, 400), q)
    pb.save(f"{out}/profilbild_800.png")
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).ellipse((0, 0, S, S), fill=255)
    rund = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rund.paste(pb, (0, 0), m)
    rund.save(f"{out}/vorschau_profilbild_rund.png")
    # Wasserzeichen
    wz = icon("para", 150)
    wz.save(f"{out}/wasserzeichen_150.png")
    # Banner 2560x1440, sichere Zone 1546x423 in der Mitte
    W, H = 2560, 1440
    bn = background(W, H).copy().convert("RGBA")
    d = ImageDraw.Draw(bn)
    d.rectangle((0, 0, 700, 200), fill=BG)  # Logo aus dem Hintergrund entfernen
    cx, cy = W // 2, H // 2
    title = text_block("DARF DER DAS?", 150, 1500, WHITE, "Black", "center")
    bn.alpha_composite(title, (cx - title.width // 2, cy - 120))
    sub = text_block("Alltagsrecht in Deutschland. Kurz, klar, mit echten Urteilen.", 50, 1500,
                     (226, 221, 210), "SemiBold", "center")
    bn.alpha_composite(sub, (cx - sub.width // 2, cy + 60))
    c = chip("JEDEN FREITAG NEU", 40, WHITE, RED, 32, 14)
    bn.alpha_composite(c, (cx + 560 - c.width, cy - 190))
    for name, x, y, s in (("gavel", 150, cy - 170, 300), ("key", 2110, cy - 150, 300)):
        ic = icon(name, s, color=WHITE)
        bn.alpha_composite(ic, (x, y))
    bn.convert("RGB").save(f"{out}/banner_2560x1440.png")
    prev = bn.copy()
    ImageDraw.Draw(prev).rectangle((cx - 773, cy - 211, cx + 773, cy + 211), outline=(255, 0, 0, 255), width=6)
    prev.convert("RGB").save(f"{out}/vorschau_banner_safe_area.png")
