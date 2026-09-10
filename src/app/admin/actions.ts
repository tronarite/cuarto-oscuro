"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAdminSession, destroyAdminSession } from "@/lib/admin-auth";
import {
  checkRateLimit,
  registerFailure,
  registerSuccess,
} from "@/lib/rate-limit";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function loginAdmin(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const key = `login:${await clientIp()}`;
  const limit = checkRateLimit(key);
  if (limit.blocked) {
    const mins = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return { error: `Demasiados intentos fallidos. Prueba de nuevo en ${mins} min.` };
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.adminPasswordHash) {
    redirect("/admin/setup");
  }

  // Se comparan ambos siempre (aunque el usuario ya haya fallado), para
  // no dar pistas por timing de cuál de los dos campos es el incorrecto.
  const passwordValid = password
    ? await bcrypt.compare(password, settings.adminPasswordHash)
    : false;
  // adminUsername null = instalación sin usuario fijado todavía: se
  // sigue entrando solo con la contraseña, como antes de este cambio.
  const usernameValid =
    settings.adminUsername == null || username === settings.adminUsername;

  if (!passwordValid || !usernameValid) {
    registerFailure(key);
    return { error: "Usuario o contraseña incorrectos." };
  }

  registerSuccess(key);
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect("/admin/login");
}
