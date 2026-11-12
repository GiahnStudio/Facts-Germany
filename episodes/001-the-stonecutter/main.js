// The Stonecutter — an ukiyo-e moral tale (1080×1920)
import { clamp, lerp, seg, ss, eio, eo, ei, hash, mulberry, TAU } from '/core/lib.js';
import { W, H, FR, PAL, TX, mk, buildTextures, inkify, stampLayer, stampFn, drawSeal, cartouche, sealCanvas, rgba } from './print.js';
import { VIEWS, hitsIn } from './views.js';
import { DUR, T, VO, NO_SUB, NS, SLOT, SW, GAP, REVEAL_DUR, q8 } from './story.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const QS = new URLSearchParams(location.search);
const NOSUB = QS.has('nosub');
const J = async f => { try { const r = await fetch(f); if (r.ok) return await r.json(); } catch (e) { } return null; };
const LINES = (await J('lines.json')) || [], DURS = (await J('voices/dur.json')) || {};
const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));

await document.fonts.load('400 40px Yuji', '石切主日雲山己一二三四五六');
await document.fonts.load('500 40px Shippori', 'Aa'); await document.fonts.load('700 40px Shippori', 'Aa');
buildTextures();

// —— Subtitles ——
export const SUBS = Object.entries(VO).filter(([id]) => !NO_SUB.includes(id)).map(([id, t0]) => { const d = DURS[id] ?? (LINE[id]?.text.length || 30) * .065; return { id, t0, t1: t0 + Math.max(1.8, d + .6), text: LINE[id]?.text || '' }; });
SUBS.forEach((s, i) => { if (SUBS[i + 1] && s.t1 > SUBS[i + 1].t0 - .08) s.t1 = SUBS[i + 1].t0 - .08; });
// —— Song mode (like engine/film.js): narration blocks warped onto the sung blocks ——
const SONG = QS.has('nosong') ? null : await J('song/song.json');
let toOrig = x => x, toNew = x => x, FDUR = DUR;
if (SONG) {
  const A = [];
  for (const [id, t0] of Object.entries(VO)) { const sc = SONG.sections.find(x => x.id === id); if (sc) A.push([sc.t0, t0], [sc.t1, t0 + (DURS[id] ?? 2.5)]); }
  A.sort((a, b) => a[0] - b[0]); for (let i = 1; i < A.length; i++) if (A[i][1] < A[i - 1][1]) A[i][1] = A[i - 1][1];
  const map = (v, j) => { const n = A.length - 1; if (v <= A[0][j]) return A[0][j ^ 1] - (A[0][j] - v); if (v >= A[n][j]) return A[n][j ^ 1] + (v - A[n][j]); let i = 0; while (i < n - 1 && v > A[i + 1][j]) i++; return A[i][j ^ 1] + (A[i + 1][j ^ 1] - A[i][j ^ 1]) * (v - A[i][j]) / ((A[i + 1][j] - A[i][j]) || 1); };
  toOrig = x => map(x, 0); toNew = x => map(x, 1); FDUR = +Math.min(SONG.dur, toNew(DUR)).toFixed(2);
  SUBS.length = 0;
  SONG.lines.filter(l => !NO_SUB.includes(l.id)).forEach(l => SUBS.push({ id: l.id, t0: l.t0, t1: Math.max(l.t1 + .4, l.t0 + 1.6), text: l.text }));
  SUBS.forEach((s, i) => { if (SUBS[i + 1] && s.t1 > SUBS[i + 1].t0 - .08) s.t1 = SUBS[i + 1].t0 - .08; });
}

// —— Colour block cache ——
const REG = [[0, 0], [2.2, -1.3], [-1.8, 1.9], [1.5, 2.2]];
const SHIFT = [[4, -5], [-6, 4], [5, 5], [-5, -4]];
const cache = new Map();
function layer(v, name) {
  const k = v.id + ':' + name; if (cache.has(k)) return cache.get(k);
  const d = v.layers[name], c = mk(), x = c.getContext('2d');
  d.draw(x); const hk = hash(k.length * 7.3 + k.charCodeAt(0) + k.charCodeAt(1) * .37);
  inkify(c, { speck: d.speck ?? .3, grain: (d.grain || 0) * 1.7, gx: hk * 300 - 150, baren: d.baren ?? (d.g ? .38 : .12), bx: (hk - .5) * 200, by: (hash(hk) - .5) * 300 });
  cache.set(k, c); return c;
}
const revFor = (i, g, t) => clamp((t - T.print[i][g]) / REVEAL_DUR);

const CART = ['一 石切', '二 主', '三 日', '四 雲', '五 山', '六 己'];
const SEALS = ['石', '主', '日', '雲', '山', '己'];

function drawSheet(i, t, M) {
  const v = VIEWS[i];
  ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  if (i % 2) { ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(TX.paper, 0, 0); ctx.restore(); } else ctx.drawImage(TX.paper, 0, 0);
  const blank = t < T.print[i][0];
  let borderDone = false;
  const border = () => {
    if (borderDone) return; borderDone = true;
    const r = i === 5 && t < T.print[5][0] ? 1 : revFor(i, 0, t); if (r <= 0) return;
    stampFn(ctx, x => { x.strokeStyle = PAL.sumi; x.lineWidth = 3.4; x.strokeRect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); x.lineWidth = 1.3; x.strokeRect(FR.x0 - 9, FR.y0 - 9, FR.x1 - FR.x0 + 18, FR.y1 - FR.y0 + 18); }, r, SHIFT[0]);
  };
  if (!blank) {
    ctx.save(); ctx.beginPath(); ctx.rect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); ctx.clip();
    const R = {
      L: name => { const g = v.layers[name].g; stampLayer(ctx, layer(v, name), revFor(i, g, t), REG[g], SHIFT[g]); },
      D: (g, fn) => { const r = revFor(i, g, t); if (r >= 1) { ctx.save(); ctx.translate(REG[g][0], REG[g][1]); fn(ctx); ctx.restore(); } else stampFn(ctx, fn, r, SHIFT[g]); },
      free: fn => { ctx.restore(); ctx.restore(); ctx.save(); fn(ctx); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); ctx.save(); ctx.beginPath(); ctx.rect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); ctx.clip(); },
    };
    v.paint(ctx, t, R);
    ctx.restore();
    border();
    const ct = T.cart[i];
    if (t > ct[0] || QS.has('cart')) {
      const p = QS.has('cart') ? 1 : clamp((t - ct[0]) / .35), sp = QS.has('cart') ? 1 : clamp((t - ct[1]) / .3);
      let b; stampFn(ctx, x => { b = cartouche(x, 978, 84, CART[i], { series: '石切', w: 82, size: 50, ssize: 26 }); }, p, [0, -14]);
      if (b) drawSeal(ctx, SEALS[i], 978, b.y0 + b.h + 50, 58, sp, { seed: i + 3, rot: (hash(i) - .5) * .06 });
    }
    if (i === 0) titleCard(t);
  } else if (i === 5) {
    border();
    // the blank sheet: only a seal (ma)
    drawSeal(ctx, '己', W / 2, 860, 150, clamp((t - T.seal5) / .3), { seed: 41, rot: .02 });
  }
  ctx.globalAlpha = 1; ctx.drawImage(TX.fiber, 0, 0);
  ctx.restore();
  // breaking out of the print can draw on the mount around the sheet
  if (VIEWS[i].outside) VIEWS[i].outside(ctx, t);
  ctx.restore();
}

// —— Title slip on the first print ——
function titleCard(t) {
  if (!QS.has('title') && (t < T.title[0] || t > T.title[1] + .6)) return;
  const a = QS.has('title') ? 1 : clamp((t - T.title[0]) / .3), out = QS.has('title') ? 0 : ss(seg(t, T.title[1], T.title[1] + .6));
  ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -out * 30);
  stampFn(ctx, x => {
    const x0 = 110, y0 = 150, w = 760, h = 190;
    x.fillStyle = '#f3e7c6'; x.fillRect(x0, y0, w, h); x.fillStyle = PAL.beniL; x.fillRect(x0, y0 + h - 46, w, 46);
    x.strokeStyle = PAL.sumi; x.lineWidth = 3; x.strokeRect(x0, y0, w, h); x.lineWidth = 1.2; x.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
    x.lineWidth = 1.5; x.beginPath(); x.moveTo(x0 + 6, y0 + h - 46); x.lineTo(x0 + w - 6, y0 + h - 46); x.stroke();
    x.fillStyle = PAL.sumi; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 80px Shippori'; x.fillText('The Stonecutter', x0 + w / 2, y0 + 72);
    x.font = '500 25px Shippori'; x.fillText('A   T A L E   W I T H   A   M O R A L', x0 + w / 2, y0 + h - 23);
  }, a, [0, -12]);
  drawSeal(ctx, '石切', 845, 352, 84, QS.has('title') ? 1 : clamp((t - T.title[0] - .45) / .3), { seed: 9, rot: .03 });
  ctx.restore();
}

// —— Camera (world = handscroll coordinates) ——
const C = i => [SLOT(i) + W / 2, H / 2];
function camera(t) {
  const [p01, p12, p23, p34] = T.pan;
  const panTo = (a, b, za, zb, t0, t1) => { const u = eio(seg(t, t0, t1)); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(za, zb, u)]; };
  // sheet 0: slow push toward the palanquin road
  const v0 = () => { const u = ss(seg(t, 4.2, 11.6)); return [C(0)[0] - 10 * u, C(0)[1] + 150 * u, 1 + .06 * u]; };
  const v0end = (() => { const u = 1; return [C(0)[0] - 10 * u, C(0)[1] + 150 * u, 1.06]; })();
  const v1 = () => { const u = ss(seg(t, p01[1], p12[0])); return [C(1)[0], C(1)[1] + 80 * u, 1 + .04 * u]; };
  const v1end = [C(1)[0], C(1)[1] + 80, 1.04];
  let cx, cy, z = 1, rot = 0;
  if (t < p01[0]) [cx, cy, z] = v0();
  else if (t < p01[1]) [cx, cy, z] = panTo(v0end, C(1), 1.06, 1, ...p01);
  else if (t < p12[0]) [cx, cy, z] = v1();
  else if (t < p12[1]) [cx, cy, z] = panTo(v1end, C(2), 1.04, 1, ...p12);
  else if (t < p23[0]) { [cx, cy] = C(2); z = 1 + .03 * ss(seg(t, p12[1], p23[0])); }
  else if (t < p23[1]) [cx, cy, z] = panTo(C(2), C(3), 1.03, 1, ...p23);
  else if (t < p34[0]) {
    [cx, cy] = C(3);
    const d = eio(seg(t, ...T.tiltDown)), up = eio(seg(t, ...T.tiltUp));
    cy += (560 * d) * (1 - up); z = 1 - .1 * d * (1 - up); rot = -.012 * d * (1 - up);
  }
  else if (t < p34[1]) [cx, cy, z] = panTo(C(3), C(4), 1, 1, ...p34);
  else if (t < T.cut5) {
    [cx, cy] = C(4);
    const u = eio(seg(t, ...T.push4)); const tgt = [SLOT(4) + 700, 1688];
    z = Math.exp(lerp(0, Math.log(3.2), u)); cx = lerp(cx, tgt[0], u); cy = lerp(cy, tgt[1], u);
  }
  else { [cx, cy] = C(5); z = 1 + .02 * ss(seg(t, T.print[5][3], T.wash[0])); }
  return { cx, cy, z, rot };
}
function camMatrix(cam) {
  const c = Math.cos(cam.rot) * cam.z, s = Math.sin(cam.rot) * cam.z;
  return [c, s, -s, c, W / 2 - (c * cam.cx - s * cam.cy), H / 2 - (s * cam.cx + c * cam.cy)];
}
const TOTAL = SLOT(0) + W, BAND = [-420, H + 900];
function drawScroll(M) {
  ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
  ctx.fillStyle = PAL.mount; ctx.fillRect(-300, BAND[0], TOTAL + 600, BAND[1] - BAND[0]);
  ctx.globalAlpha = .55; ctx.globalCompositeOperation = 'multiply';
  for (let X = -300; X < TOTAL + 300; X += W) for (let Y = BAND[0]; Y < BAND[1]; Y += H) ctx.drawImage(TX.paper, X, Y);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PAL.mountD; ctx.fillRect(-300, BAND[0], TOTAL + 600, 40); ctx.fillRect(-300, BAND[1] - 40, TOTAL + 600, 40);
  ctx.restore();
}

// —— Subtitles: horizontal cartouche, wrapped, above the Shorts UI ——
function wrap(text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const s = cur ? cur + ' ' + w : w; if (ctx.measureText(s).width > maxW && cur) { lines.push(cur); cur = w; } else cur = s; }
  if (cur) lines.push(cur); return lines;
}
function subtitle(t) {
  const s = SUBS.find(s => t >= s.t0 - .05 && t < s.t1); if (!s) return;
  const a = clamp((t - s.t0 + .05) / .22), fo = 1 - clamp((t - (s.t1 - .22)) / .22);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = '500 50px Shippori'; const L = wrap(s.text, 780), tw = Math.max(...L.map(l => ctx.measureText(l).width));
  const lh = 64, w = tw + 150, h = 40 + L.length * lh, x0 = (W - w) / 2, y0 = 1470 - h / 2;
  ctx.globalAlpha = fo;
  stampFn(ctx, x => {
    x.fillStyle = 'rgba(243,231,198,.96)'; x.fillRect(x0, y0, w, h);
    x.strokeStyle = PAL.sumi; x.lineWidth = 2.6; x.strokeRect(x0, y0, w, h); x.lineWidth = 1; x.strokeRect(x0 + 5, y0 + 5, w - 10, h - 10);
    x.fillStyle = PAL.sumi; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '500 50px Shippori';
    L.forEach((l, k) => x.fillText(l, x0 + 40 + (w - 40) / 2, y0 + 20 + lh / 2 + k * lh + 2));
  }, a, [0, 0]);
  const sc = sealCanvas('石', 40, { seed: 17 }); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = fo * a * .92; ctx.drawImage(sc, x0 + 24, y0 + h / 2 - sc.height / 2);
  ctx.restore();
}

// —— The print washes back to paper; the moral is printed ——
function moral(t) {
  const wa = ss(seg(t, ...T.wash)); if (wa <= 0) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = wa; ctx.drawImage(TX.paper, 0, 0); ctx.globalAlpha = 1;
  const p = clamp((t - T.moral) / .4);
  stampFn(ctx, x => {
    const x0 = 120, y0 = 640, w = 840, h = 520;
    x.fillStyle = '#f3e7c6'; x.fillRect(x0, y0, w, h); x.fillStyle = PAL.beniL; x.fillRect(x0, y0, w, 70);
    x.strokeStyle = PAL.sumi; x.lineWidth = 3.4; x.strokeRect(x0, y0, w, h); x.lineWidth = 1.3; x.strokeRect(x0 + 8, y0 + 8, w - 16, h - 16);
    x.lineWidth = 1.6; x.beginPath(); x.moveTo(x0 + 8, y0 + 70); x.lineTo(x0 + w - 8, y0 + 70); x.stroke();
    x.fillStyle = PAL.sumi; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '500 28px Shippori'; x.fillText('T H E   M O R A L', W / 2, y0 + 37);
    x.font = '700 76px Shippori'; x.fillText('Peace begins', W / 2, y0 + 190); x.fillText('with who you are.', W / 2, y0 + 285);
    x.font = '500 34px Shippori'; x.fillStyle = PAL.sumiL; x.fillText('Whatever you become,', W / 2, y0 + 395); x.fillText('something will seem greater.', W / 2, y0 + 440);
  }, p, [0, -14]);
  drawSeal(ctx, '己', W / 2, 1290, 110, clamp((t - T.moralSeal) / .3), { seed: 44, rot: -.02 });
  ctx.restore();
}
function endFade(t) { const a = ss(seg(t, ...T.end)) * .0; if (a <= 0) return; }

function render(T) {
  if (QS.has('poster')) return poster();
  renderFrame(toOrig(T), NOSUB, T);
}
function renderFrame(t, nosub, ts = t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#161a22'; ctx.fillRect(0, 0, W, H);
  const cam = camera(t), M = camMatrix(cam);
  drawScroll(M);
  const half = (W / 2) / cam.z * 1.8;
  for (let i = 0; i < NS; i++) {
    const x0 = SLOT(i); if (x0 + W < cam.cx - half || x0 > cam.cx + half) continue;
    if (i === 5 && t < T.cut5) continue;          // the blank sheet appears only on the hard cut
    if (i === 4 && t >= T.cut5) continue;
    const Mi = [M[0], M[1], M[2], M[3], M[4] + M[0] * x0, M[5] + M[1] * x0];
    drawSheet(i, t, Mi);
  }
  if (!nosub) subtitle(ts);
  moral(t);
}
function poster() {
  renderFrame(9.0, true);
}

// —— Events (foley / voice / music cues) ——
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const [id, t0] of Object.entries(VO)) add('vo', t0, { id });
  T.print.forEach((list, i) => list.forEach((t, k) => { add('block', t - .1, { v: .55 + k * .1 }); add('baren', t, { d: .32, v: .75 }); }));
  add('slip', T.title[0] - .05, { v: .6 }); add('seal', T.title[0] + .45, { v: .8 }); add('slip', T.title[1], { v: .4 });
  T.cart.forEach(([a, b], i) => { add('slip', a, { v: .45 }); add('seal', b, { v: .85 }); });
  add('seal', T.seal5, { v: 1.1 }); add('slip', T.moral, { v: .6 }); add('seal', T.moralSeal, { v: 1.2 });
  T.pan.forEach(([a, b]) => add('scroll', a, { d: b - a, v: .8 }));
  // chisel taps
  hitsIn(0, T.hammer0[1], .78, .2).forEach(h => add('tap', h, { v: .8 }));
  hitsIn(T.hammer5[0], T.hammer5[1], .9, T.hammer5[0]).forEach(h => add('tap', h, { v: .6 }));
  T.taps.forEach((h, i) => add('tap', h, { v: 1.0, big: 1 }));
  // palanquin bearers' steps
  for (let t = T.palanquin[0] + .3; t < T.palanquin[1]; t += 1 / (2 * 1.1)) add('step', t, { m: 'dirt', v: .55 });
  add('geese', 3.0);
  // ambience
  add('amb', 0.0, { w: 'quarry', d: T.pan[0][1] });
  add('amb', T.pan[0][0] + .4, { w: 'cicada', d: T.pan[1][1] - T.pan[0][0] - .4 });
  add('amb', T.pan[1][0] + .3, { w: 'heat', d: T.pan[2][1] - T.pan[1][0] - .3 });
  add('amb', T.pan[2][0] + .2, { w: 'rain', d: T.pan[3][1] - T.pan[2][0] - .2 });
  add('amb', T.pan[3][1], { w: 'high', d: T.maMtn[0] - T.pan[3][1] });
  add('amb', T.print[5][0], { w: 'dusk', d: DUR - T.print[5][0] });
  // fan flutters (lord, hot)
  for (let t = 15.6; t < 20.2; t += .62) add('fan', t);
  add('gust', T.cloudIn[0], { v: 1 }); add('thunder', 26.0, { v: .9 }); add('thunder', 32.4, { v: 1.1 });
  add('rise', T.flood[0], { d: T.flood[1] - T.flood[0] }); add('spill', T.spill[0], { d: T.spill[1] - T.spill[0] });
  add('bell', T.cut5 + .05, { v: 1 });
  if (SONG) return ev.filter(e => e.type !== 'vo').map(e => ({ ...e, t: +Math.max(0, toNew(e.t)).toFixed(3) })).concat([{ t: 0, type: 'song' }]).sort((a, b) => a.t - b.t);
  return ev.sort((a, b) => a.t - b.t);
}

window.render = render; window.DUR = FDUR; window.EV = events(); window.SUBS = SUBS;
window.TEXTS = T => {
  const out = [], t = toOrig(T);
  if (t >= T.title[0] + .3 && t < T.title[1]) out.push({ id: 'title', text: 'The Stonecutter A TALE WITH A MORAL', x0: 110, y0: 150, x1: 870, y1: 340 });
  if (t >= T.moral + .4) out.push({ id: 'moral', text: 'THE MORAL Peace begins with who you are. Whatever you become, something will seem greater.', x0: 120, y0: 640, x1: 960, y1: 1160 });
  return out;
};
render(parseFloat(QS.get('t') ?? '9'));
window.READY = true;
