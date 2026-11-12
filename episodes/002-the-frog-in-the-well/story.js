// The Frog in the Well — timeline (single source of truth). Sheets: 0 well · 1 sea · 2 the climb (cut-away) · 3 the open sky
export const CFG = {
  DUR: 45.0,
  TAG: 'Tales in Ink · Fable 02',
  SERIES: '墨話',
  HOOK: { lines: ['He thought he had seen', 'the whole sky.'], t: [0, 3.0] },
  PRINT: [
    [0, 0, 0, 0],
    [20.7, 20.95, 21.2, 21.45],
    [29.1, 29.3, 29.5, 29.7],
    [0, 0, 0, 0],
  ],
  CART: [[0, 0], [22.4, 22.8], [30.2, 30.6], [36.6, 37.0]],
  CARTTXT: ['一 井', '二 海', '三 登', '四 天'],
  SEALS: ['井', '海', '登', '天'],
  SUB_SEAL: '蛙',
  VO: { L01: 0.3, L02: 3.3, L03: 6.4, L04: 10.6, L05: 13.1, L06: 16.8, L07: 21.0, L08: 23.9, L09: 29.0, L10: 35.0, L11: 39.0 },
  NO_SUB: ['L11'],
  MORAL: { wash: [38.2, 38.9], t: 38.7, sealT: 41.4, seal: '井', big: ['Your sky is only', 'as big as your well.'], small: ['Climb out.'] },
  LOOP: { cut: 44.45 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 2.6, s: 0, x: 540, y: 1000, z: 1.12 },
    { t: 5.4, s: 0, x: 540, y: 640, z: 1.55 },          // tilt up: his circle of sky
    { t: 6.4, s: 0, x: 540, y: 640, z: 1.55 },
    { t: 7.5, s: 0, x: 545, y: 1150, z: 1.6 },          // back down to the frog
    { t: 10.5, s: 0, x: 545, y: 1170, z: 1.66 },
    { t: 11.6, s: 0, x: 540, y: 620, z: 1.9 },          // the turtle at the rim
    { t: 16.6, s: 0, x: 540, y: 600, z: 2.0 },
    { t: 16.8, s: 0, x: 560, y: 1220, z: 2.2, cut: 1 }, // hard cut: the frog laughs
    { t: 20.4, s: 0, x: 560, y: 1220, z: 2.25 },
    { t: 21.2, s: 1, x: 540, y: 760, z: 1.25 },         // scroll: the sea he is told of
    { t: 24.0, s: 1, x: 540, y: 760, z: 1.25 },
    { t: 28.2, s: 1, x: 540, y: 1460, z: 1.25 },        // tilt down: deeper than mountains
    { t: 28.4, s: 1, x: 540, y: 1460, z: 1.25 },
    { t: 29.1, s: 2, x: 540, y: 1480, z: 1.8 },         // scroll: the cut-away well
    { t: 29.6, s: 2, x: 540, y: 1480, z: 1.8 },
    { t: 33.4, s: 2, x: 540, y: 640, z: 1.8, ease: 'lin' }, // tilt up with the climb
    { t: 33.6, s: 2, x: 540, y: 600, z: 1.8 },
    { t: 33.65, s: 3, x: 540, y: 1290, z: 3.4, cut: 1 }, // hard cut to the rim, then the reveal
    { t: 34.3, s: 3, x: 540, y: 1290, z: 3.4 },
    { t: 38.2, s: 3, x: 540, y: 960, z: .86, ease: 'out' },
    { t: 44.0, s: 3, x: 540, y: 960, z: .84 },
  ],
  extraEvents(add) {
    // drips in the well, croaks, the turtle, the sea, the climb, the reveal
    [0.15, 2.4, 5.1, 8.9, 12.2, 15.4, 19.1].forEach(t => add('drip', t, { v: .8 }));
    add('croak', 1.6, { v: .7 }); add('croak', 9.6, { v: .8 }); add('croak', 17.0, { v: 1 }); add('croak', 17.5, { v: .9 }); add('croak', 18.0, { v: .8 });
    add('splash', 10.7, { v: .5 });
    add('amb', 0, { w: 'well', d: 21.0 });
    add('amb', 20.6, { w: 'sea', d: 8.4 });
    add('amb', 28.6, { w: 'earth', d: 4.9 });
    for (let t = 29.7; t < 33.4; t += .46) add('step', t, { m: 'stone', v: .5 });
    add('amb', 33.65, { w: 'high', d: 10.3 });
    add('geese', 35.5);
  },
};
