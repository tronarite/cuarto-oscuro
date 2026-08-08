export interface Pinnable {
  order: number;
  pinnedPosition: number | null;
}

// Coloca las fotos ancladas en su índice fijo y rellena los huecos con
// las demás siguiendo su orden relativo. Como el índice final (no el
// valor bruto de `order`) es lo que determina la posición mostrada, una
// foto anclada no se mueve aunque se borren o reordenen otras a su
// alrededor.
export function applyPinning<T extends Pinnable>(photos: T[]): T[] {
  const sorted = [...photos].sort((a, b) => a.order - b.order);
  const pinned = sorted
    .filter((p) => p.pinnedPosition != null)
    .sort((a, b) => (a.pinnedPosition as number) - (b.pinnedPosition as number));
  const unpinned = sorted.filter((p) => p.pinnedPosition == null);

  const result: T[] = [];
  let ui = 0;
  let pi = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (pi < pinned.length && (pinned[pi].pinnedPosition as number) <= i) {
      result.push(pinned[pi]);
      pi++;
    } else if (ui < unpinned.length) {
      result.push(unpinned[ui]);
      ui++;
    } else if (pi < pinned.length) {
      result.push(pinned[pi]);
      pi++;
    }
  }
  return result;
}
