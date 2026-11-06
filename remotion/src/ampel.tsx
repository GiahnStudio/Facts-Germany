import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useScene, useT } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Ampel mit Induktionsschleife: Auto fährt auf die Schleife → Magnetfeld → Signal → Grün */
export const AmpelScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const tCar = at(s.car_at, 0.05), tLoop = at(s.loop_at, 0.3), tSig = at(s.signal_at, 0.55), tGreen = at(s.green_at, 0.8);
  const steps: string[] = s.steps || ["Auto rollt an", "Schleife spürt das Metall", "Signal an den Steuerkasten", "Grün!"];
  const times = [tCar, tLoop, tSig, tGreen];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  const SW = 1600, SH = 700;
  const scale = v ? 0.58 : 0.86;
  // Auto: fährt bis zur Schleife, nach Grün weiter
  const arrive = interpolate(t, [tCar, tCar + 1.4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const leave = interpolate(t, [tGreen + 0.8, tGreen + 2.2], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const carX = -380 + arrive * (720 + 380) + leave * 900;
  const loopOn = t >= tLoop;
  const ring = (t - tLoop) % 1.0;
  const sigP = interpolate(t, [tSig, tSig + 0.9], [0, 1], clamp);
  // Lichtphasen
  const phase = t < tGreen ? "red" : t < tGreen + 0.8 ? "redyellow" : "green";
  const lamp = (c: string, on: boolean) => (
    <div style={{ width: 90, height: 90, borderRadius: "50%", background: on ? c : "#2a2f3a", boxShadow: on ? `0 0 50px ${c}, 0 0 100px ${c}88` : "inset 0 6px 12px #0008", border: "5px solid #11151d" }} />
  );
  const cableLen = 520;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 66 : 64} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && <PopIn key={cur} at={times[cur]} sfx={null}><Chip bg={C.yellow} size={v ? 44 : 42}><span style={{ opacity: 0.6 }}>{cur + 1}/4 · </span>{steps[cur]}</Chip></PopIn>}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <div style={{ position: "relative", width: SW, height: SH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {/* Straße */}
          <div style={{ position: "absolute", left: 0, top: 430, width: SW, height: 200, background: "#2b3140", borderTop: "8px solid #4a5268", borderBottom: "8px solid #4a5268" }} />
          {Array.from({ length: 10 }).map((_, i) => <div key={i} style={{ position: "absolute", left: i * 170 + 20, top: 524, width: 90, height: 12, background: "#c9cedb", opacity: 0.6 }} />)}
          {/* Haltelinie */}
          <div style={{ position: "absolute", left: 1150, top: 438, width: 18, height: 184, background: "#fff" }} />
          {/* Schleife im Asphalt (Querschnitt angedeutet) */}
          <div style={{ position: "absolute", left: 760, top: 455, width: 360, height: 150, borderRadius: 14, border: `8px solid ${loopOn ? C.accent : "#5b6476"}`, boxShadow: loopOn ? `0 0 40px ${C.accent}` : "none" }} />
          {loopOn && [0, 1, 2].map((k) => {
            const p = ((t - tLoop) / 1.0 + k / 3) % 1;
            return <div key={k} style={{ position: "absolute", left: 940 - 180 - p * 120, top: 530 - 75 - p * 60, width: 360 + p * 240, height: 150 + p * 120, borderRadius: 30 + p * 40, border: `4px solid ${C.accent}`, opacity: (1 - p) * 0.7 }} />;
          })}
          {loopOn && <Sfx at={tLoop} name="scan" vol={0.35} />}
          <div style={{ position: "absolute", left: 790, top: 640, fontFamily: FONT, fontWeight: 800, fontSize: 30, color: loopOn ? C.accent : C.muted }}>Drahtschleife im Asphalt</div>
          {/* Kabel zum Steuerkasten */}
          <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d="M1120 530 L1300 530 L1300 360" stroke="#5b6476" strokeWidth="8" fill="none" strokeDasharray="14 10" />
            {sigP > 0 && sigP < 1 && (() => {
              const d = sigP * cableLen;
              const x = d < 180 ? 1120 + d : 1300;
              const y = d < 180 ? 530 : 530 - (d - 180);
              return <circle cx={x} cy={Math.max(360, y)} r="16" fill={C.yellow} style={{ filter: `drop-shadow(0 0 12px ${C.yellow})` }} />;
            })()}
          </svg>
          {t > tSig && <Sfx at={tSig} name="data" vol={0.35} />}
          {/* Steuerkasten */}
          <div style={{ position: "absolute", left: 1240, top: 250, width: 130, height: 120, borderRadius: 12, background: "#8a94a8", border: "5px solid #11151d", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 900, fontSize: 22, color: C.ink, textAlign: "center" }}>
            {t > tSig + 0.9 ? <span style={{ color: C.green, fontSize: 48 }}>✓</span> : "STEUER-\nKASTEN"}
          </div>
          {/* Ampel */}
          <div style={{ position: "absolute", left: 1420, top: 60, width: 26, height: 380, background: "#3c4458" }} />
          <div style={{ position: "absolute", left: 1370, top: 0, width: 128, height: 330, borderRadius: 26, background: "#161a22", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly", border: "5px solid #000" }}>
            {lamp(C.red, phase !== "green")}
            {lamp(C.yellow, phase === "redyellow")}
            {lamp(C.green, phase === "green")}
          </div>
          {t > tGreen + 0.8 && <Sfx at={tGreen + 0.8} name="ding" vol={0.45} />}
          {/* Auto */}
          <div style={{ position: "absolute", left: carX, top: 440, width: 360, height: 170 }}>
            {t > tCar && <Sfx at={tCar} name="roll" vol={0.5} />}
            <svg width="360" height="170" viewBox="0 0 360 170">
              <path d="M30 110 Q40 60 110 52 L150 20 Q170 8 200 8 L260 8 Q290 10 305 40 L330 70 Q352 76 352 110 L352 125 L22 125 Z" fill={C.red} stroke="#000" strokeWidth="5" />
              <path d="M160 26 L200 18 L255 18 Q275 20 285 44 L295 64 L150 64 Z" fill="#9fd7f7" stroke="#000" strokeWidth="4" />
              <circle cx="95" cy="128" r="32" fill="#1b1f27" stroke="#000" strokeWidth="5" /><circle cx="95" cy="128" r="12" fill="#9aa3b5" />
              <circle cx="280" cy="128" r="32" fill="#1b1f27" stroke="#000" strokeWidth="5" /><circle cx="280" cy="128" r="12" fill="#9aa3b5" />
              <rect x="330" y="84" width="20" height="14" rx="4" fill={C.yellow} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
