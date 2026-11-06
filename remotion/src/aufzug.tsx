import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, useScene, useShake, useT } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Aufzugschacht: Kabine + Gegengewicht → Seil reißt → Geschwindigkeitsbegrenzer → Fangvorrichtung greift */
export const AufzugScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const tMove = at(s.move_at, 0.05), tCut = at(s.cut_at, 0.4), tGov = at(s.governor_at, 0.6), tGrip = at(s.grip_at, 0.75);
  const steps: string[] = s.steps || ["Kabine und Gegengewicht", "Das Seil reißt! (Zeitlupe)", "Begrenzer merkt: zu schnell", "Fangvorrichtung greift"];
  const times = [tMove, tCut, tGov, tGrip];
  let cur = -1;
  times.forEach((x, i) => { if (t >= x) cur = i; });
  const shake = useShake(tGrip, 18);

  const SW = 1200, SH = 820;
  const scale = v ? 0.72 : 0.86;
  // Kabine: fährt hoch (tMove..tCut), fällt nach Seilriss bis tGrip, dann Stopp
  const up = interpolate(t, [tMove, tMove + 2.2], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const fallP = interpolate(t, [tCut + 0.2, tGrip], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const cabY = 470 - up * 300 + fallP * 150;
  const cwY = 160 + up * 300; // Gegengewicht gegenläufig
  const cut = t >= tCut;
  const govSpin = t * (t > tCut ? 900 : 240);
  const govTrip = t >= tGov;
  const gripped = t >= tGrip;
  const sparks = gripped && t < tGrip + 0.8;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, transform: shake }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 66 : 62} />}
      <div style={{ height: 80 }}>
        {cur >= 0 && <PopIn key={cur} at={times[cur]} sfx={null}><Chip bg={cur === 1 ? C.red : C.yellow} fg={cur === 1 ? C.white : C.ink} size={v ? 44 : 42}><span style={{ opacity: 0.6 }}>{cur + 1}/4 · </span>{steps[cur]}</Chip></PopIn>}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <div style={{ position: "relative", width: SW, height: SH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {/* Schacht */}
          <div style={{ position: "absolute", left: 250, top: 40, width: 700, height: 760, background: "#141c2e", border: "6px solid #3b4a6b", borderRadius: 12 }} />
          {/* Führungsschienen */}
          <div style={{ position: "absolute", left: 300, top: 40, width: 16, height: 760, background: "#6b7891" }} />
          <div style={{ position: "absolute", left: 640, top: 40, width: 16, height: 760, background: "#6b7891" }} />
          {/* Treibscheibe oben */}
          <div style={{ position: "absolute", left: 520, top: 10, width: 140, height: 140, borderRadius: "50%", background: "#8994ab", border: "8px solid #11151d", transform: `rotate(${up * 360}deg)` }}>
            <div style={{ position: "absolute", left: 60, top: 0, width: 8, height: 124, background: "#11151d" }} />
          </div>
          {/* Geschwindigkeitsbegrenzer */}
          <div style={{ position: "absolute", left: 120, top: 60, width: 110, height: 110, borderRadius: "50%", background: govTrip ? C.red : "#8994ab", border: "7px solid #11151d", transform: `rotate(${govSpin}deg)`, boxShadow: govTrip ? `0 0 40px ${C.red}` : "none" }}>
            <div style={{ position: "absolute", left: 47, top: 4, width: 8, height: 94, background: "#11151d" }} />
            <div style={{ position: "absolute", left: 4, top: 47, width: 94, height: 8, background: "#11151d" }} />
          </div>
          <div style={{ position: "absolute", left: 70, top: 180, width: 220, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 26, color: govTrip ? C.red : C.muted }}>Geschwindigkeits-<br />begrenzer</div>
          {govTrip && <Sfx at={tGov} name="tick" vol={0.6} />}
          {/* Begrenzerseil */}
          <div style={{ position: "absolute", left: 172, top: 170, width: 6, height: cabY + 60 - 170, background: "#9aa3b5" }} />
          <div style={{ position: "absolute", left: 172, top: cabY + 60, width: 160, height: 6, background: "#9aa3b5" }} />
          {/* Tragseile Kabine */}
          {!cut ? (
            <div style={{ position: "absolute", left: 528, top: 80, width: 10, height: cabY - 80, background: "#c9cedb" }} />
          ) : (
            <>
              <div style={{ position: "absolute", left: 528, top: 80, width: 10, height: 120, background: "#c9cedb", transform: `rotate(${Math.min(25, (t - tCut) * 40)}deg)`, transformOrigin: "top" }} />
              <div style={{ position: "absolute", left: 528, top: cabY - 90, width: 10, height: 90, background: "#c9cedb", transform: `rotate(${-Math.min(30, (t - tCut) * 50)}deg)`, transformOrigin: "bottom" }} />
            </>
          )}
          {cut && <Sfx at={tCut} name="crunch" vol={0.7} />}
          {/* Seil zum Gegengewicht */}
          <div style={{ position: "absolute", left: 652, top: 80, width: 10, height: cwY - 80, background: "#c9cedb" }} />
          {/* Gegengewicht */}
          <div style={{ position: "absolute", left: 690, top: cwY, width: 110, height: 200, background: "#5b6476", border: "6px solid #11151d", borderRadius: 8 }}>
            {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 6, background: "#11151d", margin: "38px 0 0" }} />)}
          </div>
          <div style={{ position: "absolute", left: 820, top: cwY + 80, fontFamily: FONT, fontWeight: 800, fontSize: 26, color: C.muted }}>Gegen-<br />gewicht</div>
          {/* Kabine */}
          <div style={{ position: "absolute", left: 330, top: cabY, width: 300, height: 260, background: C.card, border: "7px solid #11151d", borderRadius: 14, boxShadow: "0 20px 40px #0008" }}>
            <div style={{ position: "absolute", left: 30, top: 30, width: 110, height: 190, background: "#c9cedb", borderRight: "4px solid #8994ab" }} />
            <div style={{ position: "absolute", left: 150, top: 30, width: 110, height: 190, background: "#c9cedb" }} />
            <svg style={{ position: "absolute", left: 105, top: 50 }} width="90" height="150" viewBox="0 0 90 150">
              <circle cx="45" cy="34" r="26" fill="#ffd36b" stroke="#11151d" strokeWidth="4" />
              <circle cx="36" cy="30" r={cut && !gripped ? 6 : 4} fill="#11151d" /><circle cx="54" cy="30" r={cut && !gripped ? 6 : 4} fill="#11151d" />
              {cut && !gripped ? <ellipse cx="45" cy="46" rx="7" ry="9" fill="#5a1a2a" /> : <path d="M34 44 Q45 54 56 44" stroke="#11151d" strokeWidth="4" fill="none" strokeLinecap="round" />}
              <path d="M12 150 v-50 a33 33 0 0 1 66 0 v50 z" fill={C.blue} stroke="#11151d" strokeWidth="4" />
              {cut && !gripped && <><path d="M14 100 L0 64" stroke="#11151d" strokeWidth="8" strokeLinecap="round" /><path d="M76 100 L90 64" stroke="#11151d" strokeWidth="8" strokeLinecap="round" /></>}
            </svg>
          </div>
          {/* Fangkeile */}
          {[300, 640].map((x, i) => (
            <div key={i} style={{ position: "absolute", left: i === 0 ? x + 16 : x - 26, top: cabY + 200, width: 26, height: 50, background: gripped ? C.red : "#8994ab", border: "4px solid #11151d", transform: gripped ? `translateX(${i === 0 ? -10 : 10}px)` : "none" }} />
          ))}
          {sparks && Array.from({ length: 14 }).map((_, k) => {
            const a = (k / 14) * Math.PI * 2;
            const r = (t - tGrip) * 260;
            const x0 = k % 2 ? 312 : 648;
            return <div key={k} style={{ position: "absolute", left: x0 + Math.cos(a) * r, top: cabY + 225 + Math.sin(a) * r * 0.6, width: 10, height: 10, borderRadius: "50%", background: C.yellow, opacity: 1 - (t - tGrip) / 0.8 }} />;
          })}
          {gripped && <Sfx at={tGrip} name="thud" vol={0.8} />}
          {/* Puffer */}
          {[380, 520].map((x, i) => <div key={i} style={{ position: "absolute", left: x, top: 740, width: 60, height: 56, background: C.yellow, border: "5px solid #11151d", borderRadius: "6px 6px 0 0" }} />)}
          <div style={{ position: "absolute", left: 960, top: 740, fontFamily: FONT, fontWeight: 800, fontSize: 26, color: C.muted }}>Puffer</div>
        </div>
      </div>
    </div>
  );
};
