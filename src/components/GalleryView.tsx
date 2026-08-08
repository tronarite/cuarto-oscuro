"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MasonryGrid, type FeatureLevel } from "@/components/MasonryGrid";

export interface GalleryPhoto {
  id: string;
  order: number;
  featureLevel: FeatureLevel;
  width: number | null;
  height: number | null;
  description: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lens: string | null;
  iso: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  focalLength: number | null;
}

function cameraLabel(make: string | null, model: string | null): string {
  if (make && model) {
    // Muchas cámaras ya incluyen la marca dentro del modelo del EXIF
    // (ej. modelo "Canon EOS 600D" con marca "Canon"): evita duplicarla.
    return model.toLowerCase().startsWith(make.toLowerCase())
      ? model
      : `${make} ${model}`;
  }
  return make || model || "";
}

function exifLine(photo: GalleryPhoto): string[] {
  const parts: string[] = [];
  const camera = cameraLabel(photo.cameraMake, photo.cameraModel);
  if (camera) parts.push(camera);
  if (photo.lens) parts.push(photo.lens);
  if (photo.focalLength) parts.push(`${photo.focalLength}mm`);
  if (photo.aperture) parts.push(`f/${photo.aperture}`);
  if (photo.shutterSpeed) parts.push(photo.shutterSpeed);
  if (photo.iso) parts.push(`ISO ${photo.iso}`);
  return parts;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function Tile({
  photo,
  onOpen,
}: {
  photo: GalleryPhoto;
  onOpen: (id: string) => void;
}) {
  const specs = exifLine(photo);
  const hasCaption = Boolean(photo.description) || specs.length > 0;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(photo.id)}
      initial={{ y: 18 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="group relative block h-full w-full overflow-hidden rounded-xl bg-surface"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/img/thumb/${photo.id}`}
        alt={photo.description ?? ""}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="h-full w-full select-none object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {hasCaption && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pt-10 text-left">
          {photo.description && (
            <p className="text-sm font-medium text-white">{photo.description}</p>
          )}
          {specs.length > 0 && (
            <p className="mt-0.5 text-[11px] text-white/70">{specs.join(" · ")}</p>
          )}
        </div>
      )}
    </motion.button>
  );
}

export function GalleryView({ photos }: { photos: GalleryPhoto[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openPhoto = photos.find((p) => p.id === openId) ?? null;
  const ordered = [...photos].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="mx-auto max-w-5xl">
        <MasonryGrid
          items={ordered}
          renderItem={(photo) => <Tile photo={photo} onOpen={setOpenId} />}
        />
      </div>

      {openPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className="flex max-h-full max-w-4xl flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/img/display/${openPhoto.id}`}
              alt={openPhoto.description ?? ""}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[75vh] w-auto select-none rounded-md object-contain"
            />
            <div className="text-neutral-200">
              {openPhoto.description && (
                <p className="text-sm">{openPhoto.description}</p>
              )}
              {exifLine(openPhoto).length > 0 && (
                <p className="mt-1 text-xs text-neutral-400">
                  {exifLine(openPhoto).join(" · ")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="self-start text-sm text-neutral-400 hover:text-neutral-200"
            >
              cerrar ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
