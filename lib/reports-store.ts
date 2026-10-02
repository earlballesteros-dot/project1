import { MOCK_REPORTS, type StreetlightReport, type ReportStatus } from "./mock-data";

const STORAGE_KEY = "butuan_streetlight_incident_reports";

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

/**
 * Persist the entire reports list to localStorage and trigger change events.
 */
export function saveStoredReports(reports: StreetlightReport[]): StreetlightReport[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      window.dispatchEvent(new Event("butuan-reports-changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Error saving reports to localStorage:", e);
    }
  }
  return reports;
}

/**
 * Save a newly submitted resident report into local storage.
 * New reports are prepended to the top of the list.
 */
export function saveReport(newReport: StreetlightReport): StreetlightReport[] {
  const current = getStoredReports();
  // Ensure the new report is placed at index 0 and avoids duplicates
  const updated = [newReport, ...current.filter((r) => r.id !== newReport.id)];
  return saveStoredReports(updated);
}

/**
 * Update the status and/or assigned team of an existing incident report.
 */
export function updateReportStatus(
  id: string,
  newStatus: ReportStatus,
  assignedTeam?: string
): StreetlightReport[] {
  const current = getStoredReports();
  const updated = current.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        status: newStatus,
        assignedTeam: assignedTeam !== undefined ? assignedTeam : r.assignedTeam,
      };
    }
    return r;
  });

  return saveStoredReports(updated);
}

/**
 * Update the assigned maintenance crew of an existing incident report.
 */
export function updateReportAssignedTeam(
  id: string,
  assignedTeam: string
): StreetlightReport[] {
  const current = getStoredReports();
  const updated = current.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        assignedTeam,
      };
    }
    return r;
  });

  return saveStoredReports(updated);
}
