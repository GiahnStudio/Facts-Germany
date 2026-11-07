// Timeline (single source of truth): camera, printing, cartouches, voice and sound cues all read from here
export const DUR = 68.0;
export const q8 = t => Math.floor(t * 8) / 8;     // figures and nature: 8 fps
export const q12 = t => Math.floor(t * 12) / 12;  // rain and water: 12 fps

export const NS = 6;                       // sheets on the handscroll
export const GAP = 220, SW = 1080 + GAP;
export const SLOT = i => (NS - 1 - i) * SW;  // first sheet is rightmost (scroll reads right → left)

export const T = {
  print: [
    [0.15, 0.5, 0.85, 1.2],     // 0 quarry (dawn)
    [12.6, 12.9, 13.2, 13.5],   // 1 lord
    [21.1, 21.35, 21.6, 21.85], // 2 sun
    [29.45, 29.7, 29.95, 30.2], // 3 cloud
    [40.7, 41.2, 41.7, 42.2],   // 4 mountain (four taiko strokes)
    [56.8, 57.1, 57.4, 57.7],   // 5 quarry (dusk) — blank sheet first
  ],
  title: [1.6, 6.2],
  hammer0: [0.2, 5.0],
  palanquin: [4.4, 11.6],
  pan: [[11.6, 12.6], [20.3, 21.1], [28.8, 29.45], [40.1, 40.7]],
  cloudIn: [23.4, 26.2],
  flood: [30.4, 34.6], spill: [32.9, 36.6], tiltDown: [33.0, 35.0], tiltUp: [36.6, 37.8],
  maMtn: [45.3, 46.0],
  taps: [48.9, 49.45, 50.0],
  push4: [47.0, 50.4],
  cut5: 52.6, seal5: 52.95,
  hammer5: [57.9, 62.0],
  wash: [61.9, 62.9], moral: 62.6, moralSeal: 63.7,
  end: [66.4, 68.0],
  cart: [[9.8, 10.3], [18.7, 19.15], [27.3, 27.7], [38.9, 39.3], [43.7, 44.1], [59.2, 59.6]],
};
export const REVEAL_DUR = 0.32;

// Narration: line id → start time (durations measured from the voice files)
export const VO = {
  L01: 0.9, L02: 5.9, L03: 8.8, L04: 12.9, L05: 15.0, L06: 18.3, L07: 21.4, L08: 24.7, L09: 27.0,
  L10: 29.8, L11: 35.8, L12: 38.4, L13: 42.6, L14: 46.0, L15: 50.6, L16: 53.6, L17: 58.4, L18: 62.8,
};
export const NO_SUB = ['L18'];   // the moral is printed as its own cartouche
