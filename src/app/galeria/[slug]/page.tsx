import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hasGalleryUnlock } from "@/lib/gallery-access";
import { PasswordGate } from "@/components/PasswordGate";
import { GalleryView } from "@/components/GalleryView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AmbientTexture } from "@/components/AmbientTexture";
import { unlockGallery } from "./unlock-actions";

// Fisher-Yates: para que las sugerencias de otras galerías salgan en
// orden distinto cada visita, sin el sesgo de un simple sort aleatorio.
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { order: "asc" } },
    },
  });

  if (!gallery) notFound();

  const admin = await isAdminAuthed();

  if (!admin && gallery.privacy === "PASSWORD") {
    const unlocked = await hasGalleryUnlock(gallery.id);
    if (!unlocked) {
      const boundUnlock = unlockGallery.bind(null, slug);
      return <PasswordGate title={gallery.title} action={boundUnlock} />;
    }
  }

  if (!admin) {
    await prisma.gallery.update({
      where: { id: gallery.id },
      data: { visitCount: { increment: 1 } },
    });
  }

  const [settings, otherGalleries] = await Promise.all([
    getSettings(),
    prisma.gallery.findMany({
      where: { privacy: "PUBLIC", id: { not: gallery.id } },
      include: {
        photos: { take: 1, orderBy: { order: "asc" }, select: { id: true, width: true, height: true } },
      },
    }),
  ]);
  const suggestions = shuffle(otherGalleries).slice(0, 2);

  // Sin salas ya: usamos el número de fotos como pulso para el
  // controlador de textura ambiental (cuánto "recorrido" tiene la página).
  const roomCount = Math.max(1, Math.ceil(gallery.photos.length / 8));

  return (
    <main className="relative">
      <AmbientTexture roomCount={roomCount} />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight transition-colors hover:text-muted-foreground"
          >
            ← {settings.siteTitle}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-6 pt-16">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {gallery.title}
        </h1>
        {gallery.description && (
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {gallery.description}
          </p>
        )}
      </div>

      <div className="px-6 pb-24">
        <GalleryView photos={gallery.photos} layout={gallery.layout} />
      </div>

      {suggestions.length > 0 && (
        <div className="mx-auto max-w-5xl px-6 pb-24">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
            Puede que también te guste
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {suggestions.map((suggested) => {
              const cover = suggested.photos[0];
              return (
                <Link
                  key={suggested.id}
                  href={`/galeria/${suggested.slug}`}
                  className="group block overflow-hidden rounded-2xl bg-surface"
                >
                  <div
                    className="w-full overflow-hidden"
                    style={{
                      aspectRatio:
                        cover?.width && cover?.height
                          ? `${cover.width} / ${cover.height}`
                          : "16 / 9",
                    }}
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/img/thumb/${cover.id}`}
                        alt=""
                        draggable={false}
                        className="h-full w-full select-none object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        Sin fotos
                      </div>
                    )}
                  </div>
                  <p className="px-4 py-3 text-lg font-medium tracking-tight">
                    {suggested.title}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
