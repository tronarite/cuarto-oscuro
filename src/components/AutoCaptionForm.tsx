"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { identifyExistingPhotos } from "@/app/admin/photo-maintenance-actions";

// BETA: ver src/lib/vision.ts. Sin GEMINI_API_KEY en el entorno el
// interruptor se puede activar igualmente, pero no hará nada al subir
// fotos hasta que se configure la clave.
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
        "Esto REGENERA el pie de foto de TODAS las fotos de todas las galerías, tengan ya uno o no (incluidos los que hayas escrito tú a mano: si Gemini da un resultado, lo sobreescribe). Va despacio a propósito (unos 4-5 segundos por foto) para no superar el límite gratuito de la API de Google, así que con muchas fotos puede tardar varios minutos — no cierres esta pantalla mientras tanto. ¿Continuar?",
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
        Usa Gemini (IA de Google) para describir la foto con una frase
        corta y natural. Necesita una clave de
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-1 underline hover:text-accent"
        >
          Google AI Studio
        </a>
        en
        <code className="mx-1 rounded bg-surface px-1 py-0.5">GEMINI_API_KEY</code>
        configurada en el servidor — sin ella, este interruptor no hace
        nada. Si no encuentra nada identificable, el pie de foto se queda
        vacío, igual que hoy.
      </p>

      <div className="mt-1 flex flex-col items-start gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          El interruptor de arriba solo afecta a fotos nuevas al subirlas.
          Este botón regenera el pie de foto de TODAS las fotos ya
          subidas, tengan uno o no (también sobreescribe los que hayas
          escrito tú a mano):
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
            {result.count} identificadas/regeneradas, {result.skipped} sin
            resultado claro
            {result.failed > 0 ? `, ${result.failed} fallaron.` : "."}
          </p>
        )}
      </div>
    </div>
  );
}
