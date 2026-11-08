// The Two Monks and the River — four prints (1080×1920). g: 0 key · 1 blues · 2 greens/greys · 3 reds/figures
import { clamp, lerp, seg, ss, mulberry, TAU } from '/core/lib.js';
import { W, H, FR, PAL, mk, smooth, poly, carve, wob, fillPath, bokashi, kasumi, rgba } from './print.js';
import { mountain, pine, rain } from './nature.js';
import { traveler } from './traveler.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8, q12 = t => Math.floor(t * 12) / 12;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
const VO = CFG.VO;
const RIVER = '#5f86a6', RIVER_D = '#3f6386';

// —— the cast ——
const OLD = { robe: '#4b4a4e', robeD: '#333238', kesa: '#9b6b3c', sash: '#2e2d31', noBundle: true, noPattern: true, long: .8, beard: true };
const YOUNG = { robe: '#5a5d66', robeD: '#40434b', kesa: PAL.ochre, sash: '#33353b', noBundle: true, noPattern: true, long: .8, noStaff: true };
const WOMAN = { robe: PAL.beni, robeD: '#8e2f22', sash: '#2c4a70', noBundle: true, noPattern: true, long: 1, noStaff: true, hatOff: true, woman: true };
const oldMonk = (x, px, py, s, o = {}) => traveler(x, px, py, s, { ...OLD, ...o });
const youngMonk = (x, px, py, s, o = {}) => traveler(x, px, py, s, { ...YOUNG, ...o });
const woman = (x, px, py, s, o = {}) => traveler(x, px, py, s, { ...WOMAN, ...o });
// the woman riding on a monk's back (monk faces left → she sits behind him, to the right)
function rider(x, px, py, s, dir = 1) { traveler(x, px + dir * .1 * s, py - .32 * s, s * .78, { ...WOMAN, mode: 'sit', noCup: true, flip: dir < 0 }); }
function carrying(x, px, py, s, o = {}) { rider(x, px, py, s); oldMonk(x, px, py, s, { holdHat: false, ...o }); }
// what the young monk still carries: only her colour block, no key line (an impression without its key block)
let GC = null;
function ghost(x, px, py, s, a, wipe = 0) {
  if (a <= 0) return;
  GC = GC || mk(); const g = GC.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
  rider(g, px, py, s);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = PAL.beniL; g.fillRect(0, 0, W, H);
  if (wipe > 0) { g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; const top = py - s * 1.15, h = s * .95; g.fillRect(0, 0, W, top + h * wipe); }
  g.globalCompositeOperation = 'source-over';
  x.save(); x.globalAlpha = a; x.drawImage(GC, 0, 0); x.restore();
}
// flowing foam (paper white) inside a clip path; the river runs toward us (down the sheet), 12 fps
function foam(x, t, clipPts, y0, y1, o = {}) {
  const R = mulberry(o.seed || 5), off = (q12(t) * (o.speed || 70)) % 46;
  x.save(); x.beginPath(); poly(x, clipPts); x.clip();
  x.lineCap = 'round';
  for (let y = y0 - 46; y < y1; y += 46) for (let k = 0; k < 7; k++) {
    const cx = R() * W, w = 50 + R() * 120, yy = y + off + R() * 20;
    x.strokeStyle = PAL.white; x.lineWidth = 3 + R() * 4; x.beginPath(); x.moveTo(cx - w / 2, yy); x.quadraticCurveTo(cx, yy + 12, cx + w / 2, yy - 4); x.stroke();
    if (R() < .4) { x.strokeStyle = S; x.lineWidth = 1.4; x.beginPath(); x.moveTo(cx - w / 3, yy + 9); x.quadraticCurveTo(cx, yy + 18, cx + w / 3, yy + 6); x.stroke(); }
  }
  x.restore();
}

// —— Sheet 0: the river in flood, the woman on the bank, two monks arrive ——
const RL = [[200, 700], [235, 900], [265, 1100], [290, 1300], [300, 1600], [305, 1900]];
const RR = [[330, 700], [430, 900], [560, 1100], [690, 1300], [770, 1600], [820, 1900]];
const RPOLY = RL.concat(RR.slice().reverse());
const BANK0 = 1330;
const V_RIVER = {
  id: 'river',
  layers: {
    sky: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 760, PAL.greyD, .85, .1, { rough: 24, seed: 41 });
      mountain(x, 300, 760, 900, 210, { body: PAL.prusL, frac: 0, seed: 42 });
      mountain(x, 860, 760, 520, 200, { body: PAL.skyL, frac: 0, seed: 43 });
      fillPath(x, RPOLY, RIVER);
      fillPath(x, [[200, 700], [330, 700], [300, 760], [215, 760]], RIVER_D);
    } },
    greens: { g: 2, grain: .06, draw(x) {
      // left bank (far side) and right bank (near side), wet earth below
      fillPath(x, [[FR.x0, 720], [200, 700], [235, 900], [265, 1100], [290, 1300], [300, 1600], [305, 1900], [FR.x0, 1900]], PAL.greenD);
      fillPath(x, [[330, 700], [W, 740], [W, 1900], [820, 1900], [770, 1600], [690, 1300], [560, 1100], [430, 900]], PAL.green);
      rect(x, '#9c8a5c', 690, BANK0, W, BANK0 + 40);
      fillPath(x, [[700, BANK0 + 40], [W, BANK0 + 40], [W, 1900], [820, 1900], [770, 1600]], '#7b6b45');
      // rocks at the water's edge
      [[640, 1250, 60], [760, 1560, 80], [250, 1450, 70]].forEach(([cx, cy, r]) => fillPath(x, [[cx - r, cy + 20], [cx - r * .6, cy - r * .5], [cx + r * .4, cy - r * .6], [cx + r, cy + 20]], PAL.grey));
    } },
    reds: { g: 3, draw(x) { bokashi(x, 0, 520, W, 760, PAL.beniP, 0, .5, { rough: 16, seed: 44 }); } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 300, 760, 900, 210, { lines: true, lw: 2, snowLine: S, frac: 0, seed: 42 });
      x.fillStyle = S;
      carve(x, wob(RL, 2, 5), 2.6, { taper: [.3, 0] }); carve(x, wob(RR, 2, 6), 2.6, { taper: [.3, 0] });
      carve(x, [[690, BANK0], [W, BANK0]], 2.4, { taper: [0, 0] });
      [[640, 1250, 60], [760, 1560, 80], [250, 1450, 70]].forEach(([cx, cy, r], i) => carve(x, [[cx - r, cy + 20], [cx - r * .6, cy - r * .5], [cx + r * .4, cy - r * .6], [cx + r, cy + 20]], 2.2, { taper: [0, 0], seed: i + 8 }));
      pine(x, 110, 1180, .9, { seed: 3, lean: .25, foliage: PAL.pine });
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    R.D(1, x => foam(x, t, RPOLY, 700, 1900, { seed: 7, speed: 90 }));
    // the woman looks at the water; the monks walk in from the right and stop
    const u = ss(seg(tq, 0, 3.0)), walking = tq < 3.0;
    R.D(3, x => {
      woman(x, 770, BANK0, 255, { t: tq, flip: tq > VO.L03 + 1.2 });
      youngMonk(x, lerp(1180, 995, u), BANK0 - 6, 270, walking ? { mode: 'walk', ph: tq * 1.1 + .5 } : { t: tq });
      oldMonk(x, lerp(1090, 900, u), BANK0, 280, walking ? { mode: 'walk', ph: tq * 1.1 } : { t: tq, tilt: tq > VO.L03 ? -.12 : 0 });
    });
    R.D(0, x => rain(x, t, [FR.x0, FR.y0, FR.x1, FR.y1], { sets: [[-1.38, 120, 1.6, PAL.sumi, .4], [-1.3, 70, 1.1, PAL.greyD, .35]] }));
  },
};

// —— Sheet 1: the crossing ——
const XL = 230, XR = 800, BANK1 = 1250, SURF = 1256;
const depth = px => ss(seg(px, XL - 10, XL + 70)) * ss(seg(-px, -XR - 10, -XR + 70)) * 82;
const V_CROSS = {
  id: 'cross',
  layers: {
    sky: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 820, PAL.greyD, .8, .1, { rough: 26, seed: 51 });
      mountain(x, 820, 840, 760, 280, { body: PAL.skyL, frac: 0, seed: 54 });
      mountain(x, 330, 840, 820, 220, { body: PAL.prusL, frac: 0, seed: 52 });
      rect(x, RIVER, XL, 820, XR, H);
      fillPath(x, [[XL, 820], [XR, 820], [XR - 40, 900], [XL + 30, 900]], RIVER_D);
    } },
    greens: { g: 2, grain: .06, draw(x) {
      rect(x, PAL.greenD, FR.x0, 840, XL, BANK1); rect(x, PAL.green, XR, 840, W, BANK1);
      rect(x, '#9c8a5c', FR.x0, BANK1, XL, H); rect(x, '#9c8a5c', XR, BANK1, W, H);
      for (let k = 0; k < 5; k++) { rect(x, '#7b6b45', FR.x0, 1330 + k * 110, XL, 1350 + k * 110); rect(x, '#7b6b45', XR, 1330 + k * 110, W, 1350 + k * 110); }
    } },
    reds: { g: 3, draw(x) { bokashi(x, 0, 560, W, 840, PAL.beniP, 0, .55, { rough: 16, seed: 53 }); } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 820, 840, 760, 280, { lines: true, lw: 2, snowLine: S, frac: 0, seed: 54 });
      mountain(x, 330, 840, 820, 220, { lines: true, lw: 2, snowLine: S, frac: 0, seed: 52 });
      x.fillStyle = S;
      carve(x, wob([[XL, 820], [XL, H]], 2, 3), 2.6, { taper: [0, 0] }); carve(x, wob([[XR, 820], [XR, H]], 2, 4), 2.6, { taper: [0, 0] });
      carve(x, [[FR.x0, BANK1], [XL, BANK1]], 2.4, { taper: [0, 0] }); carve(x, [[XR, BANK1], [W, BANK1]], 2.4, { taper: [0, 0] });
      pine(x, 990, 1000, .7, { seed: 5, lean: -.2, foliage: PAL.pine });
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    const river = [[XL, 820], [XR, 820], [XR, H], [XL, H]];
    R.D(1, x => foam(x, t, river, 820, 1900, { seed: 9, speed: 110 }));
    const LIFT = 11.9, W0 = 12.4, W1 = 15.4, DOWN = 15.9, BOW = [16.5, 17.4], GO = 17.8;
    const u = ss(seg(tq, W0, W1)), mx = lerp(930, 275, u), my = BANK1 + depth(mx);
    const wading = tq >= W0 && tq < W1;
    R.D(3, x => {
      youngMonk(x, 1005, BANK1 - 4, 285, { t: tq });
      if (tq < LIFT) { woman(x, 850, BANK1, 255, { flip: true, t: tq, lean: tq > 11.2 ? .14 : 0 }); oldMonk(x, 930, BANK1, 300, { t: tq }); }
      else if (tq < DOWN) carrying(x, mx, my, 300, wading ? { mode: 'walk', ph: tq * .9 } : { t: tq });
      else {
        const bow = ss(seg(tq, BOW[0], BOW[0] + .3)) * (1 - ss(seg(tq, BOW[1] - .2, BOW[1])));
        if (tq < GO) woman(x, 130, BANK1, 255, { flip: true, t: tq, lean: -bow * .42 });
        else { const g = seg(tq, GO, GO + 1.6); if (g < 1) woman(x, lerp(130, -80, g), BANK1, 255, { mode: 'walk', ph: tq * 1.2, t: tq }); }
        oldMonk(x, 275, BANK1 + depth(275), 300, { t: tq });
      }
    });
    // the water in front of his legs, with a ring of foam where he wades
    R.D(1, x => {
      x.save(); x.beginPath(); x.rect(XL, SURF, XR - XL, H - SURF); x.clip();
      rect(x, RIVER, XL, SURF, XR, H); x.restore();
      foam(x, t, [[XL, SURF], [XR, SURF], [XR, H], [XL, H]], SURF, 1900, { seed: 11, speed: 110 });
      const cx = tq < LIFT ? -999 : tq < DOWN ? mx : 275;
      if (depth(cx) > 8) { const k = Math.floor(t * 12) % 2; x.strokeStyle = PAL.white; x.lineWidth = 5; x.lineCap = 'round';
        x.beginPath(); x.ellipse(cx + 4, SURF + 4, 58 + k * 6, 10, 0, Math.PI * .05, Math.PI * .95, true); x.stroke();
        x.strokeStyle = S; x.lineWidth = 1.6; x.beginPath(); x.ellipse(cx + 4, SURF + 9, 64 + k * 6, 11, 0, Math.PI * .1, Math.PI * .9, true); x.stroke(); }
    });
  },
};

// —— Sheets 2 + 3: the same mountain road, by day and at nightfall (alternate impressions of one key block) ——
const ROAD = 1250;
const PALS = {
  day: { sky: PAL.sky, sky2: PAL.beniP, mtn: PAL.prusL, hill: PAL.green, hillD: PAL.greenD, road: PAL.ochreL, orb: PAL.beni, orbR: 70 },
  night: { sky: PAL.prusD, sky2: PAL.ai, mtn: PAL.prus, hill: '#4d5a3a', hillD: '#2f3a2c', road: '#9c8a5c', orb: PAL.white, orbR: 64 },
};
function roadDraw(m) {
  const P = PALS[m];
  return {
    sky: { g: 1, grain: .12, draw(x) {
      if (m === 'night') rect(x, PAL.ai, FR.x0, FR.y0, FR.x1, 900);
      bokashi(x, 0, FR.y0, W, 760, P.sky, .95, m === 'night' ? .6 : 0, { rough: 24, seed: m === 'day' ? 61 : 62 });
      mountain(x, 780, 900, 900, 300, { body: P.mtn, snow: PAL.white, frac: .12, seed: 63 });
      mountain(x, 420, 910, 760, 230, { body: P.mtn, frac: 0, seed: 66 });
      mountain(x, 200, 920, 560, 240, { body: m === 'day' ? PAL.skyL : PAL.prusL, frac: 0, seed: 64 });
    } },
    greens: { g: 2, grain: .06, draw(x) {
      x.fillStyle = P.hillD; x.beginPath(); x.moveTo(0, 960); for (let X = 0; X <= W; X += 20) x.lineTo(X, 930 + Math.sin(X * .007 + 2) * 36); x.lineTo(W, ROAD); x.lineTo(0, ROAD); x.fill();
      rect(x, P.hill, 0, 1080, W, ROAD);
      rect(x, P.road, 0, ROAD - 26, W, ROAD + 34);
      rect(x, P.hillD, 0, ROAD + 34, W, H);
      for (let k = 0; k < 6; k++) rect(x, P.hill, 0, 1340 + k * 92, W, 1362 + k * 92);
      // a small temple gate at the left end of the road
      rect(x, PAL.woodD, 70, 1010, 92, ROAD - 26); rect(x, PAL.woodD, 236, 1010, 258, ROAD - 26);
      fillPath(x, [[40, 1012], [164, 960], [288, 1012], [270, 1026], [58, 1026]], m === 'day' ? '#6f6656' : '#3a3630');
    } },
    reds: { g: 3, draw(x) {
      bokashi(x, 0, 560, W, 930, P.sky2, 0, m === 'day' ? .7 : .8, { rough: 16, seed: 65 });
      x.fillStyle = P.orb; x.beginPath(); x.arc(m === 'day' ? 820 : 300, m === 'day' ? 330 : 620, P.orbR, 0, TAU); x.fill();
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 780, 900, 900, 300, { lines: true, lw: 2, snowLine: S, frac: .12, seed: 63 });
      mountain(x, 420, 910, 760, 230, { lines: true, lw: 2, snowLine: S, frac: 0, seed: 66 });
      x.fillStyle = S; carve(x, wob(Array.from({ length: 28 }, (_, k) => [k * 40, 930 + Math.sin(k * 40 * .007 + 2) * 36]), 1, 3), 2.2, { taper: [0, 0] });
      carve(x, [[0, ROAD - 26], [W, ROAD - 26]], 2.2, { taper: [0, 0] }); carve(x, wob([[0, ROAD + 34], [W, ROAD + 34]], 1.5, 7), 2.4, { taper: [0, 0] });
      x.strokeStyle = S; x.lineWidth = 2.4; x.strokeRect(70, 1010, 22, ROAD - 26 - 1010); x.strokeRect(236, 1010, 22, ROAD - 26 - 1010);
      carve(x, [[40, 1012], [164, 960], [288, 1012]], 3, { taper: [.05, .05] }); x.beginPath(); x.moveTo(58, 1026); x.lineTo(270, 1026); x.stroke();
      x.lineWidth = 1.6; x.beginPath(); x.arc(m === 'day' ? 820 : 300, m === 'day' ? 330 : 620, PALS[m].orbR, 0, TAU); x.stroke();
      pine(x, 960, 1240, .85, { seed: 9, lean: -.25, foliage: PAL.pine });
    } },
  };
}
const V_DAY = {
  id: 'day', layers: roadDraw('day'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    const ox = 1010 - (tq - 19.6) * 88, yx = ox + 280;
    const heavy = ss(seg(tq, 20.0, 27.0));
    R.D(3, x => {
      youngMonk(x, yx, ROAD, 290, { mode: 'walk', ph: tq * 1.0 + .5, t: tq, stoop: lerp(.02, .14, heavy) });
      ghost(x, yx, ROAD, 290, lerp(.25, .7, heavy));
      oldMonk(x, ox, ROAD, 300, { mode: 'walk', ph: tq * 1.0, t: tq });
    });
  },
};
const V_NIGHT = {
  id: 'night', layers: roadDraw('night'),
  paint(x, t, R) {
    R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
    const tq = q8(t);
    const burst = tq > 29.3 && tq < 31.7;
    const wipe = seg(tq, 36.9, 38.1);
    R.D(3, x => {
      youngMonk(x, 700, ROAD, 290, { t: tq, stoop: burst ? -.0 : .1, lean: burst ? -.16 : 0, shout: burst, tilt: burst ? .1 : 0 });
      ghost(x, 700, ROAD, 290, .72, Math.floor(wipe * 8) / 8);
      oldMonk(x, 380, ROAD, 300, { t: tq, flip: true, smile: tq > VO.L09 + .3 });
    });
    if (burst) R.D(0, x => { x.strokeStyle = PAL.beni; x.lineWidth = 6; x.lineCap = 'round'; const k = Math.floor(tq * 8) % 2;
      for (let i = 0; i < 4; i++) { const a = -2.6 + i * .42 + k * .06; x.beginPath(); x.moveTo(612 + Math.cos(a) * (54 + k * 6), 990 + Math.sin(a) * (54 + k * 6)); x.lineTo(612 + Math.cos(a) * (92 + k * 6), 990 + Math.sin(a) * (92 + k * 6)); x.stroke(); } });
  },
};

export const VIEWS = [V_RIVER, V_CROSS, V_DAY, V_NIGHT];
