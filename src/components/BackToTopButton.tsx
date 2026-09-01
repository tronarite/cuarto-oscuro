"use client";

import { useSyncExternalStore } from "react";

const SHOW_AFTER_PX = 480;

// El scroll es estado externo a React, igual que el tema en
// ThemeToggle: useSyncExternalStore evita el efecto+setState que
// dispararía un render extra en cascada.
function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function getSnapshot() {
  return window.scrollY > SHOW_AFTER_PX;
}

function getServerSnapshot() {
  return false; // Al cargar siempre se empieza arriba del todo.
}

function ArrowUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

// En la portada de escritorio (h-screen sin scroll propio) window.scrollY
// nunca pasa del umbral, así que el botón simplemente no aparece ahí: no
// hace falta condicionarlo, se resuelve solo.
export function BackToTopButton() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-300 hover:text-foreground active:scale-90 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUpIcon />
    </button>
  );
}
