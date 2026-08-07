"use client";

import dynamic from "next/dynamic";
import type { TripPoint } from "./TripMap";

const TripMap = dynamic(() => import("./TripMap").then((m) => m.TripMap), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full animate-pulse rounded-md bg-neutral-200" />
  ),
});

export function TripMapLoader({ points }: { points: TripPoint[] }) {
  return <TripMap points={points} />;
}
