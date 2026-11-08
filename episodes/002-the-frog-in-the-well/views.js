// The Frog in the Well — four prints (1080×1920). g: 0 key · 1 blues · 2 greens/greys · 3 reds/figures
import { clamp, lerp, seg, ss, eio, eo, mulberry, vnoise, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, fillPath, bokashi, kasumi, rgba } from './print.js';
import { mountain, pine, goose } from './nature.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8, q12 = t => Math.floor(t * 12) / 12;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
const VO = CFG.VO;
const FROG = '#7d9a45', FROG_D = '#4f6a2c', BELLY = '#e6dca0', SHELL = '#6f6a3a', SHELL_D = '#4c4824';

// —— the frog: side view, facing right. look 0..1 (head tilts up), mouth 0..1, climb (body vertical), ph (leg phase) ——
export function frog(x, px, py, s, o = {}) {
  const u = s / 100, lw = Math.max(1.4, s / 60) / u;
  x.save(); x.translate(px, py); x.scale(u * (o.flip ? -1 : 1), u); x.lineJoin = 'round'; x.lineCap = 'round';
  if (o.climb) x.rotate(-Math.PI / 2 + .12);
  const lk = o.look || 0, m = o.mouth || 0, ph = o.ph || 0;
  x.strokeStyle = S; x.lineWidth = lw;
  // back leg (folded, big thigh)
  const kick = o.climb ? Math.sin(ph * TAU) * 10 : 0;
  x.fillStyle = FROG_D; x.beginPath(); smooth(x, [[-46, -6], [-30, -34], [-6, -30], [-4, -8], [-20 + kick, 0], [-52 + kick, 2]], true); x.fill(); x.stroke();
  x.beginPath(); smooth(x, [[-52 + kick, 2], [-64 + kick, 0], [-70 + kick, 6], [-56 + kick, 6]], true); x.fill(); x.stroke();
  // body (tilts up with look)
  x.save(); x.rotate(-lk * .35);
  x.fillStyle = FROG; x.beginPath(); smooth(x, [[-40, -10], [-34, -40], [-6, -56], [26, -54], [44, -40], [48, -22], [34, -6], [0, 0], [-30, 0]], true); x.fill(); x.stroke();
  x.fillStyle = BELLY; x.beginPath(); smooth(x, [[44, -26], [36, -8], [8, -2], [-18, -4], [8, -14], [30, -22]], true); x.fill();
  // spots
  x.fillStyle = FROG_D; [[-14, -36, 6], [4, -44, 5], [-26, -24, 4.5]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, TAU); x.fill(); });
  // eye bulge + pupil (looks up when lk)
  x.fillStyle = FROG; x.beginPath(); x.arc(24, -54, 12, 0, TAU); x.fill(); x.stroke();
  x.fillStyle = '#f2ecd0'; x.beginPath(); x.arc(25, -56, 8, 0, TAU); x.fill();
  x.fillStyle = S; x.beginPath(); x.arc(26 + lk * 1.5, -58 - lk * 2.5, 4.2, 0, TAU); x.fill();
  // mouth (opens to laugh)
  x.lineWidth = lw * .8; x.beginPath(); x.moveTo(48, -24); x.quadraticCurveTo(30, -16 + m * 6, 12, -24); x.stroke();
  if (m > .05) { x.fillStyle = '#9b3b2c'; x.beginPath(); x.moveTo(46, -24); x.quadraticCurveTo(30, -16 + m * 14, 14, -24); x.quadraticCurveTo(30, -20, 46, -24); x.fill(); x.stroke(); }
  x.restore();
  // front leg
  const fk = o.climb ? Math.sin(ph * TAU + Math.PI) * 9 : 0;
  x.fillStyle = FROG_D; x.lineWidth = lw;
  x.beginPath(); smooth(x, [[18, -14], [30 + fk, -2], [40 + fk, 0], [22 + fk, 2], [12, -6]], true); x.fill(); x.stroke();
  x.restore();
}

// —— the turtle's head over the rim (looking down) and the full turtle swimming ——
function turtleHead(x, px, py, s) {
  const u = s / 100, lw = Math.max(1.4, s / 60) / u;
  x.save(); x.translate(px, py); x.scale(u, u); x.strokeStyle = S; x.lineWidth = lw; x.lineJoin = 'round';
  x.fillStyle = SHELL; x.beginPath(); x.ellipse(0, -18, 70, 26, 0, Math.PI, TAU); x.fill(); x.stroke();      // shell edge above the rim
  x.fillStyle = '#9a9a62'; x.beginPath(); smooth(x, [[-14, -8], [-12, 22], [-8, 44], [8, 44], [12, 22], [14, -8]], true); x.fill(); x.stroke();   // neck reaching down
  x.beginPath(); x.ellipse(0, 52, 17, 20, 0, 0, TAU); x.fill(); x.stroke();
  x.fillStyle = S; x.beginPath(); x.arc(-7, 54, 2.8, 0, TAU); x.arc(7, 54, 2.8, 0, TAU); x.fill();
  x.beginPath(); x.moveTo(-6, 64); x.quadraticCurveTo(0, 67, 6, 64); x.stroke();
  x.restore();
}
function turtle(x, px, py, s, ph) {
  const u = s / 100, lw = Math.max(1.4, s / 60) / u;
  x.save(); x.translate(px, py); x.scale(u, u); x.strokeStyle = S; x.lineWidth = lw; x.lineJoin = 'round';
  const f = Math.sin(ph * TAU) * .35;
  x.fillStyle = '#8f9058';
  [[-30, 10, -.4 + f], [32, 12, .5 - f]].forEach(([a, b, r]) => { x.save(); x.translate(a, b); x.rotate(r); x.beginPath(); x.ellipse(0, 16, 10, 26, 0, 0, TAU); x.fill(); x.stroke(); x.restore(); });
  x.beginPath(); x.ellipse(62, -2, 17, 12, .1, 0, TAU); x.fill(); x.stroke();
  x.fillStyle = S; x.beginPath(); x.arc(68, -5, 2.6, 0, TAU); x.fill();
  x.fillStyle = SHELL; x.beginPath(); x.moveTo(-58, 8); x.quadraticCurveTo(-50, -44, 0, -46); x.quadraticCurveTo(50, -44, 56, 8); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = SHELL_D; x.lineWidth = lw * .6;
  [[-28, -18], [0, -26], [28, -18], [-14, -2], [14, -2]].forEach(([a, b]) => { x.beginPath(); for (let k = 0; k < 6; k++) { const an = k / 6 * TAU; x[k ? 'lineTo' : 'moveTo'](a + Math.cos(an) * 11, b + Math.sin(an) * 9); } x.closePath(); x.stroke(); });
  x.restore();
}

// ————— Sheet 0: the well (looking up from the bottom) —————
const HOLE = [540, 610, 150];
function bricks(x, x0, x1, y0, y1, h, seed, col) {
  const R = mulberry(seed); x.strokeStyle = col || S;
  for (let y = y0, k = 0; y < y1; y += h, k++) {
    x.lineWidth = 2; x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke();
    let X = x0 + (k % 2 ? 40 : 0) + R() * 30;
    while (X < x1) { x.lineWidth = 1.8; x.beginPath(); x.moveTo(X, y); x.lineTo(X + (R() - .5) * 4, y + h); x.stroke(); X += 90 + R() * 70; }
  }
}
const V_WELL = {
  id: 'well',
  layers: {
    sky: { g: 1, grain: .12, draw(x) {
      // stone walls darken toward the bottom (indigo bokashi) — the well is a deep blue room
      rect(x, PAL.greyL, 0, 0, W, H);
      bokashi(x, 0, 700, W, H, PAL.prusD, 0, .85, { rough: 28, seed: 4 });
      bokashi(x, 0, FR.y0, W, 520, PAL.ai, .55, 0, { rough: 22, seed: 5 });
      // the circle of sky
      x.save(); x.beginPath(); x.arc(HOLE[0], HOLE[1], HOLE[2], 0, TAU); x.clip();
      rect(x, PAL.skyL, 0, 0, W, H); bokashi(x, 0, HOLE[1] - HOLE[2], W, HOLE[1] + HOLE[2], PAL.sky, .9, .2, { rough: 10, seed: 6 });
      kasumi(x, 500, 610, 160, 22, PAL.white, 1); x.restore();
      // the pool
      rect(x, PAL.prus, 0, 1290, W, H); bokashi(x, 0, 1290, W, H, PAL.prusD, .2, .9, { rough: 14, seed: 7 });
    } },
    greens: { g: 2, grain: .05, draw(x) {
      // mossy stones at the waterline, the frog's rock, a fern at the rim
      x.fillStyle = PAL.greenD; for (let i = 0; i < 9; i++) { const X = 40 + i * 125; x.beginPath(); smooth(x, [[X - 50, 1300], [X - 30, 1262 - (i % 3) * 10], [X + 30, 1258], [X + 56, 1300]], true); x.fill(); }
      fillPath(x, [[400, 1300], [430, 1240], [540, 1225], [660, 1240], [690, 1300]], PAL.grey);
      x.fillStyle = PAL.green; for (let k = 0; k < 7; k++) { const a = -2.6 + k * .28; x.beginPath(); smooth(x, [[HOLE[0] + 120, HOLE[1] - 120], [HOLE[0] + 120 + Math.cos(a) * 60, HOLE[1] - 120 + Math.sin(a) * 60 + 50], [HOLE[0] + 120 + Math.cos(a) * 110, HOLE[1] - 120 + Math.sin(a) * 110 + 90]], false); x.lineWidth = 7; x.strokeStyle = PAL.green; x.stroke(); }
    } },
    reds: { g: 3, draw(x) {
      // a shaft of warm light falling from the hole
      x.save(); x.globalAlpha = .45; x.fillStyle = PAL.beniP; x.beginPath(); x.moveTo(HOLE[0] - 120, HOLE[1] + 60); x.lineTo(HOLE[0] + 120, HOLE[1] + 60); x.lineTo(700, 1290); x.lineTo(380, 1290); x.closePath(); x.fill(); x.restore();
    } },
    key: { g: 0, speck: .12, draw(x) {
      bricks(x, 0, W, FR.y0, 1290, 74, 3);
      x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(HOLE[0], HOLE[1], HOLE[2] + 6, 0, TAU); x.fill(); x.restore();
      x.fillStyle = S; carve(x, wob(Array.from({ length: 41 }, (_, k) => [HOLE[0] + Math.cos(k / 40 * TAU) * HOLE[2], HOLE[1] + Math.sin(k / 40 * TAU) * HOLE[2]]), 1.5, 3), 4.2, { taper: [0, 0], seed: 3 });
      carve(x, [[0, 1290], [W, 1290]], 3.2, { taper: [0, 0] });
      carve(x, [[400, 1300], [430, 1240], [540, 1225], [660, 1240], [690, 1300]], 2.6, { taper: [.05, .05], seed: 6 });
      x.strokeStyle = PAL.skyL; x.lineWidth = 2; for (let k = 0; k < 9; k++) { const y = 1360 + k * 58; x.beginPath(); x.moveTo(80 + (k % 3) * 60, y); x.lineTo(1000 - (k % 2) * 90, y); x.stroke(); }
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    // the turtle at the rim (slides in at L04)
    const tu = eo(seg(tq, VO.L04 - .2, VO.L04 + .8));
    if (tu > 0) R.D(3, x => { x.save(); x.beginPath(); x.arc(HOLE[0], HOLE[1], HOLE[2] + 40, 0, TAU); x.rect(0, 0, W, HOLE[1] - HOLE[2] + 30); x.clip(); turtleHead(x, HOLE[0] + 20, HOLE[1] - HOLE[2] - 34 + tu * 52, 120); x.restore(); });
    // ripples spread from the drips
    R.D(0, x => { x.strokeStyle = PAL.white; x.lineWidth = 2; [0.15, 2.4, 5.1, 8.9, 12.2, 15.4, 19.1].forEach(d => { const a = tq - d; if (a > 0 && a < 1.6) { x.globalAlpha = 1 - a / 1.6; x.beginPath(); x.ellipse(300, 1380, 30 + a * 110, 8 + a * 26, 0, 0, TAU); x.stroke(); } }); x.globalAlpha = 1; });
    // the frog: looks up while he speaks of his sky, laughs at the turtle
    const laughing = t > VO.L06 && t < VO.L06 + 3.4;
    const mouth = laughing ? (Math.sin(tq * TAU * 3) > 0 ? .9 : .4) : (t > VO.L03 && t < VO.L03 + 3.6 ? (Math.sin(tq * TAU * 2.5) > 0 ? .35 : 0) : 0);
    const look = t > VO.L02 - .4 && !laughing ? 1 : .2;
    R.D(3, x => frog(x, 540, 1228 - (laughing && Math.sin(tq * TAU * 3) > 0 ? 6 : 0), 230, { look, mouth }));
  },
};

// ————— Sheet 1: the sea, as the turtle tells it —————
const SEA_Y = 640;
const V_SEA = {
  id: 'sea',
  layers: {
    sky: { g: 1, grain: .14, draw(x) {
      bokashi(x, 0, FR.y0, W, 460, PAL.prus, .85, 0, { rough: 22, seed: 11 });
      // water column: lighter at the surface, ink-dark in the deep
      rect(x, PAL.prusL, 0, SEA_Y, W, H);
      bokashi(x, 0, SEA_Y + 80, W, 1500, PAL.prus, 0, .9, { rough: 26, seed: 12 });
      bokashi(x, 0, 1300, W, H, PAL.prusD, 0, 1, { rough: 20, seed: 13 });
      // the drowned mountain: its peak far below the surface
      mountain(x, 540, 1890, 1250, 760, { body: PAL.ai, shade: PAL.prusD, frac: 0, seed: 14 });
      // a far island on the horizon
      mountain(x, 220, SEA_Y + 2, 220, 70, { body: PAL.prusL, frac: 0, seed: 15 });
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, 300, W, SEA_Y, PAL.beniP, 0, .85, { rough: 16, seed: 16 });
      x.fillStyle = PAL.beni; x.beginPath(); x.arc(780, 470, 70, 0, TAU); x.fill();
    } },
    greens: { g: 2, grain: .05, draw(x) {
      // kelp and a few fish shapes in the shallows
      x.strokeStyle = PAL.greenD; x.lineWidth = 8; x.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const X = 110 + i * 170; x.beginPath(); x.moveTo(X, 1890); for (let k = 1; k <= 8; k++) x.lineTo(X + Math.sin(k * .9 + i) * 18, 1890 - k * 40); x.stroke(); }
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 540, 1890, 1250, 760, { lines: true, lw: 2.2, frac: 0, seed: 14 });
      mountain(x, 220, SEA_Y + 2, 220, 70, { lines: true, lw: 1.4, frac: 0, seed: 15 });
      x.fillStyle = S; carve(x, wob([[0, SEA_Y], [540, SEA_Y + 1], [W, SEA_Y]], 1, 2), 3, { taper: [0, 0] });
      x.strokeStyle = S; x.lineWidth = 1.6; x.beginPath(); x.arc(780, 470, 70, 0, TAU); x.stroke();
      // depth marks: the measuring rope of a sailor's line, knot by knot
      x.lineWidth = 2; x.setLineDash([6, 10]); x.beginPath(); x.moveTo(960, SEA_Y); x.lineTo(960, 1850); x.stroke(); x.setLineDash([]);
      for (let k = 1; k < 10; k++) { x.beginPath(); x.arc(960, SEA_Y + k * 130, 6, 0, TAU); x.fill(); }
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), t12 = q12(t);
    // surface waves (12 fps) and the turtle paddling just below them
    R.D(0, x => { x.strokeStyle = PAL.white; x.lineWidth = 3; x.lineCap = 'round'; for (let k = 0; k < 5; k++) { const y = SEA_Y + 22 + k * 30; x.beginPath(); for (let X = -40; X <= W + 40; X += 24) x.lineTo(X, y + Math.sin(X * .02 + t12 * 3 + k) * 6); x.setLineDash([60, 40 + k * 10]); x.lineDashOffset = -t12 * 40; x.stroke(); } x.setLineDash([]); });
    R.D(3, x => turtle(x, lerp(360, 640, seg(tq, CFG.PRINT[1][3], 28.4)), SEA_Y + 140 + Math.sin(tq * 2) * 6, 170, tq * .8));
  },
};

// ————— Sheet 2: the climb (cut-away of the earth with the well inside) —————
const GROUND = 520, SH = [420, 660], BOT = 1700;
function climbY(t) { return lerp(1600, 600, ss(seg(t, 29.6, 33.4))); }
const V_CLIMB = {
  id: 'climb',
  layers: {
    sky: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, GROUND, PAL.sky, .9, .2, { rough: 22, seed: 21 });
      rect(x, PAL.prus, SH[0], GROUND, SH[1], BOT);     // inside the shaft: blue dark
      bokashi(x, SH[0], GROUND, SH[1], BOT, PAL.prusD, .1, .9, { rough: 10, seed: 22 });
      rect(x, PAL.prusL, SH[0], BOT - 110, SH[1], BOT);  // water at the bottom
    } },
    greens: { g: 2, grain: .08, draw(x) {
      // earth strata either side of the shaft
      const bands = [[GROUND, 640, PAL.greenD], [640, 900, PAL.woodL], [900, 1200, PAL.ochre], [1200, 1500, PAL.wood], [1500, H, PAL.woodD]];
      for (const [a, b, c] of bands) { rect(x, c, 0, a, SH[0] - 30, b); rect(x, c, SH[1] + 30, a, W, b); }
      // the well's stone lining
      rect(x, PAL.grey, SH[0] - 30, GROUND - 60, SH[0], BOT + 30); rect(x, PAL.grey, SH[1], GROUND - 60, SH[1] + 30, BOT + 30);
      rect(x, PAL.green, 0, GROUND - 26, SH[0] - 30, GROUND); rect(x, PAL.green, SH[1] + 30, GROUND - 26, W, GROUND);
      // pebbles in the earth
      const R = mulberry(23); x.fillStyle = PAL.greyL; for (let i = 0; i < 40; i++) { const X = R() < .5 ? R() * (SH[0] - 70) + 10 : SH[1] + 50 + R() * (W - SH[1] - 70), Y = 680 + R() * 1150; x.beginPath(); x.ellipse(X, Y, 10 + R() * 14, 7 + R() * 8, R() * 3, 0, TAU); x.fill(); }
    } },
    reds: { g: 3, draw(x) {
      x.fillStyle = PAL.beni; x.beginPath(); x.arc(860, 230, 62, 0, TAU); x.fill();
      kasumi(x, 300, 300, 520, 26, PAL.beniP, .9);
    } },
    key: { g: 0, speck: .12, draw(x) {
      x.fillStyle = S;
      [[GROUND], [640], [900], [1200], [1500]].forEach(([y], i) => { carve(x, wob([[0, y], [SH[0] - 30, y]], 2, i), 2.4, { taper: [0, .1] }); carve(x, wob([[SH[1] + 30, y], [W, y]], 2, i + 9), 2.4, { taper: [.1, 0] }); });
      x.strokeStyle = S; x.lineWidth = 2.6; x.strokeRect(SH[0] - 30, GROUND - 60, 30, BOT - GROUND + 90); x.strokeRect(SH[1], GROUND - 60, 30, BOT - GROUND + 90);
      x.lineWidth = 1.6; for (let y = GROUND - 30; y < BOT + 30; y += 36) { x.beginPath(); x.moveTo(SH[0] - 30, y); x.lineTo(SH[0], y); x.moveTo(SH[1], y); x.lineTo(SH[1] + 30, y); x.stroke(); }
      x.lineWidth = 1.6; x.beginPath(); x.arc(860, 230, 62, 0, TAU); x.stroke();
      carve(x, [[SH[0], BOT - 110], [SH[1], BOT - 110]], 2.2, { taper: [0, 0] });
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), y = climbY(tq);
    R.D(3, x => frog(x, SH[0] + 78, y, 150, { climb: true, ph: tq * 2.2, look: .3 }));
    if (t > 31.5) R.D(3, x => { const u = ss(seg(t, 31.5, 33.4)); x.globalAlpha = u * .55; x.fillStyle = PAL.beniP; x.beginPath(); x.moveTo(SH[0], GROUND); x.lineTo(SH[1], GROUND); x.lineTo(SH[1], GROUND + 380 * u); x.lineTo(SH[0], GROUND + 300 * u); x.fill(); x.globalAlpha = 1; });
  },
};

// ————— Sheet 3: the sky with no edge —————
const RIM = [540, 1330];
function bigCloud(x, cx, cy, sc, lw) {
  const L = [[-260, 30, 110], [-140, -20, 140], [0, -50, 160], [150, -10, 130], [270, 40, 100]];
  x.strokeStyle = S; x.lineWidth = lw * 2; L.forEach(([a, b, r]) => { x.beginPath(); x.arc(cx + a * sc, cy + b * sc, r * sc, 0, TAU); x.stroke(); });
  x.fillStyle = PAL.white; x.beginPath(); L.forEach(([a, b, r]) => { x.moveTo(cx + a * sc + r * sc, cy + b * sc); x.arc(cx + a * sc, cy + b * sc, r * sc, 0, TAU); }); x.fill();
}
const V_SKY = {
  id: 'sky',
  layers: {
    sky: { g: 1, grain: .1, draw(x) {
      bokashi(x, 0, FR.y0, W, 1100, PAL.prus, .9, .05, { rough: 26, seed: 31 });
      rect(x, PAL.prusL, 0, 1130, W, 1300); bokashi(x, 0, 1130, W, 1300, PAL.prus, .1, .6, { rough: 10, seed: 32 });
      mountain(x, 160, 1132, 420, 260, { body: PAL.prusL, snow: PAL.white, frac: .3, seed: 33 });
      mountain(x, 900, 1132, 300, 120, { body: PAL.skyL, frac: 0, seed: 34 });
    } },
    reds: { g: 3, draw(x) { bokashi(x, 0, 700, W, 1130, PAL.beniP, 0, .9, { rough: 18, seed: 35 }); x.fillStyle = PAL.beni; x.beginPath(); x.arc(720, 1060, 54, 0, TAU); x.fill(); } },
    greens: { g: 2, grain: .05, draw(x) {
      rect(x, PAL.green, 0, 1300, W, H); bokashi(x, 0, 1300, W, H, PAL.greenD, 0, .7, { rough: 14, seed: 36 });
      pine(x, 900, 1520, 1.3, { seed: 37, lean: -.3, lines: false, minI: 3 });
      // the well's round stone rim, seen from the side
      fillPath(x, [[RIM[0] - 90, RIM[1]], [RIM[0] - 90, RIM[1] - 40], [RIM[0] + 90, RIM[1] - 40], [RIM[0] + 90, RIM[1]]], PAL.grey);
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 160, 1132, 420, 260, { lines: true, lw: 2, snowLine: S, frac: .3, seed: 33 });
      mountain(x, 900, 1132, 300, 120, { lines: true, lw: 1.4, frac: 0, seed: 34 });
      x.fillStyle = S; carve(x, [[0, 1130], [W, 1130]], 2.4, { taper: [0, 0] }); carve(x, wob([[0, 1300], [540, 1302], [W, 1300]], 2, 3), 2.8, { taper: [0, 0] });
      pine(x, 900, 1520, 1.3, { seed: 37, lean: -.3, fills: false, lw: 2.2, minI: 3 });
      x.strokeStyle = S; x.lineWidth = 2.6; x.strokeRect(RIM[0] - 90, RIM[1] - 40, 180, 40); x.lineWidth = 1.4; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(RIM[0] - 90 + k * 45, RIM[1] - 40); x.lineTo(RIM[0] - 90 + k * 45, RIM[1]); x.stroke(); }
      x.lineWidth = 1.6; x.beginPath(); x.arc(720, 1060, 54, 0, TAU); x.stroke();
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), dr = (tq - 33.6) * 6;
    // clouds too big for the print: drawn after the sheet, past the border into the mount
    R.free(x => { if (R.rev(1) < 1) return; bigCloud(x, 240 + dr, 260, 1.15, 3); bigCloud(x, 880 - dr * .6, 520, .9, 3); kasumi(x, 540, 760, 1400, 34, PAL.white, .95); });
    R.D(0, x => { for (let i = 0; i < 5; i++) { const off = Math.abs(i - 2); goose(x, 760 - (tq - 34) * 40 + off * 34, 900 + off * 18, 1.4, Math.sin(tq * 9 + i) > 0 ? 1 : -.4); } });
    R.D(3, x => frog(x, RIM[0] - 10, RIM[1] - 40, 62, { look: 1, mouth: 0 }));
  },
};

export const VIEWS = [V_WELL, V_SEA, V_CLIMB, V_SKY];
