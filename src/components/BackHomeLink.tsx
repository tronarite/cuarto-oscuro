import Link from "next/link";
import { FlowerMark } from "@/components/FlowerMark";

// Cabecera de las páginas que cuelgan de la portada (galería, "Sobre
// mí", 404): antes era un simple "← {título}" de texto suelto, luego un
// botón en píldora con una flecha de verdad. Ahora la propia flor del
// favicon hace de icono para volver a la portada, la misma marca en
// toda la web (ver también FlowerMark en page.tsx).
export function BackHomeLink({ siteTitle }: { siteTitle: string }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-semibold tracking-tight transition-all hover:border-accent hover:text-accent active:scale-95"
    >
      <FlowerMark className="h-4 w-4 shrink-0 transition-transform duration-300 ease-out group-hover:scale-110" />
      {siteTitle}
    </Link>
  );
}
