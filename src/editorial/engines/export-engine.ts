import { PDFDocument } from "pdf-lib";
import type { ExportModel, Scene } from "../schema";
import { rasterizeScene } from "./render-engine";

function waitTick() {
  return new Promise<void>((resolve) => setTimeout(resolve, 16));
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: "png" | "jpg" | "webp",
  quality: number,
): Promise<Blob> {
  const mime =
    format === "jpg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), mime, quality),
  );
  if (!blob) throw new Error("No se pudo rasterizar la portada.");
  return blob;
}

export async function exportRaster(
  scene: Scene,
  images: Map<string, HTMLImageElement>,
  exp: ExportModel,
): Promise<{ blob: Blob; filename: string; mime: string }> {
  await waitTick();
  const canvas = await rasterizeScene(scene, images, 1);
  const format = exp.format === "pdf" ? "png" : exp.format;
  const blob = await canvasToBlob(canvas, format, exp.jpegQuality);
  const ext = format === "jpg" ? "jpg" : format;
  return {
    blob,
    filename: `${sanitize(exp.filename)}.${ext}`,
    mime: blob.type,
  };
}

export async function exportPdf(
  scene: Scene,
  images: Map<string, HTMLImageElement>,
  exp: ExportModel,
  kind: "print" | "digital",
): Promise<{ blob: Blob; filename: string; mime: string }> {
  await waitTick();
  const canvas = await rasterizeScene(scene, images, 1);
  const png = await canvasToBlob(canvas, "png", 1);
  const bytes = new Uint8Array(await png.arrayBuffer());
  const pdf = await PDFDocument.create();
  const embedded = await pdf.embedPng(bytes);
  const cssDpi = 96;
  const scale = kind === "print" ? exp.dpi / cssDpi : exp.pixelScale;
  const widthPt = (scene.width / (cssDpi * scale)) * 72;
  const heightPt = (scene.height / (cssDpi * scale)) * 72;
  const page = pdf.addPage([widthPt, heightPt]);
  page.drawImage(embedded, { x: 0, y: 0, width: widthPt, height: heightPt });
  const out = await pdf.save();
  const copy = new Uint8Array(out.byteLength);
  copy.set(out);
  return {
    blob: new Blob([copy], { type: "application/pdf" }),
    filename: `${sanitize(exp.filename)}.pdf`,
    mime: "application/pdf",
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function sanitize(name: string): string {
  return (
    name
      .trim()
      .replace(/[^\w\d\-áéíóúüñÁÉÍÓÚÜÑ ]+/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "portada"
  );
}
