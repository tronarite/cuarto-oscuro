import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeaturedRail } from "@/components/FeaturedRail";
import { BackToTopButton } from "@/components/BackToTopButton";

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

  const railPhotos = featuredPhotos.map((photo) => ({
    id: photo.id,
    width: photo.width,
    height: photo.height,
    gallerySlug: photo.gallery.slug,
  }));

  return (
    <div className="flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <div className="flex w-full shrink-0 flex-col border-border px-6 pt-16 pb-16 lg:h-full lg:w-[26rem] lg:border-r lg:px-10 lg:pb-0">
        <div className="lg:shrink-0">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-4xl">
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
                className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sobre mí
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
                <span className="text-xl font-medium tracking-tight">
                  {gallery.title}
                </span>
                <span className="text-muted-foreground transition-transform duration-300 ease-out group-hover:translate-x-1">
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
            className="h-full"
          />
        </div>
      </div>

      <BackToTopButton />
    </div>
  );
}
