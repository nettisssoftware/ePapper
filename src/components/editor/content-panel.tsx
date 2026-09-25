import { useRef } from "react";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  clearUserImage,
  persistUserImage,
  useEditorialStore,
} from "@/editorial/store";
import { DEFAULT_IMAGE_SRC } from "@/editorial/defaults";

export function ContentPanel() {
  const content = useEditorialStore((s) => s.content);
  const setContent = useEditorialStore((s) => s.setContent);
  const setImage = useEditorialStore((s) => s.setImage);
  const resetSample = useEditorialStore((s) => s.resetSample);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5 pb-8">
      <Field label="Nombre del medio">
        <Input
          value={content.masthead}
          onChange={(e) => setContent({ masthead: e.target.value })}
          maxLength={42}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Edición">
          <Input
            value={content.editionLabel}
            onChange={(e) => setContent({ editionLabel: e.target.value })}
          />
        </Field>
        <Field label="Fecha">
          <Input
            type="date"
            value={content.date}
            onChange={(e) => setContent({ date: e.target.value })}
          />
        </Field>
        <Field label="Emisión">
          <Input
            value={content.emissionLabel}
            onChange={(e) => setContent({ emissionLabel: e.target.value })}
          />
        </Field>
        <Field label="Hora">
          <Input
            type="time"
            value={content.time}
            onChange={(e) => setContent({ time: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Titular">
        <Textarea
          rows={3}
          value={content.headline}
          onChange={(e) => setContent({ headline: e.target.value })}
        />
        <p className="mt-1.5 text-[12px] text-subtle">
          Se convierte a mayúsculas conservando acentos y eñes.
        </p>
      </Field>
      <Field label="Descripción / bajada">
        <Textarea
          rows={3}
          value={content.dek}
          onChange={(e) => setContent({ dek: e.target.value })}
        />
      </Field>
      <div>
        <Field label="Imagen principal">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const dataUrl = await readFile(file);
              setImage({ src: dataUrl, alt: file.name });
              persistUserImage(dataUrl).catch(() => undefined);
            }}
          />
          <div className="mt-1.5 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              Sustituir imagen
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setImage({ src: DEFAULT_IMAGE_SRC });
                clearUserImage().catch(() => undefined);
              }}
            >
              Restaurar
            </Button>
          </div>
        </Field>
        <FocalPicker />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Ajuste">
            <NativeSelect
              value={content.image.fit}
              onChange={(e) =>
                setImage({ fit: e.target.value as typeof content.image.fit })
              }
            >
              <option value="cover">Cover</option>
              <option value="focal">Crop focalizado</option>
              <option value="contain">Contain</option>
            </NativeSelect>
          </Field>
          <Field label="Pie de imagen">
            <Input
              value={content.image.caption}
              onChange={(e) => setImage({ caption: e.target.value })}
            />
          </Field>
        </div>
      </div>
      <Field label="Desarrollo">
        <Textarea
          rows={10}
          value={content.body}
          onChange={(e) => setContent({ body: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Autor">
          <Input
            value={content.author}
            onChange={(e) => setContent({ author: e.target.value })}
          />
        </Field>
        <Field label="Fuente">
          <Input
            value={content.source}
            onChange={(e) => setContent({ source: e.target.value })}
          />
        </Field>
      </div>
      <Button type="button" variant="secondary" onClick={() => resetSample()}>
        Restaurar muestra
      </Button>
    </div>
  );
}

function FocalPicker() {
  const image = useEditorialStore((s) => s.content.image);
  const setImage = useEditorialStore((s) => s.setImage);
  return (
    <button
      type="button"
      className="relative mt-3 block w-full overflow-hidden rounded-[10px] border border-border bg-surface-3"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setImage({ focalX: x, focalY: y, fit: image.fit === "contain" ? "focal" : image.fit });
      }}
      aria-label="Definir punto focal de la imagen"
    >
      <img
        src={image.src}
        alt=""
        className="aspect-[3/2] h-auto w-full object-cover"
        crossOrigin="anonymous"
      />
      <span
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary-fg"
        style={{ left: `${image.focalX * 100}%`, top: `${image.focalY * 100}%` }}
      />
    </button>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
