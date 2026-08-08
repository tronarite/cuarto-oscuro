"use client";

import { useActionState } from "react";
import { createGallery, type FieldState } from "@/app/admin/(dashboard)/galleries/actions";

export default function NewGalleryPage() {
  const [state, formAction, pending] = useActionState<FieldState | undefined, FormData>(
    createGallery,
    undefined,
  );

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6">
      <p className="text-sm text-muted-foreground">Nueva galería</p>
      <form action={formAction} className="mt-2 flex flex-col gap-6">
        <input
          type="text"
          name="title"
          placeholder="Título del viaje…"
          autoFocus
          required
          className="border-b border-border bg-transparent pb-3 text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground focus:border-foreground"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-all active:scale-95 disabled:opacity-50"
        >
          {pending ? "Creando…" : "Crear galería"}
        </button>
        <p className="text-xs text-muted-foreground">
          Podrás ajustar privacidad, cuadrícula y fotos justo después.
        </p>
      </form>
    </main>
  );
}
