// The Crow and the Water Jar — four prints (1080×1920). g: 0 key · 1 blues · 2 greens/greys/earth · 3 reds/figures
import { clamp, lerp, seg, ss, mulberry, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, fillPath, bokashi, kasumi, stampFn, mix } from './print.js';
import { mountain, pine } from './nature.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8, q12 = t => Math.floor(t * 12) / 12;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
const VO = CFG.VO, DROPS = CFG.DROPS;
const CROW = '#2a2b33', CROW_W = '#1b2232', CROW_H = '#5d6b86', CLAY = '#8a5a3a', CLAY_D = '#5e3b26', GLAZE = '#3b4a3a', PEB = '#9d988a';

function shape(x, pts, fill, lw, closed = true, sm = true) {
  x.beginPath(); sm ? smooth(x, pts, closed) : poly(x, pts);
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (lw) { x.lineWidth = lw; x.strokeStyle = S; x.lineJoin = 'round'; x.stroke(); }
}

// —— the crow (side view, facing left; feet at 0,0; standing height ≈ 100 units; s = height in px) ——
// o: flip, mode 'stand'|'fly', ph (wing phase), head (0..1 bend down), lean (rad, + = forward), peck, pebble, open
function wing(x, lw, fill, ang, len = 1) {
  x.save(); x.rotate(ang); x.scale(1, len);
  const P = [[2, 4], [-9, -14], [-12, -38], [-6, -62], [-1, -74], [4, -66], [6, -76], [10, -64], [13, -72], [15, -56], [18, -60], [19, -40], [16, -14], [12, 4]];
  shape(x, P, fill, lw, true, false);
  x.lineWidth = lw * .5; x.strokeStyle = CROW_H;
  for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(4 + k * 3, -6 - k * 2); x.lineTo(1 + k * 4, -46 - k * 4); x.stroke(); }
  x.restore();
}
function crow(x, px, py, s, o = {}) {
  const u = s / 100, lw = clamp(s / 70, 1.1, 2.8) / u;
  x.save(); x.translate(px, py); x.scale(o.flip ? -u : u, u);
  const fly = o.mode === 'fly';
  if (!fly) {   // legs + toes
    x.strokeStyle = S; x.lineCap = 'round'; x.lineWidth = lw * 1.3;
    [[4, -24, 2], [14, -24, 13]].forEach(([a, b, c]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, 0); x.stroke(); x.beginPath(); x.moveTo(c, 0); x.lineTo(c - 8, 1); x.moveTo(c, 0); x.lineTo(c + 5, 1); x.stroke(); });
  }
  x.translate(8, -30); x.rotate(-(o.lean || 0) - (fly ? .06 : 0)); x.translate(-8, 30);
  const flap = fly ? Math.sin((o.ph || 0) * TAU) : 0;
  if (fly) { x.save(); x.translate(6, -58); wing(x, lw, CROW_W, -.15 + 1.25 * (.5 - .5 * flap) + .25, 1.05); x.restore(); }   // far wing
  // tail
  shape(x, fly ? [[28, -40], [64, -42], [66, -34], [28, -30]] : [[28, -36], [62, -18], [57, -11], [26, -26]], CROW_W, lw, true, false);
  // body
  shape(x, [[-18, -60], [-4, -67], [14, -62], [30, -46], [42, -34], [30, -26], [12, -24], [-6, -30], [-17, -42]], CROW, lw);
  // head + beak (bends down around the neck)
  const hb = (o.head || 0) * 1.25 + (o.peck || 0) * .5;
  x.save(); x.translate(-12, -58); x.rotate(-hb); x.translate(12, 58);
  shape(x, [[-12, -62], [-14, -72], [-22, -80], [-32, -78], [-36, -70], [-31, -62], [-20, -58]], CROW, lw);
  const op = o.open ? 4 : 0;
  shape(x, [[-34, -74], [-53, -69 + op * .2], [-34, -67]], '#34343a', lw * .9, true, false);
  if (op) shape(x, [[-34, -67], [-50, -63], [-33, -64]], '#34343a', lw * .9, true, false);
  x.strokeStyle = CROW_H; x.lineWidth = lw * .45; x.beginPath(); x.moveTo(-36, -72.5); x.lineTo(-48, -69.5); x.stroke();
  x.fillStyle = PAL.white; x.beginPath(); x.arc(-26, -72, 3, 0, TAU); x.fill(); x.fillStyle = S; x.beginPath(); x.arc(-26.6, -72, 1.6, 0, TAU); x.fill();
  if (o.pebble) shape(x, [[-50, -70], [-46, -74], [-41, -71], [-43, -66], [-48, -66]], PEB, lw * .7);
  x.restore();
  // folded wing (or near wing in flight)
  if (fly) { x.save(); x.translate(6, -58); wing(x, lw, CROW_W, -.15 + 1.25 * (.5 - .5 * flap), 1.12); x.restore(); }
  else {
    shape(x, [[-8, -57], [10, -61], [28, -48], [46, -30], [28, -30], [8, -36], [-6, -46]], CROW_W, lw);
    x.strokeStyle = CROW_H; x.lineWidth = lw * .5;
    for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(10 + k * 7, -50 + k * 3); x.lineTo(30 + k * 6, -36 + k * 1); x.stroke(); }
  }
  x.restore();
}
// a pebble lying on the ground
function pebble(x, cx, cy, r, R, lw = 1.8) {
  const n = 7, P = [];
  for (let k = 0; k < n; k++) { const a = k / n * TAU; P.push([cx + Math.cos(a) * r * (1 + (R() - .5) * .3), cy + Math.sin(a) * r * .62 * (1 + (R() - .5) * .3)]); }
  shape(x, P, R() < .5 ? PEB : '#b1ab9a', lw);
}
const PEBBLES = (() => { const R = mulberry(77), out = []; for (let i = 0; i < 16; i++) out.push([760 + R() * 230, 1290 + R() * 70, 13 + R() * 9, i]); return out.sort((a, b) => a[1] - b[1]); })();

// —— Sheet 0: the drought ——
const FIELD = 1080;
const CRACKS = (() => {   // random crack network on the dry field
  const R = mulberry(9), L = [];
  for (let i = 0; i < 46; i++) {
    let px = 60 + R() * 960, py = FIELD + 40 + R() * 760, a = R() * TAU; const pts = [[px, py]];
    for (let k = 0; k < 4 + Math.floor(R() * 4); k++) { a += (R() - .5) * 1.4; const l = 30 + R() * 50; px += Math.cos(a) * l; py += Math.sin(a) * l * .45; pts.push([px, py]); }
    L.push(pts);
  }
  return L;
})();
const V_DROUGHT = {
  id: 'drought',
  layers: {
    sky: { g: 1, grain: .12, draw(x) {
      mountain(x, 260, FIELD, 700, 190, { body: PAL.skyL, frac: 0, seed: 12 });
      mountain(x, 840, FIELD, 640, 150, { body: PAL.skyL, frac: 0, seed: 13 });
    } },
    greens: { g: 2, grain: .08, draw(x) {
      rect(x, PAL.ochreL, 0, FIELD, W, H);
      bokashi(x, 0, FIELD, W, FIELD + 260, PAL.ochre, .8, 0, { rough: 18, seed: 14 });
      [1300, 1560].forEach(y => rect(x, PAL.straw, 0, y, W, y + 18));   // dikes between the dead paddies
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, FR.y0, W, FIELD, PAL.beniP, .95, .35, { rough: 26, seed: 15 });
      bokashi(x, 0, 760, W, FIELD, PAL.beniL, 0, .55, { rough: 20, seed: 16 });
      x.fillStyle = PAL.beni; x.beginPath(); x.arc(560, 660, 165, 0, TAU); x.fill();
      kasumi(x, 340, 930, 700, 46, PAL.white, .55); kasumi(x, 800, 1000, 520, 34, PAL.white, .45);
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 260, FIELD, 700, 190, { lines: true, lw: 2, frac: 0, seed: 12 });
      mountain(x, 840, FIELD, 640, 150, { lines: true, lw: 2, frac: 0, seed: 13 });
      x.fillStyle = S; carve(x, [[0, FIELD], [W, FIELD]], 2.4, { taper: [0, 0] });
      [1300, 1560].forEach((y, i) => { carve(x, wob([[0, y], [W, y]], 2, i + 3), 2.2, { taper: [0, 0] }); carve(x, wob([[0, y + 18], [W, y + 18]], 2, i + 5), 1.6, { taper: [0, 0] }); });
      CRACKS.forEach((p, i) => carve(x, p, 2.6, { taper: [.15, .5], seed: i + 20, jit: .4 }));
      const R = mulberry(31); x.strokeStyle = PAL.sumiL; x.lineWidth = 1.6;   // dead rice stubble
      for (let i = 0; i < 160; i++) { const sx = R() * W, sy = FIELD + 30 + R() * 780, h = 8 + R() * 12; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx - 3, sy - h); x.moveTo(sx, sy); x.lineTo(sx + 3, sy - h * .8); x.stroke(); }
      x.lineWidth = 1.6; x.strokeStyle = S; x.beginPath(); x.arc(560, 660, 165, 0, TAU); x.stroke();
      x.fillStyle = S;   // a dead tree on the left
      carve(x, [[150, 1250], [140, 1120], [160, 1000], [130, 880]], 16, { taper: [0, .7], seed: 2 });
      carve(x, [[150, 1060], [210, 990], [270, 970]], 7, { taper: [0, .9], seed: 3 });
      carve(x, [[140, 960], [90, 900], [60, 880]], 6, { taper: [0, .9], seed: 4 });
      carve(x, [[132, 900], [170, 840], [200, 820]], 5, { taper: [0, .9], seed: 5 });
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const k = q12(t);   // heat shimmer over the field, 12 fps
    R.D(3, x => { x.strokeStyle = PAL.white; x.lineWidth = 2.4; x.globalAlpha = .55; x.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const y = 1040 + i * 9, o = (k * 40 + i * 70) % 260; x.beginPath(); for (let X = -260 + o; X < W; X += 260) { x.moveTo(X, y); x.quadraticCurveTo(X + 30, y - 6, X + 60, y); x.quadraticCurveTo(X + 90, y + 6, X + 120, y); } x.stroke(); } x.globalAlpha = 1; });
    const tq = q8(t);   // the crow crosses the sun, low and slow
    if (tq < 4.8) R.D(3, x => crow(x, 1120 - 250 * tq, 700 + Math.sin(tq * 2.3) * 22, 180, { mode: 'fly', ph: tq * 1.2, open: tq > 2.2 && tq < 2.7 }));
  },
};

// —— Sheets 1 + 3: the courtyard with the jar (day / evening: alternate impressions of one key block) ——
const GROUND = 1360, JX = 470, MOUTH = 930;
const JAR = [[350, MOUTH + 6], [340, 960], [262, 1020], [222, 1100], [228, 1200], [270, 1290], [310, GROUND], [630, GROUND], [670, 1290], [712, 1200], [718, 1100], [678, 1020], [600, 960], [590, MOUTH + 6]];
const LIP = [[322, MOUTH - 14], [618, MOUTH - 14], [622, MOUTH + 10], [318, MOUTH + 10]];
const CY = {
  day: { sky: PAL.sky, sky2: PAL.beniP, wall: PAL.plaster, wallD: '#cdbd98', tile: '#5f5e58', ground: PAL.ochreL, groundD: PAL.ochre, sun: PAL.white, sunXY: [230, 300, 90], pine: PAL.pine },
  eve: { sky: PAL.ai, sky2: PAL.beni, wall: '#d9b896', wallD: '#b8936f', tile: '#3c3a3a', ground: '#c99c62', groundD: '#a87a48', sun: PAL.beni, sunXY: [830, 470, 120], pine: '#2f4630' },
};
function yard(m) {
  const P = CY[m];
  return {
    sky: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 560, P.sky, .95, m === 'eve' ? .3 : 0, { rough: 22, seed: m === 'day' ? 21 : 22 });
      mountain(x, 640, 560, 900, 200, { body: m === 'day' ? PAL.skyL : PAL.prusL, frac: 0, seed: 23 });
    } },
    greens: { g: 2, grain: .07, draw(x) {
      rect(x, P.wall, 0, 600, W, 1050);
      bokashi(x, 0, 760, W, 1050, P.wallD, 0, .9, { rough: 14, seed: 24 });
      rect(x, P.tile, 0, 560, W, 610);   // tiled wall cap
      for (let X = 0; X < W; X += 36) rect(x, mix(P.tile, '#000000', .25), X, 596, X + 14, 612);
      rect(x, PAL.woodD, 120, 610, 150, 1050); rect(x, PAL.woodD, 930, 610, 960, 1050); rect(x, PAL.wood, 0, 1030, W, 1050);
      rect(x, P.ground, 0, 1050, W, H);
      bokashi(x, 0, 1050, W, 1220, P.groundD, .7, 0, { rough: 16, seed: 25 });
      for (let k = 0; k < 5; k++) rect(x, mix(P.ground, P.groundD, .5), 0, 1420 + k * 96, W, 1430 + k * 96);
      // the jar: clay body, dark glaze running down from the shoulder
      fillPath(x, JAR, CLAY);
      x.save(); x.beginPath(); smooth(x, JAR, true); x.clip();
      fillPath(x, [[200, 940], [740, 940], [740, 1080], [680, 1110], [640, 1060], [590, 1130], [520, 1070], [450, 1140], [400, 1070], [330, 1120], [270, 1060], [200, 1100]], GLAZE);
      rect(x, CLAY_D, 610, 940, 740, GROUND); x.restore();
      rect(x, CLAY_D, LIP[0][0], LIP[0][1], LIP[1][0], LIP[2][1]);
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, 300, W, 560, P.sky2, 0, m === 'eve' ? .9 : .6, { rough: 18, seed: 26 });
      const [sx, sy, sr] = P.sunXY; x.fillStyle = P.sun; x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.fill();
      if (m === 'eve') { x.fillStyle = 'rgba(80,40,30,.28)'; x.beginPath(); x.ellipse(JX - 260, GROUND - 4, 300, 26, 0, 0, TAU); x.fill(); }
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 640, 560, 900, 200, { lines: true, lw: 2, frac: 0, seed: 23 });
      pine(x, 1000, 600, .75, { seed: 6, lean: -.4, foliage: P.pine, minI: 3 });
      x.fillStyle = S;
      carve(x, [[0, 560], [W, 560]], 2.4, { taper: [0, 0] }); carve(x, [[0, 612], [W, 612]], 2.2, { taper: [0, 0] });
      [[0, 236], [706, W]].forEach(([a, b]) => { carve(x, [[a, 1050], [b, 1050]], 2.4, { taper: [0, 0] }); carve(x, [[a, 1030], [b, 1030]], 1.6, { taper: [0, 0] }); });
      x.strokeStyle = S; x.lineWidth = 2.2; x.strokeRect(120, 612, 30, 418); x.strokeRect(930, 612, 30, 418);
      carve(x, wob(JAR, 1.5, 4), 3.2, { closed: true, seed: 6 });
      x.lineWidth = 2.6; x.strokeRect(LIP[0][0], LIP[0][1], LIP[1][0] - LIP[0][0], LIP[2][1] - LIP[0][1]);
      carve(x, [[262, 1020], [330, 1120], [400, 1070], [450, 1140], [520, 1070], [590, 1130], [640, 1060], [680, 1110], [712, 1060]], 1.8, { taper: [.1, .1], seed: 9 });
      x.lineWidth = 1.4; x.beginPath(); x.moveTo(280, 1230); x.quadraticCurveTo(470, 1250, 660, 1230); x.stroke();
      carve(x, [[0, GROUND], [W, GROUND]], 1.4, { taper: [0, 0], seed: 11 });
      const [sx, sy, sr] = P.sunXY; x.lineWidth = 1.6; x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.stroke();
    } },
  };
}
const RIM = [590, MOUTH - 14];
const V_DAY = {
  id: 'yard', layers: yard('day'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    R.D(2, x => { const RR = mulberry(5); PEBBLES.forEach(([cx, cy, r]) => pebble(x, cx, cy, r, RR)); });
    R.D(3, x => {
      const L0 = 7.6, L1 = 8.75;
      if (tq < L1) {   // flies in and lands on the rim
        const a = ss(seg(tq, L0, L1));
        crow(x, lerp(1180, RIM[0], a), lerp(560, RIM[1], a) - Math.sin(a * Math.PI) * 60, 230, { mode: a > .92 ? 'stand' : 'fly', ph: tq * 2.6 });
        return;
      }
      const look = ss(seg(tq, VO.L04, VO.L04 + .5)) * (1 - ss(seg(tq, VO.L05 - .2, VO.L05 + .1)));
      const push = ss(seg(tq, 15.7, 16.0)) * (1 - ss(seg(tq, 16.9, 17.2)));
      const peck = [17.75, 18.05, 18.35, 18.65].reduce((m, p) => Math.max(m, 1 - Math.abs(tq - p) / .15), 0);
      if (tq >= VO.L06 + .2) crow(x, RIM[0] + 10, RIM[1], 230, { flip: true, head: .55 * ss(seg(tq, VO.L06 + .2, VO.L06 + .8)) });
      else crow(x, RIM[0], RIM[1], 230, { head: look * .9 + push * .1, lean: look * .45 + push * .32, peck: clamp(peck) * 1.2 });
    });
  },
};
const V_EVE = {
  id: 'eve', layers: yard('eve'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    // the water is at the brim now: a band of blue above the lip, with a glint
    R.D(1, x => { x.fillStyle = PAL.ai; x.strokeStyle = S; x.lineWidth = 2.2; x.beginPath(); x.moveTo(330, MOUTH - 14); x.quadraticCurveTo(470, MOUTH - 34, 610, MOUTH - 14); x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = PAL.white; x.lineWidth = 3; x.beginPath(); x.moveTo(390, MOUTH - 21); x.quadraticCurveTo(420, MOUTH - 25, 450, MOUTH - 25); x.stroke(); });
    const dip = ss(seg(tq, 35.9, 36.2)) * (.75 + .25 * Math.sin((tq - 36.2) * 4.4));
    R.D(3, x => crow(x, RIM[0], RIM[1], 230, { head: dip, lean: dip * .45 }));
  },
};

// the crow on the rim seen from straight above: back, folded wings, head, beak pointing into the jar (hx,hy = top of head)
function topCrow(x, hx, hy, k = 1, o = {}) {
  x.save(); x.translate(hx, hy); x.scale(k, k);
  shape(x, [[0, -46], [-46, -60], [-80, -100], [-70, -150], [-30, -190], [0, -200], [30, -190], [70, -150], [80, -100], [46, -60]], CROW, 2.6);
  [-1, 1].forEach(d => { shape(x, [[d * 8, -60], [d * 58, -84], [d * 74, -130], [d * 50, -180], [d * 14, -205], [d * 8, -150]], CROW_W, 2.4);
    x.strokeStyle = CROW_H; x.lineWidth = 1.6; for (let j = 0; j < 4; j++) { x.beginPath(); x.moveTo(d * (20 + j * 12), -96 - j * 4); x.lineTo(d * (16 + j * 8), -180 + j * 10); x.stroke(); } });
  shape(x, [[-14, -205], [0, -250], [14, -205]], CROW_W, 2.4, true, false);   // tail
  shape(x, [[-36, -22], [-30, 18], [0, 34], [30, 18], [36, -22], [0, -48]], CROW, 2.6);
  shape(x, [[-12, 26], [0, 78], [12, 26]], '#34343a', 2.2, true, false);
  [[-24, 4], [24, 4]].forEach(([a, b]) => { x.fillStyle = PAL.white; x.beginPath(); x.arc(a, b, 4, 0, TAU); x.fill(); x.fillStyle = S; x.beginPath(); x.arc(a, b + 1, 2, 0, TAU); x.fill(); });
  if (o.pebble) { x.fillStyle = PEB; x.strokeStyle = S; x.lineWidth = 2; x.beginPath(); x.ellipse(0, 84, 20, 16, .3, 0, TAU); x.fill(); x.stroke(); }
  x.restore();
}

// —— Sheet 2: looking down into the jar (top view) ——
const C = [540, 900], RIMR = 470, IN = 420, STEP = 15.5;
const level = t => {   // water radius: one step per stone (each printed like a new block), then the long last rise
  let n = 0; DROPS.forEach(d => { if (t >= d + .32) n++; });
  const last = DROPS.length - 1;
  let r = 70 + Math.min(n, last) * STEP;
  if (n > last) r += (380 - r) * ss(seg(t, DROPS[last] + .32, 34.4));
  return { r, n };
};
const dropPos = (i, r) => { const R2 = mulberry(i + 50); return [C[0] + (R2() - .5) * r * .4, C[1] + (R2() - .5) * r * .4]; };
const V_TOP = {
  id: 'top',
  layers: {
    sky: { g: 1, grain: .1, draw(x) {} },
    greens: { g: 2, grain: .08, draw(x) {
      rect(x, '#b9b3a2', 0, 0, W, H);   // stone paving around the jar
      const R = mulberry(41);
      for (let y = 60; y < H; y += 150) for (let X = (y / 150 % 2) * -90; X < W; X += 180) rect(x, R() < .5 ? '#aaa392' : '#c4bead', X + 4, y + 4, X + 176, y + 146);
      // the jar's shoulder from above, the lip, then the dark inside (concentric bands)
      x.fillStyle = CLAY; x.beginPath(); x.arc(C[0], C[1], RIMR + 60, 0, TAU); x.fill();
      x.fillStyle = GLAZE; x.beginPath(); x.arc(C[0], C[1], RIMR + 30, 0, TAU); x.fill();
      x.fillStyle = CLAY_D; x.beginPath(); x.arc(C[0], C[1], RIMR, 0, TAU); x.fill();
      [[IN, '#4a3020'], [360, '#3b261a'], [290, '#2e1f17'], [210, '#251a14'], [130, '#1d1612']].forEach(([r, c]) => { x.fillStyle = c; x.beginPath(); x.arc(C[0], C[1], r, 0, TAU); x.fill(); });
    } },
    reds: { g: 3, draw(x) {} },
    key: { g: 0, speck: .12, draw(x) {
      x.fillStyle = S;
      [RIMR + 60, RIMR + 30, RIMR, IN].forEach((r, i) => carve(x, wob(Array.from({ length: 48 }, (_, k) => [C[0] + Math.cos(k / 48 * TAU) * r, C[1] + Math.sin(k / 48 * TAU) * r]), 1.5, i + 2), i === 2 ? 3.4 : 2.4, { closed: true, seed: i + 30 }));
      x.strokeStyle = S; x.lineWidth = 1.6;
      for (let y = 60; y < H; y += 150) for (let X = (y / 150 % 2) * -90; X < W; X += 180) { if (Math.hypot(X + 90 - C[0], y + 75 - C[1]) > RIMR + 150) x.strokeRect(X + 4, y + 4, 172, 142); }
      const RR = mulberry(8); [[150, 1520], [880, 1480], [930, 1600], [210, 300], [860, 260]].forEach(([a, b]) => pebble(x, a, b, 16, RR, 2));
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const { r, n } = level(t), tq = q8(t);
    const disc = rr => x => {
      x.save(); x.beginPath(); x.arc(C[0], C[1], rr, 0, TAU); x.clip();
      x.fillStyle = PAL.ai; x.fillRect(C[0] - rr, C[1] - rr, rr * 2, rr * 2);
      x.fillStyle = PAL.sky; x.beginPath(); x.arc(C[0] - rr * .18, C[1] - rr * .2, rr * .78, 0, TAU); x.fill();
      x.fillStyle = PAL.white; x.beginPath(); x.arc(C[0] + rr * .38, C[1] + rr * .3, rr * .12, 0, TAU); x.fill();   // the sun, reflected
      // her own face looking back up at her: it grows as the water comes up to meet her
      x.globalAlpha = .85; topCrow(x, C[0], C[1] - rr * .42, rr / 300); x.globalAlpha = 1;
      x.restore();
      x.strokeStyle = S; x.lineWidth = 2.6; x.beginPath(); x.arc(C[0], C[1], rr, 0, TAU); x.stroke();
    };
    // each new step of water is printed like a fresh block (ink-take reveal + misregistration); the old level stays underneath
    const done = DROPS.filter(d => t >= d + .32), lastD = done[done.length - 1];
    if (R.rev(1) >= 1 && lastD !== undefined && n < DROPS.length && t - lastD - .32 < .3) {
      disc(70 + (n - 1) * STEP)(x);
      stampFn(x, disc(r), (t - lastD - .32) / .3, [6, -5]);
    } else R.D(1, disc(r));
    const tr = q12(t);   // ripples from where each stone went in, 12 fps
    R.D(0, x => {
      DROPS.forEach((d, i) => {
        const a = tr - d - .32; if (a < 0 || a > 1.3) return;
        const [px, py] = dropPos(i, r);
        x.save(); x.beginPath(); x.arc(C[0], C[1], r, 0, TAU); x.clip();
        for (let k = 0; k < 3; k++) { const rr = a * 160 - k * 34; if (rr <= 4) continue;
          x.strokeStyle = PAL.white; x.globalAlpha = clamp(1 - a / 1.3) * .9; x.lineWidth = 4 - k; x.beginPath(); x.arc(px, py, rr, 0, TAU); x.stroke(); }
        x.restore();
      });
    });
    R.D(3, x => {
      // the falling stone: from her beak at the rim, shrinking as it falls away from us
      DROPS.forEach((d, i) => {
        const a = (t - d) / .32; if (a < 0 || a >= 1) return;
        const [px, py] = dropPos(i, r), sx = lerp(C[0], px, a), sy = lerp(C[1] - RIMR + 40, py, a * a), sz = lerp(20, 7, a);
        x.fillStyle = PEB; x.strokeStyle = S; x.lineWidth = 2; x.beginPath(); x.ellipse(sx, sy, sz, sz * .8, .3, 0, TAU); x.fill(); x.stroke();
      });
      // the crow on the rim, seen from above (bobs down as she lets a stone go)
      const hold = DROPS.some(d => tq >= d - .35 && tq < d);
      topCrow(x, C[0], C[1] - RIMR - 30 + (hold ? 14 : 0), 1, { pebble: hold });
    });
  },
};

export const VIEWS = [V_DROUGHT, V_DAY, V_TOP, V_EVE];
