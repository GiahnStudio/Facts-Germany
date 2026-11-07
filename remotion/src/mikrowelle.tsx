import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useScene, useT } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Wassermolekül (O rot, 2× H weiß), dreht sich um rot Grad */
const Molecule: React.FC<{ x: number; y: number; rot: number; s?: number }> = ({ x, y, rot, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <line x1={0} y1={0} x2={-26} y2={22} stroke="#11151d" strokeWidth={7} />
    <line x1={0} y1={0} x2={26} y2={22} stroke="#11151d" strokeWidth={7} />
    <circle cx={-26} cy={22} r={14} fill={C.white} stroke="#11151d" strokeWidth={4} />
    <circle cx={26} cy={22} r={14} fill={C.white} stroke="#11151d" strokeWidth={4} />
    <circle cx={0} cy={0} r={22} fill={C.red} stroke="#11151d" strokeWidth={4} />
    <text x={0} y={7} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill={C.white}>–</text>
  </g>
);

/** Mikrowelle im Querschnitt: Magnetron → Wellen prallen im Garraum → Wassermoleküle drehen sich → Wärme */
export const MikrowelleScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const tOn = at(s.on_at, 0.05), tWave = at(s.wave_at, 0.3), tFlip = at(s.flip_at, 0.55), tHot = at(s.hot_at, 0.8);
  const steps: string[] = s.steps || ["Das Magnetron startet", "Wellen prallen hin und her", "Wassermoleküle drehen sich", "Reibung wird zu Wärme"];
  const times = [tOn, tWave, tFlip, tHot];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  const SW = 1200, SH = 780;
  const scale = v ? 0.72 : 0.84;
  const on = t >= tOn;
  const waves = interpolate(t, [tWave, tWave + 0.8], [0, 1], clamp);
  const flipIn = interpolate(t, [tFlip, tFlip + 0.5], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const heat = interpolate(t, [tFlip, tHot + 0.6], [0, 1], clamp);
  const hot = t >= tHot;

  // Drehteller
  const ang = on ? (t - tOn) * 1.6 : 0;
  const cx = 450, plateY = 500;
  const bowlX = cx + Math.sin(ang) * 70;
  const bowlS = 0.92 + Math.cos(ang) * 0.08;
  // Farbe der Speise: blau (kalt) → orange → rot (heiß)
  const food = heat < 0.5
    ? `rgb(${Math.round(90 + heat * 2 * 165)},${Math.round(150 + heat * 2 * 30)},${Math.round(230 - heat * 2 * 190)})`
    : `rgb(255,${Math.round(180 - (heat - 0.5) * 2 * 110)},${Math.round(40 - (heat - 0.5) * 2 * 10)})`;

  // Molekül-Drehung: wird mit der Zeit schneller
  const spin = Math.max(0, t - tFlip);
  const freq = 2 + Math.min(10, spin * 4);
  const flip = Math.sin(spin * freq * Math.PI) * 80;

  // Zickzack-Welle zwischen den Garraumwänden
  const wavePath = (y0: number, phase: number) => {
    const pts: string[] = [];
    for (let x = 140; x <= 760; x += 6) {
      const y = y0 + Math.sin((x / 620) * Math.PI * 6 - t * 10 + phase) * 26;
      pts.push(`${x},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  };

  const secLeft = Math.max(0, 30 - Math.floor(on ? (t - tOn) * 3 : 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 66 : 62} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && (
          <PopIn key={cur} at={times[cur]} sfx={null}>
            <Chip bg={cur === 3 ? C.red : C.yellow} fg={cur === 3 ? C.white : C.ink} size={v ? 44 : 42}>
              <span style={{ opacity: 0.6 }}>{cur + 1}/4 · </span>{steps[cur]}
            </Chip>
          </PopIn>
        )}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ transform: `scale(${scale})`, transformOrigin: "top left", overflow: "visible" }}>
          {/* Gehäuse */}
          <rect x={60} y={40} width={1080} height={600} rx={36} fill="#c9cedb" stroke="#11151d" strokeWidth={8} />
          <rect x={60} y={640} width={1080} height={22} rx={8} fill="#8994ab" stroke="#11151d" strokeWidth={6} />
          {/* Garraum */}
          <rect x={120} y={100} width={660} height={480} rx={14} fill={on ? "#2a2f1e" : "#1a2236"} stroke="#5b6476" strokeWidth={10} />
          {on && <rect x={125} y={105} width={650} height={470} rx={12} fill="#ffd36b" opacity={0.18} />}
          {/* Türgitter (angedeutet) */}
          {Array.from({ length: 22 }).map((_, i) => Array.from({ length: 15 }).map((__, j) => (
            <circle key={`${i}-${j}`} cx={150 + i * 29} cy={130 + j * 30} r={3} fill="#11151d" opacity={0.25} />
          )))}
          {/* Wellen */}
          {waves > 0 && [180, 280, 380].map((y0, i) => (
            <polyline key={i} points={wavePath(y0, i * 1.7)} fill="none" stroke={C.accent} strokeWidth={6} strokeLinecap="round" opacity={waves * (0.9 - i * 0.15)} />
          ))}
          {waves > 0 && <Sfx at={tWave} name="whoosh" vol={0.5} />}
          {/* Hohlleiter vom Magnetron */}
          <rect x={780} y={150} width={110} height={56} fill="#8994ab" stroke="#11151d" strokeWidth={6} />
          {waves > 0 && <polyline points={Array.from({ length: 18 }).map((_, k) => `${885 - k * 6},${178 + Math.sin(k * 1.4 - t * 12) * 14}`).join(" ")} fill="none" stroke={C.accent} strokeWidth={5} />}
          {/* Magnetron */}
          <rect x={880} y={110} width={150} height={140} rx={12} fill={on ? C.red : "#5b6476"} stroke="#11151d" strokeWidth={7} />
          {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={895 + k * 26} y={124} width={12} height={112} rx={4} fill="#11151d" opacity={0.35} />)}
          {on && <rect x={880} y={110} width={150} height={140} rx={12} fill="none" stroke={C.yellow} strokeWidth={4} opacity={0.5 + 0.5 * Math.sin(t * 20)} />}
          <text x={955} y={290} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={on ? C.red : "#3b4a6b"}>Magnetron</text>
          {on && <Sfx at={tOn} name="tick" vol={0.5} />}
          {/* Bedienfeld */}
          <rect x={870} y={320} width={170} height={70} rx={10} fill="#11151d" />
          <text x={955} y={370} textAnchor="middle" fontFamily="monospace" fontWeight={900} fontSize={44} fill={on ? C.accent : "#3b4a6b"}>
            {`0:${String(secLeft).padStart(2, "0")}`}
          </text>
          {[0, 1].map((k) => <circle key={k} cx={915 + k * 80} cy={460} r={30} fill="#8994ab" stroke="#11151d" strokeWidth={6} />)}
          <rect x={890} y={530} width={130} height={60} rx={12} fill={on ? C.green : "#5b6476"} stroke="#11151d" strokeWidth={6} />
          <text x={955} y={571} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={28} fill={C.white}>START</text>
          {/* Drehteller */}
          <ellipse cx={cx} cy={plateY + 14} rx={230} ry={40} fill="#8994ab" opacity={0.5} />
          <ellipse cx={cx} cy={plateY} rx={230} ry={40} fill="#e8f0ff" opacity={0.75} stroke="#11151d" strokeWidth={5} />
          {/* Schüssel */}
          <g transform={`translate(${bowlX} ${plateY - 10}) scale(${bowlS})`}>
            <path d="M-110 -70 L110 -70 Q100 30 0 30 Q-100 30 -110 -70 Z" fill="#f7f4ed" stroke="#11151d" strokeWidth={6} />
            <ellipse cx={0} cy={-70} rx={110} ry={22} fill={food} stroke="#11151d" strokeWidth={6} />
          </g>
          {/* Dampf */}
          {heat > 0.55 && [-50, 0, 50].map((dx, k) => {
            const ph = (t * 0.9 + k * 0.33) % 1;
            const y = plateY - 110 - ph * 120;
            return <path key={k} d={`M${bowlX + dx} ${y + 50} q 18 -12 0 -25 q -18 -12 0 -25`} fill="none" stroke={C.white} strokeWidth={7} strokeLinecap="round" opacity={(1 - ph) * (heat - 0.55) * 2.2} />;
          })}
          {hot && <Sfx at={tHot} name="ding" vol={0.7} />}
          {/* Lupen-Zoom auf die Wassermoleküle */}
          {flipIn > 0 && (
            <g transform={`translate(330 230) scale(${flipIn})`}>
              <line x1={30} y1={120} x2={100} y2={200} stroke="#11151d" strokeWidth={22} strokeLinecap="round" />
              <circle cx={-40} cy={20} r={150} fill="#e8f0ff" stroke="#11151d" strokeWidth={14} />
              <circle cx={-40} cy={20} r={150} fill={C.red} opacity={heat * 0.25} />
              <Molecule x={-95} y={-35} rot={flip} s={1} />
              <Molecule x={20} y={-30} rot={-flip * 0.9 + 20} s={0.9} />
              <Molecule x={-110} y={70} rot={-flip + 10} s={0.9} />
              <Molecule x={5} y={75} rot={flip * 0.95 - 15} s={1} />
              {/* Feldpfeil wechselt die Richtung */}
              <g transform={`translate(-40 ${-125}) scale(${Math.sin(spin * freq * Math.PI) >= 0 ? 1 : -1} 1)`}>
                <line x1={-40} y1={0} x2={40} y2={0} stroke={C.accent} strokeWidth={8} />
                <path d="M40 -14 L62 0 L40 14 Z" fill={C.accent} />
              </g>
            </g>
          )}
          {flipIn > 0 && <Sfx at={tFlip} name="pop" vol={0.5} />}
        </svg>
      </div>
    </div>
  );
};
