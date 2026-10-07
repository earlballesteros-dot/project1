"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup, Marker } from "leaflet";

export interface MapReportMarker {
  id: string;
  barangay: string;
  coords: [number, number];
  streetPurokLandmark: string;
  poleTag?: string | null;
  problemType: string;
  status: string;
  assignedTeam?: string | null;
  priority?: string;
  reporterName?: string;
}

export interface BarangayMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  markers?: MapReportMarker[];
  selectedMarkerId?: string | null;
  onMarkerSelect?: (marker: MapReportMarker) => void;
  onMapReady?: (map: LeafletMap) => void;
}

/**
 * Geographic center coordinates for Butuan City, Agusan del Norte, Philippines
 * Latitude: 8.9492° N, Longitude: 125.5436° E
 */
export const BUTUAN_COORDINATES: [number, number] = [8.9492, 125.5436];
export const DEFAULT_ZOOM = 13;

function escapeHtml(text?: string | null): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createReportIcon(L: typeof import("leaflet"), status: string, isSelected: boolean) {
  const statusColor =
    status === "Resolved"
      ? "#10b981"
      : status === "In Progress"
      ? "#3b82f6"
      : "#f59e0b";

  const size = isSelected ? 32 : 26;
  const pulseHtml = isSelected
    ? `<div style="position: absolute; width: ${size + 14}px; height: ${size + 14}px; border-radius: 50%; background: ${statusColor}40; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: -1;"></div>`
    : "";

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; transform: translate(-50%, -100%); cursor: pointer;">
      ${pulseHtml}
      <div style="
        background-color: ${statusColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: ${isSelected ? 9 : 7}px;
          height: ${isSelected ? 9 : 7}px;
          background-color: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "leaflet-report-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function buildPopupHtml(m: MapReportMarker): string {
  const statusBg =
    m.status === "Resolved"
      ? "background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;"
      : m.status === "In Progress"
      ? "background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;"
      : "background: #fef3c7; color: #b45309; border: 1px solid #fde68a;";

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.45; min-width: 220px; color: #1e293b; padding: 2px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
        <span style="font-weight: 700; font-size: 13px; color: #0f172a;">Brgy. ${escapeHtml(m.barangay)}</span>
        <span style="font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 9999px; ${statusBg}">
          ${escapeHtml(m.status)}
        </span>
      </div>
      <div style="margin-bottom: 4px;">
        <div style="color: #64748b; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;">Problem Type</div>
        <div style="font-weight: 600; color: #0f172a;">${escapeHtml(m.problemType)}</div>
      </div>
      <div style="margin-bottom: 4px;">
        <div style="color: #64748b; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;">Street / Landmark</div>
        <div style="color: #334155;">${escapeHtml(m.streetPurokLandmark)}</div>
      </div>
      ${
        m.poleTag
          ? `<div style="margin-bottom: 4px;">
              <div style="color: #64748b; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;">Pole Tag / ID</div>
              <span style="font-family: monospace; font-weight: 600; background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 11px;">${escapeHtml(m.poleTag)}</span>
            </div>`
          : ""
      }
      <div style="margin-top: 6px; padding-top: 5px; border-top: 1px dashed #e2e8f0; font-size: 11px; display: flex; align-items: center; justify-content: space-between;">
        <span style="color: #64748b;">Assigned Team:</span>
        <span style="font-weight: 600; color: #0f172a;">${escapeHtml(m.assignedTeam || "Pending Dispatch")}</span>
      </div>
      <div style="margin-top: 6px; font-size: 10px; color: #94a3b8; text-align: center; font-style: italic;">
        Location pinned to Barangay center
      </div>
    </div>
  `;
}

export default function BarangayMap({
  center = BUTUAN_COORDINATES,
  zoom = DEFAULT_ZOOM,
  className = "h-[620px] w-full",
  markers = [],
  selectedMarkerId,
  onMarkerSelect,
  onMapReady,
}: BarangayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletLibRef = useRef<typeof import("leaflet") | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, Marker>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map instance
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet inside browser execution to guarantee zero SSR errors
    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;

      leafletLibRef.current = L;

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

      // Initialize the Leaflet map with zoom, drag, and pan capabilities centered on Butuan City
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

      // Initialize LayerGroup for dynamic markers
      markersLayerRef.current = L.layerGroup().addTo(map);

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

  // Synchronize report markers on map
  useEffect(() => {
    const L = leafletLibRef.current;
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();
    markersMapRef.current.clear();

    if (!markers || markers.length === 0) return;

    markers.forEach((m) => {
      const isSelected = selectedMarkerId === m.id;
      const icon = createReportIcon(L, m.status, isSelected);
      const marker = L.marker(m.coords, { icon });

      marker.bindPopup(buildPopupHtml(m));
      marker.on("click", () => {
        if (onMarkerSelect) {
          onMarkerSelect(m);
        }
      });

      marker.addTo(layer);
      markersMapRef.current.set(m.id, marker);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [markers, selectedMarkerId, onMarkerSelect]);

  // Pan to selected marker if selected externally
  useEffect(() => {
    if (!selectedMarkerId || !mapRef.current) return;
    const marker = markersMapRef.current.get(selectedMarkerId);
    if (marker) {
      marker.openPopup();
      mapRef.current.panTo(marker.getLatLng(), { animate: true });
    }
  }, [selectedMarkerId]);

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
