"use client";

import { useEffect, useState } from "react";

function resolveDark(): boolean {
  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(resolveDark());

    const update = () => setIsDark(resolveDark());
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    window.addEventListener("themechange", update);
    media.addEventListener("change", update);
    return () => {
      window.removeEventListener("themechange", update);
      media.removeEventListener("change", update);
    };
  }, []);

  return isDark;
}
