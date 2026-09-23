export type ReportStatus = "Pending" | "In Progress" | "Resolved";
export type PriorityLevel = "Low" | "Medium" | "High" | "Emergency";

export interface StreetlightReport {
  id: string;
  barangay: string;
  landmark: string;
  poleNumber: string;
  issueType: string;
  reportedDate: string;
  status: ReportStatus;
  priority: PriorityLevel;
  assignedTeam: string;
  residentName: string;
}

export interface DashboardStats {
  totalReports: number;
  pendingInspection: number;
  inProgress: number;
  resolvedThisMonth: number;
  averageResolutionHours: number;
}

export const MOCK_STATS: DashboardStats = {
  totalReports: 142,
  pendingInspection: 18,
  inProgress: 26,
  resolvedThisMonth: 98,
  averageResolutionHours: 36,
};

export const MOCK_REPORTS: StreetlightReport[] = [
  {
    id: "BXU-2026-0104",
    barangay: "Libertad",
    landmark: "Corner J.C. Aquino Ave & Montilla Blvd",
    poleNumber: "BXU-LIB-048",
    issueType: "Total Outage / Unlit Pole",
    reportedDate: "2026-09-23",
    status: "Pending",
    priority: "High",
    assignedTeam: "Pending Dispatch",
    residentName: "Elena Ramos",
  },
  {
    id: "BXU-2026-0098",
    barangay: "Ampayon",
    landmark: "Near Caraga State University Main Gate",
    poleNumber: "BXU-AMP-112",
    issueType: "Flickering Light",
    reportedDate: "2026-09-22",
    status: "In Progress",
    priority: "Medium",
    assignedTeam: "Team Alpha (City Engineering)",
    residentName: "Carlos Fernandez",
  },
  {
    id: "BXU-2026-0095",
    barangay: "Doongan",
    landmark: "Purok 3 near Covered Court",
    poleNumber: "BXU-DNG-027",
    issueType: "Broken Fixture / Fallen Glass",
    reportedDate: "2026-09-22",
    status: "In Progress",
    priority: "High",
    assignedTeam: "Team Bravo (Linemen)",
    residentName: "Rochelle Tan",
  },
  {
    id: "BXU-2026-0089",
    barangay: "Villa Kananga",
    landmark: "Rosales Street, adjacent to Day Care Center",
    poleNumber: "BXU-VK-084",
    issueType: "Exposed Wire Hazard",
    reportedDate: "2026-09-21",
    status: "Pending",
    priority: "Emergency",
    assignedTeam: "Emergency Response Unit",
    residentName: "Arnel Gutierrez",
  },
  {
    id: "BXU-2026-0081",
    barangay: "Bancasi",
    landmark: "Airport Road bypass junction",
    poleNumber: "BXU-BAN-019",
    issueType: "Continuous Day Burning",
    reportedDate: "2026-09-20",
    status: "Resolved",
    priority: "Low",
    assignedTeam: "Team Charlie",
    residentName: "Danilo Morales",
  },
  {
    id: "BXU-2026-0077",
    barangay: "San Vicente",
    landmark: "Purok 6 Riverside Road",
    poleNumber: "BXU-SV-063",
    issueType: "Total Outage",
    reportedDate: "2026-09-19",
    status: "Resolved",
    priority: "Medium",
    assignedTeam: "Team Alpha (City Engineering)",
    residentName: "Liza Mae Ocampo",
  },
];

export const MOCK_RESIDENT_REPORTS: StreetlightReport[] = [
  {
    id: "BXU-2026-0104",
    barangay: "Libertad",
    landmark: "Corner J.C. Aquino Ave & Montilla Blvd",
    poleNumber: "BXU-LIB-048",
    issueType: "Total Outage / Unlit Pole",
    reportedDate: "2026-09-23",
    status: "Pending",
    priority: "High",
    assignedTeam: "Pending Dispatch",
    residentName: "Elena Ramos (You)",
  },
  {
    id: "BXU-2026-0062",
    barangay: "Libertad",
    landmark: "Purok 2 near Elementary School",
    poleNumber: "BXU-LIB-012",
    issueType: "Flickering Fixture",
    reportedDate: "2026-09-10",
    status: "Resolved",
    priority: "Medium",
    assignedTeam: "Team Alpha (City Engineering)",
    residentName: "Elena Ramos (You)",
  },
];

export const MOCK_BARANGAYS = [
  "Ampayon",
  "Baan Riverside",
  "Bancasi",
  "Bonbon",
  "Doongan",
  "Golden Ribbon",
  "Holy Redeemer",
  "Libertad",
  "Ong Yiu",
  "Pangabugan",
  "San Vicente",
  "Villa Kananga",
];
