import { useEffect, useRef, useState } from "react";
import { SceneView } from "@/components/editor/scene-view";
import type { Scene } from "@/editorial/schema";
import { formatPhysicalLabel } from "@/editorial/page-size";
import { useEditorialStore } from "@/editorial/store";

export function PreviewStage({
  scene,
  fontsReady,
}: {
  scene: Scene | null;
  fontsReady: boolean;
}) {
  const design = useEditorialStore((s) => s.design);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ w: 320, h: 450 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const pad = 32;
      setFit({ w: Math.max(160, rect.width - pad), h: Math.max(200, rect.height - pad) });
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scale = scene
    ? Math.min(fit.w / scene.width, fit.h / scene.height)
    : 1;
  const width = scene ? scene.width * scale : 280;
  const height = scene ? scene.height * scale : 400;

  return (
    <div
      ref={wrapRef}
      className="relative order-1 flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto bg-paper-preview md:order-2"
    >
      {!scene ? (
        <p className="text-sm text-muted">
          {fontsReady ? "Componiendo la portada…" : "Cargando tipografías…"}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6">
          <div
            className="overflow-hidden bg-surface shadow-[var(--shadow-page)]"
            style={{ width, height }}
          >
            <div
              style={{
                width: scene.width,
                height: scene.height,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <SceneView scene={scene} />
            </div>
          </div>
          <p className="text-[11px] tracking-[0.12em] uppercase text-subtle">
            {formatPhysicalLabel(design)} · previsualización
          </p>
        </div>
      )}
    </div>
  );
}
