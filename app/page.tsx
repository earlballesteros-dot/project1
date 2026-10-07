import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Wrench,
  Activity,
  PhoneCall,
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
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Beams } from "@/components/beams";
import { HeroAction } from "@/components/hero-action";
import { HeroLiveMetrics, HeroLiveCard } from "@/components/hero-live-status";
import { isAdmin } from "@/lib/roles-server";
import { supabase } from "@/lib/supabase";

function BarangayCoverageGrid({
  barangays,
  error,
}: {
  barangays: { id: string; name: string; is_active: boolean }[];
  error: string | null;
}) {
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        <p className="font-semibold">Unable to load coverage barangays at this time.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Please refresh the page to reload the coverage list.
        </p>
      </div>
    );
  }

  if (!barangays || barangays.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        No active barangays found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {barangays.map((brgy) => (
        <div
          key={brgy.id}
          className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-medium transition-colors hover:border-primary/50"
        >
          <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">{brgy.name}</span>
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const admin = await isAdmin();

  let barangays: { id: string; name: string; is_active: boolean }[] = [];
  let barangaysError: string | null = null;

  try {
    const { data, error } = await supabase
      .from("barangays")
      .select("id, name, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching barangays for homepage:", error.message);
      barangaysError = error.message;
    } else if (data) {
      barangays = data;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("Failed to query barangays:", message);
    barangaysError = message;
  }

  const barangaysCovered = barangays.length;
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 via-background to-background py-16 sm:py-24">
          {/* React Bits Beams Background - Hero Only */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-35 dark:opacity-45">
            <Beams
              beamWidth={2}
              beamHeight={15}
              beamNumber={12}
              speed={1.5}
              noiseIntensity={1.5}
              scale={0.2}
              rotation={15}
            />
          </div>

          <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              <div className="flex flex-col items-start gap-6 lg:col-span-7">
                <Badge variant="outline" className="gap-2 px-3 py-1 text-xs border-primary/30">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Official LGU Civic Initiative • Butuan City
                </Badge>

                <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-tight">
                  Butuan City Streetlight Problem Reporting & Monitoring System
                </h1>

                <p className="text-base text-muted-foreground sm:text-lg leading-relaxed">
                  Help illuminate and secure our communities. Quickly report broken fixtures, dark roads, or hazardous streetlight wires directly to the Butuan City Engineering Maintenance Division.
                </p>

                {/* Primary Action Button */}
                <HeroAction initialIsAdmin={admin} />

                {/* Key Metrics Pill */}
                <HeroLiveMetrics barangaysCovered={barangaysCovered} />
              </div>

              {/* Hero Visual Card / Live Status Snapshot */}
              <div className="lg:col-span-5">
                <HeroLiveCard />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="features" className="py-16 sm:py-20 border-b">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col gap-3">
              <Badge variant="secondary" className="mx-auto w-fit text-xs">
                Simple Civic Workflow
              </Badge>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
                How Streetlight Problem Reporting Works
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                A seamless process connecting community residents directly to the maintenance crews on the ground.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <MapPin className="size-5" />
                  </div>
                  <CardTitle className="text-lg">1. Pinpoint & Report</CardTitle>
                  <CardDescription>
                    Residents identify the defective pole, select their barangay, and describe the issue (unlit, flickering, or exposed hazard).
                  </CardDescription>
                </CardHeader>
                <CardFooter className="text-xs text-muted-foreground border-t pt-3">
                  No complex setup required
                </CardFooter>
              </Card>

              <Card className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <Wrench className="size-5" />
                  </div>
                  <CardTitle className="text-lg">2. Dispatch & Inspection</CardTitle>
                  <CardDescription>
                    The City Engineering Office reviews the ticket, verifies the location, and dispatches line crews with the proper replacement parts.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="text-xs text-muted-foreground border-t pt-3">
                  Categorized by urgency level
                </CardFooter>
              </Card>

              <Card className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg">3. Resolution & Transparency</CardTitle>
                  <CardDescription>
                    Repairs are logged and marked resolved. Residents receive status notifications and the city maintains a reliable lighting audit log.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="text-xs text-muted-foreground border-t pt-3">
                  Publicly trackable ticket IDs
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Coverage Barangays Section */}
        <section id="barangays" className="py-16 sm:py-20 bg-muted/20 border-b">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <Badge variant="outline" className="text-xs mb-2">
                  City-Wide Coverage
                </Badge>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
                  Serving All Barangays of Butuan City
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Active monitoring across urban centers, highway corridors, and residential puroks.
                </p>
              </div>
              {!admin && (
                <Link href="/resident">
                  <Button variant="outline" size="sm">
                    Check Your Barangay
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </Link>
              )}
            </div>

            <BarangayCoverageGrid barangays={barangays} error={barangaysError} />

            {/* Emergency Hotline Banner */}
            <div className="mt-12 rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Immediate Danger or Fallen Live Wires?
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    If a streetlight pole has fallen or has sparking electrical wires, do not approach. Contact Butuan City CDRRMO Emergency Hotline immediately at (085) 342-8356 or dial 911.
                  </p>
                </div>
              </div>
              <a href="tel:911" className="shrink-0">
                <Button variant="destructive" size="sm">
                  <PhoneCall data-icon="inline-start" />
                  Call Emergency 911
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
