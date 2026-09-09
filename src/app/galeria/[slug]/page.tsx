import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toWatermarkDisplaySettings } from "@/lib/watermark-svg";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hasGalleryUnlock } from "@/lib/gallery-access";
import { getGallerySuggestions } from "@/lib/gallery-suggestions";
import { PasswordGate } from "@/components/PasswordGate";
import { GalleryView } from "@/components/GalleryView";
import { GalleryDescription } from "@/components/GalleryDescription";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GallerySuggestions } from "@/components/GallerySuggestions";
import { BackToTopButton } from "@/components/BackToTopButton";
import { BackHomeLink } from "@/components/BackHomeLink";
import { unlockGallery } from "./unlock-actions";

// Al compartir el enlace de una galería: título, descripción y una de
// sus fotos destacadas (o la primera si no hay ninguna marcada) como
// imagen de vista previa. Si está protegida con contraseña, no se
// expone ni foto ni descripción propias — un crawler de WhatsApp/
// Twitter no pasa por el PasswordGate, así que hacerlo sería una fuga.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      privacy: true,
      photos: {
        select: { id: true, homeFeatured: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!gallery) return {};

  if (gallery.privacy === "PASSWORD") {
    const description = "Galería protegida con contraseña.";
    return {
      title: gallery.title,
      description,
      openGraph: { title: gallery.title, description },
    };
  }

  const cover = gallery.photos.find((p) => p.homeFeatured) ?? gallery.photos[0];
  const description = gallery.description || "Galería fotográfica personal.";

  return {
    title: gallery.title,
    description,
    openGraph: {
      title: gallery.title,
      description,
      images: cover ? [`/api/img/thumb/${cover.id}`] : undefined,
    },
  };
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

  const [settings, suggestions] = await Promise.all([
    getSettings(),
    getGallerySuggestions(gallery.id),
  ]);
  const watermark = toWatermarkDisplaySettings(settings);

  return (
    <main className="relative">
      {admin && gallery.privacy === "PASSWORD" && (
        <div className="border-b border-border bg-surface px-6 py-2 text-center text-xs text-muted-foreground">
          Estás viendo esta galería protegida por contraseña porque has
          iniciado sesión como administrador — cualquier otra persona verá
          la pantalla de contraseña.
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <BackHomeLink siteTitle={settings.siteTitle} />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-10 pt-16 sm:pb-14 sm:pt-20">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {gallery.title}
        </h1>
        {gallery.description && <GalleryDescription text={gallery.description} />}
      </div>

      <div className="px-6 pb-24">
        <GalleryView photos={gallery.photos} layout={gallery.layout} watermark={watermark} />
      </div>

      <GallerySuggestions galleries={suggestions} watermark={watermark} />

      <BackToTopButton />
    </main>
  );
}
