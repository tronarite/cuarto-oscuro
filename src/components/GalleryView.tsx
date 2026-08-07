"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { pickTemplate, chunkIntoRooms } from "@/lib/gallery-layout";

export interface GalleryPhoto {
  id: string;
  description: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lens: string | null;
  iso: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  focalLength: number | null;
}

function exifLine(photo: GalleryPhoto): string[] {
  const parts: string[] = [];
  const camera = [photo.cameraMake, photo.cameraModel]
    .filter(Boolean)
    .join(" ");
  if (camera) parts.push(camera);
  if (photo.lens) parts.push(photo.lens);
  if (photo.focalLength) parts.push(`${photo.focalLength}mm`);
  if (photo.aperture) parts.push(`f/${photo.aperture}`);
  if (photo.shutterSpeed) parts.push(photo.shutterSpeed);
  if (photo.iso) parts.push(`ISO ${photo.iso}`);
  return parts;
}

const GRID_CLASS: Record<string, string> = {
  few: "grid-cols-1 gap-8 sm:grid-cols-2",
  medium: "grid-cols-2 gap-5 sm:grid-cols-3",
  many: "grid-cols-3 gap-3 sm:grid-cols-4",
};

function Room({
  photos,
  template,
  roomIndex,
  totalRooms,
  onOpen,
}: {
  photos: GalleryPhoto[];
  template: string;
  roomIndex: number;
  totalRooms: number;
  onOpen: (id: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const dividerY = useTransform(scrollYProgress, [0, 1], [24, -24]);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="py-10"
    >
      {totalRooms > 1 && (
        <motion.p
          style={{ y: dividerY }}
          className="mb-6 text-xs uppercase tracking-widest text-muted-foreground"
        >
          Sala {roomIndex + 1} de {totalRooms}
        </motion.p>
      )}
      <div className={`grid ${GRID_CLASS[template]}`}>
        {photos.map((photo, i) => {
          const featured =
            template === "medium" && i === 0 && photos.length > 1;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onOpen(photo.id)}
              className={`group aspect-square overflow-hidden rounded-md bg-surface ${
                featured ? "col-span-2 row-span-2 sm:col-span-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/img/thumb/${photo.id}`}
                alt={photo.description ?? ""}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}

export function GalleryView({ photos }: { photos: GalleryPhoto[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openPhoto = photos.find((p) => p.id === openId) ?? null;

  const template = pickTemplate(photos.length);
  const rooms = chunkIntoRooms(photos, template);
  const containerClass =
    template === "few" ? "mx-auto max-w-3xl" : "mx-auto max-w-5xl";

  return (
    <>
      <div className={containerClass}>
        {rooms.map((roomPhotos, i) => (
          <Room
            key={i}
            photos={roomPhotos}
            template={template}
            roomIndex={i}
            totalRooms={rooms.length}
            onOpen={setOpenId}
          />
        ))}
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
