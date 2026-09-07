"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/admin/actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, undefined);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-xl font-medium">Acceso administrador</h1>
      <form action={formAction} className="mt-6 flex flex-col gap-3">
        <input
          type="text"
          name="username"
          placeholder="Usuario"
          autoFocus
          autoComplete="username"
          className="rounded-full border border-neutral-300 bg-transparent px-4 py-2.5 outline-none transition-colors focus:border-neutral-500"
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          required
          autoComplete="current-password"
          className="rounded-full border border-neutral-300 bg-transparent px-4 py-2.5 outline-none transition-colors focus:border-neutral-500"
        />
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
