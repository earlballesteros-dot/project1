"use client";

import Link from "next/link";
import { useState } from "react";
import { Lightbulb, Menu, X, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Lightbulb className="size-5 text-amber-300 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base tracking-tight text-foreground sm:text-lg">
                Butuan City Streetlight System
              </span>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 font-normal border-primary/30">
                LGU Citizen Portal
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              City Engineering & Maintenance Services
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="text-foreground transition-colors hover:text-primary font-semibold"
          >
            Home
          </Link>
          <Link
            href="/#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </Link>
          <Link
            href="/#barangays"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Coverage
          </Link>
          <Link
            href="/resident"
            className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5"
          >
            Resident Portal
          </Link>
          <Link
            href="/admin"
            className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5"
          >
            <ShieldCheck className="size-4 text-primary" />
            Admin Portal
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">
                Sign Up
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/resident">
              <Button variant="outline" size="sm">
                Report Streetlight
                <ArrowRight data-icon="inline-end" />
              </Button>
            </Link>
            <UserButton />
          </Show>
        </div>

        {/* Mobile Menu Trigger & Theme */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 font-medium text-foreground hover:text-primary"
            >
              Home
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-muted-foreground hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="/#barangays"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-muted-foreground hover:text-foreground"
            >
              Coverage
            </Link>
            <Link
              href="/resident"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-muted-foreground hover:text-foreground"
            >
              Resident Portal
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-muted-foreground hover:text-foreground"
            >
              Admin Dashboard
            </Link>
            <div className="flex flex-col gap-2 pt-3 border-t">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="w-full">
                    Sign Up
                  </Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <div className="flex items-center justify-between py-1 px-1">
                  <span className="text-xs text-muted-foreground">My Account</span>
                  <UserButton showName />
                </div>
                <Link href="/resident" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Report Outage Now</Button>
                </Link>
              </Show>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
