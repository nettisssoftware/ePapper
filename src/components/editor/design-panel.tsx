import { Field, Input, NativeSelect } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { FORMATS, LAYOUTS, PALETTES } from "@/editorial/catalog";
import { useEditorialStore } from "@/editorial/store";
import type { LayoutId, PaletteId } from "@/editorial/schema";
import { cn } from "@/lib/utils";

export function DesignPanel() {
  const design = useEditorialStore((s) => s.design);
  const setDesign = useEditorialStore((s) => s.setDesign);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
          Layout
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => setDesign({ layoutId: layout.id })}
              className={cn(
                "rounded-[14px] border p-2.5 text-left transition-colors duration-150",
                design.layoutId === layout.id
                  ? "border-primary/50 bg-surface-3"
                  : "border-border bg-surface-2 hover:border-border-strong",
              )}
            >
              <LayoutThumb id={layout.id} active={design.layoutId === layout.id} />
              <p className="mt-2 text-[13px] font-medium text-fg">{layout.name}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-subtle">
                {layout.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
          Paleta de fondo
        </p>
        <p className="mt-1 text-[12px] text-subtle">
          Solo altera el papel. El azul del medio no cambia.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              onClick={() => setDesign({ paletteId: palette.id as PaletteId })}
              className={cn(
                "flex items-center gap-2.5 rounded-[12px] border px-2.5 py-2 text-left",
                design.paletteId === palette.id
                  ? "border-primary/50 bg-surface-3"
                  : "border-border bg-surface-2 hover:border-border-strong",
              )}
            >
              <span
                className="size-7 shrink-0 rounded-md border border-border"
                style={{ background: palette.page }}
              />
              <span className="text-[13px] text-fg">{palette.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Field label="Formato">
        <NativeSelect
          value={design.formatId}
          onChange={(e) =>
            setDesign({ formatId: e.target.value as typeof design.formatId })
          }
        >
          {FORMATS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {design.formatId === "custom" ? (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Ancho">
            <Input
              type="number"
              min={320}
              value={design.customWidth}
              onChange={(e) => setDesign({ customWidth: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Alto">
            <Input
              type="number"
              min={320}
              value={design.customHeight}
              onChange={(e) => setDesign({ customHeight: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Unidad">
            <NativeSelect
              value={design.customUnit}
              onChange={(e) =>
                setDesign({ customUnit: e.target.value as typeof design.customUnit })
              }
            >
              <option value="px">px</option>
              <option value="mm">mm</option>
              <option value="in">in</option>
            </NativeSelect>
          </Field>
        </div>
      ) : null}

      <Field label="Orientación">
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(["portrait", "landscape"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setDesign({ orientation: o })}
              className={cn(
                "h-10 rounded-md border text-sm",
                design.orientation === o
                  ? "border-primary/50 bg-surface-3 text-fg"
                  : "border-border bg-surface-2 text-muted",
              )}
            >
              {o === "portrait" ? "Vertical" : "Horizontal"}
            </button>
          ))}
        </div>
      </Field>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
            Márgenes
          </p>
          <span className="text-[12px] tabular-nums text-muted">
            {Math.round(design.marginScale * 100)}%
          </span>
        </div>
        <Slider
          min={0.6}
          max={1.6}
          step={0.02}
          value={[design.marginScale]}
          onValueChange={([v]) => setDesign({ marginScale: v ?? 1 })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
            Gutter
          </p>
          <span className="text-[12px] tabular-nums text-muted">
            {Math.round(design.gutterScale * 100)}%
          </span>
        </div>
        <Slider
          min={0.5}
          max={1.8}
          step={0.02}
          value={[design.gutterScale]}
          onValueChange={([v]) => setDesign({ gutterScale: v ?? 1 })}
        />
      </div>

      <Field label="Columnas">
        <div className="mt-1.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDesign({ autoColumns: true })}
            className={cn(
              "h-10 rounded-md border px-3 text-sm",
              design.autoColumns
                ? "border-primary/50 bg-surface-3 text-fg"
                : "border-border bg-surface-2 text-muted",
            )}
          >
            Auto
          </button>
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDesign({ autoColumns: false, columns: n })}
              className={cn(
                "size-10 rounded-md border text-sm",
                !design.autoColumns && design.columns === n
                  ? "border-primary/50 bg-surface-3 text-fg"
                  : "border-border bg-surface-2 text-muted",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      <label className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-surface-2 px-3 py-2.5">
        <span className="text-sm text-fg">Mostrar guías de retícula</span>
        <Switch
          checked={design.showGuides}
          onCheckedChange={(v) => setDesign({ showGuides: v })}
        />
      </label>
    </div>
  );
}

function LayoutThumb({ id, active }: { id: LayoutId; active: boolean }) {
  const ink = active ? "#d8d3c8" : "#6e6e68";
  const paper = "#1c1c1f";
  const photo = active ? "#0A5C82" : "#3a3a3e";
  return (
    <svg viewBox="0 0 72 90" className="h-auto w-full rounded-md" aria-hidden="true">
      <rect width="72" height="90" rx="3" fill={paper} />
      <rect x="6" y="6" width="28" height="3" fill={ink} opacity="0.5" />
      <rect x="46" y="6" width="20" height="3" fill={ink} opacity="0.5" />
      <rect x="6" y="12" width="60" height="1" fill={ink} opacity="0.4" />
      <rect x="10" y="16" width="52" height="7" fill="#0A5C82" />
      <rect x="6" y="26" width="60" height="1" fill={ink} opacity="0.4" />
      {id === "l01" && (
        <>
          <rect x="8" y="30" width="56" height="8" fill={ink} />
          <rect x="8" y="40" width="56" height="4" fill={ink} opacity="0.5" />
          <rect x="8" y="47" width="56" height="18" fill={photo} />
          <rect x="8" y="68" width="26" height="16" fill={ink} opacity="0.35" />
          <rect x="38" y="68" width="26" height="16" fill={ink} opacity="0.35" />
        </>
      )}
      {id === "l02" && (
        <>
          <rect x="8" y="30" width="56" height="7" fill={ink} />
          <rect x="8" y="40" width="24" height="28" fill={photo} />
          <rect x="36" y="40" width="28" height="28" fill={ink} opacity="0.35" />
          <rect x="8" y="72" width="56" height="12" fill={ink} opacity="0.28" />
        </>
      )}
      {id === "l03" && (
        <>
          <rect x="8" y="30" width="56" height="7" fill={ink} />
          <rect x="40" y="40" width="24" height="28" fill={photo} />
          <rect x="8" y="40" width="28" height="28" fill={ink} opacity="0.35" />
          <rect x="8" y="72" width="56" height="12" fill={ink} opacity="0.28" />
        </>
      )}
      {id === "l04" && (
        <>
          <rect x="14" y="30" width="44" height="7" fill={ink} />
          <rect x="16" y="40" width="40" height="4" fill={ink} opacity="0.5" />
          <rect x="14" y="47" width="44" height="16" fill={photo} />
          <rect x="8" y="68" width="26" height="16" fill={ink} opacity="0.35" />
          <rect x="38" y="68" width="26" height="16" fill={ink} opacity="0.35" />
        </>
      )}
      {id === "l05" && (
        <>
          <rect x="8" y="30" width="56" height="7" fill={ink} />
          <rect x="8" y="42" width="26" height="28" fill={photo} />
          <rect x="38" y="42" width="26" height="42" fill={ink} opacity="0.35" />
          <rect x="8" y="74" width="26" height="10" fill={ink} opacity="0.28" />
        </>
      )}
      {id === "l06" && (
        <>
          <rect x="8" y="30" width="56" height="6" fill={ink} />
          <rect x="8" y="40" width="36" height="16" fill={photo} />
          <rect x="48" y="40" width="16" height="16" fill={ink} opacity="0.35" />
          <rect x="8" y="60" width="16" height="24" fill={ink} opacity="0.28" />
          <rect x="28" y="60" width="16" height="24" fill={ink} opacity="0.28" />
          <rect x="48" y="60" width="16" height="24" fill={ink} opacity="0.28" />
        </>
      )}
      {id === "l07" && (
        <>
          <rect x="8" y="30" width="56" height="28" fill={photo} />
          <rect x="8" y="62" width="56" height="7" fill={ink} />
          <rect x="8" y="72" width="16" height="12" fill={ink} opacity="0.3" />
          <rect x="28" y="72" width="16" height="12" fill={ink} opacity="0.3" />
          <rect x="48" y="72" width="16" height="12" fill={ink} opacity="0.3" />
        </>
      )}
      {id === "l08" && (
        <>
          <rect x="8" y="30" width="24" height="32" fill={photo} />
          <rect x="36" y="30" width="28" height="8" fill={ink} />
          <rect x="36" y="41" width="28" height="21" fill={ink} opacity="0.35" />
          <rect x="8" y="66" width="16" height="18" fill={ink} opacity="0.28" />
          <rect x="28" y="66" width="16" height="18" fill={ink} opacity="0.28" />
          <rect x="48" y="66" width="16" height="18" fill={ink} opacity="0.28" />
        </>
      )}
    </svg>
  );
}
