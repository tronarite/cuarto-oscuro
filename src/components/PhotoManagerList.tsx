"use client";

import { useState } from "react";
import { MasonryGrid, type FeatureLevel } from "@/components/MasonryGrid";
import { exifLine, type ExifSource } from "@/lib/exif-format";

interface PhotoItem extends ExifSource {
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

function FeatureButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pointer-events-auto rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm transition-colors ${
        active
          ? "bg-white text-black"
          : "bg-black/50 text-white/80 hover:bg-black/70"
      }`}
    >
      {label}
    </button>
  );
}

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
    >
      <MasonryGrid
        items={ordered}
        renderItem={(photo) => {
          const index = ordered.indexOf(photo);
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
              onDrop={(e) => handleDrop(e, index)}
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
                <div className="flex gap-1">
                  <FeatureButton
                    active={photo.featureLevel === "PRIMARY"}
                    label="Principal"
                    onClick={() =>
                      onSetFeatureLevel(
                        photo.id,
                        photo.featureLevel === "PRIMARY" ? "NONE" : "PRIMARY",
                      )
                    }
                  />
                  <FeatureButton
                    active={photo.featureLevel === "SECONDARY"}
                    label="Secundaria"
                    onClick={() =>
                      onSetFeatureLevel(
                        photo.id,
                        photo.featureLevel === "SECONDARY" ? "NONE" : "SECONDARY",
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("¿Eliminar esta foto?")) onDelete(photo.id);
                  }}
                  className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70"
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
    </div>
  );
}
