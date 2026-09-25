"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Lightbulb, ShieldCheck, MapPin, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthLayoutProps {
  mode: "sign-in" | "sign-up";
  children: React.ReactNode;
}

export function AuthLayout({ mode, children }: AuthLayoutProps) {
  const isSignIn = mode === "sign-in";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors selection:bg-primary selection:text-primary-foreground">
      {/* Top Utility Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
              <span>Back to Home</span>
            </Button>
          </Link>

          {/* Center Brand for Mobile */}
          <Link href="/" className="flex items-center gap-2 sm:hidden group">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
              <Lightbulb className="size-4 text-amber-300" />
            </div>
            <span className="font-heading font-semibold text-sm tracking-tight text-foreground">
              Butuan Streetlight
            </span>
          </Link>

          {/* Theme & Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle showLabel />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Civic Context & Features (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center gap-6 pr-4">
            {/* Branding Header */}
            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shrink-0">
                <Lightbulb className="size-6 text-amber-300" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-xl tracking-tight text-foreground">
                    Butuan City
                  </span>
                  <Badge variant="outline" className="text-[11px] font-normal border-primary/30">
                    LGU Portal
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  Streetlight Problem Reporting & Monitoring System
                </span>
              </div>
            </div>

            {/* Purpose Overview */}
            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {isSignIn ? "Welcome Back to Citizen Portal" : "Join the Butuan Citizen Network"}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isSignIn
                  ? "Sign in to report dark streets, track ongoing repair tickets, or manage citywide maintenance operations."
                  : "Create your citizen account to immediately start submitting streetlight malfunction reports across all 86 barangays."}
              </p>
            </div>

            {/* Feature Points */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 rounded-lg border bg-card/60 p-3 shadow-xs">
                <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Citywide Coverage</div>
                  <div className="text-muted-foreground">
                    Accurately report issues across all 86 urban and rural barangays in Butuan City.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border bg-card/60 p-3 shadow-xs">
                <Zap className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Rapid City Engineering Dispatch</div>
                  <div className="text-muted-foreground">
                    Verified citizen reports are directly routed to maintenance dispatch teams.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border bg-card/60 p-3 shadow-xs">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Secure Role System</div>
                  <div className="text-muted-foreground">
                    All new registrations are granted Resident access by default. Admin accounts are managed directly by City Engineering administrators.
                  </div>
                </div>
              </div>
            </div>

            {/* Role Notice Guarantee */}
            <div className="rounded-lg bg-muted/50 border border-border/80 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5">
              <Lock className="size-4 text-muted-foreground shrink-0" />
              <span>
                <strong>Role Notice:</strong> Role assignment is strictly automated. Resident status is applied by default, and administrative roles cannot be requested during sign-up.
              </span>
            </div>
          </div>

          {/* Right Column: Clean Authentication Box */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-[460px] space-y-4">
              {/* Header Badge */}
              <div className="flex items-center justify-between px-1">
                <Badge variant="outline" className="gap-1.5 text-xs py-0.5 px-2.5 border-primary/20">
                  <ShieldCheck className="size-3.5 text-primary" />
                  {isSignIn ? "Citizen & Municipal Sign In" : "Resident Registration (Default)"}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Official LGU Access
                </span>
              </div>

              {/* Elevated Card Containing the Auth Component */}
              <Card className="border bg-card shadow-md rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  {children}
                </CardContent>
              </Card>

              {/* Bottom Clarification Notice */}
              <div className="rounded-lg bg-muted/40 border border-border/60 p-3 text-center text-xs text-muted-foreground">
                {isSignIn ? (
                  <span>
                    Having trouble? Contact the <strong>City Engineering Maintenance Desk</strong> at{" "}
                    <span className="font-mono text-foreground">support@butuan.gov.ph</span>
                  </span>
                ) : (
                  <span>
                    By creating an account, you are registered as a <strong>Resident</strong> with immediate access to submit and track community streetlight reports.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground bg-background/50">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl">
          <span>Republic of the Philippines • City Government of Butuan • City Engineering Office</span>
          <div className="flex items-center gap-4">
            <Link href="/#features" className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="/#barangays" className="hover:text-foreground transition-colors">
              Coverage
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
