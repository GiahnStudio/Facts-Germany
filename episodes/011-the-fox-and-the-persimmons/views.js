// The Fox and the Persimmons — one persimmon tree in three impressions + a close view of the branch under the moon (1080×1920).
// g: 0 key · 1 blues · 2 greens/earth · 3 reds/figures
import { clamp, lerp, seg, hash, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, bokashi, mix } from './print.js';
import { mountain } from './nature.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
function shp(x, pts, fill, lw, sm = true, closed = true) { x.beginPath(); sm ? smooth(x, pts, closed) : poly(x, pts); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { x.lineWidth = lw; x.strokeStyle = S; x.lineJoin = 'round'; x.stroke(); } }
// a limb: a tapered band along a point list
function limb(x, pts, w0, w1, fill, lw = 2.4) {
  const L = [], R = [], n = pts.length;
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; const w = lerp(w0, w1, i / (n - 1)) / 2; L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]); }
  shp(x, L.concat(R.reverse()), fill, lw, true);
}
const KAKI = '#e8862c', KAKI_D = '#d06f22', FLESH = '#f6c57e', CALYX = '#55643c', BARK = '#4a3626';
const FOX = '#c2622d', FOXD = '#5a3423', CREAM = PAL.white;
const CROW = '#2a2b33', CROW_W = '#1b2232', CROW_H = '#5d6b86';
const GROUND = 1290, gy = X => X < 260 ? GROUND - (260 - X) * .45 : GROUND;
const hillY = X => 1010 + Math.sin(X * .005 + .6) * 34;

// —— persimmon: a squat round fruit with a four-lobed calyx and a short stem ——
function kaki(x, cx, cy, r, o = {}) {
  x.save(); x.translate(cx, cy); x.lineCap = 'round';
  x.strokeStyle = S; x.lineWidth = o.lw || 2.4; x.beginPath(); x.moveTo(0, -r * .86); x.lineTo(r * (o.sx ?? .1), -r * (o.stem ?? 1.5)); x.stroke();
  x.fillStyle = o.col || KAKI; x.beginPath(); x.ellipse(0, 0, r * 1.08, r * .93, 0, 0, TAU); x.fill(); x.stroke();
  x.fillStyle = CALYX; for (const a of [-1, -.36, .36, 1]) { x.beginPath(); x.ellipse(a * r * .36, -r * (.9 - Math.abs(a) * .08), r * .25, r * .12, a * .55, 0, TAU); x.fill(); }
  x.restore();
}
function leaf(x, cx, cy, rot, col, k = 1) {
  x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(k, k);
  x.beginPath(); x.moveTo(-19, 0); x.quadraticCurveTo(-2, -12, 19, 0); x.quadraticCurveTo(-2, 12, -19, 0); x.fillStyle = col; x.fill(); x.strokeStyle = S; x.lineWidth = 1.6; x.stroke();
  x.beginPath(); x.moveTo(-15, 0); x.lineTo(14, 0); x.lineWidth = 1; x.stroke(); x.restore();
}

// —— fox: side view facing left, feet at y=0, ~100 units nose to rump. pose stand | walk | leap | sit ——
function fox(x, px, py, s, o = {}) {
  const u = s / 100, lw = 2.6 / u, pose = o.pose || 'stand', ph = (o.ph || 0) * TAU, st = pose === 'walk' ? Math.sin(ph) : 0, sit = pose === 'sit', leap = pose === 'leap';
  x.save(); x.translate(px, py); x.scale(u * (o.flip ? -1 : 1), u); x.lineJoin = 'round'; x.lineCap = 'round';
  if (o.rot) { x.translate(0, -30); x.rotate(o.rot); x.translate(0, 30); }
  // tail
  if (sit) { shp(x, [[12, -12], [34, -18], [58, -14], [72, -5], [62, 2], [36, 2], [14, 0]], FOX, lw); shp(x, [[54, -14], [72, -5], [62, 2], [50, -4]], CREAM, lw * .8); }
  else { x.save(); x.translate(28, -36); x.rotate(.3 - (o.tailUp || 0) + (pose === 'walk' ? Math.sin(ph * .5) * .08 : 0)); shp(x, [[-2, -6], [20, -14], [44, -11], [60, 0], [46, 11], [22, 10], [-2, 6]], FOX, lw); shp(x, [[40, -11], [60, 0], [46, 11], [37, 1]], CREAM, lw * .8); x.restore(); }
  const leg = (lx, sw, col) => { const fx = lx + sw; shp(x, [[lx - 3.8, -26], [lx + 3.8, -26], [fx + 3, 0], [fx - 3, 0]], col, lw * .8, false); if (col !== FOXD) shp(x, [[lerp(lx, fx, .55) - 3.3, -11.5], [lerp(lx, fx, .55) + 3.3, -11.5], [fx + 3, 0], [fx - 3, 0]], FOXD, 0, false); };
  let hx = -30, hy = -42;
  if (sit) {
    shp(x, [[-17, -52], [-4, -57], [10, -45], [22, -24], [25, -5], [12, 0], [-12, 0], [-15, -22]], FOX, lw);
    shp(x, [[-17, -49], [-8, -45], [-6, -27], [-14, -23]], CREAM, 0);
    leg(-12, 0, FOX); leg(-3, 1, FOX);
    shp(x, [[4, -12], [20, -16], [27, -4], [14, 0], [0, 0]], FOX, lw * .8);
    hx = -14; hy = -55;
  } else {
    const a = leap ? -15 : pose === 'stand' ? -3 : st * 9, b = leap ? 15 : pose === 'stand' ? 3 : -st * 9;
    leg(-14, -a * .8, FOXD); leg(27, -b * .8, FOXD);
    x.fillStyle = FOX; x.beginPath(); x.ellipse(2, -33, 31, 13.5, -.04, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = lw; x.stroke();
    shp(x, [[-25, -40], [-34, -46], [-36, -34], [-27, -24]], FOX, 0);
    leg(-23, a, FOX); leg(19, b, FOX);
  }
  // head (turns about the neck: nose > 0 lifts the snout)
  x.translate(hx, hy); x.rotate(o.nose || 0);
  shp(x, [[-5, -15], [-1, -33], [5, -14]], FOXD, lw * .8, false);
  shp(x, [[4, -8], [-3, -18], [-14, -18], [-24, -10], [-37, -3], [-36, 1.5], [-22, 5], [-9, 7], [3, 5]], FOX, lw);
  shp(x, [[-36, 1], [-22, 5], [-9, 7], [-12, 0], [-24, -3]], CREAM, 0);
  if (o.open) { shp(x, [[-33, 3], [-21, 6], [-29, 12]], FOX, lw * .7, false); }
  shp(x, [[-12, -17], [-10, -37], [-2, -17]], FOX, lw, false); shp(x, [[-10, -19], [-9.5, -30], [-5, -19]], FOXD, 0, false);
  x.strokeStyle = S; x.fillStyle = S; x.lineWidth = lw * .9;
  if (o.eye === 'shut') { x.beginPath(); x.moveTo(-19, -8); x.quadraticCurveTo(-15.5, -5.6, -12, -8); x.stroke(); }
  else { x.beginPath(); x.arc(-15.5, -8.5, 2, 0, TAU); x.fill(); }
  x.beginPath(); x.arc(-36.5, -1.2, 2.3, 0, TAU); x.fill();
  x.restore();
}
// —— crow (sitting), side view facing left, feet at y=0 ——
function crow(x, px, py, s, o = {}) {
  const u = s / 100, lw = clamp(s / 70, 1.1, 2.8) / u;
  x.save(); x.translate(px, py); x.scale(o.flip ? -u : u, u); x.lineJoin = 'round';
  x.strokeStyle = S; x.lineCap = 'round'; x.lineWidth = lw * 1.3;
  [[4, -24, 2], [14, -24, 13]].forEach(([a, b, c]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, 0); x.stroke(); x.beginPath(); x.moveTo(c, 0); x.lineTo(c - 8, 1); x.moveTo(c, 0); x.lineTo(c + 5, 1); x.stroke(); });
  x.translate(8, -30); x.rotate(-(o.lean || 0)); x.translate(-8, 30);
  shp(x, [[28, -36], [62, -18], [57, -11], [26, -26]], CROW_W, lw, false);
  shp(x, [[-18, -60], [-4, -67], [14, -62], [30, -46], [42, -34], [30, -26], [12, -24], [-6, -30], [-17, -42]], CROW, lw);
  x.save(); x.translate(-12, -58); x.rotate(-(o.head || 0)); x.translate(12, 58);
  shp(x, [[-12, -62], [-14, -72], [-22, -80], [-32, -78], [-36, -70], [-31, -62], [-20, -58]], CROW, lw);
  const op = o.open ? 5 : 0;
  shp(x, [[-34, -74], [-53, -70 - op * .5], [-34, -68]], '#34343a', lw * .9, false);
  if (op) shp(x, [[-34, -67], [-50, -62], [-33, -64]], '#34343a', lw * .9, false);
  x.fillStyle = PAL.white; x.beginPath(); x.arc(-26, -72, 3, 0, TAU); x.fill(); x.fillStyle = S; x.beginPath(); x.arc(-26.6, -72, 1.6, 0, TAU); x.fill();
  x.restore();
  shp(x, [[-8, -57], [10, -61], [28, -48], [46, -30], [28, -30], [8, -36], [-6, -46]], CROW_W, lw);
  x.strokeStyle = CROW_H; x.lineWidth = lw * .5; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(10 + k * 7, -50 + k * 3); x.lineTo(30 + k * 6, -36 + k * 1); x.stroke(); }
  x.restore();
}

// —— the tree (shared by sheets 0–2) ——
const TRUNK = [[806, GROUND + 8], [792, 1180], [770, 1050], [776, 930], [752, 830], [724, 720]];
const BR = [
  [[756, 836], [690, 748], [596, 694], [506, 682], [424, 702]],
  [[734, 746], [694, 624], [626, 524], [566, 452], [524, 402]],
  [[726, 724], [744, 604], [790, 504], [812, 424]],
  [[772, 904], [842, 804], [898, 724], [936, 650]],
];
const LOW = [430, 775];
const FRUIT = [LOW, [596, 742], [688, 792], [644, 578], [574, 502], [508, 446], [772, 560], [832, 462], [862, 832], [926, 708], [712, 664], [552, 596]];
const TLEAF = [[420, 690, .4], [500, 668, -.3], [520, 392, -.9], [560, 440, .5], [814, 410, -1.2], [940, 636, -.7], [900, 716, .9], [640, 512, -.5], [704, 610, 1.1], [782, 492, .3]];
const STONE = [[548, GROUND + 4], [560, 1232], [602, 1200], [668, 1198], [706, 1240], [714, GROUND + 4]];
const MODE = {
  noon: { sky: PAL.sky, glow: PAL.ochreL, ga: .55, far: '#a8743c', field: '#c9a45c', earth: '#b89a6a', grass: '#8d8a4a', mt: PAL.prusL, leafA: PAL.beni, leafB: PAL.ochre, seed: 81 },
  sunset: { sky: '#d9906a', glow: PAL.beni, ga: .7, far: '#8a5a38', field: '#b98a4a', earth: '#a8875c', grass: '#7a7440', mt: PAL.ai, leafA: PAL.beni, leafB: PAL.ochre, seed: 82 },
  dusk: { sky: PAL.ai, glow: '#9a86a8', ga: .75, far: '#4b4a48', field: '#6f6a55', earth: '#7d6c58', grass: '#55583e', mt: PAL.prusD, leafA: '#93392c', leafB: '#a8823f', seed: 83 },
};
function layers(m) {
  const P = MODE[m];
  return {
    sky: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 900, P.sky, .95, .1, { rough: 24, seed: P.seed });
      mountain(x, 300, 1040, 620, 300, { body: P.mt, snow: PAL.white, frac: .22, seed: 85 });
    } },
    glow: { g: 3, draw(x) { bokashi(x, 0, 640, W, 1040, P.glow, 0, P.ga, { rough: 16, seed: P.seed + 5 }); } },
    greens: { g: 2, grain: .06, draw(x) {
      x.fillStyle = P.far; x.beginPath(); x.moveTo(0, GROUND); for (let X = 0; X <= W; X += 20) x.lineTo(X, hillY(X)); x.lineTo(W, GROUND); x.fill();
      x.fillStyle = P.field; x.beginPath(); x.moveTo(0, GROUND + 10); for (let X = 0; X <= W; X += 20) x.lineTo(X, 1096 + Math.sin(X * .012) * 10); x.lineTo(W, GROUND + 10); x.fill();
      x.fillStyle = P.earth; x.beginPath(); x.moveTo(0, gy(0)); for (let X = 0; X <= W; X += 20) x.lineTo(X, gy(X)); for (let X = W; X >= 0; X -= 20) x.lineTo(X, gy(X) + 96); x.fill();
      x.fillStyle = P.grass; x.beginPath(); x.moveTo(0, gy(0) + 92); for (let X = 0; X <= W; X += 20) x.lineTo(X, gy(X) + 92 + Math.sin(X * .02) * 5); x.lineTo(W, H); x.lineTo(0, H); x.fill();
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 300, 1040, 620, 300, { lines: true, lw: 2, snowLine: S, frac: .22, seed: 85 });
      x.fillStyle = S; carve(x, wob(Array.from({ length: 28 }, (_, k) => [k * 40, hillY(k * 40)]), 1, 3), 2.2, { taper: [0, 0] });
      carve(x, Array.from({ length: 28 }, (_, k) => [k * 40, 1096 + Math.sin(k * 40 * .012) * 10]), 1.8, { taper: [0, 0] });
      carve(x, Array.from({ length: 28 }, (_, k) => [k * 40, gy(k * 40)]), 2.6, { taper: [0, 0] });
      carve(x, Array.from({ length: 28 }, (_, k) => [k * 40, gy(k * 40) + 92 + Math.sin(k * 40 * .02) * 5]), 2.2, { taper: [0, 0] });
      // grass tufts along the front bank
      x.strokeStyle = S; x.lineWidth = 2; x.lineCap = 'round';
      for (let k = 0; k < 26; k++) { const X = 60 + k * 38 + hash(k * 1.7) * 20, Y = gy(X) + 96 + hash(k) * 16; for (const a of [-.5, 0, .5]) { x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + a * 8, Y - 14, X + a * 22, Y - 22 - hash(k + a) * 10); x.stroke(); } }
      shp(x, STONE, '#a39d8e', 2.6); x.lineWidth = 1.6; x.beginPath(); x.moveTo(580, 1240); x.lineTo(610, 1222); x.moveTo(650, 1226); x.lineTo(684, 1250); x.stroke();
      // the tree
      limb(x, TRUNK, 58, 26, BARK, 2.6);
      shp(x, [[770, GROUND + 6], [748, GROUND + 10], [776, 1250]], BARK, 0, false); shp(x, [[836, GROUND + 6], [862, GROUND + 10], [822, 1246]], BARK, 0, false);
      BR.forEach((b, i) => limb(x, b, [24, 22, 20, 20][i], 6, BARK, 2.2));
      x.strokeStyle = BARK; x.lineWidth = 3.4; x.lineCap = 'round';
      for (const [a, b, c, d] of [[440, 698, 432, 740], [560, 686, 590, 716], [660, 730, 684, 762], [660, 574, 646, 552], [592, 486, 576, 474], [770, 546, 772, 530], [806, 440, 830, 434], [850, 792, 860, 804], [914, 700, 924, 680], [716, 690, 712, 640], [600, 500, 556, 570]]) { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); }
      x.strokeStyle = 'rgba(246,239,220,.3)'; x.lineWidth = 1.6; for (let k = 0; k < 7; k++) { const u = (k + .5) / 7, p = [lerp(804, 760, u), lerp(1270, 860, u)]; x.beginPath(); x.moveTo(p[0] - 8, p[1]); x.quadraticCurveTo(p[0], p[1] - 22, p[0] + 6, p[1] - 44); x.stroke(); }
    } },
    fruit: { g: 3, draw(x) {
      TLEAF.forEach(([a, b, r], k) => leaf(x, a, b, r, k % 2 ? P.leafB : P.leafA, 1.15));
      FRUIT.forEach(([a, b], k) => kaki(x, a, b, k ? 30 : 32, { col: m === 'dusk' ? KAKI_D : KAKI, stem: k ? 1.5 : 1.9, sx: k ? .1 : .16 }));
      // fallen leaves on the path and in the grass
      for (let k = 0; k < 22; k++) { const X = 120 + hash(k * 2.3) * 860, Y = gy(X) + 14 + hash(k * 5.1) * 150; leaf(x, X, Y, hash(k) * 6, k % 3 ? P.leafB : P.leafA, .85 + hash(k * 3) * .4); }
    } },
  };
}
// leaves drifting down (8 fps): k-th leaf loops every `per` seconds
function drift(x, t, P, n = 5, x0 = 300, x1 = 900) {
  const tq = q8(t);
  for (let k = 0; k < n; k++) { const per = 5 + hash(k * 3.3) * 3, u = ((tq + hash(k) * per) % per) / per, X = lerp(x0, x1, hash(k * 7.7)) + Math.sin(u * 9 + k) * 46 - u * 60, Y = lerp(430, GROUND + 30, u); leaf(x, X, Y, u * 7 + k, k % 2 ? P.leafB : P.leafA, 1); }
}
const SZ = 235;
const jump = t => { for (const j of CFG.JUMPS) if (t >= j && t < j + 1) return (t - j) / 1; return -1; };

const V_NOON = { id: 'noon', layers: layers('noon'), paint(x, t, R) {
  R.L('sky'); R.L('glow'); R.L('greens'); R.L('key'); R.L('fruit');
  const tq = q8(t), w = seg(t, CFG.WALK[0], CFG.WALK[1]), fx = lerp(70, 372, w), reach = t >= CFG.REACH[0] && t < CFG.REACH[1];
  R.D(3, x => {
    drift(x, t, MODE.noon, 4);
    if (reach) fox(x, fx + 6, gy(fx) - 26 - Math.abs(Math.sin(tq * 5)) * 16, SZ, { flip: true, pose: 'leap', rot: 1.1, nose: .1, tailUp: -.5 });
    else fox(x, fx, gy(fx), SZ, { flip: true, pose: w < 1 ? 'walk' : 'stand', ph: tq * 1.9, nose: t >= CFG.LOOK ? .62 : 0, tailUp: w < 1 ? .15 : 0 });
  });
} };
const V_SUNSET = { id: 'sunset', layers: layers('sunset'), paint(x, t, R) {
  const tq = q8(t), P = MODE.sunset, sink = seg(t, CFG.PRINT[1][0], 28.7);
  R.L('sky');
  R.D(3, x => { x.fillStyle = PAL.beni; x.beginPath(); x.arc(250, lerp(850, 1035, sink), 92, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 4; x.stroke(); });
  R.L('glow'); R.L('greens'); R.L('key'); R.L('fruit');
  R.D(3, x => {
    drift(x, t, P, t >= CFG.SIT ? 7 : 4, 250, 760);
    if (t < CFG.STONE) {
      const p = jump(tq), snap = t >= CFG.JUMPS[3] - .2;
      if (p >= 0) { const h = Math.sin(p * Math.PI); fox(x, 330, GROUND - h * 250, SZ, { flip: true, pose: 'leap', rot: .25 + .75 * Math.min(1, h * 1.6), nose: .15, open: snap && p > .3 && p < .62, tailUp: -.3 }); }
      else fox(x, 330, GROUND, SZ, { flip: true, pose: 'stand', nose: .6, tailUp: .1 });
      if (snap && p > .55 && p < .8) { x.strokeStyle = S; x.lineWidth = 3; x.lineCap = 'round'; for (const a of [-.9, -.2, .5]) { x.beginPath(); x.moveTo(402 + Math.cos(a) * 26, 842 + Math.sin(a) * 26); x.lineTo(402 + Math.cos(a) * 44, 842 + Math.sin(a) * 44); x.stroke(); } }
    } else if (t < CFG.LEAP) {       // on the stone, stretching
      fox(x, 640, 1150 - Math.abs(Math.sin(tq * 4)) * 8, SZ, { pose: 'leap', rot: 1.15, nose: .1, tailUp: -.6 });
    } else if (t < CFG.FALL) {       // he leaps off it
      const p = seg(tq, CFG.LEAP, CFG.FALL), e = Math.sin(p * Math.PI / 2);
      fox(x, lerp(640, 540, e), 1150 - e * 110, SZ, { pose: 'leap', rot: 1.2, nose: .1, open: p > .5, tailUp: -.4 });
    } else if (t < CFG.SIT) {        // and tumbles on his back
      const p = seg(tq, CFG.FALL, CFG.LAND), land = GROUND - 4;
      fox(x, lerp(540, 440, p), lerp(1040, land, p * p), SZ, { pose: 'leap', rot: lerp(1.2, 3.3, p), eye: 'shut', tailUp: .3 });
      if (p >= 1) { x.strokeStyle = S; x.lineWidth = 3.2; x.lineCap = 'round'; for (const [a, b] of [[330, 1150], [300, 1200], [556, 1146], [584, 1198]]) { x.beginPath(); x.moveTo(a, b); x.lineTo(a + (a < 440 ? -22 : 22), b - 14); x.stroke(); } }
    } else fox(x, 440, GROUND, SZ, { flip: true, pose: 'sit', nose: -.42, eye: 'shut' });
  });
} };
const V_DUSK = { id: 'dusk', layers: layers('dusk'), paint(x, t, R) {
  R.L('sky'); R.L('glow'); R.L('greens'); R.L('key'); R.L('fruit');
  const tq = q8(t), P = MODE.dusk, up = t >= CFG.RISE, go = seg(t, CFG.AWAY[0], CFG.AWAY[1]), fx = lerp(440, 120, go);
  R.D(3, x => {
    drift(x, t, P, 5, 250, 800);
    if (!up) fox(x, 440, GROUND, SZ, { flip: true, pose: 'sit', nose: .45 });
    else fox(x, fx, gy(fx), SZ, { pose: go > 0 && go < 1 ? 'walk' : 'stand', ph: tq * 1.5, nose: .62, eye: 'shut', tailUp: .75 });
    if (up && go <= 0) { x.strokeStyle = S; x.lineWidth = 3.2; x.lineCap = 'round'; for (const [a, b, c, d] of [[262, 1050, 236, 1030], [254, 1086, 222, 1082], [276, 1018, 258, 990]]) { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); } }
  });
} };

// —— sheet 3: the branch under the moon ——
const ridge = X => 1172 + Math.sin(X * .0052 + 2.2) * 30;
const BIG = [[1070, 1046], [900, 962], [740, 902], [560, 858], [384, 800], [236, 700]];
const V_MOON = { id: 'moon', layers: {
  sky: { g: 1, grain: .12, draw(x) {
    bokashi(x, 0, FR.y0, W, 1320, PAL.prusD, .98, .5, { rough: 26, seed: 91 });
    x.fillStyle = PAL.white; x.beginPath(); x.arc(470, 740, 300, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 3.4; x.stroke();
  } },
  greens: { g: 2, grain: .06, draw(x) {
    x.fillStyle = '#2c3d55'; x.beginPath(); x.moveTo(0, H); for (let X = 0; X <= W; X += 20) x.lineTo(X, ridge(X)); x.lineTo(W, H); x.fill();
    x.fillStyle = '#1c2a40'; x.beginPath(); x.moveTo(0, H); for (let X = 0; X <= W; X += 20) x.lineTo(X, 1340 + Math.sin(X * .009) * 16); x.lineTo(W, H); x.fill();
  } },
  key: { g: 0, speck: .12, draw(x) {
    x.fillStyle = S; carve(x, Array.from({ length: 28 }, (_, k) => [k * 40, ridge(k * 40)]), 2.4, { taper: [0, 0] });
    limb(x, BIG, 70, 18, BARK, 3);
    limb(x, [[330, 772], [322, 690], [344, 624], [386, 604]], 16, 5, BARK, 2.2);
    limb(x, [[700, 890], [730, 800], [790, 740], [850, 716]], 18, 5, BARK, 2.2);
    limb(x, [[560, 876], [556, 900]], 8, 5, BARK, 0); limb(x, [[822, 950], [820, 976]], 8, 5, BARK, 0);
    x.strokeStyle = 'rgba(246,239,220,.3)'; x.lineWidth = 1.8; for (let k = 0; k < 9; k++) { const u = (k + .5) / 9, X = lerp(1020, 300, u), Y = lerp(1020, 760, u) + 6; x.beginPath(); x.moveTo(X + 16, Y + 6); x.quadraticCurveTo(X, Y - 6, X - 22, Y - 4); x.stroke(); }
  } },
  fruit: { g: 3, draw(x) {
    kaki(x, 556, 972, 70, { lw: 3, stem: 1.1, sx: 0 }); kaki(x, 820, 1048, 72, { lw: 3, stem: 1.1, sx: 0 }); kaki(x, 868, 786, 62, { lw: 3, stem: 1.25, sx: -.2 });
    leaf(x, 250, 676, -.9, PAL.beni, 2.3); leaf(x, 930, 700, .5, PAL.ochre, 2.2); leaf(x, 668, 838, -2.2, PAL.beni, 2);
  } },
}, paint(x, t, R) {
  R.L('sky'); R.L('greens');
  const tq = q8(t), go = seg(t, CFG.PRINT[3][0], CFG.MORAL.wash[1]), fxp = lerp(560, 300, go);
  R.D(3, x => fox(x, fxp, ridge(fxp) + 2, 96, { pose: 'walk', ph: tq * 1.5, nose: .55, eye: 'shut', tailUp: .7 }));
  R.L('key'); R.L('fruit');
  const caw = t >= CFG.CAW && t < CFG.CAW + 1.3, pk = CFG.PECK.some(p => tq >= p && tq < p + .26), bites = CFG.PECK.filter(p => t >= p + .12).length;
  R.D(3, x => {
    kaki(x, 392, 706, 78, { lw: 3, stem: 1.2, sx: -.05 });
    if (bites) { const r = 22 + bites * 9; x.save(); x.beginPath(); x.ellipse(392, 706, 78 * 1.08, 78 * .93, 0, 0, TAU); x.clip(); x.fillStyle = FLESH; x.beginPath(); x.arc(452, 668, r, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 2.6; x.stroke(); x.restore(); }
    crow(x, 640, 862, 320, { head: caw ? -.32 : pk ? .5 : .12, open: caw && Math.floor(tq * 8) % 4 < 3, lean: caw ? .1 : 0 });
  });
} };
export const VIEWS = [V_NOON, V_SUNSET, V_DUSK, V_MOON];
