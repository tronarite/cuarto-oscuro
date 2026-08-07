"use server";

import path from "node:path";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { extractExif, type ExtractedExif } from "@/lib/exif";
import { generateDisplayImage, generateThumbImage } from "@/lib/watermark";
import {
  photoPaths,
  writeUploadFile,
  deleteFileIfExists,
} from "@/lib/storage";

export interface UploadFormState {
  error?: string;
  skipped?: boolean;
}

// Sube una foto por llamada (el cliente itera secuencialmente sobre los
// archivos seleccionados). Mandar todas las fotos en una sola petición
// obliga a un límite de tamaño de cuerpo arbitrario que cualquier lote
// grande puede volver a superar; una foto por petición lo evita del todo.
export async function uploadPhoto(
  galleryId: string,
  _prevState: UploadFormState | undefined,
  formData: FormData,
): Promise<UploadFormState> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No se ha recibido ninguna foto." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");

  const existing = await prisma.photo.findUnique({
    where: { galleryId_contentHash: { galleryId, contentHash } },
    select: { id: true },
  });
  if (existing) {
    return { skipped: true };
  }

  const lastPhoto = await prisma.photo.findFirst({
    where: { galleryId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (lastPhoto?.order ?? -1) + 1;

  const exif = await extractExif(buffer).catch(() => ({}) as ExtractedExif);
  const displayBuffer = await generateDisplayImage(buffer);
  const thumbBuffer = await generateThumbImage(buffer);

  const photo = await prisma.photo.create({
    data: {
      galleryId,
      order: nextOrder,
      contentHash,
      originalPath: "",
      displayPath: "",
      thumbPath: "",
      cameraMake: exif.cameraMake,
      cameraModel: exif.cameraModel,
      lens: exif.lens,
      iso: exif.iso,
      aperture: exif.aperture,
      shutterSpeed: exif.shutterSpeed,
      focalLength: exif.focalLength,
      latitude: exif.latitude,
      longitude: exif.longitude,
      takenAt: exif.takenAt,
    },
  });

  const ext = path.extname(file.name) || ".jpg";
  const paths = photoPaths(galleryId, photo.id, ext);

  await writeUploadFile(paths.originalAbs, buffer);
  await writeUploadFile(paths.displayAbs, displayBuffer);
  await writeUploadFile(paths.thumbAbs, thumbBuffer);

  await prisma.photo.update({
    where: { id: photo.id },
    data: {
      originalPath: paths.originalRel,
      displayPath: paths.displayRel,
      thumbPath: paths.thumbRel,
    },
  });

  revalidatePath(`/admin/galleries/${galleryId}`);
  return {};
}

export async function updatePhotoDescription(
  photoId: string,
  description: string,
) {
  const photo = await prisma.photo.update({
    where: { id: photoId },
    data: { description: description || null },
  });
  revalidatePath(`/admin/galleries/${photo.galleryId}`);
}

export async function deletePhoto(photoId: string) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  const uploadsRoot = path.join(process.cwd(), "uploads");
  await deleteFileIfExists(path.join(uploadsRoot, photo.originalPath));
  await deleteFileIfExists(path.join(uploadsRoot, photo.displayPath));
  if (photo.thumbPath) {
    await deleteFileIfExists(path.join(uploadsRoot, photo.thumbPath));
  }

  await prisma.photo.delete({ where: { id: photoId } });
  revalidatePath(`/admin/galleries/${photo.galleryId}`);
}

export async function reorderPhotos(galleryId: string, photoIds: string[]) {
  await prisma.$transaction(
    photoIds.map((id, index) =>
      prisma.photo.update({ where: { id }, data: { order: index } }),
    ),
  );
  revalidatePath(`/admin/galleries/${galleryId}`);
}
