import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./ui";

/** Lupo – das Maskottchen von DURCHSCHAUT. Eine Lupe mit Gesicht, Armen und Füßen.
 *  mood: talk | happy | wave | wow | think | cheer | facepalm | point | pointLeft
 */
export type Mood = "talk" | "happy" | "wave" | "wow" | "think" | "cheer" | "facepalm" | "point" | "pointLeft";

export const LupoFigure: React.FC<{ mood: Mood; amp: number; t: number; size: number; look?: [number, number]; moodT?: number }> = ({ mood, amp, t, size, look = [0, 0], moodT = 1 }) => {
  // Blinzeln
  const bp = (t + 0.7) % 3.6;
  const blink = bp < 0.13 ? Math.abs(Math.cos((bp / 0.13) * Math.PI)) : 1;
  const eyesClosed = mood === "cheer" || mood === "happy";
  // Augen-Blickrichtung
  let [lx, ly] = look;
  if (mood === "think") { lx = 5; ly = -6; }
  if (mood === "point") lx = 6;
  if (mood === "pointLeft") lx = -6;
  const wowScale = mood === "wow" ? 1.25 : 1;

  // Mund
  const talking = amp > 0.08 && mood !== "wow" && mood !== "facepalm";
  let mouth: React.ReactNode;
  if (talking) {
    const h = 5 + amp * 24;
    mouth = <ellipse cx="100" cy="120" rx={13 + amp * 4} ry={h / 2} fill="#5a1a2a" stroke={C.ink} strokeWidth="3" />;
  } else if (mood === "wow") {
    mouth = <ellipse cx="100" cy="122" rx="10" ry="13" fill="#5a1a2a" stroke={C.ink} strokeWidth="3" />;
  } else if (mood === "cheer") {
    mouth = <path d="M78 112 Q100 146 122 112 Z" fill="#5a1a2a" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />;
  } else if (mood === "think") {
    mouth = <path d="M90 122 Q100 118 112 124" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />;
  } else if (mood === "facepalm") {
    mouth = <path d="M86 126 Q93 120 100 126 Q107 132 114 126" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />;
  } else {
    mouth = <path d="M84 116 Q100 132 116 116" fill="none" stroke={C.ink} strokeWidth="4.5" strokeLinecap="round" />;
  }

  // Augenbrauen
  const brow = { talk: [0, -2], happy: [-4, -4], wave: [-4, -4], wow: [-10, -12], think: [6, -2], cheer: [-6, -6], facepalm: [10, 2], point: [-2, -3], pointLeft: [-2, -3] }[mood];

  // Arme: Schulter links (36,96), rechts (164,96). Winkel in Grad (0 = nach unten)
  const swing = Math.sin(t * 3) * 6;
  let la = 20 + swing, ra = -20 - swing;
  let lBend = 0, rBend = 0;
  if (mood === "wave") { ra = -150 + Math.sin(t * 14) * 22; rBend = -30; }
  if (mood === "cheer") { la = 150 + Math.sin(t * 16) * 10; ra = -150 - Math.sin(t * 16) * 10; }
  if (mood === "point") { ra = -95; rBend = 0; la = 25; }
  if (mood === "pointLeft") { la = 95; lBend = 0; ra = -25; }
  if (mood === "think") { ra = -160; rBend = -110; }
  if (mood === "wow") { la = 120; ra = -120; lBend = 30; rBend = -30; }
  if (mood === "talk") { ra = -40 + Math.sin(t * 5) * 18; rBend = -40; }
  const arm = (sx: number, sy: number, ang: number, bend: number, key: string) => {
    const r1 = (ang * Math.PI) / 180;
    const ex = sx + Math.sin(r1) * 38, ey = sy + Math.cos(r1) * 38;
    const r2 = ((ang + bend) * Math.PI) / 180;
    const hx = ex + Math.sin(r2) * 34, hy = ey + Math.cos(r2) * 34;
    return (
      <g key={key}>
        <path d={`M${sx} ${sy} L${ex} ${ey} L${hx} ${hy}`} stroke={C.ink} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${sx} ${sy} L${ex} ${ey} L${hx} ${hy}`} stroke="#ffd36b" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={hx} cy={hy} r="13" fill="#fff" stroke={C.ink} strokeWidth="4.5" />
      </g>
    );
  };

  // Facepalm: Hand vor den Augen
  const palm = mood === "facepalm";

  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="glass" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f2fdff" />
          <stop offset="70%" stopColor="#bfeef7" />
          <stop offset="100%" stopColor="#8fdbe9" />
        </radialGradient>
      </defs>
      {/* Schatten */}
      <ellipse cx="100" cy="250" rx="52" ry="9" fill="#00000055" />
      {/* Griff als Körper */}
      <rect x="86" y="150" width="28" height="70" rx="12" fill="#30406a" stroke={C.ink} strokeWidth="5" />
      {[0, 1, 2].map((i) => <rect key={i} x="88" y={170 + i * 14} width="24" height="5" rx="2" fill="#4c63a0" />)}
      {/* Füße */}
      <ellipse cx="80" cy="236" rx="20" ry="11" fill={C.red} stroke={C.ink} strokeWidth="5" />
      <ellipse cx="120" cy="236" rx="20" ry="11" fill={C.red} stroke={C.ink} strokeWidth="5" />
      <rect x="92" y="216" width="6" height="14" fill={C.ink} /><rect x="102" y="216" width="6" height="14" fill={C.ink} />
      {/* Linse */}
      <circle cx="100" cy="92" r="72" fill={C.accent} stroke={C.ink} strokeWidth="6" />
      <circle cx="100" cy="92" r="58" fill="url(#glass)" stroke={C.ink} strokeWidth="5" />
      <path d="M58 70 A46 46 0 0 1 86 44" stroke="#ffffff" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.9" />
      {/* Wangen */}
      <ellipse cx="66" cy="112" rx="10" ry="6" fill="#ff8fa3" opacity="0.6" />
      <ellipse cx="134" cy="112" rx="10" ry="6" fill="#ff8fa3" opacity="0.6" />
      {/* Augen */}
      {[[78, 1], [122, -1]].map(([ex, side], i) => (
        <g key={i} transform={`translate(${ex} 84) scale(${wowScale})`}>
          {eyesClosed ? (
            <path d="M-12 2 Q0 -12 12 2" stroke={C.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
          ) : (
            <g transform={`scale(1 ${blink})`}>
              <ellipse cx="0" cy="0" rx="14" ry="17" fill="#fff" stroke={C.ink} strokeWidth="4" />
              <circle cx={lx} cy={ly + 2} r="7.5" fill={C.ink} />
              <circle cx={lx + 2.5} cy={ly - 1} r="2.5" fill="#fff" />
            </g>
          )}
          <line x1={-12} y1={-26 + brow[0] * side * 0.5 + brow[1]} x2={12} y2={-26 - brow[0] * side * 0.5 + brow[1]} stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
        </g>
      ))}
      {mouth}
      {/* Arme vor der Linse */}
      {!palm && arm(30, 112, la, lBend, "l")}
      {!palm && arm(170, 112, ra, rBend, "r")}
      {palm && (
        <g>
          <path d="M30 112 L60 124 L84 86" stroke={C.ink} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 112 L60 124 L84 86" stroke="#ffd36b" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="96" cy="80" rx="30" ry="15" fill="#fff" stroke={C.ink} strokeWidth="4" />
          {arm(170, 112, -20 - swing, 0, "r2")}
        </g>
      )}
    </svg>
  );
};

/** Sprechblase */
export const Bubble: React.FC<{ text: string; at: number; t: number; side?: "left" | "right"; v?: boolean }> = ({ text, at, t, side = "left", v = false }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (t < at || t > at + 2.3) return null;
  const p = spring({ frame: f - Math.round(at * fps), fps, config: { damping: 9, stiffness: 200 } });
  const out = interpolate(t, [at + 2.0, at + 2.3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", ...(v ? { top: "10%", right: "95%" } : { bottom: "100%", [side === "left" ? "right" : "left"]: "55%", marginBottom: -10 }), transform: `scale(${p * out})`, transformOrigin: side === "left" ? "bottom right" : "bottom left" }}>
      <div style={{ background: "#fff", color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 40, padding: "16px 26px", borderRadius: 28, whiteSpace: "nowrap", boxShadow: "0 10px 24px rgba(0,0,0,.35)", border: `5px solid ${C.ink}` }}>
        {text}
      </div>
    </div>
  );
};
