"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Lightbulb,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard Overview",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
      badge: "Live",
    },
    {
      title: "All Incident Reports",
      href: "/admin#reports",
      icon: ClipboardList,
      active: false,
      badge: "6 New",
    },
    {
      title: "Barangay Map & GIS",
      href: "/admin#map",
      icon: MapPin,
      active: false,
      badge: "Soon",
    },
    {
      title: "Maintenance Teams",
      href: "/admin#crews",
      icon: Users,
      active: false,
    },
    {
      title: "Analytics & Resolution",
      href: "/admin#analytics",
      icon: BarChart3,
      active: false,
    },
    {
      title: "System Settings",
      href: "/admin#settings",
      icon: Settings,
      active: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Lightbulb className="size-4 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-sm tracking-tight">
                Butuan City LGU
              </span>
              <span className="text-[11px] text-muted-foreground">
                Engineering & Maintenance
              </span>
            </div>
          </Link>
        </div>

        {/* System Status Callout */}
        <div className="p-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Monitoring Active
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                86 Brgys
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Connected to Butuan City Central Dispatch Console.
            </p>
          </div>
        </div>

        <div className="px-4 py-2">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Management
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0" />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant={item.active ? "secondary" : "outline"}
                    className="text-[10px] py-0 px-1.5 font-normal"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Switcher / External links */}
        <div className="mt-auto border-t p-4 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
              Cross Navigation
            </span>
            <Link
              href="/resident"
              className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span>Resident Portal View</span>
              <ChevronRight className="size-3.5" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span>Public Landing Page</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </div>

          <Separator className="my-1" />

          {/* Admin user role footer */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              AD
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-medium leading-none">Admin Console</span>
              <span className="text-[10px] text-muted-foreground">City Engineer Office</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
