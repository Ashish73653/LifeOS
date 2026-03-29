export type EnergyLevel = "low" | "medium" | "high";

export interface BriefingPayload {
  briefing: string;
  priorities: string[];
  motivation: string;
}

export interface TaskItem {
  id: string;
  title: string;
  energy: EnergyLevel;
  done: boolean;
}
