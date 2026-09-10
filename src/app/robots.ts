import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

// En vivo: SITE_URL no existe durante el build de Docker (solo en
// runtime, vía compose), así que estático quedaría con la URL de
// localhost pegada.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await resolveSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // El panel de admin, la API y las páginas de desbloqueo por
      // contraseña no tienen nada que indexar (y no deberían salir en
      // resultados).
      disallow: ["/admin", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
