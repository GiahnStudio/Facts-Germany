// The Lost Horse — four prints (1080×1920). g: 0 key · 1 blues · 2 greens/greys · 3 reds/figures
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry, vnoise, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, fillPath, bokashi, kasumi, rgba } from './print.js';
import { mountain, pine, goose } from './nature.js';
import { traveler } from './traveler.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
const VO = CFG.VO;

function limbPoly(pts, ws) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    L.push([pts[i][0] - dy * ws[i] / 2, pts[i][1] + dx * ws[i] / 2]); R.push([pts[i][0] + dy * ws[i] / 2, pts[i][1] - dx * ws[i] / 2]);
  }
  return L.concat(R.reverse());
}
function fillStroke(x, pts, fill, lw, sm = false) { x.beginPath(); sm ? smooth(x, pts, true) : poly(x, pts); x.fillStyle = fill; x.fill(); x.lineWidth = lw; x.strokeStyle = S; x.stroke(); }

// —— horse: side view facing left, hooves at y=0, ~100 units tall at the ears. pose gallop | walk | stand | rear ——
export function horse(x, px, py, s, o = {}) {
  const u = s / 100, lw = Math.max(1.3, s / 70) / u, col = o.col || '#9a5b34', dark = o.dark || '#5b3420', pose = o.pose || 'stand', ph = o.ph || 0;
  x.save(); x.translate(px, py); x.scale(u * (o.flip ? -1 : 1), u); x.lineJoin = 'round'; x.lineCap = 'round';
  let rearA = 0;
  if (pose === 'rear') { rearA = .62 * (o.rear ?? 1); x.translate(30, 0); x.rotate(rearA); x.translate(-30, 0); }
  const bob = pose === 'gallop' ? Math.sin(ph * TAU * 2) * 3 : pose === 'walk' ? Math.sin(ph * TAU * 2) * 1.2 : 0;
  // legs: [hipX, phase offset, front?]
  const legs = [[28, .5, 0, 1], [-30, .1, 1, 1], [22, 0, 0, 0], [-36, .6, 1, 0]];  // last flag: far leg (drawn first, darker)
  const legPts = (hx, off, front) => {
    const hip = [hx, -48 + bob];
    if (pose === 'rear' && front) return [hip, [hx - 14, -34], [hx - 4, -22]];   // front legs folded up
    let sw = 0;
    if (pose === 'gallop') sw = Math.sin((ph + off) * TAU) * .7;
    else if (pose === 'walk') sw = Math.sin((ph + off) * TAU) * .32;
    const knee = [hx + Math.sin(sw) * 22 + (front ? -2 : 4), -26 + Math.abs(Math.sin(sw)) * 4];
    const lift = pose === 'gallop' ? Math.max(0, Math.sin((ph + off) * TAU + 1.2)) * 12 : pose === 'walk' ? Math.max(0, Math.sin((ph + off) * TAU + 1.2)) * 5 : 0;
    const hoof = [knee[0] + Math.sin(sw * 1.4) * 18 + (front ? -6 : 8) * lift / 12, -lift];
    return [hip, knee, hoof];
  };
  for (const [hx, off, front, far] of legs) if (far) { const p = legPts(hx, off, front); fillStroke(x, limbPoly(p, [11, 7, 5]), dark, lw * .8); fillStroke(x, [[p[2][0] - 4, p[2][1] - 4], [p[2][0] + 4, p[2][1] - 4], [p[2][0] + 5, p[2][1] + 1], [p[2][0] - 5, p[2][1] + 1]], S, 0); }
  // tail
  const tw = pose === 'gallop' ? Math.sin(ph * TAU * 2) * 6 : 0;
  x.strokeStyle = dark; x.lineWidth = 9; x.beginPath(); x.moveTo(42, -66 + bob); x.quadraticCurveTo(64, -58 + tw, 62 + (pose === 'gallop' ? 14 : 0), -26 + tw); x.stroke();
  x.strokeStyle = S; x.lineWidth = lw * .5; x.stroke();
  // body
  fillStroke(x, [[-44, -66 + bob], [-30, -76 + bob], [20, -76 + bob], [42, -70 + bob], [46, -56 + bob], [36, -44 + bob], [-24, -42 + bob], [-42, -50 + bob]], col, lw, true);
  // neck + head
  const nk = pose === 'gallop' ? -.15 : pose === 'rear' ? .25 : 0;
  x.save(); x.translate(-34, -68 + bob); x.rotate(nk);
  fillStroke(x, [[0, 8], [-6, -10], [-18, -32], [-26, -40], [-38, -38], [-50, -20], [-46, -14], [-34, -22], [-20, -6], [-8, 12]], col, lw, true);
  fillStroke(x, [[-24, -40], [-22, -50], [-17, -42]], col, lw * .8);   // ear
  x.fillStyle = S; x.beginPath(); x.arc(-30, -32, 2.2, 0, TAU); x.fill();
  x.beginPath(); x.arc(-46, -17, 1.6, 0, TAU); x.fill();
  // mane
  x.strokeStyle = dark; x.lineWidth = 6; x.beginPath(); x.moveTo(-22, -40); x.quadraticCurveTo(-10, -22, 2, -2); x.stroke();
  if (o.blaze) { x.strokeStyle = PAL.white; x.lineWidth = 3; x.beginPath(); x.moveTo(-30, -38); x.lineTo(-45, -19); x.stroke(); }
  x.restore();
  for (const [hx, off, front, far] of legs) if (!far) { const p = legPts(hx, off, front); fillStroke(x, limbPoly(p, [12, 7.5, 5.5]), col, lw * .8); fillStroke(x, [[p[2][0] - 4.5, p[2][1] - 4], [p[2][0] + 4.5, p[2][1] - 4], [p[2][0] + 5.5, p[2][1] + 1], [p[2][0] - 5.5, p[2][1] + 1]], S, 0); }
  if (o.saddle) { fillStroke(x, [[-12, -76 + bob], [18, -76 + bob], [14, -64 + bob], [-8, -64 + bob]], PAL.beni, lw * .7); }
  if (o.rider) traveler(x, 2, -74 + bob, 66, { mode: 'stand', hatOff: true, noStaff: true, flip: o.flip ? false : true, lean: -.1 });
  x.restore();
}

// —— shared farm layout (sheet 0 autumn, sheet 1 spring: alternate impressions of the same key block) ——
const FENCE_Y = 1170, GATE = [470, 610], HOUSE = [700, 1040];
const PATH = [[540, 1180], [520, 1060], [430, 960], [380, 860], [330, 780], [300, 700]];
const PALS = {
  autumn: { sky: PAL.prus, sky2: PAL.beniP, hill: '#a98e57', hillD: '#7d6a40', field: PAL.ochreL, field2: PAL.ochre, roof: '#8a7a55', tree: '#b8572f', mtn: PAL.prusL },
  spring: { sky: PAL.sky, sky2: PAL.beniP, hill: PAL.green, hillD: PAL.greenD, field: PAL.greenL, field2: PAL.green, roof: '#9b8a5a', tree: '#efb9b0', mtn: PAL.prusL },
};
function farmDraw(m) {
  const P = PALS[m];
  return {
    sky: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 560, P.sky, .9, 0, { rough: 24, seed: m === 'autumn' ? 2 : 3 });
      mountain(x, 760, 700, 760, 330, { body: P.mtn, snow: PAL.white, frac: m === 'autumn' ? .34 : .18, seed: 7 });
      mountain(x, 240, 720, 520, 220, { body: PAL.skyL, frac: 0, seed: 8 });
    } },
    greens: { g: 2, grain: .06, draw(x) {
      // rolling hills, the path, fields, fence, farmhouse
      x.fillStyle = P.hillD; x.beginPath(); x.moveTo(0, 760); for (let X = 0; X <= W; X += 20) x.lineTo(X, 700 + Math.sin(X * .006 + 1) * 40); x.lineTo(W, 900); x.lineTo(0, 900); x.fill();
      rect(x, P.hill, 0, 860, W, FENCE_Y + 20);
      x.fillStyle = P.hillD; x.beginPath(); x.moveTo(0, 860); for (let X = 0; X <= W; X += 20) x.lineTo(X, 840 + Math.sin(X * .01) * 22); x.lineTo(W, 900); x.lineTo(0, 900); x.fill();
      x.fillStyle = PAL.ochreL; x.beginPath(); smooth(x, PATH.map(([a, b], i) => [a - 50 + i * 7, b]).concat(PATH.slice().reverse().map(([a, b], i) => [a + 50 - (PATH.length - 1 - i) * 7, b])), true); x.fill();
      rect(x, P.field, 0, FENCE_Y + 20, W, H); for (let k = 0; k < 6; k++) rect(x, P.field2, 0, 1330 + k * 90, W, 1360 + k * 90);
      // house
      rect(x, PAL.plaster, HOUSE[0], 960, HOUSE[1], HOUSE[1] + 140 - 30); fillPath(x, [[HOUSE[0] - 40, 970], [870, 860], [HOUSE[1] + 40, 970]], P.roof);
      rect(x, PAL.woodD, 780, 1010, 840, 1150);
      // trees by the house (autumn maple / spring blossom)
      [[640, 960, 70], [990, 900, 60]].forEach(([cx, cy, r]) => { rect(x, PAL.woodD, cx - 6, cy, cx + 6, cy + 150); });
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, 420, W, 760, P.sky2, 0, .8, { rough: 16, seed: 9 });
      [[640, 960, 70], [990, 900, 60]].forEach(([cx, cy, r]) => { x.fillStyle = P.tree; x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.moveTo(cx + Math.cos(a) * r * .5 + r * .5, cy + Math.sin(a) * r * .4); x.arc(cx + Math.cos(a) * r * .5, cy + Math.sin(a) * r * .4, r * .5, 0, TAU); } x.fill(); });
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 760, 700, 760, 330, { lines: true, lw: 2, snowLine: S, frac: m === 'autumn' ? .34 : .18, seed: 7 });
      x.fillStyle = S; carve(x, wob(Array.from({ length: 28 }, (_, k) => [k * 40, 840 + Math.sin(k * 40 * .01) * 22]), 1, 3), 2.2, { taper: [0, 0] });
      // fence with an open gate
      x.strokeStyle = S; x.lineWidth = 3;
      for (let X = 20; X < W; X += 70) { if (X > GATE[0] && X < GATE[1]) continue; x.strokeRect(X, FENCE_Y - 70, 10, 90); }
      [[0, GATE[0]], [GATE[1], W]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, FENCE_Y - 52); x.lineTo(b, FENCE_Y - 52); x.moveTo(a, FENCE_Y - 22); x.lineTo(b, FENCE_Y - 22); x.stroke(); });
      x.beginPath(); x.moveTo(GATE[1], FENCE_Y - 60); x.lineTo(GATE[1] + 30, FENCE_Y + 40); x.moveTo(GATE[1], FENCE_Y - 30); x.lineTo(GATE[1] + 26, FENCE_Y + 66); x.stroke();   // gate swung open
      x.lineWidth = 2.6; x.strokeRect(HOUSE[0], 960, HOUSE[1] - HOUSE[0], 150); x.strokeRect(780, 1010, 60, 140);
      carve(x, [[HOUSE[0] - 40, 970], [870, 860], [HOUSE[1] + 40, 970]], 3, { taper: [.05, .05] });
      x.lineWidth = 1.4; for (let k = 1; k < 9; k++) { x.beginPath(); x.moveTo(HOUSE[0] - 40 + k * 41, 970 - (k < 5 ? k : 9 - k) * 27); x.lineTo(HOUSE[0] - 40 + k * 41 + 6, 970); x.stroke(); }
      carve(x, wob([[0, FENCE_Y + 20], [W, FENCE_Y + 20]], 1.5, 4), 2.4, { taper: [0, 0] });
    } },
  };
}
function farm(id, m) {
  return {
    id, layers: farmDraw(m),
    paint(x, t, R) {
      R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
      const tq = q8(t);
      const along = u => { const i = Math.min(PATH.length - 2, Math.floor(u * (PATH.length - 1))), f = u * (PATH.length - 1) - i; return [lerp(PATH[i][0], PATH[i + 1][0], f), lerp(PATH[i][1], PATH[i + 1][1], f)]; };
      if (m === 'autumn') {
        // the horse gallops up the path and away
        const u = ss(seg(tq, 0, 3.4));
        if (u < 1) R.D(3, x => { const [hx, hy] = along(u); horse(x, hx, hy, lerp(190, 40, u), { pose: 'gallop', ph: tq * 2.2, flip: false }); });
        // hoofprints left behind
        R.D(0, x => { x.fillStyle = PAL.woodD; for (let k = 0; k < 14; k++) { const [a, b] = along(k / 14 * .9); x.beginPath(); x.ellipse(a + (k % 2 ? 10 : -10), b + 10, 6 * (1 - k / 20), 3.5 * (1 - k / 20), 0, 0, TAU); x.fill(); } });
      } else {
        // two horses come home down the path
        const u = ss(seg(tq, 8.6, 12.4));
        R.D(3, x => { const [ax, ay] = along(1 - u), [bx, by] = along(Math.min(1, 1 - u + .14)); const sA = lerp(40, 190, u), sB = lerp(46, 210, Math.max(0, u - .08));
          horse(x, bx, by, sB, { pose: u < 1 ? 'walk' : 'stand', ph: tq * 1.2 + .3, col: '#3b3330', dark: '#1e1a18', flip: true, blaze: true });
          horse(x, ax, ay, sA, { pose: u < 1 ? 'walk' : 'stand', ph: tq * 1.2, flip: true }); });
      }
      // neighbours (left) and the farmer at the gate
      const talk = t > VO[m === 'autumn' ? 'L02' : 'L04'] && t < VO[m === 'autumn' ? 'L02' : 'L04'] + 2;
      const cheer = m === 'spring' && talk ? Math.abs(Math.sin(tq * TAU * 1.5)) * 10 : 0;
      R.D(3, x => {
        traveler(x, 300, 1215 - cheer, 220, { mode: 'stand', flip: true, noStaff: true, hatOff: true, lean: talk ? .12 : 0 });
        traveler(x, 380, 1225 - cheer * .6, 205, { mode: 'stand', flip: true, noStaff: true, lean: talk ? .1 : 0, t: tq });
        traveler(x, 650, 1230, 240, { mode: 'stand', hatOff: true, t: tq });
      });
    },
  };
}

// —— Sheet 2: the wild horse rears, the son falls ——
const FALL = { t0: 20.6, t1: 21.35, from: [560, 820], to: [330, 1190] };
const V_FALL = {
  id: 'fall',
  layers: {
    sky: { g: 1, grain: .12, draw(x) { bokashi(x, 0, FR.y0, W, 900, PAL.prus, .85, .1, { rough: 26, seed: 21 }); mountain(x, 860, 1080, 520, 260, { body: PAL.prusL, frac: .25, snow: PAL.white, seed: 22 }); } },
    greens: { g: 2, grain: .06, draw(x) { rect(x, PAL.ochreL, 0, 1080, W, H); for (let k = 0; k < 5; k++) rect(x, PAL.ochre, 0, 1240 + k * 120, W, 1270 + k * 120); fillPath(x, [[60, 1240], [120, 1190], [200, 1200], [240, 1250]], PAL.grey); } },
    reds: { g: 3, draw(x) { bokashi(x, 0, 600, W, 1080, PAL.beniP, 0, .85, { rough: 18, seed: 23 }); x.fillStyle = PAL.beni; x.beginPath(); x.arc(220, 380, 66, 0, TAU); x.fill(); } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 860, 1080, 520, 260, { lines: true, lw: 1.8, snowLine: S, frac: .25, seed: 22 });
      x.fillStyle = S; carve(x, wob([[0, 1080], [W, 1080]], 2, 3), 2.6, { taper: [0, 0] });
      x.strokeStyle = S; x.lineWidth = 1.6; x.beginPath(); x.arc(220, 380, 66, 0, TAU); x.stroke();
      // wind lines (the energy of the moment)
      x.lineWidth = 2; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(80 + k * 30, 520 + k * 60); x.quadraticCurveTo(300 + k * 20, 480 + k * 60, 520 + k * 10, 540 + k * 60); x.stroke(); }
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), rear = ss(seg(tq, 18.2, 18.9)) * (1 - .4 * ss(seg(tq, 20.4, 21.6)));
    const HX = 620, HY = 1180, HS = 430, hu = HS / 100;
    const riding = tq < FALL.t0;
    R.D(3, x => horse(x, HX, HY, HS, { pose: rear > .05 ? 'rear' : 'stand', rear, col: '#3b3330', dark: '#1e1a18', blaze: true, saddle: true, rider: riding }));
    // the son is thrown from the saddle and lands
    const ra = .62 * rear, px0 = -2 - 30, py0 = -80, sxs = HX + hu * (30 + px0 * Math.cos(ra) - py0 * Math.sin(ra)), sys = HY + hu * (px0 * Math.sin(ra) + py0 * Math.cos(ra));
    const f = seg(tq, FALL.t0, FALL.t1);
    const sx = lerp(sxs, FALL.to[0], f), sy = lerp(sys, FALL.to[1], f) - Math.sin(f * Math.PI) * 160, rot = lerp(-.4, -1.5, f);
    const landed = tq >= FALL.t1;
    if (!riding) R.D(3, x => { x.save(); x.translate(sx, sy); x.rotate(landed ? -1.57 : rot); traveler(x, 0, 0, 230, { mode: landed ? 'stand' : 'walk', ph: tq, hatOff: true, noStaff: true, flip: true }); x.restore(); });
    if (tq >= FALL.t1 && tq < FALL.t1 + .8) R.D(2, x => { const a = (tq - FALL.t1) / .8; x.fillStyle = rgba(PAL.ochre, .8 * (1 - a)); for (let k = 0; k < 7; k++) { x.beginPath(); x.arc(330 - 140 + k * 46, 1200 - a * 40 - (k % 2) * 20, 26 + a * 30, 0, TAU); x.fill(); } });
    if (landed) R.D(0, x => { x.strokeStyle = PAL.beni; x.lineWidth = 5; x.lineCap = 'round'; for (let k = 0; k < 3; k++) { const a = -1.2 + k * .5; x.beginPath(); x.moveTo(250 + Math.cos(a) * 40, 1150 + Math.sin(a) * 40); x.lineTo(250 + Math.cos(a) * 70, 1150 + Math.sin(a) * 70); x.stroke(); } });
  },
};

// —— Sheet 3: soldiers on the road; the son, leg bound, watches from the window ——
const ROAD = [1180, 1300], WIN = [170, 900, 420, 1100];
const V_SOLDIERS = {
  id: 'soldiers',
  layers: {
    sky: { g: 1, grain: .12, draw(x) { bokashi(x, 0, FR.y0, W, 700, PAL.prus, .9, .05, { rough: 24, seed: 31 }); mountain(x, 760, 820, 820, 380, { body: PAL.prusL, frac: .3, snow: PAL.white, seed: 32 }); } },
    greens: { g: 2, grain: .06, draw(x) {
      rect(x, PAL.green, 0, 820, W, ROAD[0]); rect(x, PAL.ochreL, 0, ROAD[0], W, ROAD[1]); rect(x, PAL.greenD, 0, ROAD[1], W, H);
      // house wall with the window (cut-away), the boy inside on a mat
      rect(x, PAL.plaster, 60, 760, 520, ROAD[0]); fillPath(x, [[30, 780], [290, 640], [550, 780]], '#8a7a55');
      rect(x, '#3a2a1c', WIN[0], WIN[1], WIN[2], WIN[3]);
      rect(x, '#c9b78a', WIN[0] + 10, WIN[3] - 50, WIN[2] - 10, WIN[3] - 10);
    } },
    reds: { g: 3, draw(x) { bokashi(x, 0, 380, W, 820, PAL.beniP, 0, .75, { rough: 16, seed: 33 }); } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 760, 820, 820, 380, { lines: true, lw: 2, snowLine: S, frac: .3, seed: 32 });
      x.fillStyle = S; carve(x, [[0, ROAD[0]], [W, ROAD[0]]], 2.6, { taper: [0, 0] }); carve(x, [[0, ROAD[1]], [W, ROAD[1]]], 2.6, { taper: [0, 0] });
      x.strokeStyle = S; x.lineWidth = 2.6; x.strokeRect(60, 760, 460, ROAD[0] - 760); x.strokeRect(WIN[0], WIN[1], WIN[2] - WIN[0], WIN[3] - WIN[1]);
      carve(x, [[30, 780], [290, 640], [550, 780]], 3, { taper: [.05, .05] });
      x.lineWidth = 1.4; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(WIN[0] + k * (WIN[2] - WIN[0]) / 4, WIN[1]); x.lineTo(WIN[0] + k * (WIN[2] - WIN[0]) / 4, WIN[1] + 30); x.stroke(); }
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    // the boy in the window: lying, leg bound with a splint
    R.D(3, x => { x.save(); x.beginPath(); x.rect(WIN[0], WIN[1], WIN[2] - WIN[0], WIN[3] - WIN[1]); x.clip();
      x.translate(WIN[0] + 140, WIN[3] - 46); x.rotate(-1.5); traveler(x, 0, 0, 180, { mode: 'stand', hatOff: true, noStaff: true, flip: true }); x.restore();
      x.fillStyle = PAL.white; x.strokeStyle = S; x.lineWidth = 1.6; x.fillRect(WIN[0] + 150, WIN[3] - 60, 60, 18); x.strokeRect(WIN[0] + 150, WIN[3] - 60, 60, 18); });
    // soldiers march right → left with red banners
    const off = (tq - 25.2) * 150;
    R.D(3, x => { for (let k = 0; k < 7; k++) { const sx = 1150 + k * 190 - off; if (sx < -120 || sx > 1250) continue; const sy = 1262;
      x.fillStyle = PAL.beni; x.strokeStyle = S; x.lineWidth = 2; x.fillRect(sx + 18, sy - 330, 34, 120); x.strokeRect(sx + 18, sy - 330, 34, 120); x.beginPath(); x.moveTo(sx + 18, sy - 330); x.lineTo(sx + 18, sy - 150); x.stroke();
      x.fillStyle = PAL.white; x.font = '400 26px Yuji'; x.textAlign = 'center'; x.fillText('兵', sx + 35, sy - 262);
      traveler(x, sx, sy, 210, { mode: 'walk', ph: tq * 1.2 + k * .5, t: tq, wind: .2 }); } });
    // the farmer at the door watching
    R.D(3, x => traveler(x, 520, 1188, 210, { mode: 'stand', hatOff: true, t: tq, flip: true }));
  },
};

export const VIEWS = [farm('autumn', 'autumn'), farm('spring', 'spring'), V_FALL, V_SOLDIERS];
