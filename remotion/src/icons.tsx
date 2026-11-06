import React from "react";
import { C } from "./ui";

const L = "#d6deec"; // helle Linienfarbe auf dunklem Grund

const paths: Record<string, (p: { accent: string }) => React.ReactNode> = {
  lens: ({ accent }) => (
    <>
      <circle cx="50" cy="50" r="48" fill={accent} />
      <circle cx="44" cy="42" r="20" fill="none" stroke={C.ink} strokeWidth="8" />
      <line x1="58" y1="57" x2="76" y2="76" stroke={C.ink} strokeWidth="11" strokeLinecap="round" />
      <circle cx="38" cy="36" r="5" fill="#ffffff88" />
    </>
  ),
  bottle: ({ accent }) => (
    <>
      <rect x="42" y="3" width="16" height="10" rx="2" fill={accent} />
      <path d="M43 13 h14 l10 18 v58 a7 7 0 0 1 -7 7 h-20 a7 7 0 0 1 -7 -7 v-58 z" fill="#86c4f5" />
      <path d="M48 22 v66" stroke="#ffffff99" strokeWidth="4" strokeLinecap="round" />
      <rect x="33" y="48" width="34" height="24" fill="#fff" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={37 + i * 4} y="52" width={i % 3 ? 2 : 3} height="11" fill={C.ink} />)}
      <circle cx="61" cy="67" r="3" fill={accent} />
    </>
  ),
  can: () => (
    <>
      <rect x="28" y="10" width="44" height="82" rx="7" fill="#c9ced7" />
      <rect x="28" y="30" width="44" height="44" fill={C.red} />
      <ellipse cx="50" cy="10" rx="22" ry="6" fill="#a9afba" />
      <path d="M38 40 q12 12 24 0" stroke="#fff" strokeWidth="5" fill="none" />
      <rect x="34" y="16" width="5" height="70" fill="#ffffff55" />
    </>
  ),
  coin: () => (
    <>
      <circle cx="50" cy="50" r="46" fill={C.yellow} />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#c98a00" strokeWidth="4" />
      <text x="50" y="62" textAnchor="middle" fontFamily="Inter" fontWeight="900" fontSize="34" fill="#7a5200">25</text>
    </>
  ),
  barcode: () => (
    <>
      <rect x="6" y="20" width="88" height="60" rx="6" fill="#fff" />
      {[12, 17, 20, 26, 30, 33, 39, 44, 47, 52, 58, 61, 66, 70, 75, 80, 84].map((x, i) => <rect key={i} x={x} y="28" width={i % 3 === 0 ? 3.5 : 2} height="38" fill={C.ink} />)}
      <rect x="8" y="48" width="84" height="2.5" fill={C.red} />
    </>
  ),
  eye: ({ accent }) => (
    <>
      <path d="M4 50 Q50 5 96 50 Q50 95 4 50 z" fill="#fff" />
      <circle cx="50" cy="50" r="20" fill={accent} />
      <circle cx="50" cy="50" r="9" fill={C.ink} />
      <circle cx="56" cy="44" r="4" fill="#fff" />
    </>
  ),
  chip: ({ accent }) => (
    <>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} fill={L}>
          <rect x={27 + i * 13} y="6" width="5" height="14" /><rect x={27 + i * 13} y="80" width="5" height="14" />
          <rect x="6" y={27 + i * 13} width="14" height="5" /><rect x="80" y={27 + i * 13} width="14" height="5" />
        </g>
      ))}
      <rect x="18" y="18" width="64" height="64" rx="7" fill={L} />
      <rect x="32" y="32" width="36" height="36" rx="4" fill={accent} />
    </>
  ),
  press: () => (
    <>
      <rect x="14" y="8" width="72" height="16" rx="3" fill={L} />
      <rect x="44" y="24" width="12" height="18" fill="#7d8698" />
      <rect x="24" y="42" width="52" height="10" rx="2" fill={L} />
      <path d="M30 60 h40 l6 30 h-52 z" fill="#86c4f5" />
      <rect x="8" y="90" width="84" height="6" rx="2" fill={L} />
    </>
  ),
  crate: ({ accent }) => (
    <>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={15 + i * 19} y="8" width="13" height="44" rx="5" fill="#3f8a4a" />)}
      <rect x="6" y="40" width="88" height="54" rx="5" fill={accent} />
      <rect x="18" y="52" width="64" height="9" rx="4" fill="#00000033" />
    </>
  ),
  recycle: () => (
    <g fill="none" stroke={C.green} strokeWidth="11" strokeLinecap="round">
      <path d="M50 14 A36 36 0 0 1 84 58" />
      <path d="M76 82 A36 36 0 0 1 22 76" />
      <path d="M14 52 A36 36 0 0 1 36 18" />
      <path d="M78 46 l7 14 l12 -9" strokeWidth="8" />
      <path d="M30 70 l-9 7 l11 9" strokeWidth="8" />
      <path d="M43 12 l-8 6 l6 11" strokeWidth="8" />
    </g>
  ),
  factory: ({ accent }) => (
    <>
      <path d="M6 92 V50 L30 36 V50 L54 36 V50 L78 36 V92 z" fill={L} />
      <rect x="80" y="12" width="13" height="80" fill={L} />
      {[0, 1, 2].map((i) => <rect key={i} x={13 + i * 22} y="62" width="11" height="12" fill={accent} />)}
      <circle cx="87" cy="6" r="5" fill="#ffffff55" />
    </>
  ),
  shop: ({ accent }) => (
    <>
      <rect x="10" y="42" width="80" height="50" fill={L} />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${6 + i * 17.6} 20 h17.6 v18 a8.8 8.8 0 0 1 -17.6 0 z`} fill={i % 2 ? "#fff" : accent} />)}
      <rect x="40" y="60" width="20" height="32" fill={accent} />
      <rect x="16" y="54" width="18" height="14" fill="#86c4f5" />
      <rect x="66" y="54" width="18" height="14" fill="#86c4f5" />
    </>
  ),
  receipt: () => (
    <>
      <path d="M20 6 h60 v88 l-10 -6 l-10 6 l-10 -6 l-10 6 l-10 -6 l-10 6 z" fill="#fff" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x="30" y={20 + i * 12} width={i % 2 ? 30 : 40} height="4" rx="2" fill="#b0b6c2" />)}
      <rect x="30" y="72" width="40" height="7" rx="2" fill={C.ink} />
    </>
  ),
  server: ({ accent }) => (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="14" y={10 + i * 28} width="72" height="22" rx="4" fill={L} />
          <circle cx="74" cy={21 + i * 28} r="4" fill={accent} />
          <rect x="22" y={19 + i * 28} width="30" height="4" fill="#7d8698" />
        </g>
      ))}
    </>
  ),
  wash: () => (
    <>
      <circle cx="50" cy="50" r="42" fill="#86c4f5" />
      {[[36, 40, 10], [60, 34, 7], [56, 60, 12], [30, 66, 6]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeWidth="3" />)}
    </>
  ),
  person: () => (
    <>
      <circle cx="50" cy="26" r="16" fill={L} />
      <path d="M20 94 v-16 a30 30 0 0 1 60 0 v16 z" fill={L} />
    </>
  ),
  machine: ({ accent }) => (
    <>
      <rect x="18" y="4" width="64" height="92" rx="6" fill={L} />
      <rect x="28" y="16" width="44" height="26" rx="3" fill={C.ink} />
      <circle cx="50" cy="29" r="8" fill={accent} />
      <rect x="30" y="52" width="40" height="8" rx="2" fill="#7d8698" />
      <rect x="62" y="70" width="12" height="16" rx="2" fill={accent} />
    </>
  ),
};

export const Icon: React.FC<{ name: string; size: number; accent?: string; style?: React.CSSProperties }> = ({ name, size, accent = C.accent, style }) => {
  const draw = paths[name] || paths.lens;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", filter: "drop-shadow(0 10px 0 rgba(0,0,0,.28))", ...style }}>
      {draw({ accent })}
    </svg>
  );
};

export const CheckBadge: React.FC<{ size: number; ok?: boolean }> = ({ size, ok = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect x="2" y="2" width="96" height="96" rx="22" fill={ok ? C.green : C.red} />
    {ok ? <path d="M24 52 L42 70 L77 32" stroke="#fff" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : <g stroke="#fff" strokeWidth="12" strokeLinecap="round"><line x1="30" y1="30" x2="70" y2="70" /><line x1="70" y1="30" x2="30" y2="70" /></g>}
  </svg>
);
