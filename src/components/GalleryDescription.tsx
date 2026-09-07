"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Descripciones muy largas dejaban las fotos "abajo del todo": por
// defecto se recorta a 3 líneas y solo aparece "Leer más" si el texto
// realmente no cabe (se mide tras montar, comparando la altura real del
// párrafo recortado contra su altura sin recortar).
export function GalleryDescription({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div className="mt-4 max-w-2xl">
      <p
        ref={ref}
        className={`text-lg text-muted-foreground ${expanded ? "" : "line-clamp-3"}`}
      >
        {text}
      </p>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 text-sm text-muted-foreground underline transition-colors hover:text-accent"
        >
          {expanded ? "Leer menos" : "Leer más"}
        </button>
      )}
    </div>
  );
}
