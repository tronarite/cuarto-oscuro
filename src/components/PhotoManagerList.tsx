"use client";

import { useEffect, useState } from "react";
import { MasonryGrid, type MasonryItem } from "@/components/MasonryGrid";
import { exifLine, type ExifSource } from "@/lib/exif-format";
import { slotSizeForIndex, SLOT_LABEL, type GalleryLayout } from "@/lib/grid-templates";
import { applyPinning } from "@/lib/photo-order";

interface PhotoItem extends ExifSource {
  id: string;
  order: number;
  pinnedPosition: number | null;
  width: number | null;
  height: number | null;
  description: string | null;
  thumbPath: string | null;
  homeFeatured: boolean;
}

type LaidOutPhoto = PhotoItem & MasonryItem;

interface PhotoManagerListProps {
  photos: PhotoItem[];
  layout: GalleryLayout;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onUpdateDescription: (photoId: string, description: string) => Promise<void>;
  onToggleHomeFeatured: (
    photoId: string,
    next: boolean,
  ) => Promise<{ error?: string }>;
  onTogglePinned: (photoId: string, next: boolean) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
}

export function PhotoManagerList({
  photos,
  layout,
  onReorder,
  onUpdateDescription,
  onToggleHomeFeatured,
  onTogglePinned,
  onDelete,
}: PhotoManagerListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [homeFeaturedError, setHomeFeaturedError] = useState<string | null>(null);

  // Auto-scroll de la ventana mientras se arrastra una foto cerca del
  // borde superior/inferior, para poder llevar una foto de abajo del
  // todo hasta arriba sin soltar y desplazar a mano.
  useEffect(() => {
    if (!draggingId) return;

    const EDGE = 120;
    const MAX_SPEED = 22;
    let pointerY = 0;
    let rafId: number;

    function onDragOver(e: DragEvent) {
      pointerY = e.clientY;
    }

    function tick() {
      const vh = window.innerHeight;
      if (pointerY > 0 && pointerY < EDGE) {
        window.scrollBy(0, -MAX_SPEED * ((EDGE - pointerY) / EDGE));
      } else if (pointerY > vh - EDGE) {
        window.scrollBy(0, MAX_SPEED * ((pointerY - (vh - EDGE)) / EDGE));
      }
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("dragover", onDragOver);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("dragover", onDragOver);
      cancelAnimationFrame(rafId);
    };
  }, [draggingId]);

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay fotos.</p>;
  }

  const ordered: LaidOutPhoto[] = applyPinning(photos).map((photo, i) => ({
    ...photo,
    slotSize: slotSizeForIndex(layout, i),
  }));

  // Arrastrar inserta la foto en el hueco soltado (como una lista normal),
  // en vez de solo intercambiar el sitio con la de destino. Las fotos
  // ancladas no participan: ni se pueden arrastrar ni recibir una.
  function handleDrop(e: React.DragEvent, targetPhoto: LaidOutPhoto) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    setDraggingId(null);
    if (targetPhoto.pinnedPosition != null) return;

    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetPhoto.id) return;

    const unpinnedIds = ordered
      .filter((p) => p.pinnedPosition == null)
      .map((p) => p.id);
    const fromIndex = unpinnedIds.indexOf(sourceId);
    if (fromIndex === -1) return;

    const next = [...unpinnedIds];
    next.splice(fromIndex, 1);
    const insertAt = next.indexOf(targetPhoto.id);
    next.splice(insertAt, 0, sourceId);

    onReorder(next);
  }

  async function handleTogglePinned(photoId: string, next: boolean) {
    await onTogglePinned(photoId, next);
  }

  async function handleToggleHomeFeatured(photoId: string, next: boolean) {
    setHomeFeaturedError(null);
    const result = await onToggleHomeFeatured(photoId, next);
    if (result.error) setHomeFeaturedError(result.error);
  }

  return (
    <div>
      {homeFeaturedError && (
        <p className="mb-3 text-sm text-red-600">{homeFeaturedError}</p>
      )}
      <MasonryGrid
        items={ordered}
        renderItem={(photo) => {
          const specs = exifLine(photo);
          const pinned = photo.pinnedPosition != null;
          const isDragging = draggingId === photo.id;
          const isDropTarget =
            !pinned && dragOverId === photo.id && draggingId !== null && !isDragging;
          return (
            <div
              draggable={!pinned}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", photo.id);
                setDraggingId(photo.id);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => {
                if (!pinned && draggingId && draggingId !== photo.id) {
                  setDragOverId(photo.id);
                }
              }}
              onDragLeave={() =>
                setDragOverId((cur) => (cur === photo.id ? null : cur))
              }
              onDrop={(e) => handleDrop(e, photo)}
              className={`group relative block h-full w-full overflow-hidden rounded-xl bg-surface transition-[transform,opacity,box-shadow] duration-150 ${
                pinned ? "cursor-default ring-2 ring-amber-400" : "cursor-grab active:cursor-grabbing"
              } ${isDragging ? "scale-95 opacity-40" : ""} ${
                isDropTarget
                  ? "scale-[0.98] ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : ""
              }`}
            >
              {photo.thumbPath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/img/thumb/${photo.id}`}
                  alt=""
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                />
              )}

              <div className="absolute inset-x-2 top-2 flex items-center justify-between">
                <span className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm">
                  {SLOT_LABEL[photo.slotSize]}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePinned(photo.id, !pinned)}
                    title="Anclar en esta posición: no se mueve al borrar u ordenar otras"
                    className={`rounded-full px-2 py-0.5 text-[11px] backdrop-blur-sm transition-all active:scale-90 ${
                      pinned
                        ? "bg-amber-400 text-black"
                        : "bg-black/50 text-white/80 hover:bg-black/70"
                    }`}
                  >
                    {pinned ? "Anclada" : "Anclar"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleHomeFeatured(photo.id, !photo.homeFeatured)
                    }
                    title="Destacar en portada (máx. 3 por galería)"
                    className={`rounded-full px-2 py-0.5 text-[11px] backdrop-blur-sm transition-all active:scale-90 ${
                      photo.homeFeatured
                        ? "bg-white text-black"
                        : "bg-black/50 text-white/80 hover:bg-black/70"
                    }`}
                  >
                    {photo.homeFeatured ? "★ Portada" : "☆ Portada"}
                  </button>
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
    </div>
  );
}
