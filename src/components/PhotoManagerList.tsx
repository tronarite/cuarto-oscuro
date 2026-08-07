"use client";

import { useState } from "react";
import { groupByRoom } from "@/lib/gallery-layout";
import { MasonryGrid } from "@/components/MasonryGrid";

interface PhotoItem {
  id: string;
  groupIndex: number;
  order: number;
  featured: boolean;
  width: number | null;
  height: number | null;
  description: string | null;
  thumbPath: string | null;
}

interface PhotoManagerListProps {
  photos: PhotoItem[];
  onMove: (
    photoId: string,
    targetGroupIndex: number,
    targetIndex: number,
  ) => Promise<void>;
  onToggleFeatured: (photoId: string, featured: boolean) => Promise<void>;
  onUpdateDescription: (photoId: string, description: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
}

export function PhotoManagerList({
  photos,
  onMove,
  onToggleFeatured,
  onUpdateDescription,
  onDelete,
}: PhotoManagerListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay fotos.</p>;
  }

  const groups = groupByRoom(photos);
  const maxGroupIndex = Math.max(...photos.map((p) => p.groupIndex));

  function handleDropOnTile(
    e: React.DragEvent,
    groupIndex: number,
    index: number,
  ) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain");
    if (id) onMove(id, groupIndex, index);
    setDraggingId(null);
  }

  function handleDropOnGroup(e: React.DragEvent, groupIndex: number, size: number) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) onMove(id, groupIndex, size);
    setDraggingId(null);
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((groupPhotosList) => {
        const groupIndex = groupPhotosList[0].groupIndex;
        return (
          <div key={groupIndex}>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
              Grupo {groupIndex + 1}
            </p>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) =>
                handleDropOnGroup(e, groupIndex, groupPhotosList.length)
              }
              className="rounded-md border border-border p-2"
            >
              <MasonryGrid
                items={groupPhotosList}
                renderItem={(photo) => {
                  const index = groupPhotosList.indexOf(photo);
                  return (
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", photo.id);
                        setDraggingId(photo.id);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropOnTile(e, groupIndex, index)}
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
                          onClick={() => onToggleFeatured(photo.id, !photo.featured)}
                          className="pointer-events-auto rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
                          title={photo.featured ? "Quitar destacado" : "Destacar"}
                        >
                          {photo.featured ? "★" : "☆"}
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
          </div>
        );
      })}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDropOnGroup(e, maxGroupIndex + 1, 0)}
        className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground"
      >
        Arrastra una foto aquí para crear un nuevo grupo
      </div>
    </div>
  );
}
