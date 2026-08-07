"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import { useIsDarkTheme } from "@/lib/use-theme";

export interface TripPoint {
  id: string;
  lat: number;
  lng: number;
}

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function TripMap({ points }: { points: TripPoint[] }) {
  const isDark = useIsDarkTheme();

  if (points.length === 0) return null;

  const positions: LatLngTuple[] = points.map((p) => [p.lat, p.lng]);
  const bounds: LatLngBoundsExpression = positions;
  const tileUrl = `https://{s}.basemaps.cartocdn.com/${isDark ? "dark_all" : "light_all"}/{z}/{x}/{y}{r}.png`;
  const markerColor = isDark ? "#e9e6de" : "#262420";

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [32, 32] }}
      scrollWheelZoom={false}
      className="h-96 w-full rounded-md grayscale"
    >
      <TileLayer key={tileUrl} url={tileUrl} attribution={TILE_ATTRIBUTION} />
      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: markerColor, weight: 2, opacity: 0.6 }}
        />
      )}
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={5}
          pathOptions={{
            color: markerColor,
            fillColor: markerColor,
            fillOpacity: 0.85,
            weight: 1,
          }}
        />
      ))}
    </MapContainer>
  );
}
