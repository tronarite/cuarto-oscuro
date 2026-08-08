"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAdminSession } from "@/lib/admin-auth";

export interface SetupState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 8;

// Crea la contraseña de administrador la primera vez que se visita el
// panel (proxy.ts manda aquí mientras Settings.adminPasswordHash sea
// null). A partir de aquí el acceso funciona como un login normal.
export async function setupAdminPassword(
  _prevState: SetupState | undefined,
  formData: FormData,
): Promise<SetupState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  if (settings.adminPasswordHash) {
    redirect("/admin/login");
  }

  const adminPasswordHash = await bcrypt.hash(password, 10);
  await prisma.settings.update({
    where: { id: 1 },
    data: { adminPasswordHash },
  });

  await createAdminSession();
  redirect("/admin");
}
