import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { C, Ctx, FONT, Sfx } from "./ui";
import { Icon } from "./icons";
import { SCENES } from "./scenes";

for (const [w, f] of [["500", "Medium"], ["600", "SemiBold"], ["700", "Bold"], ["800", "ExtraBold"], ["900", "Black"]]) {
  loadFont({ family: "Inter", url: staticFile(`fonts/Inter-${f}.otf`), weight: w });
}

export type SceneData = { type: string; start: number; dur: number; adur: number; audio: string; words: [number, number, string][]; chapter?: string; [k: string]: any };
export type VideoProps = { fps: number; width: number; height: number; totalFrames: number; captions: boolean; scenes: SceneData[]; slug: string; music?: string };

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const t = f / 30;
  const blobs = [
    { c: "#1f6f8b", x: 0.2, y: 0.25, r: 0.55, sx: 0.07, sy: 0.05 },
    { c: "#3a2a7a", x: 0.85, y: 0.75, r: 0.6, sx: 0.05, sy: 0.08 },
    { c: "#0f5e57", x: 0.7, y: 0.15, r: 0.4, sx: 0.09, sy: 0.04 },
  ];
  const grid = 80;
  const off = (t * 12) % grid;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: (b.x + Math.sin(t * b.sx * 6 + i) * 0.08) * W - (b.r * W) / 2, top: (b.y + Math.cos(t * b.sy * 6 + i) * 0.08) * H - (b.r * W) / 2, width: b.r * W, height: b.r * W, borderRadius: "50%", background: `radial-gradient(circle, ${b.c}aa 0%, ${b.c}00 70%)` }} />
      ))}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
        {Array.from({ length: Math.ceil(W / grid) + 2 }).map((_, i) => <line key={"v" + i} x1={i * grid - off} y1={0} x2={i * grid - off} y2={H} stroke="#5b7aa8" strokeWidth={1.5} />)}
        {Array.from({ length: Math.ceil(H / grid) + 2 }).map((_, i) => <line key={"h" + i} x1={0} y1={i * grid - off} x2={W} y2={i * grid - off} stroke="#5b7aa8" strokeWidth={1.5} />)}
      </svg>
      {Array.from({ length: 14 }).map((_, i) => {
        const x = ((i * 137) % 100) / 100;
        const sp = 0.012 + (i % 5) * 0.004;
        const y = 1.1 - ((t * sp + i * 0.13) % 1.2);
        const s = 6 + (i % 4) * 5;
        return <div key={i} style={{ position: "absolute", left: x * W, top: y * H, width: s, height: s, borderRadius: i % 3 ? "50%" : 3, background: i % 2 ? C.accent : C.yellow, opacity: 0.25, transform: `rotate(${t * 40 + i * 20}deg)` }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)" }} />
    </AbsoluteFill>
  );
};

const Logo: React.FC<{ v: boolean }> = ({ v }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: v ? 60 : 64, top: v ? 120 : 52, display: "flex", alignItems: "center", gap: 18 }}>
      <Icon name="lens" size={64} style={{ transform: `rotate(${Math.sin(f / 25) * 8}deg)`, filter: "none" }} />
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 36, color: C.white, letterSpacing: 1 }}>DURCHSCHAUT</div>
    </div>
  );
};

const ChapterChip: React.FC<{ text: string; v: boolean }> = ({ text, v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - 6, fps, config: { damping: 14 } });
  const out = interpolate(f, [fps * 3.2, fps * 3.7], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (v) return null;
  return (
    <div style={{ position: "absolute", right: 64, top: 52, transform: `translateX(${(1 - p) * 400}px)`, opacity: out, fontFamily: FONT, fontWeight: 800, fontSize: 30, color: C.ink, background: C.white, padding: "12px 26px", borderRadius: 999, boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
      {text}
    </div>
  );
};

/** Szene mit Ein-/Ausblende-Übergang und leichter Kamerafahrt */
const SceneShell: React.FC<{ s: SceneData; idx: number; v: boolean; W: number; H: number; fps: number }> = ({ s, idx, v, W, H, fps }) => {
  const f = useCurrentFrame();
  const Comp = SCENES[s.type];
  const enter = spring({ frame: f, fps, config: { damping: 16, stiffness: 120 } });
  const out = interpolate(f, [s.dur - 8, s.dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dir = idx % 2 ? 1 : -1;
  const zoom = 1 + (f / s.dur) * 0.035;
  const style: React.CSSProperties = {
    transform: `translateX(${(1 - enter) * 160 * dir - out * 120 * dir}px) scale(${(0.94 + 0.06 * enter) * zoom * (1 - out * 0.05)})`,
    opacity: Math.min(1, enter * 1.5) * (1 - out),
  };
  return (
    <Ctx.Provider value={{ adur: s.adur, dur: s.dur / fps, v, W, H, words: s.words }}>
      <AbsoluteFill style={style}>
        <AbsoluteFill style={{ padding: v ? "330px 70px 560px" : "150px 140px 90px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: v ? "none" : "scale(1.12)", width: "100%", display: "flex", justifyContent: "center" }}>
            {Comp ? <Comp s={s} /> : <div style={{ color: "red", fontSize: 60 }}>Unbekannter Typ: {s.type}</div>}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {s.audio && <Audio src={staticFile(s.audio)} />}
      {idx > 0 && <Sfx at={0} name="whoosh" vol={0.25} />}
      {s.chapter && idx > 0 && <ChapterChip text={s.chapter} v={v} />}
    </Ctx.Provider>
  );
};

/** Wort-für-Wort-Untertitel (Shorts) */
const Captions: React.FC<{ scenes: SceneData[]; fps: number; W: number }> = ({ scenes, fps, W }) => {
  const f = useCurrentFrame();
  const t = f / fps;
  const sc = scenes.find((s) => f >= s.start && f < s.start + s.dur);
  if (!sc) return null;
  const lt = t - sc.start / fps;
  const words = sc.words;
  // Gruppen à 3 Wörter
  let gi = -1;
  for (let i = 0; i < words.length; i++) if (words[i][0] <= lt + 0.05) gi = i;
  if (gi < 0) return null;
  const g0 = Math.floor(gi / 3) * 3;
  const grp = words.slice(g0, g0 + 3);
  if (lt > grp[grp.length - 1][1] + 0.6) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1430, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 0" }}>
      {grp.map((w, i) => {
        const active = g0 + i === gi;
        const p = spring({ frame: f - Math.round((sc.start / fps + w[0]) * fps), fps, config: { damping: 10, stiffness: 200 } });
        return (
          <span key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 84, textTransform: "uppercase", color: active ? C.accent : C.white, WebkitTextStroke: "3px #000", paintOrder: "stroke", textShadow: "0 8px 0 rgba(0,0,0,.6)", transform: `scale(${active ? 1 + 0.07 * p : 1})`, display: "inline-block", margin: "0 18px" }}>
            {w[2]}
          </span>
        );
      })}
    </div>
  );
};

export const Video: React.FC<VideoProps> = ({ scenes, fps, width, height, captions, music }) => {
  const v = height > width;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Background />
      {scenes.map((s, i) => (
        <Sequence key={i} from={s.start} durationInFrames={s.dur} layout="none">
          <SceneShell s={s} idx={i} v={v} W={width} H={height} fps={fps} />
        </Sequence>
      ))}
      <Logo v={v} />
      {captions && <Captions scenes={scenes} fps={fps} W={width} />}
      {music && <Audio src={staticFile(music)} loop volume={0.07} />}
    </AbsoluteFill>
  );
};
