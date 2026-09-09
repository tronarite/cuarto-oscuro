import Link from "next/link";
import { prisma } from "@/lib/db";
import { reorderGalleries } from "./galleries/actions";
import { GalleryGrid } from "@/components/GalleryGrid";

export default async function AdminPage() {
  const galleries = await prisma.gallery.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { photos: true } },
      photos: { take: 1, orderBy: { order: "asc" }, select: { id: true } },
    },
  });

  return (
    <main className="mx-auto max-w-[1600px] px-8 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Panel de administración</h1>
        <Link
          href="/admin/galleries/new"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all active:scale-95"
        >
          Nueva galería
        </Link>
      </div>

      <div className="mt-8">
        {galleries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay galerías.</p>
        ) : (
          <GalleryGrid galleries={galleries} onReorder={reorderGalleries} />
        )}
      </div>
    </main>
  );
}
