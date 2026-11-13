import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useT, useScene } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const WATER = "#5fb4f0";
const PIPE = "#e8f0ff";
const INK = "#11151d";

/** Toilettenspülung im Querschnitt: Taste → Ablaufventil hebt sich → Kasten leert sich in die Schüssel →
 *  Schwimmer sinkt, Füllventil öffnet → Kasten füllt sich, Schwimmer schließt → Wasser im Bogen bleibt (Geruchssperre).
 *  Cues: press_at, flush_at, fill_at, seal_at */
export const SpuelungScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const tPress = at(s.press_at, 0.08), tFlush = at(s.flush_at, 0.25), tFill = at(s.fill_at, 0.5), tSeal = at(s.seal_at, 0.8);
  const steps: string[] = s.steps || ["Taste hebt das Ablaufventil", "Der Kasten leert sich in die Schüssel", "Schwimmer sinkt, Füllventil öffnet", "Im Bogen bleibt Wasser stehen"];
  const times = [tPress, tFlush, tFill, tSeal];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  // Zeitachse der Spülung
  const f0 = Math.max(tPress + 0.5, tFlush - 1.2), f1 = f0 + 3;
  const r0 = Math.max(f1 + 0.3, tFill + 0.8), r1 = Math.max(r0 + 3, tSeal - 2.5);
  const lvl = t < f1 ? interpolate(t, [f0, f1], [1, 0.08], { ...clamp, easing: Easing.in(Easing.quad) })
    : interpolate(t, [r0, r1], [0.08, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const lift = interpolate(t, [tPress + 0.2, tPress + 0.5, Math.max(f1, tFill), Math.max(f1, tFill) + 0.4], [0, 1, 1, 0], clamp);
  const press = interpolate(t, [tPress - 0.05, tPress + 0.1, tPress + 0.5], [0, 1, 0], clamp);
  const surge = interpolate(t, [f0 + 0.2, f0 + 0.7, f1, f1 + 1.0], [0, 1, 1, 0], clamp);
  const inflow = t > tFill && t < r1 + 0.2;
  const seal = interpolate(t, [tSeal, tSeal + 0.5], [0, 1], clamp);

  // Spülkasten (innen): x 90..510, y 110..380
  const top = 110, bot = 380;
  const wy = bot - lvl * (bot - top - 20);
  const floatY = Math.min(wy - 26, bot - 60);
  const SW = 1200, SH = 800;
  const scale = v ? 0.78 : 0.94;
  const flowDash = -t * 260;

  // Schüssel + Geruchsverschluss
  const bowl = "M600 470 L990 470 Q975 590 860 632 Q820 646 800 652 L760 652 Q648 610 600 470 Z";
  const bowlWater = interpolate(surge, [0, 1], [628, 560]);
  const trap = "M780 650 L780 715 Q780 760 825 760 L870 760 Q915 760 915 715 L915 690 Q915 662 945 662 L1150 662";
  const trapWater = "M780 688 L780 715 Q780 760 825 760 L870 760 Q915 760 915 715 L915 688";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 64 : 60} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && (
          <PopIn key={cur} at={times[cur]} sfx={null}>
            <Chip bg={cur === 3 ? C.green : C.yellow} fg={cur === 3 ? C.white : C.ink} size={v ? 42 : 40}>
              <span style={{ opacity: 0.6 }}>{cur + 1}/4 · </span>{steps[cur]}
            </Chip>
          </PopIn>
        )}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ transform: `scale(${scale})`, transformOrigin: "top left", overflow: "visible" }}>
          <defs>
            <clipPath id="tank"><rect x={90} y={top - 30} width={540} height={bot - top + 30} /></clipPath>
            <clipPath id="bowl"><path d={bowl} /></clipPath>
          </defs>
          {/* Wand */}
          <rect x={1060} y={40} width={90} height={740} fill="#3b4a6b" opacity={0.55} />

          {/* Spülkasten */}
          <rect x={70} y={70} width={580} height={330} rx={22} fill="#dfe4ee" stroke={INK} strokeWidth={8} />
          <rect x={90} y={wy} width={540} height={bot - wy} fill={WATER} opacity={0.9} clipPath="url(#tank)" />
          <line x1={90} x2={630} y1={wy} y2={wy} stroke="#ffffffaa" strokeWidth={4} clipPath="url(#tank)" />
          <text x={330} y={56} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill={C.white}>Spülkasten</text>
          {/* Taste */}
          <rect x={540} y={44 + press * 10} width={90} height={30 - press * 10} rx={8} fill={press > 0.1 ? C.accent : "#8994ab"} stroke={INK} strokeWidth={6} />
          <Sfx at={tPress} name="tick" vol={0.6} />
          {/* Gestänge Taste → Ventil */}
          <path d={`M585 ${74 + press * 6} L585 110 L470 110 L470 ${150 - lift * 50}`} fill="none" stroke="#5b6476" strokeWidth={6} />

          {/* Ablaufventil mit Überlaufrohr */}
          <g transform={`translate(0 ${-lift * 50})`}>
            <rect x={458} y={150} width={24} height={210} fill="#c9cedb" stroke={INK} strokeWidth={5} />
            <path d="M430 360 L510 360 L502 384 L438 384 Z" fill={C.red} stroke={INK} strokeWidth={5} />
          </g>
          <text x={668} y={385} fontFamily={FONT} fontWeight={800} fontSize={34} fill={C.white}>← Ablaufventil</text>

          {/* Füllventil + Schwimmer */}
          <rect x={120} y={120} width={22} height={260} fill="#c9cedb" stroke={INK} strokeWidth={5} />
          <rect x={108} y={104} width={46} height={28} rx={6} fill={inflow ? C.green : "#8994ab"} stroke={INK} strokeWidth={5} />
          <line x1={154} y1={118} x2={196} y2={floatY} stroke="#5b6476" strokeWidth={6} />
          <rect x={170} y={floatY} width={56} height={44} rx={10} fill={C.yellow} stroke={INK} strokeWidth={5} />
          {inflow && (
            <line x1={131} y1={384} x2={131} y2={Math.max(wy, 140)} stroke={WATER} strokeWidth={10} strokeDasharray="16 10" strokeDashoffset={flowDash} opacity={0.9} />
          )}
          <text x={238} y={Math.max(floatY + 30, 170)} fontFamily={FONT} fontWeight={800} fontSize={34} fill={INK}>Schwimmer</text>
          <text x={150} y={492} fontFamily={FONT} fontWeight={800} fontSize={32} fill={C.white} opacity={0.9}>↑ Füllventil</text>

          {/* Zulauf von unten links */}
          <path d="M131 400 L131 440 L40 440" fill="none" stroke={INK} strokeWidth={22} />
          <path d="M131 400 L131 440 L40 440" fill="none" stroke={inflow ? WATER : PIPE} strokeWidth={12} />

          {/* Spülrohr Kasten → Schüssel */}
          <path d="M470 400 L470 445 Q470 470 500 470 L640 470" fill="none" stroke={INK} strokeWidth={46} />
          <path d="M470 400 L470 445 Q470 470 500 470 L640 470" fill="none" stroke={PIPE} strokeWidth={34} />
          {surge > 0 && <path d="M470 400 L470 445 Q470 470 500 470 L640 470" fill="none" stroke={WATER} strokeWidth={30} strokeDasharray="40 14" strokeDashoffset={flowDash} opacity={surge} />}
          {surge > 0 && <Sfx at={f0 + 0.2} name="whoosh" vol={0.7} />}

          {/* Schüssel */}
          <path d={bowl} fill="#f7f4ed" stroke={INK} strokeWidth={8} />
          <rect x={600} y={bowlWater} width={400} height={200} fill={WATER} clipPath="url(#bowl)" opacity={0.95} />
          {surge > 0.05 && [0, 1, 2].map((k) => {
            const a = t * 5 + k * 2.1;
            return <path key={k} d={`M${790 + Math.cos(a) * 60} ${bowlWater + 30 + Math.sin(a) * 14} q 25 -18 50 0`} fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" opacity={surge} />;
          })}
          <rect x={580} y={458} width={430} height={22} rx={10} fill="#f7f4ed" stroke={INK} strokeWidth={7} />

          {/* Geruchsverschluss (Bogen) */}
          <path d={trap} fill="none" stroke={INK} strokeWidth={52} strokeLinejoin="round" />
          <path d={trap} fill="none" stroke={PIPE} strokeWidth={38} strokeLinejoin="round" />
          <path d={trapWater} fill="none" stroke={WATER} strokeWidth={38} />
          {surge > 0 && <path d="M780 652 L780 715 Q780 760 825 760 L870 760 Q915 760 915 715 L915 690 Q915 662 945 662 L1150 662" fill="none" stroke={WATER} strokeWidth={30} strokeDasharray="30 16" strokeDashoffset={flowDash} opacity={surge} />}
          <path d="M760 652 L800 652" stroke={INK} strokeWidth={8} />
          {/* Geruch aus dem Kanal (wird vom Wasser gestoppt) */}
          {seal > 0 && [0, 1, 2].map((k) => {
            const ph = (t * 0.6 + k * 0.33) % 1;
            const x = 1130 - ph * 190;
            return <path key={k} d={`M${x} ${640 - k * 4} q 12 -14 24 0 q 12 14 24 0`} fill="none" stroke="#8bc34a" strokeWidth={6} strokeLinecap="round" opacity={seal * (1 - ph) * 0.9} />;
          })}
          {seal > 0 && (
            <g opacity={seal}>
              <circle cx={848} cy={735} r={95 + 6 * Math.sin(t * 6)} fill="none" stroke={C.green} strokeWidth={8} strokeDasharray="18 12" />
            </g>
          )}
          <text x={745} y={770} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={36} fill={seal > 0 ? C.green : C.white}>Geruchsverschluss</text>
          <text x={1000} y={630} fontFamily={FONT} fontWeight={800} fontSize={34} fill={C.white} opacity={0.85}>Kanal</text>
          {seal > 0 && <Sfx at={tSeal} name="ding" vol={0.6} />}
        </svg>
      </div>
    </div>
  );
};
