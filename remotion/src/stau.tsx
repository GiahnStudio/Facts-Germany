import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useT, useScene } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#11151d";
const ORANGE = "#ff9a1f";
const DARKRED = "#b3121b";

/** Stauerkennung per Handy: Autos fahren mit eingeschalteten Handys → die Handys senden anonym Position + Tempo
 *  an einen Server → die Autos werden langsamer, das Durchschnittstempo sinkt → auf der Karte färbt sich die Straße rot.
 *  Cues: drive_at, ping_at, slow_at, red_at  (optional: steps, road) */
export const StauScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const tDrive = at(s.drive_at, 0.05), tPing = at(s.ping_at, 0.25), tSlow = at(s.slow_at, 0.55), tRed = at(s.red_at, 0.8);
  const steps: string[] = s.steps || ["Autos mit Handy an Bord", "Handys senden Ort + Tempo", "Alle werden langsamer", "Karte zeigt: Stau!"];
  const times = [tDrive, tPing, tSlow, tRed];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  const SW = 1200, SH = 800;
  const scale = v ? 0.8 : 0.9;

  // ---------------- Bewegung (analytisch integriert: v1 → v2 innerhalb D Sekunden ab tSlow)
  const V1 = 300, V2 = 32, D = 1.6;
  const dist = (x: number) => {
    if (x < tSlow) return V1 * x;
    const tau = x - tSlow;
    if (tau < D) return V1 * tSlow + V1 * tau - ((V1 - V2) * tau * tau) / (2 * D);
    return V1 * tSlow + V1 * D - ((V1 - V2) * D) / 2 + V2 * (tau - D);
  };
  const dd = dist(Math.max(0, t - tDrive));
  const slowP = interpolate(t, [tSlow, tSlow + D], [0, 1], clamp);
  const braking = t >= tSlow;

  // Geometrie
  const roadY = 540, laneH = 82, roadX = 20, roadW = 1160;
  const LOOP = 1460, CW = 116, CH = 52;
  const lanes = [0, 1];
  const perLane = 7;
  const gap = LOOP / perLane;
  const carColors = [C.blue, C.yellow, C.accent, C.red, "#c58cff", C.white, "#7fd36b"];
  const cars: { x: number; y: number; col: string; id: number }[] = [];
  lanes.forEach((ln) => {
    for (let i = 0; i < perLane; i++) {
      const off = i * gap + ln * gap * 0.5;
      const x = ((((off + dd * (ln ? 0.92 : 1)) % LOOP) + LOOP) % LOOP) - 180;
      cars.push({ x, y: roadY + 15 + ln * laneH, col: carColors[(i + ln * 3) % carColors.length], id: ln * perLane + i });
    }
  });

  // Server-Anzeige
  const speed = Math.round(interpolate(t, [tSlow, tSlow + D], [92, 12], clamp));
  const phones = Math.round(interpolate(t, [tPing, tPing + 1.5], [0, 14], clamp));
  const status = t >= tRed ? "STAU" : slowP > 0.35 ? "ZÄH" : "FREI";
  const statusCol = t >= tRed ? C.red : slowP > 0.35 ? ORANGE : C.green;
  const serverOn = t >= tPing;

  // Kartenfarbe
  const mapCol = t >= tRed ? DARKRED : slowP > 0.35 ? ORANGE : C.green;
  const redPop = interpolate(t, [tRed, tRed + 0.35], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });

  // Server-Box
  const sx = 40, sy = 70, sw = 560, sh = 250;
  const target = { x: sx + sw / 2, y: sy + sh };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 64 : 60} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && (
          <PopIn key={cur} at={times[cur]} sfx={null}>
            <Chip bg={cur === 3 ? C.red : C.yellow} fg={cur === 3 ? C.white : C.ink} size={v ? 42 : 40}>
              <span style={{ opacity: 0.6 }}>{cur + 1}/4 · </span>{steps[cur]}
            </Chip>
          </PopIn>
        )}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ transform: `scale(${scale})`, transformOrigin: "top left", overflow: "visible" }}>
          <defs>
            <clipPath id="stau-road"><rect x={roadX} y={roadY} width={roadW} height={laneH * 2 + 10} rx={18} /></clipPath>
            <clipPath id="stau-screen"><rect x={884} y={86} width={232} height={318} rx={14} /></clipPath>
          </defs>

          {/* Server */}
          <rect x={sx} y={sy} width={sw} height={sh} rx={26} fill="#16233d" stroke={serverOn ? C.accent : "#2c3d60"} strokeWidth={6} />
          <text x={sx + 30} y={sy + 52} fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.muted}>AUSWERTUNG · ANONYM</text>
          <text x={sx + 30} y={sy + 120} fontFamily={FONT} fontWeight={800} fontSize={36} fill={C.soft}>Handys:</text>
          <text x={sx + 230} y={sy + 120} fontFamily={FONT} fontWeight={900} fontSize={44} fill={C.white}>{serverOn ? phones : "–"}</text>
          <text x={sx + 30} y={sy + 190} fontFamily={FONT} fontWeight={800} fontSize={36} fill={C.soft}>Ø Tempo:</text>
          <text x={sx + 230} y={sy + 190} fontFamily={FONT} fontWeight={900} fontSize={44} fill={statusCol}>{serverOn ? `${speed} km/h` : "–"}</text>
          {serverOn && (
            <g>
              <rect x={sx + sw - 170} y={sy + 78} width={140} height={60} rx={30} fill={statusCol} />
              <text x={sx + sw - 100} y={sy + 120} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={32} fill={status === "ZÄH" ? C.ink : C.white}>{status}</text>
            </g>
          )}

          {/* Datenpunkte: Handy → Server */}
          {serverOn && cars.map((c) => {
            if (c.x < 40 || c.x > 1100) return null;
            const per = 1.5, off = (c.id * 0.37) % per;
            const ph = (((t - tPing - off) % per) + per) % per;
            if (t - tPing - off < 0 || ph > 0.9) return null;
            const p = ph / 0.9;
            const x0 = c.x + CW / 2, y0 = c.y;
            const x = x0 + (target.x - x0) * p, y = y0 + (target.y - y0) * p;
            return (
              <g key={"p" + c.id} opacity={1 - p * 0.3}>
                <circle cx={x0} cy={y0} r={10 + p * 40} fill="none" stroke={C.accent} strokeWidth={4} opacity={1 - p} />
                <circle cx={x} cy={y} r={8} fill={C.accent} />
              </g>
            );
          })}
          {t >= tPing && <Sfx at={tPing} name="data" vol={0.4} />}

          {/* Handy mit Karte */}
          <rect x={870} y={40} width={260} height={400} rx={34} fill={INK} stroke="#3a4560" strokeWidth={6} />
          <rect x={884} y={86} width={232} height={318} rx={14} fill="#e9eef3" />
          <g clipPath="url(#stau-screen)">
            {[0, 1, 2, 3].map((i) => <rect key={i} x={900 + (i % 2) * 120} y={100 + Math.floor(i / 2) * 160} width={90} height={120} rx={8} fill="#d6dee6" />)}
            <path d="M880 360 C 950 330, 960 250, 1000 220 S 1080 140, 1130 120" stroke="#ffffff" strokeWidth={30} fill="none" strokeLinecap="round" />
            <path d="M880 360 C 950 330, 960 250, 1000 220 S 1080 140, 1130 120" stroke={mapCol} strokeWidth={18} fill="none" strokeLinecap="round" />
            <circle cx={960} cy={300} r={12} fill={C.blue} stroke="#fff" strokeWidth={4} />
          </g>
          <rect x={960} y={56} width={80} height={12} rx={6} fill="#2b3346" />
          {t >= tRed && (
            <g transform={`translate(1000 ${250}) scale(${redPop})`}>
              <rect x={-90} y={-36} width={180} height={64} rx={32} fill={C.red} stroke={C.white} strokeWidth={4} />
              <text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.white}>Stau!</text>
            </g>
          )}
          {t >= tRed && <Sfx at={tRed} name="ding" vol={0.5} />}
          <text x={1000} y={476} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.muted}>Karte</text>

          {/* Straße */}
          <text x={roadX + 6} y={roadY - 18} fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.muted}>{s.road || "AUTOBAHN"} →</text>
          <rect x={roadX} y={roadY} width={roadW} height={laneH * 2 + 10} rx={18} fill="#3b4252" stroke={INK} strokeWidth={6} />
          <line x1={roadX + 10} x2={roadX + roadW - 10} y1={roadY + laneH + 5} y2={roadY + laneH + 5} stroke="#e6e9ef" strokeWidth={5} strokeDasharray="40 30" />
          <rect x={roadX} y={roadY + laneH * 2 + 22} width={roadW} height={12} rx={6} fill={mapCol} opacity={serverOn ? 0.9 : 0.25} />
          {t >= tDrive && <Sfx at={tDrive} name="whoosh" vol={0.35} />}
          <g clipPath="url(#stau-road)">
            {cars.map((c) => (
              <g key={c.id} transform={`translate(${c.x} ${c.y})`}>
                <rect x={0} y={0} width={CW} height={CH} rx={14} fill={c.col} stroke={INK} strokeWidth={5} />
                <rect x={CW * 0.52} y={8} width={30} height={CH - 16} rx={6} fill="#bfe3ff" stroke={INK} strokeWidth={3} />
                {/* Handy auf dem Dach */}
                <rect x={18} y={12} width={18} height={28} rx={4} fill={INK} />
                <rect x={21} y={16} width={12} height={18} rx={2} fill={serverOn ? C.accent : "#5b6476"} />
                {/* Bremslichter */}
                <rect x={-2} y={6} width={8} height={12} rx={3} fill={braking ? "#ff2d2d" : "#7a2a2a"} />
                <rect x={-2} y={CH - 18} width={8} height={12} rx={3} fill={braking ? "#ff2d2d" : "#7a2a2a"} />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};
