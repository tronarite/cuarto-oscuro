"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import type { ColorPack } from "@/generated/prisma/enums";

// Mismos valores que las 4 variantes en blanco y negro de globals.css
// (versión clara de cada una), solo para pintar la muestra de color aquí.
const PACKS: {
  value: ColorPack;
  label: string;
  hint: string;
  bg: string;
  fg: string;
  border: string;
}[] = [
  {
    value: "WARM",
    label: "Cálido",
    hint: "Crema y carbón — el de siempre",
    bg: "#f3f1ec",
    fg: "#262420",
    border: "#ddd9d0",
  },
  {
    value: "COOL",
    label: "Frío",
    hint: "Gris azulado, más neutro",
    bg: "#f4f4f5",
    fg: "#18181b",
    border: "#d4d4d8",
  },
  {
    value: "CONTRAST",
    label: "Alto contraste",
    hint: "Blanco y negro puros",
    bg: "#ffffff",
    fg: "#000000",
    border: "#cccccc",
  },
  {
    value: "SOFT",
    label: "Suave",
    hint: "Grises apagados, poco contraste",
    bg: "#eaeaea",
    fg: "#3a3a3a",
    border: "#d6d6d6",
  },
];

export function ColorPackForm({
  initialPack,
  onChange,
}: {
  initialPack: ColorPack;
  onChange: (pack: ColorPack) => Promise<void>;
}) {
  const showToast = useToast();
  const [pack, setPack] = useState<ColorPack>(initialPack);
  const [saving, setSaving] = useState(false);

  async function handleSelect(value: ColorPack) {
    if (value === pack) return;
    setPack(value);
    setSaving(true);
    await onChange(value);
    setSaving(false);
    showToast("Guardado");
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {PACKS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => handleSelect(p.value)}
            className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-all active:scale-[0.98] ${
              pack === p.value ? "border-foreground bg-surface" : "border-border"
            }`}
          >
            <span
              className="h-10 w-10 rounded-lg border"
              style={{
                background: `linear-gradient(135deg, ${p.bg} 50%, ${p.fg} 50%)`,
                borderColor: p.border,
              }}
              aria-hidden
            />
            <span className="text-sm font-medium">{p.label}</span>
            <span className="text-xs text-muted-foreground">{p.hint}</span>
          </button>
        ))}
      </div>
      {saving && <p className="text-xs text-muted-foreground">Guardando…</p>}
    </div>
  );
}
