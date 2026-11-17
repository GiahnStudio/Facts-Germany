// The Fox and the Persimmons (Aesop's fox and the grapes, moved to an autumn hill in old Japan, retold in original words) — timeline (narration clock; the film runs on the song, see engine/film.js).
// Sheets: 0 the persimmon tree at noon · 1 the same tree at sunset · 2 the same tree at dusk (three impressions of one block set) · 3 the moon, the branch and the crow (close view)
export const CFG = {
  DUR: 50.6,
  TAG: 'Tales in Ink · Fable 11',
  SERIES: '墨話',
  HOOK: { lines: ['He couldn\'t reach the fruit.', 'So he called it sour.'], t: [0, 3.2] },
  // scene changes sit in the tail of the previous sung line (its held last note), so the scroll gets real time in the song
  PRINT: [
    [0, 0, 0, 0],
    [13.3, 13.45, 14.2, 14.3],
    [28.9, 29.05, 29.9, 30.0],
    [38.5, 38.65, 39.1, 39.2],
  ],
  CART: [[0, 0], [15.95, 16.3], [31.75, 32.1], [40.75, 41.1]],
  CARTTXT: ['一 柿木', '二 落日', '三 狐帰', '四 月鴉'],
  SEALS: ['秋', '石', '嘘', '鴉'],
  SUB_SEAL: '柿',
  VO: { L01: 0.3, L02: 4.3, L03: 7.5, L04: 11.4, L05: 15.9, L06: 19.7, L07: 23.7, L08: 27.1, L09: 31.7, L10: 35.9, L11: 40.7, L12: 45.0 },
  NO_SUB: ['L12'],
  WALK: [0, 3.9],                 // the fox trots down the slope
  LOOK: 4.3,                      // he looks up
  REACH: [11.6, 13.0],            // on his hind legs, pawing at the air
  JUMPS: [16.1, 17.2, 18.3, 20.0, 21.6],   // five leaps (the last two with snapping teeth), each ~1 s
  STONE: 23.7, LEAP: 25.0, FALL: 25.7, LAND: 26.4,
  SIT: 27.1,
  MA: [30.1, 31.6],
  RISE: 33.6,                     // he gets up, nose in the air
  AWAY: [35.9, 38.4],             // and trots off, hungry
  CAW: 40.9, PECK: [42.0, 42.45, 42.9],
  MORAL: { wash: [43.1, 43.6], t: 45.0, sealT: 48.2, seal: '実', big: ['It\'s easy', 'to scorn what', 'you cannot reach.'], small: ['The fruit was sweet all along.'] },
  LOOP: { cut: 50.1 },
  CAM: [
    { t: 0, s: 0, x: 540, y: 960, z: 1 },
    { t: 3.2, s: 0, x: 540, y: 950, z: 1.04 },
    { t: 4.3, s: 0, x: 530, y: 940, z: 1.06 },
    { t: 7.1, s: 0, x: 500, y: 900, z: 1.22 },            // slow push: fox below, fruit above
    { t: 7.5, s: 0, x: 600, y: 660, z: 2.2, cut: 1 },     // hard cut: round and gold
    { t: 11.1, s: 0, x: 570, y: 640, z: 2.5 },
    { t: 11.4, s: 0, x: 500, y: 1010, z: 1.3, cut: 1 },   // hard cut: the whole gap between paw and fruit
    { t: 13.0, s: 0, x: 540, y: 965, z: 1.04 },           // ease back
    { t: 13.2, s: 0, x: 540, y: 965, z: 1.04 },
    { t: 14.3, s: 1, x: 540, y: 960, z: 1 },              // scroll: sunset (in the held last note of L04)
    { t: 16.0, s: 1, x: 540, y: 960, z: 1 },
    { t: 19.3, s: 1, x: 440, y: 1000, z: 1.45 },          // push in on the leaping fox
    { t: 19.7, s: 1, x: 430, y: 900, z: 2.1, cut: 1 },    // hard cut: teeth and fruit
    { t: 23.3, s: 1, x: 430, y: 880, z: 2.3 },
    { t: 23.7, s: 1, x: 540, y: 1000, z: 1.5, cut: 1 },   // hard cut: the stone
    { t: 26.7, s: 1, x: 500, y: 1020, z: 1.6 },
    { t: 27.1, s: 1, x: 470, y: 1120, z: 2.0, cut: 1 },   // hard cut: sitting in the leaves
    { t: 28.7, s: 1, x: 520, y: 1000, z: 1.25 },          // pull back: small under the tree
    { t: 28.8, s: 1, x: 520, y: 1000, z: 1.25 },
    { t: 30.0, s: 2, x: 540, y: 960, z: 1 },              // scroll: dusk
    { t: 32.0, s: 2, x: 540, y: 960, z: 1 },
    { t: 33.5, s: 2, x: 460, y: 1100, z: 1.9 },           // push: he speaks
    { t: 35.5, s: 2, x: 440, y: 1090, z: 2.05 },
    { t: 35.9, s: 2, x: 420, y: 1040, z: 1.4, cut: 1 },   // hard cut: off he goes
    { t: 38.3, s: 2, x: 400, y: 1000, z: 1.3, ease: 'lin' },
    { t: 38.4, s: 2, x: 400, y: 1000, z: 1.3 },
    { t: 39.2, s: 3, x: 540, y: 960, z: 1 },              // scroll: the moon and the crow
    { t: 40.9, s: 3, x: 540, y: 960, z: 1 },
    { t: 43.0, s: 3, x: 510, y: 860, z: 1.25 },           // push: the crow eats
    { t: 45.3, s: 3, x: 540, y: 960, z: .92, ease: 'out' },
  ],
  extraEvents(add) {
    add('amb', 0, { w: 'autumn', d: 44 });             // d is in song seconds (starts are warped, lengths are not)
    add('amb', 28.9, { w: 'dusk', d: 26 });
    for (let t = 0.4; t < 3.8; t += .3) add('step', t, { m: 'dirt', v: .22 });
    for (const t of CFG.JUMPS) { add('step', t, { m: 'dirt', v: .5 }); add('thud', t + .95, { v: .16 }); }
    add('scrape', 23.9, { v: .5 });
    add('thud', CFG.LAND, { v: .55 });
    add('bell', CFG.RISE, { v: .4 });
    for (let t = 36.0; t < 38.3; t += .32) add('step', t, { m: 'dirt', v: .2 });
    add('caw', CFG.CAW, { v: .8 }); add('caw', CFG.CAW + .8, { v: .6 });
    for (const t of CFG.PECK) add('peck', t, { v: .35 });
  },
};
