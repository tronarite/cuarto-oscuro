"use client";

import { useState } from "react";

interface WatermarkSettingsFormProps {
  initialEnabled: boolean;
  initialText: string;
  onChange: (enabled: boolean, text: string) => Promise<void>;
}

export function WatermarkSettingsForm({
  initialEnabled,
  initialText,
  onChange,
}: WatermarkSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    await onChange(next, text);
    setSaving(false);
  }

  async function handleTextBlur() {
    setSaving(true);
    await onChange(enabled, text);
    setSaving(false);
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
              ? "Activada — se incrusta al subir cada foto"
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

      {saving && <p className="text-xs text-muted-foreground">Guardando…</p>}
    </div>
  );
}
