"use client";

import { AnimatePresence, motion, type Transition } from "framer-motion";
import { useId, type CSSProperties } from "react";
import { SKIN_PALETTES } from "@/lib/skins";
import type { Palette } from "@/lib/types";

export type BotMood = "idle" | "talking" | "asking" | "thinking" | "happy" | "cheer" | "oops";

interface Props {
  mood?: BotMood;
  palette?: Palette;
  size?: number;
  float?: boolean;
  className?: string;
}

const box: CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };
const loop = (duration: number, extra: Partial<Transition> = {}): Transition => ({ duration, repeat: Infinity, ease: "easeInOut", ...extra });
/** Every face change glides with the same soft spring, so mood switches feel alive, never jumpy. */
const morph: Transition = { type: "spring", stiffness: 170, damping: 19, mass: 0.9 };

// ── Face definitions ─────────────────────────────────────
// Eyes are rounded rects that change size; visor-coloured eyelids slide over
// them to make expressions (lower lid up = happy crescent, slanted upper lid =
// worried, half-lid = focused). Everything is the same shape, only its numbers
// change, which is what lets Framer Motion interpolate smoothly.

interface Face {
  eye: { w: number; h: number };
  lower: number; // 0..1 share of the eye covered from below
  upper: number; // 0..1 share covered from above
  tilt: number; // upper-lid slant in degrees (left eye; right eye mirrors)
  brow: { show: boolean; liftL: number; liftR: number; tiltL: number; tiltR: number };
  gaze: { x: number[]; y: number[]; duration: number };
  head: number; // head tilt in degrees
  mouth: string | string[];
}

const EYE_L = { cx: 78, cy: 105 };
const EYE_R = { cx: 122, cy: 105 };

/** Mouth = two quadratic curves (top + bottom). Same command structure for every mood so `d` can morph. */
const mouth = (x1: number, x2: number, y: number, top: number, bottom: number, cx = (x1 + x2) / 2) =>
  `M${x1} ${y} Q${cx} ${top} ${x2} ${y} Q${cx} ${bottom} ${x1} ${y} Z`;

const NO_BROW = { show: false, liftL: 0, liftR: 0, tiltL: 0, tiltR: 0 };
const STILL = { x: [0], y: [0], duration: 1 };

const FACES: Record<BotMood, Face> = {
  idle: {
    eye: { w: 16, h: 22 },
    lower: 0, upper: 0, tilt: 0, brow: NO_BROW, head: 0,
    // calm look-around
    gaze: { x: [0, 0, -3, -3, 0, 0, 3, 3, 0], y: [0, 0, 0, 0, 0, 0, -1, -1, 0], duration: 8 },
    mouth: mouth(89, 111, 125, 131, 135),
  },
  talking: {
    eye: { w: 16, h: 22 },
    lower: 0.12, upper: 0, tilt: 0, brow: NO_BROW, head: 0,
    gaze: { x: [0, 1, 0, -1, 0], y: [0, 1, 0, 1, 0], duration: 2.4 },
    mouth: [mouth(90, 110, 126, 128, 131), mouth(90, 110, 125, 122, 137), mouth(91, 109, 126, 126, 133), mouth(90, 110, 125, 121, 138), mouth(90, 110, 126, 128, 131)],
  },
  asking: {
    // curious: bigger eyes, one eyebrow up, head tilted, looking at the student
    eye: { w: 18, h: 25 },
    lower: 0, upper: 0, tilt: 0, head: 7,
    // inner ends up = curious; right brow raised higher for the "hmm?" look
    brow: { show: true, liftL: -2, liftR: -7, tiltL: -6, tiltR: 12 },
    gaze: { x: [0, 1.5, 0], y: [2, 2.5, 2], duration: 2.2 },
    mouth: mouth(95, 105, 128, 121, 135),
  },
  thinking: {
    // focused squint + scanning gaze, like it's working something out
    eye: { w: 15, h: 18 },
    lower: 0, upper: 0.22, tilt: 0, head: -3,
    brow: { show: true, liftL: 2, liftR: 2, tiltL: 10, tiltR: -10 },
    gaze: { x: [-5, 5, 5, -5, -5], y: [-4, -4, 1, 1, -4], duration: 2.6 },
    mouth: mouth(98, 110, 129, 127, 132, 104),
  },
  happy: {
    eye: { w: 18, h: 22 },
    lower: 0.55, upper: 0, tilt: 0, head: 0,
    brow: { show: true, liftL: -3, liftR: -3, tiltL: -6, tiltR: 6 },
    gaze: STILL,
    mouth: mouth(86, 114, 123, 125, 142),
  },
  cheer: {
    eye: { w: 20, h: 24 },
    lower: 0.6, upper: 0, tilt: 0, head: 0,
    brow: { show: true, liftL: -5, liftR: -5, tiltL: -8, tiltR: 8 },
    gaze: STILL,
    mouth: mouth(84, 116, 122, 123, 145),
  },
  oops: {
    // gentle "hmm, let's try again" — slanted lids, soft mouth
    eye: { w: 15, h: 20 },
    lower: 0, upper: 0.32, tilt: -14, head: -4,
    brow: { show: true, liftL: -1, liftR: -1, tiltL: -16, tiltR: 16 },
    gaze: { x: [0, -2, 0], y: [2, 3, 2], duration: 3 },
    mouth: mouth(91, 109, 129, 126, 131),
  },
};

function Eye({ c, face, side, visor, eyeColor }: { c: { cx: number; cy: number }; face: Face; side: 1 | -1; visor: string; eyeColor: string }) {
  const { w, h } = face.eye;
  const top = c.cy - h / 2;
  const bottom = c.cy + h / 2;
  const lidOrigin: CSSProperties = { transformBox: "view-box", transformOrigin: `${c.cx}px ${c.cy}px` };

  return (
    <g>
      <motion.rect fill={eyeColor} initial={false} animate={{ attrX: c.cx - w / 2, attrY: top, width: w, height: h, rx: w / 2 }} transition={morph} />
      {/* sparkle — makes the eye feel glossy and alive */}
      <motion.circle fill="#fff" opacity={0.85} r={2.6} initial={false} animate={{ cx: c.cx - w / 4, cy: top + 6 }} transition={morph} />
      {/* upper lid (slides down / slants) */}
      <motion.g style={lidOrigin} initial={false} animate={{ rotate: face.tilt * side }} transition={morph}>
        <motion.rect fill={visor} x={c.cx - 18} width={36} height={34} initial={false} animate={{ attrY: top - 34 + face.upper * h }} transition={morph} />
      </motion.g>
      {/* lower lid (rises into a happy crescent) */}
      <motion.ellipse fill={visor} rx={15} ry={12} cx={c.cx} initial={false} animate={{ cy: bottom + 12.5 - face.lower * h }} transition={morph} />
    </g>
  );
}

/**
 * Progga's robot avatar. Pure SVG + Framer Motion: crisp at any size, and every
 * expression change (thinking → asking → happy…) is a smooth morph.
 */
export function ProggaBot({ mood = "idle", palette = SKIN_PALETTES.classic, size = 160, float = true, className }: Props) {
  const p = palette;
  const face = FACES[mood];
  const happy = mood === "happy" || mood === "cheer";
  const clipId = `visor-${useId().replace(/:/g, "")}`;
  const headOrigin: CSSProperties = { transformBox: "view-box", transformOrigin: "100px 166px" };

  return (
    <motion.svg
      viewBox="0 0 200 224"
      width={size}
      height={size * 1.12}
      className={className}
      role="img"
      aria-label={`Progga the robot, ${mood}`}
      animate={mood === "cheer" ? { y: [0, -14, 0] } : float ? { y: [0, -6, 0] } : undefined}
      transition={mood === "cheer" ? loop(0.6, { repeat: 3 }) : loop(3.2)}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="46" y="74" width="108" height="70" rx="30" />
        </clipPath>
      </defs>

      {/* soft floor shadow */}
      <ellipse cx="100" cy="218" rx="46" ry="5" fill="#1E1B3A" opacity="0.08" />

      {/* body (stays upright while the head tilts) */}
      <rect x="86" y="163" width="28" height="10" rx="3" fill={p.visor} />
      <motion.rect
        x="34" y="176" width="26" height="13" rx="6.5" fill={p.accent}
        style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}
        animate={mood === "cheer" ? { rotate: [0, 50, 20, 50, 0] } : mood === "thinking" ? { rotate: -35 } : { rotate: [0, 6, 0] }}
        transition={mood === "cheer" ? loop(0.8) : mood === "thinking" ? morph : loop(3)}
      />
      <motion.rect
        x="140" y="176" width="26" height="13" rx="6.5" fill={p.accent}
        style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
        animate={happy ? { rotate: [0, -50, -20, -50, 0] } : mood === "asking" ? { rotate: -25 } : { rotate: [0, -6, 0] }}
        transition={happy ? loop(0.8) : mood === "asking" ? morph : loop(3)}
      />
      <rect x="56" y="168" width="88" height="46" rx="22" fill={p.body} />
      <rect x="80" y="178" width="40" height="26" rx="11" fill={p.visor} />
      <motion.path
        d="M100 198 L92.5 190.5 A5 5 0 0 1 100 184 A5 5 0 0 1 107.5 190.5 Z"
        fill={p.cheek}
        style={box}
        animate={{ scale: [1, 1.18, 1] }}
        transition={loop(happy ? 0.5 : mood === "thinking" ? 0.8 : 1.4)}
      />

      {/* head group — tilts smoothly with curiosity / concentration */}
      <motion.g style={headOrigin} initial={false} animate={{ rotate: face.head }} transition={morph}>
        {/* banana antenna */}
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          animate={{ rotate: mood === "thinking" ? [-8, 8, -8] : happy ? [-12, 12, -12] : mood === "asking" ? [-2, 10, -2] : [-4, 4, -4] }}
          transition={loop(mood === "thinking" ? 1.2 : happy ? 0.6 : 2.6)}
        >
          <line x1="100" y1="38" x2="100" y2="54" stroke={p.body} strokeWidth="7" strokeLinecap="round" />
          <path d="M62 26 Q100 62 142 12 Q102 40 62 26 Z" fill="#FFD43B" stroke="#E5A800" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M74 31 Q100 48 128 24" fill="none" stroke="#FFF1A8" strokeWidth="3" strokeLinecap="round" />
          <line x1="141" y1="13" x2="149" y2="5" stroke="#7A4E1D" strokeWidth="5" strokeLinecap="round" />
          <circle cx="62.5" cy="26" r="2.6" fill="#7A4E1D" />
        </motion.g>

        {/* ears — glow faster while thinking */}
        <motion.rect x="14" y="90" width="18" height="38" rx="9" fill={p.accent} animate={{ opacity: mood === "thinking" ? [1, 0.55, 1] : 1 }} transition={mood === "thinking" ? loop(0.9) : morph} />
        <motion.rect x="168" y="90" width="18" height="38" rx="9" fill={p.accent} animate={{ opacity: mood === "thinking" ? [0.55, 1, 0.55] : 1 }} transition={mood === "thinking" ? loop(0.9) : morph} />

        {/* head */}
        <rect x="28" y="52" width="144" height="114" rx="44" fill={p.body} />
        <ellipse cx="66" cy="68" rx="22" ry="8" fill="#fff" opacity="0.2" />

        {/* visor */}
        <rect x="46" y="74" width="108" height="70" rx="30" fill={p.visor} />
        <rect x="54" y="80" width="40" height="6" rx="3" fill="#fff" opacity="0.08" />

        {/* face on the visor screen, clipped so lids never spill onto the head */}
        <g clipPath={`url(#${clipId})`}>
          {/* eyes: gaze → blink → shapes + lids */}
          <motion.g
            initial={false}
            animate={{ x: face.gaze.x, y: face.gaze.y }}
            transition={face.gaze.x.length > 1 ? loop(face.gaze.duration) : morph}
          >
            <motion.g style={box} animate={{ scaleY: happy ? 1 : [1, 1, 0.08, 1] }} transition={happy ? morph : loop(4.4, { times: [0, 0.92, 0.96, 1] })}>
              <Eye c={EYE_L} face={face} side={1} visor={p.visor} eyeColor={p.eye} />
              <Eye c={EYE_R} face={face} side={-1} visor={p.visor} eyeColor={p.eye} />
            </motion.g>
          </motion.g>

          {/* eyebrows — drawn after the eyes so the parked eyelids never hide them */}
          {(
            [
              [EYE_L, face.brow.liftL, face.brow.tiltL],
              [EYE_R, face.brow.liftR, face.brow.tiltR],
            ] as const
          ).map(([c, lift, tilt], i) => (
            <motion.rect
              key={i}
              x={c.cx - 10}
              width={20}
              height={5.5}
              rx={2.75}
              fill={p.eye}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={false}
              // sits just above the eye, so it follows the eye as it grows or squints
              animate={{ attrY: c.cy - face.eye.h / 2 - 9 + lift, rotate: tilt, opacity: face.brow.show ? 1 : 0 }}
              transition={morph}
            />
          ))}

          {/* mouth (morphs between moods; talking loops) */}
          <motion.path
            fill={p.eye}
            initial={false}
            animate={{ d: face.mouth }}
            transition={Array.isArray(face.mouth) ? loop(0.9) : morph}
          />
        </g>

        {/* cheeks */}
        <motion.circle cx="52" cy="152" r="7" fill={p.cheek} initial={false} animate={{ opacity: happy ? 0.95 : mood === "asking" ? 0.85 : 0.65, r: happy ? 8 : 7 }} transition={morph} />
        <motion.circle cx="148" cy="152" r="7" fill={p.cheek} initial={false} animate={{ opacity: happy ? 0.95 : mood === "asking" ? 0.85 : 0.65, r: happy ? 8 : 7 }} transition={morph} />
      </motion.g>

      {/* thinking dots */}
      <AnimatePresence>
        {mood === "thinking" && (
          <motion.g key="dots" fill={p.body} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[0, 1, 2].map((i) => (
              <motion.circle key={i} cx={164 + i * 12} cy={56 - i * 10} r={4 + i * 1.5} animate={{ opacity: [0.2, 1, 0.2] }} transition={loop(1.2, { delay: i * 0.2 })} />
            ))}
          </motion.g>
        )}
      </AnimatePresence>

      {/* "?" bubble when Progga is asking the student something */}
      <AnimatePresence>
        {mood === "asking" && (
          <motion.g
            key="ask"
            style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: [0, -3, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ scale: morph, opacity: { duration: 0.2 }, y: loop(1.8) }}
          >
            <circle cx="172" cy="46" r="15" fill="#fff" stroke={p.body} strokeWidth="3" />
            <circle cx="160" cy="62" r="3.5" fill="#fff" stroke={p.body} strokeWidth="2" />
            <text x="172" y="53" textAnchor="middle" fontSize="20" fontWeight="800" fill={p.body} fontFamily="ui-rounded, system-ui, sans-serif">?</text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* celebration sparkles */}
      {mood === "cheer" &&
        ([
          [22, 50, "#FFD43B"],
          [178, 62, "#22C493"],
          [16, 150, "#FF6B6B"],
          [186, 140, "#3BA7FF"],
        ] as const).map(([x, y, c], i) => (
          <motion.path
            key={i}
            d={`M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z`}
            fill={c}
            style={box}
            animate={{ scale: [0, 1.2, 0], rotate: [0, 90] }}
            transition={loop(1, { delay: i * 0.15 })}
          />
        ))}
    </motion.svg>
  );
}
