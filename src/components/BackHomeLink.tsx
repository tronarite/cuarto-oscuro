import Link from "next/link";

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out group-hover:-translate-x-0.5"
    >
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

// Cabecera de las páginas que cuelgan de la portada (galería, "Sobre
// mí", 404): antes era un simple "← {título}" de texto suelto. Ahora es
// un botón en forma de píldora con un icono de verdad en vez del
// carácter "←", a juego con el resto de botones de la web.
export function BackHomeLink({ siteTitle }: { siteTitle: string }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-semibold tracking-tight transition-all hover:border-accent hover:text-accent active:scale-95"
    >
      <ArrowLeftIcon />
      {siteTitle}
    </Link>
  );
}
