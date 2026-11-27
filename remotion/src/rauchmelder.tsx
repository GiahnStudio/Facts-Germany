import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useScene, useT } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#11151d";
const IR = "#ff5c8a"; // Infrarot (eigentlich unsichtbar) – als Pink dargestellt
const SMOKE = "#b9c0cc";

/** Pseudo-Zufall, deterministisch je Index */
const rnd = (i: number, k = 0) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Rauchmelder.
 *  mode "kammer": Schnitt durch die Messkammer. Infrarot-LED schickt Licht ins Leere (light_at)
 *                 → Rauch dringt durchs Labyrinth ein (smoke_at) → Partikel streuen Licht auf die Fotodiode (scatter_at)
 *                 → Signal über der Schwelle: Alarm mit 85 dB (alarm_at)
 *  mode "raum":   Schlafzimmer im Schnitt. Rauch steigt vom Brandherd auf (rise_at) → breitet sich unter der Decke aus
 *                 und erreicht den Melder in der Raummitte (detect_at) → Alarm (alarm_at) → Schläfer wacht auf (wake_at)
 *  optional: steps (4 Texte) */
export const RauchmelderScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const room = s.mode === "raum";

  const tA = at(room ? s.rise_at : s.light_at, 0.12);
  const tB = at(room ? s.detect_at : s.smoke_at, 0.38);
  const tC = at(room ? s.alarm_at : s.scatter_at, 0.6);
  const tD = at(room ? s.wake_at : s.alarm_at, 0.82);
  const steps: string[] = s.steps || (room
    ? ["Warmer Rauch steigt auf", "Rauch erreicht den Melder", "Alarm: 85 dB", "Aufwachen und raus!"]
    : ["Infrarot-Licht ins Leere", "Rauch dringt ein", "Rauch streut das Licht", "Alarm!"]);
  const times = [tA, tB, tC, tD];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });
  const alarmT = room ? tC : tD;

  const SW = 1600, SH = 700;
  const scale = v ? 0.6 : 0.86;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 64 : 62} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && <PopIn key={cur} at={times[cur]} sfx={null}><Chip bg={cur === (room ? 2 : 3) ? C.red : C.yellow} fg={cur === (room ? 2 : 3) ? C.white : C.ink} size={v ? 42 : 40}><span style={{ opacity: 0.6 }}>{cur + 1}/4 · </span>{steps[cur]}</Chip></PopIn>}
      </div>
      <div style={{ width: SW * scale, height: SH * scale, position: "relative" }}>
        <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden" }}>
          {room ? <Raum t={t} tA={tA} tB={tB} tC={tC} tD={tD} /> : <Kammer t={t} tA={tA} tB={tB} tC={tC} tD={tD} />}
        </svg>
      </div>
      {/* Sounds */}
      {!room && t >= tA && <Sfx at={tA} name="scan" vol={0.3} />}
      {t >= tB && <Sfx at={tB} name="whoosh" vol={0.35} />}
      {!room && t >= tC && <Sfx at={tC} name="data" vol={0.35} />}
      {room && t >= tA && <Sfx at={tA} name="whoosh" vol={0.25} />}
      {[0, 0.45, 0.9, 1.35].map((d, i) => t >= alarmT + d ? <Sfx key={i} at={alarmT + d} name="ding" vol={0.32} /> : null)}
      {room && t >= tD && <Sfx at={tD} name="pop" vol={0.5} />}
    </div>
  );
};

type P = { t: number; tA: number; tB: number; tC: number; tD: number };

/** Schallbögen eines piepsenden Melders */
const Waves: React.FC<{ x: number; y: number; t: number; t0: number; dir?: number; color?: string }> = ({ x, y, t, t0, dir = 1, color = C.red }) => {
  if (t < t0) return null;
  const out: React.ReactNode[] = [];
  for (let k = 0; k < 3; k++) {
    const ph = ((t - t0) * 1.6 + k / 3) % 1;
    const r = 40 + ph * 150;
    out.push(<path key={k} d={arc(x, y, r, dir > 0 ? -50 : 130, dir > 0 ? 50 : 230)} stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" opacity={1 - ph} />);
  }
  return <g>{out}</g>;
};

// ============================================================ Messkammer
const Kammer: React.FC<P> = ({ t, tA, tB, tC, tD }) => {
  const cx0 = 80, cy0 = 60, cw = 980, ch = 580;
  const beamY = 300;
  const led = { x: 210, y: beamY };
  const diode = { x: 600, y: 560 };
  const on = t >= tA;
  const pulse = on ? 0.55 + 0.45 * Math.abs(Math.sin((t - tA) * 9)) : 0;

  // Labyrinth-Lamellen rundum
  const lam: React.ReactNode[] = [];
  for (let i = 0; i < 13; i++) {
    const x = cx0 + 40 + i * 72;
    lam.push(<path key={"t" + i} d={`M ${x} ${cy0 + 8} L ${x + 30} ${cy0 + 44} L ${x + 56} ${cy0 + 44}`} stroke="#4a5368" strokeWidth={10} fill="none" strokeLinejoin="round" />);
    lam.push(<path key={"b" + i} d={`M ${x} ${cy0 + ch - 8} L ${x + 30} ${cy0 + ch - 44} L ${x + 56} ${cy0 + ch - 44}`} stroke="#4a5368" strokeWidth={10} fill="none" strokeLinejoin="round" />);
  }
  for (let i = 0; i < 6; i++) {
    const y = cy0 + 90 + i * 78;
    lam.push(<path key={"l" + i} d={`M ${cx0 + 8} ${y} L ${cx0 + 44} ${y + 30} L ${cx0 + 44} ${y + 50}`} stroke="#4a5368" strokeWidth={10} fill="none" strokeLinejoin="round" />);
    lam.push(<path key={"r" + i} d={`M ${cx0 + cw - 8} ${y} L ${cx0 + cw - 44} ${y + 30} L ${cx0 + cw - 44} ${y + 50}`} stroke="#4a5368" strokeWidth={10} fill="none" strokeLinejoin="round" />);
  }

  // Rauchpartikel
  const N = 46;
  const parts: { x: number; y: number; op: number; r: number }[] = [];
  if (t >= tB) {
    for (let i = 0; i < N; i++) {
      const born = tB + i * 0.035;
      if (t < born) continue;
      const side = i % 3; // 0 = oben, 1 = links, 2 = unten
      const sx = side === 1 ? cx0 - 30 : cx0 + 80 + rnd(i) * (cw - 160);
      const sy = side === 0 ? cy0 - 30 : side === 2 ? cy0 + ch + 30 : cy0 + 80 + rnd(i, 1) * (ch - 160);
      const tx = cx0 + 300 + rnd(i, 2) * 600;
      const ty = beamY - 150 + rnd(i, 3) * 300;
      const p = interpolate(t, [born, born + 1.4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const wob = Math.sin((t + i) * 2.1) * 14;
      parts.push({ x: sx + (tx - sx) * p + wob, y: sy + (ty - sy) * p + Math.cos((t + i) * 1.7) * 10, op: Math.min(1, (t - born) * 3) * 0.85, r: 9 + rnd(i, 4) * 9 });
    }
  }
  const hitters = parts.filter((p) => Math.abs(p.y - beamY) < 70 && p.x > led.x + 80);
  const scat = t >= tC;
  const sig = scat ? interpolate(t, [tC, tC + 1.1], [0.07, 0.92], { ...clamp, easing: Easing.out(Easing.cubic) }) : on ? 0.05 + 0.02 * Math.sin(t * 7) : 0;
  const thr = 0.6;
  const alarm = t >= tD;
  const blink = alarm && Math.floor((t - tD) * 4) % 2 === 0;

  return (
    <g>
      {/* Kammer */}
      <rect x={cx0} y={cy0} width={cw} height={ch} rx={40} fill="#0a0d14" stroke={INK} strokeWidth={10} />
      <rect x={cx0} y={cy0} width={cw} height={ch} rx={40} fill="none" stroke="#2c3446" strokeWidth={4} />
      {lam}
      <text x={cx0 + cw / 2} y={cy0 - 14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.muted}>Labyrinth: kein Licht von außen</text>

      {/* Lichtfalle rechts */}
      <path d={`M ${cx0 + cw - 120} ${beamY - 60} L ${cx0 + cw - 60} ${beamY} L ${cx0 + cw - 120} ${beamY + 60} Z`} fill="#1c2230" stroke="#3a4255" strokeWidth={5} />

      {/* Strahl */}
      {on && (
        <g opacity={pulse}>
          <line x1={led.x + 40} y1={beamY} x2={cx0 + cw - 110} y2={beamY} stroke={IR} strokeWidth={16} opacity={0.25} strokeLinecap="round" />
          <line x1={led.x + 40} y1={beamY} x2={cx0 + cw - 110} y2={beamY} stroke={IR} strokeWidth={6} strokeDasharray="26 16" strokeDashoffset={-(t - tA) * 260} strokeLinecap="round" />
        </g>
      )}
      {on && t < tB + 0.6 && <text x={560} y={beamY - 30} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={IR}>Infrarot – für uns unsichtbar</text>}

      {/* Streulicht */}
      {scat && hitters.slice(0, 9).map((p, i) => {
        const ph = ((t - tC) * 2.2 + i * 0.27) % 1;
        const op = Math.min(1, (t - tC) * 2.5) * (0.4 + 0.6 * (1 - ph));
        const angs = [-140, -40, 70, 120];
        return (
          <g key={"s" + i} opacity={op}>
            <line x1={p.x} y1={p.y} x2={diode.x} y2={diode.y - 30} stroke={IR} strokeWidth={5} strokeDasharray="12 10" strokeDashoffset={-(t - tC) * 200} />
            {angs.map((a, k) => <line key={k} x1={p.x} y1={p.y} x2={p.x + Math.cos((a * Math.PI) / 180) * 50} y2={p.y + Math.sin((a * Math.PI) / 180) * 50} stroke={IR} strokeWidth={4} opacity={0.7} />)}
          </g>
        );
      })}

      {/* Rauch */}
      {parts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={SMOKE} opacity={p.op} />)}

      {/* LED */}
      <rect x={led.x - 70} y={led.y - 36} width={110} height={72} rx={12} fill="#c8cdd6" stroke={INK} strokeWidth={6} />
      <circle cx={led.x + 38} cy={led.y} r={22} fill={on ? IR : "#5a3a46"} stroke={INK} strokeWidth={5} style={{ filter: on ? `drop-shadow(0 0 ${16 * pulse}px ${IR})` : "none" }} />
      <text x={led.x - 16} y={led.y + 80} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={C.white}>IR-LED</text>

      {/* Abschirmung + Fotodiode */}
      <rect x={diode.x - 120} y={diode.y - 70} width={30} height={90} rx={6} fill="#3a4255" />
      <rect x={diode.x + 90} y={diode.y - 70} width={30} height={90} rx={6} fill="#3a4255" />
      <rect x={diode.x - 60} y={diode.y - 20} width={120} height={50} rx={10} fill="#c8cdd6" stroke={INK} strokeWidth={6} />
      <path d={`M ${diode.x - 34} ${diode.y - 20} A 34 34 0 0 1 ${diode.x + 34} ${diode.y - 20} Z`} fill={scat ? C.yellow : "#3b4a6b"} stroke={INK} strokeWidth={5} style={{ filter: scat ? `drop-shadow(0 0 22px ${C.yellow})` : "none" }} />
      <text x={diode.x + 230} y={diode.y + 14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={C.white}>Fotodiode</text>

      {/* Signal-Anzeige */}
      <g>
        <rect x={1110} y={60} width={450} height={580} rx={28} fill="#14213a" stroke={alarm && blink ? C.red : "#3b4a6b"} strokeWidth={alarm ? 9 : 5} />
        <text x={1335} y={118} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill={C.muted}>LICHT AN DER DIODE</text>
        <rect x={1180} y={150} width={110} height={420} rx={18} fill="#0a0d14" stroke="#3b4a6b" strokeWidth={4} />
        <rect x={1188} y={150 + 412 * (1 - sig)} width={94} height={412 * sig} rx={12} fill={sig > thr ? C.red : C.yellow} />
        <line x1={1160} y1={150 + 412 * (1 - thr)} x2={1310} y2={150 + 412 * (1 - thr)} stroke={C.white} strokeWidth={5} strokeDasharray="14 8" />
        {!alarm && <text x={1322} y={150 + 412 * (1 - thr) + 10} fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.white}>Schwelle</text>}
        {!alarm && <text x={1322} y={560} fontFamily={FONT} fontWeight={800} fontSize={30} fill={scat ? C.yellow : C.muted}>{scat ? "Licht!" : on ? "dunkel" : "aus"}</text>}
        {alarm && (
          <g>
            <text x={1420} y={250} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={60} fill={blink ? C.red : C.white}>ALARM</text>
            <text x={1420} y={420} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={C.white}>85 dB</text>
            <Waves x={1360} y={490} t={t} t0={tD} />
          </g>
        )}
      </g>
    </g>
  );
};

// ============================================================ Schlafzimmer
const Raum: React.FC<P> = ({ t, tA, tB, tC, tD }) => {
  const X0 = 90, X1 = 1510, top = 50, floor = 640;
  const det = { x: 800, y: top + 26 };
  const fire = { x: 1330, y: 580 };
  const alarm = t >= tC;
  const awake = t >= tD;
  const blink = alarm && Math.floor((t - tC) * 4) % 2 === 0;

  // Rauchschicht unter der Decke: wächst vom Brandherd nach links
  const front = t < tA + 0.9 ? fire.x : interpolate(t, [tA + 0.9, tB, tB + 3], [fire.x, det.x - 30, X0], clamp);
  const thick = interpolate(t, [tA + 0.9, tB, tB + 4], [10, 70, 150], clamp);

  // aufsteigende Rauchwolke
  const plume: React.ReactNode[] = [];
  if (t >= tA) {
    for (let i = 0; i < 22; i++) {
      const per = 1.6;
      const ph = ((t - tA) / per + i / 22) % 1;
      if (t - tA < (i / 22) * per) continue;
      const y = fire.y - 40 - ph * (fire.y - 40 - (top + 50));
      const x = fire.x + Math.sin(ph * 6 + i) * 30 * ph - (ph > 0.85 ? (ph - 0.85) * 900 : 0);
      plume.push(<circle key={i} cx={x} cy={y} r={14 + ph * 26} fill={SMOKE} opacity={0.75 - ph * 0.3} />);
    }
  }
  // Wölkchen in der Schicht
  const puffs: React.ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const x = front + ((fire.x - front) * i) / 17;
    const rr = (14 + thick * 0.28) * (0.7 + 0.6 * rnd(i, 5));
    puffs.push(<circle key={i} cx={x + Math.sin(t * 1.3 + i) * 12} cy={top + 6 + thick * (0.35 + 0.4 * rnd(i, 6)) + Math.cos(t + i) * 6} r={rr} fill={SMOKE} opacity={0.35 + 0.25 * rnd(i, 7)} />);
  }
  const flick = 1 + 0.12 * Math.sin(t * 17) + 0.08 * Math.sin(t * 29);
  const head = awake ? { x: 330, y: 470 } : { x: 250, y: 520 };

  return (
    <g>
      {/* Raum */}
      <rect x={X0} y={top} width={X1 - X0} height={floor - top} fill="#16223a" stroke={INK} strokeWidth={8} />
      <rect x={X0} y={top - 24} width={X1 - X0} height={24} fill="#5b6476" />
      <rect x={X0} y={floor} width={X1 - X0} height={22} fill="#5b6476" />
      {/* Fenster */}
      <rect x={330} y={230} width={160} height={150} rx={6} fill="#0b1322" stroke="#5b6476" strokeWidth={8} />
      <line x1={410} y1={230} x2={410} y2={380} stroke="#5b6476" strokeWidth={6} />
      <circle cx={460} cy={260} r={14} fill="#e9e3c9" opacity={0.8} />

      {/* Rauchschicht (auf den Raum begrenzt) */}
      <defs><clipPath id="rclip"><rect x={X0} y={top} width={X1 - X0} height={floor - top} /></clipPath></defs>
      <g clipPath="url(#rclip)">
        {t >= tA + 0.9 && <rect x={front} y={top} width={X1 - front} height={thick} fill={SMOKE} opacity={0.4} />}
        {t >= tA + 0.9 && puffs}
        {plume}
      </g>
      {t >= tA && t < tB + 1.5 && (
        <g>
          <line x1={fire.x + 110} y1={fire.y - 80} x2={fire.x + 110} y2={top + 160} stroke={C.yellow} strokeWidth={7} markerEnd="url(#rarr)" />
          <text x={fire.x - 70} y={fire.y - 230} textAnchor="end" fontFamily={FONT} fontWeight={900} fontSize={30} fill={C.yellow}>warm → steigt auf</text>
        </g>
      )}
      <defs>
        <marker id="rarr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={C.yellow} /></marker>
      </defs>

      {/* Melder an der Decke */}
      <rect x={det.x - 12} y={top} width={24} height={10} fill="#9aa3b5" />
      <ellipse cx={det.x} cy={det.y} rx={80} ry={22} fill="#f2f4f7" stroke={INK} strokeWidth={6} />
      <circle cx={det.x} cy={det.y + 4} r={9} fill={alarm ? (blink ? "#ff3b30" : "#7a1f1c") : t >= tB ? C.yellow : "#7a1f1c"} />
      {alarm && <Waves x={det.x - 70} y={det.y + 40} t={t} t0={tC} dir={-1} />}
      {alarm && <Waves x={det.x + 70} y={det.y + 40} t={t} t0={tC} />}
      {alarm && (
        <g>
          <rect x={det.x - 100} y={det.y + 190} width={200} height={70} rx={35} fill={blink ? C.red : "#0b1322"} stroke={C.red} strokeWidth={5} />
          <text x={det.x} y={det.y + 241} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill={C.white}>85 dB</text>
        </g>
      )}
      {!alarm && (
        <g>
          <rect x={det.x - 190} y={det.y + 190} width={380} height={56} rx={28} fill="#0b1322" opacity={0.85} />
          <text x={det.x} y={det.y + 228} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.white}>Raummitte, an der Decke</text>
        </g>
      )}

      {/* Bett + Person */}
      <rect x={160} y={540} width={500} height={50} rx={10} fill="#8a5a3c" stroke={INK} strokeWidth={6} />
      <rect x={160} y={590} width={24} height={50} fill="#6b4530" />
      <rect x={636} y={590} width={24} height={50} fill="#6b4530" />
      <rect x={150} y={470} width={24} height={120} rx={8} fill="#6b4530" stroke={INK} strokeWidth={5} />
      <rect x={190} y={515} width={120} height={36} rx={16} fill="#f7f4ed" stroke={INK} strokeWidth={5} />
      <circle cx={head.x} cy={head.y} r={36} fill="#f2c9a0" stroke={INK} strokeWidth={6} />
      {awake ? (
        <g>
          <circle cx={head.x - 12} cy={head.y - 6} r={6} fill={INK} />
          <circle cx={head.x + 12} cy={head.y - 6} r={6} fill={INK} />
          <ellipse cx={head.x} cy={head.y + 16} rx={9} ry={11} fill={INK} />
          <path d={`M ${head.x - 30} ${head.y + 40} Q ${head.x} ${head.y + 30} ${head.x + 40} ${head.y + 44} L ${head.x + 40} ${555} L ${head.x - 40} ${555} Z`} fill={C.blue} stroke={INK} strokeWidth={6} />
          <text x={head.x + 60} y={head.y - 30} fontFamily={FONT} fontWeight={900} fontSize={80} fill={C.yellow}>!</text>
        </g>
      ) : (
        <g>
          <path d={`M ${head.x - 18} ${head.y - 4} q 8 6 16 0`} stroke={INK} strokeWidth={5} fill="none" />
          <path d={`M ${head.x + 4} ${head.y - 4} q 8 6 16 0`} stroke={INK} strokeWidth={5} fill="none" />
          {[0, 1, 2].map((k) => {
            const ph = ((t * 0.7 + k / 3) % 1);
            return <text key={k} x={head.x + 40 + ph * 60} y={head.y - 30 - ph * 90} fontFamily={FONT} fontWeight={900} fontSize={30 + k * 8} fill={C.white} opacity={1 - ph}>Z</text>;
          })}
        </g>
      )}
      <path d={`M 280 ${awake ? 545 : 515} Q 450 ${awake ? 520 : 490} 650 520 L 650 548 L 280 548 Z`} fill="#4c8cf0" stroke={INK} strokeWidth={6} opacity={0.95} />

      {/* Brandherd: Papierkorb */}
      <path d={`M ${fire.x - 50} ${fire.y - 40} L ${fire.x + 50} ${fire.y - 40} L ${fire.x + 38} ${floor} L ${fire.x - 38} ${floor} Z`} fill="#7d8698" stroke={INK} strokeWidth={6} />
      <g transform={`translate(${fire.x},${fire.y - 40}) scale(${flick})`}>
        <path d="M -34 0 Q -40 -50 -8 -80 Q -10 -50 8 -40 Q 6 -70 30 -96 Q 46 -40 34 0 Z" fill="#ff7a1a" stroke={INK} strokeWidth={5} />
        <path d="M -16 0 Q -18 -30 0 -46 Q 2 -26 16 -20 Q 20 -8 16 0 Z" fill={C.yellow} />
      </g>
    </g>
  );
};

/** Kreisbogen um (cx,cy) mit Radius r von Winkel a0 bis a1 (Grad, 0 = rechts) */
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + Math.cos((a * Math.PI) / 180) * r, cy + Math.sin((a * Math.PI) / 180) * r];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
}
