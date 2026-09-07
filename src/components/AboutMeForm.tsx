"use client";

import { useRef, useState } from "react";
import {
  uploadAboutPhoto,
  deleteAboutPhoto,
  type AboutPhotoState,
} from "@/app/admin/about-actions";
import { useToast } from "@/components/ToastProvider";

interface AboutMeFormProps {
  initialText: string;
  hasPhoto: boolean;
  initialEnabled: boolean;
  initialButtonLabel: string;
  onTextChange: (text: string) => Promise<void>;
  onEnabledChange: (enabled: boolean) => Promise<void>;
  onButtonLabelChange: (label: string) => Promise<void>;
}

export function AboutMeForm({
  initialText,
  hasPhoto,
  initialEnabled,
  initialButtonLabel,
  onTextChange,
  onEnabledChange,
  onButtonLabelChange,
}: AboutMeFormProps) {
  const showToast = useToast();
  const [text, setText] = useState(initialText);
  const [buttonLabel, setButtonLabel] = useState(initialButtonLabel);
  const [photoState, setPhotoState] = useState<AboutPhotoState>({});
  const [uploading, setUploading] = useState(false);
  const [photoExists, setPhotoExists] = useState(hasPhoto);
  const [cacheBust, setCacheBust] = useState(0);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [savingEnabled, setSavingEnabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleToggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    setSavingEnabled(true);
    await onEnabledChange(next);
    setSavingEnabled(false);
    showToast("Guardado");
  }

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
      <button
        type="button"
        onClick={handleToggleEnabled}
        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98] ${
          enabled ? "border-foreground bg-surface" : "border-border"
        }`}
      >
        <div>
          <p className="text-sm font-medium">Página Sobre mí</p>
          <p className="text-xs text-muted-foreground">
            {enabled
              ? "Activada — visible desde la portada"
              : "Desactivada — oculta y no accesible"}
          </p>
        </div>
        <span
          className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-foreground" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
              enabled ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>
      {savingEnabled && <p className="text-xs text-muted-foreground">Guardando…</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Texto del botón</span>
        <input
          type="text"
          value={buttonLabel}
          onChange={(e) => setButtonLabel(e.target.value)}
          onBlur={() => {
            onButtonLabelChange(buttonLabel);
            showToast("Guardado");
          }}
          placeholder="Sobre mí"
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-muted-foreground"
        />
      </label>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          onTextChange(text);
          showToast("Guardado");
        }}
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
