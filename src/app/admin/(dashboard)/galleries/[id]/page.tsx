import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { GalleryForm } from "@/components/GalleryForm";
import { updateGallery, deleteGallery } from "../actions";
import {
  uploadPhoto,
  updatePhotoDescription,
  setFeatureLevel,
  deletePhoto,
  reorderPhoto,
} from "./photo-actions";
import { PhotoUploadForm } from "@/components/PhotoUploadForm";
import { PhotoManagerList } from "@/components/PhotoManagerList";

function toDateInputValue(date: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

export default async function EditGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: "asc" } },
    },
  });

  if (!gallery) notFound();

  const boundUpdate = updateGallery.bind(null, gallery.id);
  const boundDelete = deleteGallery.bind(null, gallery.id);
  const boundUpload = uploadPhoto.bind(null, gallery.id);
  const boundReorder = reorderPhoto.bind(null, gallery.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">{gallery.title}</h1>
        <Link
          href={`/galeria/${gallery.slug}`}
          target="_blank"
          className="text-sm text-neutral-500 underline"
        >
          Ver galería pública →
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        /{gallery.slug} · {gallery.visitCount} visitas
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Datos de la galería</h2>
        <div className="mt-4">
          <GalleryForm
            action={boundUpdate}
            submitLabel="Guardar cambios"
            defaultValues={{
              title: gallery.title,
              description: gallery.description ?? undefined,
              privacy: gallery.privacy,
              tripStart: toDateInputValue(gallery.tripStart),
              tripEnd: toDateInputValue(gallery.tripEnd),
              hasPassword: Boolean(gallery.passwordHash),
            }}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Fotos</h2>
        <div className="mt-4">
          <PhotoUploadForm action={boundUpload} />
        </div>
        <div className="mt-6">
          <PhotoManagerList
            photos={gallery.photos}
            onReorder={boundReorder}
            onSetFeatureLevel={setFeatureLevel}
            onUpdateDescription={updatePhotoDescription}
            onDelete={deletePhoto}
          />
        </div>
      </section>

      <section className="mt-12 border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-medium text-red-700">Zona peligrosa</h2>
        <form action={boundDelete} className="mt-3">
          <button
            type="submit"
            className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            Eliminar galería
          </button>
        </form>
      </section>
    </main>
  );
}
