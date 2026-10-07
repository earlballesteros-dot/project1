"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Settings,
  Sliders,
  MapPin,
  Bell,
  Palette,
  Sun,
  Moon,
  Laptop,
  Save,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Check,
  Building2,
  Volume2,
  Plus,
  Pencil,
  Archive,
  AlertTriangle,
  AlertCircle,
  Search,
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import {
  getStoredSettings,
  saveStoredSettings,
  DEFAULT_SETTINGS,
  SUPPORTED_BARANGAYS_12,
  type SystemSettings,
} from "@/lib/settings-store";
import { getStoredTeams } from "@/lib/teams-data";
import { useAuth } from "@clerk/nextjs";
import { useIsAdmin } from "@/lib/roles";
import { createClerkSupabaseClient, supabase as defaultSupabase } from "@/lib/supabase";

interface BarangayRecord {
  id: string;
  name: string;
  is_active: boolean;
}

export function AdminSettingsClient() {
  const isAdmin = useIsAdmin();
  const { getToken } = useAuth();
  const supabase = useMemo(() => {
    return getToken ? createClerkSupabaseClient(getToken) : defaultSupabase;
  }, [getToken]);

  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Barangay Management state
  const [barangays, setBarangays] = useState<BarangayRecord[]>([]);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState<boolean>(true);
  const [barangaysError, setBarangaysError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");

  // Dialog and form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newBarangayName, setNewBarangayName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const [editingBarangay, setEditingBarangay] = useState<BarangayRecord | null>(null);
  const [editBarangayName, setEditBarangayName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [archivingBarangay, setArchivingBarangay] = useState<BarangayRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barangayNotice, setBarangayNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Synchronize settings from local storage on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getStoredSettings());
    setIsMounted(true);
  }, []);

  // Load barangay master list from Supabase public.barangays
  const fetchBarangays = useCallback(async () => {
    setIsLoadingBarangays(true);
    setBarangaysError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("barangays")
        .select("id, name, is_active")
        .order("name", { ascending: true });

      if (fetchErr) {
        console.error("Error fetching barangays from Supabase:", fetchErr.message);
        setBarangaysError(fetchErr.message);
      } else if (data) {
        setBarangays(data);
      }
    } catch (err) {
      console.error("Failed to query barangays table:", err);
      const msg = err instanceof Error ? err.message : "Failed to load barangays";
      setBarangaysError(msg);
    } finally {
      setIsLoadingBarangays(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBarangays();
  }, [fetchBarangays]);

  // Dynamic active and archived counts from public.barangays
  const activeCount = useMemo(() => {
    return barangays.filter((b) => b.is_active).length;
  }, [barangays]);

  const archivedCount = useMemo(() => {
    return barangays.filter((b) => !b.is_active).length;
  }, [barangays]);

  const filteredBarangays = useMemo(() => {
    return barangays.filter((b) => {
      if (statusFilter === "active" && !b.is_active) return false;
      if (statusFilter === "archived" && b.is_active) return false;
      if (searchQuery.trim()) {
        return b.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      }
      return true;
    });
  }, [barangays, statusFilter, searchQuery]);

  const handleSave = () => {
    saveStoredSettings(settings);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
    }, 3500);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    saveStoredSettings(DEFAULT_SETTINGS);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
    }, 3500);
  };

  const toggleBarangay = (barangay: string) => {
    setSettings((prev) => {
      const exists = prev.coverageBarangays.includes(barangay);
      let updated: string[];
      if (exists) {
        if (prev.coverageBarangays.length <= 1) return prev;
        updated = prev.coverageBarangays.filter((b) => b !== barangay);
      } else {
        updated = [...prev.coverageBarangays, barangay];
      }
      return { ...prev, coverageBarangays: updated };
    });
  };

  const handleSelectAllBarangays = () => {
    setSettings((prev) => ({
      ...prev,
      coverageBarangays: [...SUPPORTED_BARANGAYS_12],
    }));
  };

  // Find assigned team for a barangay
  const getTeamForBarangay = (barangay: string) => {
    const teams = getStoredTeams();
    const team = teams.find((t) =>
      t.assignedBarangays.includes(barangay)
    );
    return team ? team.name : "Unassigned";
  };

  // Add new barangay
  const handleAddBarangay = async () => {
    const trimmed = newBarangayName.trim();
    if (!trimmed) {
      setAddError("Barangay name cannot be empty.");
      return;
    }

    // Duplicate check among active barangays (case-insensitive)
    const duplicate = barangays.some(
      (b) => b.is_active && b.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setAddError(`An active barangay named "${trimmed}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setAddError(null);

    try {
      // Let Supabase generate the UUID, set is_active = true
      const { data, error } = await supabase
        .from("barangays")
        .insert({ name: trimmed, is_active: true })
        .select("id, name, is_active")
        .single();

      if (error) {
        console.error("Error inserting barangay:", error.message, error);
        setAddError(`Failed to add barangay: ${error.message}`);
        return;
      }

      if (data) {
        setBarangays((prev) => {
          const next = [...prev, data];
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
      } else {
        await fetchBarangays();
      }

      setIsAddOpen(false);
      setNewBarangayName("");
      setBarangayNotice({
        type: "success",
        message: `Barangay "${trimmed}" was successfully added to active coverage.`,
      });
      setTimeout(() => setBarangayNotice(null), 4000);
    } catch (err) {
      console.error("Unexpected error adding barangay:", err);
      const msg = err instanceof Error ? err.message : "Failed to add barangay";
      setAddError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit barangay name (preserve ID)
  const handleSaveEdit = async () => {
    if (!editingBarangay) return;
    const trimmed = editBarangayName.trim();
    if (!trimmed) {
      setEditError("Barangay name cannot be empty.");
      return;
    }

    if (trimmed === editingBarangay.name) {
      setEditingBarangay(null);
      return;
    }

    // Duplicate check among other active barangays
    const duplicate = barangays.some(
      (b) =>
        b.id !== editingBarangay.id &&
        b.is_active &&
        b.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setEditError(`An active barangay named "${trimmed}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setEditError(null);

    try {
      // Update existing row preserving ID
      const { error } = await supabase
        .from("barangays")
        .update({ name: trimmed })
        .eq("id", editingBarangay.id);

      if (error) {
        console.error("Error updating barangay:", error.message, error);
        setEditError(`Failed to update barangay: ${error.message}`);
        return;
      }

      setBarangays((prev) =>
        prev
          .map((b) => (b.id === editingBarangay.id ? { ...b, name: trimmed } : b))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      const oldName = editingBarangay.name;
      setEditingBarangay(null);
      setBarangayNotice({
        type: "success",
        message: `Barangay "${oldName}" was updated to "${trimmed}".`,
      });
      setTimeout(() => setBarangayNotice(null), 4000);
    } catch (err) {
      console.error("Unexpected error updating barangay:", err);
      const msg = err instanceof Error ? err.message : "Failed to update barangay";
      setEditError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Archive barangay (Soft-delete only: is_active = false. NEVER DELETE!)
  const handleConfirmArchive = async () => {
    if (!archivingBarangay) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("barangays")
        .update({ is_active: false })
        .eq("id", archivingBarangay.id);

      if (error) {
        console.error("Error archiving barangay:", error.message, error);
        setBarangayNotice({
          type: "error",
          message: `Failed to archive barangay: ${error.message}`,
        });
        return;
      }

      setBarangays((prev) =>
        prev.map((b) =>
          b.id === archivingBarangay.id ? { ...b, is_active: false } : b
        )
      );

      const name = archivingBarangay.name;
      setArchivingBarangay(null);
      setBarangayNotice({
        type: "success",
        message: `Barangay "${name}" has been archived. Historical reports remain preserved.`,
      });
      setTimeout(() => setBarangayNotice(null), 4000);
    } catch (err) {
      console.error("Unexpected error archiving barangay:", err);
      const msg = err instanceof Error ? err.message : "Failed to archive barangay";
      setBarangayNotice({
        type: "error",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restore barangay (is_active = true, preserve ID)
  const handleRestore = async (barangayToRestore: BarangayRecord) => {
    // Prevent duplicate active barangay names
    const duplicate = barangays.some(
      (b) =>
        b.id !== barangayToRestore.id &&
        b.is_active &&
        b.name.trim().toLowerCase() === barangayToRestore.name.trim().toLowerCase()
    );
    if (duplicate) {
      setBarangayNotice({
        type: "error",
        message: `Cannot restore "${barangayToRestore.name}": an active barangay with this name already exists.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("barangays")
        .update({ is_active: true })
        .eq("id", barangayToRestore.id);

      if (error) {
        console.error("Error restoring barangay:", error.message, error);
        setBarangayNotice({
          type: "error",
          message: `Failed to restore barangay: ${error.message}`,
        });
        return;
      }

      setBarangays((prev) =>
        prev.map((b) =>
          b.id === barangayToRestore.id ? { ...b, is_active: true } : b
        )
      );

      setBarangayNotice({
        type: "success",
        message: `Barangay "${barangayToRestore.name}" has been restored to active coverage.`,
      });
      setTimeout(() => setBarangayNotice(null), 4000);
    } catch (err) {
      console.error("Unexpected error restoring barangay:", err);
      const msg = err instanceof Error ? err.message : "Failed to restore barangay";
      setBarangayNotice({
        type: "error",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Banner / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              System Settings
            </h1>
            <Badge variant="outline" className="text-xs">
              Admin Configuration
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage system identification, coverage barangays, notification rules, and visual theme.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowLeft data-icon="inline-start" />
              Operations Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleReset}
          >
            <RotateCcw data-icon="inline-start" />
            Reset Defaults
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-xs"
            onClick={handleSave}
          >
            <Save data-icon="inline-start" />
            Save Changes
          </Button>
          {!isAdmin && (
            <Link href="/resident">
              <Button variant="secondary" size="sm" className="text-xs">
                Resident View
                <ExternalLink data-icon="inline-end" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedNotice && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs sm:text-sm">
                System Settings Successfully Saved
              </span>
              <span className="text-[11px] sm:text-xs text-muted-foreground">
                Preferences and configuration have been updated and persisted to local browser storage.
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/50 text-[10px] shrink-0 font-mono">
            Persisted
          </Badge>
        </div>
      )}

      {/* Settings Grid */}
      <div className="flex flex-col gap-6">
        {/* 1. System Name & Metadata */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sliders className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">1. System Identity</CardTitle>
                <CardDescription className="text-xs">
                  Official municipal name and branding displayed across all administrative and resident surfaces.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system-name" className="text-xs font-semibold">
                System Name
              </Label>
              <Input
                id="system-name"
                value={settings.systemName}
                onChange={(e) =>
                  setSettings({ ...settings, systemName: e.target.value })
                }
                placeholder="Enter system name..."
                className="max-w-2xl font-medium"
              />
              <p className="text-[11px] text-muted-foreground">
                Default: Butuan City Streetlight Problem Reporting and Monitoring System
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-3 rounded-lg border">
              <div>
                <span className="text-muted-foreground block text-[11px]">Operating Entity</span>
                <span className="font-semibold flex items-center gap-1.5 mt-0.5">
                  <Building2 className="size-3.5 text-primary" />
                  City Government of Butuan
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Division</span>
                <span className="font-semibold flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="size-3.5 text-primary" />
                  City Engineering & Linemen
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Jurisdiction</span>
                <span className="font-semibold flex items-center gap-1.5 mt-0.5">
                  <MapPin className="size-3.5 text-primary" />
                  Caraga Region (Region XIII)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Operational Coverage & Barangay Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">2. Operational Coverage</CardTitle>
                  <CardDescription className="text-xs">
                    Master directory of Butuan City barangays served by municipal repair teams and reporting dispatch.
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <Badge variant="outline" className="font-mono text-xs">
                  {isLoadingBarangays ? "Loading..." : `${activeCount} Active Barangays`}
                </Badge>
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setAddError(null);
                    setNewBarangayName("");
                    setIsAddOpen(true);
                  }}
                >
                  <Plus data-icon="inline-start" className="size-3.5" />
                  Add Barangay
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action Notice Alert */}
            {barangayNotice && (
              <div
                className={`rounded-lg border p-3 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
                  barangayNotice.type === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                }`}
              >
                <div className="flex items-center gap-2">
                  {barangayNotice.type === "success" ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 text-destructive" />
                  )}
                  <span>{barangayNotice.message}</span>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 px-1.5 text-[11px]"
                  onClick={() => setBarangayNotice(null)}
                >
                  Dismiss
                </Button>
              </div>
            )}

            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search barangays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs font-normal"
                />
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/40 p-1 rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({barangays.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "active"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("archived")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "archived"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Archived ({archivedCount})
                </button>
              </div>
            </div>

            {/* Barangays Directory Table */}
            <div className="rounded-lg border overflow-hidden">
              <div className="max-h-[360px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-xs">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Barangay</TableHead>
                      <TableHead className="text-xs font-semibold w-[120px]">Status</TableHead>
                      <TableHead className="text-xs font-semibold hidden sm:table-cell">
                        Assigned Maintenance Team
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right w-[160px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingBarangays ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-28 text-center text-xs text-muted-foreground">
                          Loading barangay directory from Supabase...
                        </TableCell>
                      </TableRow>
                    ) : barangaysError ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-28 text-center text-xs text-destructive">
                          <p className="font-semibold">Failed to load barangays</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{barangaysError}</p>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => fetchBarangays()}
                            className="mt-2 text-xs"
                          >
                            <RotateCcw className="size-3 mr-1" /> Retry
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : filteredBarangays.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-28 text-center text-xs text-muted-foreground">
                          {searchQuery
                            ? `No barangays found matching "${searchQuery}".`
                            : statusFilter === "archived"
                            ? "No archived barangays found."
                            : "No barangays found in directory."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBarangays.map((b) => (
                        <TableRow key={b.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="py-2.5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-foreground">
                                {b.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground sm:hidden">
                                {getTeamForBarangay(b.name)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            {b.is_active ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 text-[10px] font-normal"
                              >
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-muted-foreground text-[10px] font-normal"
                              >
                                Archived
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                            {getTeamForBarangay(b.name)}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="xs"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setEditingBarangay(b);
                                  setEditBarangayName(b.name);
                                  setEditError(null);
                                }}
                                title="Edit barangay name"
                              >
                                <Pencil className="size-3 mr-1" />
                                Edit
                              </Button>
                              {b.is_active ? (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="h-7 px-2 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 hover:bg-amber-500/10"
                                  onClick={() => setArchivingBarangay(b)}
                                  title="Archive barangay"
                                >
                                  <Archive className="size-3 mr-1" />
                                  Archive
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => handleRestore(b)}
                                  title="Restore barangay"
                                  disabled={isSubmitting}
                                >
                                  <RotateCcw className="size-3 mr-1" />
                                  Restore
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground flex items-center justify-between border-t py-3">
            <span>
              All active barangays are synchronized with GIS mapping, maintenance crews, and incident reporting queues.
            </span>
            <Link href="/admin/map" className="text-primary hover:underline text-xs">
              View Barangay Map &rarr;
            </Link>
          </CardFooter>
        </Card>

        {/* 3. Notification Preference */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">3. Notification Preferences</CardTitle>
                <CardDescription className="text-xs">
                  Configure real-time dispatch alerts and notifications for the Administrative Console.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Toggle: Admin report notifications */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/20">
              <div className="space-y-0.5">
                <Label
                  htmlFor="admin-notifications"
                  className="text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  Admin Report Notifications
                </Label>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Receive live alerts on the dispatch dashboard whenever a resident submits a new streetlight defect ticket.
                </p>
              </div>
              <Switch
                id="admin-notifications"
                checked={settings.adminNotificationsEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, adminNotificationsEnabled: checked })
                }
              />
            </div>

            {/* Sub-toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor="email-alerts"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Emergency & Hazard Priority
                    </Label>
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 font-normal">
                      High
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Instant priority badge and banner for exposed wires or sparking hazards.
                  </p>
                </div>
                <Switch
                  id="email-alerts"
                  checked={settings.emailAlertsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailAlertsEnabled: checked })
                  }
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor="sound-alerts"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Console Audio Chimes
                    </Label>
                    <Volume2 className="size-3 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Play an audible chime when new incident tickets are logged into central dispatch.
                  </p>
                </div>
                <Switch
                  id="sound-alerts"
                  checked={settings.soundAlertsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, soundAlertsEnabled: checked })
                  }
                  size="sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Appearance & Theme (Preserving existing theme system) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Palette className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">4. Appearance & Theme</CardTitle>
                  <CardDescription className="text-xs">
                    Interface visual theme settings. Integrated directly with the municipal theme provider.
                  </CardDescription>
                </div>
              </div>
              {isMounted && (
                <Badge variant="outline" className="text-xs capitalize font-mono">
                  Active: {theme}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                  <Sun className="size-5" />
                </div>
                <div>
                  <span className="font-semibold text-xs block text-foreground">
                    Light Mode
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Optimal daytime brightness
                  </span>
                </div>
                {theme === "light" && (
                  <Badge variant="default" className="text-[10px] mt-1">
                    <Check className="size-3 mr-1" /> Selected
                  </Badge>
                )}
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <Moon className="size-5" />
                </div>
                <div>
                  <span className="font-semibold text-xs block text-foreground">
                    Dark Mode
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Night dispatch & reduced eye strain
                  </span>
                </div>
                {theme === "dark" && (
                  <Badge variant="default" className="text-[10px] mt-1">
                    <Check className="size-3 mr-1" /> Selected
                  </Badge>
                )}
              </button>

              {/* System Synchronized */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === "system"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Laptop className="size-5" />
                </div>
                <div>
                  <span className="font-semibold text-xs block text-foreground">
                    System Preference
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Synchronizes with device OS
                  </span>
                </div>
                {theme === "system" && (
                  <Badge variant="default" className="text-[10px] mt-1">
                    <Check className="size-3 mr-1" /> Selected
                  </Badge>
                )}
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Theme changes take effect immediately across all admin dashboards, resident view, and landing pages.
            </p>
          </CardContent>
        </Card>

        {/* Save Bar Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground text-center sm:text-left">
            <Settings className="size-4 shrink-0 text-primary" />
            <span>
              All configuration parameters are stored locally and will persist across browser reloads.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleReset}
            >
              <RotateCcw data-icon="inline-start" />
              Reset Defaults
            </Button>
            <Button
              variant="default"
              size="sm"
              className="text-xs"
              onClick={handleSave}
            >
              <Save data-icon="inline-start" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Add Barangay Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add New Barangay</DialogTitle>
            <DialogDescription className="text-xs">
              Register a new official Butuan City barangay into the master directory. It will immediately become available across resident reporting and central dispatch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-barangay-name" className="text-xs font-semibold">
                Barangay Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-barangay-name"
                value={newBarangayName}
                onChange={(e) => {
                  setNewBarangayName(e.target.value);
                  setAddError(null);
                }}
                placeholder="Enter official barangay name..."
                className="text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting && newBarangayName.trim()) {
                    e.preventDefault();
                    handleAddBarangay();
                  }
                }}
              />
              {addError && (
                <p className="text-[11px] text-destructive font-medium">{addError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAddBarangay}
              disabled={isSubmitting || !newBarangayName.trim()}
              className="text-xs"
            >
              {isSubmitting ? "Adding..." : "Add Barangay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Barangay Dialog */}
      <Dialog
        open={!!editingBarangay}
        onOpenChange={(open) => !open && setEditingBarangay(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Barangay Name</DialogTitle>
            <DialogDescription className="text-xs">
              Update the official spelling of this barangay. The existing database ID and historical report associations are strictly preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-barangay-name" className="text-xs font-semibold">
                Barangay Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-barangay-name"
                value={editBarangayName}
                onChange={(e) => {
                  setEditBarangayName(e.target.value);
                  setEditError(null);
                }}
                placeholder="Enter corrected barangay name..."
                className="text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting && editBarangayName.trim()) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
              />
              {editError && (
                <p className="text-[11px] text-destructive font-medium">{editError}</p>
              )}
            </div>
            {editingBarangay && (
              <div className="text-[10px] text-muted-foreground bg-muted/40 p-2 rounded border font-mono">
                Preserved Record ID: {editingBarangay.id}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingBarangay(null)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSubmitting || !editBarangayName.trim()}
              className="text-xs"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog (NEVER Hard Delete) */}
      <Dialog
        open={!!archivingBarangay}
        onOpenChange={(open) => !open && setArchivingBarangay(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Archive Barangay
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Are you sure you want to archive <strong>{archivingBarangay?.name}</strong>? Existing reports and historical records will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1 border">
            <p className="font-semibold text-foreground text-xs">Archive Safeguards:</p>
            <p>• The database record is retained with status set to inactive (<code>is_active = false</code>).</p>
            <p>• Historical incidents, technician dispatches, and reports remain intact.</p>
            <p>• You can restore this barangay to active status at any time.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setArchivingBarangay(null)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmArchive}
              disabled={isSubmitting}
              className="text-xs"
            >
              {isSubmitting ? "Archiving..." : "Archive Barangay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
