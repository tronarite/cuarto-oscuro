-- Título/subtítulo de portada editables, y campos para la página "Sobre mí".
ALTER TABLE "Settings" ADD COLUMN "siteTitle" TEXT NOT NULL DEFAULT 'Galería fotográfica';
ALTER TABLE "Settings" ADD COLUMN "siteSubtitle" TEXT;
ALTER TABLE "Settings" ADD COLUMN "aboutText" TEXT;
ALTER TABLE "Settings" ADD COLUMN "aboutPhotoPath" TEXT;
ALTER TABLE "Settings" ADD COLUMN "aboutPhotoWidth" INTEGER;
ALTER TABLE "Settings" ADD COLUMN "aboutPhotoHeight" INTEGER;
