import { applyFont } from "../measure";
import type { FontSpec, Scene, SceneNode } from "../schema";

export function fontCss(node: {
  fontStyle?: string;
  fontWeight: number;
  fontSize: number;
  fontFamily: string;
}): string {
  return `${node.fontStyle ?? "normal"} ${node.fontWeight} ${node.fontSize}px "${node.fontFamily}"`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function nodeToSvg(node: SceneNode, index: number): string {
  switch (node.type) {
    case "rect":
      return `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" fill="${escapeXml(node.fill)}" />`;
    case "line":
      return `<line x1="${node.x1}" y1="${node.y1}" x2="${node.x2}" y2="${node.y2}" stroke="${escapeXml(node.stroke)}" stroke-width="${node.strokeWidth}" stroke-linecap="butt" />`;
    case "text": {
      const anchor =
        node.align === "center" ? "middle" : node.align === "right" ? "end" : "start";
      return `<text x="${node.x}" y="${node.y}" fill="${escapeXml(node.fill)}" font-family="${escapeXml(node.fontFamily)}" font-weight="${node.fontWeight}" font-size="${node.fontSize}" font-style="${node.fontStyle ?? "normal"}" letter-spacing="${node.letterSpacing}" text-anchor="${anchor}">${escapeXml(node.text)}</text>`;
    }
    case "textline": {
      const spans = node.words
        .map(
          (w) =>
            `<tspan x="${w.x}" y="${node.y}">${escapeXml(w.text)}</tspan>`,
        )
        .join("");
      return `<text fill="${escapeXml(node.fill)}" font-family="${escapeXml(node.fontFamily)}" font-weight="${node.fontWeight}" font-size="${node.fontSize}" font-style="${node.fontStyle ?? "normal"}" letter-spacing="${node.letterSpacing}">${spans}</text>`;
    }
    case "image": {
      const clip = `clip-${index}`;
      return `<defs><clipPath id="${clip}"><rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" /></clipPath></defs><svg x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" viewBox="${node.crop.sx} ${node.crop.sy} ${node.crop.sw} ${node.crop.sh}" preserveAspectRatio="none" clip-path="url(#${clip})"><image href="${escapeXml(node.src)}" width="${node.naturalWidth}" height="${node.naturalHeight}" preserveAspectRatio="none" /></svg>`;
    }
    case "guide":
      return `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" fill="none" stroke="${escapeXml(node.color)}" stroke-width="0.75" stroke-dasharray="4 3" />`;
    default:
      return "";
  }
}

export function sceneToSvg(scene: Scene, options?: { includeGuides?: boolean }): string {
  const nodes = options?.includeGuides
    ? scene.nodes
    : scene.nodes.filter((n) => n.type !== "guide");
  const parts = nodes.map((n, i) => nodeToSvg(n, i)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}">${parts}</svg>`;
}

function specFromNode(node: Extract<SceneNode, { type: "text" | "textline" }>): FontSpec {
  return {
    family: node.fontFamily,
    weight: node.fontWeight,
    size: node.fontSize,
    letterSpacing: node.letterSpacing,
    lineHeight: 1,
    style: node.fontStyle,
  };
}

function fillTextSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
) {
  if (!letterSpacing) {
    ctx.fillText(text, x, y);
    return;
  }
  let cx = x;
  const dir = ctx.textAlign === "right" ? -1 : 1;
  if (ctx.textAlign === "right") {
    const chars = [...text];
    for (let i = chars.length - 1; i >= 0; i--) {
      const ch = chars[i]!;
      const w = ctx.measureText(ch).width;
      cx -= w;
      ctx.fillText(ch, cx, y);
      if (i > 0) cx -= letterSpacing;
    }
    return;
  }
  if (ctx.textAlign === "center") {
    const chars = [...text];
    let total = 0;
    for (let i = 0; i < chars.length; i++) {
      total += ctx.measureText(chars[i]!).width;
      if (i < chars.length - 1) total += letterSpacing;
    }
    cx = x - total / 2;
    const prev = ctx.textAlign;
    ctx.textAlign = "left";
    for (const ch of chars) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + letterSpacing;
    }
    ctx.textAlign = prev;
    return;
  }
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + letterSpacing * dir;
  }
}

export async function rasterizeScene(
  scene: Scene,
  images: Map<string, HTMLImageElement>,
  scale = 1,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(scene.width * scale));
  canvas.height = Math.max(1, Math.round(scene.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el contexto de dibujo.");
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.width, scene.height);

  for (const node of scene.nodes) {
    if (node.type === "guide") continue;
    drawNode(ctx, node, images);
  }
  return canvas;
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: SceneNode,
  images: Map<string, HTMLImageElement>,
) {
  switch (node.type) {
    case "rect":
      ctx.fillStyle = node.fill;
      ctx.fillRect(node.x, node.y, node.w, node.h);
      break;
    case "line":
      ctx.strokeStyle = node.stroke;
      ctx.lineWidth = node.strokeWidth;
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.moveTo(node.x1, node.y1);
      ctx.lineTo(node.x2, node.y2);
      ctx.stroke();
      break;
    case "text": {
      applyFont(ctx, specFromNode(node));
      ctx.fillStyle = node.fill;
      ctx.textAlign = node.align;
      ctx.textBaseline = "alphabetic";
      fillTextSpaced(ctx, node.text, node.x, node.y, node.letterSpacing);
      break;
    }
    case "textline": {
      applyFont(ctx, specFromNode(node));
      ctx.fillStyle = node.fill;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      for (const word of node.words) {
        fillTextSpaced(ctx, word.text, word.x, node.y, node.letterSpacing);
      }
      break;
    }
    case "image": {
      const img = images.get(node.src);
      if (!img) break;
      ctx.save();
      ctx.beginPath();
      ctx.rect(node.x, node.y, node.w, node.h);
      ctx.clip();
      ctx.drawImage(
        img,
        node.crop.sx,
        node.crop.sy,
        node.crop.sw,
        node.crop.sh,
        node.x,
        node.y,
        node.w,
        node.h,
      );
      ctx.restore();
      break;
    }
    default:
      break;
  }
}
