"use client";

import { useState, useSyncExternalStore } from "react";
import { PrivacyPicker } from "@/components/PrivacyPicker";
import { LayoutPicker } from "@/components/LayoutPicker";
import { useToast } from "@/components/ToastProvider";
import type { Privacy } from "@/generated/prisma/enums";
import type { GalleryLayout } from "@/lib/grid-templates";

interface FieldResult {
  error?: string;
}

// El origen (https://dominio) no existe en el servidor y no cambia
// mientras la página está montada: useSyncExternalStore da el valor
// correcto sin desajuste de hidratación (servidor: "", cliente: real),
// sin el efecto de "leer algo externo y guardarlo en estado" que ya usan
// ThemeToggle.tsx/BackToTopButton.tsx en este mismo proyecto.
function subscribeNever() {
  return () => {};
}
function getOrigin() {
  return window.location.origin;
}
function getServerOrigin() {
  return "";
}

export interface GalleryEditorProps {
  title: string;
  description: string;
  privacy: Privacy;
  layout: GalleryLayout;
  slug: string;
  onTitleChange: (title: string) => Promise<FieldResult>;
  onDescriptionChange: (description: string) => Promise<void>;
  onPrivacyChange: (privacy: "PUBLIC" | "UNLISTED") => Promise<void>;
  onPasswordChange: (password: string) => Promise<FieldResult>;
  onLayoutChange: (layout: GalleryLayout) => Promise<void>;
}

export function GalleryEditor({
  title,
  description,
  privacy: initialPrivacy,
  layout: initialLayout,
  slug,
  onTitleChange,
  onDescriptionChange,
  onPrivacyChange,
  onPasswordChange,
  onLayoutChange,
}: GalleryEditorProps) {
  const showToast = useToast();
  const [titleError, setTitleError] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [layout, setLayout] = useState(initialLayout);
  const [showPasswordField, setShowPasswordField] = useState(
    initialPrivacy === "PASSWORD",
  );
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(subscribeNever, getOrigin, getServerOrigin);

  async function handleTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const result = await onTitleChange(e.target.value);
    setTitleError(result.error ?? null);
    if (!result.error) showToast("Guardado");
  }

  async function handlePrivacySelect(next: Privacy) {
    if (next === "PASSWORD") {
      setShowPasswordField(true);
      return;
    }
    setShowPasswordField(false);
    setPasswordError(null);
    setPrivacy(next);
    await onPrivacyChange(next);
    showToast("Guardado");
  }

  async function handlePasswordBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (!value) return;
    const result = await onPasswordChange(value);
    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordError(null);
      setPrivacy("PASSWORD");
      e.target.value = "";
      showToast("Guardado");
    }
  }

  async function handleLayoutSelect(next: GalleryLayout) {
    setLayout(next);
    await onLayoutChange(next);
    showToast("Guardado");
  }

  async function handleCopyLink() {
    const url = `${origin}/galeria/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin acceso al portapapeles (permiso denegado): no hay más que
      // hacer, la URL sigue visible en la cajita para copiar a mano.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <input
          type="text"
          defaultValue={title}
          onBlur={handleTitleBlur}
          className="w-full border-b border-transparent bg-transparent pb-1 text-2xl font-semibold tracking-tight outline-none transition-colors focus:border-border"
        />
        {titleError && <p className="mt-1 text-xs text-red-600">{titleError}</p>}
      </div>

      <textarea
        defaultValue={description}
        placeholder="Añade una descripción…"
        rows={6}
        onBlur={(e) => {
          onDescriptionChange(e.target.value);
          showToast("Guardado");
        }}
        className="w-full resize-y rounded-lg border border-transparent bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-border"
      />

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Privacidad</p>
        <PrivacyPicker value={privacy} onChange={handlePrivacySelect} />
        {showPasswordField && (
          <div className="mt-2">
            <input
              type="text"
              placeholder={
                privacy === "PASSWORD" ? "Cambiar contraseña…" : "Contraseña…"
              }
              onBlur={handlePasswordBlur}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-muted-foreground"
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-600">{passwordError}</p>
            )}
          </div>
        )}
        {privacy === "PASSWORD" && (
          <div className="mt-3 flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">
              Enlace para compartir (pide la contraseña a quien no sea
              administrador):
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${origin}/galeria/${slug}`}
                onFocus={(e) => e.target.select()}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-xs text-muted-foreground outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs transition-all hover:border-muted-foreground active:scale-95"
              >
                {copied ? "Copiado ✓" : "Copiar enlace"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Cuadrícula</p>
        <LayoutPicker value={layout} onChange={handleLayoutSelect} />
      </div>
    </div>
  );
}
