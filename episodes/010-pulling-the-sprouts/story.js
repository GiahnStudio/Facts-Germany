// Pulling the Sprouts (Mencius, moved to an old Japanese rice village, retold in original words) — timeline (narration clock; the film runs on the song, see engine/film.js).
// Sheets: 0 the paddy at dawn · 1 the same paddy by moonlight · 2 sunrise (the sprouts wilt) · 3 rain (new sprouts, left alone) — four impressions of one block set
export const CFG = {
  DUR: 50.4,
  TAG: 'Tales in Ink · Fable 10',
  SERIES: '墨話',
  HOOK: { lines: ['His rice grew too slow.', 'So he pulled on it.'], t: [0, 3.2] },
  // scene changes sit in the tail of the previous sung line (its held last note), so the scroll gets real time in the song
  PRINT: [
    [0, 0, 0, 0],
    [14.9, 15.05, 16.3, 16.5],
    [23.75, 23.95, 25.1, 25.3],
    [39.55, 39.75, 40.9, 41.1],
  ],
  CART: [[0, 0], [16.9, 17.3], [25.7, 26.1], [41.5, 41.9]],
  CARTTXT: ['一 春田', '二 月夜', '三 朝日', '四 雨'],
  SEALS: ['田', '月', '根', '雨'],
  SUB_SEAL: '芽',
  VO: { L01: 0.3, L02: 4.6, L03: 8.3, L04: 11.6, L05: 16.2, L06: 20.3, L07: 25.0, L08: 28.8, L09: 32.5, L10: 36.5, L11: 40.8, L12: 44.9 },
  NO_SUB: ['L12'],
  WALK: [0, 7.6],                // the farmer wades along his rows
  KNEEL: [8.3, 11.4], CRY: 11.6,
  PULL: [16.6, 23.3],            // by moonlight: every sprout a little higher
  RUN: [28.8, 30.6],             // the boy runs out
  MA: [30.9, 32.4],
  WILT: 30.9,                    // the sun is up: blade after blade folds over
  COME: 36.5,                    // the farmer comes and sees
  MORAL: { wash: [43.7, 44.2], t: 44.9, sealT: 48.0, seal: '待', big: ['You cannot hurry', 'what must grow.'], small: ['Give it water, give it light. Then wait.'] },
  LOOP: { cut: 49.9 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 3.2, s: 0, x: 540, y: 940, z: 1.04 },
    { t: 4.5, s: 0, x: 640, y: 1180, z: 1.5 },            // push in on the farmer among his rows
    { t: 8.1, s: 0, x: 560, y: 1190, z: 1.6 },
    { t: 8.3, s: 0, x: 560, y: 1230, z: 2.2, cut: 1 },    // hard cut: kneeling, measuring one sprout
    { t: 11.4, s: 0, x: 545, y: 1235, z: 2.35 },
    { t: 11.6, s: 0, x: 640, y: 1130, z: 1.6, cut: 1 },   // hard cut: too slow!
    { t: 14.4, s: 0, x: 540, y: 980, z: 1.08 },           // pull back
    { t: 14.5, s: 0, x: 540, y: 980, z: 1.08 },
    { t: 16.2, s: 1, x: 540, y: 960, z: 1 },              // scroll: moonlight
    { t: 16.6, s: 1, x: 540, y: 960, z: 1 },
    { t: 20.1, s: 1, x: 660, y: 760, z: 1.4 },            // tilt up: the moon over the sleeping hut
    { t: 20.3, s: 1, x: 650, y: 1230, z: 1.9, cut: 1 },   // hard cut: the hands in the mud
    { t: 23.3, s: 1, x: 345, y: 1230, z: 1.9, ease: 'lin' }, // travel left with him along the row
    { t: 23.4, s: 1, x: 345, y: 1230, z: 1.9 },
    { t: 25.0, s: 2, x: 540, y: 960, z: 1 },              // scroll: sunrise
    { t: 25.5, s: 2, x: 540, y: 960, z: 1 },
    { t: 28.5, s: 2, x: 370, y: 960, z: 1.8 },            // push to father and son at the hut
    { t: 28.8, s: 2, x: 480, y: 1010, z: 1.7, cut: 1 },   // hard cut: the boy runs
    { t: 30.7, s: 2, x: 740, y: 1010, z: 1.7, ease: 'lin' },
    { t: 30.9, s: 2, x: 540, y: 960, z: 1, cut: 1 },      // ma: the whole print, nothing moves but the blades
    { t: 32.4, s: 2, x: 540, y: 960, z: 1 },
    { t: 32.5, s: 2, x: 600, y: 1230, z: 1.9, cut: 1 },   // hard cut: withered
    { t: 36.3, s: 2, x: 570, y: 1250, z: 2.2 },
    { t: 36.5, s: 2, x: 520, y: 1150, z: 1.45, cut: 1 },  // the farmer among them
    { t: 39.1, s: 2, x: 540, y: 1010, z: 1.3 },           // ease back and up: the morning sky over the ruined field
    { t: 39.2, s: 2, x: 540, y: 1010, z: 1.3 },
    { t: 40.8, s: 3, x: 540, y: 960, z: 1 },              // scroll: rain
    { t: 41.3, s: 3, x: 540, y: 960, z: 1 },
    { t: 43.6, s: 3, x: 590, y: 1080, z: 1.4 },           // push: the two of them, waiting
    { t: 45.2, s: 3, x: 540, y: 960, z: .92, ease: 'out' },
  ],
  extraEvents(add) {
    add('amb', 0, { w: 'spring', d: 21.5 });           // d is in song seconds (starts are warped, lengths are not)
    add('amb', 14.9, { w: 'dusk', d: 10.6 });
    add('amb', 23.75, { w: 'spring', d: 21.6 });
    add('amb', 39.55, { w: 'rain', d: 14 });
    for (let t = 0.5; t < 7.5; t += .9) add('splash', t, { v: .22 });
    for (const t of [16.9, 19.2, 22.6]) add('croak', t, { v: .5 });
    for (let t = 16.8; t < 23.2; t += .66) add('drip', t, { v: .45 });
    for (let t = 28.9; t < 30.6; t += .2) add('step', t, { m: 'dirt', v: .35 });
    add('bell', 32.5, { v: .5 });
    add('thud', 38.8, { v: .3 });
    for (const t of [41.6, 42.3, 43.0]) add('drip', t, { v: .5 });
  },
};
