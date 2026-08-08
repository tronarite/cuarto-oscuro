import Link from "next/link";
import { prisma } from "@/lib/db";

const PRIVACY_LABEL: Record<string, string> = {
  PUBLIC: "Pública",
  UNLISTED: "Enlace no listado",
  PASSWORD: "Con contraseña",
};

export default async function AdminPage() {
  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true } },
      photos: { take: 1, orderBy: { order: "asc" }, select: { id: true } },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Panel de administración</h1>
        <Link
          href="/admin/galleries/new"
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-all active:scale-95"
        >
          Nueva galería
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {galleries.map((gallery) => (
          <Link
            key={gallery.id}
            href={`/admin/galleries/${gallery.id}`}
            className="group block overflow-hidden rounded-2xl border border-neutral-200 transition-all active:scale-[0.98]"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100">
              {gallery.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/img/thumb/${gallery.photos[0].id}`}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                  Sin fotos
                </div>
              )}
            </div>
            <div className="px-3 py-2.5">
              <p className="truncate font-medium">{gallery.title}</p>
              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {PRIVACY_LABEL[gallery.privacy]} · {gallery._count.photos} fotos ·{" "}
                {gallery.visitCount} visitas
              </p>
            </div>
          </Link>
        ))}
        {galleries.length === 0 && (
          <p className="col-span-full text-sm text-neutral-500">
            Todavía no hay galerías.
          </p>
        )}
      </div>
    </main>
  );
}
