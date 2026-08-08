-- Gallery gets a fixed grid layout template; per-photo featureLevel goes
-- away (slot size is now derived from the photo's position + the
-- gallery's template instead of being flagged per photo).

ALTER TABLE "Gallery" ADD COLUMN "layout" TEXT NOT NULL DEFAULT 'MIXED';

ALTER TABLE "Photo" DROP COLUMN "featureLevel";
