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
    include: { _count: { select: { photos: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Panel de administración</h1>
        <Link
          href="/admin/galleries/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Nueva galería
        </Link>
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        Galerías creadas: {galleries.length}
      </p>

      <ul className="mt-8 space-y-3">
        {galleries.map((gallery) => (
          <li key={gallery.id}>
            <Link
              href={`/admin/galleries/${gallery.id}`}
              className="block rounded-lg border border-neutral-200 px-4 py-3 hover:border-neutral-400"
            >
              <p className="font-medium">{gallery.title}</p>
              <p className="text-sm text-neutral-500">
                /{gallery.slug} · {PRIVACY_LABEL[gallery.privacy]} ·{" "}
                {gallery._count.photos} fotos · {gallery.visitCount} visitas
              </p>
            </Link>
          </li>
        ))}
        {galleries.length === 0 && (
          <li className="text-sm text-neutral-500">
            Todavía no hay galerías.
          </li>
        )}
      </ul>
    </main>
  );
}
