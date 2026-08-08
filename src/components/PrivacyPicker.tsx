"use client";

import type { Privacy } from "@/generated/prisma/enums";

const OPTIONS: { value: Privacy; label: string; description: string }[] = [
  { value: "PUBLIC", label: "Pública", description: "Listada en la portada" },
  { value: "UNLISTED", label: "No listada", description: "Solo con el enlace" },
  { value: "PASSWORD", label: "Con contraseña", description: "Protegida" },
];

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" />
      <ellipse cx="12" cy="12" rx="3.5" ry="8.5" />
      <path d="M4 12h16" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <rect x="3" y="8.5" width="9" height="7" rx="3.5" transform="rotate(-45 7.5 12)" />
      <rect x="12" y="8.5" width="9" height="7" rx="3.5" transform="rotate(-45 16.5 12)" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const ICON: Record<Privacy, React.ComponentType> = {
  PUBLIC: GlobeIcon,
  UNLISTED: LinkIcon,
  PASSWORD: LockIcon,
};

export function PrivacyPicker({
  value,
  onChange,
}: {
  value: Privacy;
  onChange: (privacy: Privacy) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((option) => {
        const Icon = ICON[option.value];
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all active:scale-95 ${
              selected
                ? "border-foreground bg-surface"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <Icon />
            <span className="text-xs font-medium">{option.label}</span>
            <span className="text-[10px] text-muted-foreground">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
