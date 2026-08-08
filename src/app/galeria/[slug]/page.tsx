import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hasGalleryUnlock } from "@/lib/gallery-access";
import { PasswordGate } from "@/components/PasswordGate";
import { GalleryView } from "@/components/GalleryView";
import { TripMapLoader } from "@/components/TripMapLoader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AmbientTexture } from "@/components/AmbientTexture";
import { unlockGallery } from "./unlock-actions";

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

  const tripPoints = gallery.photos
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({ id: p.id, lat: p.latitude as number, lng: p.longitude as number }));

  // Sin salas ya: usamos el número de fotos como pulso para el
  // controlador de textura ambiental (cuánto "recorrido" tiene la página).
  const roomCount = Math.max(1, Math.ceil(gallery.photos.length / 8));

  return (
    <main className="relative">
      <AmbientTexture roomCount={roomCount} />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">
            {gallery.title}
          </span>
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
        <GalleryView photos={gallery.photos} />
      </div>

      {tripPoints.length > 0 && (
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-16">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
            Mapa del viaje
          </h2>
          <TripMapLoader points={tripPoints} />
        </div>
      )}
    </main>
  );
}
