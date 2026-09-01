import { prisma } from "@/lib/db";

// Fisher-Yates: para que las sugerencias salgan en orden distinto cada
// visita, sin el sesgo de un simple sort aleatorio.
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface GallerySuggestion {
  id: string;
  title: string;
  slug: string;
  photos: { id: string; width: number | null; height: number | null }[];
}

// Reutilizado tanto en el pie de una galería ("Puede que también te
// guste") como en la página 404 (para no dejar un callejón sin salida
// si el enlace estaba roto). excludeId se omite en la 404, donde no hay
// una galería "actual" que descartar.
export async function getGallerySuggestions(
  excludeId?: string,
  count = 2,
): Promise<GallerySuggestion[]> {
  const galleries = await prisma.gallery.findMany({
    where: {
      privacy: "PUBLIC",
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      photos: {
        take: 1,
        orderBy: { order: "asc" },
        select: { id: true, width: true, height: true },
      },
    },
  });
  return shuffle(galleries).slice(0, count);
}
