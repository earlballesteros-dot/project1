"use client";

import { useState, useEffect } from "react";
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
import { BUTUAN_MAINTENANCE_TEAMS } from "@/lib/teams-data";
import { useIsAdmin } from "@/lib/roles";

export function AdminSettingsClient() {
  const isAdmin = useIsAdmin();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Synchronize settings from local storage on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getStoredSettings());
    setIsMounted(true);
  }, []);

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
        // If it's the last one, keep at least one
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
    const team = BUTUAN_MAINTENANCE_TEAMS.find((t) =>
      t.assignedBarangays.includes(barangay)
    );
    return team ? team.name : "Unassigned";
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

        {/* 2. Coverage (12 Selected Barangays) */}
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
                    Scope of the 12 supported Butuan City barangays served by municipal repair teams.
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge variant="outline" className="font-mono text-xs">
                  {settings.coverageBarangays.length} / 12 Active
                </Badge>
                {settings.coverageBarangays.length < SUPPORTED_BARANGAYS_12.length && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleSelectAllBarangays}
                    className="text-xs text-primary"
                  >
                    Select All 12
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {SUPPORTED_BARANGAYS_12.map((barangay) => {
                const isSelected = settings.coverageBarangays.includes(barangay);
                const assignedTeam = getTeamForBarangay(barangay);

                return (
                  <div
                    key={barangay}
                    onClick={() => toggleBarangay(barangay)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-card border-primary/40 shadow-xs hover:border-primary"
                        : "bg-muted/20 border-border/50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        {barangay}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                        {assignedTeam}
                      </span>
                    </div>
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => toggleBarangay(barangay)}
                      size="sm"
                      aria-label={`Toggle coverage for ${barangay}`}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground flex items-center justify-between border-t py-3">
            <span>
              All 12 barangays are synchronized with GIS mapping and incident reporting queues.
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
    </div>
  );
}
