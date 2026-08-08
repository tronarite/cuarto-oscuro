"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  changeAdminPassword,
  type ChangePasswordState,
} from "@/app/admin/settings-actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<
    ChangePasswordState | undefined,
    FormData
  >(changeAdminPassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex max-w-md flex-col gap-3"
    >
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
        placeholder="Nueva contraseña (mínimo 8 caracteres)"
        required
        minLength={8}
        autoComplete="new-password"
        className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground"
      />
      <input
        type="password"
        name="confirm"
        placeholder="Repite la nueva contraseña"
        required
        minLength={8}
        autoComplete="new-password"
        className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-muted-foreground">Contraseña actualizada.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full border border-border px-4 py-1.5 text-xs transition-all hover:border-muted-foreground active:scale-95 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
