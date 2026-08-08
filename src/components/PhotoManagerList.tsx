"use client";

import { useState } from "react";
import { MasonryGrid, type FeatureLevel } from "@/components/MasonryGrid";

interface PhotoItem {
  id: string;
  order: number;
  featureLevel: FeatureLevel;
  width: number | null;
  height: number | null;
  description: string | null;
  thumbPath: string | null;
}

interface PhotoManagerListProps {
  photos: PhotoItem[];
  onReorder: (photoId: string, targetIndex: number) => Promise<void>;
  onSetFeatureLevel: (photoId: string, level: FeatureLevel) => Promise<void>;
  onUpdateDescription: (photoId: string, description: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
}

const NEXT_LEVEL: Record<FeatureLevel, FeatureLevel> = {
  NONE: "SECONDARY",
  SECONDARY: "PRIMARY",
  PRIMARY: "NONE",
};

const LEVEL_LABEL: Record<FeatureLevel, string> = {
  NONE: "Sin destacar",
  SECONDARY: "Destacada secundaria",
  PRIMARY: "Destacada principal",
};

const LEVEL_ICON: Record<FeatureLevel, string> = {
  NONE: "☆",
  SECONDARY: "◐",
  PRIMARY: "★",
};

export function PhotoManagerList({
  photos,
  onReorder,
  onSetFeatureLevel,
  onUpdateDescription,
  onDelete,
}: PhotoManagerListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay fotos.</p>;
  }

  const ordered = [...photos].sort((a, b) => a.order - b.order);

  function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain");
    if (id) onReorder(id, targetIndex);
    setDraggingId(null);
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, ordered.length)}
      className="rounded-md border border-border p-2"
    >
      <MasonryGrid
        items={ordered}
        renderItem={(photo) => {
          const index = ordered.indexOf(photo);
          return (
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", photo.id);
                setDraggingId(photo.id);
              }}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              className={`group relative flex h-full w-full flex-col gap-1 rounded-md p-1 ${
                draggingId === photo.id ? "opacity-40" : ""
              }`}
            >
              {photo.thumbPath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/img/thumb/${photo.id}`}
                  alt=""
                  className="h-full min-h-0 flex-1 cursor-grab rounded-md object-cover active:cursor-grabbing"
                />
              )}
              <div className="pointer-events-none absolute inset-x-1 top-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onSetFeatureLevel(photo.id, NEXT_LEVEL[photo.featureLevel])}
                  className="pointer-events-auto rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
                  title={`${LEVEL_LABEL[photo.featureLevel]} (clic para cambiar)`}
                >
                  {LEVEL_ICON[photo.featureLevel]}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("¿Eliminar esta foto?")) onDelete(photo.id);
                  }}
                  className="pointer-events-auto rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
              <textarea
                defaultValue={photo.description ?? ""}
                placeholder="Descripción…"
                rows={1}
                onBlur={(e) => onUpdateDescription(photo.id, e.target.value)}
                className="w-full shrink-0 resize-none rounded border border-border bg-transparent px-1 py-0.5 text-xs outline-none focus:border-muted-foreground"
              />
            </div>
          );
        }}
      />
    </div>
  );
}
