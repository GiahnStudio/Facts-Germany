// The Wind and the Sun (Aesop, moved to an old Japanese mountain road) — timeline (narration clock; the film runs on the song, see engine/film.js).
// Sheets: 0 the road, calm morning · 1 the same road in the gale (alternate impression) · 2 the same road in warm sunlight (alternate impression)
export const CFG = {
  DUR: 41.5,
  TAG: 'Tales in Ink · Fable 07',
  SERIES: '墨話',
  HOOK: { lines: ['Wind against Sun.', 'Who is stronger?'], t: [0, 3.2] },
  PRINT: [
    [0, 0, 0, 0],
    [12.9, 13.1, 13.3, 13.5],
    [25.0, 25.2, 25.4, 25.6],
  ],
  CART: [[0, 0], [14.0, 14.4], [26.0, 26.4]],
  CARTTXT: ['一 山道', '二 北風', '三 太陽'],
  SEALS: ['旅', '風', '陽'],
  SUB_SEAL: '風',
  VO: { L01: 0.3, L02: 4.6, L03: 9.5, L04: 13.6, L05: 18.2, L06: 22.9, L07: 25.6, L08: 29.0, L09: 32.8, L10: 36.2 },
  NO_SUB: ['L10'],
  BLOW: [13.7, 22.1], GIVEUP: 22.9,
  SHINE: 25.7, WIPE: 30.6, OFF: 33.3,
  MA: [22.1, 22.9],
  MORAL: { wash: [35.5, 36.1], t: 36.0, sealT: 39.8, seal: '陽', big: ['Gentleness opens', 'what force keeps shut.'], small: ['Warmth wins where wind fails.'] },
  LOOP: { cut: 41.0 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 3.2, s: 0, x: 540, y: 900, z: 1.05 },
    { t: 4.4, s: 0, x: 540, y: 640, z: 1.5 },            // tilt up: the two faces in the sky
    { t: 4.6, s: 0, x: 540, y: 650, z: 1.52 },
    { t: 6.0, s: 0, x: 640, y: 1180, z: 1.7 },           // tilt down: the traveler on the road
    { t: 9.3, s: 0, x: 560, y: 1170, z: 1.75 },
    { t: 9.5, s: 0, x: 330, y: 650, z: 2.0, cut: 1 },    // hard cut: the Wind speaks
    { t: 12.6, s: 0, x: 335, y: 655, z: 2.08 },
    { t: 13.5, s: 1, x: 540, y: 960, z: 1 },             // scroll: the gale
    { t: 15.0, s: 1, x: 560, y: 940, z: 1.06 },
    { t: 17.9, s: 1, x: 420, y: 760, z: 1.45 },          // push toward the blowing face
    { t: 18.2, s: 1, x: 640, y: 1180, z: 2.0, cut: 1 },  // hard cut: the man holding his cloak
    { t: 22.05, s: 1, x: 620, y: 1175, z: 2.2 },
    { t: 22.1, s: 1, x: 620, y: 1120, z: 2.9, cut: 1 },  // ma: close on the gripping hands
    { t: 22.9, s: 1, x: 350, y: 640, z: 1.9, cut: 1 },   // the Wind, out of breath
    { t: 24.8, s: 1, x: 352, y: 645, z: 1.95 },
    { t: 25.6, s: 2, x: 540, y: 960, z: 1 },             // scroll: the sun
    { t: 27.0, s: 2, x: 700, y: 660, z: 1.5 },           // tilt up to the Sun
    { t: 28.8, s: 2, x: 705, y: 665, z: 1.55 },
    { t: 30.2, s: 2, x: 560, y: 1170, z: 1.8 },          // down to the warm traveler
    { t: 35.3, s: 2, x: 540, y: 1160, z: 1.9 },
    { t: 36.4, s: 2, x: 540, y: 960, z: .9, ease: 'out' },
  ],
  extraEvents(add) {
    add('amb', 0, { w: 'spring', d: 13.2 });
    add('amb', 12.9, { w: 'high', d: 10.2 });
    add('amb', 25.0, { w: 'cicada', d: 10.6 });
    for (let t = 0.4; t < 12.8; t += .72) add('step', t, { m: 'dirt', v: .3 });
    for (const t of [13.7, 15.2, 16.6, 18.3, 19.9, 21.2]) add('gust', t, { v: 1 });
    for (let t = 25.8; t < 30.5; t += .8) add('step', t, { m: 'dirt', v: .3 });
    add('fan', 30.7); add('thud', 33.6, { v: .25 });
  },
};
