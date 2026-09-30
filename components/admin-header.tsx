"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  Bell,
  CheckCheck,
  Clock,
  MapPin,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStoredReports } from "@/lib/reports-store";
import type { StreetlightReport } from "@/lib/mock-data";
import { useIsAdmin } from "@/lib/roles";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

const READ_NOTIFICATIONS_STORAGE_KEY = "butuan_read_notifications";

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const isAdmin = useIsAdmin();
  const [reports, setReports] = useState<StreetlightReport[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize reports and read state with localStorage & custom events
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReports(getStoredReports());

    try {
      const stored = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadIds(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to read notification read state:", e);
    }

    const handleReportsChange = () => {
      setReports(getStoredReports());
    };

    const handleStorageChange = () => {
      setReports(getStoredReports());
      try {
        const stored = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setReadIds(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to sync notification state:", e);
      }
    };

    window.addEventListener("butuan-reports-changed", handleReportsChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("butuan-reports-changed", handleReportsChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save read notification:", e);
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = reports.map((r) => r.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allIds));
    } catch (e) {
      console.error("Failed to save read notifications:", e);
    }
  };

  // Derive unread reports and count based on real reports from store
  const unreadReports = reports.filter((r) => !readIds.includes(r.id));
  const unreadCount = unreadReports.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile toggle button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          className="lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </Button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-base font-semibold leading-tight sm:text-lg">
              Streetlight Dispatch & Monitoring Console
            </h1>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-[10px] py-0 px-1.5 font-normal border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            >
              Operational
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            City Government of Butuan • Streetlight Maintenance Division
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Navigation Quick Links */}
        <Link href="/" className="hidden lg:inline-flex">
          <Button variant="ghost" size="sm" className="text-xs">
            Public Home
          </Button>
        </Link>
        {!isAdmin && (
          <Link href="/resident" className="hidden lg:inline-flex">
            <Button variant="outline" size="sm" className="text-xs">
              Resident Portal
            </Button>
          </Link>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Functional Notification Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Notifications"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
            className={isOpen ? "bg-muted text-foreground" : ""}
          >
            <Bell className="size-4" />
          </Button>

          {/* Unread count badge - dynamically hidden when unreadCount is 0 */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground pointer-events-none animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}

          {/* Notification Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border bg-card text-card-foreground shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Incident Notifications</span>
                  {unreadCount > 0 ? (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-normal">
                      {unreadCount} new
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground font-normal">
                      All read
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={markAllAsRead}
                    className="text-[11px] text-muted-foreground hover:text-foreground h-6 px-1.5"
                  >
                    <CheckCheck className="size-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
                {reports.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <Inbox className="size-6 text-muted-foreground/60" />
                    <span>No incident reports recorded yet.</span>
                  </div>
                ) : (
                  reports.slice(0, 10).map((report) => {
                    const isUnread = !readIds.includes(report.id);
                    return (
                      <div
                        key={report.id}
                        onClick={() => markAsRead(report.id)}
                        className={`p-3 text-xs flex flex-col gap-1.5 transition-colors cursor-pointer ${
                          isUnread
                            ? "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15"
                            : "hover:bg-muted/50 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {isUnread && (
                              <span className="size-2 rounded-full bg-primary shrink-0" />
                            )}
                            <span className="font-mono font-semibold text-foreground text-[11px]">
                              {report.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant={
                                report.priority === "Emergency"
                                  ? "destructive"
                                  : report.priority === "High"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-[9px] px-1 py-0 font-normal"
                            >
                              {report.priority}
                            </Badge>
                            <Badge
                              variant={
                                report.status === "Resolved"
                                  ? "outline"
                                  : report.status === "In Progress"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-[9px] px-1 py-0 font-normal"
                            >
                              {report.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="font-medium text-foreground text-[11px] leading-tight">
                          {report.issueType}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">
                            Brgy. {report.barangay} • {report.landmark}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {report.reportedDate}
                          </span>
                          {isUnread && (
                            <span className="text-primary font-medium text-[10px]">
                              Mark as read
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t p-2.5 bg-muted/20 text-center">
                <Link
                  href="/admin#reports"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                >
                  View All Reports in Operations Dashboard
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin profile snippet */}
        <div className="flex items-center gap-2 pl-2 border-l">
          <Avatar size="sm" className="bg-primary text-primary-foreground">
            <AvatarFallback className="text-xs font-semibold">MT</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold leading-none">Engr. M. Torralba</span>
            <span className="text-[10px] text-muted-foreground">Chief City Engineer</span>
          </div>
        </div>
      </div>
    </header>
  );
}
