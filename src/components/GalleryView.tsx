"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MasonryGrid, type FeatureLevel } from "@/components/MasonryGrid";
import { exifLine, type ExifSource } from "@/lib/exif-format";
import { seededRandom } from "@/lib/seeded-random";

export interface GalleryPhoto extends ExifSource {
  id: string;
  order: number;
  featureLevel: FeatureLevel;
  width: number | null;
  height: number | null;
  description: string | null;
}

function Tile({
  photo,
  onOpen,
}: {
  photo: GalleryPhoto;
  onOpen: (id: string) => void;
}) {
  const specs = exifLine(photo);
  const hasCaption = Boolean(photo.description) || specs.length > 0;

  // Variación "aleatoria" pero estable por foto (misma semilla = mismo
  // valor siempre) para que cada foto entre a su aire, no todas en fila.
  const rSpin = seededRandom(`${photo.id}-r`);
  const rDrift = seededRandom(`${photo.id}-x`);
  const rDelay = seededRandom(`${photo.id}-d`);
  const rotate = (rSpin - 0.5) * 7; // -3.5° a 3.5°
  const x = (rDrift - 0.5) * 28; // -14px a 14px
  const y = 30 + rDrift * 24; // 30-54px

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(photo.id)}
      initial={{ y, x, rotate, scale: 0.94 }}
      whileInView={{ y: 0, x: 0, rotate: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{
        type: "spring",
        stiffness: 110,
        damping: 14,
        mass: 0.7,
        delay: rDelay * 0.2,
      }}
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
