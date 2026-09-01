"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

// Se dispara al cambiar de tema con el botón, para que
// useSyncExternalStore sepa que debe volver a leer el snapshot (la
// preferencia del sistema ya dispara su propio evento "change", pero un
// clic nuestro en localStorage no avisa a nadie por sí solo).
const THEME_EVENT = "theme-change";

function prefersDarkMedia() {
  return window.matchMedia("(prefers-color-scheme: dark)");
}

// Lee un estado externo al propio React (localStorage / preferencia del
// sistema): useSyncExternalStore es la forma correcta de sincronizar con
// eso, en vez de leerlo en un efecto y volcarlo a useState (eso dispara
// un render extra en cascada innecesario).
function subscribe(callback: () => void) {
  const media = prefersDarkMedia();
  media.addEventListener("change", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getSnapshot(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return prefersDarkMedia().matches ? "dark" : "light";
}

function getServerSnapshot(): Theme | null {
  return null; // Desconocido hasta montar en el cliente.
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  if (theme === null) {
    return <div className={`h-8 w-8 ${className}`} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
      className={`flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground opacity-70 transition-all duration-300 ease-out hover:bg-surface hover:text-accent hover:opacity-100 active:scale-90 ${className}`}
    >
      {theme === "dark" ? "☀︎" : "☾"}
    </button>
  );
}
