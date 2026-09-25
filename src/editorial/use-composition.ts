import { useEffect, useMemo, useState } from "react";
import { composeNewspaper } from "./engines/layout-engine";
import { loadPreparedImage } from "./engines/image-engine";
import { ensureFonts } from "./fonts";
import { resolveLogicalPage, resolveOutputPage } from "./page-size";
import type { PreparedImage, Scene } from "./schema";
import { useEditorialStore } from "./store";

export function useComposition(mode: "preview" | "production"): {
  scene: Scene | null;
  image: PreparedImage | null;
  imageMap: Map<string, HTMLImageElement>;
  fontsReady: boolean;
} {
  const content = useEditorialStore((s) => s.content);
  const design = useEditorialStore((s) => s.design);
  const typography = useEditorialStore((s) => s.typography);
  const exportSettings = useEditorialStore((s) => s.exportSettings);
  const setFontsReady = useEditorialStore((s) => s.setFontsReady);
  const fontsReady = useEditorialStore((s) => s.fontsReady);

  const [image, setImage] = useState<PreparedImage | null>(null);

  useEffect(() => {
    let cancelled = false;
    const families = [typography.displayFamily, typography.bodyFamily];
    ensureFonts(families).then((ok) => {
      if (!cancelled) setFontsReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [typography.displayFamily, typography.bodyFamily, setFontsReady]);

  useEffect(() => {
    let cancelled = false;
    const src = content.image.src;
    if (!src) {
      setImage(null);
      return;
    }
    loadPreparedImage(src, content.image.fit, content.image.focalX, content.image.focalY)
      .then((prepared) => {
        if (!cancelled) setImage(prepared);
      })
      .catch(() => {
        if (!cancelled) {
          setImage({
            src,
            element: null,
            naturalWidth: 1600,
            naturalHeight: 1066,
            fit: content.image.fit,
            focalX: content.image.focalX,
            focalY: content.image.focalY,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [content.image.src, content.image.fit, content.image.focalX, content.image.focalY]);

  const page =
    mode === "production"
      ? resolveOutputPage(design, exportSettings)
      : resolveLogicalPage(design);

  const scene = useMemo(() => {
    if (typeof document === "undefined") return null;
    if (!fontsReady) return null;
    const prepared = image
      ? {
          ...image,
          fit: content.image.fit,
          focalX: content.image.focalX,
          focalY: content.image.focalY,
        }
      : null;
    return composeNewspaper({
      content,
      design,
      typography,
      pageWidth: page.width,
      pageHeight: page.height,
      image: prepared,
      fontsReady,
    });
  }, [content, design, typography, page.width, page.height, image, fontsReady]);

  const imageMap = useMemo(() => {
    const map = new Map<string, HTMLImageElement>();
    if (image?.element && image.src) map.set(image.src, image.element);
    return map;
  }, [image]);

  return { scene, image, imageMap, fontsReady };
}
