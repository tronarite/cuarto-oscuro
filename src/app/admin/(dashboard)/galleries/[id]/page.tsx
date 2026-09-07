import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { GalleryEditor } from "@/components/GalleryEditor";
import {
  updateGalleryTitle,
  updateGalleryDescription,
  updateGalleryPrivacy,
  updateGalleryPassword,
  updateGalleryLayout,
  deleteGallery,
} from "../actions";
import {
  uploadPhoto,
  updatePhotoDescription,
  toggleHomeFeatured,
  togglePinned,
  deletePhoto,
  reorderPhotos,
} from "./photo-actions";
import { PhotoUploadForm } from "@/components/PhotoUploadForm";
import { PhotoManagerList } from "@/components/PhotoManagerList";

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

  const boundDelete = deleteGallery.bind(null, gallery.id);
  const boundUpload = uploadPhoto.bind(null, gallery.id);
  const boundReorder = reorderPhotos.bind(null, gallery.id);

  return (
    <div className="flex flex-col lg:flex-row">
      <aside className="shrink-0 border-border px-6 py-8 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-96 lg:overflow-y-auto lg:border-r lg:px-8 lg:py-10">
        <div className="flex items-center justify-between">
          <Link
            href={`/galeria/${gallery.slug}`}
            target="_blank"
            className="text-xs text-muted-foreground underline"
          >
            Ver galería pública →
          </Link>
          <span className="text-xs text-muted-foreground">
            {gallery.visitCount} visitas
          </span>
        </div>

        <div className="mt-6">
          <GalleryEditor
            title={gallery.title}
            description={gallery.description ?? ""}
            privacy={gallery.privacy}
            layout={gallery.layout}
            slug={gallery.slug}
            onTitleChange={updateGalleryTitle.bind(null, gallery.id)}
            onDescriptionChange={updateGalleryDescription.bind(null, gallery.id)}
            onPrivacyChange={updateGalleryPrivacy.bind(null, gallery.id)}
            onPasswordChange={updateGalleryPassword.bind(null, gallery.id)}
            onLayoutChange={updateGalleryLayout.bind(null, gallery.id)}
          />
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-medium">Subir fotos</h2>
          <div className="mt-2">
            <PhotoUploadForm action={boundUpload} />
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-4">
          <h2 className="text-sm font-medium text-red-700">Zona peligrosa</h2>
          <form action={boundDelete} className="mt-2">
            <button
              type="submit"
              className="rounded-full border border-red-300 px-3 py-1.5 text-xs text-red-700 transition-all hover:bg-red-50 active:scale-95"
            >
              Eliminar galería
            </button>
          </form>
        </section>
      </aside>

      <div className="flex-1 px-6 py-8 lg:px-8 lg:py-10">
        <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
          Vista previa — así se ve en la galería pública
        </p>
        {/* Mismo max-w que GalleryView.tsx en la web pública: sin esto,
            en pantallas anchas este contenedor (sin sidebar restando
            ancho) queda más ancho que lo que ve cualquier visitante, y
            la cuadrícula no coincide con la real. */}
        <div className="mx-auto max-w-[1180px]">
          <PhotoManagerList
            photos={gallery.photos}
            layout={gallery.layout}
            onReorder={boundReorder}
            onUpdateDescription={updatePhotoDescription}
            onToggleHomeFeatured={toggleHomeFeatured}
            onTogglePinned={togglePinned}
            onDelete={deletePhoto}
          />
        </div>
      </div>
    </div>
  );
}
