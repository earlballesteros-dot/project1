"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Crosshair,
  ArrowLeft,
  ExternalLink,
  Layers,
  Compass,
  Navigation,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { BUTUAN_COORDINATES, DEFAULT_ZOOM } from "@/components/barangay-map";
import type { Map as LeafletMap } from "leaflet";

// Dynamically import BarangayMap to prevent server-side execution
const BarangayMap = dynamic(() => import("@/components/barangay-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[620px] w-full items-center justify-center rounded-b-lg bg-muted/20">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MapPin className="size-5 animate-bounce" />
        </div>
        <span className="text-sm font-medium">Initializing Butuan City GIS Engine...</span>
      </div>
    </div>
  ),
});

// Key districts in Butuan City for quick navigation
const BUTUAN_DISTRICTS = [
  {
    name: "City Proper / Plaza Rizal",
    coords: [8.9492, 125.5436] as [number, number],
    zoom: 15,
  },
  {
    name: "Brgy. Libertad",
    coords: [8.9441, 125.5085] as [number, number],
    zoom: 14,
  },
  {
    name: "Brgy. Ampayon (CSU)",
    coords: [8.9567, 125.5971] as [number, number],
    zoom: 14,
  },
  {
    name: "Brgy. Bancasi (Airport)",
    coords: [8.9489, 125.4801] as [number, number],
    zoom: 14,
  },
];

export function AdminMapClient() {
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string>("City Proper / Plaza Rizal");

  const handleMapReady = useCallback((map: LeafletMap) => {
    setMapInstance(map);
  }, []);

  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.setView(BUTUAN_COORDINATES, DEFAULT_ZOOM, { animate: true });
      setActiveDistrict("City Proper / Plaza Rizal");
    }
  };

  const handleSelectDistrict = (district: (typeof BUTUAN_DISTRICTS)[0]) => {
    if (mapInstance) {
      mapInstance.setView(district.coords, district.zoom, { animate: true });
      setActiveDistrict(district.name);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Breadcrumb info matching Admin Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Barangay Map & GIS
            </h1>
            <Badge variant="outline" className="text-xs">
              Live OpenStreetMap
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Interactive Geographic Information System for Butuan City, Agusan del Norte. Real roads, waterways, and barangay spatial coverage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowLeft data-icon="inline-start" />
              Dashboard Overview
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecenter}
            className="text-xs gap-1.5"
          >
            <Crosshair className="size-3.5 text-primary" />
            Recenter City
          </Button>
          <Link href="/resident">
            <Button variant="secondary" size="sm" className="text-xs">
              Switch to Resident Portal
              <ExternalLink data-icon="inline-end" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick District Focus Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 pr-1">
          <Navigation className="size-3 text-primary" />
          Quick Pan:
        </span>
        {BUTUAN_DISTRICTS.map((d) => (
          <Button
            key={d.name}
            variant={activeDistrict === d.name ? "default" : "outline"}
            size="xs"
            onClick={() => handleSelectDistrict(d)}
            className="text-xs"
          >
            {d.name}
          </Button>
        ))}
      </div>

      {/* Main Interactive Map Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Butuan City Geographic Information System
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  Real Roads & Terrain
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Navigate across all 86 barangays, highway corridors, bridges, and the Agusan River basin.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-mono">
                8.9492° N, 125.5436° E
              </Badge>
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                86 Barangays Covered
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Real Leaflet Map Content */}
        <CardContent className="p-0">
          <BarangayMap
            center={BUTUAN_COORDINATES}
            zoom={DEFAULT_ZOOM}
            className="h-[620px] w-full"
            onMapReady={handleMapReady}
          />
        </CardContent>

        {/* Card Footer with Verified OpenStreetMap Attribution */}
        <CardFooter className="border-t py-3 px-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Interactive Mode: Pan, Drag, & Zoom Enabled
            </span>
            <span className="hidden sm:inline text-muted-foreground/60">•</span>
            <span className="hidden sm:inline text-muted-foreground">
              Agusan del Norte, Caraga Region (Region XIII), Philippines
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Map tiles & data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              OpenStreetMap
            </a>{" "}
            contributors
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
