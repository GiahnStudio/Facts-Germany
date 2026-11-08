// The Two Monks and the River (Zen) — timeline. Sheets: 0 the flooded river · 1 the crossing · 2 the road by day · 3 the same road at nightfall (alternate impression)
export const CFG = {
  DUR: 44.1,
  TAG: 'Tales in Ink · Fable 04',
  SERIES: '墨話',
  HOOK: { lines: ['Monks must not touch women.', 'So why did he carry her?'], t: [0, 3.2] },
  PRINT: [
    [0, 0, 0, 0],
    [10.6, 10.85, 11.1, 11.35],
    [19.5, 19.7, 19.9, 20.1],
    [27.3, 27.5, 27.7, 27.9],
  ],
  CART: [[0, 0], [12.0, 12.4], [21.0, 21.4], [28.9, 29.3]],
  CARTTXT: ['一 川', '二 水', '三 道', '四 夜'],
  SEALS: ['川', '水', '怒', '月'],
  SUB_SEAL: '僧',
  VO: { L01: 0.3, L02: 3.75, L03: 7.55, L04: 11.0, L05: 15.25, L06: 20.0, L07: 24.3, L08: 27.8, L09: 32.5, L10: 36.4, L11: 39.1 },
  NO_SUB: ['L11'],
  MA: [31.7, 32.5],
  MORAL: { wash: [38.5, 39.1], t: 39.0, sealT: 41.6, seal: '空', big: ['Put down', 'what you carry.'], small: ['The river is already behind you.'] },
  LOOP: { cut: 43.6 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 3.5, s: 0, x: 580, y: 1010, z: 1.08 },
    { t: 4.7, s: 0, x: 770, y: 1170, z: 1.7 },           // push to the woman on the bank
    { t: 7.3, s: 0, x: 780, y: 1170, z: 1.75 },
    { t: 8.4, s: 0, x: 930, y: 1150, z: 1.6 },           // slide to the two monks
    { t: 10.3, s: 0, x: 935, y: 1145, z: 1.62 },
    { t: 11.0, s: 1, x: 540, y: 960, z: 1 },             // scroll: the crossing
    { t: 12.2, s: 1, x: 760, y: 1090, z: 1.35 },
    { t: 15.6, s: 1, x: 320, y: 1090, z: 1.35, ease: 'lin' }, // follow him through the water
    { t: 17.0, s: 1, x: 260, y: 1100, z: 1.5 },
    { t: 19.2, s: 1, x: 250, y: 1100, z: 1.52 },
    { t: 20.0, s: 2, x: 540, y: 960, z: 1 },             // scroll: the long road
    { t: 21.6, s: 2, x: 760, y: 1080, z: 1.3 },
    { t: 24.0, s: 2, x: 640, y: 1080, z: 1.3 },
    { t: 26.4, s: 2, x: 700, y: 1060, z: 1.85 },         // push to the young monk and what he carries
    { t: 27.2, s: 2, x: 690, y: 1060, z: 1.88 },
    { t: 27.9, s: 3, x: 540, y: 960, z: 1 },             // scroll: nightfall
    { t: 29.0, s: 3, x: 690, y: 1060, z: 1.7 },
    { t: 31.6, s: 3, x: 700, y: 1060, z: 1.76 },
    { t: 31.7, s: 3, x: 540, y: 1080, z: 1.15, cut: 1 },  // ma: hard cut to the two-shot, stillness
    { t: 32.6, s: 3, x: 540, y: 1080, z: 1.16 },
    { t: 33.9, s: 3, x: 400, y: 1060, z: 1.75 },         // push to the old monk
    { t: 36.3, s: 3, x: 395, y: 1060, z: 1.8 },
    { t: 36.4, s: 3, x: 700, y: 1040, z: 2.05, cut: 1 },  // hard cut: "Why are you still carrying her?"
    { t: 38.4, s: 3, x: 700, y: 1040, z: 2.15 },
    { t: 39.6, s: 3, x: 540, y: 960, z: .9, ease: 'out' },
  ],
  extraEvents(add) {
    add('amb', 0, { w: 'river', d: 11.2 });
    add('amb', 10.6, { w: 'river', d: 9.4 });
    add('amb', 19.5, { w: 'high', d: 8.2 });
    add('amb', 27.3, { w: 'dusk', d: 4.4 });
    add('amb', 32.5, { w: 'dusk', d: 6.4 });
    // monks walking in on the bank
    for (let t = 0.15; t < 3.1; t += .5) add('step', t, { m: 'dirt', v: .45 });
    // wading
    for (let t = 12.5; t < 15.4; t += .42) add('splash', t, { v: .35 + .2 * Math.sin(t * 3) });
    add('splash', 11.8, { v: .5 });
    // the road: two pairs of footsteps, the young monk's getting heavier
    for (let t = 20.2; t < 27.2; t += .5) { add('step', t, { m: 'dirt', v: .4 }); add('step', t + .25, { m: 'dirt', v: Math.min(.9, .35 + (t - 20.2) * .07) }); }
    add('bell', 27.4, { v: .8 });
  },
};
