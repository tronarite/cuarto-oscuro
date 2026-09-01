-- Interruptor para activar/desactivar la página "Sobre mí" y su botón en
-- la portada, sin tener que borrar el texto/foto ya guardados.
ALTER TABLE "Settings" ADD COLUMN "aboutEnabled" BOOLEAN NOT NULL DEFAULT true;
