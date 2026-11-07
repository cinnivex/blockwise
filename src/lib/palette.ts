/**
 * Category colors. Every one has at least 4.5:1 contrast with white text
 * (WCAG AA), so labels stay readable on timeline blocks in light and dark mode.
 */
export const PALETTE = [
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Sky", hex: "#0369a1" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Green", hex: "#15803d" },
  { name: "Olive", hex: "#4d7c0f" },
  { name: "Amber", hex: "#b45309" },
  { name: "Orange", hex: "#c2410c" },
  { name: "Red", hex: "#dc2626" },
  { name: "Pink", hex: "#be185d" },
  { name: "Purple", hex: "#7e22ce" },
  { name: "Slate", hex: "#475569" },
] as const;

export const PALETTE_HEXES: readonly string[] = PALETTE.map((c) => c.hex);

export function colorName(hex: string): string {
  return PALETTE.find((c) => c.hex === hex.toLowerCase())?.name ?? hex;
}
