"use client";

import Link from "next/link";
import { Lightbulb, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ResidentNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Portal Type */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Lightbulb className="size-4 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-semibold text-sm sm:text-base leading-tight">
                Butuan Streetlight
              </span>
              <span className="text-[11px] text-muted-foreground">Citizen Services</span>
            </div>
          </Link>

          <Badge variant="secondary" className="hidden sm:inline-flex gap-1 items-center font-normal">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Resident Portal
          </Badge>
        </div>

        {/* Center / Quick Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/resident" className="text-foreground hover:text-primary transition-colors">
            My Incident Reports
          </Link>
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Public Status
          </Link>
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Shield className="size-3.5 text-muted-foreground" />
            Switch to Admin View
          </Link>
        </nav>

        {/* User Profile & Back to Home */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              <ArrowLeft data-icon="inline-start" />
              Public Home
            </Button>
          </Link>

          <div className="flex items-center gap-2.5 pl-2 border-l">
            <Avatar size="sm" className="bg-primary/10 text-primary border border-primary/20">
              <AvatarFallback className="font-semibold text-xs text-primary">ER</AvatarFallback>
            </Avatar>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium leading-none">Elena Ramos</span>
              <span className="text-[10px] text-muted-foreground">Brgy. Libertad, BXU</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
