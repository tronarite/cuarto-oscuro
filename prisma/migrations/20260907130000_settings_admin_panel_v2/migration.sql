-- Usuario del panel de administración, junto a la contraseña (ver loginAdmin).
ALTER TABLE "Settings" ADD COLUMN "adminUsername" TEXT;

-- Texto del botón de la portada que enlaza a "Sobre mí" (editable en Ajustes).
ALTER TABLE "Settings" ADD COLUMN "aboutButtonLabel" TEXT NOT NULL DEFAULT 'Sobre mí';

-- Estilo de esquina de las miniaturas de fotos en toda la web.
ALTER TABLE "Settings" ADD COLUMN "photoCorner" TEXT NOT NULL DEFAULT 'SQUARE';
