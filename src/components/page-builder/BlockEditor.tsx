"use client";

import {
  useMemo,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import type { PageBlock } from "@/types";

type BlockEditorProps = {
  block: PageBlock;
  onChange: (block: PageBlock) => void;
};

const gradients = [
  { value: "rose", label: "Rose" },
  { value: "sage", label: "Sage" },
  { value: "lavender", label: "Lavender" },
  { value: "peach", label: "Peach" },
] as const;

const columnOptions = [2, 3, 4] as const;

const colorSwatches = [
  "#D4918F",
  "#E8B4B4",
  "#7EA890",
  "#A8C4B0",
  "#B8B0D4",
  "#F4C7A1",
  "#1E1810",
  "#FFFFFF",
] as const;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toSteps(value: unknown): Array<{ number: string; title: string; description: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((step, index) => {
      if (!step || typeof step !== "object") {
        return null;
      }

      const record = step as Record<string, unknown>;
      return {
        number: asString(record.number, String(index + 1)),
        title: asString(record.title),
        description: asString(record.description),
      };
    })
    .filter(Boolean) as Array<{ number: string; title: string; description: string }>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8F827A]">
      {children}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1E1810] outline-none transition focus:border-[#D4918F] focus:ring-2 focus:ring-[#D4918F]/25"
    />
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-24 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#1E1810] outline-none transition focus:border-[#D4918F] focus:ring-2 focus:ring-[#D4918F]/25"
    />
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1E1810] outline-none transition focus:border-[#D4918F] focus:ring-2 focus:ring-[#D4918F]/25"
    />
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex h-8 w-14 items-center rounded-full border px-1 transition ${
        checked
          ? "border-[#D4918F] bg-[#F7E6E6]"
          : "border-black/10 bg-[#F3EFE8]"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  const props = useMemo(() => block.props ?? {}, [block.props]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function updateProps(updates: Record<string, unknown>) {
    onChange({
      ...block,
      props: {
        ...props,
        ...updates,
      },
    });
  }

  function setValue(key: string, value: string | number | boolean) {
    updateProps({ [key]: value });
  }

  function updateSteps(nextSteps: Array<{ number: string; title: string; description: string }>) {
    updateProps({ steps: nextSteps });
  }

  async function handleImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/admin/cloudinary-upload", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error("Upload Cloudinary non riuscito.");
      }

      const data = (await response.json()) as { secureUrl?: string };
      if (!data.secureUrl) {
        throw new Error("URL immagine non disponibile.");
      }

      setValue("imageUrl", data.secureUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Errore upload immagine.");
    } finally {
      setIsUploading(false);
    }
  }

  function renderHeroEditor() {
    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Titolo</FieldLabel>
          <TextInput
            value={asString(props.title)}
            onChange={(event) => setValue("title", event.target.value)}
            placeholder="Ogni storia d'amore..."
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Sottotitolo</FieldLabel>
          <TextArea
            value={asString(props.subtitle)}
            onChange={(event) => setValue("subtitle", event.target.value)}
            placeholder="Descrizione hero"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <FieldLabel>CTA principale</FieldLabel>
            <TextInput
              value={asString(props.ctaText)}
              onChange={(event) => setValue("ctaText", event.target.value)}
              placeholder="Scopri prodotti"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Link CTA</FieldLabel>
            <TextInput
              value={asString(props.ctaLink)}
              onChange={(event) => setValue("ctaLink", event.target.value)}
              placeholder="/shop"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>CTA secondaria</FieldLabel>
            <TextInput
              value={asString(props.ctaSecondaryText)}
              onChange={(event) => setValue("ctaSecondaryText", event.target.value)}
              placeholder="Contattaci"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Link secondario</FieldLabel>
            <TextInput
              value={asString(props.ctaSecondaryLink)}
              onChange={(event) => setValue("ctaSecondaryLink", event.target.value)}
              placeholder="/contatti"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <FieldLabel>Gradient preset</FieldLabel>
            <Select
              value={asString(props.backgroundGradient, "rose")}
              onChange={(event) => setValue("backgroundGradient", event.target.value)}
            >
              {gradients.map((gradient) => (
                <option key={gradient.value} value={gradient.value}>
                  {gradient.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <FieldLabel>Emoji</FieldLabel>
            <TextInput
              value={asString(props.emoji)}
              onChange={(event) => setValue("emoji", event.target.value)}
              placeholder="💍"
            />
          </div>
        </div>
      </>
    );
  }

  function renderCategoriesEditor() {
    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Titolo</FieldLabel>
          <TextInput
            value={asString(props.title)}
            onChange={(event) => setValue("title", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Sottotitolo</FieldLabel>
          <TextInput
            value={asString(props.subtitle)}
            onChange={(event) => setValue("subtitle", event.target.value)}
          />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-black/10 bg-[#FAF7F2] px-3 py-2">
          <FieldLabel>Mostra tutte le categorie</FieldLabel>
          <Toggle
            checked={asBoolean(props.showAll, false)}
            onChange={(checked) => setValue("showAll", checked)}
          />
        </div>
      </>
    );
  }

  function renderCollectionsEditor() {
    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Titolo</FieldLabel>
          <TextInput
            value={asString(props.title)}
            onChange={(event) => setValue("title", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Sottotitolo</FieldLabel>
          <TextInput
            value={asString(props.subtitle)}
            onChange={(event) => setValue("subtitle", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Numero max elementi</FieldLabel>
          <TextInput
            type="number"
            min={1}
            max={20}
            value={String(asNumber(props.maxItems, 8))}
            onChange={(event) => setValue("maxItems", Number(event.target.value))}
          />
        </div>
      </>
    );
  }

  function renderProductsEditor() {
    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Titolo</FieldLabel>
          <TextInput
            value={asString(props.title)}
            onChange={(event) => setValue("title", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Sottotitolo</FieldLabel>
          <TextInput
            value={asString(props.subtitle)}
            onChange={(event) => setValue("subtitle", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Filtro categoria (slug)</FieldLabel>
          <TextInput
            value={asString(props.categorySlug)}
            onChange={(event) => setValue("categorySlug", event.target.value)}
            placeholder="partecipazioni"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Filtro collezione</FieldLabel>
          <TextInput
            value={asString(props.collectionName)}
            onChange={(event) => setValue("collectionName", event.target.value)}
            placeholder="Amalfi Coast"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <FieldLabel>Max elementi</FieldLabel>
            <TextInput
              type="number"
              min={1}
              max={20}
              value={String(asNumber(props.maxItems, 8))}
              onChange={(event) => setValue("maxItems", Number(event.target.value))}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Colonne</FieldLabel>
            <Select
              value={String(asNumber(props.columns, 4))}
              onChange={(event) => setValue("columns", Number(event.target.value))}
            >
              {columnOptions.map((columns) => (
                <option key={columns} value={columns}>
                  {columns}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </>
    );
  }

  function renderHowItWorksEditor() {
    const steps = toSteps(props.steps);

    function addStep() {
      const nextIndex = steps.length + 1;
      updateSteps([
        ...steps,
        {
          number: String(nextIndex),
          title: "",
          description: "",
        },
      ]);
    }

    function removeStep(index: number) {
      updateSteps(steps.filter((_, stepIndex) => stepIndex !== index));
    }

    function changeStep(index: number, key: "number" | "title" | "description", value: string) {
      updateSteps(
        steps.map((step, stepIndex) =>
          stepIndex === index
            ? {
                ...step,
                [key]: value,
              }
            : step,
        ),
      );
    }

    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Titolo</FieldLabel>
          <TextInput
            value={asString(props.title)}
            onChange={(event) => setValue("title", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FieldLabel>Step</FieldLabel>
            <button
              type="button"
              onClick={addStep}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[#5C5048] hover:bg-[#F8F6F2]"
            >
              + Aggiungi step
            </button>
          </div>

          {steps.length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/15 bg-[#FAF7F2] p-3 text-xs text-[#7E7268]">
              Nessuno step configurato.
            </p>
          ) : (
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={`${index}-${step.number}`} className="space-y-2 rounded-xl border border-black/10 bg-[#FBF9F6] p-3">
                  <div className="grid grid-cols-[70px_1fr] gap-2">
                    <div className="space-y-1">
                      <FieldLabel>Numero</FieldLabel>
                      <TextInput
                        value={step.number}
                        onChange={(event) => changeStep(index, "number", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Titolo</FieldLabel>
                      <TextInput
                        value={step.title}
                        onChange={(event) => changeStep(index, "title", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Descrizione</FieldLabel>
                    <TextArea
                      value={step.description}
                      onChange={(event) => changeStep(index, "description", event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-xs font-medium text-[#A24D49] hover:underline"
                  >
                    Rimuovi step
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  function renderTextImageEditor() {
    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Titolo</FieldLabel>
          <TextInput
            value={asString(props.title)}
            onChange={(event) => setValue("title", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Testo</FieldLabel>
          <TextArea
            value={asString(props.text)}
            onChange={(event) => setValue("text", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Immagine</FieldLabel>
          <TextInput
            value={asString(props.imageUrl)}
            onChange={(event) => setValue("imageUrl", event.target.value)}
            placeholder="https://..."
          />
          <input
            type="file"
            accept="image/*"
            onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
            className="block w-full text-xs text-[#5C5048] file:mr-2 file:rounded-full file:border-0 file:bg-[#EFE8DB] file:px-3 file:py-1 file:text-xs file:font-medium"
          />
          {isUploading ? <p className="text-xs text-[#7E7268]">Upload immagine in corso...</p> : null}
          {uploadError ? <p className="text-xs text-[#A24D49]">{uploadError}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <FieldLabel>Posizione immagine</FieldLabel>
            <Select
              value={asString(props.imagePosition, "right")}
              onChange={(event) => setValue("imagePosition", event.target.value)}
            >
              <option value="left">Sinistra</option>
              <option value="right">Destra</option>
            </Select>
          </div>
          <div className="space-y-1">
            <FieldLabel>CTA testo</FieldLabel>
            <TextInput
              value={asString(props.ctaText)}
              onChange={(event) => setValue("ctaText", event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <FieldLabel>CTA link</FieldLabel>
          <TextInput
            value={asString(props.ctaLink)}
            onChange={(event) => setValue("ctaLink", event.target.value)}
            placeholder="/chi-siamo"
          />
        </div>
      </>
    );
  }

  function renderBannerPromoEditor() {
    const backgroundColor = asString(props.backgroundColor, "#D4918F");

    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Testo promo</FieldLabel>
          <TextInput
            value={asString(props.text)}
            onChange={(event) => setValue("text", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Sottotesto</FieldLabel>
          <TextInput
            value={asString(props.subtext)}
            onChange={(event) => setValue("subtext", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Colore sfondo</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {colorSwatches.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue("backgroundColor", color)}
                className={`h-7 w-7 rounded-full border ${
                  backgroundColor === color ? "border-[#1E1810]" : "border-black/10"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Seleziona colore ${color}`}
              />
            ))}
          </div>
          <TextInput
            value={backgroundColor}
            onChange={(event) => setValue("backgroundColor", event.target.value)}
            placeholder="#D4918F"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <FieldLabel>CTA testo</FieldLabel>
            <TextInput
              value={asString(props.ctaText)}
              onChange={(event) => setValue("ctaText", event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>CTA link</FieldLabel>
            <TextInput
              value={asString(props.ctaLink)}
              onChange={(event) => setValue("ctaLink", event.target.value)}
              placeholder="/shop"
            />
          </div>
        </div>
      </>
    );
  }

  function renderInstagramEditor() {
    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Titolo</FieldLabel>
          <TextInput
            value={asString(props.title)}
            onChange={(event) => setValue("title", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Handle</FieldLabel>
          <TextInput
            value={asString(props.handle)}
            onChange={(event) => setValue("handle", event.target.value)}
            placeholder="@effegilab"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Numero post</FieldLabel>
          <TextInput
            type="number"
            min={1}
            max={12}
            value={String(asNumber(props.maxItems, 6))}
            onChange={(event) => setValue("maxItems", Number(event.target.value))}
          />
        </div>
      </>
    );
  }

  function renderReviewsEditor() {
    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Titolo</FieldLabel>
          <TextInput
            value={asString(props.title)}
            onChange={(event) => setValue("title", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Sottotitolo</FieldLabel>
          <TextInput
            value={asString(props.subtitle)}
            onChange={(event) => setValue("subtitle", event.target.value)}
          />
        </div>
      </>
    );
  }

  function renderConsultBannerEditor() {
    return (
      <>
        <div className="space-y-1">
          <FieldLabel>Titolo</FieldLabel>
          <TextInput
            value={asString(props.title)}
            onChange={(event) => setValue("title", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Sottotitolo</FieldLabel>
          <TextInput
            value={asString(props.subtitle)}
            onChange={(event) => setValue("subtitle", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Testo</FieldLabel>
          <TextArea
            value={asString(props.text)}
            onChange={(event) => setValue("text", event.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <FieldLabel>CTA principale</FieldLabel>
            <TextInput
              value={asString(props.ctaText)}
              onChange={(event) => setValue("ctaText", event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Link principale</FieldLabel>
            <TextInput
              value={asString(props.ctaLink)}
              onChange={(event) => setValue("ctaLink", event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>CTA secondaria</FieldLabel>
            <TextInput
              value={asString(props.ctaSecondaryText)}
              onChange={(event) => setValue("ctaSecondaryText", event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Link secondario</FieldLabel>
            <TextInput
              value={asString(props.ctaSecondaryLink)}
              onChange={(event) => setValue("ctaSecondaryLink", event.target.value)}
            />
          </div>
        </div>
      </>
    );
  }

  function renderSpacerEditor() {
    return (
      <div className="space-y-1">
        <FieldLabel>Altezza (px)</FieldLabel>
        <TextInput
          type="number"
          min={0}
          max={300}
          value={String(asNumber(props.height, 48))}
          onChange={(event) => setValue("height", Number(event.target.value))}
        />
      </div>
    );
  }

  function renderByType() {
    switch (block.type) {
      case "hero":
        return renderHeroEditor();
      case "categories":
        return renderCategoriesEditor();
      case "collections":
        return renderCollectionsEditor();
      case "products":
        return renderProductsEditor();
      case "how-it-works":
        return renderHowItWorksEditor();
      case "text-image":
        return renderTextImageEditor();
      case "banner-promo":
        return renderBannerPromoEditor();
      case "instagram":
        return renderInstagramEditor();
      case "reviews":
        return renderReviewsEditor();
      case "consult-banner":
        return renderConsultBannerEditor();
      case "spacer":
        return renderSpacerEditor();
      default:
        return (
          <p className="rounded-xl border border-dashed border-black/15 bg-[#FAF7F2] p-3 text-sm text-[#7E7268]">
            Questo tipo di blocco non ha ancora un editor dedicato.
          </p>
        );
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9C9088]">
          Tipo blocco
        </p>
        <p className="text-sm font-medium text-[#1E1810]">{block.type}</p>
      </div>
      <div className="space-y-3">{renderByType()}</div>
    </div>
  );
}
