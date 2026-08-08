-- Elimina los campos de fechas de viaje: sin propósito percibido por el usuario.
ALTER TABLE "Gallery" DROP COLUMN "tripStart";
ALTER TABLE "Gallery" DROP COLUMN "tripEnd";
