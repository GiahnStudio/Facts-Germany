// The six prints of "The Stonecutter" (1080×1920 sheets). Each = cached colour blocks + live paint().
// Block groups g: 0 key line · 1 blues · 2 greens / greys / secondary · 3 reds / figures
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry, vnoise, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, line, fillPath, bokashi, kasumi, rgba, mix, printTex } from './print.js';
import { mountain, pine, rock, rain, goose } from './nature.js';
import { traveler } from './traveler.js';
import { cutter, lord, palanquin, face } from './figures.js';
import { T, q8, q12 } from './story.js';

const S = PAL.sumi;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
// hammer swing: strike at every multiple of P (offset o), raise slowly, fall fast
export const swingAt = (t, P = .78, o = 0) => { const p = (((t - o) / P) % 1 + 1) % 1; return p < .55 ? 1 - eo(p / .55) : p < .8 ? 0 : ei((p - .8) / .2); };
export const hitsIn = (a, b, P = .78, o = 0) => { const out = []; for (let k = Math.ceil((a - o) / P); o + k * P < b; k++) out.push(o + k * P); return out; };

// ————————————————— Quarry (sheet 0 at dawn, sheet 5 at dusk: alternate impressions of one key block) —————————————————
const ROAD = [1262, 1318];
const CLIFF = [[38, 930], [120, 905], [215, 920], [262, 990], [300, 1062], [660, 1062], [705, 1092], [728, 1180], [690, 1236], [38, 1244]];
const CLIFF_F = [[[38, 930], [120, 905], [215, 920], [180, 1010], [38, 1040]], [[262, 990], [300, 1062], [190, 1110], [180, 1010], [215, 920]], [[660, 1062], [705, 1092], [728, 1180], [600, 1150], [560, 1100]], [[38, 1150], [300, 1140], [500, 1180], [690, 1236], [38, 1244]]];
const STONE = [[440, 1062], [452, 1002], [500, 978], [560, 984], [596, 1012], [604, 1062]];
const BLOCKS = [[38, 1340, 300, 1500], [300, 1352, 560, 1480], [560, 1344, 860, 1520], [860, 1336, 1042, 1500], [38, 1500, 400, 1700], [400, 1480, 700, 1690], [700, 1520, 1042, 1720], [38, 1700, 330, 1880], [330, 1690, 760, 1880], [760, 1720, 1042, 1880]];
const PAL_Q = {
  dawn: { sky: PAL.prus, sky2: PAL.sky, mtn: PAL.prusL, shade: PAL.prus, glow: PAL.beniP, sun: [190, 600, 40], sunC: PAL.beni, cliff: PAL.greyL, face: PAL.grey, road: PAL.ochreL, blocks: '#c9c4b2', green: PAL.green, greenD: PAL.greenD },
  dusk: { sky: '#7c3a2c', sky2: '#d9774a', mtn: '#5d4f72', shade: '#3f3554', glow: '#efb58a', sun: [860, 700, 72], sunC: '#c8452c', cliff: '#c9b49a', face: '#9b8670', road: '#e2b07a', blocks: '#d4bfa3', green: '#9a9a52', greenD: '#5d6438' },
};
function quarry(id, mode) {
  const P = PAL_Q[mode];
  return {
    id,
    layers: {
      sky: { g: 1, grain: .12, draw(x) {
        bokashi(x, 0, FR.y0, W, 560, P.sky, .92, 0, { rough: 26, seed: mode === 'dawn' ? 2 : 12 });
        bokashi(x, 0, 380, W, 900, P.sky2, 0, mode === 'dawn' ? .42 : .7, { rough: 20, seed: 6 });
        mountain(x, 640, 905, 1150, 640, { body: P.mtn, shade: P.shade, snow: PAL.white, frac: .3, seed: 5 });
        kasumi(x, 520, 860, 900, 36, PAL.white, .85); kasumi(x, 840, 800, 520, 26, PAL.white, .7);
      } },
      greens: { g: 2, grain: .05, draw(x) {
        // far tree band under the mountain
        x.fillStyle = P.greenD; x.beginPath(); x.moveTo(0, 940);
        for (let X = 0; X <= W; X += 12) x.lineTo(X, 912 - Math.abs(Math.sin(X * .05)) * 6 - vnoise(X * .015) * 14);
        x.lineTo(W, 960); x.lineTo(0, 960); x.fill();
        rect(x, P.green, 0, 940, W, 1262);
        // quarry cliff + the stone being cut
        fillPath(x, CLIFF, P.cliff); x.fillStyle = P.face; CLIFF_F.forEach(f => { x.beginPath(); poly(x, f); x.fill(); });
        fillPath(x, STONE, P.blocks); x.fillStyle = P.face; x.beginPath(); poly(x, [[560, 984], [596, 1012], [604, 1062], [560, 1062]]); x.fill();
        // road + cut blocks in the foreground
        rect(x, P.road, 0, ROAD[0], W, ROAD[1]);
        rect(x, P.green, 0, ROAD[1], W, 1340);
        BLOCKS.forEach(([a, b, c, d], i) => { rect(x, i % 3 ? P.blocks : P.cliff, a, b, c, d); x.fillStyle = P.face; x.fillRect(a, d - 18, c - a, 18); });
        pine(x, 930, 1290, 2.05, { seed: 4, lean: .32, lines: false, minI: 3 });
      } },
      reds: { g: 3, draw(x) {
        bokashi(x, 0, 520, W, 900, P.glow, 0, .75, { rough: 16, seed: 9 });
        const [sx, sy, sr] = P.sun; x.fillStyle = P.sunC; x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.fill();
        if (mode === 'dusk') { kasumi(x, 640, 760, 760, 22, '#f3c9a2', .9); kasumi(x, 300, 690, 420, 18, '#f3c9a2', .8); }
      } },
      key: { g: 0, speck: .12, draw(x) {
        mountain(x, 640, 905, 1150, 640, { lines: true, lw: 2.4, snowLine: S, frac: .3, seed: 5 });
        x.fillStyle = S;
        carve(x, wob(CLIFF.slice(0, 7), 2, 3), 3.2, { taper: [.05, .05], seed: 3 });
        carve(x, wob(CLIFF.slice(5), 2, 4), 3, { taper: [.05, .3], seed: 4 });
        CLIFF_F.forEach((f, i) => carve(x, wob(f.slice(2, 5), 1.5, i + 9), 1.8, { taper: [.2, .5], seed: i + 9 }));
        carve(x, wob(STONE, 1.5, 7), 2.6, { taper: [.05, .05], seed: 7 }); carve(x, [[560, 986], [562, 1060]], 1.6, { seed: 8 });
        for (let i = 0; i < 7; i++) carve(x, [[250 + i * 18, 940 + i * 14], [262 + i * 18, 1000 + i * 9]], 1.1, { seed: 30 + i, taper: [.3, .3] });  // chisel marks on the wall
        carve(x, wob([[0, ROAD[0]], [540, ROAD[0] + 1], [W, ROAD[0]]], 1.2, 5), 2.6, { taper: [0, 0] });
        carve(x, wob([[0, ROAD[1]], [540, ROAD[1] - 1], [W, ROAD[1]]], 1.2, 6), 2.8, { taper: [0, 0] });
        BLOCKS.forEach(([a, b, c, d], i) => { x.strokeStyle = S; x.lineWidth = 2.4; x.strokeRect(a, b, c - a, d - b); x.lineWidth = 1.2; x.beginPath(); x.moveTo(a, d - 18); x.lineTo(c, d - 18); x.stroke(); });
        pine(x, 930, 1290, 2.05, { seed: 4, lean: .32, fills: false, lw: 2.8, minI: 3 });
        const [sx, sy, sr] = P.sun; x.strokeStyle = S; x.lineWidth = 1.6; x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.stroke();
      } },
    },
    paint(x, t, R) {
      R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
      const tq = q8(t);
      // the stonecutter on the ledge
      let sw = 0, mood = 'plain';
      if (mode === 'dawn') {
        if (t < T.hammer0[1]) sw = swingAt(tq, .78, .2); else sw = lerp(swingAt(T.hammer0[1], .78, .2), .15, ss(seg(t, T.hammer0[1], T.hammer0[1] + .5)));
        mood = t > 8.6 ? 'sad' : 'plain';
      } else { sw = t > T.hammer5[0] && t < T.hammer5[1] ? swingAt(tq, .9, T.hammer5[0]) : .15; mood = 'smile'; }
      R.D(3, x => cutter(x, 382, 1062, 172, { swing: sw, mood, chisel: [36, -24] }));
      // sparks on each strike
      const hs = mode === 'dawn' ? hitsIn(0, T.hammer0[1], .78, .2) : hitsIn(T.hammer5[0], T.hammer5[1], .9, T.hammer5[0]);
      for (const h of hs) if (tq >= h && tq < h + .25) R.D(0, x => { const R2 = mulberry(Math.round(h * 100)); x.strokeStyle = mode === 'dawn' ? PAL.ochre : '#f6d27a'; x.lineWidth = 2.4; x.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = -2.6 + R2() * 1.6, l = 14 + R2() * 22, d = (tq - h) * 120; x.beginPath(); x.moveTo(442 + Math.cos(a) * (6 + d), 1022 + Math.sin(a) * (6 + d)); x.lineTo(442 + Math.cos(a) * (6 + d + l), 1022 + Math.sin(a) * (6 + d + l)); x.stroke(); } });
      // palanquin passing on the road (right → left)
      if (mode === 'dawn' && t > T.palanquin[0] && t < T.palanquin[1]) {
        const u = seg(tq, ...T.palanquin), px = lerp(1180, -260, u);
        R.D(3, x => palanquin(x, px, 1300, 118, traveler, tq * 1.1));
      }
      // birds: geese at dawn, crows home at dusk
      if (mode === 'dawn' && t > 2 && t < 9) R.D(0, x => { const u = (tq - 2) / 7; for (let i = 0; i < 5; i++) { const off = Math.abs(i - 2); goose(x, lerp(960, 380, u) + off * 30, 300 + off * 16, 1.2, Math.sin(tq * 9 + i) > 0 ? 1 : -.4); } });
      if (mode === 'dusk' && t > 57.8) R.D(0, x => { const u = (tq - 57.8) / 5; for (let i = 0; i < 3; i++) goose(x, lerp(200, 760, u) + i * 46, 470 - i * 22 + Math.sin(u * 5 + i) * 6, 1.4, Math.sin(tq * 7 + i) > 0 ? 1 : -.4); });
    },
  };
}

// ————————————————— Lord on a veranda under the sun —————————————————
const V_LORD = {
  id: 'lord',
  layers: {
    sky: { g: 1, grain: .1, draw(x) {
      bokashi(x, 0, FR.y0, W, 520, PAL.prus, .55, 0, { rough: 22, seed: 21 });
      mountain(x, 300, 650, 430, 250, { body: PAL.prusL, snow: PAL.white, frac: .34, seed: 8 });
    } },
    greens: { g: 2, grain: .04, draw(x) {
      // eave cropped at the top (bold foreground framing)
      x.fillStyle = PAL.greyD; x.beginPath(); poly(x, [[0, 0], [W, 0], [W, 150], [0, 340]]); x.fill();
      // garden wall with a tiled cap
      rect(x, PAL.plaster, 0, 650, W, 770); rect(x, PAL.greyD, 0, 628, W, 652);
      pine(x, 150, 900, 1.55, { seed: 11, lean: .45, lines: false, minI: 3 });
      pine(x, 900, 880, 1.25, { seed: 12, lean: -.3, lines: false, minI: 3 });
      rect(x, PAL.green, 0, 770, W, 1140);
      // pillars + veranda floor
      rect(x, PAL.wood, 92, 300, 140, 1150); rect(x, PAL.wood, 940, 160, 988, 1150);
      rect(x, PAL.woodL, 0, 1140, W, 1262); rect(x, PAL.woodD, 0, 1262, W, 1290);
      // raked garden sand
      rect(x, PAL.paperD, 0, 1290, W, H);
      fillPath(x, [[140, 1600], [210, 1540], [330, 1550], [380, 1620], [300, 1660], [170, 1650]], PAL.grey);
      fillPath(x, [[720, 1700], [800, 1650], [900, 1670], [930, 1740], [820, 1770], [730, 1750]], PAL.grey);
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, FR.y0, W, 760, PAL.beniL, .72, .05, { rough: 24, seed: 23 });
      x.fillStyle = PAL.beni; x.beginPath(); x.arc(700, 470, 118, 0, TAU); x.fill();
      kasumi(x, 600, 600, 760, 30, PAL.beniP, .9);
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 300, 650, 430, 250, { lines: true, lw: 1.8, snowLine: S, frac: .34, seed: 8 });
      x.fillStyle = S; carve(x, [[0, 340], [W, 150]], 3.4, { taper: [0, 0] });
      x.strokeStyle = S; x.lineWidth = 1.6; for (let i = 0; i < 18; i++) { const X = i * 64; x.beginPath(); x.moveTo(X, 0); x.lineTo(X, 340 - X * (190 / W) - 4); x.stroke(); }  // roof tiles
      x.lineWidth = 2.4; x.strokeRect(-4, 628, W + 8, 24); x.strokeRect(-4, 652, W + 8, 118);
      pine(x, 150, 900, 1.55, { seed: 11, lean: .45, fills: false, lw: 2.4, minI: 3 });
      pine(x, 900, 880, 1.25, { seed: 12, lean: -.3, fills: false, lw: 2.2, minI: 3 });
      x.lineWidth = 2.6; x.strokeRect(92, 300, 48, 850); x.strokeRect(940, 160, 48, 990);
      carve(x, [[0, 1140], [W, 1140]], 3, { taper: [0, 0] }); carve(x, [[0, 1262], [W, 1262]], 2.6, { taper: [0, 0] }); carve(x, [[0, 1290], [W, 1290]], 3, { taper: [0, 0] });
      x.lineWidth = 1.2; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(0, 1140 + i * 20); x.lineTo(W, 1140 + i * 20); x.stroke(); }
      // raked lines around the stones
      x.strokeStyle = PAL.greyD; x.lineWidth = 1.6;
      for (let k = 0; k < 16; k++) { const y = 1330 + k * 34; x.beginPath(); for (let X = 0; X <= W; X += 30) { const d1 = Math.hypot(X - 270, y - 1600), d2 = Math.hypot(X - 830, y - 1710), b = Math.max(0, 1 - d1 / 220) * 30 + Math.max(0, 1 - d2 / 200) * 28; X ? x.lineTo(X, y - b) : x.moveTo(X, y - b); } x.stroke(); }
      x.fillStyle = S; carve(x, [[140, 1600], [210, 1540], [330, 1550], [380, 1620], [300, 1660], [170, 1650]], 2.6, { closed: true, seed: 3 });
      carve(x, [[720, 1700], [800, 1650], [900, 1670], [930, 1740], [820, 1770], [730, 1750]], 2.6, { closed: true, seed: 4 });
      x.strokeStyle = S; x.lineWidth = 1.6; x.beginPath(); x.arc(700, 470, 118, 0, TAU); x.stroke();
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), hot = t > 15.4;
    // heat shimmer under the sun
    if (hot) R.D(3, x => { x.strokeStyle = rgba(PAL.beni, .55); x.lineWidth = 2.2; for (let i = 0; i < 6; i++) { const X = 420 + i * 70, ph = tq * 6 + i; x.beginPath(); for (let k = 0; k <= 8; k++) { const y = 640 + k * 14; x[k ? 'lineTo' : 'moveTo'](X + Math.sin(ph + k * .9) * 8, y); } x.stroke(); } });
    R.D(3, x => lord(x, 540, 1192, 390, { fan: hot ? Math.sin(tq * TAU * 1.6) : Math.sin(tq * TAU * .5) * .3, mood: hot ? 'hot' : 'smug', sweat: hot ? (tq * 1.4) % 1 + .001 : 0 }));
  },
};

// ————————————————— He is the sun —————————————————
const SUN = [540, 700, 330];
const FIELDS = [1090, 1150, 1230, 1330, 1450, 1600, 1760, 1900];
function cloudMass(x, cx, cy, sc, fill, lw = 0) {
  const lumps = [[-300, 40, 120], [-170, -30, 150], [0, -70, 170], [170, -20, 150], [300, 50, 120], [-90, 70, 140], [110, 80, 140]];
  const path = () => { x.beginPath(); lumps.forEach(([dx, dy, r]) => { x.moveTo(cx + dx * sc + r * sc, cy + dy * sc); x.arc(cx + dx * sc, cy + dy * sc, r * sc, 0, TAU); }); };
  x.save();
  if (lw) { x.strokeStyle = S; x.lineWidth = lw * 2; lumps.forEach(([dx, dy, r]) => { x.beginPath(); x.arc(cx + dx * sc, cy + dy * sc, r * sc, 0, TAU); x.stroke(); }); }
  x.fillStyle = fill; path(); x.fill();
  // inner curl lines
  if (lw) { x.strokeStyle = S; x.lineWidth = lw * .6; [[-170, -30, 150], [170, -20, 150], [0, -70, 170]].forEach(([dx, dy, r]) => { x.beginPath(); x.arc(cx + dx * sc, cy + dy * sc + r * sc * .25, r * sc * .55, Math.PI * 1.15, Math.PI * 1.7); x.stroke(); }); }
  x.restore();
}
const V_SUN = {
  id: 'sun',
  layers: {
    sky: { g: 1, grain: .1, draw(x) {
      mountain(x, 780, 1095, 380, 190, { body: PAL.prusL, snow: PAL.white, frac: .3, seed: 6 });
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, FR.y0, W, 1100, PAL.beniL, .85, .3, { rough: 26, seed: 31 });
      x.fillStyle = PAL.beni; x.beginPath(); x.arc(SUN[0], SUN[1], SUN[2], 0, TAU); x.fill();
      x.fillStyle = '#c95a3e'; x.beginPath(); x.arc(SUN[0], SUN[1], SUN[2] * .82, 0, TAU); x.fill();
    } },
    greens: { g: 2, grain: .07, draw(x) {
      for (let i = 0; i < FIELDS.length - 1; i++) rect(x, i % 2 ? PAL.ochre : PAL.ochreL, 0, FIELDS[i], W, FIELDS[i + 1]);
      // a dead tree
      x.strokeStyle = PAL.woodD; x.lineCap = 'round';
      const br = (x0, y0, a, l, w, d) => { if (d > 4) return; const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); br(x1, y1, a - .45, l * .68, w * .62, d + 1); br(x1, y1, a + .38, l * .62, w * .6, d + 1); };
      br(170, 1400, -1.65, 150, 18, 0);
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 780, 1095, 380, 190, { lines: true, lw: 1.6, snowLine: S, frac: .3, seed: 6 });
      x.fillStyle = S;
      FIELDS.slice(0, -1).forEach((y, i) => carve(x, wob([[0, y], [540, y + 2], [W, y]], 1.5, i), 1.6 + i * .4, { taper: [0, 0], seed: i }));
      // cracks in the dry fields
      const R = mulberry(77);
      for (let i = 0; i < 26; i++) { let px = R() * W, py = 1160 + R() * 680; const pts = [[px, py]]; for (let k = 0; k < 4; k++) { px += (R() - .5) * 70; py += 10 + R() * 26; pts.push([px, py]); } carve(x, pts, 1.2 + R() * 1.6, { taper: [.2, .6], seed: i }); }
      x.strokeStyle = S; x.lineWidth = 2; x.beginPath(); x.arc(SUN[0], SUN[1], SUN[2], 0, TAU); x.stroke();
      x.lineCap = 'round';
      const br = (x0, y0, a, l, w, d) => { if (d > 4) return; const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; x.lineWidth = Math.max(1.2, w * .22); x.beginPath(); x.moveTo(x0 + 3, y0); x.lineTo(x1 + 3, y1); x.stroke(); br(x1, y1, a - .45, l * .68, w * .62, d + 1); br(x1, y1, a + .38, l * .62, w * .6, d + 1); };
      br(170, 1400, -1.65, 150, 18, 0);
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), c = eio(seg(tq, ...T.cloudIn));
    const mood = t < 24.9 ? 'proud' : t < 26.6 ? 'shock' : 'angry';
    R.D(0, x => face(x, SUN[0], SUN[1] + 10, SUN[2] * .8, mood));
    // heat waves rising from the fields
    if (c < .8) R.D(3, x => { x.strokeStyle = rgba(PAL.beni, .5 * (1 - c)); x.lineWidth = 2.6; for (let i = 0; i < 7; i++) { const X = 120 + i * 140; x.beginPath(); for (let k = 0; k <= 9; k++) x[k ? 'lineTo' : 'moveTo'](X + Math.sin(tq * 5 + i + k * .8) * 10, 1260 - k * 16); x.stroke(); } });
    // the cloud arrives and covers the sun
    if (c > 0) R.D(2, x => { const cx = lerp(1500, 560, c), cy = 740; cloudMass(x, cx, cy, 1.05, PAL.greyL, 3); kasumi(x, cx - 60, cy + 175, 900, 30, PAL.white, .9); });
  },
};

// ————————————————— He is the cloud — rain, flood —————————————————
const MT3 = [540, 1330, 1000, 660];
const ROOFS3 = [[180, 1500, 120], [330, 1470, 90], [760, 1520, 130], [900, 1480, 90], [520, 1620, 140]];
export function floodLevel(t) { return lerp(1960, 1250, eio(seg(t, ...T.flood))); }
const V_CLOUD = {
  id: 'cloud',
  layers: {
    sky: { g: 1, grain: .14, draw(x) {
      bokashi(x, 0, FR.y0, W, 980, PAL.sumiL, .8, .12, { rough: 26, seed: 41 });
      mountain(x, MT3[0], MT3[1], MT3[2], MT3[3], { body: PAL.prus, shade: PAL.prusD, snow: PAL.white, frac: .3, seed: 9 });
      kasumi(x, 600, 1180, 980, 40, PAL.skyL, .75);
    } },
    greens: { g: 2, grain: .05, draw(x) {
      rect(x, PAL.greenD, 0, 1320, W, 1400); rect(x, PAL.green, 0, 1400, W, H);
      ROOFS3.forEach(([cx, y, w]) => { x.fillStyle = PAL.greyD; x.beginPath(); poly(x, [[cx - w / 2, y], [cx - w * .3, y - w * .32], [cx + w * .3, y - w * .32], [cx + w / 2, y]]); x.fill(); rect(x, PAL.plaster, cx - w * .4, y, cx + w * .4, y + w * .3); });
      // the river through the fields
      fillPath(x, [[300, 1880], [420, 1720], [560, 1640], [640, 1560], [700, 1410], [760, 1410], [720, 1580], [640, 1680], [520, 1760], [460, 1880]], PAL.sky);
    } },
    reds: { g: 3, draw(x) { kasumi(x, 420, 1300, 640, 22, PAL.beniP, .5); } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, MT3[0], MT3[1], MT3[2], MT3[3], { lines: true, lw: 2.6, snowLine: S, frac: .3, seed: 9 });
      x.fillStyle = S; carve(x, [[0, 1400], [W, 1400]], 2.4, { taper: [0, 0] });
      ROOFS3.forEach(([cx, y, w], i) => { carve(x, [[cx - w / 2, y], [cx - w * .3, y - w * .32], [cx + w * .3, y - w * .32], [cx + w / 2, y]], 2.2, { taper: [.05, .05], seed: i }); x.strokeStyle = S; x.lineWidth = 2; x.strokeRect(cx - w * .4, y, w * .8, w * .3); });
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), t12 = q12(t);
    // the cloud with his face
    const mood = t < 35.7 ? 'proud' : t < 37.6 ? 'angry' : 'shock';
    R.D(2, x => { cloudMass(x, 540, 420, 1.25, PAL.greyL, 3.4); kasumi(x, 540, 640, 1000, 40, PAL.greyL, 1); });
    R.D(0, x => face(x, 540, 400 + Math.sin(tq * 2) * 4, 190, mood));
    // rain
    R.D(0, x => rain(x, t12, [-100, 600, W + 100, H], { sets: [[-1.45, 300, 2.2, PAL.sumi, .5], [-1.36, 160, 1.4, PAL.greyD, .45]] }));
    // flood water: banded blues rising, white flow lines
    const L = floodLevel(t);
    if (L < FR.y1 + 20) R.D(1, x => {
      x.save(); x.beginPath(); x.moveTo(0, H + 10);
      for (let X = 0; X <= W; X += 20) x.lineTo(X, L + Math.sin(X * .02 + t12 * 4) * 7);
      x.lineTo(W, H + 10); x.closePath(); x.clip();
      x.fillStyle = PAL.prusL; x.fillRect(0, L - 20, W, H); x.fillStyle = PAL.prus; x.fillRect(0, L + 120, W, H);
      x.fillStyle = PAL.prusD; x.fillRect(0, L + 340, W, H);
      printTex(x, .12, .4);
      x.strokeStyle = PAL.white; x.lineWidth = 3; x.lineCap = 'round';
      for (let k = 0; k < 14; k++) { const y = L + 26 + k * 44, ph = t12 * 3 + k; x.beginPath(); for (let X = -40; X <= W + 40; X += 30) { const yy = y + Math.sin(X * .016 + ph) * 9; X > -40 ? x.lineTo(X, yy) : x.moveTo(X, yy); } x.setLineDash([90, 50 + k * 4]); x.lineDashOffset = -t12 * 60 - k * 20; x.stroke(); }
      x.setLineDash([]); x.restore();
      x.strokeStyle = S; x.lineWidth = 3; x.beginPath(); for (let X = 0; X <= W; X += 20) x[X ? 'lineTo' : 'moveTo'](X, L + Math.sin(X * .02 + t12 * 4) * 7); x.stroke();
    });
    // the flood breaks out of the print: water pours over the bottom border into the mount
    const sp = seg(t, ...T.spill);
    if (sp > 0) R.free(x => {
      const drop = 160 + ss(clamp(sp * 1.6)) * 560, a = 1 - ss(seg(t, T.spill[1] - .6, T.spill[1]));
      x.save(); x.globalAlpha = a;
      x.fillStyle = PAL.prus; x.beginPath(); x.moveTo(FR.x0 + 40, FR.y1);
      for (let X = FR.x0 + 40; X <= FR.x1 - 40; X += 24) x.lineTo(X, FR.y1 + drop * (.75 + .25 * vnoise(X * .02 + t12 * 2)));
      x.lineTo(FR.x1 - 40, FR.y1); x.closePath(); x.fill();
      x.strokeStyle = PAL.white; x.lineWidth = 3; x.lineCap = 'round';
      for (let X = FR.x0 + 70; X < FR.x1 - 60; X += 46) { const o = (t12 * 300 + X * 3) % 120; x.beginPath(); x.moveTo(X, FR.y1 + o * .4); x.lineTo(X + 4, FR.y1 + Math.min(drop * .8, o + 120)); x.stroke(); }
      x.strokeStyle = S; x.lineWidth = 2.6; x.beginPath(); x.moveTo(FR.x0 + 40, FR.y1);
      for (let X = FR.x0 + 40; X <= FR.x1 - 40; X += 24) x.lineTo(X, FR.y1 + drop * (.75 + .25 * vnoise(X * .02 + t12 * 2))); x.lineTo(FR.x1 - 40, FR.y1); x.stroke();
      // spray along the lip
      const R2 = mulberry(Math.floor(t12 * 12)); x.fillStyle = PAL.white;
      for (let i = 0; i < 40; i++) { const X = FR.x0 + 40 + R2() * (FR.x1 - FR.x0 - 80), y = FR.y1 + drop * (.7 + R2() * .4), r = 3 + R2() * 9; x.beginPath(); x.arc(X, y, r, 0, TAU); x.fill(); x.stroke(); }
      x.restore();
    });
  },
};

// ————————————————— He is the mountain —————————————————
const MT4 = [540, 1700, 1760, 1400];
const V_MTN = {
  id: 'mtn',
  layers: {
    sky: { g: 1, grain: .16, draw(x) {
      bokashi(x, 0, FR.y0, W, 620, PAL.prus, .9, 0, { rough: 26, seed: 51 });
      mountain(x, MT4[0], MT4[1], MT4[2], MT4[3], { grad: [[0, PAL.prus], [.45, PAL.prusL], [1, PAL.ai]], shade: rgba(PAL.prusD, .55), snow: PAL.white, frac: .24, seed: 13 });
    } },
    greens: { g: 2, grain: .05, draw(x) {
      rect(x, PAL.greenD, 0, 1690, W, 1716); rect(x, PAL.ochreL, 0, 1716, W, H);
      [[120, 1760, 70], [300, 1800, 46], [880, 1790, 60]].forEach(([cx, cy, r]) => fillPath(x, [[cx - r, cy + r * .4], [cx - r * .5, cy - r * .5], [cx + r * .4, cy - r * .55], [cx + r, cy + r * .4]], PAL.grey));
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, 520, W, 900, PAL.beniP, 0, .55, { rough: 18, seed: 53 });
      kasumi(x, 460, 1260, 900, 46, PAL.white, .9); kasumi(x, 700, 1460, 760, 36, PAL.white, .85);
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, MT4[0], MT4[1], MT4[2], MT4[3], { lines: true, lw: 3.2, snowLine: S, frac: .24, seed: 13 });
      x.fillStyle = S; carve(x, [[0, 1690], [W, 1690]], 3, { taper: [0, 0] }); carve(x, [[0, 1716], [W, 1716]], 2, { taper: [0, 0] });
      [[120, 1760, 70], [300, 1800, 46], [880, 1790, 60]].forEach(([cx, cy, r], i) => carve(x, [[cx - r, cy + r * .4], [cx - r * .5, cy - r * .5], [cx + r * .4, cy - r * .55], [cx + r, cy + r * .4]], 2.2, { taper: [.05, .05], seed: i }));
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t), firstTap = T.taps[0];
    const mood = t < firstTap ? 'calm' : t < firstTap + 1.6 ? 'shock' : 'calm';
    R.D(0, x => face(x, 540, 930, 230, t > T.taps[2] + 1.2 ? 'calm' : mood, { col: S }));
    // the tiny stonecutter at the foot, tapping only in the silence
    let sw = .15;
    for (const h of T.taps) {
      if (tq >= h - .5 && tq < h - .25) sw = lerp(.15, 0, seg(tq, h - .5, h - .25));
      else if (tq >= h - .25 && tq < h) sw = ei(seg(tq, h - .25, h));
      else if (tq >= h && tq < h + .2) sw = 1;
      else if (tq >= h + .2 && tq < h + .4) sw = lerp(1, .15, seg(tq, h + .2, h + .4));
    }
    R.D(3, x => cutter(x, 690, 1712, 64, { swing: sw, mood: 'plain', chisel: [36, -24] }));
    for (const h of T.taps) if (tq >= h && tq < h + .25) R.D(0, x => { x.strokeStyle = PAL.white; x.lineWidth = 1.6; for (let i = 0; i < 5; i++) { const a = -2.4 + i * .35; x.beginPath(); x.moveTo(713 + Math.cos(a) * 4, 1697 + Math.sin(a) * 4); x.lineTo(713 + Math.cos(a) * 14, 1697 + Math.sin(a) * 14); x.stroke(); } });
  },
};

export const VIEWS = [quarry('q0', 'dawn'), V_LORD, V_SUN, V_CLOUD, V_MTN, quarry('q5', 'dusk')];
