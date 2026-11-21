import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useT, useScene } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#11151d";
const STEEL = "#9aa6bd";

type Pt = [number, number];
const quad = (a: Pt, c: Pt, b: Pt, n = 24): Pt[] => {
  const out: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    out.push([(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]);
  }
  return out;
};
const line = (a: Pt, b: Pt, n = 12): Pt[] => Array.from({ length: n }, (_, i) => [a[0] + ((b[0] - a[0]) * (i + 1)) / n, a[1] + ((b[1] - a[1]) * (i + 1)) / n] as Pt);

/** Weg des Stroms: Kraftwerk → Umspannwerk hoch auf 380 kV → Freileitung über Strommasten → Umspannwerk runter
 *  (110 kV, Mittelspannung 10–30 kV) → Ortsnetzstation → 230 V in der Steckdose, die Lampe geht an.
 *  Cues: gen_at, up_at, line_at, down_at, home_at  (optional: steps) */
export const NetzScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const tGen = at(s.gen_at, 0.05), tUp = at(s.up_at, 0.25), tLine = at(s.line_at, 0.45), tDown = at(s.down_at, 0.65), tHome = at(s.home_at, 0.85);
  const steps: string[] = s.steps || ["Das Kraftwerk erzeugt Strom", "Hoch auf 380.000 Volt", "Ab über Land", "Umspannwerke senken die Spannung", "230 Volt in der Steckdose"];
  const times = [tGen, tUp, tLine, tDown, tHome];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  const SW = 1400, SH = 720;
  const scale = v ? 0.74 : 0.92;
  const G = 640; // Boden

  // ---------------- Leitungsweg (gleiche Geometrie für Zeichnung und Strom-Kopf)
  const gen: Pt = [130, 520], tr1: Pt = [300, 520];
  const p1: Pt = [470, 300], p2: Pt = [680, 300], p3: Pt = [890, 300];
  const uw: Pt = [1010, 520], mv: Pt = [1110, 450], ons: Pt = [1190, 560], sock: Pt = [1318, 580];
  const segs: Pt[][] = [
    line(gen, tr1, 10),
    quad(tr1, [360, 330], p1, 20),
    quad(p1, [575, 345], p2, 24),
    quad(p2, [785, 345], p3, 24),
    quad(p3, [960, 330], uw, 20),
    quad(uw, [1060, 460], mv, 12),
    quad(mv, [1160, 470], ons, 12),
    quad(ons, [1260, 600], sock, 12),
  ];
  const pts: Pt[] = [gen];
  const marks: number[] = [0];
  segs.forEach((sg) => { sg.forEach((p) => pts.push(p)); marks.push(pts.length - 1); });
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const dAt = (k: number) => cum[marks[k]];
  // Cue → Abschnitt: gen→tr1 (gen..up), tr1→p1 (up..line), p1→p3 (line..down), p3→sock (down..home)
  const leg = (t0: number, t1: number, d0: number, d1: number) => {
    const dur = Math.max(0.4, Math.min(1.6, t1 - t0));
    return interpolate(t, [t0, t0 + dur], [d0, d1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  };
  let head = 0;
  if (t >= tGen) head = leg(tGen, tUp, 0, dAt(1));
  if (t >= tUp) head = leg(tUp, tLine, dAt(1), dAt(2));
  if (t >= tLine) head = leg(tLine, tDown, dAt(2), dAt(4));
  if (t >= tDown) head = leg(tDown, tHome, dAt(4), dAt(8));
  const total = cum[cum.length - 1];
  const pointAt = (d: number): Pt => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const a = pts[i - 1], b = pts[i];
    const u = cum[i] === cum[i - 1] ? 0 : (d - cum[i - 1]) / (cum[i] - cum[i - 1]);
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  };
  const headPt = pointAt(head);
  const flow: Pt[] = [];
  for (let d = (t * 180) % 70; d < head - 20; d += 70) flow.push(pointAt(d));
  const pathD = "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");

  // ---------------- Spannungsanzeige
  const downP = interpolate(t, [tDown, tDown + 1.6], [0, 1], clamp);
  let volt = "–";
  let voltCol = C.muted;
  if (t >= tGen) { volt = "Strom fließt"; voltCol = C.soft; }
  if (t >= tUp) {
    const n = Math.round(interpolate(t, [tUp, tUp + 0.8], [0, 380000], { ...clamp, easing: Easing.out(Easing.cubic) }));
    volt = n.toLocaleString("de-DE") + " V"; voltCol = C.red;
  }
  if (t >= tDown) {
    volt = downP < 0.5 ? "110.000 V" : "10.000–30.000 V"; voltCol = downP < 0.5 ? "#ff8a3d" : C.yellow;
  }
  if (t >= tHome) { volt = "230 V"; voltCol = C.green; }
  const lampOn = interpolate(t, [tHome + 0.4, tHome + 0.8], [0, 1], clamp);
  const spin = t >= tGen ? (t - tGen) * 360 * 1.2 : 0;

  const Pylon: React.FC<{ x: number }> = ({ x }) => (
    <g stroke={STEEL} strokeWidth={6} fill="none" strokeLinecap="round">
      <path d={`M${x} ${300 - 40} L${x - 46} ${G} M${x} ${300 - 40} L${x + 46} ${G}`} />
      <path d={`M${x - 70} 300 H${x + 70} M${x - 50} 350 H${x + 50}`} />
      <path d={`M${x - 30} 430 L${x + 34} 500 M${x + 30} 430 L${x - 34} 500 M${x - 38} 520 L${x + 40} 590 M${x + 38} 520 L${x - 40} 590`} strokeWidth={4} />
    </g>
  );
  const Label: React.FC<{ x: number; y: number; text: string; on: boolean }> = ({ x, y, text, on }) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} fill={on ? C.white : C.muted}>{text}</text>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 64 : 58} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && (
          <PopIn key={cur} at={times[cur]} sfx={null}>
            <Chip bg={cur === 4 ? C.green : C.yellow} fg={cur === 4 ? C.white : C.ink} size={v ? 40 : 40}>
              <span style={{ opacity: 0.6 }}>{cur + 1}/5 · </span>{steps[cur]}
            </Chip>
          </PopIn>
        )}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ transform: `scale(${scale})`, transformOrigin: "top left", overflow: "visible" }}>
          {/* Spannungsanzeige */}
          <rect x={430} y={40} width={540} height={130} rx={28} fill="#16233d" stroke={t >= tUp ? voltCol : "#2c3d60"} strokeWidth={6} />
          <text x={700} y={88} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.muted}>SPANNUNG</text>
          <text x={700} y={146} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={52} fill={voltCol}>{volt}</text>

          {/* Boden */}
          <rect x={0} y={G} width={SW} height={14} rx={7} fill="#2a3550" />

          {/* Kraftwerk */}
          <rect x={40} y={430} width={180} height={G - 430} rx={14} fill="#3a4560" stroke={INK} strokeWidth={6} />
          <rect x={70} y={340} width={40} height={90} fill="#4a5674" stroke={INK} strokeWidth={6} />
          {t >= tGen && [0, 1, 2].map((i) => {
            const ph = ((t - tGen) * 0.6 + i / 3) % 1;
            return <circle key={i} cx={90 + ph * 30} cy={330 - ph * 110} r={14 + ph * 26} fill="#c9d1df" opacity={0.55 * (1 - ph)} />;
          })}
          <g transform={`translate(${gen[0]} ${gen[1] + 30}) rotate(${spin})`}>
            <circle r={52} fill="#20283a" stroke={t >= tGen ? C.accent : STEEL} strokeWidth={8} />
            {[0, 60, 120].map((a) => <rect key={a} x={-6} y={-46} width={12} height={92} rx={6} fill={t >= tGen ? C.accent : STEEL} transform={`rotate(${a})`} />)}
            <circle r={12} fill={C.yellow} />
          </g>
          <Label x={130} y={G + 50} text="Kraftwerk" on={cur >= 0} />

          {/* Umspannwerk hoch */}
          <rect x={250} y={500} width={100} height={G - 500} rx={10} fill="#2f3a54" stroke={INK} strokeWidth={6} />
          <path d="M300 520 l-22 30 h14 v34 h16 v-34 h14 z" fill={t >= tUp ? C.red : STEEL} />
          <Label x={300} y={G + 50} text="hoch" on={cur >= 1} />

          {/* Masten */}
          <Pylon x={470} /><Pylon x={680} /><Pylon x={890} />
          <Label x={680} y={G + 50} text="Höchstspannung" on={cur >= 2} />

          {/* Umspannwerk runter */}
          <rect x={960} y={500} width={100} height={G - 500} rx={10} fill="#2f3a54" stroke={INK} strokeWidth={6} />
          <path d="M1010 600 l-22 -30 h14 v-34 h16 v34 h14 z" fill={t >= tDown ? C.yellow : STEEL} />
          <Label x={1010} y={G + 50} text="runter" on={cur >= 3} />
          {/* Mittelspannungsmast */}
          <path d={`M1110 450 V${G}`} stroke={STEEL} strokeWidth={8} />
          <path d="M1084 450 H1136" stroke={STEEL} strokeWidth={6} />
          {/* Ortsnetzstation */}
          <rect x={1160} y={545} width={64} height={G - 545} rx={8} fill="#5b6a86" stroke={INK} strokeWidth={5} />
          <path d="M1192 556 l-10 18 h8 l-4 16 l14 -22 h-8 z" fill={C.yellow} />

          {/* Haus */}
          <path d={`M1240 ${G} V520 L1318 450 L1396 520 V${G} Z`} fill="#e9e2d2" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <rect x={1300} y={566} width={36} height={36} rx={8} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <circle cx={1312} cy={584} r={4} fill={INK} /><circle cx={1324} cy={584} r={4} fill={INK} />
          {/* Lampe */}
          <line x1={1318} y1={470} x2={1318} y2={494} stroke={INK} strokeWidth={4} />
          {lampOn > 0 && <circle cx={1318} cy={512} r={30 + 40 * lampOn} fill={C.yellow} opacity={0.25 * lampOn} />}
          <circle cx={1318} cy={512} r={18} fill={lampOn > 0 ? C.yellow : "#cfd5df"} stroke={INK} strokeWidth={4} />
          <Label x={1318} y={G + 50} text="230 V" on={cur >= 4} />

          {/* Leitungen: grau, dann vom Strom erfasst */}
          {/* zweites und drittes Leiterseil (nur Deko) */}
          <path d={`M${p1[0] - 50} 350 Q575 392 ${p2[0] - 50} 350 Q785 392 ${p3[0] - 50} 350`} stroke="#566179" strokeWidth={3} fill="none" />
          <path d={`M${p1[0] + 50} 350 Q575 392 ${p2[0] + 50} 350 Q785 392 ${p3[0] + 50} 350`} stroke="#566179" strokeWidth={3} fill="none" />
          <path d={pathD} stroke="#566179" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {head > 0 && (
            <>
              <path d={pathD} stroke={voltCol === C.muted ? C.accent : voltCol} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={`${head} ${total + 100}`} />
              {flow.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={5} fill="#ffffff" opacity={0.85} />)}
              <circle cx={headPt[0]} cy={headPt[1]} r={18} fill={C.white} opacity={0.35} />
              <circle cx={headPt[0]} cy={headPt[1]} r={10} fill={C.white} />
            </>
          )}

          {t >= tGen && <Sfx at={tGen} name="roll" vol={0.3} />}
          {t >= tUp && <Sfx at={tUp} name="whoosh" vol={0.4} />}
          {t >= tLine && <Sfx at={tLine} name="swipe" vol={0.35} />}
          {t >= tDown && <Sfx at={tDown} name="tick" vol={0.4} />}
          {t >= tHome && <Sfx at={tHome + 0.4} name="ding" vol={0.5} />}
        </svg>
      </div>
    </div>
  );
};
