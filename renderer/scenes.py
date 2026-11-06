"""Szenen-Typen -> Blöcke. Ein Layout für 16:9 und 9:16 (vertikal gestapelt)."""
from PIL import Image, ImageDraw

from core import (AMBER, BLUE, CARD, COLORS, GREEN, INK, MUTED, RED, SOFT, WHITE, Block, card, check_box,
                  chip, font, icon, rounded, stamp, text_block, tw)


class Layout:
    def __init__(self, W, H):
        self.W, self.H = W, H
        self.v = H > W
        self.CW = 940 if self.v else 1500
        self.top = 300 if self.v else 150
        self.bottom = 1380 if self.v else H - 80
        self.k = 0.95 if self.v else 1.16

    def s(self, x):
        return int(x * self.k)


def stack(L, rows, gap=34, hgap=30, align="center", maxw=None):
    """rows: Liste von Zeilen, jede Zeile = Liste von Items (dict mit img, t, ...).
    Gibt Blocks zurück; Items bekommen 'x','y' gesetzt."""
    # Zeilen umbrechen, falls zu breit
    real = []
    for row in rows:
        cur, w = [], 0
        for it in row:
            iw = it["img"].width
            if cur and w + hgap + iw > (maxw or L.CW + 60):
                real.append(cur)
                cur, w = [], 0
            cur.append(it)
            w += (hgap if len(cur) > 1 else 0) + iw
        if cur:
            real.append(cur)
    heights = [max(it["img"].height for it in r) for r in real]
    total = sum(heights) + gap * (len(real) - 1)
    y = L.top + max(0, (L.bottom - L.top - total) // 2)
    blocks = []
    for r, h in zip(real, heights):
        rw = sum(it["img"].width for it in r) + hgap * (len(r) - 1)
        if align == "left":
            x = (L.W - L.CW) // 2 - 30
        else:
            x = (L.W - rw) // 2
        for it in r:
            it["x"], it["y"] = x, y + (h - it["img"].height) // 2
            blocks.append(Block(it["img"], x, it["y"], it.get("t", 0), it.get("anim", "rise"),
                                it.get("t2"), it.get("img2"), it.get("dim_t")))
            x += it["img"].width + hgap
        y += h + gap
    return blocks


def heading(L, text, size=64, color=WHITE, width=None, align="center"):
    return text_block(text, L.s(size), width or L.CW, color, "Black", align)


# ---------------------------------------------------------------- Builder
def build(scene, L, cue):
    fn = globals()["sc_" + scene["type"]]
    return fn(scene, L, cue)


def sc_title(sc, L, cue):
    rows = []
    t = 0.0
    if sc.get("kicker"):
        rows.append([{"img": chip(sc["kicker"], L.s(34)), "t": t}])
    if sc.get("icon"):
        rows.append([{"img": icon(sc["icon"], L.s(sc.get("icon_size", 300))), "t": 0.1, "anim": "pop"}])
    rows.append([{"img": heading(L, sc["text"], sc.get("size", 108), align="center"), "t": 0.15}])
    if sc.get("sub"):
        rows.append([{"img": text_block(sc["sub"], L.s(46), L.CW, SOFT, "SemiBold", "center"),
                      "t": cue(sc.get("sub_at"), 0.4)}])
    if sc.get("stamp"):
        rows.append([{"img": stamp(sc["stamp"], COLORS[sc.get("stamp_color", "red")], L.s(76)),
                      "t": cue(sc.get("stamp_at"), 0.7), "anim": "stamp"}])
    return stack(L, rows)


def sc_chips(sc, L, cue):
    rows = [[{"img": heading(L, sc["title"], 70), "t": 0}]]
    row = []
    for i, c in enumerate(sc["items"]):
        text, at = (c, None) if isinstance(c, str) else (c["text"], c.get("at"))
        row.append({"img": chip(text, L.s(44), INK, [AMBER, WHITE, SOFT][i % 3], 34, 18),
                    "t": cue(at, 0.25 + 0.6 * i / max(1, len(sc["items"]))), "anim": "pop"})
    rows.append(row)
    return stack(L, rows, hgap=26)


def option_card(L, letter, text, state="normal"):
    w = L.CW
    f_l = font(L.s(52), "Black")
    t_img = text_block(text, L.s(46), w - 230, INK, "Bold")
    h = max(130, t_img.height + 70)
    border = {"ok": GREEN, "bad": RED}.get(state)
    img, sp = rounded(w, h, 28, CARD, outline=border, ow=8 if border else 0, shadow=True)
    d = ImageDraw.Draw(img)
    cx, cy = sp + 75, sp + h // 2
    circ = {"ok": GREEN}.get(state, INK)
    d.ellipse((cx - 44, cy - 44, cx + 44, cy + 44), fill=circ)
    bb = f_l.getbbox(letter)
    d.text((cx - (bb[0] + bb[2]) / 2, cy - (bb[1] + bb[3]) / 2), letter, font=f_l, fill=WHITE)
    img.alpha_composite(t_img, (sp + 150, sp + (h - t_img.height) // 2))
    if state == "ok":
        cb = check_box(70, "ok")
        img.alpha_composite(cb, (sp + w - 110, sp + (h - 70) // 2))
    return img


def sc_quiz(sc, L, cue):
    rows = []
    if sc.get("kicker"):
        rows.append([{"img": chip(sc["kicker"], L.s(32)), "t": 0}])
    rows.append([{"img": heading(L, sc["question"], sc.get("size", 62)), "t": 0.05}])
    letters = "ABC"
    rt = cue(sc.get("reveal_at"), None) if sc.get("answer") else None
    for i, o in enumerate(sc["options"]):
        text, at = (o, None) if isinstance(o, str) else (o["text"], o.get("at"))
        it = {"img": option_card(L, letters[i], text), "t": cue(at, 0.3 + 0.15 * i), "anim": "left"}
        if rt is not None:
            if letters[i] == sc["answer"]:
                it["img2"], it["t2"] = option_card(L, letters[i], text, "ok"), rt
            else:
                it["dim_t"] = rt
        rows.append([it])
    return stack(L, rows, gap=26)


def sc_law(sc, L, cue):
    rows = []
    if sc.get("label"):
        lab = chip(sc["label"], L.s(38), INK, AMBER)
        rows.append([{"img": icon("para", L.s(120)), "t": 0, "anim": "pop"}, {"img": lab, "t": 0.1}])
    rows.append([{"img": heading(L, sc["headline"], sc.get("size", 76)), "t": 0.15}])
    for ln in sc.get("lines", []):
        text, at = (ln, None) if isinstance(ln, str) else (ln["text"], ln.get("at"))
        rows.append([{"img": text_block(text, L.s(46), L.CW, SOFT, "SemiBold", "center"), "t": cue(at, 0.4)}])
    if sc.get("stamp"):
        rows.append([{"img": stamp(sc["stamp"], COLORS[sc.get("stamp_color", "red")], L.s(70)),
                      "t": cue(sc.get("stamp_at"), 0.75), "anim": "stamp"}])
    return stack(L, rows)


def check_row(L, n, text, state):
    cb = check_box(L.s(84), state)
    t = text_block(text, L.s(54), L.CW - 200, WHITE, "ExtraBold")
    h = max(cb.height, t.height)
    img = Image.new("RGBA", (L.CW, h), (0, 0, 0, 0))
    img.alpha_composite(cb, (0, (h - cb.height) // 2))
    img.alpha_composite(t, (cb.width + 40, (h - t.height) // 2))
    return img


def sc_checks(sc, L, cue):
    rows = [[{"img": heading(L, sc["title"], 70), "t": 0}]]
    for i, it in enumerate(sc["items"]):
        t_in = cue(it.get("at"), 0.2 + 0.3 * i)
        rows.append([{"img": check_row(L, i + 1, it["text"], "empty"), "t": t_in, "anim": "left",
                      "img2": check_row(L, i + 1, it["text"], it.get("state", "ok")), "t2": t_in + 0.6}])
    return stack(L, rows, gap=44)


def list_row(L, text, ic="ok", color=WHITE):
    cb = check_box(L.s(66), ic) if ic in ("ok", "x") else icon(ic, L.s(80), color=WHITE if ic == "person" else INK)
    t = text_block(text, L.s(48), L.CW - 140, color, "Bold")
    h = max(cb.height, t.height)
    img = Image.new("RGBA", (L.CW, h), (0, 0, 0, 0))
    img.alpha_composite(cb, (0, (h - cb.height) // 2))
    img.alpha_composite(t, (cb.width + 36, (h - t.height) // 2))
    return img


def sc_list(sc, L, cue):
    rows = [[{"img": heading(L, sc["title"], sc.get("size", 68)), "t": 0}]]
    n = len(sc["items"])
    for i, it in enumerate(sc["items"]):
        rows.append([{"img": list_row(L, it["text"], it.get("icon", "ok")),
                      "t": cue(it.get("at"), 0.15 + 0.7 * i / n), "anim": "left"}])
    return stack(L, rows, gap=30)


def timeline_img(L, marks, hl=None):
    w = L.CW
    h = 230
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    y = 90
    x0, x1 = 120, w - 120
    d.rounded_rectangle((x0, y - 10, x1, y + 10), 10, fill=(60, 72, 96))
    n = len(marks)
    xs = [x0 + (x1 - x0) * i / (n - 1) for i in range(n)]
    if hl:
        a, b = hl
        d.rounded_rectangle((xs[a], y - 16, xs[b], y + 16), 16, fill=AMBER)
    f = font(L.s(40), "ExtraBold")
    for i, (x, m) in enumerate(zip(xs, marks)):
        on = hl and hl[0] <= i <= hl[1]
        d.ellipse((x - 24, y - 24, x + 24, y + 24), fill=AMBER if on else WHITE, outline=INK, width=4)
        d.text((x - tw(m, f) / 2, y + 50), m, font=f, fill=WHITE if on else MUTED)
    return img


def sc_timeline(sc, L, cue):
    rows = [[{"img": icon(sc.get("icon", "calendar"), L.s(150)), "t": 0, "anim": "pop"}],
            [{"img": heading(L, sc["title"], 68), "t": 0.05}]]
    hl = tuple(sc["highlight"])
    rows.append([{"img": timeline_img(L, sc["marks"]), "t": 0.2,
                  "img2": timeline_img(L, sc["marks"], hl), "t2": cue(sc.get("highlight_at"), 0.45)}])
    if sc.get("note"):
        rows.append([{"img": text_block(sc["note"], L.s(46), L.CW, SOFT, "SemiBold", "center"),
                      "t": cue(sc.get("note_at"), 0.6)}])
    return stack(L, rows)


def case_card(L, ic, text, label=None):
    w = L.CW
    imgs = []
    if label:
        imgs.append(text_block(label.upper(), L.s(30), w - 400, MUTED, "ExtraBold"))
    imgs.append(text_block(text, L.s(54 if not L.v else 50), w - (360 if not L.v else 320), INK, "ExtraBold"))
    inner_h = sum(i.height for i in imgs) + 20 * (len(imgs) - 1)
    ics = L.s(200 if not L.v else 170)
    h = max(inner_h, ics) + 120
    img, sp = rounded(w, h, 34, CARD, shadow=True)
    icon_img = icon(ic, ics)
    img.alpha_composite(icon_img, (sp + 50, sp + (h - ics) // 2))
    y = sp + (h - inner_h) // 2
    for i in imgs:
        img.alpha_composite(i, (sp + ics + 100, y))
        y += i.height + 20
    return img


def sc_case(sc, L, cue):
    rows = []
    if sc.get("kicker"):
        rows.append([{"img": chip(sc["kicker"], L.s(34)), "t": 0}])
    c_img = case_card(L, sc.get("icon", "house"), sc["text"], sc.get("label"))
    rows.append([{"img": c_img, "t": 0.05, "anim": "rise"}])
    st = stamp(sc["verdict"], COLORS[sc.get("verdict_color", "red")], L.s(76))
    spacer = Image.new("RGBA", (10, st.height - 60), (0, 0, 0, 0))
    rows.append([{"img": spacer, "t": 0}])
    if sc.get("note"):
        rows.append([{"img": text_block(sc["note"], L.s(44), L.CW, SOFT, "SemiBold", "center"),
                      "t": cue(sc.get("note_at"), 0.8)}])
    blocks = stack(L, rows, gap=10)
    c = blocks[1] if sc.get("kicker") else blocks[0]
    x = c.x + c.img.width - st.width - 30
    y = c.y + c.img.height - 70
    blocks.append(Block(st, x, y, cue(sc.get("verdict_at"), 0.55), "stamp"))
    return blocks


def story_row(L, date, text, on=True):
    c = chip(date, L.s(34), INK, AMBER if on else SOFT)
    cw = L.s(250) if not L.v else L.s(230)
    t = text_block(text, L.s(46), L.CW - cw - 40, WHITE, "Bold")
    h = max(c.height, t.height)
    img = Image.new("RGBA", (L.CW, h), (0, 0, 0, 0))
    img.alpha_composite(c, (cw - c.width, 0))
    img.alpha_composite(t, (cw + 40, 0))
    return img


def sc_story(sc, L, cue):
    rows = []
    if sc.get("title"):
        rows.append([{"img": heading(L, sc["title"], 64), "t": 0}])
    n = len(sc["steps"])
    for i, s in enumerate(sc["steps"]):
        rows.append([{"img": story_row(L, s["date"], s["text"]), "t": cue(s.get("at"), 0.1 + 0.75 * i / n),
                      "anim": "left"}])
    blocks = stack(L, rows, gap=36)
    if sc.get("stamp"):
        st = stamp(sc["stamp"], COLORS[sc.get("stamp_color", "green")], L.s(70))
        last = blocks[-1]
        y = min(L.bottom - st.height + 60, last.y + last.img.height + 10)
        blocks.append(Block(st, L.W - (L.W - L.CW) // 2 - st.width, y, cue(sc.get("stamp_at"), 0.85), "stamp"))
    return blocks


def split_card(L, item, width):
    imgs = [icon(item.get("icon", "gavel"), L.s(110))]
    if item.get("label"):
        imgs.append(chip(item["label"], L.s(30), WHITE, INK))
    imgs.append(text_block(item["title"], L.s(48), width - 112, INK, "Black"))
    imgs.append(text_block(item["text"], L.s(34), width - 112, (60, 64, 74), "SemiBold"))
    img, sp = card(imgs, width, pad=56, gap=22, accent=COLORS[item.get("color", "amber")])
    return img


def sc_split(sc, L, cue):
    rows = []
    if sc.get("title"):
        rows.append([{"img": heading(L, sc["title"], 66), "t": 0}])
    width = L.CW - 60 if L.v else (L.W - 300) // 2 - 60
    row = []
    for i, it in enumerate(sc["items"]):
        row.append({"img": split_card(L, it, width), "t": cue(it.get("at"), 0.15 + 0.4 * i)})
    rows.append(row)
    return stack(L, rows, gap=40, hgap=10, maxw=L.W - 80)


def sc_outro(sc, L, cue):
    rows = [[{"img": icon("para", L.s(180)), "t": 0, "anim": "pop"}],
            [{"img": heading(L, sc.get("text", "DARF DER DAS?"), 110), "t": 0.1}]]
    if sc.get("sub"):
        rows.append([{"img": text_block(sc["sub"], L.s(46), L.CW, SOFT, "SemiBold", "center"), "t": 0.2}])
    if sc.get("button"):
        rows.append([{"img": chip(sc["button"], L.s(50), WHITE, RED, 46, 22), "t": cue(sc.get("button_at"), 0.5),
                      "anim": "pop"}])
    return stack(L, rows)
