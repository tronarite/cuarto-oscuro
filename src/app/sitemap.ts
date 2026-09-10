import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { resolveSiteUrl } from "@/lib/site-url";

// En vivo, no prerenderizado: en el build de Docker la base está vacía,
// así que un sitemap estático saldría con solo la portada y nunca se
// enteraría de las galerías nuevas.
export const dynamic = "force-dynamic";

// Solo entra lo que un visitante anónimo puede ver realmente: la
// portada, "Sobre mí" si está activada, y las galerías PÚBLICAS (las
// UNLISTED son "solo con el enlace" a propósito, y las PASSWORD no se
// exponen). lastModified de cada galería = su updatedAt, para que un
// crawler sepa cuándo merece la pena revisitar.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await resolveSiteUrl();

  const [settings, galleries] = await Promise.all([
    getSettings(),
    prisma.gallery.findMany({
      where: { privacy: "PUBLIC" },
      select: { slug: true, updatedAt: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];

  if (settings.aboutEnabled) {
    entries.push({
      url: `${base}/sobre-mi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const gallery of galleries) {
    entries.push({
      url: `${base}/galeria/${gallery.slug}`,
      lastModified: gallery.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}
