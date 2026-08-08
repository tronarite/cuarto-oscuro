-- Replace groupIndex/featured with a flat order + 3-tier featureLevel.
-- order values were already renumbered to a global sequence per gallery
-- before this migration runs (script run manually, not part of this file).

ALTER TABLE "Photo" ADD COLUMN "featureLevel" TEXT NOT NULL DEFAULT 'NONE';

UPDATE "Photo" SET "featureLevel" = 'SECONDARY' WHERE "featured" = 1;

ALTER TABLE "Photo" DROP COLUMN "featured";

DROP INDEX "Photo_galleryId_groupIndex_order_idx";
ALTER TABLE "Photo" DROP COLUMN "groupIndex";
CREATE INDEX "Photo_galleryId_order_idx" ON "Photo"("galleryId", "order");
