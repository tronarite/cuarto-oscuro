-- Índice fijo opcional para anclar una foto a una posición concreta.
ALTER TABLE "Photo" ADD COLUMN "pinnedPosition" INTEGER;
