"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createGalleryUnlockSession } from "@/lib/gallery-access";

export interface UnlockFormState {
  error?: string;
}

export async function unlockGallery(
  slug: string,
  _prevState: UnlockFormState | undefined,
  formData: FormData,
): Promise<UnlockFormState> {
  const password = String(formData.get("password") ?? "");

  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    select: { id: true, passwordHash: true },
  });

  if (!gallery?.passwordHash) {
    return { error: "Esta galería no está protegida." };
  }

  const valid = await bcrypt.compare(password, gallery.passwordHash);
  if (!valid) {
    return { error: "Contraseña incorrecta." };
  }

  await createGalleryUnlockSession(gallery.id);
  redirect(`/galeria/${slug}`);
}
