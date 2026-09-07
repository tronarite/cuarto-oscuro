"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  updateAdminCredentials,
  type AdminCredentialsState,
} from "@/app/admin/settings-actions";

export function AdminCredentialsForm({
  initialUsername,
}: {
  initialUsername: string;
}) {
  const [state, formAction, pending] = useActionState<
    AdminCredentialsState | undefined,
    FormData
  >(updateAdminCredentials, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      // Se reinician las contraseñas, pero no el usuario: al recargar el
      // formulario sigue mostrando el usuario actual, no vacío.
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex max-w-md flex-col gap-3"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Usuario</span>
        <input
          type="text"
          name="username"
          defaultValue={initialUsername}
          placeholder="Sin usuario configurado todavía"
          minLength={3}
          autoComplete="username"
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground"
        />
      </label>
      <input
        type="password"
        name="current"
        placeholder="Contraseña actual"
        required
        autoComplete="current-password"
        className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground"
      />
      <input
        type="password"
        name="next"
        placeholder="Nueva contraseña (opcional, mínimo 8 caracteres)"
        minLength={8}
        autoComplete="new-password"
        className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground"
      />
      <input
        type="password"
        name="confirm"
        placeholder="Repite la nueva contraseña"
        minLength={8}
        autoComplete="new-password"
        className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-muted-foreground">Credenciales actualizadas.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full border border-border px-4 py-1.5 text-xs transition-all hover:border-muted-foreground active:scale-95 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar credenciales"}
      </button>
    </form>
  );
}
