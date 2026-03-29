export const dayKey = (date = new Date()): string => date.toISOString().slice(0, 10);

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
