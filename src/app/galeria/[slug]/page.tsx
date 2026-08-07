import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hasGalleryUnlock } from "@/lib/gallery-access";
import { groupByRoom } from "@/lib/gallery-layout";
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
      photos: { orderBy: [{ groupIndex: "asc" }, { order: "asc" }] },
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

  const roomCount = groupByRoom(gallery.photos).length || 1;

  return (
    <main className="relative px-6 py-16">
      <AmbientTexture roomCount={roomCount} />
      <div className="mx-auto flex max-w-5xl items-start justify-between">
        <div>
          <h1 className="text-3xl font-medium">{gallery.title}</h1>
          {gallery.description && (
            <p className="mt-2 text-muted-foreground">{gallery.description}</p>
          )}
        </div>
        <ThemeToggle />
      </div>

      <div className="mt-4">
        <GalleryView photos={gallery.photos} />
      </div>

      {tripPoints.length > 0 && (
        <div className="mx-auto mt-16 max-w-5xl">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
            Mapa del viaje
          </h2>
          <TripMapLoader points={tripPoints} />
        </div>
      )}
    </main>
  );
}
