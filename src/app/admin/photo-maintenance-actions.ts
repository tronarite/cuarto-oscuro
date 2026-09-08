"use server";

import path from "node:path";
import fs from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateDisplayImage, generateThumbImage } from "@/lib/watermark";
import { getSettings } from "@/lib/settings";
import { detectPhotoCaptionDetailed } from "@/lib/vision";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
// TODAS las fotos ya subidas, sin mirar si ya tienen pie de foto ni de
// dónde salió — simplemente se intenta regenerar cada una, y se
// sobreescribe si Gemini da un resultado claro (si no, se deja la que
// ya tuviera). Sirve tanto para rellenar huecos como para relanzar y
// mejorar resultados antiguos. Igual que reprocessAllPhotos, es una
// acción puntual pensada para lanzar cuando se quiera, no algo que se
// dispare solo.
export async function identifyExistingPhotos(): Promise<{
  count: number;
  skipped: number;
  failed: number;
}> {
  const uploadsRoot = path.join(process.cwd(), "uploads");

  const photos = await prisma.photo.findMany({
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

  // El plan gratis de Gemini Flash-Lite admite 15 peticiones/min: sin
  // pausa, un lote de más de esa cifra revienta la cuota a mitad de
  // camino y todo lo que viene después se queda silenciosamente sin
  // regenerar (aunque detectPhotoCaptionDetailed ya reintenta un fallo
  // puntual, aquí se evita provocarlo desde el principio). 4.5s de
  // margen entre fotos deja unas 13 peticiones/min, por debajo del
  // límite.
  const MIN_INTERVAL_MS = 4500;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (i > 0) await sleep(MIN_INTERVAL_MS);

    if (!photo.thumbPath) {
      skipped++;
      continue;
    }
    try {
      const buffer = await fs.readFile(path.join(uploadsRoot, photo.thumbPath));
      const { caption, error } = await detectPhotoCaptionDetailed(buffer);
      if (error) {
        failed++;
        continue;
      }
      if (!caption) {
        skipped++;
        continue;
      }
      await prisma.photo.update({
        where: { id: photo.id },
        data: { description: caption },
      });
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
