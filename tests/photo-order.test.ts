import { describe, expect, it } from "vitest";
import { applyPinning, type Pinnable } from "@/lib/photo-order";

interface P extends Pinnable {
  id: string;
}

const ids = (photos: P[]) => photos.map((p) => p.id);

describe("applyPinning", () => {
  it("ordena por `order` cuando no hay nada anclado", () => {
    const photos: P[] = [
      { id: "c", order: 2, pinnedPosition: null },
      { id: "a", order: 0, pinnedPosition: null },
      { id: "b", order: 1, pinnedPosition: null },
    ];
    expect(ids(applyPinning(photos))).toEqual(["a", "b", "c"]);
  });

  it("mantiene una foto anclada en su índice aunque cambie el orden de las demás", () => {
    const photos: P[] = [
      { id: "a", order: 0, pinnedPosition: null },
      { id: "b", order: 1, pinnedPosition: null },
      { id: "pin", order: 5, pinnedPosition: 0 },
      { id: "c", order: 2, pinnedPosition: null },
    ];
    expect(ids(applyPinning(photos))).toEqual(["pin", "a", "b", "c"]);
  });

  it("coloca varias ancladas en sus posiciones respectivas", () => {
    const photos: P[] = [
      { id: "u1", order: 0, pinnedPosition: null },
      { id: "u2", order: 1, pinnedPosition: null },
      { id: "u3", order: 2, pinnedPosition: null },
      { id: "p1", order: 3, pinnedPosition: 1 },
      { id: "p2", order: 4, pinnedPosition: 3 },
    ];
    expect(ids(applyPinning(photos))).toEqual(["u1", "p1", "u2", "p2", "u3"]);
  });

  it("no muta el array recibido", () => {
    const photos: P[] = [
      { id: "b", order: 1, pinnedPosition: null },
      { id: "a", order: 0, pinnedPosition: null },
    ];
    const snapshot = ids(photos);
    applyPinning(photos);
    expect(ids(photos)).toEqual(snapshot);
  });

  it("deja el resultado con la misma cantidad de fotos", () => {
    const photos: P[] = [
      { id: "a", order: 0, pinnedPosition: 10 },
      { id: "b", order: 1, pinnedPosition: null },
    ];
    expect(applyPinning(photos)).toHaveLength(2);
  });
});
