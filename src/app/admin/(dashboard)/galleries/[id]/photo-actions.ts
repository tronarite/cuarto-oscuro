"use server";

import path from "node:path";
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
  uploaded?: number;
}

export async function uploadPhotos(
  galleryId: string,
  _prevState: UploadFormState | undefined,
  formData: FormData,
): Promise<UploadFormState> {
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { error: "Selecciona al menos una foto." };
  }

  const lastPhoto = await prisma.photo.findFirst({
    where: { galleryId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  let nextOrder = (lastPhoto?.order ?? -1) + 1;

  let uploaded = 0;
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const exif = await extractExif(buffer).catch(() => ({}) as ExtractedExif);
    const displayBuffer = await generateDisplayImage(buffer);
    const thumbBuffer = await generateThumbImage(buffer);

    const photo = await prisma.photo.create({
      data: {
        galleryId,
        order: nextOrder++,
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

    uploaded++;
  }

  revalidatePath(`/admin/galleries/${galleryId}`);
  return { uploaded };
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
