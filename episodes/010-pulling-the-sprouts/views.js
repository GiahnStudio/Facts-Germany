// Pulling the Sprouts — one rice paddy in four impressions (1080×1920). g: 0 key · 1 blues · 2 greens · 3 reds/figures
import { clamp, lerp, seg, hash, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, bokashi, mix } from './print.js';
import { mountain, pine, rain } from './nature.js';
import { traveler } from './traveler.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
function shp(x, pts, fill, lw, sm = true, closed = true) { x.beginPath(); sm ? smooth(x, pts, closed) : poly(x, pts); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { x.lineWidth = lw; x.strokeStyle = S; x.stroke(); } }
const HORIZ = 930, DIKE = 1004, WATER = 1056;
const MODE = {
  dawn: { sky: PAL.sky, glow: PAL.beniP, hill: PAL.green, hillD: PAL.greenD, water: '#c6d8d8', band: '#a3bfc8', earth: '#b89a6a', mt: PAL.prusL, wall: PAL.plaster, door: PAL.woodD, sprout: PAL.green, seed: 71 },
  night: { sky: PAL.prusD, glow: PAL.prusL, hill: '#3f5a4a', hillD: '#2a4038', water: '#35557a', band: '#27436a', earth: '#6b5a48', mt: PAL.prus, wall: '#8d8a7c', door: PAL.ochre, sprout: '#7fa07a', seed: 72 },
  sun: { sky: PAL.ochreL, glow: PAL.beniL, hill: PAL.greenL, hillD: PAL.green, water: '#f0dfb2', band: '#e2c48a', earth: '#c2a26c', mt: PAL.prusL, wall: PAL.plaster, door: PAL.woodD, sprout: PAL.green, seed: 73 },
  rain: { sky: PAL.grey, glow: PAL.greyL, hill: '#8c9a6e', hillD: '#5d7052', water: '#b7c5bc', band: '#97aba4', earth: '#a08a64', mt: PAL.greyD, wall: '#cfc6ac', door: PAL.woodD, sprout: PAL.greenD, seed: 74 },
};
const hillY = X => HORIZ - 26 + Math.sin(X * .0058 + 1.4) * 38;
function hut(x, P) {
  shp(x, [[104, 892], [336, 892], [336, DIKE + 8], [104, DIKE + 8]], P.wall, 2.6, false);
  shp(x, [[196, 918], [256, 918], [256, DIKE + 8], [196, DIKE + 8]], P.door, 2.2, false);
  shp(x, [[52, 900], [128, 772], [312, 772], [388, 900]], PAL.straw, 3, false);
  x.strokeStyle = '#7a5a2a'; x.lineWidth = 1.6; for (let k = 0; k < 15; k++) { const u = (k + .5) / 15, xa = lerp(134, 306, u), xb = lerp(64, 376, u); x.beginPath(); x.moveTo(xa, 780); x.lineTo(xb, 894); x.stroke(); }
  rect(x, S, 120, 764, 320, 774);
}
function layers(m) {
  const P = MODE[m];
  return {
    sky: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 780, P.sky, .95, 0, { rough: 24, seed: P.seed });
      mountain(x, 700, HORIZ + 6, 640, 300, { body: P.mt, snow: PAL.white, frac: .24, seed: 75 });
      if (m === 'night') { x.fillStyle = PAL.white; x.beginPath(); x.arc(770, 420, 78, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 3; x.stroke(); }
      rect(x, P.water, 0, WATER, W, H);
      x.fillStyle = P.band; for (let k = 0; k < 13; k++) { const y = WATER + 28 + k * 66, o = hash(k * 3.1 + P.seed) * 300; x.beginPath(); x.moveTo(-40 + o, y); x.quadraticCurveTo(300 + o, y - 9, 660 + o, y); x.quadraticCurveTo(300 + o, y + 9, -40 + o, y); x.fill(); x.beginPath(); x.moveTo(o - 700, y + 30); x.quadraticCurveTo(o - 450, y + 23, o - 200, y + 30); x.quadraticCurveTo(o - 450, y + 37, o - 700, y + 30); x.fill(); }
      if (m === 'night') { x.fillStyle = 'rgba(246,239,220,.85)'; for (let k = 0; k < 9; k++) { const y = WATER + 40 + k * 44, w = 120 - k * 9 + hash(k) * 30, cx = 770 + (hash(k + 5) - .5) * 26; x.beginPath(); x.ellipse(cx, y, w / 2, 5, 0, 0, TAU); x.fill(); } }
    } },
    reds: { g: 3, draw(x) { bokashi(x, 0, 600, W, HORIZ, P.glow, 0, .85, { rough: 16, seed: P.seed + 5 }); } },
    greens: { g: 2, grain: .06, draw(x) {
      x.fillStyle = P.hillD; x.beginPath(); x.moveTo(0, DIKE + 4); for (let X = 0; X <= W; X += 20) x.lineTo(X, hillY(X)); x.lineTo(W, DIKE + 4); x.fill();
      x.fillStyle = P.hill; x.beginPath(); x.moveTo(0, DIKE + 4); for (let X = 0; X <= W; X += 20) x.lineTo(X, HORIZ + 44 + Math.sin(X * .011) * 12); x.lineTo(W, DIKE + 4); x.fill();
      x.fillStyle = P.earth; x.beginPath(); x.moveTo(0, DIKE); x.lineTo(W, DIKE - 6); x.lineTo(W, WATER); x.lineTo(0, WATER + 6); x.fill();
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 700, HORIZ + 6, 640, 300, { lines: true, lw: 2, snowLine: S, frac: .24, seed: 75 });
      x.fillStyle = S; carve(x, wob(Array.from({ length: 28 }, (_, k) => [k * 40, hillY(k * 40)]), 1, 3), 2.2, { taper: [0, 0] });
      carve(x, [[0, DIKE], [W, DIKE - 6]], 2.4, { taper: [0, 0] }); carve(x, [[0, WATER + 6], [W, WATER]], 2.6, { taper: [0, 0] });
      pine(x, 940, DIKE + 6, 1.05, { seed: 4 });
      hut(x, P);
    } },
  };
}
// —— one rice sprout: three blades from one foot. h = height, droop 0…1 folds it over, root 0…1 shows the torn roots ——
function sprout(x, px, py, h, droop, col, k, root = 0) {
  const by = py - root * 9 * k;
  x.save(); x.lineCap = 'round';
  x.strokeStyle = 'rgba(35,31,28,.45)'; x.lineWidth = 1.6; x.beginPath(); x.ellipse(px, py + 3, 17 * k, 4.2 * k, 0, 0, TAU); x.stroke();
  if (root > 0) { x.strokeStyle = PAL.white; x.lineWidth = 2.2 * k; for (const a of [-.7, 0, .7]) { x.beginPath(); x.moveTo(px, by); x.lineTo(px + a * 9 * k, by + 10 * k * root); x.stroke(); } }
  for (const pass of [0, 1]) for (const [sd, hk] of [[-1, .8], [1, .86], [0, 1]]) {
    const sp = sd * h * .3 * (1 + droop * 1.3), tx = px + sp + droop * h * .6 * (sd || .8), ty = by - h * hk * (1 - droop * .82);
    x.beginPath(); x.moveTo(px, by); x.quadraticCurveTo(px + sp * .2, by - h * hk * .8 * (1 - droop * .2), tx, ty);
    x.strokeStyle = pass ? col : S; x.lineWidth = (pass ? 5 : 8.6) * k; x.stroke();
  }
  x.restore();
}
const ROWS = [[1128, .85], [1212, 1], [1300, 1.15], [1412, 1.3], [1530, 1.45], [1660, 1.6], [1800, 1.75]];
function field(x, r0, r1, fn) {
  for (let r = r0; r < r1; r++) { const [y, k] = ROWS[r]; for (let i = 0; i < 12; i++) { const px = 96 + i * 84 + (r % 2) * 42; if (px > 1004) continue; const s = fn(px, y, r, i); sprout(x, px, y, 30 * k * s.h, s.droop || 0, s.col, k, s.root || 0); } }
}
const SZ = 270, FEET = 1350;
const FARM = { noStaff: true, noBundle: true, sash: PAL.beni };
const SON = { noStaff: true, noBundle: true, hatOff: true, robe: '#7a8a5a', robeD: '#56653e', sash: PAL.ochre };
const ripple = (x, px, py, w, tq) => { x.strokeStyle = 'rgba(35,31,28,.55)'; x.lineWidth = 2; for (const k of [1, 1.7]) { x.beginPath(); x.ellipse(px, py, w * k * (1 + .08 * Math.sin(tq * 6 + k)), 7 * k, 0, 0, TAU); x.stroke(); } };

const V_DAWN = { id: 'dawn', layers: layers('dawn'), paint(x, t, R) {
  R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
  const tq = q8(t), P = MODE.dawn, walking = t < CFG.WALK[1], kneel = t >= CFG.KNEEL[0] && t < CFG.KNEEL[1], cry = t >= CFG.CRY;
  const fx = lerp(1010, 640, seg(t, CFG.WALK[0], CFG.WALK[1])), st = () => ({ h: 1, col: P.sprout });
  R.D(2, x => field(x, 0, 3, st));
  R.D(3, x => {
    ripple(x, fx, FEET, 44, tq);
    traveler(x, fx, FEET - (cry ? Math.abs(Math.sin(tq * 7)) * 12 : 0), SZ, { ...FARM, mode: walking ? 'walk' : 'stand', ph: tq * 1.2, t: tq, stoop: kneel ? .62 : 0, lean: cry ? .1 : 0, shout: cry });
    if (kneel) { x.strokeStyle = S; x.lineWidth = 3; x.lineCap = 'round'; const mx = fx - 196, y0 = ROWS[2][0], y1 = y0 - 36; x.beginPath(); x.moveTo(mx, y0); x.lineTo(mx, y1); x.moveTo(mx - 9, y0); x.lineTo(mx + 9, y0); x.moveTo(mx - 9, y1); x.lineTo(mx + 9, y1); x.stroke(); }
    if (cry) { x.strokeStyle = S; x.lineWidth = 3.4; x.lineCap = 'round'; for (const [a, b] of [[-120, -250], [-134, -214], [-96, -282]]) { x.beginPath(); x.moveTo(fx + a, FEET + b); x.lineTo(fx + a * 1.22, FEET + b - 18); x.stroke(); } }
  });
  R.D(2, x => field(x, 3, 7, st));
} };
const V_NIGHT = { id: 'night', layers: layers('night'), paint(x, t, R) {
  R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
  const tq = q8(t), P = MODE.night, pulling = t >= CFG.PULL[0] && t < CFG.PULL[1];
  const fx = lerp(1010, 300, seg(t, CFG.PULL[0], CFG.PULL[1])), tug = pulling && Math.sin(tq * TAU * 1.5) > 0;
  const st = px => { const u = clamp((px - fx + 20) / 70); return { h: 1 + 1.15 * u, col: P.sprout, root: u }; };
  R.D(2, x => field(x, 0, 3, st));
  R.D(3, x => { ripple(x, fx, FEET, 44, tq); traveler(x, fx, FEET, SZ, { ...FARM, mode: pulling ? 'walk' : 'stand', ph: tq * .7, t: tq, stoop: pulling ? (tug ? .78 : .5) : .12 }); });
  R.D(2, x => field(x, 3, 7, st));
} };
const V_SUN = { id: 'sun', layers: layers('sun'), paint(x, t, R) {
  const tq = q8(t), P = MODE.sun, rise = seg(t, CFG.PRINT[2][0], CFG.VO.L09);
  R.L('sky');
  R.D(3, x => { x.fillStyle = PAL.beni; x.beginPath(); x.arc(770, lerp(985, 720, rise), 96, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 4; x.stroke(); });
  R.L('reds'); R.L('greens'); R.L('key');
  const st = (px, y) => { const w = clamp((q8(t) - CFG.WILT - hash(px * .13 + y) * 1.6) / 1.5); return { h: 2.15, droop: w * .96, col: mix(P.sprout, '#c9a45c', w), root: 1 }; };
  const run = seg(t, CFG.RUN[0], CFG.RUN[1]), come = seg(t, CFG.COME, CFG.COME + 2.2), boast = t < CFG.RUN[0];
  R.D(3, x => {
    const sx = lerp(440, 800, run);
    traveler(x, sx, WATER - 4, 170, { ...SON, mode: run > 0 && run < 1 ? 'walk' : 'stand', ph: tq * 2, t: tq, flip: run > 0, shout: run >= 1 });
    if (come <= 0) traveler(x, 300, WATER - 2, 235, { ...FARM, mode: 'stand', hatOff: true, flip: true, smile: true, lean: boast ? .1 : 0, t: tq });
  });
  R.D(2, x => field(x, 0, 3, st));
  if (come > 0) R.D(3, x => { const fx = lerp(330, 560, come); ripple(x, fx, FEET, 44, tq); traveler(x, fx, lerp(WATER, FEET, clamp(come * 3)), SZ, { ...FARM, hatOff: true, flip: true, mode: come < 1 ? 'walk' : 'stand', ph: tq * 1.4, t: tq, stoop: come >= 1 ? .55 : .1 }); });
  R.D(2, x => field(x, 3, 7, st));
} };
const V_RAIN = { id: 'rain', layers: layers('rain'), paint(x, t, R) {
  R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
  const tq = q8(t), P = MODE.rain, grow = lerp(1, 1.55, seg(t, CFG.VO.L11, CFG.MORAL.t)), st = () => ({ h: grow, col: P.sprout });
  R.D(3, x => {
    traveler(x, 560, WATER, 235, { ...FARM, mode: 'sit', noCup: true, mino: true, t: tq });
    traveler(x, 700, WATER, 170, { ...SON, mode: 'sit', noCup: true, t: tq });
  });
  R.D(2, x => { field(x, 0, 7, st); });
  R.D(0, x => rain(x, t, [FR.x0, FR.y0, FR.x1, FR.y1], { sets: [[-1.4, 130, 1.7, PAL.sumi, .42], [-1.32, 80, 1.2, PAL.greyD, .36]] }));
} };
export const VIEWS = [V_DAWN, V_NIGHT, V_SUN, V_RAIN];
