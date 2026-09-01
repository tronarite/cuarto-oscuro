import { cache } from "react";
import { prisma } from "@/lib/db";

// cache() de React: cada página y el layout raíz llaman a getSettings()
// por su cuenta (título de pestaña, header, ajustes de portada...), así
// que sin esto se repetiría la misma consulta varias veces por request.
export const getSettings = cache(async () => {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
});
