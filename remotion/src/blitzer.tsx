import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useScene, useT } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#11151d";

/** Blitzer am Straßenrand.
 *  mode "radar": Auto fährt heran, Kasten sendet Radarwellen (send_at) → Echo kommt gestaucht zurück (echo_at)
 *                → Anzeige zählt das Tempo hoch (speed_at) → roter Blitz + Beweisfoto (flash_at)
 *  mode "piezo": drei Sensorstreifen im Asphalt leuchten auf (strip_at) → Reifen überfährt sie, Zeiten erscheinen (cross_at)
 *                → Rechnung Weg ÷ Zeit (calc_at) → Blitz + Foto (flash_at)
 *  optional: steps (4 Texte), kmh (gemessenes Tempo), limit (erlaubt) */
export const BlitzerScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const pz = s.mode === "piezo";
  const kmh: number = s.kmh || (pz ? 60 : 63);
  const limit: number = s.limit || 50;

  const tA = at(pz ? s.strip_at : s.send_at, 0.15);
  const tB = at(pz ? s.cross_at : s.echo_at, 0.38);
  const tC = at(pz ? s.calc_at : s.speed_at, 0.6);
  const tD = at(s.flash_at, 0.82);
  const steps: string[] = s.steps || (pz
    ? ["Drei Sensoren im Asphalt", "Reifen drückt drauf", "Weg ÷ Zeit = Tempo", "Zu schnell: Foto!"]
    : ["Radarwellen raus", "Echo kommt gestaucht zurück", "Stauchung = Tempo", "Zu schnell: Foto!"]);
  const times = [tA, tB, tC, tD];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  const SW = 1600, SH = 700;
  const scale = v ? 0.6 : 0.86;
  const roadY = 450;
  // Blitzer-Säule rechts
  const bx = 1330, by = 150;
  const lens = { x: bx - 6, y: by + 110 };

  // ---------------- Auto
  let carX: number;
  if (pz) {
    // Vorderrad (carX + 280) erreicht Streifen 1 (x=520) bei tB, Streifen 3 (x=820) bei tB + 0.9
    const dt = t - tB;
    // nach Streifen 3 rollt das Auto langsam aus und bleibt vor dem Kasten stehen
    const wheel = dt < 0.9 ? 520 + dt * (300 / 0.9) : 820 + 300 * (1 - Math.exp(-(dt - 0.9) / 1.0));
    carX = Math.max(-420, wheel - 280);
  } else {
    carX = interpolate(t, [0, tD + 1.2], [-380, 860], clamp);
  }
  const front = carX + 352;

  // ---------------- Radarwellen
  const waves: React.ReactNode[] = [];
  if (!pz && t >= tA && t < tD + 0.4) {
    const cy = roadY + 70;
    const dist = Math.max(80, Math.hypot(lens.x - front, lens.y - cy));
    for (let k = 0; k < 6; k++) {
      const r = (((t - tA) * 420 + k * (dist / 6)) % dist);
      const op = Math.min(1, (t - tA) * 3) * (1 - r / dist) * 0.9 + 0.1;
      waves.push(<path key={"o" + k} d={arc(lens.x, lens.y, r, 145, 215)} stroke={C.accent} strokeWidth={6} fill="none" opacity={op} strokeLinecap="round" />);
    }
    if (t >= tB) {
      for (let k = 0; k < 11; k++) {
        const r = (((t - tB) * 420 + k * (dist / 11)) % dist);
        const op = Math.min(1, (t - tB) * 3) * (1 - r / dist) * 0.9 + 0.1;
        waves.push(<path key={"e" + k} d={arc(front, cy, r, -35, 35)} stroke={C.yellow} strokeWidth={6} fill="none" opacity={op} strokeLinecap="round" />);
      }
    }
  }

  // ---------------- Anzeige
  const cnt = interpolate(t, [tC, tC + 1.0], [0, kmh], { ...clamp, easing: Easing.out(Easing.cubic) });
  const shown = t >= tC ? Math.round(cnt) : null;
  const tooFast = shown !== null && shown > limit;

  // ---------------- Piezo-Streifen
  const strips = [520, 670, 820];
  const stripOn = pz && t >= tA;
  const passT = (i: number) => tB + i * 0.45;
  const secs = (i: number) => ((i * 1.0) / (kmh / 3.6)).toFixed(2).replace(".", ",");

  // ---------------- Blitz
  const flash = t >= tD ? interpolate(t, [tD, tD + 0.08, tD + 0.5], [0, 1, 0], clamp) : 0;
  const photoIn = t >= tD + 0.3;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 64 : 62} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && <PopIn key={cur} at={times[cur]} sfx={null}><Chip bg={cur === 3 ? C.red : C.yellow} fg={cur === 3 ? C.white : C.ink} size={v ? 42 : 40}><span style={{ opacity: 0.6 }}>{cur + 1}/4 · </span>{steps[cur]}</Chip></PopIn>}
      </div>
      <div style={{ width: SW * scale, height: SH * scale, position: "relative" }}>
        <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden" }}>
          <defs>
            <radialGradient id="bflash"><stop offset="0%" stopColor="#ff5a4f" stopOpacity="1" /><stop offset="100%" stopColor="#ff5a4f" stopOpacity="0" /></radialGradient>
          </defs>
          {/* Straße */}
          <rect x={0} y={roadY} width={SW} height={190} fill="#2b3140" />
          <rect x={0} y={roadY} width={SW} height={8} fill="#4a5268" />
          <rect x={0} y={roadY + 182} width={SW} height={8} fill="#4a5268" />
          {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={i * 170 + 20} y={roadY + 88} width={90} height={12} fill="#c9cedb" opacity={0.5} />)}

          {/* Piezo-Streifen */}
          {pz && strips.map((x, i) => {
            const hit = t >= passT(i) && t < passT(i) + 0.35;
            return (
              <g key={i}>
                <rect x={x - 9} y={roadY + 10} width={18} height={170} rx={4} fill={hit ? C.yellow : stripOn ? C.accent : "#5b6476"} style={{ filter: stripOn ? `drop-shadow(0 0 ${hit ? 26 : 12}px ${hit ? C.yellow : C.accent})` : "none" }} />
                {t >= passT(i) && (
                  <g>
                    <rect x={x - 70} y={roadY + 200} width={140} height={50} rx={12} fill={C.card} stroke={INK} strokeWidth={4} />
                    <text x={x} y={roadY + 236} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={INK}>{secs(i)} s</text>
                  </g>
                )}
              </g>
            );
          })}
          {pz && stripOn && [0, 1].map((i) => (
            <g key={"m" + i}>
              <line x1={strips[i] + 14} y1={roadY - 24} x2={strips[i + 1] - 14} y2={roadY - 24} stroke={C.muted} strokeWidth={4} />
              <text x={(strips[i] + strips[i + 1]) / 2} y={roadY - 36} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.muted}>1 m</text>
            </g>
          ))}

          {/* Blitzer-Säule */}
          <rect x={bx + 40} y={by + 180} width={40} height={roadY - by - 180 + 10} fill="#5b6476" stroke={INK} strokeWidth={5} />
          <rect x={bx - 20} y={by} width={180} height={190} rx={18} fill="#c8cdd6" stroke={INK} strokeWidth={7} />
          <rect x={bx - 20} y={by} width={180} height={44} rx={14} fill="#9aa3b5" stroke={INK} strokeWidth={6} />
          <circle cx={lens.x + 30} cy={lens.y} r={34} fill={INK} />
          <circle cx={lens.x + 30} cy={lens.y} r={18} fill={t >= tA ? C.accent : "#3b4a6b"} />
          <rect x={bx + 90} y={by + 70} width={50} height={60} rx={8} fill={flash > 0.05 ? "#ff7a70" : "#7a1f1c"} stroke={INK} strokeWidth={5} />
          <text x={bx + 70} y={by + 172} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill={INK}>{pz ? "KAMERA" : "RADAR"}</text>

          {waves}

          {/* Auto */}
          <g transform={`translate(${carX},${roadY + 10})`}>
            <path d="M30 110 Q40 60 110 52 L150 20 Q170 8 200 8 L260 8 Q290 10 305 40 L330 70 Q352 76 352 110 L352 125 L22 125 Z" fill={C.blue} stroke="#000" strokeWidth="5" />
            <path d="M160 26 L200 18 L255 18 Q275 20 285 44 L295 64 L150 64 Z" fill="#9fd7f7" stroke="#000" strokeWidth="4" />
            <circle cx="95" cy="128" r="32" fill="#1b1f27" stroke="#000" strokeWidth="5" /><circle cx="95" cy="128" r="12" fill="#9aa3b5" />
            <circle cx="280" cy="128" r="32" fill="#1b1f27" stroke="#000" strokeWidth="5" /><circle cx="280" cy="128" r="12" fill="#9aa3b5" />
            <rect x="330" y="84" width="20" height="14" rx="4" fill={C.yellow} />
          </g>

          {/* Anzeige oben links */}
          <g>
            <rect x={30} y={20} width={560} height={pz ? 250 : 210} rx={24} fill="#14213a" stroke="#3b4a6b" strokeWidth={5} />
            <text x={60} y={72} fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.muted}>MESSUNG</text>
            <rect x={400} y={42} width={160} height={48} rx={24} fill="#ffffff" stroke={C.red} strokeWidth={7} />
            <text x={480} y={78} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={INK}>{limit} erlaubt</text>
            {pz && t >= tC && (
              <text x={60} y={128} fontFamily={FONT} fontWeight={800} fontSize={32} fill={C.white}>
                2 m ÷ {secs(2)} s =
              </text>
            )}
            <text x={60} y={pz ? 228 : 188} fontFamily={FONT} fontWeight={900} fontSize={pz ? 96 : 108} fill={shown === null ? "#3b4a6b" : tooFast ? C.red : C.white}>
              {shown === null ? "– –" : shown}
            </text>
            <text x={pz ? 270 : 290} y={pz ? 228 : 188} fontFamily={FONT} fontWeight={800} fontSize={40} fill={C.muted}>km/h</text>
          </g>

          {/* Blitz */}
          {flash > 0 && <circle cx={bx + 115} cy={by + 100} r={520} fill="url(#bflash)" opacity={flash} />}
          {flash > 0 && <rect x={0} y={0} width={SW} height={SH} fill="#ff3b30" opacity={flash * 0.28} />}
        </svg>
        {photoIn && (
          <div style={{ position: "absolute", top: 10 * scale, left: 640 * scale, width: 300, transform: `scale(${scale / 0.86})`, transformOrigin: "top left" }}>
            <PopIn at={tD + 0.3} sfx={null}>
              <div style={{ background: "#fff", padding: 14, paddingBottom: 10, border: `5px solid ${INK}`, borderRadius: 10, transform: "rotate(-5deg)", boxShadow: "0 14px 0 rgba(0,0,0,.3)" }}>
                <div style={{ background: "#3a2422", height: 150, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <svg width="200" height="120" viewBox="0 0 200 120">
                    <rect x="20" y="30" width="160" height="70" rx="20" fill={C.blue} stroke="#000" strokeWidth="4" />
                    <rect x="45" y="38" width="110" height="30" rx="8" fill="#9fd7f7" stroke="#000" strokeWidth="3" />
                    <circle cx="40" cy="82" r="10" fill={C.yellow} /><circle cx="160" cy="82" r="10" fill={C.yellow} />
                    <rect x="70" y="84" width="60" height="14" rx="2" fill="#fff" stroke="#000" strokeWidth="2" />
                  </svg>
                  <div style={{ position: "absolute", top: 6, right: 10, fontFamily: FONT, fontWeight: 900, fontSize: 22, color: "#ff8a80" }}>{kmh} km/h</div>
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 24, color: INK, textAlign: "center", marginTop: 6 }}>BEWEISFOTO</div>
              </div>
            </PopIn>
          </div>
        )}
      </div>
      {/* Sounds */}
      {t >= 0.1 && <Sfx at={0.1} name="roll" vol={0.45} />}
      {!pz && t >= tA && <Sfx at={tA} name="scan" vol={0.35} />}
      {!pz && t >= tB && <Sfx at={tB} name="data" vol={0.35} />}
      {pz && strips.map((_, i) => t >= passT(i) ? <Sfx key={i} at={passT(i)} name="tick" vol={0.5} /> : null)}
      {t >= tC && <Sfx at={tC} name="data" vol={0.3} />}
      {t >= tD && <Sfx at={tD} name="pop" vol={0.6} />}
      {photoIn && <Sfx at={tD + 0.3} name="swipe" vol={0.4} />}
    </div>
  );
};

/** Kreisbogen um (cx,cy) mit Radius r von Winkel a0 bis a1 (Grad, 0 = rechts) */
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + Math.cos((a * Math.PI) / 180) * r, cy + Math.sin((a * Math.PI) / 180) * r];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
}
