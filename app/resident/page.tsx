"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  HelpCircle,
  Shield,
  ArrowRight,
  UploadCloud,
  Send,
  X,
  PhoneCall,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Camera,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  MOCK_RESIDENT_REPORTS,
  MOCK_BARANGAYS,
  type StreetlightReport,
} from "@/lib/mock-data";
import { getStoredReports, saveReport } from "@/lib/reports-store";

const PROBLEM_TYPES = [
  "Total Outage / Unlit Street",
  "Flickering / Intermittent Light",
  "Damaged or Leaning Post",
  "Exposed Wires / Electrical Sparking",
  "Day Burning (Light Always On)",
  "Broken Fixture / Fallen Glass",
  "Other Streetlight Issue",
];

export default function ResidentProblemReportingPage() {
  // Form fields state
  const [reporterName, setReporterName] = useState("Elena Ramos");
  const [contactInfo, setContactInfo] = useState("0917 555 2341");
  const [barangay, setBarangay] = useState("Libertad");
  const [streetLandmark, setStreetLandmark] = useState("");
  const [poleNumber, setPoleNumber] = useState("");
  const [problemType, setProblemType] = useState("Total Outage / Unlit Street");
  const [problemDescription, setProblemDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submitted ticket confirmation state
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    reporterName: string;
    contactInfo: string;
    barangay: string;
    landmark: string;
    poleNumber: string;
    problemType: string;
    problemDescription: string;
    timestamp: string;
    photoPreviewUrl?: string | null;
  } | null>(null);

  // Incident reports table state
  const [reportsList, setReportsList] = useState<StreetlightReport[]>([]);

  // Synchronize with shared local storage
  useEffect(() => {
    setReportsList(getStoredReports());

    const handleStorageChange = () => {
      setReportsList(getStoredReports());
    };

    window.addEventListener("butuan-reports-changed", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("butuan-reports-changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please choose a smaller image.");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !reporterName.trim() ||
      !contactInfo.trim() ||
      !barangay ||
      !streetLandmark.trim() ||
      !problemDescription.trim()
    ) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedId = `BXU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const dateString = now.toISOString().split("T")[0];
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newSubmitted = {
        id: generatedId,
        reporterName,
        contactInfo,
        barangay,
        landmark: streetLandmark,
        poleNumber: poleNumber.trim() || "Not specified",
        problemType,
        problemDescription,
        timestamp: `${dateString} at ${timeString}`,
        photoPreviewUrl: photoPreview,
      };

      setSubmittedTicket(newSubmitted);

      // Add to interactive reports table and persist in local storage
      const newReportItem: StreetlightReport = {
        id: generatedId,
        barangay,
        landmark: `${streetLandmark}${poleNumber.trim() ? ` (${poleNumber.trim()})` : ""}`,
        poleNumber: poleNumber.trim() || "N/A",
        issueType: problemType,
        description: problemDescription,
        contactInfo: contactInfo,
        photoUrl: photoPreview || undefined,
        reportedDate: dateString,
        status: "Pending",
        priority:
          problemType.toLowerCase().includes("wire") ||
          problemType.toLowerCase().includes("hazard")
            ? "Emergency"
            : "High",
        assignedTeam: "Pending Dispatch",
        residentName: `${reporterName} (You)`,
      };

      const updated = saveReport(newReportItem);
      setReportsList(updated);
      setIsSubmitting(false);
    }, 350);
  };

  const handleResetForm = () => {
    setStreetLandmark("");
    setPoleNumber("");
    setProblemType("Total Outage / Unlit Street");
    setProblemDescription("");
    handleRemovePhoto();
    setSubmittedTicket(null);
  };

  const activeReportsCount = reportsList.filter((r) => r.status === "Pending" || r.status === "In Progress").length;
  const resolvedReportsCount = reportsList.filter((r) => r.status === "Resolved").length;

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lightbulb className="size-5 text-amber-500" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Report a Streetlight Problem
            </h1>
            <Badge variant="outline" className="text-xs">
              Butuan Resident Portal
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Submit a defective pole, dark roadway, or electrical hazard report directly to the City Engineering Maintenance Division.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a href="#reports">
            <Button variant="outline" size="sm" className="text-xs">
              <FileText data-icon="inline-start" />
              View My Reports ({reportsList.length})
            </Button>
          </a>
        </div>
      </div>

      {/* Main Grid: Form / Confirmation on left, Sidebar tips on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {submittedTicket ? (
            /* Confirmation Message Card */
            <Card className="border-emerald-500/40 bg-card shadow-sm">
              <CardHeader className="text-center pb-4 border-b bg-emerald-500/5">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  <CheckCircle2 className="size-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Report Submitted Successfully!
                </CardTitle>
                <CardDescription className="text-sm max-w-md mx-auto">
                  Thank you for helping keep Butuan City safe and well-lit. Your report has been registered in the City Engineering queue.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 flex flex-col gap-5">
                {/* Reference Badge */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg border bg-muted/40">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Ticket Reference ID
                    </span>
                    <span className="font-mono text-lg font-bold text-primary">
                      {submittedTicket.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                      <Clock className="size-3 mr-1 text-amber-500" />
                      Pending Assessment
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal">
                      {submittedTicket.timestamp}
                    </Badge>
                  </div>
                </div>

                {/* Submitted Details Summary */}
                <div className="rounded-lg border divide-y text-xs">
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span className="text-muted-foreground font-medium">Reporter</span>
                    <span className="sm:col-span-2 text-foreground font-semibold">
                      {submittedTicket.reporterName} ({submittedTicket.contactInfo})
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span className="text-muted-foreground font-medium">Location</span>
                    <span className="sm:col-span-2 text-foreground">
                      Brgy. {submittedTicket.barangay} • {submittedTicket.landmark}
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span className="text-muted-foreground font-medium">Pole Tag</span>
                    <span className="sm:col-span-2 font-mono text-foreground">
                      {submittedTicket.poleNumber}
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span className="text-muted-foreground font-medium">Problem Type</span>
                    <span className="sm:col-span-2 text-foreground font-medium">
                      {submittedTicket.problemType}
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span className="text-muted-foreground font-medium">Description</span>
                    <span className="sm:col-span-2 text-foreground leading-relaxed">
                      {submittedTicket.problemDescription}
                    </span>
                  </div>
                  {submittedTicket.photoPreviewUrl && (
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                      <span className="text-muted-foreground font-medium">Attached Photo</span>
                      <div className="sm:col-span-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={submittedTicket.photoPreviewUrl}
                          alt="Streetlight Defect"
                          className="h-28 w-auto rounded-md object-cover border"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-foreground">Next Step: </strong>
                    An engineering dispatch officer will evaluate the ticket within 24 to 48 hours. A line crew will be sent with the proper fixtures for repair.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto text-xs"
                >
                  <RotateCcw data-icon="inline-start" />
                  Submit Another Report
                </Button>
                <a href="#reports" className="w-full sm:w-auto">
                  <Button className="w-full text-xs">
                    View in Incident Table
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ) : (
            /* Problem Reporting Form */
            <Card className="shadow-xs border-border">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg">Incident Details Form</CardTitle>
                    <CardDescription>
                      All fields marked with an asterisk (<span className="text-destructive">*</span>) are required.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-normal">
                    Step 1 of 1
                  </Badge>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="pt-6 flex flex-col gap-6">
                  {/* Section 1: Reporter Information */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        1
                      </span>
                      <h3 className="font-semibold text-sm text-foreground">
                        Reporter Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="reporterName">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="reporterName"
                          value={reporterName}
                          onChange={(e) => setReporterName(e.target.value)}
                          placeholder="e.g., Juan Dela Cruz"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="contactInfo">
                          Contact Number or Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contactInfo"
                          type="text"
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          placeholder="e.g., 0917 123 4567"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Section 2: Streetlight Location */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        2
                      </span>
                      <h3 className="font-semibold text-sm text-foreground">
                        Streetlight Location
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="barangay">
                          Barangay <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="barangay"
                          value={barangay}
                          onChange={(e) => setBarangay(e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                          required
                        >
                          {MOCK_BARANGAYS.map((b) => (
                            <option key={b} value={b} className="text-foreground bg-background">
                              Brgy. {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="poleNumber">
                          Pole Tag / ID Number <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                        </Label>
                        <Input
                          id="poleNumber"
                          value={poleNumber}
                          onChange={(e) => setPoleNumber(e.target.value)}
                          placeholder="e.g., BXU-LIB-048"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="streetLandmark">
                        Street, Purok & Nearest Landmark <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="streetLandmark"
                        value={streetLandmark}
                        onChange={(e) => setStreetLandmark(e.target.value)}
                        placeholder="e.g., Purok 3, Montilla Blvd corner J.C. Aquino Ave, in front of pharmacy"
                        required
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Section 3: Problem Details */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        3
                      </span>
                      <h3 className="font-semibold text-sm text-foreground">
                        Problem Details
                      </h3>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="problemType">
                        Problem Type <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id="problemType"
                        value={problemType}
                        onChange={(e) => setProblemType(e.target.value)}
                        className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                        required
                      >
                        {PROBLEM_TYPES.map((type) => (
                          <option key={type} value={type} className="text-foreground bg-background">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="problemDescription">
                        Problem Description & Hazards <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="problemDescription"
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                        placeholder="Describe what is wrong, when you observed the issue, and if there are immediate risks (e.g., completely dark roadway, exposed live wire, leaning near power line)..."
                        className="min-h-[100px]"
                        required
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Section 4: Optional Photo Upload UI */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                          4
                        </span>
                        <h3 className="font-semibold text-sm text-foreground">
                          Photo Attachment <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                        </h3>
                      </div>
                      <span className="text-[11px] text-muted-foreground">PNG, JPG, WebP up to 5MB</span>
                    </div>

                    {photoPreview ? (
                      /* Preview Box */
                      <div className="relative flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoPreview}
                            alt="Uploaded preview"
                            className="size-16 rounded-md object-cover border"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                              {photoFile?.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {photoFile ? `${(photoFile.size / 1024).toFixed(1)} KB` : ""}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePhoto}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="size-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      /* Upload Box Trigger */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
                      >
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                          <UploadCloud className="size-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">
                            Click or drag to attach pole photo
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Helps linemen verify fixture type before heading to location
                          </span>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="border-t bg-muted/10 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="size-4 text-emerald-500 shrink-0" />
                    <span>Submitted reports are logged for Butuan City public safety tracking.</span>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="size-4 mr-1.5 animate-spin" />
                        Submitting Ticket...
                      </>
                    ) : (
                      <>
                        <Send data-icon="inline-start" />
                        Submit Streetlight Report
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>

        {/* Sidebar Info & Safety Tips */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Emergency Alert Box */}
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <h3 className="font-semibold text-sm text-foreground">
                  Immediate Hazard Alert
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  For sparking wires, fallen poles across active roads, or electrical emergencies, contact CDRRMO immediately.
                </p>
              </div>
            </div>
            <a href="tel:911" className="w-full">
              <Button variant="destructive" size="sm" className="w-full text-xs">
                <PhoneCall data-icon="inline-start" />
                Dial Emergency 911
              </Button>
            </a>
          </div>

          {/* Reporting Tips Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 text-primary" />
                <CardTitle className="text-base">Helpful Reporting Tips</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Accurate details speed up inspection times by City Engineering.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Locate the Pole Tag:</span>
                  <p>
                    Most concrete and metal posts have an aluminum plate at eye-level with a code like <code className="text-foreground font-mono">BXU-LIB-048</code>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Detail the Outage:</span>
                  <p>
                    Specify if one lamp is out or if a whole row of streetlights is unlit along the block.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Camera className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Add Photos:</span>
                  <p>
                    Clear photos of the fixture or post help crew bring the exact ballast or bulb replacement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Office Contact Info Card */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">City Engineering Office</CardTitle>
              <CardDescription className="text-xs">
                Public Works & Streetlight Maintenance Unit
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground">
              <p>City Hall Complex, J.P. Rosales Ave, Butuan City</p>
              <p className="font-medium text-foreground">Hotline: (085) 815-1234</p>
              <p>Operating Hours: Mon - Fri (8:00 AM - 5:00 PM)</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Incident Reports Table Section */}
      <div id="reports" className="flex flex-col gap-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">
              My Incident Reports
            </h2>
            <p className="text-xs text-muted-foreground">
              History of reports registered from your resident session with live resolution status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-normal">
              Active: {activeReportsCount}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              Resolved: {resolvedReportsCount}
            </Badge>
          </div>
        </div>

        {/* Metric Summary Cards */}
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
                {reportsList.length}
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
                {activeReportsCount}
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
                {resolvedReportsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lighting verified functional
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table Card */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Tracked Streetlight Problem Reports</CardTitle>
                <CardDescription className="text-xs">
                  Real-time status updates from City Central Dispatch.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {reportsList.length} Total
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
                {reportsList.map((report) => (
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
            <span>Showing recent citizen reports</span>
            <span className="text-xs text-muted-foreground">
              Butuan City Engineering Maintenance Division
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
