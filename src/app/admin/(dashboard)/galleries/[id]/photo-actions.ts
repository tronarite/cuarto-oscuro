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
import { getSettings } from "@/lib/settings";

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
  const order = (lastPhoto?.order ?? -1) + 1;

  const settings = await getSettings();
  const watermark = {
    enabled: settings.watermarkEnabled,
    text: settings.watermarkText,
  };

  const exif = await extractExif(buffer).catch(() => ({}) as ExtractedExif);
  const display = await generateDisplayImage(buffer, watermark);
  const thumb = await generateThumbImage(buffer, watermark);

  const photo = await prisma.photo.create({
    data: {
      galleryId,
      order,
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

const MAX_HOME_FEATURED_PER_GALLERY = 3;

export interface ToggleHomeFeaturedResult {
  error?: string;
}

// Hasta 3 fotos por galería pueden marcarse para aparecer en el raíl de
// la portada. Se comprueba aquí (no en el esquema) porque SQLite no
// puede expresar "como mucho 3 filas true" como restricción.
export async function toggleHomeFeatured(
  photoId: string,
  next: boolean,
): Promise<ToggleHomeFeaturedResult> {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return { error: "Foto no encontrada." };

  if (next) {
    const count = await prisma.photo.count({
      where: { galleryId: photo.galleryId, homeFeatured: true },
    });
    if (count >= MAX_HOME_FEATURED_PER_GALLERY) {
      return { error: "Ya hay 3 fotos destacadas para portada en esta galería." };
    }
  }

  await prisma.photo.update({ where: { id: photoId }, data: { homeFeatured: next } });
  revalidatePath(`/admin/galleries/${photo.galleryId}`);
  revalidatePath("/");
  return {};
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

// Intercambia la posición de dos fotos (arrastrar una encima de otra):
// como el tamaño del hueco depende de la posición según la plantilla de
// la galería, esto es literalmente "cambiar de hueco" a las dos fotos.
export async function swapPhotoOrder(
  galleryId: string,
  photoIdA: string,
  photoIdB: string,
) {
  if (photoIdA === photoIdB) return;

  const [a, b] = await Promise.all([
    prisma.photo.findUnique({ where: { id: photoIdA }, select: { order: true, galleryId: true } }),
    prisma.photo.findUnique({ where: { id: photoIdB }, select: { order: true, galleryId: true } }),
  ]);
  if (!a || !b || a.galleryId !== galleryId || b.galleryId !== galleryId) return;

  await prisma.$transaction([
    prisma.photo.update({ where: { id: photoIdA }, data: { order: b.order } }),
    prisma.photo.update({ where: { id: photoIdB }, data: { order: a.order } }),
  ]);

  revalidatePath(`/admin/galleries/${galleryId}`);
}
