"use server";

import path from "node:path";
import fs from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateDisplayImage, generateThumbImage } from "@/lib/watermark";
import { getSettings } from "@/lib/settings";

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
