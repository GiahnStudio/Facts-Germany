// The Golden Crack (金継ぎ) — four prints (1080×1920). g: 0 key · 1 blues · 2 greens/greys · 3 reds/figures
// Sheets 0/3 are alternate impressions of one garden (rain → clear evening); sheet 1 the workshop; sheet 2 the mended bowl, close.
import { clamp, lerp, seg, mulberry, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, bokashi, rgba } from './print.js';
import { mountain, pine, rain } from './nature.js';
import { traveler } from './traveler.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8, q12 = t => Math.floor(t * 12) / 12;
const GOLD = '#d6a73c', GOLDL = '#f6dc84', GOLDD = '#9a7424';
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
function shp(x, pts, fill, lw, sm = true, closed = true) { x.beginPath(); sm ? smooth(x, pts, closed) : poly(x, pts); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { x.lineWidth = lw; x.strokeStyle = S; x.stroke(); } }
const ease = u => u * u * (3 - 2 * u);

// ===================== THE BOWL (chawan), local units: rim at y −60, foot at +55, r = 100 =====================
const SIL = [[-100, -60], [-99, -34], [-91, -6], [-74, 20], [-50, 38], [-44, 40], [-42, 55], [42, 55], [44, 40], [50, 38], [74, 20], [91, -6], [99, -34], [100, -60]];
// crack lines (they run right across the bowl box; each piece is an intersection of half-planes)
const CA = [[-24, -200], [-26, -78], [-28, -60], [-17, -38], [-31, -12], [-14, 14], [-23, 38], [-12, 200]];          // top → bottom
const CB = [[-300, -8], [-30, -12], [-2, -24], [26, -10], [56, -32], [84, -18], [300, -30]];                          // left → right (used right of A)
const CC = [[-300, 22], [-84, 12], [-58, 30], [-26, 22], [300, 26]];                                                   // used left of A
const CD = [[34, -200], [30, -18], [47, 8], [36, 34], [50, 200]];                                                      // used below B, right of A
const left = L => L.concat([[-400, 400], [-400, -400]]), right = L => L.concat([[400, 400], [400, -400]]);
const above = L => L.concat([[400, -400], [-400, -400]]), below = L => L.concat([[400, 400], [-400, 400]]);
const PIECES = [
  { clip: [left(CA), above(CC)], off: [-120, 44, -.45], c: [-60, -20] },
  { clip: [left(CA), below(CC)], off: [-70, 0, .25], c: [-55, 40] },
  { clip: [right(CA), above(CB)], off: [80, 72, .35], c: [40, -40] },
  { clip: [right(CA), below(CB), left(CD)], off: [0, 0, -.12], c: [10, 30] },
  { clip: [right(CA), below(CB), right(CD)], off: [140, 6, .4], c: [65, 20] },
];
// seams drawn in gold, each limited to where it is a real border
const SEAMS = [
  { pts: CA.slice(1, -1), lim: [] },
  { pts: CB.slice(1, -1).concat([[100, -30]]), lim: [right(CA)] },
  { pts: [[-100, 12]].concat(CC.slice(1, -1)), lim: [left(CA)] },
  { pts: CD.slice(1, -1).concat([[50, 60]]), lim: [right(CA), below(CB)] },
];
function clipPoly(x, P) { x.beginPath(); poly(x, P); x.clip(); }
function bowlBody(x, lw, o) {
  const glaze = o.glaze || PAL.ai, glazeL = o.glazeL || PAL.prusL, clay = o.clay || '#c79f70';
  shp(x, SIL, clay, 0, false);
  x.save(); clipPoly(x, SIL);
  // glaze poured over the top: a wavy lower edge with drips
  x.fillStyle = glaze; x.beginPath(); x.moveTo(-120, -90);
  for (let X = -120; X <= 120; X += 6) { const d = Math.max(0, Math.sin(X * .11 + 1.3)) ** 6 * 14; x.lineTo(X, 22 + Math.sin(X * .05) * 5 + d); }
  x.lineTo(120, -90); x.closePath(); x.fill();
  x.strokeStyle = glazeL; x.lineWidth = 7; x.lineCap = 'round';
  for (const [a, b] of [[-70, -48], [-44, -52], [8, -50], [52, -50], [80, -46]]) { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(a + 6, b + 30, a + 2, b + 54 - Math.abs(a) * .2); x.stroke(); }
  x.fillStyle = rgba(PAL.white, .22); x.beginPath(); x.ellipse(-56, -26, 12, 28, .25, 0, TAU); x.fill();
  // foot ring: unglazed clay with turning lines
  x.strokeStyle = S; x.lineWidth = lw * .5; x.beginPath(); x.moveTo(-44, 40); x.lineTo(44, 40); x.stroke();
  x.restore();
  shp(x, SIL, null, lw, false);
  // the mouth: an ellipse (we look in from slightly above)
  x.fillStyle = o.inside || PAL.prusD; x.beginPath(); x.ellipse(0, -60, 100, 18, 0, 0, TAU); x.fill();
  if (o.tea) { x.fillStyle = '#7f9a3a'; x.beginPath(); x.ellipse(0, -57, 84, 12, 0, 0, TAU); x.fill(); x.fillStyle = rgba('#c9d58a', .8); x.beginPath(); x.ellipse(-14, -58, 30, 4, 0, 0, TAU); x.fill(); }
  x.strokeStyle = S; x.lineWidth = lw; x.beginPath(); x.ellipse(0, -60, 100, 18, 0, 0, TAU); x.stroke();
  x.strokeStyle = glazeL; x.lineWidth = lw * .6; x.beginPath(); x.ellipse(0, -60, 94, 14, 0, .1, Math.PI - .1); x.stroke();
}
function partial(pts, u) {   // the first u (0..1) of a polyline, by length
  if (u >= 1) return pts; if (u <= 0) return [];
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let goal = tot * u; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { if (goal >= L[i - 1]) { out.push(pts[i]); goal -= L[i - 1]; } else { const k = goal / L[i - 1]; out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); break; } }
  return out;
}
// o: spread 0..1 (0 = whole), crack (dark seams), gold 0..1 (seams in gold, drawn in order), sparkle (time), glaze…
export function bowl(x, cx, cy, r, o = {}) {
  const u = r / 100, lw = Math.max(1.6, r / 40) / u, sp = o.spread || 0;
  x.save(); x.translate(cx, cy); x.scale(u, u); x.lineJoin = 'round'; x.lineCap = 'round';
  if (sp > 0) {
    PIECES.forEach((p, k) => {
      x.save(); x.translate(p.off[0] * sp + p.c[0], p.off[1] * sp + p.c[1]); x.rotate(p.off[2] * sp); x.translate(-p.c[0], -p.c[1]);
      x.save(); for (const c of p.clip) clipPoly(x, c); clipPoly(x, SIL.concat([[100, -78], [-100, -78]])); bowlBody(x, lw, o); x.restore();
      // a dark broken edge around each piece
      x.save(); clipPoly(x, SIL.concat([[100, -78], [-100, -78]])); for (const c of p.clip) clipPoly(x, c);
      x.strokeStyle = S; x.lineWidth = lw * 1.4; for (const c of p.clip) { x.beginPath(); poly(x, c); x.stroke(); } x.restore();
      x.restore();
    });
    x.restore(); return;
  }
  bowlBody(x, lw, o);
  const g = o.gold ?? 0;
  if (o.crack || g > 0) {
    x.save(); clipPoly(x, SIL.concat([[100, -78], [-100, -78]]));
    SEAMS.forEach((sm, k) => {
      x.save(); for (const c of sm.lim) clipPoly(x, c);
      if (o.crack) { x.strokeStyle = '#3a1e14'; x.lineWidth = lw * 1.1; x.beginPath(); poly(x, sm.pts); x.stroke(); }
      const uk = clamp(g * SEAMS.length - k), part = partial(sm.pts, uk);
      if (part.length > 1) {
        const path = () => { x.beginPath(); x.moveTo(part[0][0], part[0][1]); for (const p of part.slice(1)) x.lineTo(p[0], p[1]); };
        x.lineCap = 'round'; x.lineJoin = 'round';
        path(); x.strokeStyle = S; x.lineWidth = lw * 2.6; x.stroke();
        path(); x.strokeStyle = GOLD; x.lineWidth = lw * 1.8; x.stroke();
        path(); x.strokeStyle = GOLDL; x.lineWidth = lw * .55; x.stroke();
        if (uk < 1) { const e = part[part.length - 1]; x.fillStyle = GOLDL; x.beginPath(); x.arc(e[0], e[1], lw * 1.6, 0, TAU); x.fill(); }
      }
      x.restore();
    });
    x.restore();
    if (o.sparkle != null && g > 0) {   // kira: mica-like glints along the gold, 12 fps
      const k12 = Math.floor(o.sparkle * 12), R = mulberry(500 + k12);
      for (let i = 0; i < 5; i++) { const sm = SEAMS[Math.floor(R() * SEAMS.length)], p = sm.pts[1 + Math.floor(R() * (sm.pts.length - 2))]; if (!p) continue; const s2 = (6 + R() * 8) / u * (r > 200 ? 1 : .6);
        x.fillStyle = PAL.white; x.beginPath(); x.moveTo(p[0], p[1] - s2); x.lineTo(p[0] + s2 * .22, p[1]); x.lineTo(p[0], p[1] + s2); x.lineTo(p[0] - s2 * .22, p[1]); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(p[0] - s2, p[1]); x.lineTo(p[0], p[1] + s2 * .22); x.lineTo(p[0] + s2, p[1]); x.lineTo(p[0], p[1] - s2 * .22); x.closePath(); x.fill(); }
    }
  }
  x.restore();
}
const goldAt = t => { const [a, b, c] = CFG.GOLD; return t < b ? lerp(0, .62, seg(t, a, b)) : lerp(.62, 1, seg(t, b + 1.6, c)); };

// ===================== THE GARDEN (sheet 0 rain · sheet 3 clear evening) =====================
const DECK = 1180, POT = [880, 1324], STONES = [[150, 1318, 70], [290, 1300, 64], [420, 1290, 72], [560, 1282, 66], [660, 1270, 60]];
const GPAL = {
  rain: { sky: PAL.greyD, sky2: PAL.greyL, glow: PAL.skyL, moss: '#7f9150', moss2: '#647a40', stone: PAL.grey, wall: '#d6c8a6', pine: PAL.pine, blossom: null },
  clear: { sky: PAL.prus, sky2: PAL.sky, glow: PAL.beniP, moss: PAL.green, moss2: PAL.greenD, stone: PAL.greyL, wall: PAL.plaster, pine: PAL.pine, blossom: '#f2c7c2' },
};
function gardenLayers(m) {
  const P = GPAL[m];
  return {
    sky: { g: 1, grain: .12, draw(x) {
      rect(x, P.sky2, 0, FR.y0, W, 980);
      bokashi(x, 0, FR.y0, W, 700, P.sky, .9, 0, { rough: 24, seed: m === 'rain' ? 61 : 62 });
      mountain(x, 260, 900, 620, 260, { body: m === 'rain' ? PAL.grey : PAL.prusL, frac: 0, seed: 63 });
    } },
    greens: { g: 2, grain: .06, draw(x) {
      rect(x, P.moss, 0, 900, W, H);
      x.fillStyle = P.moss2; for (let k = 0; k < 14; k++) { const y = 940 + k * 70; x.beginPath(); x.moveTo(0, y + 18); x.lineTo(W, y - 8); x.lineTo(W, y + 6); x.lineTo(0, y + 32); x.fill(); }
      for (const [sx, sy, sr] of STONES) { x.fillStyle = P.stone; x.beginPath(); x.ellipse(sx, sy, sr, sr * .34, -.05, 0, TAU); x.fill(); }
      // the house: plaster wall, shoji, veranda
      rect(x, P.wall, 690, 640, FR.x1, DECK);
      rect(x, PAL.wood, 690, DECK, FR.x1, DECK + 60);
      rect(x, PAL.woodL, 690, DECK - 18, FR.x1, DECK);
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, 520, W, 980, P.glow, 0, .85, { rough: 16, seed: 64 });
      x.fillStyle = PAL.sumiL; x.beginPath(); x.moveTo(640, 650); x.lineTo(FR.x1 + 10, 560); x.lineTo(FR.x1 + 10, 660); x.lineTo(660, 680); x.closePath(); x.fill();   // tiled eave
      if (P.blossom) { const R = mulberry(65); x.fillStyle = P.blossom; for (let k = 0; k < 30; k++) { const bx = 80 + R() * 470, by = 160 + R() * 300; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; x.beginPath(); x.arc(bx + Math.cos(a) * 8, by + Math.sin(a) * 8, 7, 0, TAU); x.fill(); } } }
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 260, 900, 620, 260, { lines: true, lw: 1.6, frac: 0, seed: 63 });
      x.fillStyle = S; carve(x, [[0, 900], [690, 900]], 2.2, { taper: [0, 0] });
      for (const [sx, sy, sr] of STONES) { x.strokeStyle = S; x.lineWidth = 2.6; x.beginPath(); x.ellipse(sx, sy, sr, sr * .34, -.05, 0, TAU); x.stroke(); x.lineWidth = 1.2; x.beginPath(); x.ellipse(sx - sr * .2, sy - sr * .08, sr * .5, sr * .12, -.05, Math.PI * 1.1, Math.PI * 1.8); x.stroke(); }
      // house key lines: posts, shoji lattice, veranda boards
      x.strokeStyle = S; x.lineWidth = 3; x.strokeRect(690, 660, FR.x1 - 690 + 10, DECK - 660);
      x.lineWidth = 2; for (const X of [790, 900, 1010]) { x.beginPath(); x.moveTo(X, 690); x.lineTo(X, DECK - 18); x.stroke(); }
      x.lineWidth = 1.2; for (let Y = 720; Y < DECK - 30; Y += 62) { x.beginPath(); x.moveTo(700, Y); x.lineTo(FR.x1, Y); x.stroke(); }
      x.lineWidth = 9; x.beginPath(); x.moveTo(696, 640); x.lineTo(696, DECK + 60); x.stroke();
      x.lineWidth = 2.4; x.beginPath(); x.moveTo(690, DECK - 18); x.lineTo(FR.x1, DECK - 18); x.moveTo(690, DECK); x.lineTo(FR.x1, DECK); x.moveTo(690, DECK + 60); x.lineTo(FR.x1, DECK + 60); x.stroke();
      x.lineWidth = 3; x.beginPath(); x.moveTo(640, 650); x.lineTo(FR.x1 + 10, 560); x.moveTo(660, 680); x.lineTo(FR.x1 + 10, 660); x.stroke();
      x.lineWidth = 1.2; for (let k = 0; k < 10; k++) { const X = 680 + k * 40; x.beginPath(); x.moveTo(X, 650 - (X - 640) * .25 + 4); x.lineTo(X + 4, 678 - (X - 660) * .05); x.stroke(); }
      pine(x, 120, 900, 1.25, { lean: .35, seed: 66 });
    } },
  };
}
// the apprentice carries the bowl in both hands; returns where the bowl sits
function apprentice(x, px, py, s, o) {
  traveler(x, px, py, s, { mode: o.mode || 'stand', flip: true, hatOff: true, noStaff: true, noBundle: true, robe: '#7a8a5a', robeD: '#56653e', sash: PAL.ochre, ph: o.ph, t: o.t, stoop: o.stoop || 0, lean: o.lean || 0, shout: o.shout });
}
const V_RAIN = {
  id: 'rain', layers: gardenLayers('rain'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), t12 = q12(t), s = 380;
    // the old potter on the veranda, watching
    R.D(3, x => traveler(x, POT[0], POT[1], 360, { mode: 'sit', noStaff: true, noCup: true, noBundle: true, robe: '#5a4636', robeD: '#3e3026', sash: PAL.beni, t: tq, noPattern: true }));
    const [W0, W1] = CFG.WALK, wu = seg(tq, W0, W1), ax = lerp(200, 560, wu), ay = lerp(1318, 1284, wu);
    if (t < CFG.SLIP) {
      const walking = t >= W0;
      R.D(3, x => { apprentice(x, ax, ay, s, { mode: walking ? 'walk' : 'stand', ph: tq * 1.1, t: tq });
        bowl(x, ax + 64, ay - s * .56, 40, {}); });
    } else {
      // slip: feet go forward, he falls back; the bowl flies on and breaks on the stone
      const fu = ease(seg(tq, CFG.SLIP, CFG.SLIP + .6));
      R.D(3, x => { x.save(); x.translate(560, 1284); x.rotate(-1.25 * fu); x.translate(0, fu * 40); apprentice(x, 0, 0, s, { mode: 'stand', t: tq, lean: .12 * fu, shout: true }); x.restore(); });
      const HIT = CFG.HIT;
      if (t < HIT) { const bu = seg(tq, CFG.SLIP, HIT); R.D(3, x => { x.save(); x.translate(lerp(624, 650, bu), lerp(1071, 1236, bu * bu) - Math.sin(bu * Math.PI) * 120); x.rotate(bu * 4); bowl(x, 0, 0, 40, {}); x.restore(); }); }
      else {
        const su = ease(seg(t12, HIT, HIT + .25));
        R.D(3, x => bowl(x, 650, 1238, 40, { spread: .25 + su * .75 }));
        if (t < HIT + .6) R.D(0, x => { x.strokeStyle = S; x.lineWidth = 3; x.lineCap = 'round'; for (let k = 0; k < 7; k++) { const a = -Math.PI + k * .52; x.beginPath(); x.moveTo(650 + Math.cos(a) * 46, 1240 + Math.sin(a) * 30); x.lineTo(650 + Math.cos(a) * 80, 1240 + Math.sin(a) * 54); x.stroke(); } });
      }
    }
    R.D(1, x => rain(x, t12, [FR.x0, FR.y0, FR.x1, FR.y1]));
    // rain rings on the stones
    R.D(0, x => { const Rr = mulberry(77 + Math.floor(t12 * 12)); x.strokeStyle = rgba(PAL.white, .7); x.lineWidth = 1.6; for (let k = 0; k < 6; k++) { const st = STONES[Math.floor(Rr() * STONES.length)], rx = st[0] + (Rr() - .5) * st[2], ry = st[1] + (Rr() - .5) * st[2] * .2, rr = 6 + Rr() * 10; x.beginPath(); x.ellipse(rx, ry, rr, rr * .35, 0, 0, TAU); x.stroke(); } });
  },
};
const V_CLEAR = {
  id: 'clear', layers: gardenLayers('clear'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), t12 = q12(t);
    // the guest (left, facing right) receives the mended bowl from the potter
    const give = ease(seg(tq, 36.2, 37.4));
    R.D(3, x => {
      traveler(x, 760, POT[1], 340, { mode: 'sit', flip: true, noStaff: true, noCup: true, noBundle: true, robe: PAL.prus, sash: PAL.ochreL, t: tq, cup: give * .3 });
      traveler(x, 950, POT[1], 360, { mode: 'sit', noStaff: true, noCup: true, noBundle: true, robe: '#5a4636', robeD: '#3e3026', sash: PAL.beni, t: tq, noPattern: true, cup: .3 });
      bowl(x, lerp(890, 850, give), POT[1] - 238 + Math.sin(give * Math.PI) * -10, 46, { gold: 1, tea: true, sparkle: t12 });
    });
    // the apprentice, standing on the stones with the kettle
    R.D(3, x => { apprentice(x, 470, 1290, 380, { mode: 'stand', t: tq });
      x.fillStyle = S; x.beginPath(); x.ellipse(534, 1072, 34, 26, 0, 0, TAU); x.fill(); x.strokeStyle = PAL.woodL; x.lineWidth = 3; x.beginPath(); x.arc(534, 1052, 26, Math.PI, TAU); x.stroke(); x.fillStyle = S; x.fillRect(560, 1060, 22, 7); });
    // petals drifting (12 fps)
    R.D(3, x => { x.fillStyle = '#f2c7c2'; for (let k = 0; k < 10; k++) { const ph = (t12 * .16 + k * .19) % 1, px = 90 + (k * 113 + Math.sin(t12 + k) * 40) % 800, py = 160 + ph * 1100; x.beginPath(); x.ellipse(px, py, 7, 4, t12 + k, 0, TAU); x.fill(); } });
  },
};

// ===================== THE WORKSHOP (sheet 1) =====================
const TABLE = [380, 730, 1150], SEAT = [840, 1300], BOWL1 = [556, 1095, 64];
const workshopLayers = {
  sky: { g: 1, grain: .1, draw(x) { rect(x, '#b9a98a', 0, FR.y0, W, 1010); bokashi(x, 0, FR.y0, W, 600, PAL.sumiL, .5, 0, { rough: 20, seed: 71 }); } },
  greens: { g: 2, grain: .08, draw(x) {
    rect(x, PAL.wood, 0, 1010, W, H); x.fillStyle = PAL.woodD; for (let k = 0; k < 14; k++) { const y = 1040 + k * 66; x.beginPath(); x.moveTo(0, y + 10); x.lineTo(W, y - 4); x.lineTo(W, y + 2); x.lineTo(0, y + 16); x.fill(); }
    // shelf of pots (right wall)
    rect(x, PAL.woodL, 640, 880, FR.x1, 902);
    [[690, '#8a5a3a'], [770, PAL.ai], [850, '#6b6a5a'], [940, '#a0603a'], [1000, PAL.greyD]].forEach(([X, c], k) => { x.fillStyle = c; x.beginPath(); x.ellipse(X, 880 - 26 - (k % 2) * 8, 28, 30 + (k % 2) * 8, 0, Math.PI, TAU); x.lineTo(X + 18, 880); x.lineTo(X - 18, 880); x.closePath(); x.fill(); });
    // low worktable
    rect(x, PAL.woodL, TABLE[0], TABLE[2], TABLE[1], TABLE[2] + 26); rect(x, PAL.woodD, TABLE[0] + 20, TABLE[2] + 26, TABLE[0] + 44, TABLE[2] + 100); rect(x, PAL.woodD, TABLE[1] - 44, TABLE[2] + 26, TABLE[1] - 20, TABLE[2] + 100);
    rect(x, PAL.woodD, SEAT[0] - 70, SEAT[1] - 150, SEAT[0] + 60, SEAT[1] - 130); rect(x, PAL.woodD, SEAT[0] - 60, SEAT[1] - 130, SEAT[0] - 44, SEAT[1]); rect(x, PAL.woodD, SEAT[0] + 34, SEAT[1] - 130, SEAT[0] + 50, SEAT[1]);
  } },
  reds: { g: 3, draw(x) { x.fillStyle = PAL.beni; x.fillRect(TABLE[0] + 60, TABLE[2] - 6, TABLE[1] - TABLE[0] - 120, 8); } },
  key: { g: 0, speck: .12, draw(x) {
    x.strokeStyle = S; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 1010); x.lineTo(W, 1010); x.stroke();
    x.lineWidth = 10; for (const X of [110, 970]) { x.beginPath(); x.moveTo(X, FR.y0); x.lineTo(X, 1010); x.stroke(); }
    x.beginPath(); x.moveTo(0, 230); x.lineTo(W, 230); x.stroke();
    // window frame + lattice
    x.lineWidth = 4; x.strokeRect(290, 320, 500, 420); x.lineWidth = 2.4; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(290 + k * 125, 320); x.lineTo(290 + k * 125, 740); x.stroke(); }
    x.beginPath(); x.moveTo(290, 530); x.lineTo(790, 530); x.stroke();
    x.lineWidth = 2; x.strokeRect(TABLE[0], TABLE[2], TABLE[1] - TABLE[0], 26); x.strokeRect(640, 880, FR.x1 - 640, 22);
  } },
};
function skyCycle(t) {   // 0..1 within each day; three days
  const [D0, D1] = CFG.DAYS; if (t < D0 || t >= D1) return null; const u = (t - D0) / (D1 - D0) * 3; return u % 1;
}
const V_SHOP = {
  id: 'shop', layers: workshopLayers,
  paint(x, t, R) {
    R.L('sky');
    const tq = q8(t), t12 = q12(t), dc = skyCycle(tq);
    // the window: daylight, or a racing sun / moon across the lattice
    R.D(1, x => { x.save(); x.beginPath(); x.rect(292, 322, 496, 416); x.clip();
      const night = dc != null && dc > .55; rect(x, dc == null ? PAL.skyL : night ? PAL.prusD : PAL.sky, 292, 322, 788, 738);
      if (dc != null) { const u = night ? (dc - .55) / .45 : dc / .55, sx = lerp(820, 260, u), sy = 640 - Math.sin(u * Math.PI) * 260;
        x.fillStyle = night ? PAL.white : PAL.beni; x.beginPath(); x.arc(sx, sy, 44, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 2; x.stroke(); }
      x.restore(); });
    R.L('reds'); R.L('greens'); R.L('key');
    // a lamp at night
    if (dc != null && dc > .55) R.D(3, x => { bokashi(x, 380, 820, 760, 1180, '#f2c66a', 0, .0, {}); x.fillStyle = rgba('#f6d58a', .28); x.beginPath(); x.ellipse(556, 1060, 260, 200, 0, 0, TAU); x.fill(); });
    // the potter on his stool, facing the table
    R.D(3, x => traveler(x, SEAT[0], SEAT[1], 380, { mode: 'sit', noStaff: true, noCup: true, noBundle: true, robe: '#5a4636', robeD: '#3e3026', sash: PAL.beni, t: tq, noPattern: true, cup: t > CFG.GATHER[0] ? .25 : 0 }));
    // the shards gather, then the seams fill with gold
    const gu = 1 - ease(seg(tq, ...CFG.GATHER)), gold = goldAt(t);
    R.D(3, x => bowl(x, BOWL1[0], BOWL1[1], BOWL1[2], { spread: gu > 0 ? .35 + gu * .65 : 0, crack: gu <= 0, gold: gu > 0 ? 0 : gold, sparkle: t12 }));
    // the apprentice: bows low (L04), straightens, asks (L07)
    const bowLow = t < CFG.VO.L05 ? .42 : t < CFG.VO.L07 ? .1 : 0, asking = t >= CFG.VO.L07 && t < CFG.MA[0];
    R.D(3, x => apprentice(x, 240, 1300, 400, { mode: 'stand', t: tq, stoop: bowLow, shout: asking && Math.floor(tq * 4) % 2 === 0 }));
  },
};

// ===================== THE MENDED BOWL, CLOSE (sheet 2): the gold is its own block =====================
const BC = [540, 930, 330];
const V_GOLD = {
  id: 'gold', layers: {
    sky: { g: 1, grain: .14, draw(x) { rect(x, PAL.prusD, 0, FR.y0, W, H); bokashi(x, 0, FR.y0, W, 1300, PAL.prus, 0, .9, { rough: 26, seed: 81 }); } },
    greens: { g: 2, grain: .06, draw(x) { x.fillStyle = PAL.sumiL; x.beginPath(); x.moveTo(0, 1180); x.lineTo(W, 1150); x.lineTo(W, H); x.lineTo(0, H); x.fill(); } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, 520, W, 1200, GOLDD, 0, .0, { rough: 18, seed: 82 });
      x.fillStyle = PAL.beni; x.beginPath(); x.moveTo(140, 1150); x.lineTo(940, 1120); x.lineTo(1000, 1240); x.lineTo(80, 1270); x.closePath(); x.fill();   // fukusa cloth
    } },
    key: { g: 0, speck: .1, draw(x) {
      x.strokeStyle = S; x.lineWidth = 2.6; x.beginPath(); x.moveTo(140, 1150); x.lineTo(940, 1120); x.lineTo(1000, 1240); x.lineTo(80, 1270); x.closePath(); x.stroke();
      x.lineWidth = 1.2; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(140 - k * 15, 1150 + k * 30); x.lineTo(940 + k * 15, 1120 + k * 30); x.stroke(); }
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('greens'); R.L('reds'); R.L('key');
    const t12 = q12(t), gold = goldAt(t);
    // halo of gold light growing as the last seams close
    R.D(3, x => { const a = .12 + .3 * seg(t, CFG.GOLD[1] + 1.6, CFG.GOLD[2]); x.fillStyle = rgba(GOLDL, a * .5); x.beginPath(); x.ellipse(BC[0], BC[1] - 40, 470, 400, 0, 0, TAU); x.fill(); x.fillStyle = rgba(GOLDL, a * .5); x.beginPath(); x.ellipse(BC[0], BC[1] - 40, 380, 320, 0, 0, TAU); x.fill(); });
    R.D(3, x => bowl(x, BC[0], BC[1], BC[2], { crack: true, gold, sparkle: gold >= 1 ? t12 : null }));
  },
};

export const VIEWS = [V_RAIN, V_SHOP, V_GOLD, V_CLEAR];
