import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BRAND_OCEAN } from "../brand";
import {
  editorialUppercase,
  fitSingleLineSize,
  measureMetrics,
  measureWidth,
} from "../measure";
import type {
  ContentModel,
  ResolvedPalette,
  ResolvedType,
  SceneNode,
} from "../schema";

export function formatEditionDate(iso: string): string {
  try {
    const d = parseISO(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return iso;
  }
}

export interface HeaderInput {
  pageWidth: number;
  marginTop: number;
  marginLeft: number;
  marginRight: number;
  content: ContentModel;
  type: ResolvedType;
  palette: ResolvedPalette;
  spacing: number;
  id: (prefix: string) => string;
}

export interface HeaderResult {
  nodes: SceneNode[];
  height: number;
  mastheadColor: string;
}

/**
 * Immutable editorial header. Layouts never move, recolor, or scale these parts.
 * Masthead fill is always BRAND_OCEAN.
 */
export function composeFixedHeader(input: HeaderInput): HeaderResult {
  const { pageWidth, marginTop, marginLeft, marginRight, content, type, palette, spacing, id } =
    input;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const nodes: SceneNode[] = [];
  const ink = palette.ink;
  const rule = palette.rule;
  const hairline = Math.max(0.6, pageWidth * 0.00105);

  const editionLabel = editorialUppercase(content.editionLabel || "EDICIÓN");
  const emissionLabel = editorialUppercase(content.emissionLabel || "EMISIÓN");
  const dateText = formatEditionDate(content.date);
  const timeText = content.time.trim();

  const meta = type.edition;
  const metaMetrics = measureMetrics("EDICIÓN", meta);
  let y = marginTop;
  const metaBaseline = y + metaMetrics.ascent;

  const leftLabelW = measureWidth(editionLabel, meta);
  const labelGap = meta.size * 0.7;
  nodes.push({
    type: "text",
    id: id("edition-label"),
    x: marginLeft,
    y: metaBaseline,
    text: editionLabel,
    fontFamily: meta.family,
    fontWeight: meta.weight,
    fontSize: meta.size,
    letterSpacing: meta.letterSpacing,
    fill: ink,
    align: "left",
    role: "edition",
  });
  nodes.push({
    type: "text",
    id: id("edition-date"),
    x: marginLeft + leftLabelW + labelGap,
    y: metaBaseline,
    text: dateText,
    fontFamily: type.body.family,
    fontWeight: 400,
    fontSize: meta.size,
    letterSpacing: 0,
    fill: ink,
    align: "left",
    role: "edition",
  });

  const rightLabelW = measureWidth(emissionLabel, meta);
  const timeW = measureWidth(timeText, { ...type.body, size: meta.size, letterSpacing: 0, weight: 400 });
  const rightEdge = pageWidth - marginRight;
  nodes.push({
    type: "text",
    id: id("emission-time"),
    x: rightEdge,
    y: metaBaseline,
    text: timeText,
    fontFamily: type.body.family,
    fontWeight: 400,
    fontSize: meta.size,
    letterSpacing: 0,
    fill: ink,
    align: "right",
    role: "emission",
  });
  nodes.push({
    type: "text",
    id: id("emission-label"),
    x: rightEdge - timeW - labelGap,
    y: metaBaseline,
    text: emissionLabel,
    fontFamily: meta.family,
    fontWeight: meta.weight,
    fontSize: meta.size,
    letterSpacing: meta.letterSpacing,
    fill: ink,
    align: "right",
    role: "emission",
  });

  y += metaMetrics.ascent + metaMetrics.descent + spacing * 0.7;

  nodes.push({
    type: "line",
    id: id("header-rule-1"),
    x1: marginLeft,
    y1: y,
    x2: rightEdge,
    y2: y,
    stroke: rule,
    strokeWidth: hairline,
    role: "header-rule",
  });

  y += spacing * 1.15;

  const mastheadRaw = content.masthead.trim() || "EL CRONISTA";
  const mastheadText = editorialUppercase(mastheadRaw);
  const trackingEm = mastheadText.length > 18 ? 0.028 : mastheadText.length > 10 ? 0.046 : 0.07;
  const maxMasthead = Math.min(pageWidth * 0.13, contentWidth * 0.22);
  const minMasthead = pageWidth * 0.048;
  const target = contentWidth * 0.94;
  const fitted = fitSingleLineSize(
    mastheadText,
    type.masthead.family,
    type.masthead.weight,
    minMasthead,
    maxMasthead,
    target,
    trackingEm,
  );
  const mastFont = {
    ...type.masthead,
    size: fitted,
    letterSpacing: fitted * trackingEm,
  };
  const mastMetrics = measureMetrics(mastheadText, mastFont);
  const mastWidth = measureWidth(mastheadText, mastFont);
  const mastX = marginLeft + (contentWidth - mastWidth) / 2;
  const mastBaseline = y + mastMetrics.ascent;

  nodes.push({
    type: "text",
    id: id("masthead"),
    x: mastX,
    y: mastBaseline,
    text: mastheadText,
    fontFamily: mastFont.family,
    fontWeight: mastFont.weight,
    fontSize: mastFont.size,
    letterSpacing: mastFont.letterSpacing,
    fill: BRAND_OCEAN,
    align: "left",
    role: "masthead",
  });

  y += mastMetrics.ascent + mastMetrics.descent + spacing * 0.85;

  nodes.push({
    type: "line",
    id: id("header-rule-2"),
    x1: marginLeft,
    y1: y,
    x2: rightEdge,
    y2: y,
    stroke: rule,
    strokeWidth: hairline * 1.35,
    role: "header-rule",
  });

  y += spacing * 1.25;

  return {
    nodes,
    height: y,
    mastheadColor: BRAND_OCEAN,
  };
}
