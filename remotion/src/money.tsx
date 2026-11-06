import React from "react";
import { interpolate, Easing } from "remotion";
import { C, Chip, FONT, KineticText, PopIn, Sfx, useAt, usePop, useScene, useT } from "./ui";
import { Icon } from "./icons";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Geldfluss: Knoten in einer Reihe, Münzen/Daten fliegen im Bogen zwischen ihnen */
export const MoneyScene: React.FC<{ s: any }> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const SW = 1640, SH = 470;
  const n = s.nodes.length;
  const pos = s.nodes.map((_: any, i: number) => ({ x: (SW / n) * (i + 0.5), y: 330 }));
  const moves = s.moves.map((m: any, i: number) => ({ ...m, t0: at(m.at, 0.1 + (0.8 * i) / s.moves.length) }));
  const scale = v ? 0.56 : 0.84;
  // aktueller Hinweis
  let cur = -1;
  moves.forEach((m: any, i: number) => { if (t >= m.t0) cur = i; });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      {s.title && <KineticText text={s.title} at={0} size={v ? 66 : 66} />}
      <div style={{ height: 70 }}>
        {cur >= 0 && moves[cur].caption && (
          <PopIn key={cur} at={moves[cur].t0} sfx={null}><Chip bg={C.white} size={v ? 44 : 40}>{moves[cur].caption}</Chip></PopIn>
        )}
      </div>
      <div style={{ width: SW * scale, height: SH * scale }}>
        <div style={{ position: "relative", width: SW, height: SH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {s.nodes.map((nd: any, i: number) => {
            const p = usePop(0.1 + i * 0.12, { damping: 10 });
            // Puls, wenn eine Münze ankommt
            const hit = moves.some((m: any) => m.to === i && t > m.t0 + 0.9 && t < m.t0 + 1.2);
            return (
              <div key={i} style={{ position: "absolute", left: pos[i].x - 150, top: pos[i].y - 130, width: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, transform: `scale(${p * (hit ? 1.12 : 1)})` }}>
                <div style={{ width: 200, height: 200, borderRadius: "50%", background: "#ffffff12", border: `5px solid ${hit ? C.yellow : "#ffffff30"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: hit ? `0 0 60px ${C.yellow}88` : "none" }}>
                  <Icon name={nd.icon} size={130} />
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: C.white }}>{nd.label}</div>
              </div>
            );
          })}
          {moves.map((m: any, i: number) => {
            const p = interpolate(t, [m.t0, m.t0 + 0.9], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
            if (t < m.t0) return null;
            const a = pos[m.from], b = pos[m.to];
            const lift = (m.from > m.to ? 170 : 100) + Math.abs(m.to - m.from) * 20;
            const x = a.x + (b.x - a.x) * p;
            const y = a.y - 60 - Math.sin(p * Math.PI) * lift;
            const done = p >= 1;
            const isData = m.kind === "data";
            return (
              <React.Fragment key={i}>
                <Sfx at={m.t0} name={isData ? "data" : "swipe"} vol={0.35} />
                <Sfx at={m.t0 + 0.9} name={isData ? "ding" : "coin"} vol={0.45} />
                {!done && (
                  <div style={{ position: "absolute", left: x - 45, top: y - 45, transform: `rotate(${p * 360}deg)` }}>
                    {isData ? (
                      <div style={{ width: 90, height: 60, borderRadius: 12, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 900, fontSize: 26, color: C.ink, boxShadow: `0 0 30px ${C.accent}` }}>DATEN</div>
                    ) : (
                      <Icon name="coin" size={110} />
                    )}
                  </div>
                )}
                {!done && m.label && (
                  <div style={{ position: "absolute", left: (a.x + b.x) / 2 - 90, top: a.y - 60 - lift - 70, width: 180, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 38, color: C.yellow }}>{m.label}</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
