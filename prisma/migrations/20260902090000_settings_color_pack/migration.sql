-- Paleta de color de toda la web, elegida por el admin (4 packs en
-- blanco y negro, cada uno con su versión clara y oscura).
ALTER TABLE "Settings" ADD COLUMN "colorPack" TEXT NOT NULL DEFAULT 'WARM';
