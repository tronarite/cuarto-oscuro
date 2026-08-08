-- Hash de la contraseña de admin, configurada en el primer acceso en vez
-- de por variable de entorno.
ALTER TABLE "Settings" ADD COLUMN "adminPasswordHash" TEXT;
