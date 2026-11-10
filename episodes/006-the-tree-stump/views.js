// The Farmer and the Tree Stump (守株待兎, Han Feizi) — four prints (1080×1920). g: 0 key · 1 blues · 2 greens/greys · 3 reds/figures
// Sheets 0/3 are alternate impressions of one field (spring → harvest); sheets 1/2 of one close view at the stump (summer → autumn).
import { clamp, lerp, seg, mulberry, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, bokashi, rgba } from './print.js';
import { mountain, goose } from './nature.js';
import { traveler } from './traveler.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8, q12 = t => Math.floor(t * 12) / 12;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
function shp(x, pts, fill, lw, sm = true, closed = true) { x.beginPath(); sm ? smooth(x, pts, closed) : poly(x, pts); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { x.lineWidth = lw; x.strokeStyle = S; x.stroke(); } }

// —— hare: side view facing left, feet at y=0, ~100 units nose to tail. pose run | sit | lie ——
export function hare(x, px, py, s, o = {}) {
  const u = s / 100, lw = Math.max(1.2, s / 60) / u, col = o.col || '#a07a52', dark = '#6e5034', pose = o.pose || 'sit', ph = (o.ph || 0) * TAU;
  x.save(); x.translate(px, py); x.scale(u * (o.flip ? -1 : 1), u); x.lineJoin = 'round'; x.lineCap = 'round';
  if (pose === 'lie') {
    // fallen on its side, legs stretched, ears flat, eye shut
    shp(x, [[26, -6], [30, 0], [44, 2], [46, -2], [32, -8]], dark, lw * .8);
    shp(x, [[-34, -14], [-10, -26], [24, -24], [40, -14], [36, -2], [-6, 0], [-30, -4]], col, lw);
    shp(x, [[-6, -4], [-20, 2], [-26, 4], [-24, 0], [-12, -6]], col, lw * .8);
    shp(x, [[-36, -18], [-50, -20], [-58, -12], [-52, -4], [-36, -4], [-30, -10]], col, lw);
    shp(x, [[-34, -16], [-24, -24], [6, -30], [10, -26], [-20, -16]], col, lw * .9);
    shp(x, [[-30, -18], [-14, -23], [4, -27], [-18, -19]], '#d9a39a', 0);
    x.fillStyle = PAL.white; x.beginPath(); x.arc(42, -16, 6, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = lw * .6; x.stroke();
    x.lineWidth = lw * .9; x.beginPath(); x.moveTo(-48, -13); x.lineTo(-42, -13); x.stroke();
    x.restore(); return;
  }
  const run = pose === 'run', st = run ? Math.sin(ph) : 0;
  const bodyY = run ? -26 - Math.abs(st) * 6 : -24;
  if (run) { shp(x, [[22, bodyY + 6], [34 + st * 18, -4], [40 + st * 18, 0], [28 + st * 10, bodyY + 12]], dark, lw * .7); shp(x, [[-18, bodyY + 8], [-30 - st * 16, -2], [-26 - st * 16, 0], [-14, bodyY + 12]], dark, lw * .7); }
  const bw = run ? 38 : 30, bh = run ? 15 : 19;
  x.fillStyle = col; x.beginPath(); x.ellipse(4, bodyY, bw, bh, run ? -.06 : -.25, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = lw; x.stroke();
  x.fillStyle = PAL.white; x.beginPath(); x.arc(run ? 42 : 32, bodyY - 6, 7, 0, TAU); x.fill(); x.lineWidth = lw * .6; x.stroke();
  if (run) shp(x, [[20, bodyY], [8 - st * 22, -6], [-2 - st * 22, 0], [10 - st * 22, 0], [30, bodyY + 10]], col, lw * .8);
  else shp(x, [[6, -14], [30, -18], [30, -2], [4, 0], [-4, -4]], col, lw * .8);
  if (run) shp(x, [[-24, bodyY + 4], [-40 + st * 16, -6], [-46 + st * 16, -2], [-30, bodyY + 12]], col, lw * .8);
  else shp(x, [[-20, -12], [-22, 0], [-14, 0], [-12, -12]], col, lw * .8);
  const hx = run ? -38 : -26, hy = bodyY - (run ? 12 : 22), ea = run ? .95 : .25;
  for (const [dx, k] of [[4, dark], [0, col]]) { x.save(); x.translate(hx + 6 + dx, hy - 8); x.rotate(ea); shp(x, [[-5, 0], [-7, -22], [-3, -36], [3, -34], [5, -18], [5, 0]], k, lw * .8); if (k === col) shp(x, [[-2.6, -4], [-3.6, -22], [-1, -31], [1.6, -20], [1.8, -4]], '#d9a39a', 0); x.restore(); }
  shp(x, [[hx + 12, hy + 8], [hx + 4, hy - 9], [hx - 8, hy - 8], [hx - 15, hy + 2], [hx - 12, hy + 8], [hx + 2, hy + 12]], col, lw);
  x.fillStyle = S; x.beginPath(); x.arc(hx - 3, hy - 2, 2.2, 0, TAU); x.fill();
  x.beginPath(); x.arc(hx - 14, hy + 3, 1.3, 0, TAU); x.fill();
  x.restore();
}

// —— hoe (kuwa) held by a traveller drawn at (px, py, s); sw 0 = blade in the soil, 1 = raised ——
function hoe(x, px, py, s, sw, flip) {
  const u = s / 100, hand = [-13.5, -56];
  x.save(); x.translate(px, py); x.scale(u * (flip ? -1 : 1), u); x.lineCap = 'round';
  const a = lerp(2.25, -2.3, sw), d = [Math.cos(a), Math.sin(a)];
  const tip = [hand[0] + d[0] * 54, hand[1] + d[1] * 54], end = [hand[0] - d[0] * 22, hand[1] - d[1] * 22];
  x.strokeStyle = S; x.lineWidth = 6; x.beginPath(); x.moveTo(end[0], end[1]); x.lineTo(tip[0], tip[1]); x.stroke();
  x.strokeStyle = PAL.woodL; x.lineWidth = 3.4; x.stroke();
  x.translate(tip[0], tip[1]); x.rotate(a + Math.PI / 2);
  shp(x, [[-2, -3], [3, -3], [5, 16], [-6, 16]], PAL.greyD, 1.6, false);
  x.restore();
}
function hoeOnGround(x, x0, y0, len) {
  x.save(); x.lineCap = 'round'; x.strokeStyle = S; x.lineWidth = 9; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + len, y0 - 10); x.stroke();
  x.strokeStyle = PAL.woodL; x.lineWidth = 5; x.stroke();
  shp(x, [[x0 + len - 2, y0 - 12], [x0 + len + 30, y0 - 18], [x0 + len + 32, y0 - 4], [x0 + len, y0 + 2]], PAL.greyD, 2, false);
  x.restore();
}

// —— weeds: a tuft of tapered blades; grow 0..1 ——
function tuft(x, cx, by, h, col, seed, grow = 1, n = 7, lean = 0) {
  if (grow <= 0) return;
  const R = mulberry(seed);
  x.fillStyle = col;
  for (let k = 0; k < n; k++) {
    const hh = h * (.55 + R() * .45) * grow, dx = (R() - .5) * h * .5, bend = (R() - .5) * h * .5 + lean * h * .4, b0 = cx + dx;
    x.beginPath(); x.moveTo(b0 - 5, by); x.quadraticCurveTo(b0 - 3 + bend * .4, by - hh * .6, b0 + bend, by - hh); x.quadraticCurveTo(b0 + 3 + bend * .4, by - hh * .6, b0 + 5, by); x.closePath(); x.fill();
    x.strokeStyle = S; x.lineWidth = 1.2; x.stroke();
  }
}
// —— the stump: a cut trunk with rings on top ——
function stump(x, cx, by, w, h, top = PAL.woodL) {
  shp(x, [[cx - w / 2 - 18, by], [cx - w / 2, by - 12], [cx - w / 2 + 4, by - h], [cx + w / 2 - 4, by - h], [cx + w / 2, by - 14], [cx + w / 2 + 22, by + 2]], PAL.wood, 2.6, false);
  x.fillStyle = top; x.beginPath(); x.ellipse(cx, by - h, w / 2 - 4, w * .16, 0, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 2.4; x.stroke();
  x.lineWidth = 1.2; for (const r of [.7, .45, .2]) { x.beginPath(); x.ellipse(cx + 3, by - h, (w / 2 - 4) * r, w * .16 * r, 0, 0, TAU); x.stroke(); }
  x.lineWidth = 1.4; for (const f of [-.25, .05, .3]) { x.beginPath(); x.moveTo(cx + w * f, by - h + w * .16 * .9); x.lineTo(cx + w * f + 3, by - 8); x.stroke(); }
}

// ===================== FIELD (sheet 0 spring · sheet 3 harvest) =====================
const STUMP = [680, 1262], RIDGE = 1110;
const FPAL = {
  spring: { sky: PAL.sky, glow: PAL.beniP, hill: PAL.green, hillD: PAL.greenD, upper: PAL.greenL, upper2: PAL.green, low: '#c9b98a', low2: '#a8955f', branch: '#efb9b0' },
  harvest: { sky: PAL.prus, glow: PAL.beniP, hill: '#a98e57', hillD: '#7d6a40', upper: PAL.ochreL, upper2: PAL.ochre, low: '#b39c66', low2: '#8c7a4c', branch: '#c4502f' },
};
function fieldLayers(m) {
  const P = FPAL[m];
  return {
    sky: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 620, P.sky, .92, 0, { rough: 24, seed: m === 'spring' ? 41 : 42 });
      mountain(x, 300, 760, 640, 300, { body: PAL.prusL, snow: PAL.white, frac: m === 'spring' ? .2 : .3, seed: 43 });
      mountain(x, 860, 770, 520, 210, { body: PAL.skyL, frac: 0, seed: 44 });
    } },
    greens: { g: 2, grain: .06, draw(x) {
      x.fillStyle = P.hillD; x.beginPath(); x.moveTo(0, 800); for (let X = 0; X <= W; X += 20) x.lineTo(X, 760 + Math.sin(X * .007 + 2) * 34); x.lineTo(W, 900); x.lineTo(0, 900); x.fill();
      rect(x, P.hill, 0, 850, W, 900);
      rect(x, P.upper, 0, 880, W, RIDGE);
      x.fillStyle = P.upper2; for (let k = 0; k < 6; k++) { const y = 900 + k * 36; x.beginPath(); x.moveTo(0, y + 14); x.lineTo(W, y - 6); x.lineTo(W, y + 6); x.lineTo(0, y + 26); x.fill(); }
      x.fillStyle = PAL.ochreL; x.beginPath(); x.moveTo(0, RIDGE + 14); x.lineTo(W, RIDGE - 10); x.lineTo(W, RIDGE + 24); x.lineTo(0, RIDGE + 48); x.fill();
      x.fillStyle = P.low; x.beginPath(); x.moveTo(0, RIDGE + 48); x.lineTo(W, RIDGE + 24); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.fillStyle = P.low2; for (let k = 0; k < 12; k++) { const y = RIDGE + 90 + k * 64; x.beginPath(); x.moveTo(0, y + 20); x.lineTo(W, y - 4); x.lineTo(W, y + 14); x.lineTo(0, y + 38); x.fill(); }
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, 470, W, 800, P.glow, 0, .8, { rough: 16, seed: 45 });
      x.fillStyle = P.branch; const R = mulberry(m === 'spring' ? 46 : 47);
      for (let k = 0; k < 26; k++) { const u = k / 26, bx = lerp(FR.x0, 470, u) + (R() - .5) * 60, by = lerp(620, 150, u) + Math.sin(u * 9) * 30 + (R() - .5) * 70;
        if (m === 'spring') { for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; x.beginPath(); x.arc(bx + Math.cos(a) * 9, by + Math.sin(a) * 9, 8, 0, TAU); x.fill(); } }
        else { x.beginPath(); for (let p = 0; p < 5; p++) { const a = -Math.PI / 2 + (p - 2) * .55; x.moveTo(bx, by); x.lineTo(bx + Math.cos(a) * 22, by + Math.sin(a) * 22); x.lineTo(bx + Math.cos(a + .25) * 10, by + Math.sin(a + .25) * 10); } x.fill(); } }
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 300, 760, 640, 300, { lines: true, lw: 2, snowLine: S, frac: m === 'spring' ? .2 : .3, seed: 43 });
      mountain(x, 860, 770, 520, 210, { lines: true, lw: 1.6, frac: 0, seed: 44 });
      x.fillStyle = S; carve(x, wob(Array.from({ length: 28 }, (_, k) => [k * 40, 760 + Math.sin(k * 40 * .007 + 2) * 34]), 1, 3), 2.2, { taper: [0, 0] });
      carve(x, [[0, 880], [W, 880]], 2.2, { taper: [0, 0] });
      carve(x, [[0, RIDGE + 14], [W, RIDGE - 10]], 2.4, { taper: [0, 0] }); carve(x, [[0, RIDGE + 48], [W, RIDGE + 24]], 2.4, { taper: [0, 0] });
      carve(x, wob([[FR.x0 - 10, 660], [140, 540], [260, 420], [360, 300], [480, 140]], 6, 4), 18, { taper: [0, .7] });
      carve(x, wob([[200, 470], [300, 470], [400, 420]], 3, 5), 8, { taper: [0, .8] });
      carve(x, wob([[300, 350], [250, 250], [230, 160]], 3, 6), 7, { taper: [0, .8] });
      stump(x, STUMP[0], STUMP[1], 110, 64, PAL.woodL);
    } },
  };
}
const V_SPRING = {
  id: 'spring', layers: fieldLayers('spring'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    R.D(2, x => { for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) { const X = 70 + k * 115 + (r % 2) * 50, Y = RIDGE + 120 + r * 64 - X * .022; if (Math.abs(X - STUMP[0]) < 90 && r < 2) continue; tuft(x, X, Y, 26, PAL.greenD, 300 + r * 20 + k, 1, 3); } });
    // the hare races in from the grass on the right and hits the stump
    const HIT = CFG.HIT, run = seg(tq, CFG.RUN0, HIT);
    if (t < HIT) { if (t > CFG.RUN0 - .2) R.D(3, x => hare(x, lerp(1110, STUMP[0] + 78, run), STUMP[1] - 2 - (run > .1 ? Math.abs(Math.sin(tq * 4 * Math.PI)) * 10 : 0), 120, { pose: 'run', ph: tq * 2.4 })); }
    else R.D(3, x => hare(x, STUMP[0] + 110, STUMP[1] + 4, 120, { pose: 'lie', flip: true }));
    if (t >= HIT && t < HIT + .6) R.D(0, x => { x.strokeStyle = S; x.lineWidth = 4; x.lineCap = 'round'; for (let k = 0; k < 5; k++) { const a = -2.6 + k * .45; x.beginPath(); x.moveTo(STUMP[0] + 62 + Math.cos(a) * 30, STUMP[1] - 40 + Math.sin(a) * 30); x.lineTo(STUMP[0] + 62 + Math.cos(a) * 58, STUMP[1] - 40 + Math.sin(a) * 58); x.stroke(); } });
    // the farmer hoeing (facing right, toward the stump); he stops and stares once the hare runs in
    const stop = t > CFG.RUN0 + .3;
    const sw = stop ? .15 : (Math.sin(tq * TAU * .7) * .5 + .5);
    R.D(3, x => {
      traveler(x, 280, 1300, 360, { mode: 'stand', flip: true, noStaff: true, stoop: stop ? .02 : .12 + sw * .06, t: tq, noBundle: true, sash: PAL.beni });
      hoe(x, 280, 1300, 360, sw, true);
    });
    if (!stop && sw < .12) R.D(2, x => { x.fillStyle = rgba(PAL.woodD, .7); for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(490 + k * 16, 1296 - k * 7, 6 - k, 0, TAU); x.fill(); } });
  },
};
const V_HARVEST = {
  id: 'harvest', layers: fieldLayers('harvest'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    // the neighbours' rice: sheaves stooked in the upper field
    R.D(3, x => { for (let k = 0; k < 7; k++) { const X = 90 + k * 140, Y = 1010 - X * .02; x.fillStyle = PAL.ochre; x.strokeStyle = S; x.lineWidth = 1.8;
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(X, Y - 70); x.lineTo(X + s * 30, Y); x.lineTo(X + s * 6, Y); x.closePath(); x.fill(); x.stroke(); }
      x.beginPath(); x.moveTo(X - 12, Y - 78); x.lineTo(X + 12, Y - 78); x.lineTo(X + 6, Y - 58); x.lineTo(X - 6, Y - 58); x.closePath(); x.fill(); x.stroke(); } });
    // his field: wild, tall dry weeds all across the front
    R.D(2, x => { for (let r = 0; r < 5; r++) for (let k = 0; k < 10; k++) { const X = 30 + k * 112 + (r % 2) * 56, Y = RIDGE + 110 + r * 70 - X * .022; tuft(x, X, Y, 120 + r * 14, r % 2 ? '#8c7a3c' : '#a48d48', 500 + r * 31 + k, 1, 6, .3); } });
    // two neighbours walk home along the ridge with rice on shoulder poles
    const off = (tq - CFG.PRINT[3][0]) * 70;
    R.D(3, x => { for (let k = 0; k < 2; k++) { const nx = 1150 - off - k * 200, ny = RIDGE + 34 - nx * .022; if (nx < -80 || nx > 1200) continue;
      traveler(x, nx, ny, 180, { mode: 'walk', ph: tq * 1.3 + k * .5, t: tq, noStaff: true, noBundle: true, robe: k ? '#6a7a4a' : undefined, robeD: k ? '#4a5a34' : undefined });
      const py = ny - 180 * .64; x.strokeStyle = S; x.lineWidth = 5; x.beginPath(); x.moveTo(nx - 70, py); x.lineTo(nx + 70, py); x.stroke(); x.strokeStyle = PAL.woodL; x.lineWidth = 2.6; x.stroke();
      for (const e of [-62, 62]) { x.fillStyle = PAL.ochre; x.beginPath(); x.moveTo(e + nx - 16, py + 4); x.lineTo(e + nx + 16, py + 4); x.lineTo(e + nx + 22, py + 62); x.lineTo(e + nx - 22, py + 62); x.closePath(); x.fill(); x.strokeStyle = S; x.lineWidth = 1.6; x.stroke(); }
    } });
    // the farmer, still sitting by the stump, half lost in the weeds
    R.D(3, x => traveler(x, STUMP[0] + 120, STUMP[1] + 4, 190, { mode: 'sit', noStaff: true, noCup: true, noBundle: true, stoop: .1, sash: PAL.beni }));
    R.D(2, x => { for (let k = 0; k < 6; k++) tuft(x, STUMP[0] + 20 + k * 40, STUMP[1] + 30, 100, '#8c7a3c', 900 + k, 1, 5, .2); });
  },
};

// ===================== THE STUMP, CLOSE (sheet 1 summer · sheet 2 autumn) =====================
const SC = [400, 1250], SEAT = [770, 1262];
const CPAL = {
  summer: { sky: PAL.sky, glow: PAL.beniP, ground: PAL.greenL, ground2: PAL.green, far: PAL.greenD, weed: PAL.greenD, weed2: PAL.green },
  autumn: { sky: '#7a4a3a', glow: PAL.beniL, ground: PAL.ochreL, ground2: PAL.ochre, far: '#8a6a3a', weed: '#9b7a3a', weed2: '#c09a4a' },
};
function closeLayers(m) {
  const P = CPAL[m];
  return {
    sky: { g: 1, grain: .12, draw(x) { bokashi(x, 0, FR.y0, W, 900, P.sky, .9, .05, { rough: 26, seed: m === 'summer' ? 51 : 52 }); mountain(x, 820, 1000, 600, 240, { body: PAL.prusL, frac: m === 'summer' ? .12 : .3, snow: PAL.white, seed: 53 }); } },
    greens: { g: 2, grain: .06, draw(x) {
      x.fillStyle = P.far; x.beginPath(); x.moveTo(0, 1000); for (let X = 0; X <= W; X += 20) x.lineTo(X, 980 + Math.sin(X * .009) * 20); x.lineTo(W, 1060); x.lineTo(0, 1060); x.fill();
      rect(x, P.ground, 0, 1040, W, H); x.fillStyle = P.ground2; for (let k = 0; k < 9; k++) { const y = 1300 + k * 70; x.beginPath(); x.moveTo(0, y + 16); x.lineTo(W, y - 6); x.lineTo(W, y + 8); x.lineTo(0, y + 30); x.fill(); }
    } },
    reds: { g: 3, draw(x) { bokashi(x, 0, 500, W, 1000, P.glow, 0, .85, { rough: 18, seed: 54 }); } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 820, 1000, 600, 240, { lines: true, lw: 1.8, snowLine: S, frac: m === 'summer' ? .12 : .3, seed: 53 });
      x.fillStyle = S; carve(x, wob([[0, 1040], [W, 1040]], 2, 3), 2.6, { taper: [0, 0] });
      stump(x, SC[0], SC[1], 250, 150, PAL.woodL);
      hoeOnGround(x, 120, 1330, 300);
    } },
  };
}
// sky marks: suns (days) and moons (weeks) racing across
function skyTime(x, t) {
  const [D0, D1] = CFG.DAYS, [M0, M1] = CFG.WEEKS;
  if (t >= D0 && t < D1) { const u = ((t - D0) / (D1 - D0)) * 3 % 1, sx = lerp(1000, 80, u), sy = 640 - Math.sin(u * Math.PI) * 420;
    x.fillStyle = PAL.beni; x.beginPath(); x.arc(sx, sy, 56, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 2; x.stroke(); }
  if (t >= M0 && t < M1) { const k = Math.min(3, Math.floor((t - M0) / (M1 - M0) * 4));
    for (let j = 0; j <= k; j++) { const X = 260 + j * 190, Y = 300 + (j % 2) * 40, ph = (j + 1) / 4;
      x.save(); x.beginPath(); x.arc(X, Y, 44, 0, TAU); x.fillStyle = PAL.white; x.fill(); x.strokeStyle = S; x.lineWidth = 2; x.stroke();
      if (ph < 1) { x.clip(); x.fillStyle = PAL.prus; x.beginPath(); x.arc(X - 88 * ph, Y, 44, 0, TAU); x.fill(); } x.restore(); } }
}
const V_SUMMER = {
  id: 'summer', layers: closeLayers('summer'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), P = CPAL.summer;
    R.D(3, x => skyTime(x, tq));
    const sat = t >= CFG.SIT;
    const days = clamp(Math.floor((t - CFG.DAYS[0]) / ((CFG.DAYS[1] - CFG.DAYS[0]) / 3)) + 1, 0, 3), weeks = clamp(Math.floor((t - CFG.WEEKS[0]) / ((CFG.WEEKS[1] - CFG.WEEKS[0]) / 4)) + 1, 0, 4);
    const g = days * .12 + weeks * .16;
    if (!sat) {
      // he lifts the hare by the ears, laughing
      R.D(3, x => { const bob = Math.abs(Math.sin(tq * TAU * 1.2)) * 8;
        traveler(x, SEAT[0], SEAT[1] - bob, 420, { mode: 'stand', hatOff: true, noStaff: true, noBundle: true, smile: true, sash: PAL.beni, t: tq, lean: .06 });
        x.save(); x.translate(SEAT[0] - 75, SEAT[1] - 152 - bob); x.rotate(1.57); hare(x, 0, 0, 150, { pose: 'lie' }); x.restore(); });
    } else {
      R.D(3, x => traveler(x, SEAT[0], SEAT[1], 400, { mode: 'sit', noStaff: true, noCup: true, noBundle: true, sash: PAL.beni, t: tq }));
    }
    if (g > 0) R.D(2, x => { [[150, 1340], [260, 1290], [560, 1300], [620, 1250], [920, 1300], [1000, 1270], [330, 1360], [700, 1350], [880, 1365]].forEach(([X, Y], k) => tuft(x, X, Y, 200, k % 2 ? P.weed : P.weed2, 700 + k, g, 6)); });
  },
};
const V_AUTUMN = {
  id: 'autumn', layers: closeLayers('autumn'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), P = CPAL.autumn, t12 = q12(t);
    R.D(0, x => { for (let k = 0; k < 5; k++) goose(x, 1000 - (tq - 25) * 60 - k * 46, 300 + Math.abs(k - 2) * 26, 3.4, Math.sin(tq * 9 + k) * .5); });
    // the farmer: stooped, still waiting; an empty bowl in front of him
    R.D(3, x => { traveler(x, SEAT[0], SEAT[1], 400, { mode: 'sit', noStaff: true, noCup: true, noBundle: true, sash: PAL.beni, stoop: .16, t: tq });
      x.fillStyle = PAL.beni; x.strokeStyle = S; x.lineWidth = 2.4; x.beginPath(); x.moveTo(575, 1300); x.quadraticCurveTo(610, 1356, 645, 1300); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#2e2420'; x.beginPath(); x.ellipse(610, 1300, 35, 9, 0, 0, TAU); x.fill(); x.stroke(); });
    R.D(2, x => { [[150, 1340], [260, 1290], [560, 1290], [520, 1250], [930, 1310], [1000, 1270], [330, 1360], [700, 1360], [860, 1370], [60, 1300]].forEach(([X, Y], k) => tuft(x, X, Y, 330, k % 2 ? P.weed : P.weed2, 800 + k, 1, 7, .25)); });
    // maple leaves drifting down (12 fps)
    R.D(3, x => { for (let k = 0; k < 14; k++) { const ph = (t12 * .22 + k * .137) % 1, lx = (k * 157 + Math.sin(t12 * 1.3 + k) * 60) % 1000 + 40, ly = FR.y0 + ph * 1300;
      x.save(); x.translate(lx, ly); x.rotate(t12 * 1.5 + k); x.fillStyle = k % 3 ? '#c4502f' : PAL.ochre; x.beginPath(); for (let p = 0; p < 5; p++) { const a = -Math.PI / 2 + (p - 2) * .6; x.moveTo(0, 0); x.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); x.lineTo(Math.cos(a + .3) * 8, Math.sin(a + .3) * 8); } x.fill(); x.restore(); } });
  },
};

export const VIEWS = [V_SPRING, V_SUMMER, V_AUTUMN, V_HARVEST];
