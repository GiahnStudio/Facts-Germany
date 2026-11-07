// Figures for "The Stonecutter": the kneeling stonecutter, the seated lord, a palanquin, and the one face
// he keeps in every form (sun, cloud, mountain). Flat colour + sumi key line, few strokes.
import { clamp, lerp, TAU } from '/core/lib.js';
import { PAL, smooth, poly } from './print.js';

const INK = PAL.sumi;
const JACKET = '#2c4a70', JACKET_D = '#1f3656', TROUS = '#1d2c44', BAND = '#f3ead2';
function shape(x, pts, fill, lw, closed = true, sm = true) {
  x.beginPath(); sm ? smooth(x, pts, closed) : poly(x, pts);
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (lw) { x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); }
}
function limb(x, pts, ws, fill, lw) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    L.push([pts[i][0] - dy * ws[i] / 2, pts[i][1] + dx * ws[i] / 2]); R.push([pts[i][0] + dy * ws[i] / 2, pts[i][1] - dx * ws[i] / 2]);
  }
  shape(x, L.concat(R.reverse()), fill, lw, true, false);
}
const lerpA = (a, b, u) => a + (b - a) * u;

// —— Small face (profile, facing right) used on the stonecutter ——
function profileFace(x, cx, cy, r, mood, lw) {
  x.strokeStyle = INK; x.lineCap = 'round'; x.lineWidth = lw * .55;
  // eye
  if (mood === 'smile') { x.beginPath(); x.arc(cx + r * .45, cy - r * .05, r * .22, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
  else { x.beginPath(); x.moveTo(cx + r * .28, cy - r * .06); x.lineTo(cx + r * .62, cy - r * .1); x.stroke(); }
  // brow
  x.beginPath(); x.moveTo(cx + r * .22, cy - r * (mood === 'sad' ? .34 : .42)); x.quadraticCurveTo(cx + r * .45, cy - r * .5, cx + r * .68, cy - r * (mood === 'sad' ? .46 : .38)); x.stroke();
  // mouth
  x.beginPath();
  if (mood === 'smile') { x.moveTo(cx + r * .5, cy + r * .45); x.quadraticCurveTo(cx + r * .7, cy + r * .58, cx + r * .86, cy + r * .4); }
  else if (mood === 'sad') { x.moveTo(cx + r * .52, cy + r * .55); x.quadraticCurveTo(cx + r * .7, cy + r * .44, cx + r * .86, cy + r * .54); }
  else { x.moveTo(cx + r * .52, cy + r * .5); x.lineTo(cx + r * .86, cy + r * .48); }
  x.stroke();
}

// —— The stonecutter: kneeling, facing right, hammer + chisel. swing 0 = raised, 1 = strike ——
export function cutter(x, px, py, s, o = {}) {
  const u = s / 100, lw = clamp(s / 70, 1.2, 3) / u, sw = clamp(o.swing ?? 0);
  x.save(); x.translate(px, py); x.scale(u * (o.flip ? -1 : 1), u); x.lineJoin = 'round'; x.lineCap = 'round';
  const bob = sw * 1.6;
  // far leg (shin on the ground) + foot
  limb(x, [[16, -4], [-4, -3], [-24, -3]], [9, 8, 6], TROUS, lw);
  shape(x, [[-24, -6], [-31, -3], [-30, 0], [-22, 0]], PAL.skin, lw * .8, true, false);
  // near thigh (kneeling, knee forward)
  limb(x, [[-10, -30 + bob], [6, -18], [20, -6]], [16, 14, 11], TROUS, lw);
  limb(x, [[20, -6], [2, -4], [-18, -4]], [10, 9, 7], TROUS, lw);
  // torso (leaning toward the stone)
  const lean = 4 + sw * 5;
  shape(x, [[-16, -28 + bob], [-17, -46], [-10, -62], [2 + lean, -67 + bob], [10 + lean, -60 + bob], [10 + lean * .6, -42 + bob], [6, -27 + bob]], JACKET, lw, true, false);
  x.strokeStyle = INK; x.lineWidth = lw * .5; x.beginPath(); x.moveTo(2 + lean, -66 + bob); x.quadraticCurveTo(-2, -48 + bob, 0, -30 + bob); x.stroke();
  shape(x, [[-16, -33 + bob], [7, -32 + bob], [7, -27 + bob], [-16, -27 + bob]], PAL.ochre, lw * .6, true, false);
  // far arm → chisel held on the stone
  const chT = o.chisel || [36, -24];
  const fs = [6 + lean, -60 + bob], fh = [chT[0] - 6, chT[1] - 12];
  limb(x, [fs, [lerpA(fs[0], fh[0], .5) + 2, lerpA(fs[1], fh[1], .5) + 4], fh], [6.5, 5.5, 4.5], PAL.skin, lw * .8);
  x.strokeStyle = '#6d6a63'; x.lineWidth = 3.2; x.beginPath(); x.moveTo(fh[0] - 2, fh[1] - 5); x.lineTo(chT[0], chT[1]); x.stroke();
  x.strokeStyle = INK; x.lineWidth = lw * .5; x.stroke();
  // head (+ hachimaki headband)
  const hc = [10 + lean * 1.1, -76 + bob], r = 8.5;
  shape(x, [[hc[0] - r, hc[1]], [hc[0] - r * .7, hc[1] - r * .75], [hc[0], hc[1] - r], [hc[0] + r * .8, hc[1] - r * .6], [hc[0] + r * 1.05, hc[1] + r * .1], [hc[0] + r * .8, hc[1] + r * .8], [hc[0], hc[1] + r * 1.05], [hc[0] - r * .7, hc[1] + r * .7]], PAL.skin, lw * .8, true, true);
  shape(x, [[hc[0] - r * 1.02, hc[1] - r * .1], [hc[0] - r * .7, hc[1] - r * .8], [hc[0] + r * .1, hc[1] - r * 1.05], [hc[0] + r * .7, hc[1] - r * .75], [hc[0] + r * .3, hc[1] - r * .5], [hc[0] - r * .4, hc[1] - r * .4]], INK, 0, true, true);
  shape(x, [[hc[0] - r * 1.02, hc[1] - r * .42], [hc[0] + r * .92, hc[1] - r * .62], [hc[0] + r * .98, hc[1] - r * .32], [hc[0] - r * .98, hc[1] - r * .08]], BAND, lw * .5, true, false);
  shape(x, [[hc[0] - r, hc[1] - r * .3], [hc[0] - r * 1.9, hc[1] - r * .6], [hc[0] - r * 1.7, hc[1] - r * .05]], BAND, lw * .5, true, false);
  profileFace(x, hc[0], hc[1], r, o.mood || 'plain', lw);
  // near arm with hammer
  const sh = [2 + lean, -61 + bob];
  const a1 = lerpA(-2.25, .55, sw), a2 = lerpA(-1.55, -.15, sw);
  const el = [sh[0] + Math.cos(a1) * 15, sh[1] + Math.sin(a1) * 15], hd = [el[0] + Math.cos(a2) * 14, el[1] + Math.sin(a2) * 14];
  limb(x, [sh, el, hd], [7, 6, 5], PAL.skin, lw * .8);
  // hammer: handle continues from the fist, head perpendicular
  const ah = a2 + lerpA(-.2, .9, sw), hx = [hd[0] + Math.cos(ah) * 13, hd[1] + Math.sin(ah) * 13];
  x.strokeStyle = PAL.woodD; x.lineWidth = 3; x.beginPath(); x.moveTo(hd[0], hd[1]); x.lineTo(hx[0], hx[1]); x.stroke();
  x.save(); x.translate(hx[0], hx[1]); x.rotate(ah + Math.PI / 2);
  shape(x, [[-6, -3.4], [6, -3.4], [6, 3.4], [-6, 3.4]], '#5f5e58', lw * .7, true, false); x.restore();
  x.restore();
}

// —— The lord: seated on a veranda, facing the viewer, tall black hat, fan ——
export function lord(x, px, py, s, o = {}) {
  const u = s / 100, lw = clamp(s / 70, 1.2, 3.2) / u;
  x.save(); x.translate(px, py); x.scale(u, u); x.lineJoin = 'round'; x.lineCap = 'round';
  const slump = o.slump || 0;
  // robe (wide, layered)
  shape(x, [[-50, 0], [50, 0], [38, -28], [20, -56 + slump * 4], [-20, -56 + slump * 4], [-38, -28]], PAL.beni, lw, true, false);
  x.save(); x.beginPath(); poly(x, [[-50, 0], [50, 0], [38, -28], [20, -56], [-20, -56], [-38, -28]]); x.clip();
  x.fillStyle = PAL.ochreL; for (let i = 0; i < 14; i++) { const cx = -44 + (i % 5) * 22 + (Math.floor(i / 5) % 2) * 11, cy = -8 - Math.floor(i / 5) * 16; x.beginPath(); x.arc(cx, cy, 3.4, 0, TAU); x.fill(); }
  x.restore();
  shape(x, [[-46, 0], [46, 0], [36, -10], [-36, -10]], '#7e2c22', lw * .7, true, false);
  // collar V (inner white, outer black)
  shape(x, [[-14, -55 + slump * 4], [0, -30], [14, -55 + slump * 4], [8, -56], [0, -40], [-8, -56]], PAL.white, lw * .6, true, false);
  shape(x, [[-22, -55 + slump * 4], [-14, -55 + slump * 4], [0, -30], [-4, -22]], INK, 0, true, false);
  shape(x, [[22, -55 + slump * 4], [14, -55 + slump * 4], [0, -30], [4, -22]], INK, 0, true, false);
  // head
  const hy = -68 + slump * 5;
  shape(x, [[-10, hy], [-8, hy - 8], [0, hy - 11], [8, hy - 8], [10, hy], [7, hy + 9], [0, hy + 12], [-7, hy + 9]], PAL.skin, lw * .8, true, true);
  shape(x, [[-9, hy - 6], [-7, hy - 30], [2, hy - 36], [8, hy - 28], [9, hy - 6]], INK, 0, true, false);   // eboshi (tall lacquered hat)
  // face (front)
  x.strokeStyle = INK; x.lineWidth = lw * .5;
  const m = o.mood || 'plain';
  const br = m === 'hot' ? [[-7, hy - 2.5], [-2, hy - 4], [2, hy - 4], [7, hy - 2.5]] : [[-7, hy - 4], [-2, hy - 3], [2, hy - 3], [7, hy - 4]];
  x.beginPath(); x.moveTo(...br[0]); x.lineTo(...br[1]); x.moveTo(...br[2]); x.lineTo(...br[3]); x.stroke();
  if (m === 'smug') { x.beginPath(); x.arc(-4.5, hy + 1, 2, Math.PI * 1.1, Math.PI * 1.9); x.arc(4.5, hy + 1, 2, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
  else { x.fillStyle = INK; x.beginPath(); x.arc(-4.5, hy, 1.1, 0, TAU); x.arc(4.5, hy, 1.1, 0, TAU); x.fill(); }
  x.beginPath();
  if (m === 'hot') { x.moveTo(-3, hy + 7); x.quadraticCurveTo(0, hy + 5, 3, hy + 7); }
  else if (m === 'smug') { x.moveTo(-3, hy + 6); x.quadraticCurveTo(0, hy + 8, 3, hy + 6); }
  else { x.moveTo(-2.5, hy + 6.5); x.lineTo(2.5, hy + 6.5); }
  x.stroke();
  if (o.sweat) { x.fillStyle = PAL.sky; x.strokeStyle = INK; x.lineWidth = lw * .35; [[-13, hy - 6], [13, hy - 2], [-12, hy + 6]].forEach(([dx, dy], i) => { const k = (o.sweat + i * .37) % 1, yy = dy + k * 10; x.beginPath(); x.moveTo(dx, yy - 3); x.quadraticCurveTo(dx + 2.4, yy + 1.5, dx, yy + 2.6); x.quadraticCurveTo(dx - 2.4, yy + 1.5, dx, yy - 3); x.fill(); x.stroke(); }); }
  // fan in the right hand (viewer's left)
  const fa = o.fan ?? 0, fx0 = -24, fy0 = -40;
  shape(x, [[-34, -44], [-26, -36], [-20, -40]], PAL.skin, lw * .7, true, false);
  x.save(); x.translate(fx0, fy0); x.rotate(-.9 + fa * .5);
  x.fillStyle = PAL.white; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 24, -Math.PI * .85, -Math.PI * .15); x.closePath(); x.fill();
  x.strokeStyle = INK; x.lineWidth = lw * .6; x.stroke();
  x.fillStyle = PAL.beni; x.beginPath(); x.arc(0, -15, 4.2, 0, TAU); x.fill();
  x.lineWidth = lw * .3; for (let k = 1; k < 7; k++) { const a = -Math.PI * .85 + k / 7 * Math.PI * .7; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); x.stroke(); }
  x.restore();
  x.restore();
}

// —— Palanquin (kago) hung from a pole, carried by two bearers (traveller rig) ——
export function palanquin(x, px, py, s, traveler, ph) {
  const bh = s, gap = s * 1.25, poleY = py - bh * .74;
  traveler(x, px + gap, py, bh, { mode: 'walk', ph: ph + .5, t: ph, wind: .3 });
  // pole
  x.fillStyle = PAL.woodD; x.fillRect(px - gap * .35, poleY - 4, gap * 1.7, 8); x.strokeStyle = INK; x.lineWidth = 1.6; x.strokeRect(px - gap * .35, poleY - 4, gap * 1.7, 8);
  // box: lacquer black with beni curtain
  const bx = px + gap * .5, bw = s * .78, bhgt = s * .62, by = poleY + s * .06, sway = Math.sin(ph * TAU) * 2;
  x.save(); x.translate(bx, by); x.rotate(sway * .005);
  x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.moveTo(-bw * .3, 0); x.lineTo(-bw * .3, bhgt * .2); x.moveTo(bw * .3, 0); x.lineTo(bw * .3, bhgt * .2); x.stroke();
  shape(x, [[-bw * .62, bhgt * .22], [0, bhgt * .05], [bw * .62, bhgt * .22], [bw * .52, bhgt * .3], [-bw * .52, bhgt * .3]], INK, 1.8, true, false);
  shape(x, [[-bw * .48, bhgt * .3], [bw * .48, bhgt * .3], [bw * .45, bhgt * 1.02], [-bw * .45, bhgt * 1.02]], '#3a2a1c', 2, true, false);
  shape(x, [[-bw * .32, bhgt * .4], [bw * .32, bhgt * .4], [bw * .3, bhgt * .86], [-bw * .3, bhgt * .86]], PAL.beni, 1.4, true, false);
  x.strokeStyle = PAL.ochre; x.lineWidth = 1.3; for (let k = 1; k < 5; k++) { const xx = -bw * .32 + k * bw * .64 / 5; x.beginPath(); x.moveTo(xx, bhgt * .42); x.lineTo(xx, bhgt * .84); x.stroke(); }
  x.restore();
  traveler(x, px, py, bh, { mode: 'walk', ph, t: ph, wind: .3 });
}

// —— The face he keeps in every form (sun, cloud, mountain): front view, a few sumi strokes ——
// mood: proud | angry | shock | calm | smile ; open 0..1 (eyes)
export function face(x, cx, cy, r, mood = 'calm', o = {}) {
  const lw = Math.max(2.4, r * .055), col = o.col || INK;
  x.save(); x.strokeStyle = col; x.fillStyle = col; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = lw;
  const ex = r * .36, ey = cy - r * .08;
  // brows
  const browIn = { proud: -.1, angry: .22, shock: -.24, calm: -.04, smile: -.08 }[mood] ?? 0;
  for (const sd of [-1, 1]) {
    x.beginPath(); x.moveTo(cx + sd * ex * .45, ey - r * (.26 - browIn * .5)); x.quadraticCurveTo(cx + sd * ex, ey - r * (.36 + (mood === 'shock' ? .08 : 0)), cx + sd * ex * 1.55, ey - r * (.28 + browIn * .3)); x.stroke();
  }
  // eyes
  for (const sd of [-1, 1]) {
    const X = cx + sd * ex;
    if (mood === 'proud' || mood === 'smile') { x.beginPath(); x.arc(X, ey + r * .05, r * .13, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
    else if (mood === 'calm') { x.beginPath(); x.arc(X, ey - r * .05, r * .13, Math.PI * .15, Math.PI * .85); x.stroke(); }
    else if (mood === 'shock') { x.beginPath(); x.arc(X, ey, r * .085, 0, TAU); x.stroke(); x.beginPath(); x.arc(X, ey, r * .03, 0, TAU); x.fill(); }
    else { x.beginPath(); x.moveTo(X - r * .11, ey - r * .02 * -sd); x.lineTo(X + r * .11, ey + r * .02 * -sd); x.stroke(); x.beginPath(); x.arc(X, ey + r * .03, r * .03, 0, TAU); x.fill(); }
  }
  // nose
  x.lineWidth = lw * .8; x.beginPath(); x.moveTo(cx - r * .02, ey + r * .1); x.quadraticCurveTo(cx + r * .07, ey + r * .26, cx - r * .05, ey + r * .3); x.stroke();
  // mouth
  x.lineWidth = lw; x.beginPath(); const my = cy + r * .42;
  if (mood === 'proud') { x.moveTo(cx - r * .2, my - r * .02); x.quadraticCurveTo(cx + r * .02, my + r * .1, cx + r * .24, my - r * .06); }
  else if (mood === 'smile') { x.moveTo(cx - r * .22, my - r * .04); x.quadraticCurveTo(cx, my + r * .12, cx + r * .22, my - r * .04); }
  else if (mood === 'angry') { x.moveTo(cx - r * .2, my + r * .05); x.quadraticCurveTo(cx, my - r * .07, cx + r * .2, my + r * .05); }
  else if (mood === 'shock') { x.ellipse(cx, my, r * .07, r * .1, 0, 0, TAU); }
  else { x.moveTo(cx - r * .14, my); x.lineTo(cx + r * .14, my); }
  x.stroke();
  x.restore();
}
