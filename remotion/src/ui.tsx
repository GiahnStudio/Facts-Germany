import React, { createContext, useContext } from "react";
import { Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const C = {
  bg: "#0b1322",
  bg2: "#14213a",
  ink: "#10131b",
  card: "#f7f4ed",
  soft: "#d8dde8",
  muted: "#8a93a6",
  accent: "#28d6ba",
  yellow: "#ffc400",
  red: "#e8423f",
  green: "#25b56f",
  blue: "#4c8cf0",
  white: "#ffffff",
};
export const COLOR: Record<string, string> = { red: C.red, green: C.green, amber: C.accent, yellow: C.yellow, blue: C.blue, ink: C.ink };
export const FONT = "Inter, sans-serif";

// ---------------------------------------------------------------- Szenen-Kontext
export type SceneCtx = { adur: number; dur: number; v: boolean; W: number; H: number; words: [number, number, string][] };
export const Ctx = createContext<SceneCtx>({ adur: 1, dur: 1, v: false, W: 1920, H: 1080, words: [] });
export const useScene = () => useContext(Ctx);

/** Sekunden-Zeitpunkt: Cue (Zahl) oder Anteil der Sprechdauer */
export const useAt = () => {
  const { adur } = useScene();
  return (at: number | null | undefined, frac: number) => (typeof at === "number" ? at : frac * adur);
};

export const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

/** Federnde Einblendung ab Sekunde `at` (0..1, mit Überschwingen) */
export const usePop = (at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - Math.round(at * fps), fps, config: { damping: 11, stiffness: 140, mass: 0.7, ...cfg } });
};

export const useLin = (at: number, len: number, ease = Easing.out(Easing.cubic)) => {
  const t = useT();
  return interpolate(t, [at, at + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
};

export const fs = (n: number, v: boolean) => Math.round(n * (v ? 1.0 : 1));

// ---------------------------------------------------------------- Sound
export const Sfx: React.FC<{ at: number; name: string; vol?: number }> = ({ at, name, vol = 0.5 }) => {
  const { fps } = useVideoConfig();
  const { dur } = useScene();
  if (!(at >= 0) || at > dur) return null;
  return (
    <Sequence from={Math.round(at * fps)} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
};

// ---------------------------------------------------------------- Bausteine
export const Chip: React.FC<{ children: React.ReactNode; bg?: string; fg?: string; size?: number; style?: React.CSSProperties }> = ({ children, bg = C.accent, fg = C.ink, size = 34, style }) => (
  <div style={{ display: "inline-block", background: bg, color: fg, fontFamily: FONT, fontWeight: 800, fontSize: size, padding: `${size * 0.32}px ${size * 0.75}px`, borderRadius: 999, letterSpacing: 0.5, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.25)", ...style }}>
    {children}
  </div>
);

export const Stamp: React.FC<{ text: string; color: string; at: number; size?: number; style?: React.CSSProperties }> = ({ text, color, at, size = 80, style }) => {
  const t = useT();
  const p = usePop(at, { damping: 9, stiffness: 220, mass: 0.6 });
  if (t < at) return null;
  const scale = interpolate(p, [0, 1], [2.4, 1]);
  return (
    <>
      <Sfx at={at} name="thud" vol={0.7} />
      <div style={{ display: "inline-block", transform: `rotate(-7deg) scale(${scale})`, opacity: Math.min(1, p * 2), border: `${size * 0.12}px solid ${color}`, borderRadius: size * 0.22, padding: `${size * 0.12}px ${size * 0.45}px`, color, fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: 2, background: "rgba(255,255,255,0.06)", boxShadow: `0 0 0 ${size * 0.05}px rgba(255,255,255,0.0), inset 0 0 0 ${size * 0.04}px ${color}55`, whiteSpace: "nowrap", ...style }}>
        {text}
      </div>
    </>
  );
};

/** Bildschirm-Wackeln nach Zeitpunkt `at` */
export const useShake = (at: number | null, strength = 14) => {
  const t = useT();
  if (at == null || t < at || t > at + 0.35) return "translate(0px,0px)";
  const k = 1 - (t - at) / 0.35;
  return `translate(${Math.sin(t * 90) * strength * k}px, ${Math.cos(t * 77) * strength * k}px)`;
};

/** Text, der Wort für Wort hineinfedert */
export const KineticText: React.FC<{ text: string; at: number; size: number; color?: string; weight?: number; stagger?: number; align?: "center" | "left"; maxWidth?: number; highlight?: string[] }> = ({ text, at, size, color = C.white, weight = 900, stagger = 0.06, align = "center", maxWidth, highlight = [] }) => {
  const words = text.split(" ");
  return (
    <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, color, lineHeight: 1.12, textAlign: align, maxWidth, display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", gap: `0 ${size * 0.26}px` }}>
      {words.map((w, i) => (
        <Word key={i} w={w} at={at + i * stagger} hl={highlight.some((h) => w.toLowerCase().includes(h.toLowerCase()))} />
      ))}
    </div>
  );
};
const Word: React.FC<{ w: string; at: number; hl: boolean }> = ({ w, at, hl }) => {
  const p = usePop(at, { damping: 12, stiffness: 180 });
  return (
    <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 40}px) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 1.6), color: hl ? C.accent : undefined }}>
      {w}
    </span>
  );
};

/** Einblenden von unten mit Feder */
export const Rise: React.FC<{ at: number; children: React.ReactNode; dist?: number; style?: React.CSSProperties; sfx?: string | null }> = ({ at, children, dist = 50, style, sfx = null }) => {
  const p = usePop(at, { damping: 14, stiffness: 120 });
  return (
    <div style={{ transform: `translateY(${(1 - p) * dist}px)`, opacity: Math.min(1, Math.max(0, p * 1.4)), ...style }}>
      {sfx && <Sfx at={at} name={sfx} vol={0.35} />}
      {children}
    </div>
  );
};

export const PopIn: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; sfx?: string | null; rot?: number }> = ({ at, children, style, sfx = "pop", rot = 0 }) => {
  const p = usePop(at);
  const t = useT();
  if (t < at - 0.02) return <div style={{ opacity: 0, ...style }}>{children}</div>;
  return (
    <div style={{ transform: `scale(${p}) rotate(${(1 - p) * -20 + rot}deg)`, opacity: Math.min(1, p * 2), ...style }}>
      {sfx && <Sfx at={at} name={sfx} vol={0.4} />}
      {children}
    </div>
  );
};

/** Leichtes Schweben (Idle-Animation) */
export const useFloat = (amp = 10, speed = 1.4, phase = 0) => {
  const t = useT();
  return Math.sin(t * speed + phase) * amp;
};
