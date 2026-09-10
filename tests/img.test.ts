import { describe, expect, it } from "vitest";
import { thumbSrcSet } from "@/lib/img";

describe("thumbSrcSet", () => {
  const srcset = thumbSrcSet("abc123");
  const entries = srcset.split(", ");

  it("incluye un candidato por cada ancho más el archivo base", () => {
    expect(entries).toEqual([
      "/api/img/thumb/abc123?w=320 320w",
      "/api/img/thumb/abc123?w=480 480w",
      "/api/img/thumb/abc123?w=640 640w",
      "/api/img/thumb/abc123?w=960 960w",
      "/api/img/thumb/abc123 1280w",
    ]);
  });

  it("solo el mayor apunta a la ruta sin ?w=", () => {
    const withoutQuery = entries.filter((e) => !e.includes("?w="));
    expect(withoutQuery).toEqual(["/api/img/thumb/abc123 1280w"]);
  });
});
