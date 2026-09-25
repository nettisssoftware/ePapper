import type { Box, FontSpec } from "./schema";

let measureCtx: CanvasRenderingContext2D | null = null;

function ctx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!measureCtx) {
    const canvas = document.createElement("canvas");
    measureCtx = canvas.getContext("2d");
  }
  return measureCtx;
}

export function applyFont(context: CanvasRenderingContext2D, font: FontSpec) {
  const style = font.style ?? "normal";
  context.font = `${style} ${font.weight} ${font.size}px "${font.family}"`;
  try {
    context.letterSpacing = `${font.letterSpacing}px`;
  } catch {
    /* ignore */
  }
}

export function measureWidth(text: string, font: FontSpec): number {
  const c = ctx();
  if (!c) {
    return text.length * font.size * 0.52 + font.letterSpacing * Math.max(0, text.length - 1);
  }
  applyFont(c, font);
  if (!font.letterSpacing) return c.measureText(text).width;
  let width = 0;
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    width += c.measureText(chars[i]!).width;
    if (i < chars.length - 1) width += font.letterSpacing;
  }
  return width;
}

export function measureMetrics(text: string, font: FontSpec) {
  const c = ctx();
  if (!c) {
    return {
      width: measureWidth(text, font),
      ascent: font.size * 0.8,
      descent: font.size * 0.22,
    };
  }
  applyFont(c, font);
  const m = c.measureText(text || "Hg");
  return {
    width: measureWidth(text, font),
    ascent: m.actualBoundingBoxAscent || font.size * 0.8,
    descent: m.actualBoundingBoxDescent || font.size * 0.22,
  };
}

export interface WrappedLine {
  text: string;
  words: string[];
  width: number;
  lastInParagraph: boolean;
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function wrapParagraph(paragraph: string, font: FontSpec, maxWidth: number): WrappedLine[] {
  const words = splitWords(paragraph);
  if (words.length === 0) return [];
  const width = Math.max(8, maxWidth);
  const lines: WrappedLine[] = [];
  let current: string[] = [];

  const flush = (last: boolean) => {
    const text = current.join(" ");
    lines.push({
      text,
      words: [...current],
      width: measureWidth(text, font),
      lastInParagraph: last,
    });
    current = [];
  };

  for (const word of words) {
    const trial = current.length ? `${current.join(" ")} ${word}` : word;
    if (current.length && measureWidth(trial, font) > width) flush(false);
    if (!current.length && measureWidth(word, font) > width) {
      let chunk = "";
      for (const ch of word) {
        const next = chunk + ch;
        if (chunk && measureWidth(next, font) > width) {
          current = [chunk];
          flush(false);
          chunk = ch;
        } else {
          chunk = next;
        }
      }
      if (chunk) current = [chunk];
      continue;
    }
    current.push(word);
  }
  if (current.length) flush(true);
  return lines;
}

export function wrapText(text: string, font: FontSpec, maxWidth: number): WrappedLine[] {
  const paragraphs = text.replace(/\r/g, "").split(/\n+/);
  const lines: WrappedLine[] = [];
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    lines.push(...wrapParagraph(trimmed, font, maxWidth));
  }
  return lines;
}

export interface PositionedWord {
  x: number;
  text: string;
}

export interface PositionedLine {
  y: number;
  x: number;
  width: number;
  height: number;
  words: PositionedWord[];
  text: string;
  bounds: Box;
}

export function justifyLine(
  line: WrappedLine,
  font: FontSpec,
  x: number,
  width: number,
  justify: boolean,
): PositionedWord[] {
  if (!line.words.length) return [];
  if (!justify || line.lastInParagraph || line.words.length === 1) {
    let cx = x;
    const words: PositionedWord[] = [];
    for (let i = 0; i < line.words.length; i++) {
      const w = line.words[i]!;
      words.push({ x: cx, text: w });
      cx += measureWidth(w, font);
      if (i < line.words.length - 1) cx += measureWidth(" ", font);
    }
    return words;
  }
  const wordWidths = line.words.map((w) => measureWidth(w, font));
  const wordsWidth = wordWidths.reduce((a, b) => a + b, 0);
  const gaps = line.words.length - 1;
  const extra = width - wordsWidth;
  const gap = extra / gaps;
  if (gap > font.size * 0.5 || gap < font.size * 0.08) {
    return justifyLine(line, font, x, width, false);
  }
  const words: PositionedWord[] = [];
  let cx = x;
  for (let i = 0; i < line.words.length; i++) {
    words.push({ x: cx, text: line.words[i]! });
    cx += wordWidths[i]! + gap;
  }
  return words;
}

export function flowText(
  text: string,
  font: FontSpec,
  regions: Box[],
  options?: { justify?: boolean; align?: "left" | "center" },
): { lines: PositionedLine[]; remaining: string; unplacedLines: number } {
  const justify = options?.justify ?? true;
  const align = options?.align ?? "left";
  const lineHeight = font.size * font.lineHeight;
  const paragraphs = text
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((p) => splitWords(p.trim()))
    .filter((w) => w.length > 0);

  const lines: PositionedLine[] = [];
  let pIndex = 0;
  let wordIndex = 0;

  const remainingText = () => {
    const chunks: string[] = [];
    for (let i = pIndex; i < paragraphs.length; i++) {
      const start = i === pIndex ? wordIndex : 0;
      const slice = paragraphs[i]!.slice(start);
      if (slice.length) chunks.push(slice.join(" "));
    }
    return chunks.join("\n\n");
  };

  const placeLine = (line: WrappedLine, region: Box, y: number) => {
    const metrics = measureMetrics(line.text || "Hg", font);
    const baseline = y + metrics.ascent;
    const positioned = justifyLine(line, font, region.x, region.w, justify && align === "left");
    let x = region.x;
    if (align === "center") {
      const shift = Math.max(0, (region.w - line.width) / 2);
      x += shift;
      for (const word of positioned) word.x += shift;
    }
    lines.push({
      y: baseline,
      x,
      width: line.width,
      height: lineHeight,
      words: positioned,
      text: line.text,
      bounds: { x: region.x, y, w: region.w, h: lineHeight },
    });
  };

  for (const region of regions) {
    if (pIndex >= paragraphs.length) break;
    if (region.h < lineHeight * 0.85 || region.w < 8) continue;
    let y = region.y;

    while (pIndex < paragraphs.length) {
      if (y + lineHeight > region.y + region.h + 0.6) break;
      const remainingWords = paragraphs[pIndex]!.slice(wordIndex);
      if (!remainingWords.length) {
        pIndex++;
        wordIndex = 0;
        continue;
      }
      const wrapped = wrapParagraph(remainingWords.join(" "), font, region.w);
      let placed = 0;
      for (const line of wrapped) {
        if (y + lineHeight > region.y + region.h + 0.6) break;
        placeLine(line, region, y);
        y += lineHeight;
        wordIndex += line.words.length;
        placed++;
      }
      if (wordIndex >= paragraphs[pIndex]!.length) {
        pIndex++;
        wordIndex = 0;
      }
      if (placed === 0) break;
    }
  }

  const remaining = remainingText();
  const lastW = regions[regions.length - 1]?.w ?? 240;
  const unplacedLines = remaining ? wrapText(remaining, font, lastW).length : 0;
  return { lines, remaining, unplacedLines };
}

export function blockHeight(text: string, font: FontSpec, width: number): number {
  if (!text.trim()) return 0;
  return wrapText(text, font, width).length * font.size * font.lineHeight;
}

export function fitSingleLineSize(
  text: string,
  family: string,
  weight: number,
  min: number,
  max: number,
  targetWidth: number,
  trackingEm: number,
): number {
  let lo = min;
  let hi = max;
  let best = min;
  for (let i = 0; i < 20; i++) {
    const size = (lo + hi) / 2;
    const width = measureWidth(text, {
      family,
      weight,
      size,
      letterSpacing: size * trackingEm,
      lineHeight: 1,
    });
    if (width <= targetWidth) {
      best = size;
      lo = size;
    } else {
      hi = size;
    }
  }
  return best;
}

export function editorialUppercase(text: string): string {
  return text.toLocaleUpperCase("es-ES");
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function inset(
  box: Box,
  t: number,
  r = t,
  b = t,
  l = r,
): Box {
  return {
    x: box.x + l,
    y: box.y + t,
    w: Math.max(0, box.w - l - r),
    h: Math.max(0, box.h - t - b),
  };
}
