/*
  Warnings:

  - Made the column `contentHash` on table `Photo` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "galleryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "originalPath" TEXT NOT NULL,
    "displayPath" TEXT NOT NULL,
    "thumbPath" TEXT,
    "description" TEXT,
    "contentHash" TEXT NOT NULL,
    "cameraMake" TEXT,
    "cameraModel" TEXT,
    "lens" TEXT,
    "iso" INTEGER,
    "aperture" REAL,
    "shutterSpeed" TEXT,
    "focalLength" REAL,
    "latitude" REAL,
    "longitude" REAL,
    "takenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Photo_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("aperture", "cameraMake", "cameraModel", "contentHash", "createdAt", "description", "displayPath", "focalLength", "galleryId", "id", "iso", "latitude", "lens", "longitude", "order", "originalPath", "shutterSpeed", "takenAt", "thumbPath", "updatedAt") SELECT "aperture", "cameraMake", "cameraModel", "contentHash", "createdAt", "description", "displayPath", "focalLength", "galleryId", "id", "iso", "latitude", "lens", "longitude", "order", "originalPath", "shutterSpeed", "takenAt", "thumbPath", "updatedAt" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE INDEX "Photo_galleryId_order_idx" ON "Photo"("galleryId", "order");
CREATE UNIQUE INDEX "Photo_galleryId_contentHash_key" ON "Photo"("galleryId", "contentHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
