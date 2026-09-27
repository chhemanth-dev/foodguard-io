export const PALETTE_INTERVAL_MS = 2 * 60 * 60 * 1000;

export const PALETTES = [
  { id: "basil", name: "Fresh Basil", note: "Crisp greens and tangerine" },
  { id: "citrus", name: "Citrus Grove", note: "Orange zest and lime" },
  { id: "berry", name: "Berry Market", note: "Raspberry and mango" },
  { id: "ocean", name: "Ocean Harvest", note: "Deep sea blue and coral" },
  { id: "beet", name: "Beetroot Garden", note: "Beet plum and mint" },
  { id: "blueberry", name: "Blueberry Frost", note: "Blueberry and peach" },
] as const;

export type Palette = (typeof PALETTES)[number];

export function getPaletteIndex(now: number) {
  return Math.floor(now / PALETTE_INTERVAL_MS) % PALETTES.length;
}

export function getPalette(now: number): Palette {
  return PALETTES[getPaletteIndex(now)] ?? PALETTES[0];
}

export function msUntilNextPalette(now: number) {
  return PALETTE_INTERVAL_MS - (now % PALETTE_INTERVAL_MS);
}

// Runs before first paint so the correct palette is applied without a color flash.
export const paletteBootScript = `(function(){try{var ids=${JSON.stringify(PALETTES.map((p) => p.id))};var i=Math.floor(Date.now()/${PALETTE_INTERVAL_MS})%ids.length;document.documentElement.setAttribute("data-palette",ids[i]);}catch(e){}})();`;
