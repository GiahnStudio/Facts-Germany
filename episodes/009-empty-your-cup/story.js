// Empty Your Cup (a Zen teaching story, retold in original words) — timeline (narration clock; the film runs on the song, see engine/film.js).
// Sheets: 0 the mountain hermitage · 1 the tea room (the scholar's words fill the air) · 2 the cup, close (the tea leaves the print) · 3 the tea room at dusk (alternate impression of 1)
export const CFG = {
  DUR: 50.6,
  TAG: 'Tales in Ink · Fable 09',
  SERIES: '墨話',
  HOOK: { lines: ['He knew everything.', 'So why the spilled tea?'], t: [0, 3.2] },
  PRINT: [
    [0, 0, 0, 0],
    [9.2, 9.4, 9.6, 9.8],
    [17.3, 17.5, 17.7, 17.9],
    [33.1, 33.3, 33.5, 33.7],
  ],
  CART: [[0, 0], [10.3, 10.7], [18.4, 18.8], [34.2, 34.6]],
  CARTTXT: ['一 山寺', '二 言葉', '三 満', '四 空'],
  SEALS: ['学', '言', '茶', '空'],
  SUB_SEAL: '茶',
  VO: { L01: 0.3, L02: 4.9, L03: 9.9, L04: 13.4, L05: 18.0, L06: 21.3, L07: 24.3, L08: 28.5, L09: 33.8, L10: 37.1, L11: 40.7, L12: 45.0 },
  NO_SUB: ['L12'],
  WALK: [0, 8.6],                 // the scholar climbs to the door
  TALK: [10.0, 16.6],             // his words fill the room
  KETTLE: 13.6,
  FILL: [18.2, 20.9], OVER: [21.3, 24.0], RUN: [24.3, 27.6], STOP: 28.5,
  MA: [32.1, 32.9],
  POINT: 33.9, FALL: 40.9, BOW: 42.4,
  MORAL: { wash: [44.2, 44.8], t: 44.8, sealT: 48.4, seal: '空', big: ['Empty your cup,', 'and let the world', 'pour in.'], small: ['A full mind has no room to learn.'] },
  LOOP: { cut: 50.1 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 3.2, s: 0, x: 540, y: 930, z: 1.04 },
    { t: 4.6, s: 0, x: 620, y: 1100, z: 1.5 },            // push in on the scholar and his tower of books
    { t: 4.9, s: 0, x: 400, y: 1090, z: 1.6, cut: 1 },    // hard cut: the master's door
    { t: 8.8, s: 0, x: 380, y: 1080, z: 1.7 },
    { t: 9.8, s: 1, x: 540, y: 960, z: 1 },               // scroll: the tea room
    { t: 10.4, s: 1, x: 540, y: 960, z: 1 },
    { t: 13.1, s: 1, x: 440, y: 950, z: 1.3 },            // push toward the talking scholar
    { t: 13.4, s: 1, x: 780, y: 1010, z: 1.9, cut: 1 },   // hard cut: the master only smiles
    { t: 16.9, s: 1, x: 770, y: 1030, z: 2.0 },
    { t: 17.9, s: 2, x: 540, y: 960, z: 1 },              // scroll: the cup
    { t: 18.3, s: 2, x: 540, y: 960, z: 1 },
    { t: 21.0, s: 2, x: 545, y: 860, z: 1.4 },            // slow push to the rim
    { t: 21.3, s: 2, x: 545, y: 860, z: 1.4 },
    { t: 24.1, s: 2, x: 540, y: 990, z: 1.3 },            // tilt down with the overflow
    { t: 27.6, s: 2, x: 250, y: 1120, z: 1.25 },          // follow the tea left, out of the print
    { t: 28.4, s: 2, x: 250, y: 1120, z: 1.25 },
    { t: 28.5, s: 2, x: 330, y: 760, z: 1.55, cut: 1 },   // hard cut: Stop!
    { t: 32.05, s: 2, x: 335, y: 765, z: 1.6 },
    { t: 32.1, s: 2, x: 540, y: 960, z: 1, cut: 1 },      // ma: the whole print, one last drop
    { t: 32.9, s: 2, x: 540, y: 960, z: 1 },
    { t: 33.7, s: 3, x: 540, y: 960, z: 1 },              // scroll: dusk
    { t: 34.2, s: 3, x: 540, y: 960, z: 1 },
    { t: 36.8, s: 3, x: 740, y: 1010, z: 1.6 },           // push to the master and the cup
    { t: 37.1, s: 3, x: 350, y: 950, z: 1.45, cut: 1 },   // hard cut: a head full of words
    { t: 40.5, s: 3, x: 355, y: 945, z: 1.52 },
    { t: 40.7, s: 3, x: 420, y: 950, z: 1.3, cut: 1 },
    { t: 44.0, s: 3, x: 540, y: 960, z: 1 },              // pull back as the words fall
    { t: 45.2, s: 3, x: 540, y: 960, z: .92, ease: 'out' },
  ],
  extraEvents(add) {
    add('amb', 0, { w: 'spring', d: 9.4 });
    add('amb', 9.2, { w: 'earth', d: 24 });
    add('amb', 33.1, { w: 'dusk', d: 11.5 });
    for (let t = 0.4; t < 8.4; t += .72) add('step', t, { m: 'dirt', v: .3 });
    add('spill', 18.2, { d: 9.2, v: .5 });
    for (const t of [27.7, 28.4, 29.2, 30.1, 31.1, 32.45]) add('drip', t, { v: .7 });
    add('bell', 33.9, { v: .5 });
    for (let k = 0; k < 6; k++) add('thud', 41.2 + k * .25, { v: .12 });
  },
};
