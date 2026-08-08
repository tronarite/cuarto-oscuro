import Link from "next/link";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeaturedRail } from "@/components/FeaturedRail";

export default async function Home() {
  const [galleries, featuredPhotos] = await Promise.all([
    prisma.gallery.findMany({
      where: { privacy: "PUBLIC" },
      orderBy: { createdAt: "desc" },
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
  ]);

  const railPhotos = featuredPhotos.map((photo) => ({
    id: photo.id,
    width: photo.width,
    height: photo.height,
    gallerySlug: photo.gallery.slug,
  }));

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
                className="group flex items-center justify-between py-4 transition-all duration-300 hover:text-muted-foreground active:scale-[0.98]"
              >
                <span>
                  <span className="block text-xl font-medium tracking-tight">
                    {gallery.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {gallery.visitCount} {gallery.visitCount === 1 ? "visita" : "visitas"}
                  </span>
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

      <div className="hidden flex-1 justify-center overflow-hidden py-6 lg:flex">
        <div className="h-[calc(100vh-3rem)] w-full max-w-4xl px-6">
          <FeaturedRail photos={railPhotos} className="h-full" />
        </div>
      </div>
    </div>
  );
}
