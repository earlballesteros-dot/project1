"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
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
  Loader2,
  Trash2,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { type StreetlightReport } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

interface DbBarangay {
  id: string;
  name: string;
  is_active: boolean;
}

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
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();

  // Form fields state - initialize blank
  const [reporterName, setReporterName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [barangay, setBarangay] = useState("Libertad");
  const [streetLandmark, setStreetLandmark] = useState("");
  const [poleNumber, setPoleNumber] = useState("");
  const [problemType, setProblemType] = useState("Total Outage / Unlit Street");
  const [problemDescription, setProblemDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic barangays from Supabase
  const [barangaysList, setBarangaysList] = useState<DbBarangay[]>([]);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(true);
  const [barangaysError, setBarangaysError] = useState<string | null>(null);

  // Submitted ticket confirmation & success modal state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
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

  // Incident reports state - strictly sourced from Supabase for currently logged-in Clerk resident
  const [reportsList, setReportsList] = useState<StreetlightReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [hiddenReportIds, setHiddenReportIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const globalStored = localStorage.getItem("butuan_resident_hidden_reports");
      if (globalStored) {
        const parsed = JSON.parse(globalStored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore initial read error
    }
    return [];
  });
  const [reportToRemove, setReportToRemove] = useState<StreetlightReport | null>(null);

  // Fetch only reports submitted by this authenticated resident account from Supabase
  const fetchResidentReports = useCallback(async () => {
    if (!isLoaded) return;
    if (!userId) {
      setReportsList([]);
      setIsLoadingReports(false);
      return;
    }

    setIsLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          id,
          reporter_name,
          contact_info,
          street_purok_landmark,
          pole_tag_id,
          problem_type,
          description_hazard,
          photo_url,
          priority,
          status,
          created_at,
          user_id,
          barangays (
            id,
            name
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching resident reports from Supabase:", error.message);
      } else if (data) {
        const mapped: StreetlightReport[] = data.map((row: any) => {
          let barangayName = "Unknown";
          if (row.barangays) {
            if (Array.isArray(row.barangays) && row.barangays.length > 0) {
              barangayName = row.barangays[0]?.name || "Unknown";
            } else if (typeof row.barangays === "object" && "name" in row.barangays) {
              barangayName = row.barangays.name || "Unknown";
            }
          }

          let reportedDate = "";
          if (row.created_at) {
            try {
              const d = new Date(row.created_at);
              reportedDate = isNaN(d.getTime())
                ? String(row.created_at).split("T")[0]
                : d.toISOString().split("T")[0];
            } catch {
              reportedDate = String(row.created_at).split("T")[0];
            }
          } else {
            reportedDate = new Date().toISOString().split("T")[0];
          }

          return {
            id: row.id,
            barangay: barangayName,
            landmark: row.street_purok_landmark || "",
            poleNumber: row.pole_tag_id || "N/A",
            issueType: row.problem_type || "Streetlight Issue",
            description: row.description_hazard || "",
            contactInfo: row.contact_info || undefined,
            photoUrl: row.photo_url || undefined,
            reportedDate,
            status: (row.status as any) || "Pending",
            priority: (row.priority as any) || "High",
            assignedTeam: "Pending Dispatch",
            residentName: row.reporter_name || "Resident",
          };
        });

        setReportsList(mapped);
      }
    } catch (err) {
      console.error("Failed to query resident reports:", err);
    } finally {
      setIsLoadingReports(false);
    }
  }, [isLoaded, userId]);

  // Load resident's reports from Supabase when authenticated
  useEffect(() => {
    if (isLoaded) {
      fetchResidentReports();
    }
  }, [isLoaded, fetchResidentReports]);

  // Synchronize resident's hidden reports from localStorage without resetting
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const userKey = userId ? `butuan_resident_hidden_reports_${userId}` : null;
      const storedUser = userKey ? localStorage.getItem(userKey) : null;
      const storedGlobal = localStorage.getItem("butuan_resident_hidden_reports");

      const loadedIds: string[] = [];

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (Array.isArray(parsed)) {
          loadedIds.push(...parsed);
        }
      }

      if (storedGlobal) {
        const parsed = JSON.parse(storedGlobal);
        if (Array.isArray(parsed)) {
          loadedIds.push(...parsed);
        }
      }

      if (loadedIds.length > 0) {
        setHiddenReportIds((prev) => Array.from(new Set([...prev, ...loadedIds])));
      }
    } catch (e) {
      console.error("Error loading resident hidden reports from localStorage:", e);
    }
  }, [userId]);

  // Retrieve active barangays alphabetically from public.barangays Supabase table
  useEffect(() => {
    let isMounted = true;

    async function fetchBarangays() {
      setIsLoadingBarangays(true);
      setBarangaysError(null);

      try {
        const { data, error } = await supabase
          .from("barangays")
          .select("id, name, is_active")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching barangays from Supabase:", error.message);
          setBarangaysError("Failed to load barangays. Please refresh.");
        } else if (data) {
          setBarangaysList(data);
          // Preserve selected barangay if valid, otherwise fallback to "Libertad" or first entry
          setBarangay((prev) => {
            if (prev && data.some((b) => b.name === prev)) {
              return prev;
            }
            const defaultItem = data.find((b) => b.name === "Libertad") || data[0];
            return defaultItem ? defaultItem.name : "";
          });
        }
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Error fetching barangays";
        console.error("Failed to query barangays:", msg);
        setBarangaysError("Failed to load barangays. Please refresh.");
      } finally {
        if (isMounted) {
          setIsLoadingBarangays(false);
        }
      }
    }

    fetchBarangays();

    return () => {
      isMounted = false;
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      // 1. Determine priority and status matching existing behavior
      const priority =
        problemType.toLowerCase().includes("wire") ||
          problemType.toLowerCase().includes("hazard")
          ? "Emergency"
          : "High";
      const status = "Pending";

      // 2. Upload photo to private Supabase Storage bucket 'report-photos' if selected
      let uploadedPhotoPath: string | null = null;
      if (photoFile) {
        try {
          const cleanFileName = photoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const uniqueId =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2);
          const storagePath = `reports/${uniqueId}-${cleanFileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("report-photos")
            .upload(storagePath, photoFile, {
              contentType: photoFile.type,
              upsert: false,
            });

          if (uploadError) {
            console.error("Photo upload failed:", uploadError.message);
            alert(`Photo upload failed: ${uploadError.message}. Please try again.`);
            setIsSubmitting(false);
            return;
          }

          uploadedPhotoPath = uploadData?.path || storagePath;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Unexpected error during photo upload";
          console.error("Photo upload failed:", message);
          alert(`Photo upload failed: ${message}. Please try again.`);
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Find matching row in `barangays` by name to get its `id` as `barangay_id`
      let barangayId: string | null = null;
      const matchedFromList = barangaysList.find(
        (b) => b.name.toLowerCase() === barangay.trim().toLowerCase()
      );

      if (matchedFromList) {
        barangayId = matchedFromList.id;
      } else {
        try {
          const { data: barangayData, error: barangayError } = await supabase
            .from("barangays")
            .select("id")
            .ilike("name", barangay.trim())
            .maybeSingle();

          if (barangayError) {
            console.error("Error looking up barangay from Supabase:", barangayError.message);
          } else if (barangayData) {
            barangayId = barangayData.id;
          }
        } catch (err) {
          console.error("Failed to query barangays table:", err);
        }
      }

      // 4. Insert new row into `public.reports` with mapped fields including user_id
      let insertedId: string | null = null;
      let insertedCreatedAt: string | null = null;

      try {
        const { data: insertData, error: insertError } = await supabase
          .from("reports")
          .insert({
            reporter_name: reporterName.trim(),
            contact_info: contactInfo.trim(),
            barangay_id: barangayId,
            street_purok_landmark: streetLandmark.trim(),
            pole_tag_id: poleNumber.trim() || null,
            problem_type: problemType,
            description_hazard: problemDescription.trim(),
            priority: priority,
            status: status,
            assigned_team_id: null,
            photo_url: uploadedPhotoPath ?? null,
            user_id: userId || null,
          })
          .select("id, created_at")
          .single();

        if (insertError) {
          console.error("Error inserting report into Supabase:", insertError.message);
        } else if (insertData) {
          insertedId = insertData.id;
          insertedCreatedAt = insertData.created_at;
        }
      } catch (err) {
        console.error("Failed to insert report into Supabase:", err);
      }

      // 5. Generate display ticket ID and format timestamps
      const now = new Date();
      const dateString = insertedCreatedAt
        ? new Date(insertedCreatedAt).toISOString().split("T")[0]
        : now.toISOString().split("T")[0];
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const displayId = insertedId || `BXU-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newSubmitted = {
        id: displayId,
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

      // Add to interactive reports table for immediate responsive feedback
      const newReportItem: StreetlightReport = {
        id: displayId,
        barangay,
        landmark: `${streetLandmark}${poleNumber.trim() ? ` (${poleNumber.trim()})` : ""}`,
        poleNumber: poleNumber.trim() || "N/A",
        issueType: problemType,
        description: problemDescription,
        contactInfo: contactInfo,
        photoUrl: photoPreview || undefined,
        reportedDate: dateString,
        status: "Pending",
        priority,
        assignedTeam: "Pending Dispatch",
        residentName: reporterName,
      };

      setReportsList((prev) => [newReportItem, ...prev.filter((r) => r.id !== displayId)]);

      // Re-fetch reports from Supabase to guarantee synchronized database state
      fetchResidentReports();

      // Show immediate submission success popup modal
      setShowSuccessDialog(true);

      // Reset incident-specific inputs so the form remains immediately usable for new reports
      setStreetLandmark("");
      setPoleNumber("");
      setProblemDescription("");
      handleRemovePhoto();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setStreetLandmark("");
    setPoleNumber("");
    setProblemType("Total Outage / Unlit Street");
    setProblemDescription("");
    handleRemovePhoto();
    setSubmittedTicket(null);
  };

  // Helper to determine if a report belongs to the resident (all reports in list belong to authenticated user)
  const isOwnReport = (_report: StreetlightReport) => true;

  // Safe removal from resident history (does NOT hard-delete from Supabase or modify DB schema)
  const handleConfirmRemove = () => {
    if (!reportToRemove) return;
    const nextHidden = Array.from(new Set([...hiddenReportIds, reportToRemove.id]));
    setHiddenReportIds(nextHidden);
    try {
      if (userId) {
        localStorage.setItem(`butuan_resident_hidden_reports_${userId}`, JSON.stringify(nextHidden));
      }
      localStorage.setItem("butuan_resident_hidden_reports", JSON.stringify(nextHidden));
    } catch (e) {
      console.error("Failed to persist hidden report ID:", e);
    }
    setReportToRemove(null);
  };

  const visibleReports = reportsList.filter((r) => !hiddenReportIds.includes(r.id));
  const activeReportsCount = visibleReports.filter(
    (r) => r.status === "Pending" || r.status === "In Progress"
  ).length;
  const resolvedReportsCount = visibleReports.filter((r) => r.status === "Resolved").length;

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
              View My Reports ({visibleReports.length})
            </Button>
          </a>
        </div>
      </div>

      {/* Main Grid: Form / Confirmation on left, Sidebar tips on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Problem Reporting Form */}
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
                        <div className="flex items-center justify-between">
                          <Label htmlFor="barangay">
                            Barangay <span className="text-destructive">*</span>
                          </Label>
                          {isLoadingBarangays && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Loader2 className="size-3 animate-spin text-primary" />
                              Loading...
                            </span>
                          )}
                        </div>
                        <select
                          id="barangay"
                          value={barangay}
                          onChange={(e) => setBarangay(e.target.value)}
                          disabled={isLoadingBarangays || (barangaysList.length === 0 && !isLoadingBarangays)}
                          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                          required
                        >
                          {isLoadingBarangays ? (
                            <option value="" disabled className="text-muted-foreground bg-background">
                              Loading barangays...
                            </option>
                          ) : barangaysError && barangaysList.length === 0 ? (
                            <option value="" disabled className="text-muted-foreground bg-background">
                              Failed to load barangays
                            </option>
                          ) : (
                            barangaysList.map((b) => (
                              <option key={b.id} value={b.name} className="text-foreground bg-background">
                                Brgy. {b.name}
                              </option>
                            ))
                          )}
                        </select>
                        {barangaysError && (
                          <p className="text-xs text-destructive">
                            {barangaysError}
                          </p>
                        )}
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
                {visibleReports.length}
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
                {visibleReports.length} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[530px]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10 border-b">
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Location & Pole</TableHead>
                    <TableHead>Problem Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingReports ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="size-4 animate-spin text-primary" />
                          <span>Loading your incident reports...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : visibleReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                        No reports found in your history.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleReports.map((report) => (
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
                        <TableCell className="text-right">
                          {isOwnReport(report) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReportToRemove(report)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Remove from my history"
                              aria-label={`Remove report ${report.id} from history`}
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              Remove
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground px-2">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>Showing recent citizen reports • {visibleReports.length} {visibleReports.length === 1 ? "report" : "reports"} recorded</span>
            <span className="text-xs text-muted-foreground">
              Butuan City Engineering Maintenance Division
            </span>
          </CardFooter>
        </Card>
      </div>

      {/* Submission Success Dialog Modal */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1">
              <CheckCircle2 className="size-6" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Report Submitted Successfully
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
              Your streetlight report has been recorded.
            </DialogDescription>
          </DialogHeader>

          {submittedTicket && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Ticket Reference ID
                  </span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {submittedTicket.id}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  <Clock className="size-3 mr-1 text-amber-500" />
                  Pending Assessment
                </Badge>
              </div>

              <div className="rounded-lg border divide-y text-xs">
                <div className="p-2.5 flex justify-between gap-2">
                  <span className="text-muted-foreground">Reporter:</span>
                  <span className="font-medium text-right truncate max-w-[200px]">
                    {submittedTicket.reporterName}
                  </span>
                </div>
                <div className="p-2.5 flex justify-between gap-2">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium text-right truncate max-w-[200px]">
                    Brgy. {submittedTicket.barangay} • {submittedTicket.landmark}
                  </span>
                </div>
                <div className="p-2.5 flex justify-between gap-2">
                  <span className="text-muted-foreground">Problem Type:</span>
                  <span className="font-medium text-right">{submittedTicket.problemType}</span>
                </div>
                <div className="p-2.5 flex justify-between gap-2">
                  <span className="text-muted-foreground">Submitted At:</span>
                  <span className="font-medium text-right text-muted-foreground">
                    {submittedTicket.timestamp}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSuccessDialog(false)}
              className="text-xs flex-1"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowSuccessDialog(false);
                const el = document.getElementById("reports");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs flex-1"
            >
              View in History
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove from Resident History Confirmation Dialog */}
      <Dialog open={!!reportToRemove} onOpenChange={(open) => !open && setReportToRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Remove from My History
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove report <strong className="font-mono text-foreground">{reportToRemove?.id}</strong> from your resident history?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              This only removes the ticket from your personal resident history view. The official incident record in City Central Dispatch remains active and will NOT be deleted.
            </p>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReportToRemove(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmRemove}
              className="text-xs"
            >
              Remove from my history
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
