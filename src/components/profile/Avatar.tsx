"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { ProggaBot } from "@/components/brand/ProggaBot";
import { paletteFor } from "@/lib/skins";
import type { Role } from "@/lib/types";

interface Props {
  name: string;
  photoUrl?: string | null;
  role?: Role;
  skin?: string;
  size?: number;
  className?: string;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Profile photo, or a stand-in: the student's robot, or an adult's initials. */
export function Avatar({ name, photoUrl, role, skin, size = 44, className }: Props) {
  const box = { width: size, height: size };
  const shape = clsx("shrink-0 overflow-hidden rounded-[28%]", className);
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- same-origin API image, already sized
      <motion.img key={photoUrl} src={photoUrl} alt={name} width={size} height={size} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={clsx(shape, "bg-cream object-cover")} style={box} />
    );
  }
  if (role === "STUDENT") {
    return (
      <span className={clsx(shape, "grid place-items-center bg-cream")} style={box}>
        <ProggaBot size={size * 0.8} float={false} palette={paletteFor(skin)} />
      </span>
    );
  }
  return (
    <span className={clsx(shape, "grid place-items-center bg-gradient-to-br from-brand-400 to-brand-600 font-display font-extrabold text-white")} style={{ ...box, fontSize: size * 0.38 }}>
      {initials(name) || "?"}
    </span>
  );
}
