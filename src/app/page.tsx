import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toWatermarkDisplaySettings } from "@/lib/watermark-svg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeaturedRail } from "@/components/FeaturedRail";
import { BackToTopButton } from "@/components/BackToTopButton";
import { FlowerMark } from "@/components/FlowerMark";

// Sin esto, un build de producción deja esta página pre-renderizada de
// forma estática: el conteo de visitas (y la lista de galerías) se
// queda congelado con el valor que tenía en el momento del build y no
// se entera de las visitas nuevas. force-dynamic obliga a recalcularla
// en cada petición.
export const dynamic = "force-dynamic";

// Al compartir la portada: mismo título/descripción que ya pone
// layout.tsx (siteTitle/siteSubtitle), con una foto destacada de
// cualquier galería pública como imagen de vista previa — la misma idea
// que el raíl de la propia portada, sin recorrer todas las fotos.
export async function generateMetadata(): Promise<Metadata> {
  const [settings, cover] = await Promise.all([
    getSettings(),
    prisma.photo.findFirst({
      where: { homeFeatured: true, gallery: { privacy: "PUBLIC" } },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const description = settings.siteSubtitle || "Galería fotográfica personal";

  return {
    title: settings.siteTitle,
    description,
    openGraph: {
      title: settings.siteTitle,
      description,
      images: cover ? [`/api/img/thumb/${cover.id}`] : undefined,
    },
  };
}

export default async function Home() {
  const [settings, galleries, featuredPhotos, visitAggregate] = await Promise.all([
    getSettings(),
    prisma.gallery.findMany({
      where: { privacy: "PUBLIC" },
      orderBy: { order: "asc" },
    }),
    prisma.photo.findMany({
      where: { homeFeatured: true, gallery: { privacy: "PUBLIC" } },
      select: {
        id: true,
        width: true,
        height: true,
        gallery: { select: { slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Suma de todas las galerías, no solo las públicas listadas aquí: es
    // el total de visitas a la web en sí, no un desglose por galería.
    prisma.gallery.aggregate({ _sum: { visitCount: true } }),
  ]);
  const totalVisits = visitAggregate._sum.visitCount ?? 0;
  const watermark = toWatermarkDisplaySettings(settings);

  const railPhotos = featuredPhotos.map((photo) => ({
    id: photo.id,
    width: photo.width,
    height: photo.height,
    gallerySlug: photo.gallery.slug,
  }));

  return (
    <div className="flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <div className="flex w-full shrink-0 flex-col border-border px-6 pt-10 pb-16 lg:h-full lg:w-[26rem] lg:border-r lg:px-10 lg:pb-0">
        <div className="lg:shrink-0">
          <Link href="/" className="inline-block transition-transform duration-300 ease-out hover:scale-110">
            <FlowerMark className="h-9 w-9" />
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-4xl">
              {settings.siteTitle}
            </h1>
            <ThemeToggle className="mt-1 shrink-0" />
          </div>
          {settings.siteSubtitle && (
            <p className="mt-2 text-lg text-muted-foreground">
              {settings.siteSubtitle}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {totalVisits} {totalVisits === 1 ? "visita" : "visitas"}
            </p>
            {settings.aboutEnabled && (
              <Link
                href="/sobre-mi"
                className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-accent"
              >
                {settings.aboutButtonLabel}
              </Link>
            )}
          </div>
        </div>

        {/* Raíl horizontal: solo en móvil/tablet, entre la cabecera y la
            lista. Sale de los márgenes laterales (-mx-6) para llegar al
            borde de la pantalla, igual que el raíl vertical llega al
            borde superior/inferior en escritorio. */}
        <div className="mt-8 -mx-6 h-40 sm:h-52 lg:hidden">
          <FeaturedRail
            photos={railPhotos}
            orientation="horizontal"
            watermark={watermark}
            className="h-full"
          />
        </div>

        <ul className="no-scrollbar mt-8 divide-y divide-border pb-8 lg:mt-12 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-5">
          {galleries.map((gallery) => (
            <li key={gallery.id}>
              <Link
                href={`/galeria/${gallery.slug}`}
                className="group flex items-center justify-between py-4 transition-all duration-300 hover:text-muted-foreground active:scale-[0.98]"
              >
                <span className="font-display text-xl font-medium tracking-tight">
                  {gallery.title}
                </span>
                <span className="text-muted-foreground transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:text-accent">
                  →
                </span>
              </Link>
            </li>
          ))}
          {galleries.length === 0 && (
            <li className="py-4 text-muted-foreground">
              Todavía no hay galerías públicas.
            </li>
          )}
        </ul>
      </div>

      <div className="hidden flex-1 justify-center overflow-hidden lg:flex">
        <div className="h-full w-full max-w-4xl px-6">
          <FeaturedRail
            photos={railPhotos}
            orientation="vertical"
            watermark={watermark}
            className="h-full"
          />
        </div>
      </div>

      <BackToTopButton />
    </div>
  );
}
