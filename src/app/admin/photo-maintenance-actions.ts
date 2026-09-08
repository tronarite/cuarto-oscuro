"use server";

import path from "node:path";
import fs from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateDisplayImage, generateThumbImage } from "@/lib/watermark";
import { getSettings } from "@/lib/settings";
import { detectPhotoCaption } from "@/lib/vision";

// Vuelve a generar display/thumb de TODAS las fotos ya subidas a partir
// de su original guardado, con la calidad/ajustes de marca de agua
// actuales. Hace falta porque esos archivos se generan una sola vez al
// subir la foto: cambiar la calidad o la marca de agua después no
// afecta a lo ya subido a menos que se reprocese explícitamente.
export async function reprocessAllPhotos(): Promise<{ count: number; failed: number }> {
  const settings = await getSettings();
  const watermark = {
    enabled: settings.watermarkEnabled,
    text: settings.watermarkText,
  };
  const uploadsRoot = path.join(process.cwd(), "uploads");

  const photos = await prisma.photo.findMany({
    select: { id: true, originalPath: true, displayPath: true, thumbPath: true },
  });

  let count = 0;
  let failed = 0;

  for (const photo of photos) {
    try {
      const buffer = await fs.readFile(path.join(uploadsRoot, photo.originalPath));
      const display = await generateDisplayImage(buffer, watermark);
      const thumb = await generateThumbImage(buffer, watermark);

      await fs.writeFile(path.join(uploadsRoot, photo.displayPath), display.buffer);
      if (photo.thumbPath) {
        await fs.writeFile(path.join(uploadsRoot, photo.thumbPath), thumb.buffer);
      }

      await prisma.photo.update({
        where: { id: photo.id },
        data: { width: display.width, height: display.height },
      });
      count++;
    } catch {
      failed++;
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return { count, failed };
}

// BETA: aplica la identificación automática (ver src/lib/vision.ts) a
// las fotos ya subidas que todavía no tienen pie de foto — no toca las
// que ya tienen uno puesto a mano, aunque Vision pudiera dar un
// resultado distinto. Igual que reprocessAllPhotos, es una acción
// puntual pensada para lanzar una vez, no algo que se dispare solo.
export async function identifyExistingPhotos(): Promise<{
  count: number;
  skipped: number;
  failed: number;
}> {
  const uploadsRoot = path.join(process.cwd(), "uploads");

  const photos = await prisma.photo.findMany({
    where: { description: null },
    select: {
      id: true,
      thumbPath: true,
      galleryId: true,
      gallery: { select: { slug: true } },
    },
  });

  let count = 0;
  let skipped = 0;
  let failed = 0;
  const affectedGalleries = new Map<string, string>(); // galleryId -> slug

  for (const photo of photos) {
    if (!photo.thumbPath) {
      skipped++;
      continue;
    }
    try {
      const buffer = await fs.readFile(path.join(uploadsRoot, photo.thumbPath));
      const caption = await detectPhotoCaption(buffer);
      if (!caption) {
        skipped++;
        continue;
      }
      await prisma.photo.update({ where: { id: photo.id }, data: { description: caption } });
      affectedGalleries.set(photo.galleryId, photo.gallery.slug);
      count++;
    } catch {
      failed++;
    }
  }

  for (const [galleryId, slug] of affectedGalleries) {
    revalidatePath(`/admin/galleries/${galleryId}`);
    revalidatePath(`/galeria/${slug}`);
  }
  return { count, skipped, failed };
}
