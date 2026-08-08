"use client";

import { useRef, useState } from "react";
import {
  uploadAboutPhoto,
  deleteAboutPhoto,
  type AboutPhotoState,
} from "@/app/admin/about-actions";

interface AboutMeFormProps {
  initialText: string;
  hasPhoto: boolean;
  onTextChange: (text: string) => Promise<void>;
}

export function AboutMeForm({
  initialText,
  hasPhoto,
  onTextChange,
}: AboutMeFormProps) {
  const [text, setText] = useState(initialText);
  const [photoState, setPhotoState] = useState<AboutPhotoState>({});
  const [uploading, setUploading] = useState(false);
  const [photoExists, setPhotoExists] = useState(hasPhoto);
  const [cacheBust, setCacheBust] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setPhotoState({});
    const formData = new FormData();
    formData.set("photo", file);
    const result = await uploadAboutPhoto(undefined, formData);
    setPhotoState(result);
    if (!result.error) {
      setPhotoExists(true);
      setCacheBust((n) => n + 1);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete() {
    if (!confirm("¿Quitar la foto de \"Sobre mí\"?")) return;
    await deleteAboutPhoto();
    setPhotoExists(false);
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onTextChange(text)}
        placeholder="Escribe una breve descripción sobre ti…"
        rows={5}
        className="resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-muted-foreground"
      />

      <div className="flex items-center gap-3">
        {photoExists && (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/img/about?v=${cacheBust}`}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="self-start rounded-full border border-border px-4 py-1.5 text-xs transition-all hover:border-muted-foreground active:scale-95 disabled:opacity-50"
          >
            {uploading ? "Subiendo…" : photoExists ? "Cambiar foto" : "Elegir foto"}
          </button>
          {photoExists && (
            <button
              type="button"
              onClick={handleDelete}
              className="self-start text-xs text-red-600 transition-all hover:underline active:scale-95"
            >
              Quitar foto
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {photoState.error && (
        <p className="text-xs text-red-600">{photoState.error}</p>
      )}
    </div>
  );
}
