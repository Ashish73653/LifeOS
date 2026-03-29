export type EnergyLevel = "low" | "medium" | "high";
export type GoalStatus = "active" | "paused" | "completed";
export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type HabitFrequency = "daily" | "weekly";

export type ViewType =
  | "dashboard"
  | "tasks"
  | "habits"
  | "goals"
  | "mood"
  | "braindump"
  | "focus"
  | "winddown"
  | "data"
  | "score"
  | "integrations"
  | "settings";

export interface Task {
  id: string;
  title: string;
  energy: EnergyLevel;
  done: boolean;
  dueAt: string | null;
  createdAt: string;
  order: number;
}

export interface Habit {
  id: string;
  name: string;
  frequency: HabitFrequency;
  energy: EnergyLevel;
  category: string;
  createdAt: string;
  completions: Record<string, boolean>;
  streak: number;
  bestStreak: number;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetDate: string | null;
  energy: EnergyLevel;
  status: GoalStatus;
  milestones: GoalMilestone[];
  createdAt: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface MoodEntry {
  id: string;
  value: MoodLevel;
  note: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  taskTitle: string;
  duration: number;
  completedAt: string;
}

export interface GratitudeEntry {
  id: string;
  items: string[];
  tomorrowPriorities: string[];
  createdAt: string;
}
