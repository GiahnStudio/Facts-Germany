// The Lost Horse (塞翁失馬) — timeline. Sheets: 0 farm in autumn · 1 the same farm in spring (alternate impression) · 2 the fall · 3 the soldiers
export const CFG = {
  DUR: 51.0,
  TAG: 'Tales in Ink · Fable 03',
  SERIES: '墨話',
  HOOK: { lines: ['His only horse ran away.', 'Bad luck?'], t: [0, 3.2] },
  PRINT: [
    [0, 0, 0, 0],
    [8.0, 8.25, 8.5, 8.75],
    [17.1, 17.3, 17.5, 17.7],
    [25.2, 25.4, 25.6, 25.8],
  ],
  CART: [[0, 0], [9.3, 9.7], [18.4, 18.8], [26.6, 27.0]],
  CARTTXT: ['一 失馬', '二 得馬', '三 落馬', '四 兵'],
  SEALS: ['馬', '春', '落', '兵'],
  SUB_SEAL: '翁',
  VO: { L01: 0.3, L02: 3.6, L03: 8.6, L04: 12.9, L05: 17.7, L06: 22.7, L07: 25.8, L08: 29.8, L09: 34.3, L10: 37.3 },
  NO_SUB: ['L10'],
  MORAL: { wash: [36.4, 37.0], t: 36.9, sealT: 39.6, seal: '翁', big: ['Good luck, bad luck —', 'who knows?'], small: ['Wait before you judge the day.'] },
  LOOP: { cut: 50.5 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 3.4, s: 0, x: 520, y: 1000, z: 1.08 },
    { t: 4.6, s: 0, x: 470, y: 1120, z: 1.55 },        // push to the gate: neighbours and the farmer
    { t: 7.7, s: 0, x: 480, y: 1120, z: 1.6 },
    { t: 8.5, s: 1, x: 540, y: 960, z: 1 },             // scroll: the same farm, spring
    { t: 12.6, s: 1, x: 520, y: 1020, z: 1.12 },
    { t: 13.6, s: 1, x: 470, y: 1120, z: 1.55 },
    { t: 16.9, s: 1, x: 480, y: 1110, z: 1.6 },
    { t: 17.6, s: 2, x: 540, y: 900, z: 1.05 },         // scroll: the wild horse rears
    { t: 20.6, s: 2, x: 540, y: 880, z: 1.05 },
    { t: 21.5, s: 2, x: 330, y: 1150, z: 2.0, ease: 'in' }, // follow the fall
    { t: 22.7, s: 2, x: 330, y: 1160, z: 2.1, cut: 1 },
    { t: 24.9, s: 2, x: 330, y: 1160, z: 2.15 },
    { t: 25.7, s: 3, x: 540, y: 960, z: 1 },            // scroll: soldiers on the road
    { t: 29.6, s: 3, x: 540, y: 980, z: 1.04 },
    { t: 31.4, s: 3, x: 290, y: 1010, z: 1.9 },         // push to the window: the boy they leave behind
    { t: 34.2, s: 3, x: 290, y: 1010, z: 1.95 },
    { t: 36.4, s: 3, x: 540, y: 960, z: .9, ease: 'out' }, // pull back
  ],
  extraEvents(add) {
    // hooves
    for (let t = 0.1; t < 3.4; t += .19) add('hoof', t, { v: lerp(1, .3, t / 3.4) });
    for (let t = 9.0; t < 12.4; t += .55) add('hoof', t, { v: .5 }), add('hoof', t + .14, { v: .4 });
    add('neigh', 18.5, { v: 1 }); add('hoof', 18.4, { v: .9 }); add('hoof', 19.9, { v: 1 }); add('thud', 21.35, { v: 1 });
    add('amb', 0, { w: 'autumn', d: 8.5 });
    add('amb', 8.0, { w: 'spring', d: 9.3 });
    add('amb', 17.1, { w: 'quarry', d: 8.4 });
    add('amb', 25.2, { w: 'quarry', d: 11.2 });
    for (let t = 25.9; t < 33.3; t += .5) add('step', t, { m: 'dirt', v: .5 });
    add('geese', 9.6);
  },
};
function lerp(a, b, u) { return a + (b - a) * u; }
