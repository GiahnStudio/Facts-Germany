// The Golden Crack (an original fable about kintsugi, 金継ぎ, set in old Japan) — timeline.
// Sheets: 0 the garden in rain · 1 the workshop (days pass) · 2 the mended bowl, close (the gold block) · 3 the garden after rain (alternate impression of 0)
export const CFG = {
  DUR: 45.0,
  TAG: 'Tales in Ink · Fable 07',
  SERIES: '墨話',
  HOOK: { lines: ['He broke his master’s bowl.', 'Now what?'], t: [0, 3.2] },
  PRINT: [
    [0, 0, 0, 0],
    [13.0, 13.25, 13.5, 13.75],
    [30.65, 30.9, 31.15, 31.4],
    [34.6, 34.8, 35.0, 35.2],
  ],
  CART: [[0, 0], [14.3, 14.7], [31.9, 32.3], [35.8, 36.2]],
  CARTTXT: ['一 雨庭', '二 継', '三 金', '四 茶'],
  SEALS: ['碗', '継', '金', '茶'],
  SUB_SEAL: '金',
  VO: { L01: 0.3, L02: 5.0, L03: 9.55, L04: 13.2, L05: 17.75, L06: 21.55, L07: 25.9, L08: 30.9, L09: 34.9, L10: 40.3 },
  NO_SUB: ['L10'],
  WALK: [5.0, 10.3], SLIP: 10.3, HIT: 11.75,
  GATHER: [18.3, 21.0],          // the shards slide together on the table
  GOLD: [21.9, 29.6, 33.6],      // gold seams: 0 → .62 in the workshop, .62 → 1 on the close print
  DAYS: [21.7, 25.7],
  MA: [29.85, 30.65],
  MORAL: { wash: [39.4, 40.0], t: 39.9, sealT: 44.05, seal: '金', big: ['Your cracks are', 'not your end.'], small: ['Mend them in gold.'] },
  LOOP: { cut: 44.5 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 4.6, s: 0, x: 540, y: 990, z: 1.05 },
    { t: 5.6, s: 0, x: 380, y: 1080, z: 1.4 },            // push in on the apprentice with the bowl
    { t: 10.0, s: 0, x: 560, y: 1080, z: 1.42, ease: 'lin' }, // track him across the stones
    { t: 11.7, s: 0, x: 600, y: 1100, z: 1.3 },
    { t: 11.75, s: 0, x: 640, y: 1240, z: 2.3, cut: 1 },   // hard cut close: the shards
    { t: 12.8, s: 0, x: 640, y: 1235, z: 2.35 },
    { t: 13.6, s: 1, x: 540, y: 960, z: 1 },               // scroll: the workshop
    { t: 14.6, s: 1, x: 420, y: 1010, z: 1.15 },
    { t: 16.6, s: 1, x: 330, y: 1020, z: 1.45 },           // push to the bowing apprentice
    { t: 17.6, s: 1, x: 335, y: 1022, z: 1.46 },
    { t: 19.0, s: 1, x: 640, y: 1060, z: 1.45 },           // pan to the potter and the shards
    { t: 21.2, s: 1, x: 645, y: 1062, z: 1.48 },
    { t: 22.6, s: 1, x: 540, y: 860, z: 1.0 },             // pull back + tilt up: suns and moons in the window
    { t: 25.6, s: 1, x: 540, y: 900, z: 1.02 },
    { t: 27.0, s: 1, x: 330, y: 1020, z: 1.42 },           // push to the boy asking
    { t: 29.8, s: 1, x: 335, y: 1020, z: 1.45 },
    { t: 29.85, s: 1, x: 556, y: 1095, z: 2.6, cut: 1 },   // ma: hard cut close on the half-mended bowl
    { t: 30.65, s: 1, x: 558, y: 1096, z: 2.62 },
    { t: 31.4, s: 2, x: 540, y: 960, z: 1 },               // scroll: the bowl, close
    { t: 34.3, s: 2, x: 540, y: 910, z: 1.28 },            // slow push while the gold is printed
    { t: 35.3, s: 3, x: 540, y: 960, z: 1 },               // scroll: the garden after the rain
    { t: 36.0, s: 3, x: 560, y: 980, z: 1.04 },
    { t: 37.4, s: 3, x: 820, y: 1080, z: 1.75 },           // push to the bowl offered to the guest
    { t: 38.6, s: 3, x: 822, y: 1082, z: 1.78 },
    { t: 39.6, s: 3, x: 540, y: 960, z: .92, ease: 'out' }, // pull back
  ],
  extraEvents(add) {
    add('amb', 0, { w: 'rain', d: 13.0 });
    add('amb', 13.0, { w: 'earth', d: 16.8 });
    add('amb', 30.65, { w: 'high', d: 4.0 });
    add('amb', 34.6, { w: 'spring', d: 5.0 });
    for (let t = 5.15; t < 10.2; t += .5) add('step', t, { m: 'wood', v: .35 });
    add('step', 10.3, { m: 'wood', v: .8 });
    add('thud', 10.9, { v: .7 });
    add('shatter', 11.75, { v: 1 });
    for (const t of [18.4, 18.95, 19.5, 20.1, 20.6]) add('chink', t, { v: .5 });
    for (const t of [22.2, 23.3, 24.4, 25.5, 26.6, 27.7, 28.8]) add('brush', t, { v: .5 });
    add('chime', 31.6, { v: .6 });
    add('pour', 37.2, { v: .6 });
    add('cup', 38.4, { v: .5 });
  },
};
