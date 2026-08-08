"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateAboutPhoto } from "@/lib/about-photo";
import { aboutPhotoPath, writeUploadFile, deleteFileIfExists } from "@/lib/storage";

export interface AboutPhotoState {
  error?: string;
}

export async function uploadAboutPhoto(
  _prevState: AboutPhotoState | undefined,
  formData: FormData,
): Promise<AboutPhotoState> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No se ha recibido ninguna foto." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await generateAboutPhoto(buffer);
  const paths = aboutPhotoPath();
  await writeUploadFile(paths.abs, processed.buffer);

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      aboutPhotoPath: paths.rel,
      aboutPhotoWidth: processed.width,
      aboutPhotoHeight: processed.height,
    },
    create: {
      id: 1,
      aboutPhotoPath: paths.rel,
      aboutPhotoWidth: processed.width,
      aboutPhotoHeight: processed.height,
    },
  });

  revalidatePath("/sobre-mi");
  revalidatePath("/admin/settings");
  return {};
}

export async function deleteAboutPhoto() {
  const paths = aboutPhotoPath();
  await deleteFileIfExists(paths.abs);
  await prisma.settings.update({
    where: { id: 1 },
    data: { aboutPhotoPath: null, aboutPhotoWidth: null, aboutPhotoHeight: null },
  });
  revalidatePath("/sobre-mi");
  revalidatePath("/admin/settings");
}
