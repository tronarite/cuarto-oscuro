import Link from "next/link";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeaturedRail } from "@/components/FeaturedRail";
import { slotSizeForIndex } from "@/lib/grid-templates";

export default async function Home() {
  const galleries = await prisma.gallery.findMany({
    where: { privacy: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    include: {
      photos: {
        orderBy: { order: "asc" },
        select: { id: true, width: true, height: true },
      },
    },
  });

  // El raíl muestra las fotos que caen en un hueco "grande" según la
  // plantilla de su propia galería — no hace falta marcarlas aparte.
  const railPhotos = galleries.flatMap((gallery) =>
    gallery.photos
      .map((photo, i) => ({ photo, slotSize: slotSizeForIndex(gallery.layout, i) }))
      .filter((p) => p.slotSize === "LARGE")
      .map(({ photo }) => ({
        id: photo.id,
        width: photo.width,
        height: photo.height,
        gallerySlug: gallery.slug,
      })),
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="w-full shrink-0 border-border px-6 py-16 lg:w-[26rem] lg:border-r lg:px-10">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold tracking-tight">
            Galería fotográfica
          </h1>
          <ThemeToggle />
        </div>

        <ul className="mt-12 divide-y divide-border">
          {galleries.map((gallery) => (
            <li key={gallery.id}>
              <Link
                href={`/galeria/${gallery.slug}`}
                className="group flex items-center justify-between py-4 text-xl font-medium tracking-tight transition-colors duration-300 hover:text-muted-foreground"
              >
                {gallery.title}
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

      <div className="hidden flex-1 justify-center overflow-hidden py-6 lg:flex">
        <div className="h-[calc(100vh-3rem)] w-full max-w-xl px-6">
          <FeaturedRail photos={railPhotos} className="h-full" />
        </div>
      </div>
    </div>
  );
}
