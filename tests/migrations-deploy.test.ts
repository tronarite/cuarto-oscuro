import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// Regresión: las migraciones se escriben a mano y el nombre de la carpeta
// (timestamp) fija el orden de aplicación. Una vez una migración que
// BORRABA una columna quedó ordenada ANTES de la que la CREABA: en local
// nunca falló porque se aplicaban a mano en orden de creación, pero
// `prisma migrate deploy` sobre una base vacía (build de Docker) reventó.
// Este test replica ese escenario: aplicar TODAS las migraciones desde
// cero sobre una base nueva.

const tmpDir = mkdtempSync(path.join(tmpdir(), "cuarto-oscuro-migrations-"));

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("prisma migrate deploy desde cero", () => {
  it("aplica toda la cadena de migraciones sobre una base vacía", () => {
    const dbPath = path.join(tmpDir, "fresh.db");
    const output = execFileSync(
      "npx",
      ["prisma", "migrate", "deploy"],
      {
        cwd: path.resolve(__dirname, ".."),
        env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    expect(output).toMatch(
      /No pending migrations|migrations? have been successfully applied|already in sync/i,
    );
    expect(output).not.toMatch(/no such column/i);
  });
});
