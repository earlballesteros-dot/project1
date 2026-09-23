"use client";

import Link from "next/link";
import {
  Lightbulb,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  HelpCircle,
  Shield,
  ArrowRight,
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MOCK_RESIDENT_REPORTS } from "@/lib/mock-data";

export default function ResidentDashboard() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Resident Dashboard
            </h1>
            <Badge variant="outline" className="text-xs">
              Brgy. Libertad Resident
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Track your submitted streetlight reports and submit new service requests to the Butuan City Engineering Office.
          </p>
        </div>

        {/* Modal Dialog for New Report Placeholder */}
        <Dialog>
          <DialogTrigger render={<Button size="lg" className="shrink-0" />}>
            <PlusCircle data-icon="inline-start" />
            Report New Streetlight Issue
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-1">
                <Lightbulb className="size-5 text-amber-500" />
              </div>
              <DialogTitle>Submit Streetlight Report</DialogTitle>
              <DialogDescription>
                This form will be integrated in the upcoming step with Supabase and photo attachment upload.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-1.5">
                <span className="font-semibold text-foreground">Planned Fields in Next Step:</span>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Barangay selector (86 Butuan City Barangays)</li>
                  <li>Street name, purok & nearest landmark</li>
                  <li>Streetlight pole ID tag (e.g., BXU-LIB-048)</li>
                  <li>Outage type (Dark road, flickering, leaning pole, exposed wire)</li>
                  <li>Photo upload of defect or damaged pole</li>
                  <li>Reporter contact info for technician dispatch updates</li>
                </ul>
              </div>
              <p className="text-[11px] text-muted-foreground">
                For immediate life-threatening electrical hazards, please dial 911 directly.
              </p>
            </div>

            <DialogFooter showCloseButton>
              <Button disabled variant="secondary" size="sm">
                Form Connects in Step 2
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reports Filed
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              {MOCK_RESIDENT_REPORTS.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Recorded under your citizen profile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active / In Progress
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400">
              1
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Assigned to line crew for inspection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Repaired & Restored
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
              1
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lighting verified functional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">My Streetlight Problem Reports</CardTitle>
                  <CardDescription>
                    History of reports submitted from your account with real-time status updates.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {MOCK_RESIDENT_REPORTS.length} Reports
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Location & Pole</TableHead>
                    <TableHead>Problem Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_RESIDENT_REPORTS.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {report.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">
                            {report.barangay}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {report.landmark} ({report.poleNumber})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {report.issueType}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {report.reportedDate}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            report.status === "Resolved"
                              ? "outline"
                              : report.status === "In Progress"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[11px]"
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>Showing mock resident data</span>
              <span className="text-primary hover:underline cursor-pointer">
                Refresh status
              </span>
            </CardFooter>
          </Card>
        </div>

        {/* Helpful Tips Sidebar Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 text-primary" />
                <CardTitle className="text-base">Helpful Reporting Tips</CardTitle>
              </div>
              <CardDescription>
                Providing accurate details helps Butuan City crews dispatch the right equipment.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Find the Pole Tag:</span>
                  <p>
                    Most concrete and metal poles have an aluminum tag at eye-level showing the code (e.g., BXU-LIB-048).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Specify the Outage:</span>
                  <p>
                    Note whether it is a single dark bulb, an entire row of unlit posts, or a light burning during daylight hours.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Shield className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Safety First:</span>
                  <p>
                    Do not touch or approach leaning poles, dangling wires, or flooded areas near electrical fixtures.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-3">
              <Link href="/admin" className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Inspect Admin View
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
