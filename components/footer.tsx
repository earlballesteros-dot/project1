import Link from "next/link";
import { Lightbulb, Phone, ShieldCheck, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30 text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Lightbulb className="size-4 text-amber-300" />
              </div>
              <span className="font-heading font-semibold text-foreground text-base">
                Butuan City Streetlight System
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              An initiative for reporting damaged streetlights, unlit roadways, and electrical hazards across all 86 barangays of Butuan City to ensure community safety.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span>City Hall Complex, J.P. Rosales Ave, Butuan City, Agusan del Norte</span>
            </div>
          </div>

          {/* Quick Access */}
          <div className="flex flex-col gap-3 text-sm">
            <span className="font-semibold text-foreground">Portals & Services</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              Citizen Public Home
            </Link>
            <Link href="/resident" className="hover:text-foreground transition-colors">
              Resident Dashboard
            </Link>
            <Link href="/admin" className="hover:text-foreground transition-colors">
              City Admin Portal
            </Link>
            <Link href="/#barangays" className="hover:text-foreground transition-colors">
              Monitored Barangays
            </Link>
          </div>

          {/* Emergency & Municipal Contacts */}
          <div className="flex flex-col gap-3 text-sm">
            <span className="font-semibold text-foreground">Emergency Contacts</span>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>CDRRMO Butuan: 911 / (085) 342-8356</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-amber-600 dark:text-amber-400" />
                <span>City Engineering: (085) 815-1234</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>Electric Coop (ANECO): (085) 341-5254</span>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="flex flex-col gap-3 text-sm">
            <span className="font-semibold text-foreground">Project Scope</span>
            <p className="text-xs leading-normal">
              Butuan City Streetlight Problem Reporting and Monitoring System.
            </p>
            <div className="rounded-md border bg-background/50 p-2.5 text-[11px] leading-tight flex flex-col gap-1">
              <span className="font-medium text-foreground">Phase 1: Frontend Foundation</span>
              <span>Next.js 16 • Tailwind CSS v4 • shadcn/ui • TypeScript</span>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            &copy; {new Date().getFullYear()} Butuan City Streetlight Problem Reporting and Monitoring System. Academic Project.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              Community Safety Initiative
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
