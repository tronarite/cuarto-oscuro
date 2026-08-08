"use client";

import { useState } from "react";
import { PrivacyPicker } from "@/components/PrivacyPicker";
import { LayoutPicker } from "@/components/LayoutPicker";
import type { Privacy } from "@/generated/prisma/enums";
import type { GalleryLayout } from "@/lib/grid-templates";

interface FieldResult {
  error?: string;
}

export interface GalleryEditorProps {
  title: string;
  description: string;
  privacy: Privacy;
  layout: GalleryLayout;
  tripStart: string;
  tripEnd: string;
  onTitleChange: (title: string) => Promise<FieldResult>;
  onDescriptionChange: (description: string) => Promise<void>;
  onDatesChange: (tripStart: string, tripEnd: string) => Promise<void>;
  onPrivacyChange: (privacy: "PUBLIC" | "UNLISTED") => Promise<void>;
  onPasswordChange: (password: string) => Promise<FieldResult>;
  onLayoutChange: (layout: GalleryLayout) => Promise<void>;
}

export function GalleryEditor({
  title,
  description,
  privacy: initialPrivacy,
  layout: initialLayout,
  tripStart: initialTripStart,
  tripEnd: initialTripEnd,
  onTitleChange,
  onDescriptionChange,
  onDatesChange,
  onPrivacyChange,
  onPasswordChange,
  onLayoutChange,
}: GalleryEditorProps) {
  const [titleError, setTitleError] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [layout, setLayout] = useState(initialLayout);
  const [showPasswordField, setShowPasswordField] = useState(
    initialPrivacy === "PASSWORD",
  );
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [tripStart, setTripStart] = useState(initialTripStart);
  const [tripEnd, setTripEnd] = useState(initialTripEnd);

  async function handleTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const result = await onTitleChange(e.target.value);
    setTitleError(result.error ?? null);
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
    }
  }

  async function handleLayoutSelect(next: GalleryLayout) {
    setLayout(next);
    await onLayoutChange(next);
  }

  async function handleDatesChange(nextStart: string, nextEnd: string) {
    setTripStart(nextStart);
    setTripEnd(nextEnd);
    await onDatesChange(nextStart, nextEnd);
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
        rows={2}
        onBlur={(e) => onDescriptionChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-transparent bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-border"
      />

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-muted-foreground">Inicio</span>
          <input
            type="date"
            value={tripStart}
            onChange={(e) => handleDatesChange(e.target.value, tripEnd)}
            className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-muted-foreground"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-muted-foreground">Fin</span>
          <input
            type="date"
            value={tripEnd}
            onChange={(e) => handleDatesChange(tripStart, e.target.value)}
            className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-muted-foreground"
          />
        </label>
      </div>

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
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Cuadrícula</p>
        <LayoutPicker value={layout} onChange={handleLayoutSelect} />
      </div>
    </div>
  );
}
