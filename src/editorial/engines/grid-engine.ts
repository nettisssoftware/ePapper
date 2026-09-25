import type { Box, DesignModel, Grid } from "../schema";
import { clamp } from "../measure";

export interface GridInput {
  pageWidth: number;
  pageHeight: number;
  design: DesignModel;
  headerHeight: number;
  columns: number;
}

export function buildGrid(input: GridInput): Grid {
  const { pageWidth, pageHeight, design, headerHeight, columns } = input;
  const base = Math.min(pageWidth, pageHeight);
  const side = clamp(base * 0.058 * design.marginScale, base * 0.03, base * 0.12);
  const top = clamp(base * 0.042 * design.marginScale, base * 0.024, base * 0.09);
  const bottom = clamp(base * 0.055 * design.marginScale, base * 0.03, base * 0.11);
  const gutter = clamp(pageWidth * 0.018 * design.gutterScale, 6, pageWidth * 0.04);
  const colCount = clamp(Math.round(columns), 1, 4);

  const contentWidth = pageWidth - side * 2;
  const columnWidth = (contentWidth - gutter * (colCount - 1)) / colCount;
  const contentY = headerHeight;
  const contentH = pageHeight - bottom - contentY;

  const content: Box = {
    x: side,
    y: contentY,
    w: contentWidth,
    h: Math.max(0, contentH),
  };

  const columnBoxes: Box[] = [];
  for (let i = 0; i < colCount; i++) {
    columnBoxes.push({
      x: side + i * (columnWidth + gutter),
      y: content.y,
      w: columnWidth,
      h: content.h,
    });
  }

  return {
    pageWidth,
    pageHeight,
    marginTop: top,
    marginRight: side,
    marginBottom: bottom,
    marginLeft: side,
    columns: colCount,
    gutter,
    columnWidth,
    content,
    header: { x: side, y: top, w: contentWidth, h: Math.max(0, headerHeight - top) },
    columnBoxes,
  };
}

export function spanColumns(grid: Grid, start: number, count: number, y: number, h: number): Box {
  const first = grid.columnBoxes[start] ?? grid.columnBoxes[0]!;
  const lastIndex = Math.min(grid.columns - 1, start + count - 1);
  const last = grid.columnBoxes[lastIndex]!;
  return {
    x: first.x,
    y,
    w: last.x + last.w - first.x,
    h,
  };
}

export function withY(box: Box, y: number, h?: number): Box {
  return { ...box, y, h: h ?? box.h };
}
