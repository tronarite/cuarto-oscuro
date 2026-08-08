"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function updateWatermarkSettings(
  enabled: boolean,
  text: string,
) {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { watermarkEnabled: enabled, watermarkText: text },
    create: { id: 1, watermarkEnabled: enabled, watermarkText: text },
  });
  revalidatePath("/admin/settings");
}

export async function updateSiteText(title: string, subtitle: string) {
  const siteTitle = title.trim() || "Galería fotográfica";
  const siteSubtitle = subtitle.trim() || null;
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { siteTitle, siteSubtitle },
    create: { id: 1, siteTitle, siteSubtitle },
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function updateAboutText(text: string) {
  const aboutText = text.trim() || null;
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { aboutText },
    create: { id: 1, aboutText },
  });
  revalidatePath("/sobre-mi");
  revalidatePath("/admin/settings");
}

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
}

const MIN_PASSWORD_LENGTH = 8;

export async function changeAdminPassword(
  _prevState: ChangePasswordState | undefined,
  formData: FormData,
): Promise<ChangePasswordState> {
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.adminPasswordHash) {
    return { error: "No hay contraseña configurada todavía." };
  }

  const valid = await bcrypt.compare(current, settings.adminPasswordHash);
  if (!valid) {
    return { error: "La contraseña actual no es correcta." };
  }
  if (next.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }
  if (next !== confirm) {
    return { error: "Las contraseñas nuevas no coinciden." };
  }

  const adminPasswordHash = await bcrypt.hash(next, 10);
  await prisma.settings.update({ where: { id: 1 }, data: { adminPasswordHash } });
  revalidatePath("/admin/settings");
  return { success: true };
}
