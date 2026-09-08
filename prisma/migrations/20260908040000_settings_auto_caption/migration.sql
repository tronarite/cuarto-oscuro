-- BETA: interruptor para el pie de foto automático vía Google Cloud
-- Vision (Web Detection) al subir una foto. Ver src/lib/vision.ts.
ALTER TABLE "Settings" ADD COLUMN "autoCaptionEnabled" BOOLEAN NOT NULL DEFAULT false;
