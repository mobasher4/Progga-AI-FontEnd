import type { Palette } from "./types";

// Mirror of backend/src/modules/gamification/catalog.ts SKINS palettes, used to
// render other students' robots (leaderboard, guardian views). Keep in sync.
export const SKIN_PALETTES: Record<string, Palette> = {
  classic: { body: "#2B7BE8", accent: "#FFD43B", visor: "#0F1E3D", eye: "#7CF5D4", cheek: "#FF8FA3" },
  mango: { body: "#FF9F1C", accent: "#FFE66D", visor: "#2B1D0E", eye: "#FFF3B0", cheek: "#FF6B6B" },
  mint: { body: "#2ED9A3", accent: "#FFD43B", visor: "#103B33", eye: "#B9FFF0", cheek: "#FF8FA3" },
  ocean: { body: "#12B5C9", accent: "#FFD43B", visor: "#0B2545", eye: "#9BF6FF", cheek: "#FFADAD" },
  rose: { body: "#FF6FA5", accent: "#FFE066", visor: "#3A0F24", eye: "#FFD6E8", cheek: "#FFFFFF" },
  ninja: { body: "#2D2A45", accent: "#FF4D6D", visor: "#0D0C17", eye: "#FF4D6D", cheek: "#2B7BE8" },
  galaxy: { body: "#1E3A8A", accent: "#F72585", visor: "#0B1026", eye: "#4CC9F0", cheek: "#F72585" },
  gold: { body: "#F5B700", accent: "#FFFFFF", visor: "#3D2C00", eye: "#FFF8DC", cheek: "#FF9F1C" },
};

export const paletteFor = (skinId?: string | null): Palette => SKIN_PALETTES[skinId ?? "classic"] ?? SKIN_PALETTES.classic;
