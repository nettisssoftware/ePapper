import { paletteById } from "../catalog";
import type { PaletteId, ResolvedPalette } from "../schema";

/**
 * Palettes control the page field and inner editorial surfaces only.
 * They never touch the masthead brand color.
 */
export function resolvePalette(id: PaletteId): ResolvedPalette {
  return paletteById(id);
}
