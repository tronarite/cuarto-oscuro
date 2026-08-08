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
import type { FeatureLevel } from "@/generated/prisma/enums";

export interface UploadFormState {
  error?: string;
  skipped?: boolean;
}

const PRIMARY_CHANCE = 0.12;
const SECONDARY_CHANCE = 0.22;

// Reparte el nivel de destacado al azar (entremezclado, sin salas): la
// mayoría sin etiquetar, algunas secundarias y unas pocas principales.
function randomFeatureLevel(): FeatureLevel {
  const roll = Math.random();
  if (roll < PRIMARY_CHANCE) return "PRIMARY";
  if (roll < PRIMARY_CHANCE + SECONDARY_CHANCE) return "SECONDARY";
  return "NONE";
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
  const order = (lastPhoto?.order ?? -1) + 1;

  const exif = await extractExif(buffer).catch(() => ({}) as ExtractedExif);
  const display = await generateDisplayImage(buffer);
  const thumb = await generateThumbImage(buffer);

  const photo = await prisma.photo.create({
    data: {
      galleryId,
      order,
      featureLevel: randomFeatureLevel(),
      contentHash,
      width: display.width,
      height: display.height,
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
  await writeUploadFile(paths.displayAbs, display.buffer);
  await writeUploadFile(paths.thumbAbs, thumb.buffer);

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

export async function setFeatureLevel(photoId: string, level: FeatureLevel) {
  const photo = await prisma.photo.update({
    where: { id: photoId },
    data: { featureLevel: level },
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

  // Cierra el hueco dejado en la secuencia.
  const siblings = await prisma.photo.findMany({
    where: { galleryId: photo.galleryId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  await prisma.$transaction(
    siblings.map((s, i) =>
      prisma.photo.update({ where: { id: s.id }, data: { order: i } }),
    ),
  );

  revalidatePath(`/admin/galleries/${photo.galleryId}`);
}

// Mueve una foto a la posición `targetIndex` dentro de la secuencia continua
// de la galería (arrastrar para reordenar), renumerando el resto.
export async function reorderPhoto(
  galleryId: string,
  photoId: string,
  targetIndex: number,
) {
  const siblings = await prisma.photo.findMany({
    where: { galleryId, id: { not: photoId } },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const clampedIndex = Math.max(0, Math.min(targetIndex, siblings.length));
  const newOrder = [...siblings];
  newOrder.splice(clampedIndex, 0, { id: photoId });

  await prisma.$transaction(
    newOrder.map((p, i) =>
      prisma.photo.update({ where: { id: p.id }, data: { order: i } }),
    ),
  );

  revalidatePath(`/admin/galleries/${galleryId}`);
}
