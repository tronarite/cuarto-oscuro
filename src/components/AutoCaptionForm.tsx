"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

// BETA: ver src/lib/vision.ts. Sin GOOGLE_VISION_API_KEY en el entorno
// el interruptor se puede activar igualmente, pero no hará nada al
// subir fotos hasta que se configure la clave.
export function AutoCaptionForm({
  initialEnabled,
  onChange,
}: {
  initialEnabled: boolean;
  onChange: (enabled: boolean) => Promise<void>;
}) {
  const showToast = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    await onChange(next);
    setSaving(false);
    showToast("Guardado");
  }

  return (
    <div className="flex max-w-md flex-col gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98] disabled:opacity-50 ${
          enabled ? "border-foreground bg-surface" : "border-border"
        }`}
      >
        <div>
          <p className="text-sm font-medium">Pie de foto automático (beta)</p>
          <p className="text-xs text-muted-foreground">
            {enabled
              ? "Activado — se intenta identificar cada foto nueva al subirla"
              : "Desactivado — el pie de foto se rellena siempre a mano"}
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
      <p className="text-xs text-muted-foreground">
        Usa Google Cloud Vision para reconocer la foto (mismo motor que
        &ldquo;Buscar con esta imagen&rdquo; de Google Imágenes). Necesita la clave
        <code className="mx-1 rounded bg-surface px-1 py-0.5">GOOGLE_VISION_API_KEY</code>
        configurada en el servidor — sin ella, este interruptor no hace
        nada. Si no encuentra una identificación clara, el pie de foto se
        queda vacío, igual que hoy.
      </p>
    </div>
  );
}
