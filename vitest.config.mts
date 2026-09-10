import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // El test de migraciones lanza la CLI de Prisma contra una base
    // temporal; dale margen de sobra frente al timeout por defecto (5 s).
    testTimeout: 60_000,
  },
});
