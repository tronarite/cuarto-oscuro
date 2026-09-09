"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type {
  ColorPack,
  PhotoCorner,
  WatermarkMethod,
  WatermarkStyle,
  WatermarkCorner,
} from "@/generated/prisma/enums";

export async function updateWatermarkSettings(
  enabled: boolean,
  text: string,
  method: WatermarkMethod,
  style: WatermarkStyle,
  corner: WatermarkCorner,
) {
  const data = {
    watermarkEnabled: enabled,
    watermarkText: text,
    watermarkMethod: method,
    watermarkStyle: style,
    watermarkCorner: corner,
  };
  await prisma.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  revalidatePath("/admin/settings");
  // Las fotos ya subidas no se regeneran solas: si se cambia de método
  // (superpuesta/incrustada) o estilo, hace falta "Reprocesar fotos" para
  // que el cambio se note en lo que ya había, igual que con la calidad o
  // el propio texto de la marca.
  revalidatePath("/", "layout");
}

// BETA: ver src/lib/vision.ts. El interruptor se puede activar sin la
// variable de entorno GOOGLE_VISION_API_KEY configurada — simplemente
// no hará nada al subir fotos hasta que se añada.
export async function updateAutoCaption(enabled: boolean) {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { autoCaptionEnabled: enabled },
    create: { id: 1, autoCaptionEnabled: enabled },
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

export async function updateColorPack(pack: ColorPack) {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { colorPack: pack },
    create: { id: 1, colorPack: pack },
  });
  // El pack se aplica en el <html> del layout raíz: afecta a toda la
  // web, no solo a esta página de ajustes.
  revalidatePath("/", "layout");
}

export async function updateAboutEnabled(enabled: boolean) {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { aboutEnabled: enabled },
    create: { id: 1, aboutEnabled: enabled },
  });
  revalidatePath("/");
  revalidatePath("/sobre-mi");
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

export async function updateAboutButtonLabel(label: string) {
  const aboutButtonLabel = label.trim() || "Sobre mí";
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { aboutButtonLabel },
    create: { id: 1, aboutButtonLabel },
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function updatePhotoCorner(corner: PhotoCorner) {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { photoCorner: corner },
    create: { id: 1, photoCorner: corner },
  });
  // El radio se aplica en el <html> del layout raíz: afecta a toda la
  // web, no solo a esta página de ajustes.
  revalidatePath("/", "layout");
}

export interface AdminCredentialsState {
  error?: string;
  success?: boolean;
}

const MIN_PASSWORD_LENGTH = 8;
const MIN_USERNAME_LENGTH = 3;

// Usuario y contraseña se cambian juntos en un único formulario. La
// contraseña actual siempre es obligatoria (para confirmar identidad);
// el usuario nuevo es opcional (se puede fijar por primera vez o dejar
// como está), y la contraseña nueva también es opcional — si se dejan
// vacíos "nueva contraseña"/"repetir", la contraseña no cambia.
export async function updateAdminCredentials(
  _prevState: AdminCredentialsState | undefined,
  formData: FormData,
): Promise<AdminCredentialsState> {
  const current = String(formData.get("current") ?? "");
  const newUsername = String(formData.get("username") ?? "").trim();
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

  if (newUsername && newUsername.length < MIN_USERNAME_LENGTH) {
    return {
      error: `El usuario debe tener al menos ${MIN_USERNAME_LENGTH} caracteres.`,
    };
  }

  const wantsPasswordChange = next.length > 0 || confirm.length > 0;
  let adminPasswordHash: string | undefined;
  if (wantsPasswordChange) {
    if (next.length < MIN_PASSWORD_LENGTH) {
      return {
        error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      };
    }
    if (next !== confirm) {
      return { error: "Las contraseñas nuevas no coinciden." };
    }
    adminPasswordHash = await bcrypt.hash(next, 10);
  }

  await prisma.settings.update({
    where: { id: 1 },
    data: {
      ...(adminPasswordHash ? { adminPasswordHash } : {}),
      ...(newUsername ? { adminUsername: newUsername } : {}),
    },
  });
  revalidatePath("/admin/settings");
  return { success: true };
}
