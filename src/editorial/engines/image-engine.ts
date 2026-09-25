import type { ImageFit, PreparedImage } from "../schema";
import { clamp } from "../measure";

export function computeCrop(
  naturalWidth: number,
  naturalHeight: number,
  destW: number,
  destH: number,
  fit: ImageFit,
  focalX: number,
  focalY: number,
): { sx: number; sy: number; sw: number; sh: number; distorted: boolean } {
  if (naturalWidth <= 0 || naturalHeight <= 0 || destW <= 0 || destH <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(1, naturalWidth), sh: Math.max(1, naturalHeight), distorted: false };
  }

  if (fit === "contain") {
    return { sx: 0, sy: 0, sw: naturalWidth, sh: naturalHeight, distorted: false };
  }

  const scale = Math.max(destW / naturalWidth, destH / naturalHeight);
  const sw = destW / scale;
  const sh = destH / scale;
  const fx = clamp(focalX, 0, 1);
  const fy = clamp(focalY, 0, 1);
  const sx = clamp((naturalWidth - sw) * fx, 0, Math.max(0, naturalWidth - sw));
  const sy = clamp((naturalHeight - sh) * fy, 0, Math.max(0, naturalHeight - sh));
  return { sx, sy, sw, sh, distorted: false };
}

export function containPlacement(
  naturalWidth: number,
  naturalHeight: number,
  dest: { x: number; y: number; w: number; h: number },
): { x: number; y: number; w: number; h: number } {
  const scale = Math.min(dest.w / naturalWidth, dest.h / naturalHeight);
  const w = naturalWidth * scale;
  const h = naturalHeight * scale;
  return {
    x: dest.x + (dest.w - w) / 2,
    y: dest.y + (dest.h - h) / 2,
    w,
    h,
  };
}

export async function loadPreparedImage(
  src: string,
  fit: ImageFit,
  focalX: number,
  focalY: number,
): Promise<PreparedImage> {
  if (typeof Image === "undefined" || !src) {
    return {
      src,
      element: null,
      naturalWidth: 1600,
      naturalHeight: 1066,
      fit,
      focalX,
      focalY,
    };
  }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = src;
  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image"));
    }).catch(() => undefined);
  }
  return {
    src,
    element: img,
    naturalWidth: img.naturalWidth || 1600,
    naturalHeight: img.naturalHeight || 1066,
    fit,
    focalX,
    focalY,
  };
}
