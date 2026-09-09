"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/admin/actions";

// Resalta la sección activa de la cabecera del panel para que quede
// claro dónde se está, sobre todo ahora que Ajustes vive en una página
// propia con bastante contenido debajo. "Galerías" lleva al mismo sitio
// que el logo/título de la cabecera (/admin) — se añade igualmente como
// enlace de texto para que tenga el mismo peso visual que "Ajustes" en
// vez de ser la única sección sin su propio botón.
export function AdminNavLinks() {
  const pathname = usePathname();
  const onSettings = pathname?.startsWith("/admin/settings");
  const onGalleries = !onSettings;

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/admin"
        className={`text-sm transition-all active:scale-95 ${
          onGalleries
            ? "font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Galerías
      </Link>
      <span className="h-4 w-px bg-border" aria-hidden />
      <Link
        href="/admin/settings"
        className={`text-sm transition-all active:scale-95 ${
          onSettings
            ? "font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Ajustes
      </Link>
      <span className="h-4 w-px bg-border" aria-hidden />
      <form action={logoutAdmin}>
        <button
          type="submit"
          className="text-sm text-muted-foreground transition-all hover:text-foreground active:scale-95"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
