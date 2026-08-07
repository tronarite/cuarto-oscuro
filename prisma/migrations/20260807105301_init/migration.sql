-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "tripStart" DATETIME,
    "tripEnd" DATETIME,
    "privacy" TEXT NOT NULL DEFAULT 'PUBLIC',
    "passwordHash" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "galleryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "originalPath" TEXT NOT NULL,
    "displayPath" TEXT NOT NULL,
    "thumbPath" TEXT,
    "description" TEXT,
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

-- CreateIndex
CREATE UNIQUE INDEX "Gallery_slug_key" ON "Gallery"("slug");

-- CreateIndex
CREATE INDEX "Photo_galleryId_order_idx" ON "Photo"("galleryId", "order");
