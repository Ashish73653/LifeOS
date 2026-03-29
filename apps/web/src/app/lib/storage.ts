export const KEYS = {
  tasks: "zenith-tasks",
  habits: "zenith-habits",
  goals: "zenith-goals",
  moods: "zenith-moods",
  focus: "zenith-focus-sessions",
  gratitude: "zenith-gratitude",
  settings: "zenith-settings",
} as const;

export function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage write failed:", e);
  }
}

export function clear(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function exportAll(): string {
  const data: Record<string, unknown> = {};
  for (const [name, key] of Object.entries(KEYS)) {
    const raw = localStorage.getItem(key);
    if (raw) data[name] = JSON.parse(raw);
  }
  return JSON.stringify(data, null, 2);
}

export function importAll(json: string): boolean {
  try {
    const data = JSON.parse(json) as Record<string, unknown>;
    for (const [name, key] of Object.entries(KEYS)) {
      if (data[name]) localStorage.setItem(key, JSON.stringify(data[name]));
    }
    return true;
  } catch {
    return false;
  }
}
