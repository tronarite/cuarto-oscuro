"use client";

import { useActionState, useRef } from "react";
import type { UploadFormState } from "@/app/admin/(dashboard)/galleries/[id]/photo-actions";

interface PhotoUploadFormProps {
  action: (
    prevState: UploadFormState | undefined,
    formData: FormData,
  ) => Promise<UploadFormState>;
}

export function PhotoUploadForm({ action }: PhotoUploadFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 rounded-md border border-dashed border-neutral-300 p-4"
    >
      <input
        type="file"
        name="photos"
        accept="image/*"
        multiple
        required
        className="text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Subiendo…" : "Subir fotos"}
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {typeof state?.uploaded === "number" && !state.error && (
        <p className="text-sm text-green-700">
          {state.uploaded} foto(s) subidas.
        </p>
      )}
    </form>
  );
}
