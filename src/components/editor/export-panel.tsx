import { Check, CircleAlert, CircleDot } from "lucide-react";
import { Field, Input, NativeSelect } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { Scene } from "@/editorial/schema";
import { formatById } from "@/editorial/catalog";
import { useEditorialStore } from "@/editorial/store";
import { cn } from "@/lib/utils";

export function ExportPanel({
  scene,
  onExport,
  busy,
  message,
}: {
  scene: Scene | null;
  onExport: () => void;
  busy: boolean;
  message: string | null;
}) {
  const exp = useEditorialStore((s) => s.exportSettings);
  const setExport = useEditorialStore((s) => s.setExport);
  const design = useEditorialStore((s) => s.design);
  const format = formatById(design.formatId);
  const print = format.kind === "print";
  const issues = scene?.validation.issues ?? [];
  const blocking = scene?.validation.blocking ?? true;

  return (
    <div className="space-y-6 pb-8">
      <Field label="Formato de archivo">
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          {(["png", "jpg", "webp", "pdf"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setExport({ format: f })}
              className={cn(
                "h-10 rounded-md border text-sm uppercase",
                exp.format === f
                  ? "border-primary/50 bg-surface-3 text-fg"
                  : "border-border bg-surface-2 text-muted",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </Field>

      {print ? (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
              DPI de impresión
            </p>
            <span className="text-[12px] tabular-nums text-muted">{exp.dpi}</span>
          </div>
          <Slider
            min={96}
            max={600}
            step={12}
            value={[exp.dpi]}
            onValueChange={([v]) => setExport({ dpi: v ?? 300 })}
          />
        </div>
      ) : (
        <Field label="Escala de exportación">
          <NativeSelect
            value={String(exp.pixelScale)}
            onChange={(e) => setExport({ pixelScale: Number(e.target.value) })}
          >
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="3">3×</option>
          </NativeSelect>
        </Field>
      )}

      {exp.format === "jpg" || exp.format === "webp" ? (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
              Calidad
            </p>
            <span className="text-[12px] tabular-nums text-muted">
              {Math.round(exp.jpegQuality * 100)}%
            </span>
          </div>
          <Slider
            min={0.6}
            max={1}
            step={0.01}
            value={[exp.jpegQuality]}
            onValueChange={([v]) => setExport({ jpegQuality: v ?? 0.92 })}
          />
        </div>
      ) : null}

      <Field label="Nombre de archivo">
        <Input
          value={exp.filename}
          onChange={(e) => setExport({ filename: e.target.value })}
        />
      </Field>

      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
          Validación
        </p>
        <ul className="mt-2 space-y-1.5">
          {issues.map((issue) => (
            <li key={issue.id} className="flex gap-2 text-[13px] leading-snug">
              {issue.level === "ok" ? (
                <Check className="mt-0.5 size-3.5 shrink-0 text-ok" />
              ) : issue.level === "warn" ? (
                <CircleDot className="mt-0.5 size-3.5 shrink-0 text-warn" />
              ) : (
                <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" />
              )}
              <span>
                <span className="text-fg">{issue.label}</span>
                {issue.detail ? (
                  <span className="block text-subtle">{issue.detail}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={busy || blocking}
        onClick={onExport}
      >
        {busy ? "Componiendo…" : "Descargar render de producción"}
      </Button>
      {blocking ? (
        <p className="text-[12px] text-danger">
          Corrige los errores de validación antes de exportar.
        </p>
      ) : null}
      {message ? <p className="text-[12px] text-muted">{message}</p> : null}
    </div>
  );
}
