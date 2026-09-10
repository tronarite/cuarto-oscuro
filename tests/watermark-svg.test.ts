import { describe, expect, it } from "vitest";
import { buildWatermarkSvg } from "@/lib/watermark-svg";

describe("buildWatermarkSvg", () => {
  it("usa el viewBox con las medidas reales de la foto en todos los estilos", () => {
    for (const style of ["TILED", "FULL", "CORNER"] as const) {
      const svg = buildWatermarkSvg(1600, 1200, {
        text: "© Foto",
        style,
        corner: "BOTTOM_RIGHT",
      });
      expect(svg).toContain('viewBox="0 0 1600 1200"');
    }
  });

  it("en modo raster fija width/height en píxeles", () => {
    const svg = buildWatermarkSvg(800, 600, {
      text: "x",
      style: "TILED",
      corner: "BOTTOM_RIGHT",
    });
    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="600"');
  });

  it("en modo responsive escala al contenedor", () => {
    const svg = buildWatermarkSvg(800, 600, {
      text: "x",
      style: "FULL",
      corner: "BOTTOM_RIGHT",
    }, "responsive");
    expect(svg).toContain('width="100%"');
    expect(svg).toContain('height="100%"');
  });

  it("usa slice para el ajuste cover y meet para contain", () => {
    const base = { text: "x", style: "CORNER", corner: "TOP_LEFT" } as const;
    expect(
      buildWatermarkSvg(10, 10, base, "responsive", "cover"),
    ).toContain("xMidYMid slice");
    expect(
      buildWatermarkSvg(10, 10, base, "responsive", "contain"),
    ).toContain("xMidYMid meet");
  });

  it("escapa el texto para no romper el XML", () => {
    const svg = buildWatermarkSvg(100, 100, {
      text: 'A & B <c> "d"',
      style: "FULL",
      corner: "BOTTOM_RIGHT",
    });
    expect(svg).toContain("A &amp; B &lt;c&gt;");
    expect(svg).not.toContain("<c>");
  });
});
