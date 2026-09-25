import { fontByCssName } from "../fonts";
import { clamp } from "../measure";
import type { FontSpec, ResolvedType, TypographyModel } from "../schema";

function snapWeight(family: string, requested: number): number {
  const def = fontByCssName(family);
  if (!def) return requested;
  if (def.variable) return requested;
  return def.weights.reduce((best, w) =>
    Math.abs(w - requested) < Math.abs(best - requested) ? w : best,
  );
}

function spec(
  family: string,
  weight: number,
  size: number,
  lineHeight: number,
  trackingEm: number,
  style: "normal" | "italic" = "normal",
): FontSpec {
  return {
    family,
    weight: snapWeight(family, weight),
    size,
    lineHeight,
    letterSpacing: size * trackingEm,
    style,
  };
}

export function resolveTypography(
  pageWidth: number,
  type: TypographyModel,
  typeScale = 1,
): ResolvedType {
  const display = type.displayFamily;
  const body = type.bodyFamily;
  const k = pageWidth * typeScale;

  const headlineSize = clamp(
    k * 0.048 * type.headlineScale,
    pageWidth * 0.026,
    pageWidth * 0.078,
  );
  const dekSize = clamp(k * 0.0185 * type.dekScale, pageWidth * 0.013, pageWidth * 0.028);
  const bodySize = clamp(k * 0.0152 * type.bodyScale, pageWidth * 0.0122, pageWidth * 0.02);
  const captionSize = clamp(
    k * 0.0116 * type.captionScale,
    pageWidth * 0.01,
    pageWidth * 0.015,
  );
  const metaSize = clamp(k * 0.0114, pageWidth * 0.0095, pageWidth * 0.0145);
  const mastheadSize = clamp(k * 0.092, pageWidth * 0.055, pageWidth * 0.14);
  const editionSize = clamp(k * 0.0122, 8, pageWidth * 0.016);

  return {
    displayFamily: display,
    bodyFamily: body,
    masthead: spec(display, 700, mastheadSize, 0.92, 0.045),
    edition: spec(body, type.metaWeight, editionSize, 1.1, 0.18),
    headline: spec(
      display,
      type.headlineWeight,
      headlineSize,
      type.headlineLeading,
      type.headlineTracking,
    ),
    dek: spec(body, type.dekWeight, dekSize, type.dekLeading, type.dekTracking),
    body: spec(body, type.bodyWeight, bodySize, type.bodyLeading, type.bodyTracking),
    caption: spec(body, 400, captionSize, 1.32, 0.02, "italic"),
    meta: spec(body, type.metaWeight, metaSize, 1.25, 0.12),
  };
}

export function minReadableBody(pageWidth: number): number {
  return pageWidth * 0.012;
}
