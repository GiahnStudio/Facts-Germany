import React from "react";
import { AbsoluteFill } from "remotion";
import { LupoFigure } from "./Lupo";
import { Icon } from "./icons";
import { C, FONT } from "./ui";

const Grid: React.FC<{ w: number; h: number; step?: number }> = ({ w, h, step = 80 }) => (
  <svg width={w} height={h} style={{ position: "absolute", opacity: 0.15 }}>
    {Array.from({ length: Math.ceil(w / step) + 1 }).map((_, i) => <line key={i} x1={i * step} y1={0} x2={i * step} y2={h} stroke="#5b7aa8" strokeWidth={2} />)}
    {Array.from({ length: Math.ceil(h / step) + 1 }).map((_, i) => <line key={"h" + i} x1={0} y1={i * step} x2={w} y2={i * step} stroke="#5b7aa8" strokeWidth={2} />)}
  </svg>
);

/** Profilbild 800x800: Lupo winkt (wird von YouTube rund beschnitten) */
export const Profile: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #1f6f8b 0%, ${C.bg} 70%)`, alignItems: "center", justifyContent: "center" }}>
    <div style={{ marginTop: 40 }}>
      <LupoFigure mood="happy" amp={0} t={0.6} size={470} />
    </div>
  </AbsoluteFill>
);

/** Banner 2560x1440 – alles Wichtige in der sicheren Zone 1546x423 in der Mitte */
export const Banner: React.FC = () => {
  const W = 2560, H = 1440;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1b4e6b 0%, ${C.bg} 65%)`, fontFamily: FONT, overflow: "hidden" }}>
      <Grid w={W} h={H} />
      {/* Deko außerhalb der sicheren Zone (nur auf großen Bildschirmen sichtbar) */}
      {[["bottle", 260, 420, 260, -12], ["coin", 2120, 420, 220, 14], ["machine", 380, 820, 220, 8], ["chip", 2020, 830, 200, -10]].map(([n, x, y, s, r]: any, i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`, opacity: 0.9 }}><Icon name={n} size={s} /></div>
      ))}
      {/* Sichere Zone: 507..2053 x 508..931 */}
      <div style={{ position: "absolute", left: 560, top: 470, width: 1440, height: 500, display: "flex", alignItems: "center", gap: 50 }}>
        <div style={{ marginTop: 40 }}><LupoFigure mood="wave" amp={0} t={0.35} size={300} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ fontSize: 124, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: 2, textShadow: "0 10px 0 rgba(0,0,0,.4)" }}>DURCHSCHAUT</div>
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: C.soft }}>Wie Alltagsdinge eigentlich funktionieren</div>
          <div style={{ display: "flex", gap: 20, marginTop: 6 }}>
            <div style={{ background: C.accent, color: C.ink, fontWeight: 900, fontSize: 40, padding: "12px 30px", borderRadius: 999 }}>ALLE 2 TAGE NEU</div>
            <div style={{ background: C.yellow, color: C.ink, fontWeight: 900, fontSize: 40, padding: "12px 30px", borderRadius: 999 }}>MIT LUPO</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Wasserzeichen 150x150 (Abo-Button im Video) */
export const Watermark: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "transparent" }}>
    <div style={{ marginTop: 8 }}><LupoFigure mood="happy" amp={0} t={0.6} size={100} /></div>
  </AbsoluteFill>
);
