"use client";

import { useState } from "react";

interface SiteTextFormProps {
  initialTitle: string;
  initialSubtitle: string;
  onChange: (title: string, subtitle: string) => Promise<void>;
}

export function SiteTextForm({
  initialTitle,
  initialSubtitle,
  onChange,
}: SiteTextFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);

  return (
    <div className="flex max-w-md flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Título</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onChange(title, subtitle)}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-muted-foreground"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Subtítulo</span>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          onBlur={() => onChange(title, subtitle)}
          placeholder="Sin subtítulo"
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-muted-foreground"
        />
      </label>
    </div>
  );
}
