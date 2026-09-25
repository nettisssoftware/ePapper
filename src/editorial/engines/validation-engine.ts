import { BRAND_OCEAN } from "../brand";
import { fontsLoaded } from "../fonts";
import type { Scene, SceneNode, ValidationIssue, ValidationReport } from "../schema";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(a: string, b: string): number | null {
  const L1 = luminance(a);
  const L2 = luminance(b);
  if (L1 === null || L2 === null) return null;
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

function nodeBox(node: SceneNode): { x: number; y: number; w: number; h: number } | null {
  if (node.type === "rect" || node.type === "image" || node.type === "guide") {
    return { x: node.x, y: node.y, w: node.w, h: node.h };
  }
  if (node.type === "text") {
    const w = node.fontSize * Math.max(1, node.text.length) * 0.52;
    const x =
      node.align === "right" ? node.x - w : node.align === "center" ? node.x - w / 2 : node.x;
    return { x, y: node.y - node.fontSize, w, h: node.fontSize * 1.2 };
  }
  if (node.type === "textline") {
    if (!node.words.length) return null;
    const minX = Math.min(...node.words.map((w) => w.x));
    const last = node.words[node.words.length - 1]!;
    return {
      x: minX,
      y: node.y - node.fontSize,
      w: last.x + last.text.length * node.fontSize * 0.5 - minX,
      h: node.fontSize * 1.2,
    };
  }
  return null;
}

export function validateScene(
  scene: Omit<Scene, "validation">,
  fontsReady: boolean,
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const add = (issue: ValidationIssue) => issues.push(issue);

  const masthead = scene.nodes.find((n) => n.role === "masthead" && n.type === "text");
  if (!masthead || masthead.type !== "text") {
    add({
      id: "header-masthead",
      level: "error",
      label: "Cabecera",
      detail: "Falta el nombre del medio.",
    });
  } else if (masthead.fill.toUpperCase() !== BRAND_OCEAN.toUpperCase()) {
    add({
      id: "header-color",
      level: "error",
      label: "Identidad de marca",
      detail: "El azul océano del nombre del medio ha sido alterado.",
    });
  } else {
    add({ id: "header-masthead", level: "ok", label: "Cabecera intacta" });
  }

  const rules = scene.nodes.filter((n) => n.role === "header-rule");
  const edition = scene.nodes.filter((n) => n.role === "edition");
  const emission = scene.nodes.filter((n) => n.role === "emission");
  if (rules.length < 2 || edition.length < 1 || emission.length < 1) {
    add({
      id: "header-structure",
      level: "error",
      label: "Estructura de cabecera",
      detail: "Fecha, hora o filetes de cabecera incompletos.",
    });
  } else {
    add({ id: "header-structure", level: "ok", label: "Estructura fija" });
  }

  const { margins } = scene.meta;
  const eps = Math.max(1.2, scene.width * 0.002);
  const boundsOut = [...scene.meta.textBounds, ...scene.meta.imageBounds].some((b) => {
    return (
      b.x < -eps ||
      b.y < -eps ||
      b.x + b.w > scene.width + eps ||
      b.y + b.h > scene.height + eps
    );
  });
  if (boundsOut || scene.meta.overflow) {
    add({
      id: "overflow",
      level: "error",
      label: "Área de página",
      detail: "Hay texto o elementos fuera de la página.",
    });
  } else {
    add({ id: "overflow", level: "ok", label: "Nada queda fuera del área" });
  }

  const headlines = scene.nodes.filter((n) => n.role === "headline");
  if (!headlines.length) {
    add({ id: "headline-clip", level: "warn", label: "Titular", detail: "No hay titular." });
  } else {
    add({ id: "headline-clip", level: "ok", label: "Titular completo" });
  }

  const images = scene.nodes.filter((n) => n.type === "image");
  const distorted = images.some((n) => {
    if (n.type !== "image") return false;
    const srcAspect = n.crop.sw / Math.max(0.001, n.crop.sh);
    const destAspect = n.w / Math.max(0.001, n.h);
    return Math.abs(srcAspect - destAspect) / destAspect > 0.03;
  });
  if (distorted) {
    add({
      id: "image-aspect",
      level: "error",
      label: "Imagen",
      detail: "La fotografía está deformada.",
    });
  } else {
    add({ id: "image-aspect", level: "ok", label: "Imagen sin deformar" });
  }

  const contentNodes = scene.nodes.filter(
    (n) => n.type !== "rect" && n.type !== "guide" && n.role !== "page",
  );
  const marginHit = contentNodes.some((n) => {
    if (n.role === "header-rule" || n.role === "masthead") return false;
    const b = nodeBox(n);
    if (!b) return false;
    return b.x < margins.left - eps * 2 || b.x + b.w > scene.width - margins.right + eps * 2;
  });
  if (marginHit) {
    add({
      id: "margins",
      level: "warn",
      label: "Márgenes",
      detail: "Algún elemento invade el margen lateral.",
    });
  } else {
    add({ id: "margins", level: "ok", label: "Márgenes correctos" });
  }

  const bodyNode = scene.nodes.find(
    (n) => n.role === "body" && (n.type === "text" || n.type === "textline"),
  );
  const bodyFill =
    bodyNode && (bodyNode.type === "text" || bodyNode.type === "textline")
      ? bodyNode.fill
      : "#111111";
  const contrast = contrastRatio(bodyFill, scene.background);
  if (contrast !== null && contrast < 4.4) {
    add({
      id: "contrast",
      level: "error",
      label: "Contraste",
      detail: `Contraste insuficiente (${contrast.toFixed(1)}:1).`,
    });
  } else {
    add({ id: "contrast", level: "ok", label: "Contraste suficiente" });
  }

  const expectedFonts = scene.meta.fontsUsed;
  const loaded =
    fontsReady && (typeof document === "undefined" || fontsLoaded(expectedFonts));
  if (!loaded) {
    add({
      id: "fonts",
      level: "error",
      label: "Tipografía",
      detail: "Las fuentes seleccionadas aún no están cargadas.",
    });
  } else {
    add({ id: "fonts", level: "ok", label: "Tipografía cargada" });
  }

  if (scene.meta.unplacedBodyLines > 0) {
    add({
      id: "fit",
      level: "error",
      label: "Contenido",
      detail: `El desarrollo no cabe (${scene.meta.unplacedBodyLines} líneas fuera). Reduce el texto, la imagen o cambia de formato.`,
    });
  } else {
    add({ id: "fit", level: "ok", label: "El contenido cabe en la página" });
  }

  const cols = scene.meta.columns;
  if (cols.length >= 2) {
    const widths = cols.map((c) => c.w);
    const gutters = cols.slice(1).map((c, i) => c.x - (cols[i]!.x + cols[i]!.w));
    const widthOk = widths.every((w) => Math.abs(w - widths[0]!) < 0.6);
    const gutterOk = gutters.every((g) => Math.abs(g - scene.meta.gutter) < 0.6);
    const aligned = cols.every((c) => Math.abs(c.y - cols[0]!.y) < 0.6);
    if (!widthOk || !gutterOk || !aligned) {
      add({
        id: "grid",
        level: "error",
        label: "Retícula",
        detail: "Columnas o gutters desalineados.",
      });
    } else {
      add({ id: "grid", level: "ok", label: "Columnas y gutters uniformes" });
    }
  } else {
    add({ id: "grid", level: "ok", label: "Retícula alineada" });
  }

  const blocking = issues.some((i) => i.level === "error");
  return {
    ok: !issues.some((i) => i.level !== "ok"),
    blocking,
    issues,
  };
}
