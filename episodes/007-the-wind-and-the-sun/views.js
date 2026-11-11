// The Wind and the Sun — one mountain road in three impressions (1080×1920). g: 0 key · 1 blues · 2 greens · 3 reds/figures
import { clamp, lerp, seg, mulberry, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, bokashi } from './print.js';
import { mountain, pine } from './nature.js';
import { traveler } from './traveler.js';
import { face } from './figures.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8, q12 = t => Math.floor(t * 12) / 12;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
function shp(x, pts, fill, lw, sm = true, closed = true) { x.beginPath(); sm ? smooth(x, pts, closed) : poly(x, pts); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { x.lineWidth = lw; x.strokeStyle = S; x.stroke(); } }
const ROAD = 1300, HORIZ = 1010;
const MODE = {
  calm: { sky: PAL.sky, glow: PAL.beniP, hill: PAL.green, hillD: PAL.greenD, road: '#dccb9c', fore: PAL.greenL, mt: PAL.prusL, lean: -.3, seed: 61 },
  gale: { sky: PAL.prus, glow: PAL.greyL, hill: '#7f8f62', hillD: '#4f6146', road: '#c2b38a', fore: '#93a06c', mt: PAL.ai, lean: 1.15, seed: 62 },
  sun: { sky: PAL.ochreL, glow: PAL.beniL, hill: PAL.greenL, hillD: PAL.green, road: '#ead9a6', fore: '#c3cc84', mt: PAL.prusL, lean: -.3, seed: 63 },
};
function layers(m) {
  const P = MODE[m];
  return {
    sky: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 760, P.sky, .95, 0, { rough: 24, seed: P.seed });
      mountain(x, 360, HORIZ + 10, 760, 330, { body: P.mt, snow: PAL.white, frac: .26, seed: 64 });
    } },
    reds: { g: 3, draw(x) { bokashi(x, 0, 640, W, HORIZ, P.glow, 0, .85, { rough: 16, seed: P.seed + 5 }); } },
    greens: { g: 2, grain: .06, draw(x) {
      x.fillStyle = P.hillD; x.beginPath(); x.moveTo(0, HORIZ + 60); for (let X = 0; X <= W; X += 20) x.lineTo(X, HORIZ - 30 + Math.sin(X * .006 + 1) * 40); x.lineTo(W, 1200); x.lineTo(0, 1200); x.fill();
      rect(x, P.hill, 0, 1100, W, ROAD - 60);
      x.fillStyle = P.road; x.beginPath(); x.moveTo(0, ROAD - 70); x.lineTo(W, ROAD - 40); x.lineTo(W, ROAD + 50); x.lineTo(0, ROAD + 40); x.fill();
      rect(x, P.fore, 0, ROAD + 40, W, H);
      x.fillStyle = P.hillD; for (let k = 0; k < 9; k++) { const y = ROAD + 110 + k * 70; x.beginPath(); x.moveTo(0, y + 16); x.lineTo(W, y - 6); x.lineTo(W, y + 10); x.lineTo(0, y + 34); x.fill(); }
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 360, HORIZ + 10, 760, 330, { lines: true, lw: 2, snowLine: S, frac: .26, seed: 64 });
      x.fillStyle = S; carve(x, wob(Array.from({ length: 28 }, (_, k) => [k * 40, HORIZ - 30 + Math.sin(k * 40 * .006 + 1) * 40]), 1, 3), 2.2, { taper: [0, 0] });
      carve(x, [[0, ROAD - 70], [W, ROAD - 40]], 2.4, { taper: [0, 0] }); carve(x, [[0, ROAD + 40], [W, ROAD + 50]], 2.4, { taper: [0, 0] });
      pine(x, 915, ROAD - 40, 1.45, { lean: P.lean, seed: 5 });
      pine(x, 110, ROAD - 60, .9, { lean: P.lean * .8, seed: 2 });
      shp(x, [[150, ROAD + 30], [170, ROAD - 26], [230, ROAD - 40], [290, ROAD - 14], [300, ROAD + 34]], PAL.greyL, 2.6, false);   // wayside rock
    } },
  };
}
// —— the Wind: a cloud with a face ——
const BLOBS = [[0, 0, 1], [-.95, .18, .68], [.95, .12, .72], [-.5, -.5, .68], [.5, -.46, .64], [0, .5, .78], [-1.5, .38, .42], [1.52, .34, .46]];
function wind(x, cx, cy, r, mood, o = {}) {
  const col = o.col || PAL.white;
  x.save(); x.strokeStyle = S; x.lineWidth = 7; for (const [a, b, k] of BLOBS) { x.beginPath(); x.arc(cx + a * r, cy + b * r, k * r, 0, TAU); x.stroke(); }
  x.fillStyle = col; for (const [a, b, k] of BLOBS) { x.beginPath(); x.arc(cx + a * r, cy + b * r, k * r, 0, TAU); x.fill(); }
  x.strokeStyle = S; x.lineWidth = 2.4; for (const [a, b, s0] of [[-1.2, .5, 1], [1.2, .46, -1], [-.3, -.9, 1]]) { x.beginPath(); x.arc(cx + a * r, cy + b * r, r * .22, s0 > 0 ? .4 : 2.2, s0 > 0 ? 2.4 : 4.2); x.stroke(); }
  x.restore();
  face(x, cx, cy - r * .05, r * .78, mood);
  if (o.blow) {   // puffed cheeks and a round blowing mouth, aimed right
    x.save(); x.fillStyle = PAL.beniL; for (const sd of [-1, 1]) { x.beginPath(); x.arc(cx + sd * r * .52, cy + r * .2, r * .17, 0, TAU); x.fill(); }
    x.fillStyle = col; x.beginPath(); x.ellipse(cx + r * .05, cy + r * .3, r * .2, r * .16, 0, 0, TAU); x.fill();
    x.strokeStyle = S; x.lineWidth = 5; x.beginPath(); x.ellipse(cx + r * .05, cy + r * .3, r * .1, r * .12, 0, 0, TAU); x.stroke(); x.restore();
  }
  if (o.sweat) { x.save(); x.fillStyle = PAL.sky; x.strokeStyle = S; x.lineWidth = 2; for (const [a, b] of [[.75, -.35], [.95, -.05]]) { x.beginPath(); x.moveTo(cx + a * r, cy + b * r - 16); x.quadraticCurveTo(cx + a * r + 13, cy + b * r + 8, cx + a * r, cy + b * r + 14); x.quadraticCurveTo(cx + a * r - 13, cy + b * r + 8, cx + a * r, cy + b * r - 16); x.fill(); x.stroke(); } x.restore(); }
}
// —— the Sun: a red disc with rays and a face ——
function sun(x, cx, cy, r, mood, rays = 0, ph = 0) {
  x.save();
  if (rays > 0) { x.fillStyle = PAL.ochre; x.strokeStyle = S; x.lineWidth = 2.2; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + ph, L = r * (1.18 + rays * (k % 2 ? .5 : .85)); x.beginPath(); x.moveTo(cx + Math.cos(a - .09) * r * 1.08, cy + Math.sin(a - .09) * r * 1.08); x.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); x.lineTo(cx + Math.cos(a + .09) * r * 1.08, cy + Math.sin(a + .09) * r * 1.08); x.closePath(); x.fill(); x.stroke(); } }
  x.fillStyle = PAL.beni; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 5; x.stroke();
  x.restore();
  face(x, cx, cy, r * .82, mood);
}
// —— streaks of wind and flying leaves (12 fps) ——
function gale(x, t, k) {
  const R = mulberry(500 + Math.floor(t * 12));
  x.save(); x.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const y = 520 + R() * 800, x0 = 380 + R() * 500, L = 160 + R() * 320, b = (R() - .5) * 50;
    x.strokeStyle = i % 3 ? 'rgba(246,239,220,.9)' : S; x.lineWidth = (i % 3 ? 5 : 2) * k;
    x.beginPath(); x.moveTo(x0, y); x.quadraticCurveTo(x0 + L * .5, y + b, x0 + L, y + b * .3); x.stroke();
  }
  x.fillStyle = PAL.greenD; for (let i = 0; i < 9; i++) { const px = 300 + R() * 740, py = 800 + R() * 520, a = R() * TAU; x.save(); x.translate(px, py); x.rotate(a); x.beginPath(); x.ellipse(0, 0, 13, 5, 0, 0, TAU); x.fill(); x.restore(); }
  x.restore();
}
const cloak = (x, px, py) => shp(x, [[px - 60, py], [px - 46, py - 46], [px, py - 62], [px + 50, py - 44], [px + 66, py], [px + 30, py + 6], [px - 26, py + 6]], '#a38650', 2.4);
const SZ = 250, FEET = ROAD + 18;

const V_CALM = { id: 'calm', layers: layers('calm'), paint(x, t, R) {
  R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
  const tq = q8(t), said = t >= CFG.VO.L03 - .2;
  R.D(3, x => { sun(x, 800, 610, 118, 'calm', .25, 0); wind(x, 310, 640 + Math.sin(tq * 1.3) * 6, 128, said ? 'proud' : 'angry'); });
  R.D(3, x => traveler(x, lerp(1000, 560, seg(t, 0, CFG.PRINT[1][0] + .6)), FEET, SZ, { mode: 'walk', ph: tq * 1.38, t: tq, mino: true }));
} };
const V_GALE = { id: 'gale', layers: layers('gale'), paint(x, t, R) {
  R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
  const tq = q8(t), blow = t >= CFG.BLOW[0] && t < CFG.BLOW[1], up = t >= CFG.GIVEUP - .05, k = blow ? 1 : 0;
  const shake = blow ? [Math.sin(q12(t) * 40) * 5, Math.cos(q12(t) * 31) * 4] : [0, 0];
  R.D(3, x => wind(x, 340 + shake[0], 640 + shake[1], blow ? 178 : 150, up ? 'shock' : 'angry', { blow, sweat: up, col: up ? PAL.greyL : PAL.white }));
  if (blow) R.D(0, x => gale(x, t, 1));
  const push = blow ? Math.sin(tq * 5) * 6 : 0;
  R.D(3, x => traveler(x, lerp(700, 640, seg(t, CFG.BLOW[0], CFG.BLOW[1])) + push, FEET, SZ, { mode: blow ? 'walk' : 'stand', ph: tq * .5, t: tq, wind: k * 1.6, holdHat: true, stoop: blow ? .3 : .1, mino: true }));
} };
const V_SUN = { id: 'sun', layers: layers('sun'), paint(x, t, R) {
  R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
  const tq = q8(t), sh = seg(t, CFG.SHINE, CFG.SHINE + 2.5), off = t >= CFG.OFF, wipe = t >= CFG.WIPE && !off, walking = t < CFG.WIPE - .3;
  R.D(3, x => { wind(x, 215, 560, 84, 'calm', { col: PAL.greyL }); sun(x, 700, 640, lerp(120, 172, sh), 'smile', .3 + sh * .7, q8(t) * .25); });
  if (off) R.D(3, x => cloak(x, 400, FEET + 2));
  if (wipe) R.D(0, x => { x.strokeStyle = S; x.lineWidth = 3; x.lineCap = 'round'; for (const [a, b] of [[-64, -250], [-78, -222], [52, -246]]) { x.beginPath(); x.moveTo(560 + a, FEET + b); x.lineTo(560 + a * 1.25, FEET + b - 16); x.stroke(); } });
  R.D(3, x => traveler(x, lerp(780, 560, seg(t, CFG.PRINT[2][0], CFG.WIPE - .3)), FEET, SZ, { mode: walking ? 'walk' : 'stand', ph: tq * 1.2, t: tq, mino: !off, holdHat: wipe, smile: off }));
} };
export const VIEWS = [V_CALM, V_GALE, V_SUN];
