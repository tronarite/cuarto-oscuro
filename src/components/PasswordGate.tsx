"use client";

import { useActionState } from "react";
import type { UnlockFormState } from "@/app/galeria/[slug]/unlock-actions";

interface PasswordGateProps {
  title: string;
  action: (
    prevState: UnlockFormState | undefined,
    formData: FormData,
  ) => Promise<UnlockFormState>;
}

export function PasswordGate({ title, action }: PasswordGateProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-xl font-medium">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Esta galería está protegida con contraseña.
      </p>
      <form action={formAction} className="mt-6 flex flex-col gap-3">
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          autoFocus
          required
          className="rounded-md border border-border bg-transparent px-3 py-2 text-foreground outline-none focus:border-muted-foreground"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "Comprobando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
