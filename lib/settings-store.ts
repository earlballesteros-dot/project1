export interface SystemSettings {
  systemName: string;
  coverageBarangays: string[];
  adminNotificationsEnabled: boolean;
  emailAlertsEnabled: boolean;
  soundAlertsEnabled: boolean;
}

// Exactly the 12 supported barangays in Butuan City project scope
export const SUPPORTED_BARANGAYS_12 = [
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

export const DEFAULT_SETTINGS: SystemSettings = {
  systemName: "Butuan City Streetlight Problem Reporting and Monitoring System",
  coverageBarangays: [...SUPPORTED_BARANGAYS_12],
  adminNotificationsEnabled: true,
  emailAlertsEnabled: true,
  soundAlertsEnabled: false,
};

const STORAGE_KEY = "butuan_system_settings";

/**
 * Retrieve system settings from localStorage (falls back to DEFAULT_SETTINGS).
 */
export function getStoredSettings(): SystemSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      coverageBarangays: Array.isArray(parsed.coverageBarangays)
        ? parsed.coverageBarangays
        : DEFAULT_SETTINGS.coverageBarangays,
    };
  } catch (e) {
    console.error("Error reading system settings from localStorage:", e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Persist system settings to localStorage and trigger change events.
 */
export function saveStoredSettings(newSettings: SystemSettings): SystemSettings {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      window.dispatchEvent(new Event("butuan-settings-changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Error saving system settings to localStorage:", e);
    }
  }
  return newSettings;
}
