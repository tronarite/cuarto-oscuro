"use client";

import { useActionState } from "react";
import { setupAdminPassword } from "@/app/admin/setup-actions";

export default function AdminSetupPage() {
  const [state, formAction, pending] = useActionState(setupAdminPassword, undefined);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-xl font-medium">Configura el panel de administración</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Es la primera vez que se abre. Elige la contraseña con la que
        entrarás a partir de ahora.
      </p>
      <form action={formAction} className="mt-6 flex flex-col gap-3">
        <input
          type="text"
          name="username"
          placeholder="Usuario (mínimo 3 caracteres)"
          autoFocus
          required
          minLength={3}
          autoComplete="username"
          className="rounded-full border border-neutral-300 bg-transparent px-4 py-2.5 outline-none transition-colors focus:border-neutral-500"
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña (mínimo 8 caracteres)"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-full border border-neutral-300 bg-transparent px-4 py-2.5 outline-none transition-colors focus:border-neutral-500"
        />
        <input
          type="password"
          name="confirm"
          placeholder="Repite la contraseña"
          required
          minLength={8}
          className="rounded-full border border-neutral-300 bg-transparent px-4 py-2.5 outline-none transition-colors focus:border-neutral-500"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Crear contraseña"}
        </button>
      </form>
    </main>
  );
}
