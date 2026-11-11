"use client";

import clsx from "clsx";
import { type ReactNode, useId } from "react";
import type { LeagueFamily } from "@/lib/battle";

// Original league badges. Every tier is built from the same layers:
//   ground shadow → back ornaments (rays, wings, fins) → bevelled metal frame →
//   glossy jewel body → extruded 3D emblem → glare + moving shine →
//   front ornaments (gem, crown, division ribbon, sparkles)
// Higher tiers get a fancier frame and more ornaments so progress is visible
// at a glance. Pure SVG so they stay crisp at any size.

type Tone = [hi: string, mid: string, lo: string];

const PALETTE: Record<
  LeagueFamily,
  { rim: Tone; body: Tone; emblem: Tone; gem?: [string, string]; glow: string; ink: string }
> = {
  unranked: { rim: ["#f8fafc", "#a3afc0", "#4b5565"], body: ["#cfd8e3", "#6b7a90", "#1f2937"], emblem: ["#ffffff", "#d5dde8", "#475569"], glow: "#94a3b8", ink: "#334155" },
  bronze: { rim: ["#ffe2bf", "#d38b4c", "#6b3511"], body: ["#f7b57c", "#b6622a", "#451c06"], emblem: ["#fff3e2", "#f3b47c", "#7a3a12"], glow: "#f08a3c", ink: "#5a2608" },
  silver: { rim: ["#ffffff", "#c5cedb", "#566273"], body: ["#eef3f9", "#8d9fb6", "#2a3445"], emblem: ["#ffffff", "#dae3ef", "#566273"], glow: "#dbe6f5", ink: "#2a3445" },
  gold: { rim: ["#fff8c9", "#f5c518", "#8a5200"], body: ["#ffe98a", "#f0a500", "#6e3500"], emblem: ["#fffbea", "#ffd84d", "#9a5a00"], gem: ["#ff9fb1", "#c8002b"], glow: "#ffd43b", ink: "#6e3500" },
  crystal: { rim: ["#fdf4ff", "#d9a9ff", "#6b21a8"], body: ["#f3ccff", "#b25cf2", "#360966"], emblem: ["#ffffff", "#f3d9ff", "#7e22ce"], gem: ["#b5f6ff", "#0891b2"], glow: "#e879f9", ink: "#4c0f86" },
  master: { rim: ["#fff4c7", "#e2aa2e", "#734500"], body: ["#666c7c", "#272b36", "#06070a"], emblem: ["#fff4c7", "#f5c542", "#734500"], gem: ["#9ff5bf", "#15803d"], glow: "#f59e0b", ink: "#3b2a05" },
  champion: { rim: ["#fff4c7", "#f2b62c", "#854500"], body: ["#ff93a8", "#e0103e", "#52040f"], emblem: ["#ffffff", "#ffd3dc", "#8f0f2e"], gem: ["#a8cdff", "#1d4ed8"], glow: "#fb7185", ink: "#5c1500" },
  titan: { rim: ["#f0f9ff", "#9fcaf6", "#1e3a8a"], body: ["#86ceff", "#1f6fe0", "#081a52"], emblem: ["#ffffff", "#d3ebff", "#1e40af"], gem: ["#fde68a", "#d97706"], glow: "#38bdf8", ink: "#0b2366" },
  legend: { rim: ["#fff7d4", "#f5c542", "#854a00"], body: ["#ddbfff", "#8b3ff0", "#24044d"], emblem: ["#fff9e6", "#ffd36b", "#8a4f00"], gem: ["#ffa8db", "#db2777"], glow: "#c084fc", ink: "#4a2400" },
};

const TIER: Record<LeagueFamily, number> = { unranked: 0, bronze: 1, silver: 2, gold: 3, crystal: 4, master: 5, champion: 6, titan: 7, legend: 8 };

// frames, all centred on (50, 55)
const MEDAL = "M50 10 A45 45 0 1 1 50 100 A45 45 0 1 1 50 10 Z";
const SHIELD = "M50 4 L90 17 V50 C90 77 72 96 50 107 C28 96 10 77 10 50 V17 Z";
const HEX = "M50 2 L91 25 V80 L50 108 L9 80 V25 Z";
const CREST = "M50 3 L62 9 L90 11 V50 C90 78 72 96 50 108 C28 96 10 78 10 50 V11 L38 9 Z";
const FRAME: Record<LeagueFamily, string> = {
  unranked: MEDAL,
  bronze: SHIELD,
  silver: SHIELD,
  gold: SHIELD,
  crystal: HEX,
  master: CREST,
  champion: CREST,
  titan: CREST,
  legend: CREST,
};
const INNER_T = "translate(50 55.5) scale(0.8) translate(-50 -55.5)";

const STAR = "M50 30 L55.9 42.1 L69 43.8 L59.4 52.9 L61.8 66 L50 59.6 L38.2 66 L40.6 52.9 L31 43.8 L44.1 42.1 Z";
const SPARK = "M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z";

/** Emblem silhouettes (coloured by the caller so they can be extruded). */
function emblemShape(family: LeagueFamily): ReactNode {
  switch (family) {
    case "unranked":
      return <path fillRule="evenodd" d="M50 34 A16 16 0 1 1 50 66 A16 16 0 1 1 50 34 Z M50 42 A8 8 0 1 0 50 58 A8 8 0 1 0 50 42 Z" />;
    case "bronze":
      return <path d={STAR} />;
    case "silver":
      return (
        <>
          <path d={STAR} transform="translate(0 -3)" />
          <path d={STAR} transform="translate(8 46) scale(0.42)" />
          <path d={STAR} transform="translate(50 46) scale(0.42)" />
        </>
      );
    case "gold":
      return <path d="M29 64 L26 37 L39 49 L50 31 L61 49 L74 37 L71 64 Z M29 67 H71 V74 H29 Z" />;
    case "crystal":
      return <path d="M50 27 L69 44 L50 76 L31 44 Z" />;
    case "master":
      return (
        <>
          <path d="M31 31 L35 29 L64 61 L67 58 L71 62 L66 67 L69 71 L65 74 L61 70 L57 74 L53 70 L57 66 Z" />
          <path d="M69 31 L65 29 L36 61 L33 58 L29 62 L34 67 L31 71 L35 74 L39 70 L43 74 L47 70 L43 66 Z" />
        </>
      );
    case "champion":
      return (
        <>
          <path d="M50 33 L54.6 42.6 L65 44 L57.4 51.2 L59.3 61.6 L50 56.6 L40.7 61.6 L42.6 51.2 L35 44 L45.4 42.6 Z" />
          <path d="M36 50 C27 48 21 41 19 33 C25 38 31 39 37 39 Z M64 50 C73 48 79 41 81 33 C75 38 69 39 63 39 Z" />
          <path d="M37 58 C29 58 23 54 20 48 C26 51 31 51 37 50 Z M63 58 C71 58 77 54 80 48 C74 51 69 51 63 50 Z" />
        </>
      );
    case "titan":
      return <path d="M50 26 C56 36 67 43 65 56 C64 67 57 74 50 75 C43 74 36 67 35 56 C34 48 40 44 43 37 C44 44 47 48 50 48 C49 40 46 33 50 26 Z" />;
    case "legend":
      return <path d="M50 25 L55.5 42 L72 35.5 L61.5 50 L72 64.5 L55.5 58 L50 75 L44.5 58 L28 64.5 L38.5 50 L28 35.5 L44.5 42 Z" />;
  }
}

/** Light-catching details drawn over the emblem. */
function emblemDetail(family: LeagueFamily, edge: string): ReactNode {
  const line = { fill: "none", stroke: edge, strokeOpacity: 0.45, strokeWidth: 1.4, strokeLinejoin: "round" as const };
  switch (family) {
    case "crystal":
      return (
        <>
          <path d="M31 44 H69 M50 27 L42 44 L50 76 L58 44 Z" {...line} />
          <path d="M50 27 L42 44 H50 Z" fill="#fff" opacity="0.55" />
        </>
      );
    case "legend":
      return <circle cx="50" cy="50" r="5.5" fill="#fff" stroke={edge} strokeOpacity="0.5" strokeWidth="1.2" />;
    case "titan":
      return <path d="M50 54 C53 58 56 61 55 66 C54 70 52 71 50 71 C48 71 45 69 45 65 C45 61 48 59 50 54 Z" fill="#fff" opacity="0.6" />;
    case "gold":
      return (
        <>
          <circle cx="26" cy="37" r="3" fill="#fff" />
          <circle cx="50" cy="31" r="3.4" fill="#fff" />
          <circle cx="74" cy="37" r="3" fill="#fff" />
        </>
      );
    default:
      return null;
  }
}

function Wings({ fill, big }: { fill: string; big: boolean }) {
  const feathers = big
    ? [
        "M21 24 C9 15 -1 6 -7 -9 C5 -3 15 3 23 13 Z",
        "M16 40 C2 36 -8 25 -10 10 C0 18 10 24 18 27 Z",
        "M14 56 C0 56 -8 46 -10 33 C-2 41 8 43 16 43 Z",
        "M16 72 C4 74 -6 66 -8 53 C0 59 8 61 16 59 Z",
      ]
    : [
        "M16 42 C5 38 -3 29 -5 17 C3 24 10 28 18 30 Z",
        "M14 58 C3 58 -4 50 -6 39 C1 45 8 47 16 46 Z",
        "M16 72 C7 73 0 67 -2 58 C4 62 10 63 16 61 Z",
      ];
  const side = (
    <g fill={fill} stroke="rgb(0 0 0 / 0.42)" strokeWidth="1.3" strokeLinejoin="round">
      {feathers.map((d, i) => (
        <path key={i} d={d} />
      ))}
      {feathers.map((d, i) => (
        <path key={`h${i}`} d={d} fill="#fff" stroke="none" opacity="0.28" transform="translate(1.5 -1.2) scale(0.97)" />
      ))}
    </g>
  );
  return (
    <>
      {side}
      <g transform="translate(100 0) scale(-1 1)">{side}</g>
    </>
  );
}

function Fins({ fill }: { fill: string }) {
  const side = (
    <g fill={fill} stroke="rgb(0 0 0 / 0.42)" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M13 19 L-3 7 L3 27 L12 34 Z" />
      <path d="M11 50 L-1 49 L9 63 Z" />
    </g>
  );
  return (
    <>
      {side}
      <g transform="translate(100 0) scale(-1 1)">{side}</g>
    </>
  );
}

function Gem({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M0 ${-r} L${r * 0.85} 0 L0 ${r} L${-r * 0.85} 0 Z`} fill={fill} stroke="rgb(0 0 0 / 0.45)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={`M0 ${-r * 0.8} L${r * 0.55} ${-r * 0.05} L0 0 L${-r * 0.55} ${-r * 0.05} Z`} fill="#fff" opacity="0.7" />
    </g>
  );
}

function Crown({ gold, gem }: { gold: string; gem: string }) {
  return (
    <g>
      <path d="M29 11 L26 -6 L38.5 2.5 L50 -13 L61.5 2.5 L74 -6 L71 11 Z" fill={gold} stroke="rgb(0 0 0 / 0.45)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M31 8 L29.5 -1 L38.5 5 L50 -8 L61.5 5 L70.5 -1 L69 8 Z" fill="#fff" opacity="0.25" />
      <rect x="28" y="7" width="44" height="8" rx="2.5" fill={gold} stroke="rgb(0 0 0 / 0.45)" strokeWidth="1.4" />
      <rect x="30" y="8.2" width="40" height="2.4" rx="1.2" fill="#fff" opacity="0.55" />
      {[
        [26, -6],
        [50, -13],
        [74, -6],
      ].map(([cx, cy]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r="3.4" fill={gem} stroke="rgb(0 0 0 / 0.45)" strokeWidth="1" />
          <circle cx={cx - 1} cy={cy - 1.1} r="1.1" fill="#fff" />
        </g>
      ))}
      <Gem x={50} y={11} r={4.2} fill={gem} />
    </g>
  );
}

function Sparkle({ x, y, s, delay }: { x: number; y: number; s: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={SPARK} fill="#fff" transform={`scale(${s})`}>
        <animateTransform attributeName="transform" type="scale" values={`0;${s};0;0`} keyTimes="0;0.2;0.4;1" dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" />
      </path>
    </g>
  );
}

const ROMAN = ["", "I", "II", "III"];

export function LeagueBadge({
  family,
  division = 0,
  size = 64,
  className,
  glow = false,
  dim = false,
}: {
  family: LeagueFamily;
  division?: 0 | 1 | 2 | 3;
  size?: number;
  className?: string;
  glow?: boolean;
  dim?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const p = PALETTE[family];
  const tier = TIER[family];
  const frame = FRAME[family];
  const lite = size < 30; // tiny badges skip the animated extras
  const u = (name: string) => `url(#${name}${id})`;
  const hasRibbon = division > 0;
  const crowned = tier >= 6;
  const shineDelay = (tier * 0.37) % 2;

  return (
    <svg
      viewBox="-10 -16 120 141.6"
      width={size}
      height={size * 1.18}
      className={clsx("shrink-0 overflow-visible", dim && "saturate-[0.85]", className)}
      style={glow ? { filter: `drop-shadow(0 0 ${Math.max(4, size / 9)}px ${p.glow})` } : undefined}
      aria-hidden
    >
      <defs>
        <linearGradient id={`rim${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.rim[0]} />
          <stop offset="0.46" stopColor={p.rim[1]} />
          <stop offset="0.54" stopColor={p.rim[2]} />
          <stop offset="0.8" stopColor={p.rim[1]} />
          <stop offset="1" stopColor={p.rim[2]} />
        </linearGradient>
        <linearGradient id={`wing${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.rim[0]} />
          <stop offset="0.55" stopColor={p.rim[1]} />
          <stop offset="1" stopColor={p.rim[2]} />
        </linearGradient>
        <linearGradient id={`edge${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={`body${id}`} cx="0.36" cy="0.28" r="0.9">
          <stop offset="0" stopColor={p.body[0]} />
          <stop offset="0.5" stopColor={p.body[1]} />
          <stop offset="1" stopColor={p.body[2]} />
        </radialGradient>
        <linearGradient id={`emb${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.emblem[0]} />
          <stop offset="1" stopColor={p.emblem[1]} />
        </linearGradient>
        <linearGradient id={`gloss${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`shine${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`gem${id}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.3" stopColor={p.gem?.[0] ?? "#fff"} />
          <stop offset="1" stopColor={p.gem?.[1] ?? "#999"} />
        </radialGradient>
        <linearGradient id={`crown${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7c4" />
          <stop offset="0.5" stopColor="#f7c21a" />
          <stop offset="1" stopColor="#a35d00" />
        </linearGradient>
        <radialGradient id={`rays${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.95" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`frame${id}`}>
          <path d={frame} />
        </clipPath>
        <clipPath id={`inner${id}`}>
          <path d={frame} transform={INNER_T} />
        </clipPath>
        <clipPath id={`top${id}`}>
          <rect x="-10" y="-10" width="120" height="58" />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx="50" cy={hasRibbon ? 119 : 113} rx="30" ry="4.5" fill="#000" opacity="0.28" />

      {/* back ornaments */}
      {family === "legend" && (
        <g opacity="0.85">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M50 55 L46 -14 L54 -14 Z" fill={u("rays")} transform={`rotate(${i * 30} 50 55)`} />
          ))}
          {!lite && <animateTransform attributeName="transform" type="rotate" from="0 50 55" to="360 50 55" dur="16s" repeatCount="indefinite" />}
        </g>
      )}
      {tier >= 6 && <Wings fill={u("wing")} big />}
      {tier === 5 && <Wings fill={u("wing")} big={false} />}
      {(tier === 2 || tier === 3) && <Fins fill={u("wing")} />}

      {/* bevelled frame */}
      <path d={frame} fill={u("rim")} stroke="rgb(0 0 0 / 0.5)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d={frame} fill="none" stroke={u("edge")} strokeWidth="1.6" transform="translate(50 55.5) scale(0.955) translate(-50 -55.5)" />

      {/* jewel body */}
      <path d={frame} transform={INNER_T} fill={u("body")} />
      <g clipPath={u("inner")}>
        {family === "crystal" && (
          <g fill="#fff">
            <path d="M50 10 L90 30 L50 55 Z" opacity="0.12" />
            <path d="M10 80 L50 55 L50 110 Z" opacity="0.08" />
          </g>
        )}
        <ellipse cx="50" cy="104" rx="34" ry="14" fill="#fff" opacity="0.14" />
      </g>
      <path d={frame} transform={INNER_T} fill="none" stroke="rgb(0 0 0 / 0.5)" strokeWidth="2.6" strokeLinejoin="round" />

      {/* 3D emblem: extrusion, face, top light, details */}
      <g transform="translate(50 57) scale(0.92) translate(-50 -50)">
        <g fill={p.emblem[2]} transform="translate(0 3.6)">
          {emblemShape(family)}
        </g>
        <g fill={u("emb")} stroke="rgb(0 0 0 / 0.38)" strokeWidth="1.2" strokeLinejoin="round">
          {emblemShape(family)}
        </g>
        <g fill="#fff" opacity="0.4" clipPath={u("top")}>
          {emblemShape(family)}
        </g>
        {emblemDetail(family, p.emblem[2])}
      </g>

      {/* glare + moving shine */}
      <g clipPath={u("inner")}>
        <ellipse cx="44" cy="20" rx="44" ry="25" fill={u("gloss")} />
      </g>
      {!lite && (
        <g clipPath={u("frame")}>
          <g>
            <rect x="-40" y="-20" width="22" height="160" fill={u("shine")} transform="skewX(-18)" />
            <animateTransform attributeName="transform" type="translate" values="-20 0;150 0;150 0" keyTimes="0;0.3;1" dur="4.2s" begin={`${shineDelay}s`} repeatCount="indefinite" />
          </g>
        </g>
      )}

      {/* front ornaments */}
      {(tier === 3 || tier === 4 || tier === 5) && <Gem x={50} y={tier === 4 ? 2 : 4} r={7.5} fill={u("gem")} />}
      {crowned && <Crown gold={u("crown")} gem={u("gem")} />}

      {hasRibbon && (
        <g>
          <g fill={p.rim[2]} stroke="rgb(0 0 0 / 0.45)" strokeWidth="1.2" strokeLinejoin="round">
            <path d="M18 99 L3 100 L9 107.5 L3 115 L20 113 Z" />
            <path d="M82 99 L97 100 L91 107.5 L97 115 L80 113 Z" />
          </g>
          <path d="M13 95 Q50 88 87 95 L87 112 Q50 105 13 112 Z" fill={u("rim")} stroke="rgb(0 0 0 / 0.5)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M15 96.8 Q50 90 85 96.8" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.2" />
          <text
            x="50"
            y="107"
            textAnchor="middle"
            fontSize="14"
            fontWeight="900"
            fill={p.ink}
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="1.6"
            paintOrder="stroke"
            fontFamily="ui-serif, Georgia, serif"
            letterSpacing="0.5"
          >
            {ROMAN[division]}
          </text>
        </g>
      )}

      {!lite && tier >= 4 && (
        <>
          <Sparkle x={83} y={12} s={1} delay={0} />
          <Sparkle x={15} y={40} s={0.75} delay={0.9} />
          {tier >= 6 && <Sparkle x={88} y={70} s={0.85} delay={1.7} />}
          {tier >= 7 && <Sparkle x={8} y={-4} s={0.7} delay={1.2} />}
        </>
      )}
    </svg>
  );
}

/** Glossy gold cup. */
export function TrophyIcon({ size = 24, className }: { size?: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={clsx("shrink-0 overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={`cyl${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b86e00" />
          <stop offset="0.28" stopColor="#ffe88a" />
          <stop offset="0.5" stopColor="#ffc928" />
          <stop offset="1" stopColor="#9a5600" />
        </linearGradient>
        <linearGradient id={`base${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a4e12" />
          <stop offset="1" stopColor="#4a2306" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="61" rx="18" ry="2.5" fill="#000" opacity="0.25" />
      <path d="M15 15 H8.5 C7 15 6 16 6 17.5 C6 26 11 31.5 18 32.5 M49 15 H55.5 C57 15 58 16 58 17.5 C58 26 53 31.5 46 32.5" fill="none" stroke="#7a4300" strokeWidth="6" strokeLinecap="round" />
      <path d="M15 15 H8.5 C7 15 6 16 6 17.5 C6 26 11 31.5 18 32.5 M49 15 H55.5 C57 15 58 16 58 17.5 C58 26 53 31.5 46 32.5" fill="none" stroke={`url(#cyl${id})`} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M27.5 41 H36.5 L35.5 48 H28.5 Z" fill={`url(#cyl${id})`} stroke="#7a4300" strokeWidth="1.4" />
      <path d="M21 47 H43 L45.5 52 H18.5 Z" fill={`url(#cyl${id})`} stroke="#7a4300" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="15" y="51.5" width="34" height="8.5" rx="2" fill={`url(#base${id})`} stroke="#3b1a04" strokeWidth="1.4" />
      <rect x="23" y="53.6" width="18" height="4" rx="1" fill="#ffd34d" opacity="0.85" />
      <path d="M14 9 H50 V22 C50 34 42 42 32 42 C22 42 14 34 14 22 Z" fill={`url(#cyl${id})`} stroke="#7a4300" strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx="32" cy="9" rx="18" ry="3.6" fill="#8a4e00" stroke="#7a4300" strokeWidth="1.4" />
      <ellipse cx="32" cy="9.8" rx="14.5" ry="2.2" fill="#c27c00" />
      <path d="M14.4 9.6 A18 3.6 0 0 0 49.6 9.6" fill="none" stroke="#fff6c4" strokeWidth="1.2" />
      <path d="M32 17 L34.2 21.6 L39.2 22.3 L35.6 25.8 L36.5 30.8 L32 28.4 L27.5 30.8 L28.4 25.8 L24.8 22.3 L29.8 21.6 Z" fill="#fff8d6" stroke="#b86e00" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M19 13 C19 24 21 32 25.5 37.5 C20.5 36 17 29.5 17 21.5 V13 Z" fill="#fff" opacity="0.55" />
      <path d="M53 3 L53.8 5.2 L56 6 L53.8 6.8 L53 9 L52.2 6.8 L50 6 L52.2 5.2 Z" fill="#fff" />
    </svg>
  );
}

/** Crossed swords for the arena header and search screen. */
export function SwordsIcon({ size = 48, className }: { size?: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={clsx("shrink-0 overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#dbe6f3" />
          <stop offset="0.52" stopColor="#8aa0bb" />
          <stop offset="1" stopColor="#c7d4e4" />
        </linearGradient>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset="0.5" stopColor="#ffc21a" />
          <stop offset="1" stopColor="#a35d00" />
        </linearGradient>
        <radialGradient id={`g${id}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.3" stopColor="#ff7a93" />
          <stop offset="1" stopColor="#b0002a" />
        </radialGradient>
      </defs>
      {[0, 1].map((i) => (
        <g key={i} transform={i ? "scale(-1 1) translate(-100 0)" : undefined}>
          <path d="M12 6 L23 5 L73 61 L63 71 Z" fill={`url(#b${id})`} stroke="#253246" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M16 9 L22 8.5 L68 60" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
          <path d="M56 76 L76 56 L83 63 L63 83 Z" fill={`url(#h${id})`} stroke="#6b3d00" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="69.5" cy="69.5" r="3.6" fill={`url(#g${id})`} stroke="#6b0018" strokeWidth="1.2" />
          <path d="M70 77 L80 87 L87 80 L77 70 Z" fill="#7c2d12" stroke="#3b1406" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M72.5 76.5 L80.5 84.5 M76.5 72.5 L84.5 80.5" stroke="#b45a2a" strokeWidth="1.4" />
          <circle cx="87" cy="89" r="5.5" fill={`url(#h${id})`} stroke="#6b3d00" strokeWidth="2" />
          <circle cx="85.5" cy="87.5" r="1.6" fill="#fff" opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}
