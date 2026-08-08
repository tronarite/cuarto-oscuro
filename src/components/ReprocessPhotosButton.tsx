"use client";

import { useState } from "react";
import { reprocessAllPhotos } from "@/app/admin/photo-maintenance-actions";

export function ReprocessPhotosButton() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ count: number; failed: number } | null>(
    null,
  );

  async function handleClick() {
    if (
      !confirm(
        "Esto vuelve a generar todas las fotos de todas las galerías a partir de su original. Puede tardar un rato. ¿Continuar?",
      )
    ) {
      return;
    }
    setPending(true);
    setResult(null);
    const res = await reprocessAllPhotos();
    setResult(res);
    setPending(false);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
      >
        {pending ? "Reprocesando…" : "Reprocesar todas las fotos"}
      </button>
      {result && (
        <p className="text-sm text-muted-foreground">
          {result.count} fotos actualizadas
          {result.failed > 0 ? `, ${result.failed} fallaron.` : "."}
        </p>
      )}
    </div>
  );
}
