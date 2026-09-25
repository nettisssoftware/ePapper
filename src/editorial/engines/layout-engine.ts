import { layoutById } from "../catalog";
import { BRAND_OCEAN } from "../brand";
import {
  blockHeight,
  clamp,
  editorialUppercase,
  flowText,
  measureMetrics,
  wrapText,
  type PositionedLine,
} from "../measure";
import type {
  Box,
  ContentModel,
  DesignModel,
  FontSpec,
  Grid,
  LayoutId,
  PreparedImage,
  ResolvedPalette,
  ResolvedType,
  Scene,
  SceneMeta,
  SceneNode,
  SceneRole,
  TypographyModel,
} from "../schema";
import { buildGrid, spanColumns } from "./grid-engine";
import { computeCrop, containPlacement } from "./image-engine";
import { composeFixedHeader } from "./fixed-header";
import { resolvePalette } from "./palette-engine";
import { minReadableBody, resolveTypography } from "./typography-engine";
import { validateScene } from "./validation-engine";

export interface ComposeParams {
  content: ContentModel;
  design: DesignModel;
  typography: TypographyModel;
  pageWidth: number;
  pageHeight: number;
  image: PreparedImage | null;
  fontsReady: boolean;
}

function makeId() {
  let n = 0;
  return (prefix: string) => `${prefix}-${++n}`;
}

function gapUnit(pageWidth: number, spacingScale: number) {
  return pageWidth * 0.011 * spacingScale;
}

function emitTextLines(
  id: (p: string) => string,
  lines: ReturnType<typeof wrapText>,
  font: FontSpec,
  box: Box,
  fill: string,
  role: SceneRole,
  align: "left" | "center",
): { nodes: SceneNode[]; height: number; bounds: Box[] } {
  const nodes: SceneNode[] = [];
  const bounds: Box[] = [];
  const lh = font.size * font.lineHeight;
  let y = box.y;
  for (const line of lines) {
    const metrics = measureMetrics(line.text || "Hg", font);
    const baseline = y + metrics.ascent;
    const x =
      align === "center" ? box.x + box.w / 2 : box.x;
    nodes.push({
      type: "text",
      id: id(role),
      x,
      y: baseline,
      text: line.text,
      fontFamily: font.family,
      fontWeight: font.weight,
      fontSize: font.size,
      letterSpacing: font.letterSpacing,
      fontStyle: font.style,
      fill,
      align,
      role,
    });
    bounds.push({ x: box.x, y, w: box.w, h: lh });
    y += lh;
  }
  return { nodes, height: lines.length * lh, bounds };
}

function emitFlow(
  id: (p: string) => string,
  lines: PositionedLine[],
  font: FontSpec,
  fill: string,
  role: SceneRole,
): { nodes: SceneNode[]; bounds: Box[] } {
  const nodes: SceneNode[] = [];
  const bounds: Box[] = [];
  for (const line of lines) {
    nodes.push({
      type: "textline",
      id: id(role),
      y: line.y,
      words: line.words,
      fontFamily: font.family,
      fontWeight: font.weight,
      fontSize: font.size,
      letterSpacing: font.letterSpacing,
      fontStyle: font.style,
      fill,
      role,
    });
    bounds.push(line.bounds);
  }
  return { nodes, bounds };
}

function layoutHeadline(
  ctx: LayoutCtx,
  text: string,
  box: Box,
  align: "left" | "center",
): { nodes: SceneNode[]; height: number; bounds: Box[] } {
  const headline = editorialUppercase(text.trim());
  if (!headline) return { nodes: [], height: 0, bounds: [] };
  const font = ctx.type.headline;
  const lines = wrapText(headline, font, box.w);
  return emitTextLines(ctx.id, lines, font, box, ctx.palette.ink, "headline", align);
}

function layoutDek(
  ctx: LayoutCtx,
  box: Box,
  align: "left" | "center",
): { nodes: SceneNode[]; height: number; bounds: Box[] } {
  const dek = ctx.content.dek.trim();
  if (!dek) return { nodes: [], height: 0, bounds: [] };
  const lines = wrapText(dek, ctx.type.dek, box.w);
  return emitTextLines(ctx.id, lines, ctx.type.dek, box, ctx.palette.ink, "dek", align);
}

function placeImage(
  ctx: LayoutCtx,
  area: Box,
): { nodes: SceneNode[]; bounds: Box[]; box: Box } {
  const nodes: SceneNode[] = [];
  const bounds: Box[] = [];
  const img = ctx.image;
  if (!img?.src || area.w < 8 || area.h < 8) {
    return { nodes, bounds, box: { ...area, h: 0 } };
  }
  let dest = { ...area };
  let crop = computeCrop(
    img.naturalWidth,
    img.naturalHeight,
    dest.w,
    dest.h,
    img.fit,
    img.focalX,
    img.focalY,
  );
  if (img.fit === "contain") {
    dest = containPlacement(img.naturalWidth, img.naturalHeight, area);
    crop = {
      sx: 0,
      sy: 0,
      sw: img.naturalWidth,
      sh: img.naturalHeight,
      distorted: false,
    };
  }
  nodes.push({
    type: "image",
    id: ctx.id("image"),
    x: dest.x,
    y: dest.y,
    w: dest.w,
    h: dest.h,
    src: img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    crop: { sx: crop.sx, sy: crop.sy, sw: crop.sw, sh: crop.sh },
    role: "image",
  });
  bounds.push(dest);
  return { nodes, bounds, box: dest };
}

function layoutCaption(ctx: LayoutCtx, box: Box): { nodes: SceneNode[]; height: number; bounds: Box[] } {
  const caption = ctx.content.image.caption.trim();
  if (!caption) return { nodes: [], height: 0, bounds: [] };
  const lines = wrapText(caption, ctx.type.caption, box.w);
  return emitTextLines(
    ctx.id,
    lines,
    ctx.type.caption,
    box,
    ctx.palette.caption,
    "caption",
    "left",
  );
}

function layoutByline(
  ctx: LayoutCtx,
  box: Box,
): { nodes: SceneNode[]; height: number; bounds: Box[] } {
  const author = ctx.content.author.trim();
  const source = ctx.content.source.trim();
  if (!author && !source) return { nodes: [], height: 0, bounds: [] };
  const parts: string[] = [];
  if (author) parts.push(`Por ${author}`);
  if (source) parts.push(source);
  const text = parts.join("  ·  ");
  const lines = wrapText(text, ctx.type.meta, box.w);
  const nodes: SceneNode[] = [];
  const bounds: Box[] = [];
  const lh = ctx.type.meta.size * ctx.type.meta.lineHeight;
  let y = box.y;
  lines.forEach((line, i) => {
    const metrics = measureMetrics(line.text, ctx.type.meta);
    nodes.push({
      type: "text",
      id: ctx.id(i === 0 && author ? "author" : "source"),
      x: box.x,
      y: y + metrics.ascent,
      text: line.text,
      fontFamily: ctx.type.meta.family,
      fontWeight: ctx.type.meta.weight,
      fontSize: ctx.type.meta.size,
      letterSpacing: ctx.type.meta.letterSpacing,
      fill: ctx.palette.inkMuted,
      align: "left",
      role: i === 0 && author ? "author" : "source",
    });
    bounds.push({ x: box.x, y, w: box.w, h: lh });
    y += lh;
  });
  return { nodes, height: lines.length * lh, bounds };
}

function columnRegions(grid: Grid, y: number, h: number): Box[] {
  return grid.columnBoxes.map((c) => ({ x: c.x, y, w: c.w, h: Math.max(0, h) }));
}

function imageHeightFor(areaW: number, aspect: number, maxH: number, imageScale: number) {
  return clamp((areaW / aspect) * imageScale, 24, maxH);
}

interface LayoutCtx {
  id: (p: string) => string;
  grid: Grid;
  area: Box;
  content: ContentModel;
  type: ResolvedType;
  palette: ResolvedPalette;
  image: PreparedImage | null;
  layoutId: LayoutId;
  spacing: number;
  imageScale: number;
  hairline: number;
}

interface LayoutBits {
  nodes: SceneNode[];
  unplacedBodyLines: number;
  overflow: boolean;
  textBounds: Box[];
  imageBounds: Box[];
}

function assembleBody(
  ctx: LayoutCtx,
  regions: Box[],
  justify = true,
  align: "left" | "center" = "left",
): LayoutBits {
  const flow = flowText(ctx.content.body, ctx.type.body, regions, { justify, align });
  const emitted = emitFlow(ctx.id, flow.lines, ctx.type.body, ctx.palette.ink, "body");
  return {
    nodes: emitted.nodes,
    unplacedBodyLines: flow.unplacedLines,
    overflow: flow.unplacedLines > 0,
    textBounds: emitted.bounds,
    imageBounds: [],
  };
}

function layout01(ctx: LayoutCtx): LayoutBits {
  const { area, spacing, grid } = ctx;
  const nodes: SceneNode[] = [];
  const textBounds: Box[] = [];
  const imageBounds: Box[] = [];
  let y = area.y;

  const head = layoutHeadline(ctx, ctx.content.headline, { ...area, y, h: area.h }, "left");
  nodes.push(...head.nodes);
  textBounds.push(...head.bounds);
  y += head.height + spacing * 0.85;

  const dek = layoutDek(ctx, { ...area, y, h: area.h }, "left");
  nodes.push(...dek.nodes);
  textBounds.push(...dek.bounds);
  y += dek.height + spacing * 1.1;

  const remaining = area.y + area.h - y;
  const imgH = imageHeightFor(area.w, 3 / 2, remaining * 0.5, ctx.imageScale);
  const img = placeImage(ctx, { x: area.x, y, w: area.w, h: imgH });
  nodes.push(...img.nodes);
  imageBounds.push(...img.bounds);
  y += img.box.h + spacing * 0.45;

  const cap = layoutCaption(ctx, { ...area, y, h: 80 });
  nodes.push(...cap.nodes);
  textBounds.push(...cap.bounds);
  y += cap.height + (cap.height ? spacing * 0.9 : spacing * 0.4);

  const bottom = bodyLimit(ctx);
  const body = assembleBody(ctx, columnRegions(grid, y, Math.max(0, bottom - y)));
  nodes.push(...body.nodes);
  textBounds.push(...body.textBounds);
  appendByline(ctx, nodes, textBounds);

  return {
    nodes,
    unplacedBodyLines: body.unplacedBodyLines,
    overflow: body.overflow || y > bottom,
    textBounds,
    imageBounds,
  };
}

function estimateByline(ctx: LayoutCtx, width: number) {
  const author = ctx.content.author.trim();
  const source = ctx.content.source.trim();
  if (!author && !source) return 0;
  const text = [author && `Por ${author}`, source].filter(Boolean).join("  ·  ");
  return blockHeight(text, ctx.type.meta, width);
}

function bodyLimit(ctx: LayoutCtx): number {
  const bylineH = estimateByline(ctx, ctx.area.w);
  return ctx.area.y + ctx.area.h - bylineH - (bylineH ? ctx.spacing * 0.85 : ctx.spacing * 0.2);
}

function appendByline(ctx: LayoutCtx, nodes: SceneNode[], textBounds: Box[]) {
  const bylineH = estimateByline(ctx, ctx.area.w);
  if (!bylineH) return;
  const y = ctx.area.y + ctx.area.h - bylineH;
  const by = layoutByline(ctx, { ...ctx.area, y, h: bylineH });
  nodes.push(...by.nodes);
  textBounds.push(...by.bounds);
}

function layoutFloat(ctx: LayoutCtx, side: "left" | "right"): LayoutBits {
  const { area, spacing, grid } = ctx;
  const nodes: SceneNode[] = [];
  const textBounds: Box[] = [];
  const imageBounds: Box[] = [];
  let y = area.y;

  const head = layoutHeadline(ctx, ctx.content.headline, { ...area, y, h: area.h }, "left");
  nodes.push(...head.nodes);
  textBounds.push(...head.bounds);
  y += head.height + spacing * 0.8;

  const dek = layoutDek(ctx, { ...area, y, h: area.h }, "left");
  nodes.push(...dek.nodes);
  textBounds.push(...dek.bounds);
  y += dek.height + spacing * 1.05;

  const floatW = grid.columnBoxes.length > 1
    ? spanColumns(grid, 0, Math.max(1, Math.ceil(grid.columns / 2)), y, 10).w
    : area.w * 0.46;
  const imgH = imageHeightFor(floatW, 4 / 5, (area.y + area.h - y) * 0.62, ctx.imageScale);
  const imgX = side === "left" ? area.x : area.x + area.w - floatW;
  const img = placeImage(ctx, { x: imgX, y, w: floatW, h: imgH });
  nodes.push(...img.nodes);
  imageBounds.push(...img.bounds);

  const cap = layoutCaption(ctx, {
    x: imgX,
    y: img.box.y + img.box.h + spacing * 0.35,
    w: floatW,
    h: 90,
  });
  nodes.push(...cap.nodes);
  textBounds.push(...cap.bounds);

  const floatBottom = img.box.y + img.box.h + (cap.height ? cap.height + spacing * 0.35 : 0);
  const sideX = side === "left" ? area.x + floatW + grid.gutter : area.x;
  const sideW = area.w - floatW - grid.gutter;
  const bottom = bodyLimit(ctx);

  const regions: Box[] = [
    { x: sideX, y, w: sideW, h: Math.max(0, Math.min(floatBottom, bottom) - y) },
  ];
  if (bottom - floatBottom > ctx.type.body.size * ctx.type.body.lineHeight * 2) {
    if (grid.columns >= 2) {
      regions.push(
        ...columnRegions(grid, floatBottom + spacing * 0.6, bottom - floatBottom - spacing * 0.6),
      );
    } else {
      regions.push({
        x: area.x,
        y: floatBottom + spacing * 0.6,
        w: area.w,
        h: bottom - floatBottom - spacing * 0.6,
      });
    }
  }
  const body = assembleBody(ctx, regions);
  nodes.push(...body.nodes);
  textBounds.push(...body.textBounds);
  appendByline(ctx, nodes, textBounds);

  return {
    nodes,
    unplacedBodyLines: body.unplacedBodyLines,
    overflow: body.overflow,
    textBounds,
    imageBounds,
  };
}

function layout04(ctx: LayoutCtx): LayoutBits {
  const { area, spacing, grid } = ctx;
  const nodes: SceneNode[] = [];
  const textBounds: Box[] = [];
  const imageBounds: Box[] = [];
  let y = area.y;

  const head = layoutHeadline(ctx, ctx.content.headline, { ...area, y, h: area.h }, "center");
  nodes.push(...head.nodes);
  textBounds.push(...head.bounds);
  y += head.height + spacing * 0.7;

  const dekW = area.w * 0.86;
  const dek = layoutDek(
    ctx,
    { x: area.x + (area.w - dekW) / 2, y, w: dekW, h: area.h },
    "center",
  );
  nodes.push(...dek.nodes);
  textBounds.push(...dek.bounds);
  y += dek.height + spacing * 1.05;

  const imgW = area.w * 0.78;
  const imgH = imageHeightFor(imgW, 3 / 2, (area.y + area.h - y) * 0.48, ctx.imageScale);
  const img = placeImage(ctx, {
    x: area.x + (area.w - imgW) / 2,
    y,
    w: imgW,
    h: imgH,
  });
  nodes.push(...img.nodes);
  imageBounds.push(...img.bounds);
  y += img.box.h + spacing * 0.4;

  const cap = layoutCaption(ctx, {
    x: area.x + (area.w - imgW) / 2,
    y,
    w: imgW,
    h: 80,
  });
  nodes.push(...cap.nodes);
  textBounds.push(...cap.bounds);
  y += cap.height + spacing * 0.95;

  const bottom = bodyLimit(ctx);
  const body = assembleBody(ctx, columnRegions(grid, y, Math.max(0, bottom - y)));
  nodes.push(...body.nodes);
  textBounds.push(...body.textBounds);
  appendByline(ctx, nodes, textBounds);
  return {
    nodes,
    unplacedBodyLines: body.unplacedBodyLines,
    overflow: body.overflow,
    textBounds,
    imageBounds,
  };
}

function layout05(ctx: LayoutCtx): LayoutBits {
  if (ctx.grid.columns < 2) return layout01(ctx);
  const { area, spacing, grid } = ctx;
  const nodes: SceneNode[] = [];
  const textBounds: Box[] = [];
  const imageBounds: Box[] = [];
  let y = area.y;

  const head = layoutHeadline(ctx, ctx.content.headline, { ...area, y, h: area.h }, "left");
  nodes.push(...head.nodes);
  textBounds.push(...head.bounds);
  y += head.height + spacing * 0.75;
  const dek = layoutDek(ctx, { ...area, y, h: area.h }, "left");
  nodes.push(...dek.nodes);
  textBounds.push(...dek.bounds);
  y += dek.height + spacing * 1.0;

  const cols = Math.max(2, grid.columns);
  const col1 = grid.columnBoxes[0]!;
  const restW = grid.columnBoxes[cols - 1]!.x + grid.columnBoxes[cols - 1]!.w - grid.columnBoxes[1]!.x;
  const imgH = imageHeightFor(col1.w, 4 / 5, (area.y + area.h - y) * 0.58, ctx.imageScale);
  const img = placeImage(ctx, { x: col1.x, y, w: col1.w, h: imgH });
  nodes.push(...img.nodes);
  imageBounds.push(...img.bounds);
  const cap = layoutCaption(ctx, {
    x: col1.x,
    y: img.box.y + img.box.h + spacing * 0.35,
    w: col1.w,
    h: 80,
  });
  nodes.push(...cap.nodes);
  textBounds.push(...cap.bounds);
  const imgBottom = img.box.y + img.box.h + (cap.height ? cap.height + spacing * 0.35 : 0);

  const bottom = bodyLimit(ctx);
  const regions: Box[] = [
    { x: grid.columnBoxes[1]!.x, y, w: restW, h: Math.max(0, bottom - y) },
    { x: col1.x, y: imgBottom + spacing * 0.5, w: col1.w, h: Math.max(0, bottom - imgBottom - spacing * 0.5) },
  ];
  const body = assembleBody(ctx, regions);
  nodes.push(...body.nodes);
  textBounds.push(...body.textBounds);
  appendByline(ctx, nodes, textBounds);
  return {
    nodes,
    unplacedBodyLines: body.unplacedBodyLines,
    overflow: body.overflow,
    textBounds,
    imageBounds,
  };
}

function layout06(ctx: LayoutCtx): LayoutBits {
  if (ctx.grid.columns < 2) return layout01(ctx);
  const { area, spacing, grid } = ctx;
  const nodes: SceneNode[] = [];
  const textBounds: Box[] = [];
  const imageBounds: Box[] = [];
  let y = area.y;
  const head = layoutHeadline(ctx, ctx.content.headline, { ...area, y, h: area.h }, "left");
  nodes.push(...head.nodes);
  textBounds.push(...head.bounds);
  y += head.height + spacing * 0.7;
  const dek = layoutDek(ctx, { ...area, y, h: area.h }, "left");
  nodes.push(...dek.nodes);
  textBounds.push(...dek.bounds);
  y += dek.height + spacing * 0.95;

  const span = Math.min(2, grid.columns);
  const imgBox = spanColumns(grid, 0, span, y, 10);
  const imgH = imageHeightFor(imgBox.w, 3 / 2, (area.y + area.h - y) * 0.4, ctx.imageScale);
  const img = placeImage(ctx, { ...imgBox, h: imgH });
  nodes.push(...img.nodes);
  imageBounds.push(...img.bounds);
  const cap = layoutCaption(ctx, {
    x: imgBox.x,
    y: img.box.y + img.box.h + spacing * 0.3,
    w: imgBox.w,
    h: 70,
  });
  nodes.push(...cap.nodes);
  textBounds.push(...cap.bounds);
  const imgBottom = img.box.y + img.box.h + (cap.height ? cap.height + spacing * 0.3 : 0);

  const bottom = bodyLimit(ctx);
  const regions: Box[] = [];
  if (grid.columns >= 3) {
    const col3 = grid.columnBoxes[2]!;
    regions.push({ x: col3.x, y, w: col3.w, h: Math.max(0, Math.min(imgBottom, bottom) - y) });
  }
  regions.push(...columnRegions(grid, imgBottom + spacing * 0.55, Math.max(0, bottom - imgBottom - spacing * 0.55)));
  const body = assembleBody(ctx, regions);
  nodes.push(...body.nodes);
  textBounds.push(...body.textBounds);
  appendByline(ctx, nodes, textBounds);
  return {
    nodes,
    unplacedBodyLines: body.unplacedBodyLines,
    overflow: body.overflow,
    textBounds,
    imageBounds,
  };
}

function layout07(ctx: LayoutCtx): LayoutBits {
  const { area, spacing, grid } = ctx;
  const nodes: SceneNode[] = [];
  const textBounds: Box[] = [];
  const imageBounds: Box[] = [];
  const imgH = imageHeightFor(area.w, 16 / 9, area.h * 0.58 * ctx.imageScale, 1);
  const img = placeImage(ctx, { x: area.x, y: area.y, w: area.w, h: imgH });
  nodes.push(...img.nodes);
  imageBounds.push(...img.bounds);
  let y = img.box.y + img.box.h + spacing * 0.45;
  const cap = layoutCaption(ctx, { ...area, y, h: 70 });
  nodes.push(...cap.nodes);
  textBounds.push(...cap.bounds);
  y += cap.height + spacing * 0.85;

  const head = layoutHeadline(ctx, ctx.content.headline, { ...area, y, h: area.h }, "left");
  nodes.push(...head.nodes);
  textBounds.push(...head.bounds);
  y += head.height + spacing * 0.65;
  const dek = layoutDek(ctx, { ...area, y, h: area.h }, "left");
  nodes.push(...dek.nodes);
  textBounds.push(...dek.bounds);
  y += dek.height + spacing * 0.85;

  const bottom = bodyLimit(ctx);
  const body = assembleBody(ctx, columnRegions(grid, y, Math.max(0, bottom - y)));
  nodes.push(...body.nodes);
  textBounds.push(...body.textBounds);
  appendByline(ctx, nodes, textBounds);
  return {
    nodes,
    unplacedBodyLines: body.unplacedBodyLines,
    overflow: body.overflow,
    textBounds,
    imageBounds,
  };
}

function layout08(ctx: LayoutCtx): LayoutBits {
  const { area, spacing, grid } = ctx;
  const nodes: SceneNode[] = [];
  const textBounds: Box[] = [];
  const imageBounds: Box[] = [];

  const leftW =
    grid.columns >= 3
      ? spanColumns(grid, 0, 1, area.y, 10).w
      : area.w * 0.38;
  const rightX = area.x + leftW + grid.gutter;
  const rightW = area.w - leftW - grid.gutter;
  const moduleH = clamp(area.h * 0.46 * ctx.imageScale, area.h * 0.32, area.h * 0.55);

  const img = placeImage(ctx, { x: area.x, y: area.y, w: leftW, h: moduleH });
  nodes.push(...img.nodes);
  imageBounds.push(...img.bounds);
  const cap = layoutCaption(ctx, {
    x: area.x,
    y: img.box.y + img.box.h + spacing * 0.3,
    w: leftW,
    h: 80,
  });
  nodes.push(...cap.nodes);
  textBounds.push(...cap.bounds);
  const leftBottom = img.box.y + img.box.h + (cap.height ? cap.height + spacing * 0.3 : 0);

  let y = area.y;
  const head = layoutHeadline(ctx, ctx.content.headline, { x: rightX, y, w: rightW, h: moduleH }, "left");
  nodes.push(...head.nodes);
  textBounds.push(...head.bounds);
  y += head.height + spacing * 0.7;
  const dek = layoutDek(ctx, { x: rightX, y, w: rightW, h: moduleH }, "left");
  nodes.push(...dek.nodes);
  textBounds.push(...dek.bounds);
  y += dek.height + spacing * 0.8;

  const bottom = bodyLimit(ctx);
  const lowerY = Math.max(leftBottom, y) + spacing * 0.5;
  const regions: Box[] = [];
  if (y + ctx.type.body.size * 2 < img.box.y + img.box.h) {
    regions.push({
      x: rightX,
      y,
      w: rightW,
      h: Math.max(0, Math.min(img.box.y + img.box.h, bottom) - y),
    });
  }
  if (grid.columns >= 3) {
    regions.push(...columnRegions(grid, lowerY, Math.max(0, bottom - lowerY)));
  } else {
    regions.push({ x: area.x, y: lowerY, w: area.w, h: Math.max(0, bottom - lowerY) });
  }
  const body = assembleBody(ctx, regions);
  nodes.push(...body.nodes);
  textBounds.push(...body.textBounds);
  appendByline(ctx, nodes, textBounds);
  return {
    nodes,
    unplacedBodyLines: body.unplacedBodyLines,
    overflow: body.overflow,
    textBounds,
    imageBounds,
  };
}

const LAYOUT_FNS: Record<LayoutId, (ctx: LayoutCtx) => LayoutBits> = {
  l01: layout01,
  l02: (ctx) => layoutFloat(ctx, "left"),
  l03: (ctx) => layoutFloat(ctx, "right"),
  l04: layout04,
  l05: layout05,
  l06: layout06,
  l07: layout07,
  l08: layout08,
};

function guideNodes(grid: Grid, id: (p: string) => string): SceneNode[] {
  const nodes: SceneNode[] = [];
  const color = "rgba(10, 92, 130, 0.22)";
  nodes.push({
    type: "guide",
    id: id("guide-content"),
    x: grid.content.x,
    y: grid.content.y,
    w: grid.content.w,
    h: grid.content.h,
    color,
    role: "guide",
  });
  for (const col of grid.columnBoxes) {
    nodes.push({
      type: "guide",
      id: id("guide-col"),
      x: col.x,
      y: col.y,
      w: col.w,
      h: col.h,
      color: "rgba(10, 92, 130, 0.12)",
      role: "guide",
    });
  }
  return nodes;
}

interface OnceResult {
  scene: Omit<Scene, "validation">;
  unplacedBodyLines: number;
  overflow: boolean;
}

function composeOnce(
  params: ComposeParams,
  scales: { typeScale: number; imageScale: number; spacingScale: number; columns: number },
): OnceResult {
  const id = makeId();
  const palette = resolvePalette(params.design.paletteId);
  const type = resolveTypography(params.pageWidth, params.typography, scales.typeScale);
  const spacing = gapUnit(params.pageWidth, scales.spacingScale);

  const probe = buildGrid({
    pageWidth: params.pageWidth,
    pageHeight: params.pageHeight,
    design: params.design,
    headerHeight: params.pageHeight * 0.18,
    columns: scales.columns,
  });

  const header = composeFixedHeader({
    pageWidth: params.pageWidth,
    marginTop: probe.marginTop,
    marginLeft: probe.marginLeft,
    marginRight: probe.marginRight,
    content: params.content,
    type,
    palette,
    spacing,
    id,
  });

  const grid = buildGrid({
    pageWidth: params.pageWidth,
    pageHeight: params.pageHeight,
    design: params.design,
    headerHeight: header.height,
    columns: scales.columns,
  });

  const layoutFn = LAYOUT_FNS[params.design.layoutId];
  const ctx: LayoutCtx = {
    id,
    grid,
    area: grid.content,
    content: params.content,
    type,
    palette,
    image: params.image,
    layoutId: params.design.layoutId,
    spacing,
    imageScale: scales.imageScale,
    hairline: Math.max(0.6, params.pageWidth * 0.00105),
  };
  const bits = layoutFn(ctx);

  const nodes: SceneNode[] = [
    {
      type: "rect",
      id: id("page"),
      x: 0,
      y: 0,
      w: params.pageWidth,
      h: params.pageHeight,
      fill: palette.page,
      role: "page",
    },
    ...header.nodes,
    ...bits.nodes,
  ];
  if (params.design.showGuides) nodes.push(...guideNodes(grid, id));

  const overflow =
    bits.overflow ||
    bits.textBounds.some(
      (b) => b.y + b.h > params.pageHeight - grid.marginBottom + 1 || b.x + b.w > params.pageWidth - grid.marginRight + 1.5,
    );

  const meta: SceneMeta = {
    header: {
      x: grid.marginLeft,
      y: grid.marginTop,
      w: grid.content.w,
      h: header.height - grid.marginTop,
    },
    content: grid.content,
    columns: grid.columnBoxes,
    gutter: grid.gutter,
    margins: {
      top: grid.marginTop,
      right: grid.marginRight,
      bottom: grid.marginBottom,
      left: grid.marginLeft,
    },
    fontsUsed: [type.displayFamily, type.bodyFamily],
    mastheadColor: BRAND_OCEAN,
    textBounds: bits.textBounds,
    imageBounds: bits.imageBounds,
    unplacedBodyLines: bits.unplacedBodyLines,
    overflow,
    autofit: scales,
  };

  return {
    scene: {
      width: params.pageWidth,
      height: params.pageHeight,
      background: palette.page,
      nodes,
      meta,
    },
    unplacedBodyLines: bits.unplacedBodyLines,
    overflow,
  };
}

export function composeNewspaper(params: ComposeParams): Scene {
  const layout = layoutById(params.design.layoutId);
  let columns = params.design.autoColumns ? layout.defaultColumns : params.design.columns;
  columns = clamp(columns, 1, 4);
  let typeScale = 1;
  let imageScale = 1;
  let spacingScale = 1;

  let result = composeOnce(params, { typeScale, imageScale, spacingScale, columns });
  const minBody = minReadableBody(params.pageWidth);

  for (let i = 0; i < 10; i++) {
    if (!result.overflow && result.unplacedBodyLines === 0) break;
    const bodySize =
      params.pageWidth * typeScale * 0.0152 * params.typography.bodyScale;
    if (spacingScale > 0.78) {
      spacingScale *= 0.9;
    } else if (imageScale > 0.72) {
      imageScale *= 0.9;
    } else if (typeScale > 0.85 && bodySize * 0.94 >= minBody) {
      typeScale *= 0.94;
    } else if (columns < 3 && result.unplacedBodyLines > 0) {
      columns += 1;
    } else {
      break;
    }
    result = composeOnce(params, { typeScale, imageScale, spacingScale, columns });
  }

  const validation = validateScene(result.scene, params.fontsReady);
  return { ...result.scene, validation };
}
