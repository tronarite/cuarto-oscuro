export type GalleryTemplate = "few" | "medium" | "many";

export function pickTemplate(photoCount: number): GalleryTemplate {
  if (photoCount <= 6) return "few";
  if (photoCount <= 24) return "medium";
  return "many";
}

const ROOM_SIZE: Record<GalleryTemplate, number> = {
  few: Infinity, // una sola sala, sin dividir
  medium: 6,
  many: 10,
};

export function chunkIntoRooms<T>(items: T[], template: GalleryTemplate): T[][] {
  const size = ROOM_SIZE[template];
  if (!isFinite(size)) return items.length ? [items] : [];

  const rooms: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rooms.push(items.slice(i, i + size));
  }
  return rooms;
}
