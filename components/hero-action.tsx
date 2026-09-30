"use client";

import Link from "next/link";
import { Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/roles";

export function HeroAction({ initialIsAdmin = false }: { initialIsAdmin?: boolean }) {
  const isAdmin = useIsAdmin();

  // If the current authenticated user is an admin, hide this Resident Portal button
  if (isAdmin || initialIsAdmin) {
    return null;
  }

  // If the user is a resident or signed out, preserve the existing resident/reporting behavior
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <Link href="/resident">
        <Button size="lg" className="w-full sm:w-auto font-medium shadow-sm">
          <Lightbulb data-icon="inline-start" className="text-amber-300" />
          Report Streetlight (Resident Portal)
          <ArrowRight data-icon="inline-end" />
        </Button>
      </Link>
    </div>
  );
}
