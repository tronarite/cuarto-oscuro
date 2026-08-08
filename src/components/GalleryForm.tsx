"use client";

import { useActionState, useState } from "react";
import type { GalleryFormState } from "@/app/admin/(dashboard)/galleries/actions";
import {
  LAYOUT_LABEL,
  LAYOUT_DESCRIPTION,
  type GalleryLayout,
} from "@/lib/grid-templates";

const LAYOUT_OPTIONS: GalleryLayout[] = ["MIXED", "LARGE", "COMPACT", "BALANCED"];

interface GalleryFormProps {
  action: (
    prevState: GalleryFormState | undefined,
    formData: FormData,
  ) => Promise<GalleryFormState>;
  submitLabel: string;
  defaultValues?: {
    title?: string;
    description?: string;
    privacy?: string;
    layout?: string;
    tripStart?: string;
    tripEnd?: string;
    hasPassword?: boolean;
  };
}

export function GalleryForm({
  action,
  submitLabel,
  defaultValues,
}: GalleryFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [privacy, setPrivacy] = useState(defaultValues?.privacy ?? "PUBLIC");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-neutral-600">Título</span>
        <input
          type="text"
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-neutral-600">Descripción</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description}
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500"
        />
      </label>

      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-neutral-600">Inicio del viaje</span>
          <input
            type="date"
            name="tripStart"
            defaultValue={defaultValues?.tripStart}
            className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-neutral-600">Fin del viaje</span>
          <input
            type="date"
            name="tripEnd"
            defaultValue={defaultValues?.tripEnd}
            className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-neutral-600">Cuadrícula</span>
        <select
          name="layout"
          defaultValue={defaultValues?.layout ?? "MIXED"}
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500"
        >
          {LAYOUT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {LAYOUT_LABEL[option]} — {LAYOUT_DESCRIPTION[option]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-neutral-600">Privacidad</span>
        <select
          name="privacy"
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500"
        >
          <option value="PUBLIC">Pública (listada)</option>
          <option value="UNLISTED">Enlace único no listado</option>
          <option value="PASSWORD">Con contraseña</option>
        </select>
      </label>

      {privacy === "PASSWORD" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-600">
            Contraseña
            {defaultValues?.hasPassword
              ? " (déjala vacía para mantener la actual)"
              : ""}
          </span>
          <input
            type="text"
            name="password"
            className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500"
          />
        </label>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
