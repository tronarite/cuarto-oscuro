-- Orden manual de galerías (panel de admin y portada). Se rellena luego
-- a partir del orden actual (createdAt desc) para no alterar nada visible.
ALTER TABLE "Gallery" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
