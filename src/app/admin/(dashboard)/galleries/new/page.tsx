import { GalleryForm } from "@/components/GalleryForm";
import { createGallery } from "@/app/admin/(dashboard)/galleries/actions";

export default function NewGalleryPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-medium">Nueva galería</h1>
      <div className="mt-8">
        <GalleryForm action={createGallery} submitLabel="Crear galería" />
      </div>
    </main>
  );
}
