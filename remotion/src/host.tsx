import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Sequence, Audio, staticFile } from "remotion";
import { Bubble, LupoFigure, Mood } from "./Lupo";
import { C, FONT } from "./ui";
import type { SceneData } from "./Video";

type Ev = { at: number; mood: Mood; dur: number };

const num = (x: any) => (typeof x === "number" ? x : null);

/** Automatische Reaktionen je Szenentyp (Sekunden relativ zur Szene) */
export const lupoEvents = (s: SceneData, idx: number, last: boolean): Ev[] => {
  const ev: Ev[] = [];
  const A = s.adur;
  const at = (x: any, frac: number) => num(x) ?? frac * A;
  switch (s.type) {
    case "title":
      if (idx === 0) ev.push({ at: 0.2, mood: "wave", dur: 2.2 });
      else ev.push({ at: at(s.sub_at, 0.4), mood: "happy", dur: 1.6 });
      if (s.stamp) ev.push({ at: at(s.stamp_at, 0.7), mood: "wow", dur: 1.4 });
      break;
    case "quiz": {
      const opts = s.options || [];
      if (s.answer) {
        const r = Math.max(at(s.reveal_at, 0.3), 0.15 + 0.12 * (opts.length - 1) + 0.6);
        ev.push({ at: r, mood: "cheer", dur: 2.0 });
      } else {
        const lo = opts.length ? at(opts[opts.length - 1].at, 0.3 + 0.15 * (opts.length - 1)) : 0.5;
        ev.push({ at: lo + 1.2, mood: "think", dur: 99 });
      }
      break;
    }
    case "bignum":
      (s.items || []).forEach((it: any, i: number) => ev.push({ at: at(it.at, 0.1 + 0.5 * i) + 0.9, mood: "wow", dur: 1.3 }));
      break;
    case "machine":
      ev.push({ at: at(s.insert_at, 0.08), mood: "pointLeft", dur: 1.4 });
      ev.push({ at: at(s.scan_at, 0.25), mood: "wow", dur: 1.4 });
      ev.push({ at: at(s.db_at, 0.45) + 0.9, mood: "happy", dur: 1.2 });
      ev.push({ at: at(s.press_at, 0.65) + 0.8, mood: "wow", dur: 1.2 });
      ev.push({ at: at(s.bon_at, 0.85), mood: "cheer", dur: 1.4 });
      break;
    case "money":
      (s.moves || []).forEach((m: any, i: number) => ev.push({ at: at(m.at, 0.1 + 0.8 * i / s.moves.length), mood: "pointLeft", dur: 1.0 }));
      break;
    case "case": {
      const v = at(s.verdict_at, 0.55);
      let e = 0;
      for (const w of s.words) if (w[1] <= v - 0.2) e = Math.max(e, w[1]);
      if (v - e > 0.6) ev.push({ at: e + 0.05, mood: "think", dur: v - e - 0.05 });
      ev.push({ at: v, mood: s.verdict_color === "green" ? "cheer" : "facepalm", dur: 2.2 });
      break;
    }
    case "outro": {
      ev.push({ at: 0.1, mood: "wave", dur: 2.0 });
      ev.push({ at: at(s.button_at, 0.5) + 0.9, mood: "cheer", dur: 3 });
      break;
    }
    default: {
      const items = s.items || s.lines || s.steps || [];
      const first = items.length ? at(items[0].at, 0.2) : 0.3;
      ev.push({ at: first, mood: "pointLeft", dur: 1.3 });
      if (s.stamp) ev.push({ at: at(s.stamp_at, 0.75), mood: "wow", dur: 1.4 });
    }
  }
  for (const e of s.lupo?.events || []) ev.push({ at: num(e.at) ?? e.frac * A, mood: e.mood, dur: e.dur ?? 1.5 });
  return ev;
};

export const Host: React.FC<{ scenes: SceneData[]; v: boolean; W: number; H: number }> = ({ scenes, v, W, H }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = scenes.findIndex((s) => f >= s.start && f < s.start + s.dur);
  if (idx < 0) return null;
  const s = scenes[idx];
  const lt = (f - s.start) / fps;
  const t = f / fps;
  if (s.lupo?.hide) return null;

  // Stimmung bestimmen
  const evs = lupoEvents(s, idx, idx === scenes.length - 1);
  let mood: Mood = "talk";
  let moodStart = 0;
  for (const e of evs) if (lt >= e.at && lt < e.at + e.dur) { mood = e.mood; moodStart = e.at; }
  const ampStr: string = s.amp || "";
  const ai = Math.min(ampStr.length - 1, Math.max(0, f - s.start));
  const amp = ampStr.length ? parseInt(ampStr[ai] || "0", 10) / 9 : 0;
  if (mood === "talk" && amp < 0.08 && lt > s.adur) mood = "happy";

  // Auftritt (erste Szene) + Hüpfen
  const enter = spring({ frame: f - 4, fps, config: { damping: 10, stiffness: 90 } });
  const jump = mood === "cheer" ? Math.abs(Math.sin((lt - moodStart) * 9)) * 30 : 0;
  const bob = Math.sin(t * 2.4) * 6 + amp * 6;
  const big = idx === 0 || idx === scenes.length - 1;
  const bigP = interpolate(f, [s.start, s.start + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scaleBig = big ? 1 + 0.15 * bigP : 1;
  const tilt = mood === "think" ? 8 : mood === "facepalm" ? -6 : Math.sin(t * 1.3) * 3;

  const size = v ? 250 : 360;
  const pos: React.CSSProperties = v ? { right: 40, top: 110 } : { right: 50, bottom: 40 };
  return (
    <div style={{ position: "absolute", ...pos, transform: `translateY(${(1 - enter) * 500 - jump - bob}px) scale(${scaleBig}) rotate(${tilt}deg)`, transformOrigin: "bottom center" }}>
      {(s.lupo?.bubbles || []).map((b: any, i: number) => <Bubble key={i} text={b.text} at={num(b.at) ?? 0.5} t={lt} side="left" v={v} />)}
      {mood === "think" && <ThinkCloud v={v} from={moodStart} to={thinkEnd(evs, moodStart, s.adur)} lt={lt} f={f - s.start} fps={fps} />}
      <LupoFigure mood={mood} amp={amp} t={t} size={size} />
    </div>
  );
};


const thinkEnd = (evs: Ev[], start: number, adur: number) => {
  const e = evs.find((x) => x.mood === "think" && x.at === start);
  return e ? Math.min(e.at + e.dur, adur + 0.6) : start + 2;
};

/** Denkblase mit ablaufendem Ring und Ticken */
const ThinkCloud: React.FC<{ v: boolean; from: number; to: number; lt: number; f: number; fps: number }> = ({ v, from, to, lt, f, fps }) => {
  const p = interpolate(lt, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = spring({ frame: f - Math.round(from * fps), fps, config: { damping: 9, stiffness: 180 } });
  const r = 44, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "absolute", ...(v ? { top: "8%", right: "100%" } : { bottom: "92%", left: "-8%" }), transform: `scale(${pop})`, transformOrigin: "bottom right" }}>
      <div style={{ position: "relative", width: 150, height: 150 }}>
        <div style={{ position: "absolute", right: -10, bottom: -18, width: 26, height: 26, borderRadius: "50%", background: "#fff", border: `4px solid ${C.ink}` }} />
        <div style={{ position: "absolute", right: -26, bottom: -40, width: 14, height: 14, borderRadius: "50%", background: "#fff", border: `3px solid ${C.ink}` }} />
        <svg width={150} height={150} viewBox="0 0 100 100" style={{ position: "absolute" }}>
          <circle cx="50" cy="50" r="48" fill="#fff" stroke={C.ink} strokeWidth="4" />
          <circle cx="50" cy="50" r={r - 6} fill="none" stroke="#e6e9ef" strokeWidth="8" />
          <circle cx="50" cy="50" r={r - 6} fill="none" stroke={C.yellow} strokeWidth="8" strokeDasharray={2 * Math.PI * (r - 6)} strokeDashoffset={2 * Math.PI * (r - 6) * p} transform="rotate(-90 50 50)" strokeLinecap="round" />
          <text x="50" y="64" textAnchor="middle" fontFamily="Inter" fontWeight="900" fontSize="40" fill={C.ink}>?</text>
        </svg>
      </div>
    </div>
  );
};
