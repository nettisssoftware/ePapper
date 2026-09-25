import { useEffect, useState } from "react";
import { FileDown, RotateCcw } from "lucide-react";
import { ContentPanel } from "@/components/editor/content-panel";
import { DesignPanel } from "@/components/editor/design-panel";
import { ExportPanel } from "@/components/editor/export-panel";
import { PreviewStage } from "@/components/editor/preview-stage";
import { TypePanel } from "@/components/editor/type-panel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { composeNewspaper } from "@/editorial/engines/layout-engine";
import { downloadBlob, exportPdf, exportRaster } from "@/editorial/engines/export-engine";
import { formatById } from "@/editorial/catalog";
import "@/editorial/fonts";
import { resolveOutputPage } from "@/editorial/page-size";
import { loadUserImage, useEditorialStore, type EditorTab } from "@/editorial/store";
import { useComposition } from "@/editorial/use-composition";
import { cn } from "@/lib/utils";

const TABS: { id: EditorTab; label: string }[] = [
  { id: "content", label: "Contenido" },
  { id: "design", label: "Diseño" },
  { id: "type", label: "Tipo" },
  { id: "export", label: "Exportar" },
];

export function EditorApp() {
  const tab = useEditorialStore((s) => s.tab);
  const setTab = useEditorialStore((s) => s.setTab);
  const setImage = useEditorialStore((s) => s.setImage);
  const content = useEditorialStore((s) => s.content);
  const design = useEditorialStore((s) => s.design);
  const typography = useEditorialStore((s) => s.typography);
  const exportSettings = useEditorialStore((s) => s.exportSettings);
  const { scene, imageMap, fontsReady, image } = useComposition("preview");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    void useEditorialStore.persist.rehydrate();
    loadUserImage().then((src) => {
      if (src) setImage({ src });
    });
  }, [setImage]);

  const handleExport = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const page = resolveOutputPage(design, exportSettings);
      const production = composeNewspaper({
        content,
        design: { ...design, showGuides: false },
        typography,
        pageWidth: page.width,
        pageHeight: page.height,
        image,
        fontsReady: true,
      });
      if (production.validation.blocking) {
        setMessage("El render de producción no superó la validación.");
        setBusy(false);
        return;
      }
      const kind = formatById(design.formatId).kind === "print" ? "print" : "digital";
      const result =
        exportSettings.format === "pdf"
          ? await exportPdf(production, imageMap, exportSettings, kind)
          : await exportRaster(production, imageMap, exportSettings);
      downloadBlob(result.blob, result.filename);
      setMessage(`Exportado ${result.filename} · ${page.width} × ${page.height} px`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo exportar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
        <div className="min-w-0">
          <p className="font-display text-[22px] leading-none tracking-tight text-fg">
            Editorial
          </p>
          <p className="mt-1 hidden text-[11px] tracking-[0.16em] uppercase text-subtle sm:block">
            Newspaper Renderer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTick((n) => n + 1)}
            aria-label="Regenerar previsualización"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Regenerar</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={busy || !scene || scene.validation.blocking}
          >
            <FileDown className="size-4" />
            <span className="hidden sm:inline">Producción</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="order-2 flex min-h-0 w-full shrink-0 flex-col border-t border-border md:order-1 md:w-[360px] md:border-r md:border-t-0">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-2 py-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "h-10 shrink-0 rounded-md px-3 text-sm",
                  tab === item.id
                    ? "bg-surface-3 text-fg"
                    : "text-muted hover:text-fg",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <ScrollArea className="h-[38vh] min-h-0 md:h-auto md:flex-1">
            <div className="p-4" key={tick}>
              {tab === "content" ? <ContentPanel /> : null}
              {tab === "design" ? <DesignPanel /> : null}
              {tab === "type" ? <TypePanel /> : null}
              {tab === "export" ? (
                <ExportPanel
                  scene={scene}
                  onExport={handleExport}
                  busy={busy}
                  message={message}
                />
              ) : null}
            </div>
          </ScrollArea>
        </aside>
        <PreviewStage scene={scene} fontsReady={fontsReady} />
      </div>
    </div>
  );
}
