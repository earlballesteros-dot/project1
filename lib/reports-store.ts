import {
  MOCK_REPORTS,
  type StreetlightReport,
  type PriorityLevel,
  type ReportStatus,
} from "./mock-data";

const STORAGE_KEY = "butuan_streetlight_incident_reports";

/**
 * Map a raw database row from public.reports (with joined barangays and maintenance_teams)
 * to a typed StreetlightReport.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbRowToReport(row: any): StreetlightReport {
  let barangayName = "Unknown";
  if (row.barangays) {
    if (Array.isArray(row.barangays) && row.barangays.length > 0) {
      barangayName = row.barangays[0]?.name || "Unknown";
    } else if (typeof row.barangays === "object" && "name" in row.barangays) {
      barangayName = row.barangays.name || "Unknown";
    }
  }

  let assignedTeamName = "";
  let assignedTeamId: string | null = row.assigned_team_id || null;
  if (row.maintenance_teams) {
    if (Array.isArray(row.maintenance_teams) && row.maintenance_teams.length > 0) {
      assignedTeamName = row.maintenance_teams[0]?.team_name || "";
      if (!assignedTeamId) assignedTeamId = row.maintenance_teams[0]?.id || null;
    } else if (typeof row.maintenance_teams === "object" && "team_name" in row.maintenance_teams) {
      assignedTeamName = row.maintenance_teams.team_name || "";
      if (!assignedTeamId) assignedTeamId = row.maintenance_teams.id || null;
    }
  }

  let reportedDate = "";
  if (row.created_at) {
    try {
      const dateObj = new Date(row.created_at);
      reportedDate = isNaN(dateObj.getTime())
        ? String(row.created_at).split("T")[0]
        : dateObj.toISOString().split("T")[0];
    } catch {
      reportedDate = String(row.created_at).split("T")[0];
    }
  } else {
    reportedDate = new Date().toISOString().split("T")[0];
  }

  return {
    id: row.id,
    residentName: row.reporter_name || "Anonymous",
    contactInfo: row.contact_info || undefined,
    barangay: barangayName,
    landmark: row.street_purok_landmark || "",
    poleNumber: row.pole_tag_id || "N/A",
    issueType: row.problem_type || "Streetlight Issue",
    description: row.description_hazard || "",
    photoUrl: row.photo_url || undefined,
    priority: (row.priority as PriorityLevel) || "High",
    status: (row.status as ReportStatus) || "Pending",
    assignedTeam: assignedTeamName,
    assignedTeamId,
    reportedDate,
    isArchived: Boolean(row.is_archived),
    archivedAt: row.archived_at || null,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at || null,
  };
}

/**
 * Retrieve all reports from localStorage (falls back to MOCK_REPORTS).
 * Merges any baseline mock reports that are missing so newly added defaults
 * (like the Holy Redeemer report) are seamlessly available.
 */
export function getStoredReports(): StreetlightReport[] {
  if (typeof window === "undefined") {
    return MOCK_REPORTS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_REPORTS));
      return MOCK_REPORTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existingIds = new Set(parsed.map((r: StreetlightReport) => r.id));
      const missingMockReports = MOCK_REPORTS.filter((r) => !existingIds.has(r.id));
      if (missingMockReports.length > 0) {
        const combined = [...parsed, ...missingMockReports];
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
        return combined;
      }
      return parsed;
    }
    return MOCK_REPORTS;
  } catch (e) {
    console.error("Error reading stored reports from localStorage:", e);
    return MOCK_REPORTS;
  }
}
