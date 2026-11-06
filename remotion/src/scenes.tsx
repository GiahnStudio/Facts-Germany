import React from "react";
import { interpolate, random, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C, COLOR, Chip, FONT, KineticText, PopIn, Rise, Sfx, Stamp, fs, useAt, useFloat, useLin, usePop, useScene, useShake, useT } from "./ui";
import { CheckBadge, Icon } from "./icons";
import { MachineScene } from "./machine";
import { MoneyScene } from "./money";
import { AmpelScene } from "./ampel";
import { AufzugScene } from "./aufzug";

type P = { s: any };
const col: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 34, width: "100%" };
const txt = (size: number, color = C.soft, weight = 600): React.CSSProperties => ({ fontFamily: FONT, fontSize: size, color, fontWeight: weight, lineHeight: 1.25, textAlign: "center" });

// ---------------------------------------------------------------- Hilfen
const Confetti: React.FC<{ at: number; n?: number }> = ({ at, n = 46 }) => {
  const t = useT();
  if (t < at || t > at + 2.2) return null;
  const k = t - at;
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0 }}>
      {Array.from({ length: n }).map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2;
        const sp = 500 + random(`s${i}`) * 700;
        const x = Math.cos(a) * sp * k;
        const y = Math.sin(a) * sp * k * 0.7 + 900 * k * k;
        const c = [C.accent, C.yellow, C.red, C.green, C.white][i % 5];
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 18, height: 10, background: c, transform: `rotate(${k * 720 * (random(`r${i}`) - 0.5)}deg)`, opacity: 1 - k / 2.2, borderRadius: 2 }} />;
      })}
    </div>
  );
};

/** Ablaufender Kreis-Timer mit Ticken */
const ThinkTimer: React.FC<{ from: number; to: number; size?: number }> = ({ from, to, size = 120 }) => {
  const t = useT();
  if (t < from - 0.1 || t > to + 0.1 || to - from < 0.5) return null;
  const p = interpolate(t, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const r = 44;
  const circ = 2 * Math.PI * r;
  const ticks = [];
  for (let x = from; x < to - 0.2; x += 0.5) ticks.push(x);
  const pulse = 1 + Math.sin(t * 12) * 0.04;
  return (
    <div style={{ position: "relative", width: size, height: size, transform: `scale(${pulse})` }}>
      {ticks.map((x, i) => <Sfx key={i} at={x} name="tick" vol={0.35} />)}
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill={C.ink} stroke="#ffffff22" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={C.yellow} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={circ * p} transform="rotate(-90 50 50)" strokeLinecap="round" />
        <text x="50" y="64" textAnchor="middle" fontFamily="Inter" fontWeight="900" fontSize="42" fill="#fff">?</text>
      </svg>
    </div>
  );
};

const TickOnly: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  if (to - from < 0.5) return null;
  const ticks: number[] = [];
  for (let x = from; x < to - 0.2; x += 0.5) ticks.push(x);
  return <>{ticks.map((x, i) => <Sfx key={i} at={x} name="tick" vol={0.35} />)}</>;
};

const lastWordBefore = (words: [number, number, string][], at: number) => {
  let e = 0;
  for (const w of words) if (w[1] <= at - 0.2) e = Math.max(e, w[1]);
  return e;
};

// ---------------------------------------------------------------- Szenen
const Title: React.FC<P> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const fl = useFloat(14, 2);
  const p = usePop(0.05, { damping: 8 });
  return (
    <div style={col}>
      {s.kicker && <PopIn at={0}><Chip>{s.kicker}</Chip></PopIn>}
      {s.icon && (
        <div style={{ transform: `translateY(${fl}px) scale(${p}) rotate(${Math.sin(useT() * 1.7) * 6}deg)` }}>
          <Sfx at={0.05} name="pop" vol={0.4} />
          <Icon name={s.icon} size={fs(s.icon_size || 300, v)} />
        </div>
      )}
      <KineticText text={s.text} at={0.2} size={fs(s.size || 120, v)} highlight={s.highlight || []} />
      {s.sub && <Rise at={at(s.sub_at, 0.4)}><div style={txt(fs(48, v))}>{s.sub}</div></Rise>}
      {s.stamp && <Stamp text={s.stamp} color={COLOR[s.stamp_color || "red"]} at={at(s.stamp_at, 0.7)} size={fs(84, v)} />}
    </div>
  );
};

const Chips: React.FC<P> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const bgs = [C.accent, C.white, C.yellow, "#ff8fa3"];
  return (
    <div style={col}>
      <KineticText text={s.title} at={0} size={fs(74, v)} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 28, justifyContent: "center", maxWidth: v ? 900 : 1300 }}>
        {s.items.map((c: any, i: number) => (
          <PopIn key={i} at={at(c.at, 0.25 + (0.6 * i) / s.items.length)} rot={(i % 2 ? 3 : -3)}>
            <Chip bg={bgs[i % 4]} size={fs(48, v)}>{c.text}</Chip>
          </PopIn>
        ))}
      </div>
    </div>
  );
};

const Option: React.FC<{ letter: string; text: string; state: "n" | "ok" | "dim"; v: boolean }> = ({ letter, text, state, v }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 30, background: state === "dim" ? "#5a6273" : C.card, border: state === "ok" ? `8px solid ${C.green}` : "8px solid transparent", borderRadius: 30, padding: "18px 30px", width: v ? 920 : 1240, boxShadow: state === "ok" ? `0 0 60px ${C.green}88` : "0 14px 30px rgba(0,0,0,.35)" }}>
    <div style={{ width: 84, height: 84, borderRadius: "50%", background: state === "ok" ? C.green : C.ink, color: "#fff", fontFamily: FONT, fontWeight: 900, fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{letter}</div>
    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: fs(48, v), color: state === "dim" ? "#2b3040" : C.ink, flex: 1 }}>{text}</div>
    {state === "ok" && <CheckBadge size={72} />}
  </div>
);

const Quiz: React.FC<P> = ({ s }) => {
  const { v, adur, dur, words } = useScene();
  const at = useAt();
  const t = useT();
  const opts = s.options.map((o: any) => (typeof o === "string" ? { text: o } : o));
  const letters = "ABC";
  const reveal = s.answer ? Math.max(at(s.reveal_at, 0.3), 0.15 + 0.12 * (opts.length - 1) + 0.6) : null;
  const optAt = (i: number, o: any) => (reveal != null ? 0.15 + 0.12 * i : at(o.at, 0.3 + 0.15 * i));
  const lastOpt = optAt(opts.length - 1, opts[opts.length - 1]);
  const ansIdx = s.answer ? letters.indexOf(s.answer) : -1;
  const rp = reveal != null ? usePop(reveal, { damping: 9 }) : 0;
  return (
    <div style={{ ...col, gap: 26, position: "relative" }}>
      {s.kicker && <PopIn at={0}><Chip bg={reveal != null ? C.green : C.yellow}>{s.kicker}</Chip></PopIn>}
      <KineticText text={s.question} at={0.05} size={fs(s.size || 64, v)} stagger={0.04} />
      {opts.map((o: any, i: number) => {
        const st = reveal != null && t >= reveal ? (i === ansIdx ? "ok" : "dim") : "n";
        const sc = st === "ok" ? 1 + 0.06 * rp : st === "dim" ? 0.94 : 1;
        return (
          <Rise key={i} at={optAt(i, o)} dist={0} sfx="pop" style={{ transform: `scale(${sc})` }}>
            <SlideIn at={optAt(i, o)}><Option letter={letters[i]} text={o.text} state={st as any} v={v} /></SlideIn>
          </Rise>
        );
      })}
      {reveal != null && <><Sfx at={reveal} name="ding" vol={0.6} /><Confetti at={reveal} /></>}
      {reveal == null && (
        <div style={{ position: "absolute", left: v ? 0 : 20, top: v ? -150 : -110 }}>
          <TickOnly from={lastOpt + 1.2} to={Math.min(dur - 0.3, adur + 0.6)} />
        </div>
      )}
    </div>
  );
};

const SlideIn: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const p = usePop(at, { damping: 13, stiffness: 150 });
  return <div style={{ transform: `translateX(${(1 - p) * -260}px)` }}>{children}</div>;
};

const parseNum = (s: string) => {
  const m = s.match(/^([\d.,]+)(.*)$/);
  if (!m) return null;
  const raw = m[1];
  const dec = raw.includes(",") ? raw.split(",")[1].length : 0;
  const val = parseFloat(raw.replace(/\./g, "").replace(",", "."));
  return { val, dec, suffix: m[2] };
};

const CountUp: React.FC<{ text: string; at: number; size: number; color: string }> = ({ text, at, size, color }) => {
  const p = useLin(at, 1.3, Easing.out(Easing.cubic));
  const pop = usePop(at + 1.3, { damping: 7 });
  const pn = parseNum(text);
  const shown = pn ? (pn.val * p).toLocaleString("de-DE", { minimumFractionDigits: pn.dec, maximumFractionDigits: pn.dec }) + pn.suffix : text;
  const ticks = [];
  for (let x = at; x < at + 1.2; x += 0.1) ticks.push(x);
  return (
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color, transform: `scale(${1 + 0.08 * Math.sin(pop * Math.PI)})`, textShadow: `0 0 60px ${color}66`, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
      {ticks.map((x, i) => <Sfx key={i} at={x} name="tick" vol={0.15} />)}
      {shown}
    </div>
  );
};

const BigNum: React.FC<P> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  return (
    <div style={col}>
      {s.title && <KineticText text={s.title} at={0} size={fs(64, v)} />}
      <div style={{ display: "flex", flexDirection: v ? "column" : "row", gap: v ? 40 : 90, alignItems: "center" }}>
        {s.items.map((it: any, i: number) => {
          const a = at(it.at, 0.1 + 0.5 * i);
          return (
            <Rise key={i} at={a} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <CountUp text={it.num} at={a} size={fs(it.size || 150, v)} color={COLOR[it.color || "amber"]} />
              <div style={txt(fs(42, v))}>{it.label}</div>
            </Rise>
          );
        })}
      </div>
      {s.note && <Rise at={at(s.note_at, 0.7)}><Chip bg={C.white} size={fs(42, v)}>{s.note}</Chip></Rise>}
    </div>
  );
};

const Flow: React.FC<P> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const n = s.items.length;
  const times = s.items.map((it: any, i: number) => at(it.at, 0.1 + (0.75 * i) / n));
  if (v) {
    return (
      <div style={{ ...col, gap: 14 }}>
        {s.title && <KineticText text={s.title} at={0} size={70} />}
        {s.items.map((it: any, i: number) => (
          <React.Fragment key={i}>
            {i > 0 && <Rise at={times[i] - 0.1}><div style={{ fontSize: 50, color: C.accent, fontFamily: FONT, fontWeight: 900 }}>↓</div></Rise>}
            <SlideIn at={times[i]}>
              <Rise at={times[i]} sfx="pop" style={{ display: "flex", alignItems: "center", gap: 30, width: 860 }}>
                <IconBounce name={it.icon} size={120} at={times[i]} />
                <div style={{ ...txt(52, C.white, 800), textAlign: "left" }}>{it.text}</div>
              </Rise>
            </SlideIn>
          </React.Fragment>
        ))}
      </div>
    );
  }
  const W = 1380, gap = W / n;
  return (
    <div style={{ ...col, gap: 60 }}>
      {s.title && <KineticText text={s.title} at={0} size={70} />}
      <div style={{ position: "relative", width: W, height: 330 }}>
        <svg width={W} height={330} style={{ position: "absolute", left: 0, top: 0 }}>
          {s.items.slice(1).map((_: any, i: number) => {
            const x1 = gap * (i + 0.5) + 95, x2 = gap * (i + 1.5) - 95;
            const path = `M ${x1} 95 Q ${(x1 + x2) / 2} 40 ${x2} 95`;
            const p = interpolate(t, [times[i + 1] - 0.35, times[i + 1]], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const ev = evolvePath(p, path);
            return <path key={i} d={path} stroke={C.accent} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />;
          })}
        </svg>
        {s.items.map((it: any, i: number) => (
          <div key={i} style={{ position: "absolute", left: gap * i, width: gap, top: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <IconBounce name={it.icon} size={150} at={times[i]} active={t >= times[i] && (i === n - 1 || t < times[i + 1])} />
            <Rise at={times[i] + 0.1}><div style={{ ...txt(36, C.white, 800), width: gap - 20 }}>{it.text}</div></Rise>
          </div>
        ))}
      </div>
    </div>
  );
};

const IconBounce: React.FC<{ name: string; size: number; at: number; active?: boolean }> = ({ name, size, at, active }) => {
  const t = useT();
  const p = usePop(at, { damping: 8, stiffness: 160 });
  if (t < at) return <div style={{ width: size, height: size }} />;
  const glow = active ? 1 + Math.sin(t * 8) * 0.05 : 1;
  return (
    <div style={{ transform: `scale(${p * glow}) translateY(${active ? Math.sin(t * 6) * -6 : 0}px)` }}>
      <Sfx at={at} name="pop" vol={0.35} />
      <Icon name={name} size={size} />
    </div>
  );
};

const Fact: React.FC<P> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const fl = useFloat(10, 2.2);
  return (
    <div style={col}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <PopIn at={0}><div style={{ transform: `translateY(${fl}px)` }}><Icon name={s.icon || "lens"} size={fs(150, v)} /></div></PopIn>
        {s.label && <PopIn at={0.12} sfx={null}><Chip size={fs(40, v)}>{s.label}</Chip></PopIn>}
      </div>
      <KineticText text={s.headline} at={0.15} size={fs(s.size || 80, v)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
        {(s.lines || []).map((l: any, i: number) => {
          const a = at(l.at, 0.4 + 0.15 * i);
          return <Highlight key={i} at={a} text={l.text} v={v} />;
        })}
      </div>
      {s.stamp && <Stamp text={s.stamp} color={COLOR[s.stamp_color || "red"]} at={at(s.stamp_at, 0.75)} size={fs(76, v)} />}
    </div>
  );
};

/** Textzeile mit Marker-Effekt */
const Highlight: React.FC<{ at: number; text: string; v: boolean }> = ({ at, text, v }) => {
  const p = useLin(at, 0.5);
  const r = usePop(at, { damping: 14 });
  return (
    <div style={{ position: "relative", transform: `translateY(${(1 - r) * 30}px)`, opacity: Math.min(1, r * 1.5) }}>
      <div style={{ position: "absolute", left: -12, right: -12, top: "15%", bottom: "10%", background: `${C.accent}33`, borderRadius: 10, transformOrigin: "left", transform: `scaleX(${p})` }} />
      <div style={{ ...txt(fs(46, v), C.white, 700), position: "relative" }}>{text}</div>
    </div>
  );
};

const Story: React.FC<P> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const n = s.steps.length;
  const times = s.steps.map((st: any, i: number) => at(st.at, 0.1 + (0.75 * i) / n));
  const lineP = interpolate(t, [times[0], times[n - 1] + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={col}>
      {s.title && <KineticText text={s.title} at={0} size={fs(70, v)} />}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 40, paddingLeft: 60, width: v ? 900 : 1240 }}>
        <div style={{ position: "absolute", left: 20, top: 20, width: 8, height: `calc(${lineP * 100}% - 40px)`, background: C.accent, borderRadius: 4 }} />
        {s.steps.map((st: any, i: number) => (
          <SlideIn key={i} at={times[i]}>
            <Rise at={times[i]} dist={0} sfx="pop" style={{ display: "flex", alignItems: "center", gap: 28, position: "relative" }}>
              <div style={{ position: "absolute", left: -56, width: 40, height: 40, borderRadius: "50%", background: C.yellow, border: `6px solid ${C.bg}` }} />
              <Chip bg={C.yellow} size={fs(34, v)}>{st.date}</Chip>
              <div style={{ ...txt(fs(46, v), C.white, 700), textAlign: "left" }}>{st.text}</div>
            </Rise>
          </SlideIn>
        ))}
      </div>
      {s.stamp && <Stamp text={s.stamp} color={COLOR[s.stamp_color || "green"]} at={at(s.stamp_at, 0.85)} size={fs(70, v)} />}
    </div>
  );
};

const Split: React.FC<P> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  return (
    <div style={col}>
      {s.title && <KineticText text={s.title} at={0} size={fs(66, v)} />}
      <div style={{ display: "flex", flexDirection: v ? "column" : "row", gap: 50 }}>
        {s.items.map((it: any, i: number) => {
          const a = at(it.at, 0.15 + 0.4 * i);
          const p = usePop(a, { damping: 12 });
          const show = t >= a;
          return (
            <div key={i} style={{ perspective: 1200 }}>
              {show && <Sfx at={a} name="swipe" vol={0.4} />}
              <div style={{ width: v ? 900 : 660, background: C.card, borderRadius: 34, padding: 46, boxShadow: "0 20px 40px rgba(0,0,0,.4)", borderTop: `16px solid ${COLOR[it.color || "amber"]}`, transform: `rotateY(${(1 - p) * 90}deg)`, opacity: show ? 1 : 0, display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ background: C.ink, borderRadius: 24, padding: 14 }}><Icon name={it.icon} size={fs(110, v)} /></div>
                  {it.label && <Chip bg={C.ink} fg={C.white} size={fs(30, v)}>{it.label}</Chip>}
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: fs(54, v), color: C.ink }}>{it.title}</div>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: fs(36, v), color: "#3d4352", lineHeight: 1.3 }}>{it.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const List: React.FC<P> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const n = s.items.length;
  return (
    <div style={col}>
      <KineticText text={s.title} at={0} size={fs(s.size || 70, v)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 26, width: v ? 920 : 1240 }}>
        {s.items.map((it: any, i: number) => {
          const a = at(it.at, 0.15 + (0.7 * i) / n);
          const ic = it.icon || "ok";
          return (
            <SlideIn key={i} at={a}>
              <Rise at={a} dist={0} sfx="pop" style={{ display: "flex", alignItems: "center", gap: 30, background: "#ffffff10", borderRadius: 26, padding: "18px 26px", border: "2px solid #ffffff18" }}>
                <PopIn at={a + 0.15} sfx={null}>{ic === "ok" || ic === "x" ? <CheckBadge size={fs(76, v)} ok={ic === "ok"} /> : <Icon name={ic} size={fs(90, v)} />}</PopIn>
                <div style={{ ...txt(fs(48, v), C.white, 700), textAlign: "left" }}>{it.text}</div>
              </Rise>
            </SlideIn>
          );
        })}
      </div>
    </div>
  );
};

const Case: React.FC<P> = ({ s }) => {
  const { v, words } = useScene();
  const at = useAt();
  const verdictAt = at(s.verdict_at, 0.55);
  const shake = useShake(verdictAt, 16);
  const thinkFrom = lastWordBefore(words, verdictAt);
  const fl = useFloat(8, 2);
  return (
    <div style={{ ...col, transform: shake }}>
      {s.kicker && <PopIn at={0}><Chip bg={C.yellow} size={fs(36, v)}>{s.kicker}</Chip></PopIn>}
      <div style={{ position: "relative" }}>
        <Rise at={0.05} dist={120}>
          <div style={{ display: "flex", alignItems: "center", gap: 46, background: C.card, borderRadius: 40, padding: v ? "40px 40px" : "50px 60px", width: v ? 920 : 1300, boxShadow: "0 24px 50px rgba(0,0,0,.45)" }}>
            <div style={{ background: C.ink, borderRadius: 30, padding: 18, transform: `translateY(${fl}px)`, flexShrink: 0 }}><Icon name={s.icon || "lens"} size={fs(170, v)} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {s.label && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: fs(30, v), color: C.muted, letterSpacing: 2 }}>{s.label.toUpperCase()}</div>}
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: fs(54, v), color: C.ink, lineHeight: 1.2 }}>{s.text}</div>
            </div>
          </div>
        </Rise>
        <div style={{ position: "absolute", right: 20, bottom: -125 }}>
          <Stamp text={s.verdict} color={COLOR[s.verdict_color || "red"]} at={verdictAt} size={fs(90, v)} />
        </div>
        <div style={{ position: "absolute", right: -40, top: -60 }}>
          <TickOnly from={thinkFrom + 0.05} to={verdictAt - 0.05} />
        </div>
      </div>
      {s.note && <Rise at={at(s.note_at, 0.8)} style={{ marginTop: 110 }}><div style={txt(fs(46, v))}>{s.note}</div></Rise>}
      {s.verdict_color === "green" ? <Confetti at={verdictAt} n={30} /> : null}
    </div>
  );
};

const Outro: React.FC<P> = ({ s }) => {
  const { v } = useScene();
  const at = useAt();
  const t = useT();
  const bAt = at(s.button_at, 0.5);
  const press = t > bAt + 0.8 && t < bAt + 1.1 ? 0.92 : 1;
  const subscribed = t > bAt + 1.0;
  return (
    <div style={col}>
      <PopIn at={0}><div style={{ transform: `rotate(${Math.sin(t * 2) * 10}deg)` }}><Icon name="lens" size={fs(200, v)} /></div></PopIn>
      <KineticText text="DURCHSCHAUT" at={0.1} size={fs(120, v)} />
      {s.sub && <Rise at={0.3}><div style={txt(fs(46, v))}>{s.sub}</div></Rise>}
      {s.button && (
        <PopIn at={bAt}>
          <Sfx at={bAt + 0.9} name="ding" vol={0.4} />
          <div style={{ transform: `scale(${press * (1 + Math.sin(t * 6) * 0.03)})` }}>
            <Chip bg={subscribed ? "#555c6c" : C.red} fg={C.white} size={fs(56, v)}>{subscribed ? "✓ ABONNIERT" : s.button}</Chip>
          </div>
        </PopIn>
      )}
    </div>
  );
};

export const SCENES: Record<string, React.FC<P>> = {
  title: Title, chips: Chips, quiz: Quiz, bignum: BigNum, flow: Flow, fact: Fact, law: Fact, story: Story,
  split: Split, list: List, case: Case, outro: Outro, machine: MachineScene, money: MoneyScene, ampel: AmpelScene, aufzug: AufzugScene,
};
