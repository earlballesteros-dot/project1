"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Crosshair,
  ArrowLeft,
  ExternalLink,
  Navigation,
  Info,
  Clock,
  CheckCircle2,
  Wrench,
  AlertCircle,
  X,
  FileText,
  Shield,
  Layers,
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
import {
  BUTUAN_COORDINATES,
  DEFAULT_ZOOM,
  type MapReportMarker,
} from "@/components/barangay-map";
import type { Map as LeafletMap } from "leaflet";
import { useIsAdmin } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

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

interface DbBarangayRecord {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

interface AdminGisReport {
  id: string;
  reporterName: string;
  contactInfo: string;
  barangayId: string | null;
  barangayName: string;
  latitude: number | null;
  longitude: number | null;
  streetLandmark: string;
  poleTagId: string | null;
  problemType: string;
  description: string;
  priority: string;
  status: string;
  teamName: string;
  createdAt: string;
}

export function AdminMapClient() {
  const isAdmin = useIsAdmin();
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string>("City Proper / Plaza Rizal");

  // Dynamic active barangays and directory loaded from Supabase public.barangays
  const [activeBarangays, setActiveBarangays] = useState<DbBarangayRecord[]>([]);
  const [activeBarangaysCount, setActiveBarangaysCount] = useState<number | null>(null);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(true);

  // Dynamic reports from public.reports
  const [reports, setReports] = useState<AdminGisReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<"all" | "mapped" | "unmapped">("all");

  // Fast lookups for barangays by ID and normalized name from public.barangays
  const { barangayById, barangayByName } = useMemo(() => {
    const byId = new Map<string, DbBarangayRecord>();
    const byName = new Map<string, DbBarangayRecord>();

    for (const b of activeBarangays) {
      byId.set(b.id, b);
      const cleanName = b.name.toLowerCase().replace(/^brgy\.?\s*/i, "").trim();
      byName.set(cleanName, b);
      byName.set(b.name.toLowerCase(), b);
    }

    return { barangayById: byId, barangayByName: byName };
  }, [activeBarangays]);

  // Load all active barangays with their Supabase coordinates
  const fetchActiveBarangays = useCallback(async () => {
    setIsLoadingBarangays(true);
    try {
      const { data, count, error } = await supabase
        .from("barangays")
        .select("id, name, latitude, longitude, is_active", { count: "exact" })
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching barangay coordinates from Supabase:", error.message);
      } else if (data) {
        const mappedList: DbBarangayRecord[] = data.map((b: any) => ({
          id: b.id,
          name: b.name,
          latitude: typeof b.latitude === "number" ? b.latitude : (b.latitude ? Number(b.latitude) : null),
          longitude: typeof b.longitude === "number" ? b.longitude : (b.longitude ? Number(b.longitude) : null),
          is_active: Boolean(b.is_active),
        }));
        setActiveBarangays(mappedList);
        setActiveBarangaysCount(count ?? mappedList.length);
      }
    } catch (err) {
      console.error("Failed to query active barangays from Supabase:", err);
    } finally {
      setIsLoadingBarangays(false);
    }
  }, []);

  // Fetch reports from public.reports joined with public.barangays (including latitude and longitude)
  const fetchReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          id,
          reporter_name,
          contact_info,
          street_purok_landmark,
          pole_tag_id,
          problem_type,
          description_hazard,
          photo_url,
          priority,
          status,
          assigned_team_id,
          created_at,
          barangay_id,
          barangays (
            id,
            name,
            latitude,
            longitude
          ),
          maintenance_teams (
            id,
            team_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports for GIS:", error.message);
      } else if (data) {
        const mappedData: AdminGisReport[] = data.map((row: any) => {
          let barangayName = "Unknown";
          let latitude: number | null = null;
          let longitude: number | null = null;

          if (row.barangays) {
            const b = Array.isArray(row.barangays) ? row.barangays[0] : row.barangays;
            if (b) {
              barangayName = b.name || "Unknown";
              latitude = typeof b.latitude === "number" ? b.latitude : (b.latitude ? Number(b.latitude) : null);
              longitude = typeof b.longitude === "number" ? b.longitude : (b.longitude ? Number(b.longitude) : null);
            }
          }

          let teamName = "Pending Dispatch";
          if (row.maintenance_teams) {
            if (Array.isArray(row.maintenance_teams) && row.maintenance_teams.length > 0) {
              teamName = row.maintenance_teams[0]?.team_name || "Pending Dispatch";
            } else if (typeof row.maintenance_teams === "object" && "team_name" in row.maintenance_teams) {
              teamName = row.maintenance_teams.team_name || "Pending Dispatch";
            }
          }

          return {
            id: row.id,
            reporterName: row.reporter_name || "Resident",
            contactInfo: row.contact_info || "",
            barangayId: row.barangay_id,
            barangayName,
            latitude,
            longitude,
            streetLandmark: row.street_purok_landmark || "Unspecified Landmark",
            poleTagId: row.pole_tag_id,
            problemType: row.problem_type || "Streetlight Defect",
            description: row.description_hazard || "",
            priority: row.priority || "High",
            status: row.status || "Pending",
            teamName,
            createdAt: row.created_at || new Date().toISOString(),
          };
        });
        setReports(mappedData);
      }
    } catch (err) {
      console.error("Failed to query reports for GIS:", err);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveBarangays();
    fetchReports();
  }, [fetchActiveBarangays, fetchReports]);

  // Helper to resolve coordinates for a report directly from public.barangays
  const resolveReportCoords = useCallback(
    (report: AdminGisReport): [number, number] | null => {
      // 1. Direct joined latitude and longitude from reports.barangay_id -> public.barangays
      if (typeof report.latitude === "number" && typeof report.longitude === "number") {
        return [report.latitude, report.longitude];
      }

      // 2. Lookup by barangayId in activeBarangays map
      if (report.barangayId && barangayById.has(report.barangayId)) {
        const b = barangayById.get(report.barangayId)!;
        if (typeof b.latitude === "number" && typeof b.longitude === "number") {
          return [b.latitude, b.longitude];
        }
      }

      // 3. Fallback lookup by clean barangay name in activeBarangays map
      const cleanName = report.barangayName.toLowerCase().replace(/^brgy\.?\s*/i, "").trim();
      const bByName = barangayByName.get(cleanName);
      if (bByName && typeof bByName.latitude === "number" && typeof bByName.longitude === "number") {
        return [bByName.latitude, bByName.longitude];
      }

      return null;
    },
    [barangayById, barangayByName]
  );

  // Dynamic Quick Pan districts powered by coordinates from public.barangays
  const butuanDistricts = useMemo(() => {
    const getCoords = (name: string, fallback: [number, number]): [number, number] => {
      const b = barangayByName.get(name.toLowerCase());
      if (b && typeof b.latitude === "number" && typeof b.longitude === "number") {
        return [b.latitude, b.longitude];
      }
      return fallback;
    };

    return [
      {
        name: "City Proper / Plaza Rizal",
        coords: BUTUAN_COORDINATES,
        zoom: 15,
      },
      {
        name: "Brgy. Libertad",
        coords: getCoords("libertad", [8.9442, 125.5037]),
        zoom: 14,
      },
      {
        name: "Brgy. Ampayon (CSU)",
        coords: getCoords("ampayon", [8.9599, 125.6027]),
        zoom: 14,
      },
      {
        name: "Brgy. Bancasi (Airport)",
        coords: getCoords("bancasi", [8.9464, 125.4794]),
        zoom: 14,
      },
    ];
  }, [barangayByName]);

  // Construct Leaflet map markers dynamically from public.barangays coordinates
  const { mappedMarkers, unmappedReports } = useMemo(() => {
    const markers: MapReportMarker[] = [];
    const unmapped: AdminGisReport[] = [];
    const barangayCounts: Record<string, number> = {};

    for (const report of reports) {
      const coords = resolveReportCoords(report);
      if (coords) {
        const bKey = report.barangayName.toLowerCase();
        const count = barangayCounts[bKey] || 0;
        barangayCounts[bKey] = count + 1;

        // Subtle offset if multiple reports exist in same barangay so all pins remain clickable
        let markerCoords: [number, number] = coords;
        if (count > 0) {
          const angle = (count * (2 * Math.PI)) / 6;
          const radius = 0.00045; // ~45 meters offset around barangay center
          markerCoords = [
            coords[0] + radius * Math.cos(angle),
            coords[1] + radius * Math.sin(angle),
          ];
        }

        markers.push({
          id: report.id,
          barangay: report.barangayName,
          coords: markerCoords,
          streetPurokLandmark: report.streetLandmark,
          poleTag: report.poleTagId,
          problemType: report.problemType,
          status: report.status,
          assignedTeam: report.teamName,
          priority: report.priority,
          reporterName: report.reporterName,
        });
      } else {
        unmapped.push(report);
      }
    }

    return { mappedMarkers: markers, unmappedReports: unmapped };
  }, [reports, resolveReportCoords]);

  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  const handleMapReady = useCallback((map: LeafletMap) => {
    setMapInstance(map);
  }, []);

  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.setView(BUTUAN_COORDINATES, DEFAULT_ZOOM, { animate: true });
      setActiveDistrict("City Proper / Plaza Rizal");
    }
  };

  const handleSelectDistrict = (district: (typeof butuanDistricts)[0]) => {
    if (mapInstance) {
      mapInstance.setView(district.coords, district.zoom, { animate: true });
      setActiveDistrict(district.name);
    }
  };

  const handleMarkerSelect = useCallback((marker: MapReportMarker) => {
    setSelectedReportId(marker.id);
  }, []);

  const handleReportSelect = (report: AdminGisReport) => {
    setSelectedReportId(report.id);
    const coords = resolveReportCoords(report);
    if (coords && mapInstance) {
      mapInstance.setView(coords, 15, { animate: true });
      setActiveDistrict(`Brgy. ${report.barangayName}`);
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
          {!isAdmin && (
            <Link href="/resident">
              <Button variant="secondary" size="sm" className="text-xs">
                Switch to Resident Portal
                <ExternalLink data-icon="inline-end" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick District Focus Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 pr-1">
          <Navigation className="size-3 text-primary" />
          Quick Pan:
        </span>
        {butuanDistricts.map((d) => (
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
                Navigate across active Butuan City barangays, highway corridors, bridges, and the Agusan River basin.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-mono">
                8.9492° N, 125.5436° E
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium"
              >
                {isLoadingBarangays
                  ? "Loading Coverage..."
                  : `${activeBarangaysCount ?? 0} Barangays Covered`}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Real Leaflet Map Content with dynamic report pins */}
        <CardContent className="p-0">
          <BarangayMap
            center={BUTUAN_COORDINATES}
            zoom={DEFAULT_ZOOM}
            className="h-[620px] w-full"
            markers={mappedMarkers}
            selectedMarkerId={selectedReportId}
            onMarkerSelect={handleMarkerSelect}
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
            <span className="hidden sm:inline text-muted-foreground/60">•</span>
            <span className="text-[11px] font-medium text-primary">
              {mappedMarkers.length} Active Marker{mappedMarkers.length === 1 ? "" : "s"} on Map (from Supabase)
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

      {/* Selected Report Inspection Panel */}
      {selectedReport && (
        <Card className="border-primary/40 bg-card shadow-sm transition-all animate-in fade-in-50">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Brgy. {selectedReport.barangayName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ticket Ref: <span className="font-mono font-medium text-foreground">{selectedReport.id.slice(0, 8)}...</span>
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    selectedReport.status === "Resolved"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : selectedReport.status === "In Progress"
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {selectedReport.status}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {selectedReport.priority} Priority
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setSelectedReportId(null)}
                  title="Close Report Inspection"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="flex flex-col gap-1 p-2.5 rounded-lg border bg-muted/30">
              <span className="text-muted-foreground font-medium">Problem Type</span>
              <span className="font-semibold text-foreground text-sm">
                {selectedReport.problemType}
              </span>
            </div>

            <div className="flex flex-col gap-1 p-2.5 rounded-lg border bg-muted/30">
              <span className="text-muted-foreground font-medium">Street / Landmark</span>
              <span className="font-medium text-foreground">
                {selectedReport.streetLandmark}
              </span>
            </div>

            <div className="flex flex-col gap-1 p-2.5 rounded-lg border bg-muted/30">
              <span className="text-muted-foreground font-medium">Pole Tag / ID</span>
              <span className="font-mono font-medium text-foreground">
                {selectedReport.poleTagId || "None Tagged"}
              </span>
            </div>

            <div className="flex flex-col gap-1 p-2.5 rounded-lg border bg-muted/30">
              <span className="text-muted-foreground font-medium">Assigned Line Crew</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Wrench className="size-3 text-primary" />
                {selectedReport.teamName}
              </span>
            </div>
          </CardContent>

          <CardFooter className="border-t py-2.5 px-4 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="size-3.5 text-emerald-500" />
              <span>
                Map pin marks the reported <strong>Barangay center</strong> (individual pole GPS coordinates are not collected).
              </span>
            </div>

            <div className="flex items-center gap-2">
              {resolveReportCoords(selectedReport) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleReportSelect(selectedReport)}
                >
                  <Navigation data-icon="inline-start" />
                  Center on Map
                </Button>
              )}
              <Link href="/admin/reports">
                <Button variant="default" size="sm" className="text-xs h-7">
                  <FileText data-icon="inline-start" />
                  Manage in Reports Queue
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Incident Queue & Coordinates Status Section */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                Citywide Streetlight Incident Queue
              </CardTitle>
              <CardDescription className="text-xs">
                Incident reports submitted by residents across Butuan City barangays ({reports.length} total active tickets).
              </CardDescription>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg text-xs">
              <Button
                variant={activeReportTab === "all" ? "default" : "ghost"}
                size="xs"
                onClick={() => setActiveReportTab("all")}
                className="text-xs"
              >
                All Reports ({reports.length})
              </Button>
              <Button
                variant={activeReportTab === "mapped" ? "default" : "ghost"}
                size="xs"
                onClick={() => setActiveReportTab("mapped")}
                className="text-xs"
              >
                Mapped on GIS ({mappedMarkers.length})
              </Button>
              <Button
                variant={activeReportTab === "unmapped" ? "default" : "ghost"}
                size="xs"
                onClick={() => setActiveReportTab("unmapped")}
                className="text-xs"
              >
                Awaiting Coordinates ({unmappedReports.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 flex flex-col gap-3">
          {/* Coordinates Live Status Notice */}
          {unmappedReports.length > 0 && activeReportTab !== "mapped" ? (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs text-muted-foreground">
              <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <strong className="text-foreground">Geographic Coordinates Notice</strong>
                <span>
                  The Butuan City directory contains {activeBarangaysCount ?? 86} active barangays in <code className="font-mono text-[11px] text-foreground">public.barangays</code>. Reports in unmapped barangays are listed below.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong className="text-foreground">Supabase Live GIS Integration: </strong>
                All {activeBarangaysCount ?? 86} Butuan City barangays have verified geographic coordinates in <code className="font-mono text-[11px] text-foreground">public.barangays</code>. All reported incidents are dynamically positioned by barangay area.
              </span>
            </div>
          )}

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {isLoadingReports ? (
              <div className="col-span-full py-8 text-center text-muted-foreground text-xs">
                Loading incidents from central reports database...
              </div>
            ) : reports.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground text-xs">
                No incident reports currently recorded.
              </div>
            ) : (
              (activeReportTab === "all"
                ? reports
                : activeReportTab === "mapped"
                ? reports.filter((r) => resolveReportCoords(r) !== null)
                : unmappedReports
              ).map((report) => {
                const isMapped = resolveReportCoords(report) !== null;
                const isSelected = selectedReportId === report.id;

                return (
                  <div
                    key={report.id}
                    onClick={() => handleReportSelect(report)}
                    className={`flex flex-col justify-between p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                        : "hover:border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <MapPin className={`size-3.5 ${isMapped ? "text-primary" : "text-muted-foreground"}`} />
                          Brgy. {report.barangayName}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            report.status === "Resolved"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : report.status === "In Progress"
                              ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {report.status}
                        </Badge>
                      </div>

                      <div className="font-medium text-foreground">
                        {report.problemType}
                      </div>

                      <div className="text-muted-foreground truncate">
                        {report.streetLandmark}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{report.poleTagId ? `Tag: ${report.poleTagId}` : "No tag"}</span>
                      {isMapped ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          GIS Mapped
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Awaiting Coords
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
