export interface MaintenanceTeamConfig {
  id: string;
  teamCode?: string;
  name: string;
  keyword: string;
  specialization: string;
  lead: string;
  contact: string;
  assignedBarangays: string[];
  vehicle: string;
  status: string;
  availability: string;
}

// Exactly the 12 supported barangays in Butuan City project scope
export const SUPPORTED_12_BARANGAYS = [
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
] as const;

export type SupportedBarangay = (typeof SUPPORTED_12_BARANGAYS)[number];

// No hardcoded sample or demonstration teams; Supabase maintenance_teams is the source of truth
export const BUTUAN_MAINTENANCE_TEAMS: MaintenanceTeamConfig[] = [];

const STORAGE_KEY = "butuan_maintenance_teams_roster";

/**
 * Map a raw database row from public.maintenance_teams to MaintenanceTeamConfig.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbTeamToConfig(row: any): MaintenanceTeamConfig {
  const teamName = row.team_name || row.name || "Unnamed Team";
  const assignedBarangays = row.barangay_area
    ? String(row.barangay_area)
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : Array.isArray(row.assigned_barangays)
    ? row.assigned_barangays
    : [];

  const keyword = teamName.includes(" (")
    ? teamName.split(" (")[0].trim()
    : teamName;

  return {
    id: row.id,
    teamCode: row.team_code || row.id,
    name: teamName,
    keyword,
    specialization: row.specialization || "General Servicing",
    lead: row.lead_name || row.lead || "Unassigned Lead",
    contact: row.contact || "",
    assignedBarangays,
    vehicle: row.vehicle || "Unassigned Vehicle",
    status: row.status || "Standby",
    availability: row.availability || "Available for Dispatch",
  };
}

/**
 * Retrieve cached maintenance teams from localStorage, or return empty array if none.
 */
export function getStoredTeams(): MaintenanceTeamConfig[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error("Error reading stored maintenance teams from localStorage:", e);
    return [];
  }
}

/**
 * Persist maintenance teams to localStorage and dispatch synchronization events.
 */
export function saveStoredTeams(teams: MaintenanceTeamConfig[]): MaintenanceTeamConfig[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
      window.dispatchEvent(new Event("butuan-teams-changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Error saving maintenance teams to localStorage:", e);
    }
  }
  return teams;
}

/**
 * Assign or reassign barangays to a specific maintenance team in local cache.
 * When reassignExclusively is true, reassigned barangays are removed from any other team.
 */
export function updateTeamAssignedBarangays(
  teamId: string,
  newAssignedBarangays: string[],
  reassignExclusively: boolean = true
): MaintenanceTeamConfig[] {
  const current = getStoredTeams();
  const updated = current.map((team) => {
    if (team.id === teamId) {
      return {
        ...team,
        assignedBarangays: newAssignedBarangays,
      };
    } else if (reassignExclusively) {
      return {
        ...team,
        assignedBarangays: team.assignedBarangays.filter(
          (b) => !newAssignedBarangays.includes(b)
        ),
      };
    }
    return team;
  });
  return saveStoredTeams(updated);
}

/**
 * Reset all teams to default baseline roster and barangay assignments.
 */
export function resetTeamsToDefault(): MaintenanceTeamConfig[] {
  return saveStoredTeams([]);
}

/**
 * Supabase Data Access Layer for Maintenance Teams.
 * Queries public.maintenance_teams and caches the result.
 */
export async function fetchTeamsFromSupabase(): Promise<MaintenanceTeamConfig[] | null> {
  try {
    const { supabase } = await import("./supabase");
    const { data, error } = await supabase
      .from("maintenance_teams")
      .select("*")
      .order("team_code", { ascending: true });

    if (error || !data) {
      console.error("Error querying maintenance_teams from Supabase:", error?.message);
      return null;
    }

    const mapped = data.map(mapDbTeamToConfig);
    saveStoredTeams(mapped);
    return mapped;
  } catch (err) {
    console.error("Failed to query maintenance_teams:", err);
    return null;
  }
}

export async function syncTeamToSupabase(team: MaintenanceTeamConfig): Promise<boolean> {
  try {
    const { supabase } = await import("./supabase");
    const { error } = await supabase
      .from("maintenance_teams")
      .update({
        barangay_area: team.assignedBarangays.join(", "),
      })
      .eq("id", team.id);
    return !error;
  } catch {
    return false;
  }
}
