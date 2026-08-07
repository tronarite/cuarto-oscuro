"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify, randomSlugSuffix } from "@/lib/slug";
import { deleteGalleryUploads } from "@/lib/storage";
import type { Privacy } from "@/generated/prisma/enums";

async function uniqueSlug(base: string): Promise<string> {
  const initial = slugify(base) || "galeria";
  let slug = initial;
  while (await prisma.gallery.findUnique({ where: { slug } })) {
    slug = `${initial}-${randomSlugSuffix()}`;
  }
  return slug;
}

export interface GalleryFormState {
  error?: string;
}

export async function createGallery(
  _prevState: GalleryFormState | undefined,
  formData: FormData,
): Promise<GalleryFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const privacy = String(formData.get("privacy") ?? "PUBLIC") as Privacy;
  const password = String(formData.get("password") ?? "");
  const tripStart = String(formData.get("tripStart") ?? "");
  const tripEnd = String(formData.get("tripEnd") ?? "");

  if (!title) return { error: "El título es obligatorio." };
  if (privacy === "PASSWORD" && !password) {
    return { error: "Introduce una contraseña para esta galería." };
  }

  const slug = await uniqueSlug(title);
  const passwordHash =
    privacy === "PASSWORD" ? await bcrypt.hash(password, 10) : null;

  const gallery = await prisma.gallery.create({
    data: {
      title,
      slug,
      description: description || null,
      privacy,
      passwordHash,
      tripStart: tripStart ? new Date(tripStart) : null,
      tripEnd: tripEnd ? new Date(tripEnd) : null,
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/galleries/${gallery.id}`);
}

export async function updateGallery(
  galleryId: string,
  _prevState: GalleryFormState | undefined,
  formData: FormData,
): Promise<GalleryFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const privacy = String(formData.get("privacy") ?? "PUBLIC") as Privacy;
  const password = String(formData.get("password") ?? "");
  const tripStart = String(formData.get("tripStart") ?? "");
  const tripEnd = String(formData.get("tripEnd") ?? "");

  if (!title) return { error: "El título es obligatorio." };
  if (privacy === "PASSWORD" && !password) {
    const existing = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: { passwordHash: true },
    });
    if (!existing?.passwordHash) {
      return { error: "Introduce una contraseña para esta galería." };
    }
  }

  const passwordHash =
    privacy === "PASSWORD" && password
      ? await bcrypt.hash(password, 10)
      : privacy === "PASSWORD"
        ? undefined
        : null;

  await prisma.gallery.update({
    where: { id: galleryId },
    data: {
      title,
      description: description || null,
      privacy,
      ...(passwordHash !== undefined ? { passwordHash } : {}),
      tripStart: tripStart ? new Date(tripStart) : null,
      tripEnd: tripEnd ? new Date(tripEnd) : null,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/galleries/${galleryId}`);
  return {};
}

export async function deleteGallery(galleryId: string) {
  await prisma.gallery.delete({ where: { id: galleryId } });
  await deleteGalleryUploads(galleryId);
  revalidatePath("/admin");
  redirect("/admin");
}
