import { formatById } from "./catalog";
import type { DesignModel, ExportModel } from "./schema";

const CSS_DPI = 96;

function mmToPx(mm: number): number {
  return (mm / 25.4) * CSS_DPI;
}

function inToPx(inches: number): number {
  return inches * CSS_DPI;
}

export function customToPx(value: number, unit: DesignModel["customUnit"]): number {
  if (unit === "mm") return mmToPx(value);
  if (unit === "in") return inToPx(value);
  return value;
}

export function resolveLogicalPage(design: DesignModel): {
  width: number;
  height: number;
  kind: "print" | "digital";
} {
  const format = formatById(design.formatId);
  let width = 794;
  let height = 1123;
  let kind: "print" | "digital" = "print";

  if (format.kind === "print") {
    kind = "print";
    if (format.widthMm && format.heightMm) {
      width = mmToPx(format.widthMm);
      height = mmToPx(format.heightMm);
    } else if (format.widthIn && format.heightIn) {
      width = inToPx(format.widthIn);
      height = inToPx(format.heightIn);
    }
  } else if (format.kind === "digital") {
    kind = "digital";
    width = format.widthPx ?? 1080;
    height = format.heightPx ?? 1350;
  } else {
    kind = "digital";
    width = customToPx(design.customWidth, design.customUnit);
    height = customToPx(design.customHeight, design.customUnit);
  }

  const square = Math.abs(width - height) < 1;
  if (!square && design.orientation === "landscape" && height > width) {
    [width, height] = [height, width];
  }
  if (!square && design.orientation === "portrait" && width > height) {
    [width, height] = [height, width];
  }

  return {
    width: Math.max(320, Math.round(width)),
    height: Math.max(320, Math.round(height)),
    kind,
  };
}

export function resolveOutputPage(
  design: DesignModel,
  exp: ExportModel,
): { width: number; height: number; scale: number; kind: "print" | "digital" } {
  const logical = resolveLogicalPage(design);
  const scale =
    logical.kind === "print" ? Math.max(1, exp.dpi / CSS_DPI) : Math.max(1, exp.pixelScale);
  return {
    width: Math.round(logical.width * scale),
    height: Math.round(logical.height * scale),
    scale,
    kind: logical.kind,
  };
}

export function formatPhysicalLabel(design: DesignModel): string {
  const format = formatById(design.formatId);
  if (format.kind === "print") {
    if (format.widthMm && format.heightMm) {
      const portrait = design.orientation === "portrait";
      const w = portrait ? format.widthMm : format.heightMm;
      const h = portrait ? format.heightMm : format.widthMm;
      return `${format.name} · ${w} × ${h} mm`;
    }
    if (format.widthIn && format.heightIn) {
      const portrait = design.orientation === "portrait";
      const w = portrait ? format.widthIn : format.heightIn;
      const h = portrait ? format.heightIn : format.widthIn;
      return `${format.name} · ${w} × ${h} in`;
    }
  }
  const page = resolveLogicalPage(design);
  return `${format.name} · ${page.width} × ${page.height} px`;
}
