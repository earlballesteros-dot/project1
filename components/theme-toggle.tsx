"use client";

import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon-sm"}
      onClick={toggleTheme}
      className={className}
      aria-label="Toggle theme mode"
      title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4 text-amber-400 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="size-4 text-foreground transition-all rotate-0 scale-100" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
      <span className="sr-only">
        {resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </span>
    </Button>
  );
}
