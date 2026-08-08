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
      where: {
        featureLevel: { in: ["PRIMARY", "SECONDARY"] },
        gallery: { privacy: "PUBLIC" },
      },
      select: {
        id: true,
        width: true,
        height: true,
        featureLevel: true,
        gallery: { select: { slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const railPhotos = featuredPhotos.map((p) => ({
    id: p.id,
    width: p.width,
    height: p.height,
    gallerySlug: p.gallery.slug,
    big: p.featureLevel === "PRIMARY",
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
        <div className="h-[calc(100vh-3rem)] w-full max-w-md px-6">
          <FeaturedRail photos={railPhotos} className="h-full" />
        </div>
      </div>
    </div>
  );
}
