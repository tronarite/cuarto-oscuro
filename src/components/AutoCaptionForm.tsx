"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { identifyExistingPhotos } from "@/app/admin/photo-maintenance-actions";

// BETA: ver src/lib/vision.ts. Sin GOOGLE_VISION_CREDENTIALS_JSON en el
// entorno el interruptor se puede activar igualmente, pero no hará nada
// al subir fotos hasta que se configuren las credenciales.
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
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<{
    count: number;
    skipped: number;
    failed: number;
  } | null>(null);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    await onChange(next);
    setSaving(false);
    showToast("Guardado");
  }

  async function handleIdentifyExisting() {
    if (
      !confirm(
        "Esto intenta identificar todas las fotos ya subidas que todavía no tienen pie de foto (las que ya tienen uno puesto, a mano o automático, no se tocan). Puede tardar un rato y gasta cuota de la API de Google. ¿Continuar?",
      )
    ) {
      return;
    }
    setIdentifying(true);
    setResult(null);
    const res = await identifyExistingPhotos();
    setResult(res);
    setIdentifying(false);
    showToast("Hecho");
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
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
        &ldquo;Buscar con esta imagen&rdquo; de Google Imágenes). Necesita las
        credenciales de una cuenta de servicio de Google Cloud en
        <code className="mx-1 rounded bg-surface px-1 py-0.5">
          GOOGLE_VISION_CREDENTIALS_JSON
        </code>
        configuradas en el servidor — sin ellas, este interruptor no hace
        nada. Si no encuentra una identificación clara, el pie de foto se
        queda vacío, igual que hoy.
      </p>

      <div className="mt-1 flex flex-col items-start gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          Esto solo afecta a fotos nuevas al subirlas. Para las que ya
          tienes subidas y no tienen pie de foto:
        </p>
        <button
          type="button"
          onClick={handleIdentifyExisting}
          disabled={identifying}
          className="rounded-full border border-border px-4 py-1.5 text-xs transition-all hover:border-muted-foreground active:scale-95 disabled:opacity-50"
        >
          {identifying ? "Identificando…" : "Identificar fotos ya subidas"}
        </button>
        {result && (
          <p className="text-xs text-muted-foreground">
            {result.count} identificadas, {result.skipped} sin resultado claro
            {result.failed > 0 ? `, ${result.failed} fallaron.` : "."}
          </p>
        )}
      </div>
    </div>
  );
}
