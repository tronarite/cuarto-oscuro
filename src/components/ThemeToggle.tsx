"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    setTheme(stored ?? (systemPrefersDark() ? "dark" : "light"));
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event("themechange"));
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
      className={`flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground opacity-70 transition-all duration-300 ease-out hover:bg-surface hover:opacity-100 active:scale-90 ${className}`}
    >
      {theme === "dark" ? "☀︎" : "☾"}
    </button>
  );
}
