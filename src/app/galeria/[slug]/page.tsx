import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hasGalleryUnlock } from "@/lib/gallery-access";
import { getGallerySuggestions } from "@/lib/gallery-suggestions";
import { PasswordGate } from "@/components/PasswordGate";
import { GalleryView } from "@/components/GalleryView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GallerySuggestions } from "@/components/GallerySuggestions";
import { BackToTopButton } from "@/components/BackToTopButton";
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

  const [settings, suggestions] = await Promise.all([
    getSettings(),
    getGallerySuggestions(gallery.id),
  ]);

  return (
    <main className="relative">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight transition-colors hover:text-accent"
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

      <GallerySuggestions galleries={suggestions} />

      <BackToTopButton />
    </main>
  );
}
