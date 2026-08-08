import Link from "next/link";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeaturedRail } from "@/components/FeaturedRail";

export default async function Home() {
  const [galleries, primaryPhotos] = await Promise.all([
    prisma.gallery.findMany({
      where: { privacy: "PUBLIC" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.photo.findMany({
      where: { featureLevel: "PRIMARY", gallery: { privacy: "PUBLIC" } },
      select: {
        id: true,
        width: true,
        height: true,
        gallery: { select: { slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  const railPhotos = primaryPhotos.map((p) => ({
    id: p.id,
    width: p.width,
    height: p.height,
    gallerySlug: p.gallery.slug,
  }));
  const leftRail = railPhotos.filter((_, i) => i % 2 === 0);
  const rightRail = railPhotos.filter((_, i) => i % 2 === 1);

  return (
    <div className="relative">
      <FeaturedRail
        photos={leftRail}
        direction="up"
        className="fixed inset-y-0 left-4 hidden w-40 xl:block"
      />
      <FeaturedRail
        photos={rightRail}
        direction="down"
        className="fixed inset-y-0 right-4 hidden w-40 xl:block"
      />

      <main className="mx-auto max-w-3xl px-6 py-24">
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
      </main>
    </div>
  );
}
