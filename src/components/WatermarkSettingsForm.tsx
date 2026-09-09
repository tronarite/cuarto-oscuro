"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import type {
  WatermarkMethod,
  WatermarkStyle,
  WatermarkCorner,
} from "@/generated/prisma/enums";

const METHOD_OPTIONS: { value: WatermarkMethod; label: string; hint: string }[] = [
  {
    value: "OVERLAY",
    label: "Superpuesta",
    hint: "Capa encima al mostrarla — el archivo no se toca",
  },
  {
    value: "EMBEDDED",
    label: "Incrustada",
    hint: "Se graba en la propia foto al procesarla",
  },
];

const STYLE_OPTIONS: { value: WatermarkStyle; label: string; hint: string }[] = [
  { value: "TILED", label: "Repetida", hint: "Patrón en diagonal" },
  { value: "FULL", label: "Completa", hint: "Una marca grande centrada" },
  { value: "CORNER", label: "Esquina", hint: "Una marca pequeña" },
];

const CORNER_OPTIONS: { value: WatermarkCorner; label: string }[] = [
  { value: "TOP_LEFT", label: "Superior izquierda" },
  { value: "TOP_RIGHT", label: "Superior derecha" },
  { value: "BOTTOM_LEFT", label: "Inferior izquierda" },
  { value: "BOTTOM_RIGHT", label: "Inferior derecha" },
];

interface WatermarkSettingsFormProps {
  initialEnabled: boolean;
  initialText: string;
  initialMethod: WatermarkMethod;
  initialStyle: WatermarkStyle;
  initialCorner: WatermarkCorner;
  onChange: (
    enabled: boolean,
    text: string,
    method: WatermarkMethod,
    style: WatermarkStyle,
    corner: WatermarkCorner,
  ) => Promise<void>;
}

export function WatermarkSettingsForm({
  initialEnabled,
  initialText,
  initialMethod,
  initialStyle,
  initialCorner,
  onChange,
}: WatermarkSettingsFormProps) {
  const showToast = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [text, setText] = useState(initialText);
  const [method, setMethod] = useState<WatermarkMethod>(initialMethod);
  const [style, setStyle] = useState<WatermarkStyle>(initialStyle);
  const [corner, setCorner] = useState<WatermarkCorner>(initialCorner);
  const [saving, setSaving] = useState(false);

  async function save(next: {
    enabled?: boolean;
    text?: string;
    method?: WatermarkMethod;
    style?: WatermarkStyle;
    corner?: WatermarkCorner;
  }) {
    setSaving(true);
    await onChange(
      next.enabled ?? enabled,
      next.text ?? text,
      next.method ?? method,
      next.style ?? style,
      next.corner ?? corner,
    );
    setSaving(false);
    showToast("Guardado");
  }

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    await save({ enabled: next });
  }

  async function handleTextBlur() {
    await save({ text });
  }

  async function handleMethod(value: WatermarkMethod) {
    if (value === method) return;
    setMethod(value);
    await save({ method: value });
  }

  async function handleStyle(value: WatermarkStyle) {
    if (value === style) return;
    setStyle(value);
    await save({ style: value });
  }

  async function handleCorner(value: WatermarkCorner) {
    if (value === corner) return;
    setCorner(value);
    await save({ corner: value });
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98] ${
          enabled ? "border-foreground bg-surface" : "border-border"
        }`}
      >
        <div>
          <p className="text-sm font-medium">Marca de agua</p>
          <p className="text-xs text-muted-foreground">
            {enabled
              ? "Activada — se aplica al subir cada foto"
              : "Desactivada — las fotos se suben sin marca"}
          </p>
        </div>
        <span
          className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-foreground" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
              enabled ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Texto de la marca</span>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleTextBlur}
          disabled={!enabled}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground disabled:opacity-50"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Método</span>
        <div className="grid grid-cols-2 gap-2">
          {METHOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={!enabled}
              onClick={() => handleMethod(option.value)}
              className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-all active:scale-[0.98] disabled:opacity-50 ${
                method === option.value ? "border-foreground bg-surface" : "border-border"
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Estilo</span>
        <div className="grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={!enabled}
              onClick={() => handleStyle(option.value)}
              className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-all active:scale-[0.98] disabled:opacity-50 ${
                style === option.value ? "border-foreground bg-surface" : "border-border"
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {style === "CORNER" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Esquina</span>
          <select
            value={corner}
            disabled={!enabled}
            onChange={(e) => handleCorner(e.target.value as WatermarkCorner)}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground disabled:opacity-50"
          >
            {CORNER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className="text-xs text-muted-foreground">
        Cambiar el método o el estilo no afecta a las fotos ya subidas —
        usa &quot;Reprocesar fotos&quot; (más abajo) para aplicarlo también a esas.
      </p>

      {saving && <p className="text-xs text-muted-foreground">Guardando…</p>}
    </div>
  );
}
