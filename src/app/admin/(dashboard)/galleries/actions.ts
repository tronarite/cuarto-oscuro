"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify, randomSlugSuffix } from "@/lib/slug";
import { deleteGalleryUploads } from "@/lib/storage";
import type { Privacy, GalleryLayout } from "@/generated/prisma/enums";

async function uniqueSlug(base: string): Promise<string> {
  const initial = slugify(base) || "galeria";
  let slug = initial;
  while (await prisma.gallery.findUnique({ where: { slug } })) {
    slug = `${initial}-${randomSlugSuffix()}`;
  }
  return slug;
}

export interface FieldState {
  error?: string;
}

// Crear una galería solo pide el título; todo lo demás (privacidad,
// cuadrícula, fechas, fotos) se ajusta después en la página de edición,
// donde cada campo se guarda solo al cambiarlo.
export async function createGallery(
  _prevState: FieldState | undefined,
  formData: FormData,
): Promise<FieldState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "El título es obligatorio." };

  const slug = await uniqueSlug(title);
  const gallery = await prisma.gallery.create({
    data: { title, slug },
  });

  revalidatePath("/admin");
  redirect(`/admin/galleries/${gallery.id}`);
}

export async function updateGalleryTitle(
  galleryId: string,
  title: string,
): Promise<FieldState> {
  const trimmed = title.trim();
  if (!trimmed) return { error: "El título no puede quedar vacío." };

  await prisma.gallery.update({ where: { id: galleryId }, data: { title: trimmed } });
  revalidatePath("/admin");
  revalidatePath(`/admin/galleries/${galleryId}`);
  return {};
}

export async function updateGalleryDescription(galleryId: string, description: string) {
  await prisma.gallery.update({
    where: { id: galleryId },
    data: { description: description.trim() || null },
  });
  revalidatePath(`/admin/galleries/${galleryId}`);
}

export async function updateGalleryLayout(galleryId: string, layout: GalleryLayout) {
  await prisma.gallery.update({ where: { id: galleryId }, data: { layout } });
  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath("/");
}

// Para pública / no listada: cambia directo. La contraseña tiene su
// propia acción porque además hay que fijar el hash.
export async function updateGalleryPrivacy(
  galleryId: string,
  privacy: Extract<Privacy, "PUBLIC" | "UNLISTED">,
) {
  await prisma.gallery.update({
    where: { id: galleryId },
    data: { privacy, passwordHash: null },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath("/");
}

export async function updateGalleryPassword(
  galleryId: string,
  password: string,
): Promise<FieldState> {
  if (!password) return { error: "Escribe una contraseña." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.gallery.update({
    where: { id: galleryId },
    data: { privacy: "PASSWORD", passwordHash },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath("/");
  return {};
}

export async function deleteGallery(galleryId: string) {
  await prisma.gallery.delete({ where: { id: galleryId } });
  await deleteGalleryUploads(galleryId);
  revalidatePath("/admin");
  redirect("/admin");
}
