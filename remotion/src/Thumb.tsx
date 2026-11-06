import React from "react";
import { AbsoluteFill } from "remotion";
import { LupoFigure, Mood } from "./Lupo";
import { Icon } from "./icons";
import { C, COLOR, FONT } from "./ui";

export type ThumbProps = { big: string; chip?: string; stamp?: string; stamp_color?: string; mood?: Mood; icon?: string };

export const Thumb: React.FC<ThumbProps> = ({ big, chip, stamp, stamp_color = "red", mood = "wow", icon = "bottle" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 25% 40%, #1f6f8b 0%, ${C.bg} 60%)`, fontFamily: FONT, overflow: "hidden" }}>
    <svg width={1280} height={720} style={{ position: "absolute", opacity: 0.15 }}>
      {Array.from({ length: 18 }).map((_, i) => <line key={i} x1={i * 80} y1={0} x2={i * 80} y2={720} stroke="#5b7aa8" strokeWidth={2} />)}
      {Array.from({ length: 10 }).map((_, i) => <line key={"h" + i} x1={0} y1={i * 80} x2={1280} y2={i * 80} stroke="#5b7aa8" strokeWidth={2} />)}
    </svg>
    <div style={{ position: "absolute", left: 10, top: 120, transform: "rotate(-6deg)" }}>
      <LupoFigure mood={mood} amp={0} t={1.2} size={400} look={[6, 0]} />
    </div>
    <div style={{ position: "absolute", left: 330, top: 390, transform: "rotate(14deg)" }}>
      <Icon name={icon} size={230} />
    </div>
    <div style={{ position: "absolute", left: 600, top: 70, right: 40, display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ fontSize: 112, fontWeight: 900, color: "#fff", lineHeight: 1.0, textShadow: "0 8px 0 rgba(0,0,0,.45)" }}>{big}</div>
      {chip && <div style={{ alignSelf: "flex-start", background: C.yellow, color: C.ink, fontWeight: 900, fontSize: 46, padding: "12px 28px", borderRadius: 999 }}>{chip}</div>}
    </div>
    {stamp && (
      <div style={{ position: "absolute", right: 40, bottom: 40, transform: "rotate(-7deg)", border: `12px solid ${COLOR[stamp_color]}`, borderRadius: 20, padding: "8px 30px", color: COLOR[stamp_color], fontWeight: 900, fontSize: 72, background: "rgba(10,16,30,.7)" }}>{stamp}</div>
    )}
    <div style={{ position: "absolute", left: 40, top: 30, display: "flex", alignItems: "center", gap: 14 }}>
      <Icon name="lens" size={54} style={{ filter: "none" }} />
      <div style={{ color: "#fff", fontWeight: 900, fontSize: 34 }}>DURCHSCHAUT</div>
    </div>
  </AbsoluteFill>
);
