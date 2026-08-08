"use client";

import {
  LAYOUT_LABEL,
  LAYOUT_DESCRIPTION,
  previewPattern,
  type GalleryLayout,
  type SlotSize,
} from "@/lib/grid-templates";

const LAYOUT_OPTIONS: GalleryLayout[] = ["MIXED", "LARGE", "COMPACT", "BALANCED"];

const COL_SPAN: Record<SlotSize, number> = { SMALL: 1, MEDIUM: 2, LARGE: 2 };
const ROW_SPAN: Record<SlotSize, number> = { SMALL: 2, MEDIUM: 3, LARGE: 5 };

function MiniPattern({ layout }: { layout: GalleryLayout }) {
  const pattern = previewPattern(layout, 8);
  return (
    <div
      className="grid grid-cols-4 gap-1"
      style={{ gridAutoFlow: "dense", gridAutoRows: "5px" }}
    >
      {pattern.map((slot, i) => (
        <div
          key={i}
          className="rounded-[3px] bg-current opacity-60"
          style={{
            gridColumn: `span ${COL_SPAN[slot]}`,
            gridRow: `span ${ROW_SPAN[slot]}`,
          }}
        />
      ))}
    </div>
  );
}

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
            className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all active:scale-95 ${
              selected
                ? "border-foreground bg-surface"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <MiniPattern layout={layout} />
            <div>
              <p className="text-sm font-medium">{LAYOUT_LABEL[layout]}</p>
              <p className="text-xs text-muted-foreground">
                {LAYOUT_DESCRIPTION[layout]}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
