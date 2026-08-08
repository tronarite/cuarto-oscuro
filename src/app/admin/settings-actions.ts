"use server";

import { revalidatePath } from "next/cache";
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
