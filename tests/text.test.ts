import { describe, expect, it } from "vitest";
import { truncateForMeta } from "@/lib/text";

describe("truncateForMeta", () => {
  it("deja intacto un texto por debajo del límite y lo recorta de espacios", () => {
    expect(truncateForMeta("  Una galería breve  ")).toBe("Una galería breve");
  });

  it("no añade puntos suspensivos cuando cabe justo", () => {
    const exact = "a".repeat(200);
    expect(truncateForMeta(exact)).toBe(exact);
  });

  it("corta por la última palabra completa y añade puntos suspensivos", () => {
    const text = `${"palabra ".repeat(40)}final`;
    const out = truncateForMeta(text, 50);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(51);
    expect(out).not.toContain("palabr…");
    expect(out.trimEnd().slice(0, -1).trim().split(" ").at(-1)).toBe("palabra");
  });

  it("respeta un máximo personalizado", () => {
    expect(truncateForMeta("uno dos tres cuatro cinco", 9)).toBe("uno dos…");
  });

  it("corta a la fuerza cuando no hay ningún espacio antes del límite", () => {
    const out = truncateForMeta("xxxxxxxxxxxxxxxxxxxx palabra", 10);
    expect(out).toBe("xxxxxxxxxx…");
  });
});
