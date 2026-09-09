-- Marca de agua: método (superpuesta / incrustada) y estilo (repetida /
-- completa / esquina), ver WatermarkMethod/WatermarkStyle/WatermarkCorner
-- en schema.prisma. Los valores por defecto reproducen exactamente el
-- único comportamiento que había hasta ahora (incrustada, repetida).
ALTER TABLE "Settings" ADD COLUMN "watermarkMethod" TEXT NOT NULL DEFAULT 'EMBEDDED';
ALTER TABLE "Settings" ADD COLUMN "watermarkStyle" TEXT NOT NULL DEFAULT 'TILED';
ALTER TABLE "Settings" ADD COLUMN "watermarkCorner" TEXT NOT NULL DEFAULT 'BOTTOM_RIGHT';
