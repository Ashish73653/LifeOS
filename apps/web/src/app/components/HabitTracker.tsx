"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Habit, EnergyLevel, HabitFrequency } from "../lib/types";
import { load, save, KEYS } from "../lib/storage";
import { id, todayKey, last7Days, dayLabel } from "../lib/utils";
import Icon from "./Icon";
import { toast } from "../lib/toast";

const CATS = ["Health", "Learning", "Wellness", "Productivity", "Social", "Creative"];

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(() => load<Habit[]>(KEYS.habits, []));
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [freq, setFreq] = useState<HabitFrequency>("daily");
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [cat, setCat] = useState("Health");
  const [confetti, setConfetti] = useState<string | null>(null);

  const persist = useCallback((h: Habit[]) => {
    setHabits(h);
    save(KEYS.habits, h);
  }, []);

  function calcStreak(completions: Record<string, boolean>): { streak: number; best: number } {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      if (completions[key]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    let best = 0, cur = 0;
    const sorted = Object.keys(completions).sort();
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { cur = 1; }
      else {
        const prev = new Date(sorted[i - 1]);
        prev.setDate(prev.getDate() + 1);
        cur = prev.toISOString().slice(0, 10) === sorted[i] ? cur + 1 : 1;
      }
      best = Math.max(best, cur);
    }
    return { streak, best: Math.max(best, streak) };
  }

  function addHabit() {
    if (!name.trim()) return;
    const h: Habit = {
      id: id(),
      name: name.trim(),
      frequency: freq,
      energy,
      category: cat,
      createdAt: new Date().toISOString(),
      completions: {},
      streak: 0,
      bestStreak: 0,
    };
    persist([...habits, h]);
    setName("");
    setShowAdd(false);
    toast("Habit added");
  }

  function toggleDay(habitId: string, dayKey: string) {
    persist(
      habits.map((h) => {
        if (h.id !== habitId) return h;
        const comps = { ...h.completions };
        if (comps[dayKey]) delete comps[dayKey];
        else comps[dayKey] = true;
        const { streak, best } = calcStreak(comps);

        if (!h.completions[dayKey] && comps[dayKey] && dayKey === todayKey()) {
          setConfetti(habitId);
          setTimeout(() => setConfetti(null), 1200);
        }

        return { ...h, completions: comps, streak, bestStreak: best };
      })
    );
  }

  function removeHabit(habitId: string) {
    persist(habits.filter((h) => h.id !== habitId));
    toast("Habit removed", "info");
  }

  const days = last7Days();
  const today = todayKey();

  function milestoneIcon(streak: number): string {
    if (streak >= 66) return "💎";
    if (streak >= 21) return "⭐";
    if (streak >= 7) return "🔥";
    return "";
  }

  return (
    <div className="anim-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Habits</h1>
          <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", marginTop: 2 }}>
            {habits.length} habits · {habits.filter((h) => h.completions[today]).length} done today
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Icon name={showAdd ? "x" : "plus"} size={16} />
          {showAdd ? "Cancel" : "Add Habit"}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass" style={{ padding: "1.25rem", marginBottom: "1rem", overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input className="input" placeholder="Habit name..." value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit()} autoFocus />
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <select className="input" value={freq} onChange={(e) => setFreq(e.target.value as HabitFrequency)} style={{ width: "auto" }}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: "auto" }}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["low", "medium", "high"] as const).map((l) => (
                    <button key={l} className={`btn ${energy === l ? "btn-primary" : "btn-secondary"}`} onClick={() => setEnergy(l)} style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", textTransform: "capitalize" }}>{l}</button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={addHabit}>Add</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {habits.length === 0 ? (
        <div className="glass" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚡</div>
          <p style={{ color: "var(--z-text-sub)", fontSize: "0.9rem" }}>No habits yet. Build consistency — add your first habit!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          <AnimatePresence>
            {habits.map((habit) => (
              <motion.div key={habit.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass" style={{ padding: "1.25rem", position: "relative", overflow: "hidden" }}>
                {confetti === habit.id && (
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="confetti-piece" style={{ left: `${10 + Math.random() * 80}%`, top: `${Math.random() * 30}%`, background: ["var(--z-violet)", "var(--z-cyan)", "var(--z-emerald)", "var(--z-amber)", "var(--z-rose)"][i % 5], animationDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{habit.name}</h3>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span className="badge badge-violet">{habit.category}</span>
                      <span className={`badge energy-${habit.energy}`}>{habit.energy}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => removeHabit(habit.id)} style={{ padding: "0.25rem" }}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>

                {/* Streak */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--z-amber)" }}>
                    {milestoneIcon(habit.streak)} {habit.streak} day streak
                  </span>
                  <span style={{ color: "var(--z-text-muted)" }}>· Best: {habit.bestStreak}</span>
                </div>

                {/* 7-day heatmap */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                  {days.map((day) => {
                    const done = habit.completions[day];
                    const isToday = day === today;
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(habit.id, day)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 4,
                          padding: "0.4rem",
                          borderRadius: "var(--z-radius-sm)",
                          border: `1px solid ${isToday ? "var(--z-violet)" : "var(--z-border)"}`,
                          background: done
                            ? "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.15))"
                            : "rgba(255,255,255,0.02)",
                          cursor: "pointer",
                          transition: "all 150ms ease",
                        }}
                      >
                        <span style={{ fontSize: "0.625rem", color: "var(--z-text-muted)" }}>{dayLabel(day)}</span>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: done ? "linear-gradient(135deg, var(--z-violet), var(--z-cyan))" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {done && <Icon name="check" size={14} className="" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
