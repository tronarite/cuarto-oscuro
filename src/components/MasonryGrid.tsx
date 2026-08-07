"use client";

import { useEffect, useRef, useState } from "react";

export interface MasonryItem {
  id: string;
  width: number | null;
  height: number | null;
  featured: boolean;
}

const GAP = 12;
const ROW_UNIT = 8;

function columnsForWidth(width: number): number {
  if (width < 640) return 2;
  if (width < 1024) return 3;
  return 4;
}

export function MasonryGrid<T extends MasonryItem>({
  items,
  renderItem,
  className,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns = containerWidth > 0 ? columnsForWidth(containerWidth) : 3;
  const columnWidth =
    containerWidth > 0 ? (containerWidth - (columns - 1) * GAP) / columns : 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: "grid",
        gridAutoFlow: "dense",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: `${ROW_UNIT}px`,
        gap: GAP,
      }}
    >
      {items.map((item) => {
        const span = item.featured && columns > 1 ? 2 : 1;
        const aspectRatio =
          item.width && item.height ? item.width / item.height : 1;

        let rowSpan = 20;
        if (columnWidth > 0) {
          const renderedWidth = columnWidth * span + GAP * (span - 1);
          const renderedHeight = renderedWidth / aspectRatio;
          rowSpan = Math.max(
            1,
            Math.round((renderedHeight + GAP) / (ROW_UNIT + GAP)),
          );
        }

        return (
          <div
            key={item.id}
            style={{
              gridColumn: `span ${Math.min(span, columns)}`,
              gridRow: `span ${rowSpan}`,
            }}
          >
            {renderItem(item)}
          </div>
        );
      })}
    </div>
  );
}
