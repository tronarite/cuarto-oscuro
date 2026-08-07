"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { groupByRoom } from "@/lib/gallery-layout";
import { MasonryGrid } from "@/components/MasonryGrid";

export interface GalleryPhoto {
  id: string;
  groupIndex: number;
  order: number;
  featured: boolean;
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

function Room({
  photos,
  roomIndex,
  totalRooms,
  onOpen,
}: {
  photos: GalleryPhoto[];
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
      initial={{ y: 28 }}
      whileInView={{ y: 0 }}
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
      <MasonryGrid
        items={photos}
        renderItem={(photo) => (
          <button
            type="button"
            onClick={() => onOpen(photo.id)}
            className="group h-full w-full overflow-hidden rounded-md bg-surface"
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
        )}
      />
    </motion.section>
  );
}

export function GalleryView({ photos }: { photos: GalleryPhoto[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openPhoto = photos.find((p) => p.id === openId) ?? null;

  const rooms = groupByRoom(photos);

  return (
    <>
      <div className="mx-auto max-w-5xl">
        {rooms.map((roomPhotos, i) => (
          <Room
            key={roomPhotos[0]?.id ?? i}
            photos={roomPhotos}
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
