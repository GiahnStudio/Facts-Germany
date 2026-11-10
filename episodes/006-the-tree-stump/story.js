// The Farmer and the Tree Stump (守株待兎, Han Feizi, moved to old Japan) — timeline.
// Sheets: 0 the field in spring · 1 at the stump, summer · 2 the same view in autumn (alternate impression) · 3 the field at harvest (alternate impression of 0)
export const CFG = {
  DUR: 42.0,
  TAG: 'Tales in Ink · Fable 06',
  SERIES: '墨話',
  HOOK: { lines: ['Dinner ran into his stump.', 'Why work ever again?'], t: [0, 3.2] },
  PRINT: [
    [0, 0, 0, 0],
    [10.6, 10.85, 11.1, 11.35],
    [25.7, 25.95, 26.2, 26.45],
    [30.4, 30.6, 30.8, 31.0],
  ],
  CART: [[0, 0], [11.9, 12.3], [26.9, 27.3], [31.6, 32.0]],
  CARTTXT: ['一 春田', '二 待', '三 秋草', '四 稲'],
  SEALS: ['兎', '待', '秋', '稲'],
  SUB_SEAL: '田',
  VO: { L01: 0.3, L02: 4.2, L03: 7.1, L04: 11.3, L05: 15.3, L06: 19.6, L07: 22.5, L08: 26.2, L09: 31.2, L10: 36.5 },
  NO_SUB: ['L10'],
  RUN0: 4.4, HIT: 8.6, SIT: 16.6,
  DAYS: [19.5, 22.3], WEEKS: [22.4, 24.9],
  MA: [24.9, 25.7],
  MORAL: { wash: [35.6, 36.2], t: 36.1, sealT: 40.3, seal: '田', big: ['Luck visits once.', 'Work feeds you daily.'], small: ['Don’t wait by the stump.'] },
  LOOP: { cut: 41.5 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 3.4, s: 0, x: 540, y: 980, z: 1.04 },
    { t: 4.8, s: 0, x: 720, y: 1170, z: 1.45 },          // push: the hare races toward the stump
    { t: 8.55, s: 0, x: 720, y: 1180, z: 1.55 },
    { t: 8.6, s: 0, x: 760, y: 1200, z: 2.1, cut: 1 },   // hard cut close at the impact
    { t: 10.4, s: 0, x: 760, y: 1200, z: 2.15 },
    { t: 11.2, s: 1, x: 540, y: 960, z: 1 },             // scroll: at the stump, summer
    { t: 12.4, s: 1, x: 580, y: 990, z: 1.08 },
    { t: 13.8, s: 1, x: 680, y: 960, z: 1.45 },          // push to the laughing farmer
    { t: 15.3, s: 1, x: 685, y: 965, z: 1.48 },
    { t: 16.4, s: 1, x: 560, y: 1000, z: 1.06 },         // pull back: he sits down
    { t: 19.4, s: 1, x: 540, y: 900, z: 1.0 },           // tilt up: suns and moons race over
    { t: 24.85, s: 1, x: 560, y: 880, z: 1.04, ease: 'lin' },
    { t: 24.9, s: 1, x: 720, y: 980, z: 1.9, cut: 1 },   // ma: hard cut close on the waiting man
    { t: 25.7, s: 1, x: 722, y: 982, z: 1.92 },
    { t: 26.4, s: 2, x: 540, y: 960, z: 1 },             // scroll: the same view, autumn
    { t: 28.0, s: 2, x: 560, y: 1000, z: 1.08 },
    { t: 29.6, s: 2, x: 620, y: 1170, z: 1.6 },          // push down to the empty bowl
    { t: 30.4, s: 2, x: 622, y: 1172, z: 1.62 },
    { t: 31.2, s: 3, x: 540, y: 960, z: 1 },             // scroll: harvest in the neighbours' field
    { t: 32.6, s: 3, x: 560, y: 990, z: 1.06 },
    { t: 34.0, s: 3, x: 790, y: 1170, z: 1.8 },          // push to the man in the weeds
    { t: 35.5, s: 3, x: 792, y: 1172, z: 1.85 },
    { t: 36.6, s: 3, x: 540, y: 960, z: .9, ease: 'out' }, // pull back
  ],
  extraEvents(add) {
    add('amb', 0, { w: 'spring', d: 11.0 });
    add('amb', 10.6, { w: 'cicada', d: 14.3 });
    add('amb', 25.7, { w: 'autumn', d: 5.0 });
    add('amb', 30.4, { w: 'dusk', d: 5.4 });
    // the hoe biting into the soil
    for (const t of [1.07, 2.5, 3.93]) add('thud', t, { v: .3 });
    // the hare's feet, then the impact
    for (let t = 4.5; t < 8.55; t += .16) add('step', t, { m: 'dirt', v: .22 + .15 * (t - 4.5) / 4 });
    add('thud', 8.6, { v: 1 });
    add('step', 16.5, { m: 'dirt', v: .5 }); add('thud', 16.7, { v: .35 });
    add('geese', 26.1);
    for (let t = 31.3; t < 35.4; t += .5) add('step', t, { m: 'dirt', v: .4 });
  },
};
