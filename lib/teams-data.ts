export interface MaintenanceTeamConfig {
  id: string;
  name: string;
  keyword: string;
  specialization: string;
  lead: string;
  contact: string;
  assignedBarangays: string[];
  vehicle: string;
}

// Fixed team roster covering all 12 supported Butuan City barangays
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
  },
];
