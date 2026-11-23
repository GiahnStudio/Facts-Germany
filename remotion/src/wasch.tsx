import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useScene, useT } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#11151d";
const STEEL = "#9aa6bd";
const CLOTH = ["#e8423f", "#4c8cf0", "#ffc400", "#25b56f", "#f28bc0", "#ffffff", "#8a5cf0", "#ff8a1f"];

/** Waschmaschine von vorn mit Bullauge.
 *  mode "wiegen":  Wäsche fällt rein (load_at) → Trommel dreht hin und her (spin_at), Kraftkurve am Motor
 *                  → Display "kg" (weigh_at) → Wasser läuft passend ein (water_at)
 *  mode "unwucht": Schleudern mit einem schweren Teil (spin_at) → Maschine wackelt, Drehzahl sinkt (wobble_at)
 *                  → Trommel bremst, Wäsche wird neu verteilt (fix_at) → läuft rund, volle Drehzahl (fast_at)
 *  optional: steps (4 Texte), kg (Text im Display), rpm (Enddrehzahl) */
export const WaschScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const un = s.mode === "unwucht";

  const tA = at(un ? s.spin_at : s.load_at, 0.05);
  const tB = at(un ? s.wobble_at : s.spin_at, 0.3);
  const tC = at(un ? s.fix_at : s.weigh_at, 0.6);
  const tD = at(un ? s.fast_at : s.water_at, 0.82);
  const steps: string[] = s.steps || (un
    ? ["Schleudern mit Badematte", "Unwucht! Drehzahl runter", "Bremsen, Wäsche verteilen", "Läuft rund"]
    : ["Wäsche rein, Tür zu", "Trommel dreht hin und her", "Motor spürt das Gewicht", "Wasser passend zur Menge"]);
  const times = [tA, tB, tC, tD];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  const SW = 1300, SH = 720;
  const scale = v ? 0.8 : 0.9;
  const cx = 330, cy = 420, R = 190; // Bullauge
  const rpmMax = s.rpm || 1400;

  // ---------------- Trommelwinkel, Drehzahl, Wackeln
  let ang = 0, rpm = 0, shake = 0;
  if (!un) {
    // hin und her: beschleunigen, bremsen, andere Richtung
    const k = interpolate(t, [tB, tB + 0.4, tC + 0.6, tC + 1.2], [0, 1, 1, 0], clamp);
    ang = k * 260 * Math.sin((t - tB) * 2.6);
    rpm = 0;
  } else {
    const ramp1 = interpolate(t, [tA, tA + 1.6], [0, rpmMax * 0.75], { ...clamp, easing: Easing.inOut(Easing.quad) });
    const drop1 = interpolate(t, [tB, tB + 1.0], [1, 0.4], clamp);
    const stop = interpolate(t, [tC, tC + 0.9], [1, 0], clamp);
    const ramp2 = interpolate(t, [tD, tD + 1.6], [0, rpmMax], { ...clamp, easing: Easing.inOut(Easing.quad) });
    rpm = t < tD ? ramp1 * drop1 * stop : ramp2;
    // Winkel integrieren (grob): sichtbar langsamer als echt
    const vis = (r: number) => r / 4;
    ang = (t < tD ? vis(rpm) * (t - tA) : vis(rpm) * (t - tD)) * 6 % 360;
    const amp = t < tC ? interpolate(t, [tA + 0.6, tB, tB + 0.5], [0, 7, 20], clamp) * stop : 0;
    shake = amp * Math.sin(t * 42);
  }

  // ---------------- Wäschestücke (Trommelkoordinaten, Grad 90 = unten)
  const pieces = Array.from({ length: 8 }, (_, i) => ({
    a: 90 + (i - 3.5) * 17 + (i % 2 ? 6 : -4),
    r: 120 + (i % 3) * 16,
    w: 70 + (i % 3) * 14,
    h: 46 + (i % 2) * 12,
    c: CLOTH[i],
    d: i * 0.12,
  }));
  const loadP = (d: number) => interpolate(t, [tA + d, tA + d + 0.55], [0, 1], { ...clamp, easing: Easing.out(Easing.bounce) });

  // ---------------- Kraftkurve (Modus wiegen)
  const gx = 700, gy = 120, gw = 540, gh = 300;
  const trace = (amp: number) => {
    const end = Math.min(t, tC + 1.2);
    const pts: string[] = [];
    for (let x = tB; x <= end; x += 0.05) {
      const u = (x - tB) / Math.max(0.5, tC + 1.2 - tB);
      const k = interpolate(x, [tB, tB + 0.4, tC + 0.6, tC + 1.2], [0, 1, 1, 0], clamp);
      const y = gy + gh / 2 - amp * k * Math.cos((x - tB) * 2.6) * (gh / 2 - 20);
      pts.push(`${gx + 20 + u * (gw - 40)},${y}`);
    }
    return pts.join(" ");
  };
  const showKg = !un && t >= tC;
  const kgBlink = showKg && t < tC + 1.4 ? Math.floor((t - tC) * 4) % 2 === 0 : showKg;
  const kgDone = !un && t >= tC + 1.4;
  const water = !un ? interpolate(t, [tD, tD + 2.0], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  const waterTop = cy + R - water * R * 0.85;

  const warn = un && t >= tB && t < tC + 0.6;
  const good = un && t >= tD + 1.2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 64 : 60} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && <PopIn key={cur} at={times[cur]} sfx={null}><Chip bg={un && cur === 1 ? C.red : C.yellow} fg={un && cur === 1 ? C.white : C.ink} size={v ? 42 : 40}><span style={{ opacity: 0.6 }}>{cur + 1}/4 · </span>{steps[cur]}</Chip></PopIn>}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ transform: `scale(${scale})`, transformOrigin: "top left", overflow: "visible" }}>
          <defs>
            <clipPath id="bull"><circle cx={cx} cy={cy} r={R - 6} /></clipPath>
          </defs>
          <g transform={`translate(${shake},${Math.abs(shake) * 0.25}) rotate(${shake * 0.15} ${cx} 700)`}>
            {/* Gehäuse */}
            <rect x={60} y={40} width={540} height={660} rx={30} fill={C.card} stroke={INK} strokeWidth={8} />
            <rect x={60} y={40} width={540} height={130} rx={30} fill="#e4e0d6" stroke={INK} strokeWidth={8} />
            {/* Waschmittelschublade */}
            <rect x={90} y={70} width={150} height={60} rx={8} fill="#fff" stroke={INK} strokeWidth={5} />
            {/* Display */}
            <rect x={300} y={66} width={190} height={70} rx={10} fill="#0f2a28" stroke={INK} strokeWidth={5} />
            <text x={395} y={116} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={un ? 34 : 40} fill={warn ? "#ff6b66" : C.accent}>
              {un ? `${Math.round(rpm / 10) * 10}` : kgDone ? (s.kg || "4,5 kg") : kgBlink ? "kg" : t >= tB ? "···" : "– –"}
            </text>
            {un && <text x={395} y={156} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} fill={C.muted}>U/min</text>}
            {/* Drehknopf */}
            <circle cx={545} cy={102} r={34} fill="#fff" stroke={INK} strokeWidth={6} />
            <rect x={541} y={72} width={8} height={26} rx={3} fill={INK} transform={`rotate(${t >= tA ? 60 : 0} 545 102)`} />
            {/* Bullauge Rahmen */}
            <circle cx={cx} cy={cy} r={R + 34} fill="#cfd5e0" stroke={INK} strokeWidth={8} />
            <circle cx={cx} cy={cy} r={R} fill="#1b2438" stroke={INK} strokeWidth={6} />
            <g clipPath="url(#bull)">
              {/* Trommel mit Löchern + Mitnehmern */}
              <g transform={`rotate(${ang} ${cx} ${cy})`}>
                {Array.from({ length: 36 }).map((_, i) => {
                  const a = (i / 36) * Math.PI * 2;
                  return <circle key={i} cx={cx + Math.cos(a) * (R - 30)} cy={cy + Math.sin(a) * (R - 30)} r={5} fill="#2c3854" />;
                })}
                {[0, 120, 240].map((d) => (
                  <rect key={d} x={cx - 16} y={cy - R + 4} width={32} height={46} rx={10} fill={STEEL} stroke={INK} strokeWidth={4} transform={`rotate(${d} ${cx} ${cy})`} />
                ))}
                {/* Wäsche */}
                {!un && pieces.map((p, i) => {
                  const lp = loadP(p.d);
                  const a = (p.a * Math.PI) / 180;
                  const x = cx + Math.cos(a) * p.r, y0 = cy + Math.sin(a) * p.r;
                  const y = interpolate(lp, [0, 1], [cy - R - 120, y0]);
                  if (t < tA + p.d - 0.02) return null;
                  return <ellipse key={i} cx={x} cy={y} rx={p.w / 2} ry={p.h / 2} fill={p.c} stroke={INK} strokeWidth={4} transform={`rotate(${p.a - 90 + (i % 2 ? 18 : -14)} ${x} ${y})`} />;
                })}
                {un && (() => {
                  // Badematte unten, kleine Teile erst daneben verklumpt, nach fix_at gegenüber verteilt
                  const k = interpolate(t, [tC + 0.4, tC + 1.2], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
                  const smalls = [0, 1, 2, 3, 4].map((i) => {
                    const a0 = 90 + (i - 2) * 22 + (i % 2 ? 8 : -8);
                    const a1 = 210 + i * 30;
                    const a = ((a0 + (a1 - a0) * k) * Math.PI) / 180;
                    const r = (i % 2 ? 100 : 118) * (1 - k) + 132 * k;
                    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
                    return <ellipse key={i} cx={x} cy={y} rx={32} ry={21} fill={CLOTH[i]} stroke={INK} strokeWidth={4} transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} />;
                  });
                  return (
                    <g>
                      {smalls}
                      <rect x={cx - 95} y={cy + R - 76} width={190} height={58} rx={16} fill="#25b56f" stroke={INK} strokeWidth={5} />
                      <text x={cx} y={cy + R - 38} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} fill={INK}>BADEMATTE</text>
                    </g>
                  );
                })()}
              </g>
              {/* Wasser */}
              {!un && water > 0 && (
                <path d={`M ${cx - R} ${waterTop} Q ${cx - R / 2} ${waterTop - 14 * Math.sin(t * 4)} ${cx} ${waterTop} T ${cx + R} ${waterTop} V ${cy + R} H ${cx - R} Z`} fill="#4c8cf0" opacity={0.55} />
              )}
            </g>
            {/* Glas-Reflex */}
            <path d={`M ${cx - 120} ${cy - 90} A 150 150 0 0 1 ${cx - 30} ${cy - 150}`} stroke="#ffffff55" strokeWidth={14} fill="none" strokeLinecap="round" />
            {/* Füße */}
            <rect x={90} y={700} width={60} height={18} fill={INK} />
            <rect x={510} y={700} width={60} height={18} fill={INK} />
          </g>
          {un && warn && <>
            <path d="M 30 300 l -24 -10 M 30 360 l -28 0 M 30 420 l -24 10" stroke={C.red} strokeWidth={8} strokeLinecap="round" />
            <path d="M 630 300 l 24 -10 M 630 360 l 28 0 M 630 420 l 24 10" stroke={C.red} strokeWidth={8} strokeLinecap="round" />
          </>}

          {/* ---------------- Rechte Seite */}
          {!un ? (
            <g>
              <rect x={gx} y={gy} width={gw} height={gh} rx={22} fill="#14213a" stroke="#3b4a6b" strokeWidth={5} />
              <text x={gx + 24} y={gy - 18} fontFamily={FONT} fontWeight={900} fontSize={36} fill={C.white}>Kraft am Motor</text>
              <line x1={gx + 20} y1={gy + gh / 2} x2={gx + gw - 20} y2={gy + gh / 2} stroke="#3b4a6b" strokeWidth={3} strokeDasharray="10 8" />
              {t >= tB && <polyline points={trace(0.35)} fill="none" stroke={C.muted} strokeWidth={5} strokeDasharray="12 8" />}
              {t >= tB && <polyline points={trace(0.9)} fill="none" stroke={C.yellow} strokeWidth={8} strokeLinejoin="round" />}
              {t >= tB + 0.6 && <>
                <rect x={gx + 20} y={gy + gh + 26} width={26} height={8} fill={C.muted} />
                <text x={gx + 56} y={gy + gh + 40} fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.muted}>leere Trommel</text>
                <rect x={gx + 300} y={gy + gh + 24} width={26} height={12} fill={C.yellow} />
                <text x={gx + 336} y={gy + gh + 40} fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.yellow}>volle Trommel</text>
              </>}
              {water > 0 && (
                <g opacity={interpolate(t, [tD, tD + 0.4], [0, 1], clamp)}>
                  <path d={`M ${gx + 60} ${gy + gh + 90} q 22 34 0 52 q -22 -18 0 -52 z`} fill={C.blue} stroke={INK} strokeWidth={4} />
                  <text x={gx + 100} y={gy + gh + 132} fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.white}>Wasser nach Menge</text>
                </g>
              )}
            </g>
          ) : (
            <g>
              <text x={700} y={160} fontFamily={FONT} fontWeight={900} fontSize={36} fill={C.muted}>Drehzahl</text>
              <text x={700} y={290} fontFamily={FONT} fontWeight={900} fontSize={130} fill={warn ? C.red : good ? C.green : C.white}>{Math.round(rpm / 10) * 10}</text>
              <text x={700} y={345} fontFamily={FONT} fontWeight={800} fontSize={36} fill={C.muted}>Umdrehungen pro Minute</text>
              <rect x={700} y={380} width={520} height={34} rx={17} fill="#14213a" stroke="#3b4a6b" strokeWidth={4} />
              <rect x={704} y={384} width={Math.max(0, 512 * (rpm / rpmMax))} height={26} rx={13} fill={warn ? C.red : good ? C.green : C.yellow} />
              {warn && (
                <g>
                  <rect x={700} y={450} width={360} height={80} rx={18} fill={C.red} stroke={INK} strokeWidth={5} />
                  <text x={880} y={505} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={C.white}>UNWUCHT!</text>
                </g>
              )}
              {good && (
                <g>
                  <rect x={700} y={450} width={360} height={80} rx={18} fill={C.green} stroke={INK} strokeWidth={5} />
                  <text x={880} y={505} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={C.white}>✓ LÄUFT RUND</text>
                </g>
              )}
            </g>
          )}
        </svg>
      </div>
      {/* Sounds außerhalb des SVG */}
      {!un && t >= tB && <Sfx at={tB} name="roll" vol={0.5} />}
      {showKg && <Sfx at={tC + 1.4} name="ding" vol={0.5} />}
      {water > 0 && <Sfx at={tD} name="whoosh" vol={0.4} />}
      {un && t >= tA && <Sfx at={tA} name="roll" vol={0.5} />}
      {un && t >= tB && <Sfx at={tB} name="thud" vol={0.6} />}
      {un && t >= tC + 0.5 && <Sfx at={tC + 0.5} name="pop" vol={0.4} />}
      {good && <Sfx at={tD + 1.2} name="ding" vol={0.5} />}
    </div>
  );
};
