import React from "react";
import { interpolate, Easing, random } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useT, useScene } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#11151d";
const HOT = "#ff4b2b";
const WAX = "#f4e9d6";

/** Bondrucker mit Thermopapier: Papier läuft von der Rolle → Heizpunkte im Druckkopf glühen →
 *  Lupe ins Papier (farbloser Farbstoff + Entwickler im Wachs) → Wachs schmilzt, Farbstoff wird schwarz →
 *  Bon wird abgerissen.  Cues: feed_at, heat_at, zoom_at, melt_at, tear_at  (optional: lines, steps, shop) */
export const BonScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const tFeed = at(s.feed_at, 0.05), tHeat = at(s.heat_at, 0.2), tZoom = at(s.zoom_at, 0.45), tMelt = at(s.melt_at, 0.6), tTear = at(s.tear_at, 0.88);
  const steps: string[] = s.steps || ["Papier von der Rolle", "Winzige Heizpunkte glühen", "Blick ins Papier", "Wachs schmilzt: Farbe wird schwarz", "Abreißen, fertig"];
  const times = [tFeed, tHeat, tZoom, tMelt, tTear];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });

  const SW = 1200, SH = 800;
  const scale = v ? 0.8 : 0.9;

  // ---------------- Drucker (links)
  const pX = 70, pW = 520, slotY = 560, pH = 210; // Gehäuse unterhalb des Schlitzes
  const rW = 300, rX = pX + (pW - rW) / 2; // Bonbreite
  const LINE = 34, TOP = 70; // Zeilenhöhe, Kopfbereich des Bons
  const shop: string = s.shop || "LUPO-MARKT";
  const lines: string[] = s.lines || ["Brötchen        0,40", "Milch           1,19", "Äpfel           2,49", "Käse            3,29", "SUMME           7,37", "Danke! :)"];
  const fullLen = TOP + lines.length * LINE + 40;
  // Papierlänge, die aus dem Schlitz ragt
  const lead = interpolate(t, [tFeed, tFeed + 0.8], [0, 26], clamp);
  const printEnd = Math.max(tHeat + 2.5, tTear - 0.3);
  const printed = interpolate(t, [tHeat, printEnd], [0, fullLen - 26], clamp);
  const len = lead + printed;
  const printing = t >= tHeat && t < printEnd;
  // Abreißen
  const tearP = interpolate(t, [tTear, tTear + 0.9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const torn = t >= tTear;
  const lift = tearP * 120;
  const rot = tearP * -6;
  const rollR = 92 - (len / fullLen) * 8;
  const rollSpin = t * (printing ? 360 : 30);

  // Heizpunkte
  const DOTS = 24;
  const dotRow = Array.from({ length: DOTS }).map((_, i) => {
    const on = printing && random(`d${i}-${Math.floor(t * 14)}`) > 0.55;
    return on;
  });

  // ---------------- Lupe (rechts)
  const zp = interpolate(t, [tZoom, tZoom + 0.5], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const melt = interpolate(t, [tMelt, tMelt + 1.6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const zx = 880, zy = 360, zr = 230;
  const parts = Array.from({ length: 14 }).map((_, i) => {
    const bx = zx - 170 + (i % 7) * 56 + (Math.floor(i / 7) % 2) * 26;
    const by = zy + 10 + Math.floor(i / 7) * 74;
    const jitter = Math.sin(t * 7 + i) * 4 * melt;
    return { bx, by, jitter };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 64 : 60} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && (
          <PopIn key={cur} at={times[cur]} sfx={null}>
            <Chip bg={cur === 4 ? C.green : cur === 1 || cur === 3 ? HOT : C.yellow} fg={cur === 0 || cur === 2 ? C.ink : C.white} size={v ? 40 : 40}>
              <span style={{ opacity: 0.6 }}>{cur + 1}/5 · </span>{steps[cur]}
            </Chip>
          </PopIn>
        )}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ transform: `scale(${scale})`, transformOrigin: "top left", overflow: "visible" }}>
          <defs>
            <clipPath id="bon-above"><rect x={0} y={-400} width={SW} height={slotY + 400} /></clipPath>
            <clipPath id="bon-lens"><circle cx={zx} cy={zy} r={zr - 10} /></clipPath>
            <radialGradient id="bon-heat" cx="50%" cy="100%" r="80%">
              <stop offset="0%" stopColor={HOT} stopOpacity={0.9} />
              <stop offset="100%" stopColor={HOT} stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Bon (oberhalb des Schlitzes) */}
          <g clipPath={torn ? undefined : "url(#bon-above)"}>
            <g transform={`translate(${rX} ${slotY - len - lift}) rotate(${rot} ${rW / 2} ${len})`}>
              <rect x={0} y={0} width={rW} height={Math.max(0, len)} fill="#fbfaf6" stroke={INK} strokeWidth={5} />
              {len > 40 && (
                <text x={rW / 2} y={46} textAnchor="middle" fontFamily="'DejaVu Sans Mono', monospace" fontWeight={900} fontSize={30} fill={INK}>{shop}</text>
              )}
              {len > 56 && <line x1={18} x2={rW - 18} y1={60} y2={60} stroke={INK} strokeWidth={3} strokeDasharray="8 6" />}
              {lines.map((l, i) => {
                const y = TOP + 10 + i * LINE;
                if (len < y + 4) return null;
                const bold = /SUMME/.test(l);
                return (
                  <text key={i} x={18} y={y + 16} fontFamily="'DejaVu Sans Mono', monospace" fontWeight={bold ? 900 : 700} fontSize={22} fill={INK} xmlSpace="preserve">{l}</text>
                );
              })}
              {torn && <path d={`M0 ${len} ${Array.from({ length: 15 }).map((_, k) => `L${(k + 0.5) * (rW / 15)} ${len + (k % 2 ? 0 : 8)}`).join(" ")} L${rW} ${len}`} fill="#fbfaf6" stroke={INK} strokeWidth={4} />}
            </g>
          </g>
          {t >= tTear && <Sfx at={tTear} name="swipe" vol={0.6} />}

          {/* Gehäuse */}
          <rect x={pX} y={slotY - 30} width={pW} height={pH + 30} rx={28} fill="#c9cedb" stroke={INK} strokeWidth={7} />
          <rect x={pX + 30} y={slotY - 30} width={pW - 60} height={18} rx={9} fill="#5b6476" />
          {/* Schlitz + Druckkopf */}
          <rect x={rX - 20} y={slotY - 8} width={rW + 40} height={16} rx={6} fill={INK} />
          <rect x={rX - 10} y={slotY + 12} width={rW + 20} height={40} rx={8} fill={printing ? "#3a2a2a" : "#2b3140"} stroke={INK} strokeWidth={4} />
          {dotRow.map((on, i) => (
            <rect key={i} x={rX + 2 + i * ((rW - 4) / DOTS)} y={slotY + 24} width={(rW - 4) / DOTS - 3} height={14} rx={3} fill={on ? HOT : "#59606f"} />
          ))}
          {printing && <rect x={rX - 10} y={slotY - 60} width={rW + 20} height={70} fill="url(#bon-heat)" opacity={0.35 + 0.25 * Math.sin(t * 20)} />}
          <text x={pX + pW / 2} y={slotY + 92} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={t >= tHeat ? "#b3261e" : INK}>Druckkopf mit Heizpunkten</text>
          {/* Papierrolle */}
          <g transform={`translate(${pX + pW / 2} ${slotY + 162})`}>
            <rect x={-rW / 2} y={-34} width={rW} height={68} rx={34} fill="#fbfaf6" stroke={INK} strokeWidth={5} />
            <g transform={`rotate(${rollSpin})`}>
              <line x1={-26} x2={26} y1={0} y2={0} stroke={C.muted} strokeWidth={5} />
              <line x1={0} x2={0} y1={-26} y2={26} stroke={C.muted} strokeWidth={5} />
            </g>
            <circle cx={0} cy={0} r={Math.max(12, rollR * 0.18)} fill="none" stroke={INK} strokeWidth={4} />
          </g>
          {/* Kein Tinte-Hinweis */}
          <g transform={`translate(${pX + pW + 250} ${slotY + 40})`} opacity={interpolate(t, [tHeat + 0.6, tHeat + 1], [0, 1], clamp) * (1 - zp)}>
            <rect x={-200} y={-46} width={200} height={56} rx={28} fill={C.red} stroke={INK} strokeWidth={4} />
            <text x={-100} y={-8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={28} fill={C.white}>0 × Tinte</text>
          </g>
          {printing && <Sfx at={tHeat} name="roll" vol={0.35} />}
          {t >= tFeed && <Sfx at={tFeed} name="whoosh" vol={0.35} />}

          {/* Lupe ins Papier */}
          {zp > 0.01 && (
            <g transform={`translate(${zx} ${zy}) scale(${zp}) translate(${-zx} ${-zy})`}>
              <line x1={rX + rW - 10} y1={slotY - 20} x2={zx - zr * 0.8} y2={zy + zr * 0.6} stroke={C.yellow} strokeWidth={5} strokeDasharray="12 10" opacity={0.8} />
              <circle cx={zx} cy={zy} r={zr} fill={C.card} stroke={INK} strokeWidth={10} />
              <g clipPath="url(#bon-lens)">
                {/* Schichten: Papier unten, Thermoschicht oben */}
                <rect x={zx - zr} y={zy + 140} width={zr * 2} height={120} fill="#e3dccd" />
                <text x={zx} y={zy + 196} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} fill={C.muted}>Papier</text>
                <rect x={zx - zr} y={zy - 30} width={zr * 2} height={170} fill={WAX} />
                <rect x={zx - zr} y={zy - 30} width={zr * 2} height={170} fill="url(#bon-heat)" opacity={melt * 0.5} transform={`rotate(180 ${zx} ${zy + 55})`} />
                {parts.map((p, i) => {
                  const dye = i % 2 === 0;
                  const merged = melt;
                  const dx = dye ? 0 : -18 * merged;
                  const dyeFill = interpolate(merged, [0, 1], [0, 1]);
                  return (
                    <g key={i} transform={`translate(${p.bx + dx + p.jitter} ${p.by})`}>
                      {dye ? (
                        <circle r={20} fill={dyeFill > 0.5 ? INK : "#ffffff"} opacity={0.4 + 0.6 * dyeFill} stroke={dyeFill > 0.5 ? INK : "#b8bcc6"} strokeWidth={4} />
                      ) : (
                        <rect x={-11} y={-11} width={22} height={22} rx={4} fill={C.yellow} opacity={1 - 0.6 * merged} stroke={INK} strokeWidth={3} transform="rotate(45)" />
                      )}
                    </g>
                  );
                })}
                <text x={zx} y={zy - 70} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={melt > 0.5 ? "#b3261e" : INK}>{melt > 0.5 ? "Heiß: Wachs schmilzt" : "Thermoschicht"}</text>
              </g>
              {/* Legende */}
              <g transform={`translate(${zx - 210} ${zy + zr + 46})`}>
                <circle cx={14} cy={-10} r={13} fill={melt > 0.5 ? INK : "#fff"} stroke={C.white} strokeWidth={3} />
                <text x={36} y={0} fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.white}>Farbstoff</text>
                <rect x={196} y={-21} width={20} height={20} rx={4} fill={C.yellow} stroke={INK} strokeWidth={3} transform="rotate(45 206 -11)" />
                <text x={230} y={0} fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.white}>Entwickler</text>
              </g>
              <circle cx={zx} cy={zy} r={zr} fill="none" stroke={C.yellow} strokeWidth={4} opacity={0.6} />
            </g>
          )}
          {zp > 0.01 && <Sfx at={tZoom} name="pop" vol={0.45} />}
          {melt > 0 && <Sfx at={tMelt} name="ding" vol={0.35} />}
        </svg>
      </div>
    </div>
  );
};
