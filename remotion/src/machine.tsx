import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, usePop, useScene, useT } from "./ui";
import { Icon } from "./icons";

const SW = 1600, SH = 760;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Aufgeschnittener Pfandautomat: Einwurf → Kameras → Datenbank → Presse → Bon */
export const MachineScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const tIn = at(s.insert_at, 0.08), tScan = at(s.scan_at, 0.25), tDb = at(s.db_at, 0.45), tPress = at(s.press_at, 0.65), tBon = at(s.bon_at, 0.85);
  const steps: string[] = s.steps || ["Einwurf", "Kameras scannen", "Abgleich mit Datenbank", "Sortieren & pressen", "Pfandbon"];
  const times = [tIn, tScan, tDb, tPress, tBon];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  // Flasche
  const inP = usePop(tIn, { damping: 15, stiffness: 90 });
  const moveP = interpolate(t, [tPress, tPress + 0.7], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const crush = interpolate(t, [tPress + 0.85, tPress + 1.05], [1, 0.22], clamp);
  const fall = interpolate(t, [tPress + 1.5, tPress + 2.0], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  let bx = interpolate(inP, [0, 1], [-160, 470]);
  bx = bx + moveP * (1160 - 470);
  const by = 300 + fall * 260;
  const wobble = t > tScan && t < tScan + 1.6 ? Math.sin(t * 30) * 4 : 0;

  // Presse
  const plunger = interpolate(t, [tPress + 0.75, tPress + 0.9, tPress + 1.3, tPress + 1.5], [0, 1, 1, 0], clamp);

  // Scan
  const scanOn = t >= tScan && t < tScan + 1.8;
  const flash = scanOn ? (Math.sin((t - tScan) * 40) > 0 ? 1 : 0.35) : 0;
  const sweep = interpolate(t, [tScan, tScan + 1.2], [0, 1], clamp);

  // Daten
  const packets = [0, 1, 2, 3, 4];
  const okP = usePop(tDb + 0.9, { damping: 9 });

  // Bon
  const bonP = interpolate(t, [tBon, tBon + 1.0], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  const scale = v ? 0.58 : 0.86;
  const cams = [[440, 205], [560, 190], [680, 205], [440, 445], [560, 460], [680, 445]];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: v ? 20 : 26 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 66 : 64} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && (
          <PopIn key={cur} at={times[cur]} sfx={null}>
            <Chip bg={C.yellow} size={v ? 44 : 42}><span style={{ opacity: 0.6 }}>{cur + 1}/5 · </span>{steps[cur]}</Chip>
          </PopIn>
        )}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <div style={{ width: SW, height: SH, position: "relative", transform: `scale(${scale}) translateX(-105px)`, transformOrigin: "top left" }}>
          {/* Gehäuse */}
          <div style={{ position: "absolute", left: 300, top: 40, width: 1240, height: 700, borderRadius: 40, background: "#25314d", boxShadow: "0 30px 60px rgba(0,0,0,.5)" }} />
          <div style={{ position: "absolute", left: 330, top: 70, width: 1180, height: 640, borderRadius: 28, background: "#141c2e", border: "4px dashed #3b4a6b" }} />
          {/* Schacht */}
          <div style={{ position: "absolute", left: 360, top: 230, width: 400, height: 200, borderRadius: 24, background: `radial-gradient(ellipse at center, #fff8d6 ${10 + flash * 20}%, #ffd76a55 55%, #ffd76a11 100%)`, boxShadow: scanOn ? "0 0 80px #ffe9a0" : "0 0 30px #ffe9a044" }} />
          {/* Öffnung */}
          <div style={{ position: "absolute", left: 270, top: 262, width: 90, height: 136, borderRadius: 20, background: "#05080f", border: "6px solid #3b4a6b" }} />
          {/* Förderband */}
          <div style={{ position: "absolute", left: 360, top: 430, width: 900, height: 22, borderRadius: 11, background: `repeating-linear-gradient(90deg, #3b4a6b 0 30px, #2a3550 30px 60px)`, backgroundPositionX: t > tPress && t < tPress + 0.8 ? -(t * 300) : 0 }} />
          {/* Kameras + Strahlen */}
          <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0 }}>
            {scanOn && cams.map(([x, y], i) => (
              <polygon key={i} points={`${x},${y} ${bx + 40},${by + 30} ${bx + 120},${by + 30}`} fill={C.accent} opacity={0.18 + 0.25 * flash} />
            ))}
            {scanOn && <rect x={bx + 10 + sweep * 150} y={by - 20} width={6} height={110} fill={C.red} opacity={0.9} />}
          </svg>
          {cams.map(([x, y], i) => (
            <div key={i} style={{ position: "absolute", left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: "50%", background: C.ink, border: `6px solid ${scanOn && flash > 0.5 ? C.accent : "#5b6b8f"}`, boxShadow: scanOn ? `0 0 30px ${C.accent}` : "none" }}>
              <div style={{ position: "absolute", left: 12, top: 12, width: 16, height: 16, borderRadius: "50%", background: scanOn ? "#fff" : "#2a3550" }} />
            </div>
          ))}
          {scanOn && <Sfx at={tScan} name="scan" vol={0.45} />}
          {/* Server */}
          <div style={{ position: "absolute", left: 860, top: 100, transform: t > tDb ? `scale(${1 + 0.04 * Math.sin(t * 10)})` : "none" }}>
            <Icon name="server" size={190} />
          </div>
          {packets.map((k) => {
            const p = interpolate(t, [tDb + k * 0.12, tDb + k * 0.12 + 0.6], [0, 1], clamp);
            if (p <= 0 || p >= 1) return null;
            const x = interpolate(p, [0, 1], [700, 940]);
            const y = interpolate(p, [0, 1], [300, 190]) - Math.sin(p * Math.PI) * 120;
            return <div key={k} style={{ position: "absolute", left: x, top: y, width: 26, height: 26, borderRadius: 6, background: k % 2 ? C.accent : C.yellow, boxShadow: `0 0 20px ${C.accent}` }} />;
          })}
          {t > tDb && <Sfx at={tDb} name="data" vol={0.35} />}
          {t > tDb + 0.9 && (
            <div style={{ position: "absolute", left: 800, top: 310, transform: `scale(${okP})`, transformOrigin: "left center" }}>
              <Sfx at={tDb + 0.9} name="ding" vol={0.4} />
              <div style={{ background: C.green, color: "#fff", fontFamily: FONT, fontWeight: 900, fontSize: 40, padding: "14px 26px", borderRadius: 18, boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>✓ Pfand · 0,25 €</div>
            </div>
          )}
          {/* Presse */}
          <div style={{ position: "absolute", left: 1110, top: 80, width: 180, height: 40, borderRadius: 8, background: "#6b7891" }} />
          <div style={{ position: "absolute", left: 1185, top: 120, width: 30, height: 60 + plunger * 150, background: "#8994ab" }} />
          <div style={{ position: "absolute", left: 1120, top: 170 + plunger * 150, width: 160, height: 34, borderRadius: 8, background: C.red, boxShadow: "0 6px 0 #00000055" }} />
          {t > tPress + 0.85 && <Sfx at={tPress + 0.85} name="crunch" vol={0.7} />}
          {/* Behälter */}
          <div style={{ position: "absolute", left: 1090, top: 540, width: 240, height: 150, borderRadius: "10px 10px 24px 24px", background: "#2f3d5e", border: "5px solid #4b5b80" }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: "#9fb0d0", textAlign: "center", marginTop: 54 }}>RECYCLING</div>
          </div>
          {/* Flasche */}
          <div style={{ position: "absolute", left: bx, top: by, width: 160, height: 160, opacity: 1 - fall * 0.8, transformOrigin: "center bottom", transform: `scaleY(${crush}) translateY(${(1 - crush) * 60}px)` }}>
            <div style={{ transform: `rotate(${-90 + wobble}deg)` }}><Icon name="bottle" size={160} /></div>
          </div>
          {t > tIn && <Sfx at={tIn} name="roll" vol={0.5} />}
          {/* Bon */}
          <div style={{ position: "absolute", left: 360, top: 600, width: 170, height: 20, borderRadius: 10, background: "#05080f" }} />
          <div style={{ position: "absolute", left: 375, top: 610, width: 140, height: 220, overflow: "hidden" }}>
            <div style={{ transform: `translateY(${(bonP - 1) * 220}px)`, background: "#fff", width: 140, height: 200, borderRadius: "0 0 8px 8px", padding: 14, boxSizing: "border-box", fontFamily: FONT, color: C.ink }}>
              <div style={{ fontWeight: 900, fontSize: 20 }}>PFANDBON</div>
              <div style={{ height: 4, background: "#ccc", margin: "10px 0" }} />
              <div style={{ fontWeight: 600, fontSize: 18 }}>1 × Einweg</div>
              <div style={{ fontWeight: 900, fontSize: 34, marginTop: 14 }}>0,25 €</div>
            </div>
          </div>
          {t > tBon && <Sfx at={tBon} name="cash" vol={0.5} />}
          {/* Außen: Schild */}
          <div style={{ position: "absolute", left: 40, top: 600, fontFamily: FONT, fontWeight: 800, fontSize: 30, color: C.muted }}>Einwurf →</div>
        </div>
      </div>
    </div>
  );
};
