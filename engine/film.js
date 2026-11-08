// Generic Tales-in-Ink film runner (9:16). An episode's main.js is just:
//   import { run } from './film.js'; import { CFG } from './story.js'; import { VIEWS } from './views.js'; await run(CFG, VIEWS);
// CFG fields — see episodes/002-the-frog-in-the-well/story.js for a complete example:
//   DUR, PRINT[sheet] = [4 block times] (≤ 0 → already printed at t=0), CAM = keyframes, CART[sheet] = [slipIn, sealIn],
//   CARTTXT[sheet], SEALS[sheet], SUB_SEAL, HOOK {lines, t:[a,b]}, MORAL {wash:[a,b], t, seal, sealT, big:[..], small:[..], char},
//   LOOP {cut} (cut back to the opening framing for a seamless loop), VO {id: t}, NO_SUB [ids], TAG, extraEvents(add)
import { clamp, lerp, seg, ss, eio, hash } from '/core/lib.js';
import { W, H, FR, PAL, TX, mk, buildTextures, inkify, stampLayer, stampFn, drawSeal, cartouche, sealCanvas } from './print.js';

export const GAP = 220, SW = W + GAP;
const REVEAL = .32;
const REG = [[0, 0], [2.2, -1.3], [-1.8, 1.9], [1.5, 2.2]];
const SHIFT = [[4, -5], [-6, 4], [5, 5], [-5, -4]];

export async function run(CFG, VIEWS) {
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const QS = new URLSearchParams(location.search), NOSUB = QS.has('nosub');
  const J = async f => { try { const r = await fetch(f); if (r.ok) return await r.json(); } catch (e) { } return null; };
  const LINES = (await J('lines.json')) || [], DURS = (await J('voices/dur.json')) || {};
  const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));
  await document.fonts.load('400 40px Yuji', (CFG.CARTTXT || []).join('') + (CFG.SEALS || []).join('') + (CFG.SUB_SEAL || '') + (CFG.MORAL?.seal || ''));
  await document.fonts.load('500 40px Shippori', 'Aa'); await document.fonts.load('700 40px Shippori', 'Aa');
  buildTextures();
  const NS = VIEWS.length, SLOT = i => (NS - 1 - i) * SW, DUR = CFG.DUR;

  // —— subtitles ——
  const SUBS = Object.entries(CFG.VO).filter(([id]) => !(CFG.NO_SUB || []).includes(id)).map(([id, t0]) => { const d = DURS[id] ?? (LINE[id]?.text.length || 30) * .065; return { id, t0, t1: t0 + Math.max(1.8, d + .6), text: LINE[id]?.text || '' }; });
  SUBS.forEach((s, i) => { if (SUBS[i + 1] && s.t1 > SUBS[i + 1].t0 - .08) s.t1 = SUBS[i + 1].t0 - .08; });

  // —— colour block cache ——
  const cache = new Map();
  function layer(v, name) {
    const k = v.id + ':' + name; if (cache.has(k)) return cache.get(k);
    const d = v.layers[name], c = mk(), x = c.getContext('2d');
    d.draw(x); const hk = hash(k.length * 7.3 + k.charCodeAt(0) + k.charCodeAt(1) * .37);
    inkify(c, { speck: d.speck ?? .3, grain: (d.grain || 0) * 1.7, gx: hk * 300 - 150, baren: d.baren ?? (d.g ? .38 : .12), bx: (hk - .5) * 200, by: (hash(hk) - .5) * 300 });
    cache.set(k, c); return c;
  }
  const revFor = (i, g, t) => { const p = CFG.PRINT[i][g]; return p <= 0 ? 1 : clamp((t - p) / REVEAL); };

  function drawSheet(i, t, M) {
    const v = VIEWS[i];
    ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    if (i % 2) { ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(TX.paper, 0, 0); ctx.restore(); } else ctx.drawImage(TX.paper, 0, 0);
    const r0 = revFor(i, 0, t);
    if (r0 > 0) stampFn(ctx, x => { x.strokeStyle = PAL.sumi; x.lineWidth = 3.4; x.strokeRect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); x.lineWidth = 1.3; x.strokeRect(FR.x0 - 9, FR.y0 - 9, FR.x1 - FR.x0 + 18, FR.y1 - FR.y0 + 18); }, r0, SHIFT[0]);
    let freeFns = [];
    if (CFG.PRINT[i][0] <= 0 || t >= CFG.PRINT[i][0]) {
      ctx.save(); ctx.beginPath(); ctx.rect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); ctx.clip();
      const R = {
        L: name => { const g = v.layers[name].g; stampLayer(ctx, layer(v, name), revFor(i, g, t), REG[g], SHIFT[g]); },
        D: (g, fn) => { const r = revFor(i, g, t); if (r >= 1) { ctx.save(); ctx.translate(REG[g][0], REG[g][1]); fn(ctx); ctx.restore(); } else if (r > 0) stampFn(ctx, fn, r, SHIFT[g]); },
        free: fn => freeFns.push(fn),          // drawn after the sheet, unclipped (breaking out of the print)
        rev: g => revFor(i, g, t),
      };
      v.paint(ctx, t, R);
      ctx.restore();
      const ct = CFG.CART?.[i];
      if (ct && CFG.CARTTXT?.[i] && (t > ct[0] || CFG.PRINT[i][0] <= 0)) {
        const p = CFG.PRINT[i][0] <= 0 ? 1 : clamp((t - ct[0]) / .35), sp = CFG.PRINT[i][0] <= 0 ? 1 : clamp((t - ct[1]) / .3);
        let b; stampFn(ctx, x => { b = cartouche(x, 978, 84, CFG.CARTTXT[i], { series: CFG.SERIES || '墨話', w: 82, size: 50, ssize: 26 }); }, p, [0, -14]);
        if (b && CFG.SEALS?.[i]) drawSeal(ctx, CFG.SEALS[i], 978, b.y0 + b.h + 50, 58, sp, { seed: i + 3, rot: (hash(i) - .5) * .06 });
      }
    }
    ctx.globalAlpha = 1; ctx.drawImage(TX.fiber, 0, 0);
    ctx.restore();
    for (const fn of freeFns) { ctx.save(); fn(ctx); ctx.restore(); }
    ctx.restore();
  }

  // —— camera: keyframes {t, s, x, y, z, rot, cut} in sheet coords; consecutive keys interpolate (eio), `cut` jumps ——
  const K = CFG.CAM.slice().sort((a, b) => a.t - b.t);
  function camera(t) {
    let k0 = K[0], k1 = K[0];
    for (let i = 0; i < K.length; i++) { if (K[i].t <= t) { k0 = K[i]; k1 = K[i + 1] || K[i]; } }
    if (t < K[0].t) k0 = k1 = K[0];
    const w = k => [SLOT(k.s) + (k.x ?? W / 2), k.y ?? H / 2, k.z ?? 1, k.rot ?? 0];
    const a = w(k0), b = w(k1);
    if (k1 === k0 || k1.cut) return { cx: a[0], cy: a[1], z: a[2], rot: a[3] };
    const u = (k1.ease === 'lin' ? (x => x) : k1.ease === 'in' ? (x => x * x * x) : k1.ease === 'out' ? (x => 1 - (1 - x) ** 3) : eio)(seg(t, k0.t, k1.t));
    const z = Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), u));
    return { cx: lerp(a[0], b[0], u), cy: lerp(a[1], b[1], u), z, rot: lerp(a[3], b[3], u) };
  }
  const camMatrix = cam => { const c = Math.cos(cam.rot) * cam.z, s = Math.sin(cam.rot) * cam.z; return [c, s, -s, c, W / 2 - (c * cam.cx - s * cam.cy), H / 2 - (s * cam.cx + c * cam.cy)]; };
  const TOTAL = SLOT(0) + W, BAND = [-700, H + 900];
  function drawScroll(M) {
    ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
    ctx.fillStyle = PAL.mount; ctx.fillRect(-300, BAND[0], TOTAL + 600, BAND[1] - BAND[0]);
    ctx.globalAlpha = .55; ctx.globalCompositeOperation = 'multiply';
    for (let X = -300; X < TOTAL + 300; X += W) for (let Y = BAND[0]; Y < BAND[1]; Y += H) ctx.drawImage(TX.paper, X, Y);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAL.mountD; ctx.fillRect(-300, BAND[0], TOTAL + 600, 40); ctx.fillRect(-300, BAND[1] - 40, TOTAL + 600, 40);
    ctx.restore();
  }

  // —— hook line at the top (first seconds, and again on the loop frame) ——
  function hook(t) {
    const Hk = CFG.HOOK; if (!Hk) return;
    const loop = CFG.LOOP && t >= CFG.LOOP.cut;
    if (!loop && (t > Hk.t[1] + .4)) return;
    const a = loop ? 1 : 1 - ss(seg(t, Hk.t[1], Hk.t[1] + .4));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
    ctx.font = '700 62px Shippori'; const tw = Math.max(...Hk.lines.map(l => ctx.measureText(l).width));
    const w = tw + 110, h = 46 + Hk.lines.length * 76, x0 = (W - w) / 2, y0 = 290;
    stampFn(ctx, x => {
      x.fillStyle = 'rgba(243,231,198,.97)'; x.fillRect(x0, y0, w, h); x.fillStyle = PAL.beniL; x.fillRect(x0, y0, 16, h); x.fillRect(x0 + w - 16, y0, 16, h);
      x.strokeStyle = PAL.sumi; x.lineWidth = 3; x.strokeRect(x0, y0, w, h); x.lineWidth = 1.2; x.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
      x.fillStyle = PAL.sumi; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 62px Shippori';
      Hk.lines.forEach((l, k) => x.fillText(l, W / 2, y0 + 23 + 38 + k * 76));
    }, 1, [0, 0]);
    if (CFG.TAG) { ctx.font = '500 26px Shippori'; ctx.fillStyle = PAL.paper; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(243,231,198,.95)'; const tw2 = ctx.measureText(CFG.TAG).width + 40; ctx.fillRect(W / 2 - tw2 / 2, y0 - 44, tw2, 38); ctx.strokeStyle = PAL.sumi; ctx.lineWidth = 1.5; ctx.strokeRect(W / 2 - tw2 / 2, y0 - 44, tw2, 38); ctx.fillStyle = PAL.sumi; ctx.textBaseline = 'middle'; ctx.fillText(CFG.TAG, W / 2, y0 - 25); }
    ctx.restore();
  }

  // —— subtitles ——
  function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const s = cur ? cur + ' ' + w : w; if (ctx.measureText(s).width > maxW && cur) { lines.push(cur); cur = w; } else cur = s; } if (cur) lines.push(cur); return lines; }
  function subtitle(t) {
    const s = SUBS.find(s => t >= s.t0 - .05 && t < s.t1); if (!s) return;
    const a = clamp((t - s.t0 + .05) / .2), fo = 1 - clamp((t - (s.t1 - .2)) / .2);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = '500 52px Shippori'; const L = wrap(s.text, 800), tw = Math.max(...L.map(l => ctx.measureText(l).width));
    const lh = 66, w = tw + 150, h = 40 + L.length * lh, x0 = (W - w) / 2, y0 = 1470 - h / 2;
    ctx.globalAlpha = fo;
    stampFn(ctx, x => {
      x.fillStyle = 'rgba(243,231,198,.96)'; x.fillRect(x0, y0, w, h);
      x.strokeStyle = PAL.sumi; x.lineWidth = 2.6; x.strokeRect(x0, y0, w, h); x.lineWidth = 1; x.strokeRect(x0 + 5, y0 + 5, w - 10, h - 10);
      x.fillStyle = PAL.sumi; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '500 52px Shippori';
      L.forEach((l, k) => x.fillText(l, x0 + 40 + (w - 40) / 2, y0 + 20 + lh / 2 + k * lh + 2));
    }, a, [0, 0]);
    const sc = sealCanvas(CFG.SUB_SEAL || '墨', 40, { seed: 17 }); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = fo * a * .92; ctx.drawImage(sc, x0 + 24, y0 + h / 2 - sc.height / 2);
    ctx.restore();
  }

  // —— moral card ——
  function moral(t) {
    const Mo = CFG.MORAL; if (!Mo) return;
    if (CFG.LOOP && t >= CFG.LOOP.cut) return;
    const wa = ss(seg(t, ...Mo.wash)); if (wa <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = wa; ctx.drawImage(TX.paper, 0, 0); ctx.globalAlpha = 1;
    const p = clamp((t - Mo.t) / .35), nb = Mo.big.length, ns = (Mo.small || []).length;
    const x0 = 100, w = 880, h = 140 + nb * 96 + ns * 46 + 40, y0 = 900 - h / 2;
    stampFn(ctx, x => {
      x.fillStyle = '#f3e7c6'; x.fillRect(x0, y0, w, h); x.fillStyle = PAL.beniL; x.fillRect(x0, y0, w, 70);
      x.strokeStyle = PAL.sumi; x.lineWidth = 3.4; x.strokeRect(x0, y0, w, h); x.lineWidth = 1.3; x.strokeRect(x0 + 8, y0 + 8, w - 16, h - 16);
      x.lineWidth = 1.6; x.beginPath(); x.moveTo(x0 + 8, y0 + 70); x.lineTo(x0 + w - 8, y0 + 70); x.stroke();
      x.fillStyle = PAL.sumi; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '500 28px Shippori'; x.fillText('T H E   M O R A L', W / 2, y0 + 37);
      x.font = '700 78px Shippori'; Mo.big.forEach((l, k) => x.fillText(l, W / 2, y0 + 150 + k * 96));
      x.font = '500 36px Shippori'; x.fillStyle = PAL.sumiL; (Mo.small || []).forEach((l, k) => x.fillText(l, W / 2, y0 + 150 + nb * 96 + 10 + k * 46));
    }, p, [0, -14]);
    drawSeal(ctx, Mo.seal || '心', W / 2, y0 + h + 90, 110, clamp((t - Mo.sealT) / .3), { seed: 44, rot: -.02 });
    ctx.restore();
  }

  function renderFrame(t, nosub) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#161a22'; ctx.fillRect(0, 0, W, H);
    const tc = CFG.LOOP && t >= CFG.LOOP.cut ? 0 : t;          // loop frame = the opening frame
    const cam = camera(tc), M = camMatrix(cam);
    drawScroll(M);
    const half = (W / 2) / cam.z * 1.8;
    for (let i = 0; i < NS; i++) {
      const x0 = SLOT(i); if (x0 + W < cam.cx - half || x0 > cam.cx + half) continue;
      const Mi = [M[0], M[1], M[2], M[3], M[4] + M[0] * x0, M[5] + M[1] * x0];
      drawSheet(i, tc, Mi);
    }
    if (!nosub && !(CFG.LOOP && t >= CFG.LOOP.cut)) subtitle(t);
    moral(t); hook(t);
  }
  const render = t => renderFrame(t, NOSUB);

  // —— events ——
  function events() {
    const ev = [], add = (type, t, o = {}) => { if (t >= 0 && t < DUR) ev.push({ t: +t.toFixed(3), type, ...o }); };
    for (const [id, t0] of Object.entries(CFG.VO)) add('vo', t0, { id });
    CFG.PRINT.forEach(list => list.forEach((t, k) => { if (t > 0) { add('block', t - .1, { v: .55 + k * .1 }); add('baren', t, { d: .32, v: .75 }); } }));
    (CFG.CART || []).forEach(([a, b], i) => { if (CFG.PRINT[i][0] > 0) { add('slip', a, { v: .45 }); add('seal', b, { v: .85 }); } });
    for (let i = 1; i < K.length; i++) if (!K[i].cut && K[i].s !== K[i - 1].s) add('scroll', K[i - 1].t, { d: K[i].t - K[i - 1].t, v: .8 });
    if (CFG.MORAL) { add('slip', CFG.MORAL.t, { v: .6 }); add('seal', CFG.MORAL.sealT, { v: 1.2 }); }
    CFG.extraEvents?.(add);
    return ev.sort((a, b) => a.t - b.t);
  }

  window.render = render; window.DUR = DUR; window.EV = events(); window.SUBS = SUBS;
  window.TEXTS = t => {
    const out = [];
    if (CFG.HOOK && (t < CFG.HOOK.t[1] || (CFG.LOOP && t >= CFG.LOOP.cut))) out.push({ id: 'hook', text: CFG.HOOK.lines.join(' '), x0: 60, y0: 250, x1: 1020, y1: 300 + 46 + CFG.HOOK.lines.length * 76 });
    if (CFG.MORAL && t >= CFG.MORAL.t + .4 && !(CFG.LOOP && t >= CFG.LOOP.cut)) out.push({ id: 'moral', text: 'THE MORAL ' + CFG.MORAL.big.join(' ') + ' ' + (CFG.MORAL.small || []).join(' '), x0: 100, y0: 600, x1: 980, y1: 1200 });
    return out;
  };
  render(parseFloat(QS.get('t') ?? '1'));
  window.READY = true;
}
