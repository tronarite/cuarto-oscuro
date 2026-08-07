export interface Groupable {
  groupIndex: number;
  order: number;
}

// Agrupa fotos por el grupo visual asignado (al subir, o reorganizado a
// mano arrastrando en el panel de admin), ordenadas dentro de cada grupo.
export function groupByRoom<T extends Groupable>(photos: T[]): T[][] {
  const groups = new Map<number, T[]>();
  for (const photo of photos) {
    const list = groups.get(photo.groupIndex) ?? [];
    list.push(photo);
    groups.set(photo.groupIndex, list);
  }
  for (const list of groups.values()) list.sort((a, b) => a.order - b.order);
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([, list]) => list);
}
