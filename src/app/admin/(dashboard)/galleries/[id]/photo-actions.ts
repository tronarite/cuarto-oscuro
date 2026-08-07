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

const MIN_GROUP_SIZE = 3;
const MAX_GROUP_SIZE = 6;
const MAX_FEATURED_PER_GROUP = 2;
const FEATURED_CHANCE = 0.2;

// Decide en qué grupo cae la siguiente foto subida: sigue rellenando el
// último grupo hasta un tamaño aleatorio (3-6, nunca más de 6), luego
// empieza uno nuevo. Así los grupos no salen todos del mismo tamaño.
async function pickGroupForNewPhoto(
  galleryId: string,
): Promise<{ groupIndex: number; order: number; featured: boolean }> {
  const lastPhoto = await prisma.photo.findFirst({
    where: { galleryId },
    orderBy: [{ groupIndex: "desc" }, { order: "desc" }],
    select: { groupIndex: true },
  });

  if (!lastPhoto) {
    return { groupIndex: 0, order: 0, featured: false };
  }

  const currentGroupPhotos = await prisma.photo.findMany({
    where: { galleryId, groupIndex: lastPhoto.groupIndex },
    select: { featured: true },
  });

  const groupCap =
    MIN_GROUP_SIZE +
    Math.floor(Math.random() * (MAX_GROUP_SIZE - MIN_GROUP_SIZE + 1));

  const groupIndex =
    currentGroupPhotos.length >= groupCap
      ? lastPhoto.groupIndex + 1
      : lastPhoto.groupIndex;
  const order =
    groupIndex === lastPhoto.groupIndex ? currentGroupPhotos.length : 0;
  const featuredSoFar =
    groupIndex === lastPhoto.groupIndex
      ? currentGroupPhotos.filter((p) => p.featured).length
      : 0;

  const featured =
    featuredSoFar < MAX_FEATURED_PER_GROUP && Math.random() < FEATURED_CHANCE;

  return { groupIndex, order, featured };
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

  const { groupIndex, order, featured } = await pickGroupForNewPhoto(galleryId);

  const exif = await extractExif(buffer).catch(() => ({}) as ExtractedExif);
  const display = await generateDisplayImage(buffer);
  const thumb = await generateThumbImage(buffer);

  const photo = await prisma.photo.create({
    data: {
      galleryId,
      groupIndex,
      order,
      featured,
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

export async function toggleFeatured(photoId: string, featured: boolean) {
  const photo = await prisma.photo.update({
    where: { id: photoId },
    data: { featured },
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

  // Cierra el hueco dejado en su grupo de origen.
  const siblings = await prisma.photo.findMany({
    where: { galleryId: photo.galleryId, groupIndex: photo.groupIndex },
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

// Mueve una foto a la posición `targetIndex` del grupo `targetGroupIndex`
// (arrastre entre grupos, o reordenar dentro del mismo grupo), renumerando
// tanto el grupo de origen como el de destino para que queden sin huecos.
export async function movePhoto(
  galleryId: string,
  photoId: string,
  targetGroupIndex: number,
  targetIndex: number,
) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo || photo.galleryId !== galleryId) return;

  const sourceGroupIndex = photo.groupIndex;
  const sameGroup = sourceGroupIndex === targetGroupIndex;

  const targetSiblings = await prisma.photo.findMany({
    where: {
      galleryId,
      groupIndex: targetGroupIndex,
      id: { not: photoId },
    },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const clampedIndex = Math.max(0, Math.min(targetIndex, targetSiblings.length));
  const newTargetOrder = [...targetSiblings];
  newTargetOrder.splice(clampedIndex, 0, { id: photoId });

  const updates = newTargetOrder.map((p, i) =>
    prisma.photo.update({
      where: { id: p.id },
      data: {
        order: i,
        ...(p.id === photoId ? { groupIndex: targetGroupIndex } : {}),
      },
    }),
  );

  if (!sameGroup) {
    const sourceSiblings = await prisma.photo.findMany({
      where: { galleryId, groupIndex: sourceGroupIndex, id: { not: photoId } },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    updates.push(
      ...sourceSiblings.map((p, i) =>
        prisma.photo.update({ where: { id: p.id }, data: { order: i } }),
      ),
    );
  }

  await prisma.$transaction(updates);
  revalidatePath(`/admin/galleries/${galleryId}`);
}
