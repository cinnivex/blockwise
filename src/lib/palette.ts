/**
 * Category colors ("Calm focus" earthy palette). Every one has at least
 * 4.5:1 contrast with white text (WCAG AA), so labels on timeline blocks stay
 * readable. Existing categories were moved here by migration 0003.
 */
export const PALETTE = [
  { name: "Sage", hex: "#4f7a55" },
  { name: "Clay", hex: "#a2512f" },
  { name: "Lavender", hex: "#6c5d9c" },
  { name: "Ochre", hex: "#865f12" },
  { name: "Teal", hex: "#2f6f6a" },
  { name: "Lake", hex: "#3b6c8c" },
  { name: "Slate", hex: "#55609a" },
  { name: "Rose", hex: "#a0485c" },
  { name: "Plum", hex: "#7b4d78" },
  { name: "Moss", hex: "#5e6c2c" },
  { name: "Walnut", hex: "#76573a" },
  { name: "Stone", hex: "#5e5953" },
] as const;

export const PALETTE_HEXES: readonly string[] = PALETTE.map((c) => c.hex);

export function colorName(hex: string): string {
  return PALETTE.find((c) => c.hex === hex.toLowerCase())?.name ?? hex;
}
