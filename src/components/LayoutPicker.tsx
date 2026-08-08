"use client";

import {
  LAYOUT_LABEL,
  LAYOUT_DESCRIPTION,
  type GalleryLayout,
} from "@/lib/grid-templates";

const LAYOUT_OPTIONS: GalleryLayout[] = ["MIXED", "LARGE", "COMPACT", "BALANCED"];

export function LayoutPicker({
  value,
  onChange,
}: {
  value: GalleryLayout;
  onChange: (layout: GalleryLayout) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LAYOUT_OPTIONS.map((layout) => {
        const selected = value === layout;
        return (
          <button
            key={layout}
            type="button"
            onClick={() => onChange(layout)}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all active:scale-95 ${
              selected
                ? "border-foreground bg-surface"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <p className="text-sm font-medium">{LAYOUT_LABEL[layout]}</p>
            <p className="text-xs text-muted-foreground">
              {LAYOUT_DESCRIPTION[layout]}
            </p>
          </button>
        );
      })}
    </div>
  );
}
