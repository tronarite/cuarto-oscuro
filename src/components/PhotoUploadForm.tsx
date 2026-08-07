"use client";

import { useRef, useState } from "react";
import type { UploadFormState } from "@/app/admin/(dashboard)/galleries/[id]/photo-actions";

interface PhotoUploadFormProps {
  action: (
    prevState: UploadFormState | undefined,
    formData: FormData,
  ) => Promise<UploadFormState>;
}

export function PhotoUploadForm({ action }: PhotoUploadFormProps) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const files = Array.from(inputRef.current?.files ?? []);
    if (files.length === 0) return;

    setBusy(true);
    setDoneCount(null);
    const failedNames: string[] = [];
    setErrors([]);

    for (let i = 0; i < files.length; i++) {
      setProgress({ done: i, total: files.length });
      const formData = new FormData();
      formData.set("photo", files[i]);
      const result = await action(undefined, formData);
      if (result.error) failedNames.push(`${files[i].name}: ${result.error}`);
    }

    setProgress(null);
    setDoneCount(files.length - failedNames.length);
    setErrors(failedNames);
    setBusy(false);
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-md border border-dashed border-border p-4"
    >
      <input
        ref={inputRef}
        type="file"
        name="photos"
        accept="image/*"
        multiple
        required
        className="text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy
          ? progress
            ? `Subiendo ${progress.done + 1} de ${progress.total}…`
            : "Subiendo…"
          : "Subir fotos"}
      </button>
      {errors.length > 0 && (
        <ul className="text-sm text-red-600">
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
      {doneCount !== null && errors.length === 0 && (
        <p className="text-sm text-green-700">{doneCount} foto(s) subidas.</p>
      )}
    </form>
  );
}
