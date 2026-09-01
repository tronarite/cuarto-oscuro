// Marca discreta, fija en la esquina inferior: no ocupa espacio en el
// flujo del documento (importante en la portada, que en escritorio es
// h-screen sin scroll propio) y queda por debajo de cualquier capa real
// de la interfaz (lightbox, modo presentación, etc. usan z-40/z-50).
export function PoweredByBadge() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-20 flex justify-center">
      <a
        href="https://github.com/tronarite/cuarto-oscuro"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto rounded-full bg-background/60 px-2.5 py-1 text-[10px] text-muted-foreground/70 backdrop-blur-sm transition-colors hover:text-muted-foreground"
      >
        Powered by Cuarto Oscuro
      </a>
    </div>
  );
}
