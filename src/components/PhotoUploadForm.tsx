"use client";

import { useRef, useState } from "react";
import type { UploadFormState } from "@/app/admin/(dashboard)/galleries/[id]/photo-actions";

interface PhotoUploadFormProps {
  action: (
    prevState: UploadFormState | undefined,
    formData: FormData,
  ) => Promise<UploadFormState>;
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 16V4" />
      <path d="M6.5 9.5 12 4l5.5 5.5" />
      <path d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5" />
    </svg>
  );
}

export function PhotoUploadForm({ action }: PhotoUploadFormProps) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    setBusy(true);
    setDoneCount(null);
    const failedNames: string[] = [];
    let skipped = 0;
    setErrors([]);

    for (let i = 0; i < files.length; i++) {
      setProgress({ done: i, total: files.length });
      const formData = new FormData();
      formData.set("photo", files[i]);
      const result = await action(undefined, formData);
      if (result.error) failedNames.push(`${files[i].name}: ${result.error}`);
      else if (result.skipped) skipped++;
    }

    setProgress(null);
    setDoneCount(files.length - failedNames.length - skipped);
    setSkippedCount(skipped);
    setErrors(failedNames);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles(Array.from(e.dataTransfer.files));
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all active:scale-[0.98] ${
          dragging
            ? "border-foreground bg-surface"
            : "border-border hover:border-muted-foreground"
        }`}
      >
        <UploadIcon />
        <p className="text-sm font-medium">
          {busy
            ? progress
              ? `Subiendo ${progress.done + 1} de ${progress.total}…`
              : "Subiendo…"
            : "Arrastra fotos aquí"}
        </p>
        {!busy && (
          <p className="text-xs text-muted-foreground">o haz clic para elegirlas</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
        />
      </div>
      {errors.length > 0 && (
        <ul className="text-sm text-red-600">
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
      {doneCount !== null && errors.length === 0 && (
        <p className="text-sm text-green-700">
          {doneCount} foto(s) subidas.
          {skippedCount > 0 &&
            ` ${skippedCount} ya existían en esta galería y se omitieron.`}
        </p>
      )}
    </div>
  );
}
