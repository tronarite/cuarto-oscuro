// Marca casi invisible por defecto (sin fondo ni cápsula, solo texto muy
// tenue) — se nota si te fijas o pasas el ratón, pero no compite con
// nada. Fija en la esquina inferior: no ocupa espacio en el flujo del
// documento (importante en la portada, que en escritorio es h-screen sin
// scroll propio) y queda por debajo de cualquier capa real de la
// interfaz (lightbox, modo presentación, etc. usan z-40/z-50).
export function PoweredByBadge() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-1.5 z-20 flex justify-center">
      <a
        href="https://github.com/tronarite/cuarto-oscuro"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto px-2 py-1 text-[9px] tracking-wide text-muted-foreground/30 transition-colors hover:text-muted-foreground/70"
      >
        Powered by Cuarto Oscuro
      </a>
    </div>
  );
}
