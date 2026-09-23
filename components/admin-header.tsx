"use client";

import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
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
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 font-normal border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              Operational
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            City Government of Butuan • Streetlight Maintenance Division
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell with Badge */}
        <div className="relative">
          <Button variant="outline" size="icon-sm" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            3
          </span>
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
