"use client";

import { useState } from "react";
import type { PhotoCorner } from "@/generated/prisma/enums";

const OPTIONS: { value: PhotoCorner; label: string; hint: string; radius: string }[] = [
  {
    value: "SQUARE",
    label: "Cuadradas",
    hint: "Esquina viva, sin redondear",
    radius: "0px",
  },
  {
    value: "ROUNDED",
    label: "Redondeadas",
    hint: "Esquina suave",
    radius: "0.6rem",
  },
];

export function PhotoCornerForm({
  initialCorner,
  onChange,
}: {
  initialCorner: PhotoCorner;
  onChange: (corner: PhotoCorner) => Promise<void>;
}) {
  const [corner, setCorner] = useState<PhotoCorner>(initialCorner);
  const [saving, setSaving] = useState(false);

  async function handleSelect(value: PhotoCorner) {
    if (value === corner) return;
    setCorner(value);
    setSaving(true);
    await onChange(value);
    setSaving(false);
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-all active:scale-[0.98] ${
              corner === option.value ? "border-foreground bg-surface" : "border-border"
            }`}
          >
            <span
              className="h-10 w-10 border border-muted-foreground/40 bg-foreground/10"
              style={{ borderRadius: option.radius }}
              aria-hidden
            />
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.hint}</span>
          </button>
        ))}
      </div>
      {saving && <p className="text-xs text-muted-foreground">Guardando…</p>}
    </div>
  );
}
