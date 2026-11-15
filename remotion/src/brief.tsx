import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useT, useScene } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#11151d";
const ORANGE = "#ff8a1f";

/** Briefverteilanlage im Briefzentrum: Brief läuft aufs Band → Kamera liest die Anschrift →
 *  Drucker druckt den orangefarbenen Leitcode unten auf den Umschlag → Brief fällt ins Fach seiner Leitregion.
 *  Cues: feed_at, scan_at, print_at, sort_at  (optional: plz, city, region, bins) */
export const BriefScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const tFeed = at(s.feed_at, 0.05), tScan = at(s.scan_at, 0.3), tPrint = at(s.print_at, 0.55), tSort = at(s.sort_at, 0.8);
  const steps: string[] = s.steps || ["Brief aufs Band", "Kamera liest die Anschrift", "Drucker setzt den Code drauf", "Ab ins richtige Fach"];
  const times = [tFeed, tScan, tPrint, tSort];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  const plz: string = s.plz || "18055";
  const city: string = s.city || "Rostock";
  const region: string = s.region || plz.slice(0, 2);
  const bins: string[] = s.bins || ["04", "50", region, "80"];
  const target = Math.max(0, bins.indexOf(region));

  const SW = 1200, SH = 800;
  const scale = v ? 0.8 : 0.9;

  // Geometrie
  const beltY = 540; // Oberkante Band
  const LW = 320, LH = 190; // Brief
  const camX = 470; // Mitte Kamera
  const prX = 760; // Druckkopf
  const binW = 170, binGap = 22, binX0 = 1200 - 40 - bins.length * binW - (bins.length - 1) * binGap, binY = 640;
  const binCx = binX0 + target * (binW + binGap) + binW / 2;

  // Bewegung des Briefs (linke Kante)
  const feed = interpolate(t, [tFeed, tFeed + 1.3], [-LW - 40, camX - LW / 2], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pr = interpolate(t, [tPrint, tPrint + 1.8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const prEnd = prX - 40; // linke Kante am Ende des Drucks
  let L = feed + pr * (prEnd - (camX - LW / 2));
  const sortMove = interpolate(t, [tSort, tSort + 0.8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const drop = interpolate(t, [tSort + 0.8, tSort + 1.4], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  L = L + sortMove * (binCx - LW / 2 - prEnd);
  const sc = 1 - drop * 0.62;
  const Ly = beltY - LH + drop * (binY + 76 - (beltY - LH));
  const inBin = t >= tSort + 1.4;

  // gedruckter Anteil: alles rechts vom Druckkopf
  const printedFrom = t >= tPrint ? Math.max(0, Math.min(LW, prX - L)) : LW;
  const bars = Array.from({ length: 30 }).map((_, i) => ({ x: LW - 18 - i * 7.6, h: (i * 7) % 3 === 0 ? 22 : (i * 5) % 3 === 1 ? 15 : 10 }));

  // Kamera-Blitz
  const flash = interpolate(t, [tScan, tScan + 0.12, tScan + 0.7], [0, 1, 0], clamp);
  const scanned = t >= tScan + 0.25;
  const readout = interpolate(t, [tScan + 0.6, tScan + 0.9], [0, 1], clamp);
  const beltDash = -t * (t < tSort + 1.4 ? 220 : 60);

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
            <clipPath id="brief-letter"><rect x={0} y={0} width={LW} height={LH} rx={10} /></clipPath>
          </defs>
          {/* Maschinengehäuse hinten */}
          <rect x={20} y={70} width={1160} height={beltY - 40} rx={26} fill="#16233d" stroke="#2c3d60" strokeWidth={6} />
          <text x={1150} y={118} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.muted}>BRIEFZENTRUM · SORTIERANLAGE</text>

          {/* Kamera */}
          <rect x={camX - 95} y={150} width={190} height={92} rx={16} fill="#c9cedb" stroke={INK} strokeWidth={7} />
          <circle cx={camX} cy={196} r={30} fill={INK} />
          <circle cx={camX} cy={196} r={17} fill={flash > 0.05 ? "#fff" : C.blue} />
          <circle cx={camX - 7} cy={189} r={5} fill="#ffffffaa" />
          <text x={camX} y={142} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.white}>Kamera</text>
          <path d={`M${camX - 30} 242 L${camX - LW / 2 - 10} ${beltY - LH - 4} L${camX + LW / 2 + 10} ${beltY - LH - 4} L${camX + 30} 242 Z`} fill="#bfe3ff" opacity={flash * 0.55} />
          {t >= tScan && <Sfx at={tScan} name="scan" vol={0.6} />}

          {/* Anzeige: was die Maschine gelesen hat */}
          <g opacity={readout} transform={`translate(${(1 - readout) * 30} 0)`}>
            <rect x={640} y={150} width={500} height={110} rx={18} fill={C.card} stroke={INK} strokeWidth={6} />
            <text x={664} y={196} fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.muted}>GELESEN</text>
            <text x={664} y={240} fontFamily={FONT} fontWeight={900} fontSize={40} fill={C.ink}>PLZ {plz} → Fach {region}</text>
          </g>
          {readout > 0.5 && <Sfx at={tScan + 0.75} name="data" vol={0.4} />}

          {/* Fächer */}
          {bins.map((b, i) => {
            const x = binX0 + i * (binW + binGap);
            const hit = i === target && inBin;
            return (
              <g key={i}>
                <rect x={x} y={binY} width={binW} height={150} rx={12} fill={hit ? C.green : "#2b3958"} stroke={INK} strokeWidth={6} />
                <text x={x + binW / 2} y={binY + 56} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={48} fill={hit ? C.white : C.soft}>{b}</text>
              </g>
            );
          })}
          <text x={binX0 - 20} y={binY + 80} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.muted}>Fächer →</text>
          {inBin && <Sfx at={tSort + 1.4} name="ding" vol={0.5} />}

          {/* Förderband */}
          <rect x={20} y={beltY} width={1160} height={30} rx={15} fill="#5b6476" stroke={INK} strokeWidth={6} />
          <line x1={34} x2={1166} y1={beltY + 15} y2={beltY + 15} stroke="#9aa3b5" strokeWidth={6} strokeDasharray="26 22" strokeDashoffset={beltDash} />
          {t >= tFeed && <Sfx at={tFeed} name="whoosh" vol={0.4} />}

          {/* Brief */}
          <g transform={`translate(${L + (LW * (1 - sc)) / 2} ${Ly}) scale(${sc})`}>
            <rect x={0} y={0} width={LW} height={LH} rx={10} fill={C.card} stroke={INK} strokeWidth={6} />
            <g clipPath="url(#brief-letter)">
              {/* Briefmarke */}
              <rect x={LW - 62} y={14} width={46} height={54} rx={4} fill={C.red} stroke={INK} strokeWidth={3} />
              <circle cx={LW - 39} cy={41} r={12} fill="#ffffff99" />
              {/* Anschrift */}
              {[["Lupo Lupe", 0], ["Hafenstraße 5", 1], [`${plz} ${city}`, 2]].map(([txt, i]) => (
                <text key={i as number} x={92} y={92 + (i as number) * 30} fontFamily={FONT} fontWeight={i === 2 ? 900 : 700} fontSize={24} fill={C.ink}>{txt as string}</text>
              ))}
              {scanned && <rect x={84} y={70} width={210} height={98} rx={6} fill="none" stroke={C.green} strokeWidth={5} strokeDasharray="12 8" />}
              {/* Leitcode unten rechts */}
              {bars.map((b, i) => (b.x >= printedFrom ? <rect key={i} x={b.x} y={LH - 8 - b.h} width={3.6} height={b.h} fill={ORANGE} /> : null))}
            </g>
          </g>

          {/* Druckkopf vorne */}
          <rect x={prX - 38} y={beltY - 26} width={76} height={62} rx={10} fill={pr > 0 && pr < 1 ? ORANGE : "#8994ab"} stroke={INK} strokeWidth={6} />
          <rect x={prX - 14} y={beltY - 34} width={28} height={10} fill={INK} />
          <text x={prX} y={beltY + 76} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={pr > 0 ? ORANGE : C.muted}>Drucker</text>
          {t >= tPrint && <Sfx at={tPrint} name="data" vol={0.3} />}
        </svg>
      </div>
    </div>
  );
};
