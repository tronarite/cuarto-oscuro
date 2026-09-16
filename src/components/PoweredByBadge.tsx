// Marca casi invisible por defecto (sin fondo ni cápsula, solo texto muy
// tenue) — se nota si te fijas o pasas el ratón, pero no compite con
// nada. Fija en la esquina inferior: no ocupa espacio en el flujo del
// documento (importante en la portada, que en escritorio es h-screen sin
// scroll propio) y queda por debajo de cualquier capa real de la
// interfaz (lightbox, modo presentación, etc. usan z-40/z-50).
//
// El segundo enlace (autor/sitio personal) es opcional y viene de
// AUTHOR_URL: en el repo público no hay ningún enlace personal fijo,
// cada despliegue pone el suyo (o ninguno) en su propio .env.
export function PoweredByBadge() {
  const authorUrl = process.env.AUTHOR_URL;
  const authorLabel = authorLabelFor(authorUrl);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-1.5 z-20 flex items-center justify-center gap-1.5">
      <a
        href="https://github.com/tronarite/cuarto-oscuro"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto px-2 py-1 text-[9px] tracking-wide text-muted-foreground/30 transition-colors hover:text-muted-foreground/70"
      >
        Powered by Cuarto Oscuro
      </a>
      {authorUrl && authorLabel && (
        <>
          <span className="text-[9px] text-muted-foreground/20">·</span>
          <a
            href={authorUrl}
            className="pointer-events-auto px-2 py-1 text-[9px] tracking-wide text-muted-foreground/30 transition-colors hover:text-muted-foreground/70"
          >
            {authorLabel}
          </a>
        </>
      )}
    </div>
  );
}

function authorLabelFor(authorUrl: string | undefined): string | null {
  if (!authorUrl) return null;
  try {
    return new URL(authorUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
