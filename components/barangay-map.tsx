"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

export interface BarangayMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapReady?: (map: LeafletMap) => void;
}

/**
 * Geographic center coordinates for Butuan City, Agusan del Norte, Philippines
 * Latitude: 8.9492° N, Longitude: 125.5436° E
 */
export const BUTUAN_COORDINATES: [number, number] = [8.9492, 125.5436];
export const DEFAULT_ZOOM = 13;

export default function BarangayMap({
  center = BUTUAN_COORDINATES,
  zoom = DEFAULT_ZOOM,
  className = "h-[620px] w-full",
  onMapReady,
}: BarangayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet inside browser execution to guarantee zero SSR errors
    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;

      // Clean up previous instance if already existing
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Configure default Leaflet marker assets from unpkg to prevent bundler 404s
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Initialize the Leaflet map with zoom, drag, and pan capabilities
      const map = L.map(containerRef.current, {
        center,
        zoom,
        minZoom: 10,
        maxZoom: 19,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        boxZoom: true,
      });

      // Real OpenStreetMap tile layer with verified attribution
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapRef.current = map;
      setIsLoaded(true);

      if (onMapReady) {
        onMapReady(map);
      }

      // Invalidate size to handle dynamic container layouts and flex containers
      setTimeout(() => {
        if (isMounted && mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom, onMapReady]);

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={containerRef}
        className={`${className} relative z-0`}
        tabIndex={0}
        aria-label="Interactive map of Butuan City, Agusan del Norte, Philippines"
      />
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/40 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-medium">Loading Butuan City GIS Map...</span>
          </div>
        </div>
      )}
    </div>
  );
}
