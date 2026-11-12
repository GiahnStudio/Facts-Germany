// Empty Your Cup — four prints (1080×1920). g: 0 key · 1 blues · 2 greens · 3 reds/figures
import { clamp, lerp, seg, ss, mulberry, hash, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, bokashi } from './print.js';
import { mountain, pine } from './nature.js';
import { traveler } from './traveler.js';
import { CFG } from './story.js';

const S = PAL.sumi, q8 = t => Math.floor(t * 8) / 8, q12 = t => Math.floor(t * 12) / 12;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
function shp(x, pts, fill, lw, sm = true, closed = true) { x.beginPath(); sm ? smooth(x, pts, closed) : poly(x, pts); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { x.lineWidth = lw; x.strokeStyle = S; x.lineJoin = 'round'; x.stroke(); } }
const TEA = '#a9b25a', TEAD = '#7d8a3c', INDIGO = '#3b5378', INDIGO_D = '#2a3d5c', GREY_ROBE = '#8f8a78', IRON = '#3d3a37';

// ————————————————— Sheet 0: the mountain hermitage —————————————————
const GROUND = 1300, HORIZ = 1040;
const hermitage = {
  sky: { g: 1, grain: .12, draw(x) {
    bokashi(x, 0, FR.y0, W, 780, PAL.sky, .95, 0, { rough: 24, seed: 91 });
    mountain(x, 700, HORIZ + 20, 900, 520, { body: PAL.prusL, snow: PAL.white, frac: .3, seed: 92 });
  } },
  reds: { g: 3, draw(x) { bokashi(x, 0, 700, W, HORIZ, PAL.beniP, 0, .8, { rough: 16, seed: 95 }); } },
  greens: { g: 2, grain: .06, draw(x) {
    x.fillStyle = PAL.greenD; x.beginPath(); x.moveTo(0, HORIZ + 40); for (let X = 0; X <= W; X += 20) x.lineTo(X, HORIZ - 20 + Math.sin(X * .005 + 2) * 46); x.lineTo(W, 1220); x.lineTo(0, 1220); x.fill();
    rect(x, PAL.green, 0, 1120, W, GROUND - 50);
    x.fillStyle = '#dccb9c'; x.beginPath(); x.moveTo(0, GROUND - 60); x.lineTo(W, GROUND - 30); x.lineTo(W, GROUND + 56); x.lineTo(0, GROUND + 44); x.fill();
    rect(x, PAL.greenL, 0, GROUND + 44, W, H);
    x.fillStyle = PAL.greenD; for (let k = 0; k < 9; k++) { const y = GROUND + 120 + k * 70; x.beginPath(); x.moveTo(0, y + 16); x.lineTo(W, y - 6); x.lineTo(W, y + 10); x.lineTo(0, y + 34); x.fill(); }
  } },
  key: { g: 0, speck: .12, draw(x) {
    mountain(x, 700, HORIZ + 20, 900, 520, { lines: true, lw: 2, snowLine: S, frac: .3, seed: 92 });
    x.fillStyle = S; carve(x, wob(Array.from({ length: 28 }, (_, k) => [k * 40, HORIZ - 20 + Math.sin(k * 40 * .005 + 2) * 46]), 1, 3), 2.2, { taper: [0, 0] });
    carve(x, [[0, GROUND - 60], [W, GROUND - 30]], 2.4, { taper: [0, 0] }); carve(x, [[0, GROUND + 44], [W, GROUND + 56]], 2.4, { taper: [0, 0] });
    pine(x, 930, GROUND - 36, 1.3, { lean: -.3, seed: 5 });
    // the hut: plaster walls, dark doorway, thatched roof
    const bx = 80, by = GROUND - 30, bw = 380;
    shp(x, [[bx + 20, by], [bx + 20, by - 190], [bx + bw - 20, by - 190], [bx + bw - 20, by]], PAL.plaster, 2.8, false);
    shp(x, [[bx + 200, by], [bx + 200, by - 150], [bx + 300, by - 150], [bx + 300, by]], '#3a2a1c', 2.4, false);       // open door
    for (const px of [bx + 20, bx + 180, bx + bw - 20]) { x.fillStyle = PAL.woodD; x.fillRect(px - 7, by - 190, 14, 190); }
    shp(x, [[bx - 40, by - 180], [bx + 60, by - 330], [bx + bw - 60, by - 330], [bx + bw + 40, by - 180]], PAL.straw, 3, false);
    x.strokeStyle = S; x.lineWidth = 1.6; for (let k = 0; k < 16; k++) { const u = k / 15, x0 = lerp(bx + 60, bx + bw - 60, u), x1 = lerp(bx - 30, bx + bw + 30, u); x.beginPath(); x.moveTo(x0, by - 326); x.lineTo(x1, by - 184); x.stroke(); }
    shp(x, [[bx + 40, by - 330], [bx + 60, by - 350], [bx + bw - 60, by - 350], [bx + bw - 40, by - 330]], PAL.woodD, 2.4, false);
    shp(x, [[bx + 170, by], [bx + 170, by - 16], [bx + 330, by - 16], [bx + 330, by]], PAL.greyL, 2.2, false);          // doorstep stone
  } },
};
// the scholar: indigo robe, a wobbling tower of books on his back
const SCH = { robe: INDIGO, robeD: INDIGO_D, sash: PAL.beni, noPattern: true };
function books(x, px, py, s, wobble) {
  const u = s / 100, cols = [PAL.beni, PAL.ochre, PAL.white, PAL.prusL, PAL.ochreL, PAL.beniL];
  x.save(); x.translate(px + 11 * u, py - 77 * u); x.lineWidth = 2.2; x.strokeStyle = S;
  for (let k = 0; k < 6; k++) { const w = (17 - (k % 3) * 2) * u, h = 5.4 * u, dx = Math.sin(wobble + k * .9) * k * .5 * u; x.fillStyle = cols[k]; x.fillRect(dx - w / 2, -(k + 1) * h, w, h); x.strokeRect(dx - w / 2, -(k + 1) * h, w, h); }
  x.restore();
}
const V_HUT = { id: 'hut', layers: hermitage, paint(x, t, R) {
  R.L('sky'); R.L('reds'); R.L('greens'); R.L('key');
  const tq = q8(t), u = seg(t, CFG.WALK[0], CFG.WALK[1]), px = lerp(990, 440, u), walking = u < 1;
  R.D(3, x => { books(x, px, GROUND + 14, 250, walking ? tq * 6 : 0); traveler(x, px, GROUND + 14, 250, { ...SCH, mode: walking ? 'walk' : 'stand', ph: tq * 1.3, t: tq }); });
} };

// ————————————————— Sheets 1 and 3: the tea room —————————————————
const FLOOR = 1190, TABLE_Y = 1150, SIT = 1272;
const ROOM = {
  day: { wall: '#ddd0ab', win: PAL.sky, glow: PAL.beniP, mat: PAL.greenL, matD: PAL.green, mt: PAL.prusL, seed: 71 },
  dusk: { wall: '#e0c486', win: PAL.ochreL, glow: PAL.beni, mat: '#c3bd7c', matD: '#9aa25c', mt: PAL.ai, seed: 72 },
};
const WIN = [540, 620, 215];
function roomLayers(m) {
  const P = ROOM[m];
  const winClip = x => { x.beginPath(); x.arc(WIN[0], WIN[1], WIN[2], 0, TAU); x.clip(); };
  return {
    wall: { g: 1, grain: .1, draw(x) {
      rect(x, P.wall, FR.x0, FR.y0, FR.x1, FLOOR);
      x.save(); winClip(x); rect(x, PAL.paper, 0, 0, W, H); bokashi(x, 0, WIN[1] - WIN[2], W, WIN[1] + 80, P.win, .95, .1, { rough: 14, seed: P.seed });
      mountain(x, 600, WIN[1] + 190, 420, 250, { body: P.mt, snow: PAL.white, frac: .3, seed: 77 }); x.restore();
    } },
    reds: { g: 3, draw(x) {
      x.save(); winClip(x); bokashi(x, 0, WIN[1] - 40, W, WIN[1] + 220, P.glow, 0, m === 'dusk' ? .75 : .6, { rough: 12, seed: P.seed + 3 });
      if (m === 'dusk') { x.fillStyle = PAL.beni; x.beginPath(); x.arc(430, WIN[1] + 40, 54, 0, TAU); x.fill(); }
      x.restore();
    } },
    mats: { g: 2, grain: .08, draw(x) {
      rect(x, P.mat, FR.x0, FLOOR, FR.x1, FR.y1);
      x.fillStyle = P.matD; for (let k = 0; k < 10; k++) { const y = FLOOR + 60 + k * 72; x.beginPath(); x.moveTo(0, y + 14); x.lineTo(W, y - 8); x.lineTo(W, y + 2); x.lineTo(0, y + 24); x.fill(); }
      x.save(); winClip(x); x.fillStyle = PAL.pine; x.beginPath(); x.moveTo(300, WIN[1] + 230); for (let X = 300; X <= 800; X += 20) x.lineTo(X, WIN[1] + 150 + Math.sin(X * .02) * 16); x.lineTo(800, WIN[1] + 230); x.fill(); x.restore();
    } },
    key: { g: 0, speck: .12, draw(x) {
      // round window: thick wooden ring, three bamboo bars
      x.save(); x.strokeStyle = PAL.woodD; x.lineWidth = 26; x.beginPath(); x.arc(WIN[0], WIN[1], WIN[2] + 8, 0, TAU); x.stroke();
      x.strokeStyle = S; x.lineWidth = 2.6; for (const r of [WIN[2] - 5, WIN[2] + 21]) { x.beginPath(); x.arc(WIN[0], WIN[1], r, 0, TAU); x.stroke(); }
      x.save(); winClip(x); mountain(x, 600, WIN[1] + 190, 420, 250, { lines: true, lw: 1.8, snowLine: S, frac: .3, seed: 77 });
      x.fillStyle = PAL.woodD; for (const X of [WIN[0] - 105, WIN[0] + 105]) x.fillRect(X - 6, 0, 12, H); x.restore(); x.restore();
      // beam, post, floor line
      rect(x, PAL.woodD, FR.x0, 250, FR.x1, 292); x.fillStyle = S; carve(x, [[FR.x0, 250], [FR.x1, 250]], 2.4, { taper: [0, 0] }); carve(x, [[FR.x0, 292], [FR.x1, 292]], 2.4, { taper: [0, 0] });
      carve(x, [[FR.x0, FLOOR], [FR.x1, FLOOR]], 2.8, { taper: [0, 0] });
      // low table
      shp(x, [[330, TABLE_Y], [750, TABLE_Y], [750, TABLE_Y + 26], [330, TABLE_Y + 26]], '#7e2c22', 2.6, false);
      for (const X of [356, 724]) shp(x, [[X - 12, TABLE_Y + 26], [X + 12, TABLE_Y + 26], [X + 9, SIT - 6], [X - 9, SIT - 6]], '#5d2019', 2.2, false);
    } },
  };
}
// —— a kneeling figure (seiza), facing right; units: 100 = about one seated height ——
function kneel(x, px, py, s, o = {}) {
  const u = s / 100, lw = 2.6 / u, robe = o.robe || GREY_ROBE;
  x.save(); x.translate(px, py); x.scale(u * (o.flip ? -1 : 1), u); x.lineJoin = 'round'; x.lineCap = 'round';
  shp(x, [[-27, 0], [32, 0], [34, -9], [25, -23], [-12, -28], [-28, -15]], robe, lw);                              // folded legs
  x.strokeStyle = S; x.lineWidth = lw * .6; x.beginPath(); x.moveTo(-8, -6); x.quadraticCurveTo(10, -10, 28, -6); x.stroke();
  x.save(); x.translate(-2, -24); x.rotate(o.bow || 0); x.translate(2, 24);
  shp(x, [[-18, -21], [-20, -48], [-12, -65], [3, -68], [13, -58], [16, -40], [14, -21]], robe, lw);               // torso
  shp(x, [[0, -67], [9, -50], [5, -48], [-4, -64]], PAL.white, lw * .5, false);                                    // collar
  shp(x, [[-18.5, -31], [15, -31], [15, -24], [-18.5, -24]], o.sash || PAL.ochre, lw * .7, false);                 // sash
  // arm: shoulder → elbow → hand
  const sh = [3, -56], hd = o.hand || [22, -27], el = o.elbow || [(sh[0] + hd[0]) / 2 - 3, (sh[1] + hd[1]) / 2 + 7];
  for (const [w, c] of [[11 + lw * 2, S], [11, robe]]) { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); x.moveTo(...sh); x.lineTo(...el); x.lineTo(...hd); x.stroke(); }
  x.fillStyle = PAL.skin; x.strokeStyle = S; x.lineWidth = lw * .7; x.beginPath(); x.arc(hd[0] + 2, hd[1] + .5, 4.2, 0, TAU); x.fill(); x.stroke();
  // head (profile, facing right)
  const hx = 3, hy = -80, r = 11;
  shp(x, [[hx - r, hy], [hx - r * .75, hy - r * .8], [hx, hy - r], [hx + r * .8, hy - r * .7], [hx + r, hy - r * .1], [hx + r * 1.25, hy + r * .2], [hx + r * .95, hy + r * .4], [hx + r * .8, hy + r * .95], [hx, hy + r * 1.05], [hx - r * .7, hy + r * .7]], PAL.skin, lw * .8);
  x.lineWidth = lw * .6; x.strokeStyle = S;
  if (o.old) {   // bald, white brow, small white beard
    x.fillStyle = PAL.white; shp(x, [[hx + r * .5, hy + r * .9], [hx + r * .95, hy + r * .8], [hx + r * .8, hy + r * 1.8]], PAL.white, lw * .6, false);
    x.strokeStyle = S; x.lineWidth = lw * 1.1; x.beginPath(); x.moveTo(hx + r * .2, hy - r * .34); x.quadraticCurveTo(hx + r * .55, hy - r * .52, hx + r * .9, hy - r * .3); x.stroke(); x.lineWidth = lw * .6;
  } else {       // black scholar's cap with a knot
    shp(x, [[hx - r * 1.02, hy - r * .1], [hx - r * .8, hy - r * 1.05], [hx + r * .1, hy - r * 1.45], [hx + r * .9, hy - r * 1.0], [hx + r * .98, hy - r * .45], [hx - r * .2, hy - r * .38]], S, 0, false);
    shp(x, [[hx - r * .8, hy - r * 1.0], [hx - r * 1.5, hy - r * 1.5], [hx - r * 1.15, hy - r * .7]], S, 0, false);
    x.beginPath(); x.moveTo(hx + r * .25, hy - r * .22); x.lineTo(hx + r * .8, hy - r * (o.mood === 'shock' ? .4 : .2)); x.stroke();
  }
  const ex = hx + r * .55, ey = hy + r * .02;
  if (o.mood === 'smile') { x.beginPath(); x.arc(ex, ey + r * .08, r * .2, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
  else if (o.mood === 'shock') { x.beginPath(); x.arc(ex, ey, r * .14, 0, TAU); x.stroke(); }
  else { x.beginPath(); x.moveTo(ex - r * .2, ey); x.lineTo(ex + r * .2, ey - r * .03); x.stroke(); }
  const mx = hx + r * .72, my = hy + r * .56;
  if (o.mouth) { x.fillStyle = S; x.beginPath(); x.ellipse(mx, my, r * .16, r * (.1 + o.mouth * .16), 0, 0, TAU); x.fill(); }
  else if (o.mood === 'smile') { x.beginPath(); x.moveTo(mx - r * .25, my - r * .05); x.quadraticCurveTo(mx, my + r * .16, mx + r * .22, my - r * .1); x.stroke(); }
  else { x.beginPath(); x.moveTo(mx - r * .2, my); x.lineTo(mx + r * .2, my); x.stroke(); }
  x.restore(); x.restore();
}
// —— the scholar's words: kanji that pour out of him and fill the room ——
const WORDS = '知書学言道読我話知書学言道読我話知書学言道読';
const WPOS = Array.from(WORDS, (_, k) => { const R = mulberry(300 + k * 17), u = k / (WORDS.length - 1); return [lerp(250, 840, Math.pow(u, .8)) + (R() - .5) * 220, lerp(840, 420, R()) - (k < 6 ? 0 : 0) + u * 60, 50 + R() * 34, (R() - .5) * .5]; });
function words(x, t, t0, each, fall) {
  x.save(); x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let k = 0; k < WORDS.length; k++) {
    const a = t0 + k * each; if (t < a) break;
    let [X, Y, sz, rot] = WPOS[k]; X = clamp(X, 110, 940);
    const u = seg(t, a, a + .5), from = [262, 985];
    let px = lerp(from[0], X, u), py = lerp(from[1], Y, u) - Math.sin(u * Math.PI) * 40, s = sz * lerp(.35, 1, u);
    if (fall != null) { const f = Math.max(0, q8(t) - (fall + (WORDS.length - 1 - k) * .07)); if (f > 0) { py += f * f * 1500; rot += f * 2.4 * (k % 2 ? 1 : -1); if (py > FLOOR + 150) continue; } }
    else py += Math.sin(q8(t) * 1.7 + k) * 4;
    x.save(); x.translate(px, py); x.rotate(rot); x.font = `400 ${s.toFixed(0)}px Yuji`; x.fillStyle = k % 5 === 2 ? PAL.beni : S; x.fillText(WORDS[k], 0, 0); x.restore();
  }
  x.restore();
}
function smallCup(x, cx, y, full) {
  shp(x, [[cx - 30, y - 34], [cx + 30, y - 34], [cx + 22, y - 4], [cx + 14, y], [cx - 14, y], [cx - 22, y - 4]], PAL.white, 2.4, false);
  x.fillStyle = PAL.prusL; x.fillRect(cx - 27, y - 24, 54, 5);
  if (full) { x.fillStyle = TEA; x.fillRect(cx - 29, y - 37, 58, 5); }
}
function kettle(x, cx, y, steamT) {
  shp(x, [[cx - 40, y], [cx - 52, y - 30], [cx - 34, y - 60], [cx + 34, y - 60], [cx + 52, y - 30], [cx + 40, y]], IRON, 2.6);
  shp(x, [[cx - 50, y - 36], [cx - 86, y - 56], [cx - 84, y - 64], [cx - 44, y - 48]], IRON, 2.2, false);                 // spout (left)
  x.strokeStyle = S; x.lineWidth = 7; x.beginPath(); x.arc(cx, y - 62, 34, Math.PI, TAU); x.stroke(); x.strokeStyle = PAL.woodL; x.lineWidth = 3; x.stroke();
  x.fillStyle = PAL.ochre; x.beginPath(); x.arc(cx, y - 64, 6, 0, TAU); x.fill();
  if (steamT != null) { x.strokeStyle = PAL.white; x.lineWidth = 6; x.lineCap = 'round'; const q = q12(steamT); for (let k = 0; k < 3; k++) { x.beginPath(); for (let j = 0; j <= 8; j++) { const yy = y - 70 - j * 20, xx = cx - 92 + k * 16 + Math.sin(j * .9 + q * 5 + k * 2) * 10; j ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); } }
}
const MASTER = { flip: true, old: true, robe: GREY_ROBE, sash: IRON }, SCHOLAR = { robe: INDIGO, sash: PAL.beni };
const V_ROOM = { id: 'room', layers: roomLayers('day'), paint(x, t, R) {
  R.L('wall'); R.L('reds'); R.L('mats'); R.L('key');
  const tq = q8(t), talking = t >= CFG.TALK[0] && t < CFG.TALK[1] + .4, brew = t >= CFG.KETTLE;
  R.D(3, x => {
    kettle(x, 668, TABLE_Y, brew ? t : null);
    kneel(x, 868, SIT, 370, { ...MASTER, mood: brew ? 'smile' : 'calm', hand: brew ? [30, -34] : [22, -27] });
    kneel(x, 206, SIT, 370, { ...SCHOLAR, mouth: talking ? .5 + .5 * Math.sin(tq * 14) : 0, hand: talking ? [30 + Math.sin(tq * 5) * 4, -62 + Math.cos(tq * 6) * 6] : [22, -27], elbow: talking ? [20, -40] : undefined });
    smallCup(x, 500, TABLE_Y, false);
  });
  R.D(0, x => words(x, t, CFG.TALK[0], .3, null));
} };
const V_DUSK = { id: 'dusk', layers: roomLayers('dusk'), paint(x, t, R) {
  R.L('wall'); R.L('reds'); R.L('mats'); R.L('key');
  const tq = q8(t), point = t >= CFG.POINT, bow = ss(seg(q8(t), CFG.BOW, CFG.BOW + .9));
  R.D(3, x => {
    kettle(x, 668, TABLE_Y, null);
    kneel(x, 868, SIT, 370, { ...MASTER, mood: 'smile', hand: point && !bow ? [44, -40] : [22, -27], elbow: point && !bow ? [22, -44] : undefined });
    kneel(x, 206, SIT, 370, { ...SCHOLAR, mood: bow ? 'calm' : 'shock', bow: bow * 1.05, hand: bow ? [lerp(22, 30, bow), lerp(-27, -40, bow)] : [22, -27] });
    smallCup(x, 500, TABLE_Y, !bow);
  });
  R.D(0, x => words(x, t, 0, 0, CFG.FALL));
} };

// ————————————————— Sheet 2: the cup, close —————————————————
const TT = 1090, TF = 1230, RIM = 870, CX = 540;
const cupLayers = {
  wall: { g: 1, grain: .1, draw(x) { rect(x, '#ddd0ab', FR.x0, FR.y0, FR.x1, TT); bokashi(x, 0, FR.y0, W, 560, PAL.skyL, .8, 0, { rough: 20, seed: 81 }); } },
  reds: { g: 3, grain: .1, draw(x) { rect(x, '#8a3226', FR.x0, TT, FR.x1, TF); rect(x, '#5d2019', FR.x0, TF, FR.x1, TF + 90); } },
  mats: { g: 2, grain: .08, draw(x) {
    rect(x, PAL.greenL, FR.x0, TF + 90, FR.x1, FR.y1);
    x.fillStyle = PAL.green; for (let k = 0; k < 9; k++) { const y = TF + 150 + k * 72; x.beginPath(); x.moveTo(0, y + 14); x.lineTo(W, y - 8); x.lineTo(W, y + 2); x.lineTo(0, y + 24); x.fill(); }
  } },
  key: { g: 0, speck: .12, draw(x) {
    x.fillStyle = S; for (const y of [TT, TF, TF + 90]) carve(x, [[FR.x0, y], [FR.x1, y]], 2.8, { taper: [0, 0] });
  } },
};
function bigCup(x, fill) {
  const rx = 172, ry = 40;
  shp(x, [[CX - rx, RIM], [CX - rx + 10, RIM + 120], [CX - 120, TT - 26], [CX - 92, TT - 22], [CX - 92, TT], [CX + 92, TT], [CX + 92, TT - 22], [CX + 120, TT - 26], [CX + rx - 10, RIM + 120], [CX + rx, RIM]], PAL.white, 3.4, false);
  x.fillStyle = PAL.prusL; for (let k = -2; k <= 2; k++) { x.beginPath(); x.arc(CX + k * 62, RIM + 92, 17, 0, TAU); x.fill(); }
  x.fillStyle = PAL.prus; x.fillRect(CX - 156, RIM + 138, 312, 8);
  // the opening
  x.save(); x.beginPath(); x.ellipse(CX, RIM, rx, ry, 0, 0, TAU); x.fillStyle = '#cfc5a6'; x.fill(); x.clip();
  if (fill > 0) { x.fillStyle = TEA; x.beginPath(); x.ellipse(CX, RIM + lerp(46, 0, fill), rx * lerp(.72, 1, fill), ry * lerp(.8, 1, fill), 0, 0, TAU); x.fill(); x.strokeStyle = TEAD; x.lineWidth = 2.4; x.stroke(); }
  x.restore();
  x.strokeStyle = S; x.lineWidth = 3.4; x.beginPath(); x.ellipse(CX, RIM, rx, ry, 0, 0, TAU); x.stroke();
}
function pot(x, tilt, t) {
  // sleeve and hand of the master, cropped by the right border
  shp(x, [[1060, 250], [1060, 520], [900, 450], [820, 380], [850, 330], [930, 290]], GREY_ROBE, 3, false);
  x.save(); x.translate(800, 560); x.rotate(-tilt);
  shp(x, [[-150, 60], [-170, -40], [-110, -120], [110, -120], [170, -40], [150, 60], [0, 86]], IRON, 3.2);
  shp(x, [[-150, -10], [-268, -70], [-262, -96], [-140, -60]], IRON, 2.8, false);                                       // spout
  x.strokeStyle = S; x.lineWidth = 16; x.beginPath(); x.arc(0, -122, 104, Math.PI * 1.02, Math.PI * 1.98); x.stroke(); x.strokeStyle = PAL.woodL; x.lineWidth = 9; x.stroke();
  x.fillStyle = PAL.ochre; x.strokeStyle = S; x.lineWidth = 2.4; x.beginPath(); x.arc(0, -126, 15, 0, TAU); x.fill(); x.stroke();
  x.fillStyle = PAL.greyD; for (let k = -2; k <= 2; k++) for (let j = 0; j < 2; j++) { x.beginPath(); x.arc(k * 52 + j * 26, -60 + j * 46, 7, 0, TAU); x.fill(); }
  shp(x, [[-30, -236], [24, -244], [40, -212], [-16, -204]], PAL.skin, 2.6);                                            // the hand on the handle
  x.restore();
  // spout tip in sheet coordinates
  const c = Math.cos(-tilt), s = Math.sin(-tilt); return [800 + (-266) * c - (-84) * s, 560 + (-266) * s + (-84) * c];
}
function stream(x, a, b, t, w = 16) {
  const q = q12(t); x.save(); x.lineCap = 'round';
  const pts = Array.from({ length: 9 }, (_, k) => { const u = k / 8; return [lerp(a[0], b[0], Math.pow(u, .6)) + Math.sin(u * 9 + q * 9) * 3, lerp(a[1], b[1], u * u * .5 + u * .5)]; });
  for (const [ww, c] of [[w + 5, S], [w, TEA]]) { x.strokeStyle = c; x.lineWidth = ww; x.beginPath(); smooth(x, pts); x.stroke(); }
  x.restore();
}
function puddlePts(o, r, t) {   // tea on the table top: spreads from the cup foot, then runs left and out of the print
  const q = q12(t), xl = lerp(CX - 150, -150, ss(r)) - o * 60, xr = CX + 120 + o * 110, y0 = TT + 16, y1 = TT + 16 + lerp(30, 104, o);
  const top = [], bot = [], n = 14;
  for (let k = 0; k <= n; k++) { const u = k / n, X = lerp(xl, xr, u), e = Math.sin(u * Math.PI) ** .35; top.push([X, lerp((y0 + y1) / 2, y0, e) + Math.sin(k * 1.7 + q * 2) * 3]); bot.push([X, lerp((y0 + y1) / 2, y1, e) + Math.sin(k * 2.3 + q * 2 + 1) * 4]); }
  return top.concat(bot.reverse());
}
const V_CUP = { id: 'cup', layers: cupLayers, paint(x, t, R) {
  R.L('wall'); R.L('reds'); R.L('mats'); R.L('key');
  const fill = seg(t, ...CFG.FILL), over = seg(t, ...CFG.OVER), run = seg(t, ...CFG.RUN), stop = t >= CFG.STOP, pouring = t >= CFG.FILL[0] - .3 && t < CFG.MA[0];
  const tilt = pouring ? lerp(.1, .42, seg(t, CFG.FILL[0] - .3, CFG.FILL[0] + .3)) : .1;
  const P = over > 0 ? puddlePts(over, run, t) : null;
  if (P) R.D(3, x => { shp(x, P, TEA, 3); x.strokeStyle = TEAD; x.lineWidth = 2; for (let k = 0; k < 4; k++) { const X = lerp(P[2][0], CX, k / 4) + 40; x.beginPath(); x.moveTo(X, TT + 44 + (k % 2) * 16); x.lineTo(X + 70, TT + 42 + (k % 2) * 16); x.stroke(); } });
  R.D(3, x => bigCup(x, fill));
  R.D(3, x => {
    if (over > 0) for (const [dx, k] of [[-138, 0], [-52, 2], [104, 1]]) {   // tea sheeting down the cup
      const L = clamp(over * 1.6 - k * .08) * (TT + 20 - RIM), w = [30, 22, 16][k]; x.fillStyle = S; const y0 = RIM + 40 * Math.sqrt(Math.max(0, 1 - (dx / 172) ** 2)) - 6, yb = Math.min(RIM + 8 + L, TT + 24); if (yb <= y0) continue; x.fillRect(CX + dx - w / 2 - 2.5, y0, w + 5, yb - y0 + 2.5); x.fillStyle = TEA; x.fillRect(CX + dx - w / 2, y0 - 2, w, yb - y0 + 2);
    }
  });
  R.D(3, x => { const tip = pot(x, tilt, t); if (pouring && t >= CFG.FILL[0]) stream(x, tip, [CX + 10, RIM + lerp(40, 0, fill)], t); });
  if (over > 0) R.D(3, x => { x.strokeStyle = S; x.lineWidth = 3; x.fillStyle = TEA; const q = q12(t); for (let k = 0; k < 5; k++) { const a = hash(k * 3.1 + Math.floor(q * 6)) * TAU, d = 190 + hash(k + q) * 50; x.beginPath(); x.ellipse(CX + Math.cos(a) * d, RIM - 20 - Math.abs(Math.sin(a)) * 70, 8, 11, 0, 0, TAU); x.fill(); x.stroke(); } });
  if (stop) R.D(3, x => {   // the scholar's hands fly up from the left
    const j = Math.sin(q8(t) * 30) * 6;
    for (const [dy, s0] of [[0, 1], [150, .9]]) {
      shp(x, [[20, 560 + dy], [20, 700 + dy], [230, 760 + dy + j], [262, 700 + dy + j], [200, 640 + dy]], INDIGO, 3, false);
      shp(x, [[236, 706 + dy + j], [300, 660 + dy + j], [330, 668 + dy + j], [322, 700 + dy + j], [348, 716 + dy + j], [330, 760 + dy + j], [262, 770 + dy + j]], PAL.skin, 2.8);
      x.strokeStyle = S; x.lineWidth = 2.4; for (const [a, b, c, d] of [[296, 690, 322, 684], [300, 712, 330, 716], [292, 734, 322, 744]]) { x.beginPath(); x.moveTo(a, b + dy + j); x.lineTo(c, d + dy + j); x.stroke(); }
    }
    x.strokeStyle = S; x.lineWidth = 5; x.lineCap = 'round'; for (const [a, b, c, d] of [[380, 600, 420, 560], [400, 680, 452, 668], [384, 770, 428, 800]]) { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); }
  });
  if (P && run > .55) R.free(x => {   // the tea leaves the print: over the border, into the mount, dripping
    x.save(); x.beginPath(); x.rect(-400, 0, 400 + FR.x0 - 9, H); x.clip(); shp(x, P, TEA, 3); x.restore();
    const d = seg(t, CFG.RUN[0] + (CFG.RUN[1] - CFG.RUN[0]) * .8, CFG.MA[1]), q = q12(t);
    for (const [X, k] of [[-60, 0], [-118, 1], [-12, 2]]) { const L = clamp(d * 1.5 - k * .2) * (260 + k * 70); if (L <= 0) continue; x.fillStyle = S; x.fillRect(X - 9.5, TT + 90, 19, L + 2.5); x.fillStyle = TEA; x.fillRect(X - 7, TT + 90, 14, L); x.beginPath(); x.ellipse(X, TT + 90 + L + 26 + ((q * 3 + k * .37) % 1) * 150, 9, 13, 0, 0, TAU); x.fill(); x.strokeStyle = S; x.lineWidth = 2.5; x.stroke(); }
  });
} };
export const VIEWS = [V_HUT, V_ROOM, V_CUP, V_DUSK];
