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
    <div className="flex flex-col lg:flex-row">
      <aside className="shrink-0 border-border px-6 py-8 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-80 lg:overflow-y-auto lg:border-r lg:px-6">
        <Link
          href={`/galeria/${gallery.slug}`}
          target="_blank"
          className="text-xs text-neutral-500 underline"
        >
          Ver galería pública →
        </Link>
        <h1 className="mt-1 text-xl font-medium">{gallery.title}</h1>
        <p className="mt-0.5 text-xs text-neutral-500">
          /{gallery.slug} · {gallery.visitCount} visitas
        </p>

        <section className="mt-6">
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
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-medium">Subir fotos</h2>
          <div className="mt-2">
            <PhotoUploadForm action={boundUpload} />
          </div>
        </section>

        <section className="mt-8 border-t border-neutral-200 pt-4">
          <h2 className="text-sm font-medium text-red-700">Zona peligrosa</h2>
          <form action={boundDelete} className="mt-2">
            <button
              type="submit"
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
            >
              Eliminar galería
            </button>
          </form>
        </section>
      </aside>

      <div className="flex-1 px-6 py-8">
        <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
          Vista previa — así se ve en la galería pública
        </p>
        <PhotoManagerList
          photos={gallery.photos}
          onReorder={boundReorder}
          onSetFeatureLevel={setFeatureLevel}
          onUpdateDescription={updatePhotoDescription}
          onDelete={deletePhoto}
        />
      </div>
    </div>
  );
}
