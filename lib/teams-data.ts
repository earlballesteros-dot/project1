export interface MaintenanceTeamConfig {
  id: string;
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

// Baseline maintenance team roster covering all 12 supported Butuan City barangays
export const BUTUAN_MAINTENANCE_TEAMS: MaintenanceTeamConfig[] = [
  {
    id: "BXU-CREW-01",
    name: "Team Alpha (City Engineering)",
    keyword: "Team Alpha",
    specialization: "Substation & High-Voltage Systems",
    lead: "Engr. Mateo Morales",
    contact: "0917 882 1044",
    assignedBarangays: ["Ampayon", "Baan Riverside", "Pangabugan"],
    vehicle: "Boom Truck #04",
    status: "Dispatched in Field",
    availability: "Engaged (Normal)",
  },
  {
    id: "BXU-CREW-02",
    name: "Team Bravo (Linemen)",
    keyword: "Team Bravo",
    specialization: "Overhead Lines & Luminaire Repairs",
    lead: "Foreman Jerry Alcantara",
    contact: "0920 551 3920",
    assignedBarangays: ["Doongan", "Holy Redeemer", "Golden Ribbon"],
    vehicle: "Bucket Truck #02",
    status: "Dispatched in Field",
    availability: "Engaged (Normal)",
  },
  {
    id: "BXU-CREW-03",
    name: "Team Charlie",
    keyword: "Team Charlie",
    specialization: "Photocell Sensors & Day-Burn Control",
    lead: "Sr. Lineman Rolando Dizon",
    contact: "0918 334 9021",
    assignedBarangays: ["Bancasi", "Bonbon", "Libertad"],
    vehicle: "Ladder Service Van #07",
    status: "Standby",
    availability: "Available for Dispatch",
  },
  {
    id: "BXU-CREW-04",
    name: "Emergency Response Unit",
    keyword: "Emergency",
    specialization: "Hazard Isolation & Ground Faults",
    lead: "Capt. Aris Villanueva",
    contact: "0939 990 4411",
    assignedBarangays: ["Villa Kananga", "Ong Yiu", "San Vicente"],
    vehicle: "Rapid Intervention Van #01",
    status: "Dispatched in Field",
    availability: "Engaged (Normal)",
  },
];

const STORAGE_KEY = "butuan_maintenance_teams_roster";

/**
 * Retrieve maintenance teams from localStorage (falls back to BUTUAN_MAINTENANCE_TEAMS).
 */
export function getStoredTeams(): MaintenanceTeamConfig[] {
  if (typeof window === "undefined") {
    return BUTUAN_MAINTENANCE_TEAMS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(BUTUAN_MAINTENANCE_TEAMS));
      return BUTUAN_MAINTENANCE_TEAMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return BUTUAN_MAINTENANCE_TEAMS.map((defaultTeam) => {
        const found = parsed.find((p: MaintenanceTeamConfig) => p.id === defaultTeam.id);
        if (!found) return defaultTeam;
        return {
          ...defaultTeam,
          ...found,
          assignedBarangays: Array.isArray(found.assignedBarangays)
            ? found.assignedBarangays
            : defaultTeam.assignedBarangays,
        };
      });
    }
    return BUTUAN_MAINTENANCE_TEAMS;
  } catch (e) {
    console.error("Error reading stored maintenance teams from localStorage:", e);
    return BUTUAN_MAINTENANCE_TEAMS;
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
 * Assign or reassign barangays to a specific maintenance team.
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
  return saveStoredTeams(BUTUAN_MAINTENANCE_TEAMS);
}

/**
 * Supabase Data Access Layer for Maintenance Teams.
 * When Supabase table `maintenance_teams` is created, these functions
 * provide direct synchronization between the client and Supabase DB.
 */
export async function fetchTeamsFromSupabase(): Promise<MaintenanceTeamConfig[] | null> {
  try {
    const { supabase } = await import("./supabase");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.from("maintenance_teams").select("*");
    if (error || !data) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      keyword: row.keyword,
      specialization: row.specialization,
      lead: row.lead,
      contact: row.contact,
      assignedBarangays: Array.isArray(row.assigned_barangays) ? row.assigned_barangays : [],
      vehicle: row.vehicle,
      status: row.status,
      availability: row.availability,
    }));
  } catch {
    return null;
  }
}

export async function syncTeamToSupabase(team: MaintenanceTeamConfig): Promise<boolean> {
  try {
    const { supabase } = await import("./supabase");
    const { error } = await supabase.from("maintenance_teams").upsert({
      id: team.id,
      name: team.name,
      keyword: team.keyword,
      specialization: team.specialization,
      lead: team.lead,
      contact: team.contact,
      assigned_barangays: team.assignedBarangays,
      vehicle: team.vehicle,
      status: team.status,
      availability: team.availability,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}
