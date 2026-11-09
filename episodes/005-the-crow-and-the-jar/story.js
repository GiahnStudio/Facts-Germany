// The Crow and the Water Jar (Aesop, moved to old Japan) — timeline. Sheets: 0 the drought · 1 the jar in the courtyard · 2 looking down into the jar (top view) · 3 the courtyard at evening (alternate impression)
export const CFG = {
  DUR: 44.5,
  TAG: 'Tales in Ink · Fable 05',
  SERIES: '墨話',
  HOOK: { lines: ['Water, too deep to reach.', 'How does a crow drink?'], t: [0, 3.2] },
  PRINT: [
    [0, 0, 0, 0],
    [7.2, 7.45, 7.7, 7.95],
    [22.8, 23.05, 23.3, 23.55],
    [35.0, 35.2, 35.4, 35.6],
  ],
  CART: [[0, 0], [8.6, 9.0], [24.0, 24.4], [36.1, 36.5]],
  CARTTXT: ['一 夏', '二 壺', '三 石', '四 満'],
  SEALS: ['日', '壺', '石', '水'],
  SUB_SEAL: '鳥',
  VO: { L01: 0.3, L02: 3.85, L03: 7.6, L04: 11.35, L05: 15.55, L06: 20.25, L07: 23.25, L08: 26.95, L09: 32.3, L10: 35.4, L11: 38.5 },
  NO_SUB: ['L11'],
  MA: [31.5, 32.3],
  // pebbles dropped into the jar (sheet 2); the last one after the ma
  DROPS: [23.55, 24.55, 25.55, 26.5, 27.2, 27.85, 28.45, 29.0, 29.5, 29.95, 30.35, 30.75, 31.1, 32.45],
  MORAL: { wash: [37.9, 38.5], t: 38.4, sealT: 41.2, seal: '忍', big: ['Little by little,', 'the water rises.'], small: ['Patience is a kind of strength.'] },
  LOOP: { cut: 44.0 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 3.4, s: 0, x: 540, y: 980, z: 1.04 },
    { t: 5.9, s: 0, x: 560, y: 1250, z: 1.55 },          // tilt + push down to the cracked field
    { t: 6.9, s: 0, x: 565, y: 1255, z: 1.57 },
    { t: 7.6, s: 1, x: 540, y: 960, z: 1 },              // scroll: the courtyard
    { t: 9.4, s: 1, x: 530, y: 990, z: 1.1 },
    { t: 12.4, s: 1, x: 500, y: 900, z: 1.8 },           // push to the mouth of the jar
    { t: 14.9, s: 1, x: 505, y: 905, z: 1.84 },
    { t: 16.1, s: 1, x: 560, y: 960, z: 1.38 },          // pull back: she pushes, she pecks
    { t: 19.7, s: 1, x: 575, y: 950, z: 1.44 },
    { t: 21.5, s: 1, x: 750, y: 1170, z: 1.7 },          // slide down to the pebbles
    { t: 22.6, s: 1, x: 752, y: 1175, z: 1.72 },
    { t: 23.25, s: 2, x: 540, y: 960, z: 1 },            // scroll: looking down into the jar
    { t: 31.45, s: 2, x: 540, y: 925, z: 1.26, ease: 'lin' },
    { t: 31.5, s: 2, x: 540, y: 900, z: 1.62, cut: 1 },  // ma: hard cut close on the water, stillness
    { t: 32.3, s: 2, x: 540, y: 900, z: 1.63 },
    { t: 34.7, s: 2, x: 540, y: 930, z: 1.05 },          // pull out as the water rises
    { t: 35.4, s: 3, x: 540, y: 960, z: 1 },             // scroll: evening, she drinks
    { t: 37.3, s: 3, x: 520, y: 900, z: 1.55 },
    { t: 38.4, s: 3, x: 520, y: 900, z: 1.58 },
    { t: 39.8, s: 3, x: 540, y: 960, z: .9, ease: 'out' },
  ],
  extraEvents(add) {
    add('amb', 0, { w: 'heat', d: 7.8 });
    add('amb', 7.2, { w: 'cicada', d: 15.8 });
    add('amb', 22.8, { w: 'well', d: 8.8 });
    add('amb', 32.3, { w: 'well', d: 3.0 });
    add('amb', 35.0, { w: 'dusk', d: 3.6 });
    // wing beats: flying over the field, landing on the rim
    for (let t = 0.2; t < 3.6; t += .42) add('wing', t, { v: .5 });
    for (let t = 7.7; t < 8.8; t += .3) add('wing', t, { v: .7 });
    add('caw', 2.3, { v: .7 }); add('caw', 20.4, { v: .5 });
    // push (scrape) and pecks on the clay
    add('scrape', 15.7, { v: .6 });
    for (const t of [17.75, 18.05, 18.35, 18.65]) add('peck', t, { v: .8 });
    // stones into water: deep plunk in the jar, getting brighter as the water comes up
    CFG.DROPS.forEach((t, i) => add('plunk', t + .32, { v: .55 + .03 * i, k: i / (this.DROPS.length - 1) }));
    add('sip', 36.3, { v: .7 }); add('sip', 37.0, { v: .6 });
  },
};
