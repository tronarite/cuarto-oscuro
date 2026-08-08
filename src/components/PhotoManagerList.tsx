"use client";

import { useState } from "react";
import { MasonryGrid, type MasonryItem } from "@/components/MasonryGrid";
import { exifLine, type ExifSource } from "@/lib/exif-format";
import { slotSizeForIndex, SLOT_LABEL, type GalleryLayout } from "@/lib/grid-templates";

interface PhotoItem extends ExifSource {
  id: string;
  order: number;
  width: number | null;
  height: number | null;
  description: string | null;
  thumbPath: string | null;
}

type LaidOutPhoto = PhotoItem & MasonryItem;

interface PhotoManagerListProps {
  photos: PhotoItem[];
  layout: GalleryLayout;
  onSwap: (photoIdA: string, photoIdB: string) => Promise<void>;
  onUpdateDescription: (photoId: string, description: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
}

export function PhotoManagerList({
  photos,
  layout,
  onSwap,
  onUpdateDescription,
  onDelete,
}: PhotoManagerListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay fotos.</p>;
  }

  const ordered: LaidOutPhoto[] = [...photos]
    .sort((a, b) => a.order - b.order)
    .map((photo, i) => ({ ...photo, slotSize: slotSizeForIndex(layout, i) }));

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (sourceId && sourceId !== targetId) onSwap(sourceId, targetId);
    setDraggingId(null);
  }

  return (
    <MasonryGrid
      items={ordered}
      renderItem={(photo) => {
        const specs = exifLine(photo);
        return (
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", photo.id);
              setDraggingId(photo.id);
            }}
            onDragEnd={() => setDraggingId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, photo.id)}
            className={`group relative block h-full w-full cursor-grab overflow-hidden rounded-xl bg-surface active:cursor-grabbing ${
              draggingId === photo.id ? "opacity-40" : ""
            }`}
          >
            {photo.thumbPath && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/img/thumb/${photo.id}`}
                alt=""
                draggable={false}
                className="h-full w-full select-none object-cover"
              />
            )}

            <div className="absolute inset-x-2 top-2 flex items-center justify-between">
              <span className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm">
                {SLOT_LABEL[photo.slotSize]}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Eliminar esta foto?")) onDelete(photo.id);
                }}
                className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 active:scale-90"
              >
                Eliminar
              </button>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3 pt-12">
              <input
                type="text"
                defaultValue={photo.description ?? ""}
                placeholder="Añadir pie de foto…"
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => onUpdateDescription(photo.id, e.target.value)}
                className="pointer-events-auto w-full bg-transparent text-sm font-medium text-white placeholder:text-white/50 outline-none"
              />
              {specs.length > 0 && (
                <p className="mt-0.5 text-[11px] text-white/70">
                  {specs.join(" · ")}
                </p>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
