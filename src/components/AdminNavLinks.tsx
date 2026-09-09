"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/admin/actions";

// Resalta la sección activa de la cabecera del panel (hoy solo hay
// "Ajustes" aparte del propio inicio) para que quede claro dónde se
// está, sobre todo ahora que Ajustes vive en una página propia con
// bastante contenido debajo.
export function AdminNavLinks() {
  const pathname = usePathname();
  const onSettings = pathname?.startsWith("/admin/settings");

  return (
    <div className="flex items-center gap-4">
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
