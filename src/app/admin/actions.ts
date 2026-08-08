"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAdminSession, destroyAdminSession } from "@/lib/admin-auth";

export async function loginAdmin(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.adminPasswordHash) {
    redirect("/admin/setup");
  }

  const valid = password
    ? await bcrypt.compare(password, settings.adminPasswordHash)
    : false;
  if (!valid) {
    return { error: "Contraseña incorrecta." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect("/admin/login");
}
