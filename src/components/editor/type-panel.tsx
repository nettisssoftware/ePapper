import { Field, NativeSelect } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { bodyFonts, displayFonts } from "@/editorial/fonts";
import { useEditorialStore } from "@/editorial/store";

export function TypePanel() {
  const typography = useEditorialStore((s) => s.typography);
  const setTypography = useEditorialStore((s) => s.setTypography);
  const display = displayFonts();
  const body = bodyFonts();

  return (
    <div className="space-y-6 pb-8">
      <Field label="Fuente de titular">
        <NativeSelect
          value={typography.displayFamily}
          onChange={(e) => setTypography({ displayFamily: e.target.value })}
        >
          {display.map((f) => (
            <option key={f.id} value={f.cssName}>
              {f.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Fuente de cuerpo">
        <NativeSelect
          value={typography.bodyFamily}
          onChange={(e) => setTypography({ bodyFamily: e.target.value })}
        >
          {body.map((f) => (
            <option key={f.id} value={f.cssName}>
              {f.label}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <WeightField
        label="Peso del titular"
        value={typography.headlineWeight}
        options={[700, 800, 900]}
        onChange={(headlineWeight) => setTypography({ headlineWeight })}
      />
      <WeightField
        label="Peso de la bajada"
        value={typography.dekWeight}
        options={[400, 500, 600, 700]}
        onChange={(dekWeight) => setTypography({ dekWeight })}
      />
      <WeightField
        label="Peso del cuerpo"
        value={typography.bodyWeight}
        options={[400, 500]}
        onChange={(bodyWeight) => setTypography({ bodyWeight })}
      />
      <WeightField
        label="Peso de metadatos"
        value={typography.metaWeight}
        options={[400, 500, 600]}
        onChange={(metaWeight) => setTypography({ metaWeight })}
      />

      <ScaleField
        label="Tamaño de titular"
        value={typography.headlineScale}
        onChange={(headlineScale) => setTypography({ headlineScale })}
      />
      <ScaleField
        label="Tamaño de bajada"
        value={typography.dekScale}
        onChange={(dekScale) => setTypography({ dekScale })}
      />
      <ScaleField
        label="Tamaño de cuerpo"
        value={typography.bodyScale}
        onChange={(bodyScale) => setTypography({ bodyScale })}
      />

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
            Leading del cuerpo
          </p>
          <span className="text-[12px] tabular-nums text-muted">
            {typography.bodyLeading.toFixed(2)}
          </span>
        </div>
        <Slider
          min={1.2}
          max={1.7}
          step={0.02}
          value={[typography.bodyLeading]}
          onValueChange={([v]) => setTypography({ bodyLeading: v ?? 1.45 })}
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
            Letter spacing del titular
          </p>
          <span className="text-[12px] tabular-nums text-muted">
            {typography.headlineTracking.toFixed(3)}
          </span>
        </div>
        <Slider
          min={-0.04}
          max={0.04}
          step={0.002}
          value={[typography.headlineTracking]}
          onValueChange={([v]) => setTypography({ headlineTracking: v ?? -0.018 })}
        />
      </div>
    </div>
  );
}

function WeightField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onChange(w)}
            className={
              value === w
                ? "h-10 min-w-12 rounded-md border border-primary/50 bg-surface-3 px-3 text-sm text-fg"
                : "h-10 min-w-12 rounded-md border border-border bg-surface-2 px-3 text-sm text-muted"
            }
          >
            {w}
          </button>
        ))}
      </div>
    </Field>
  );
}

function ScaleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-subtle">
          {label}
        </p>
        <span className="text-[12px] tabular-nums text-muted">{Math.round(value * 100)}%</span>
      </div>
      <Slider
        min={0.8}
        max={1.35}
        step={0.02}
        value={[value]}
        onValueChange={([v]) => onChange(v ?? 1)}
      />
    </div>
  );
}
