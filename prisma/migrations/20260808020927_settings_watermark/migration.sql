-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "watermarkText" TEXT NOT NULL DEFAULT '© Galería fotográfica'
);
