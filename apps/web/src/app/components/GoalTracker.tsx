"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Goal, GoalMilestone, GoalStatus, EnergyLevel } from "../lib/types";
import { load, save, KEYS } from "../lib/storage";
import { id, daysUntil } from "../lib/utils";
import Icon from "./Icon";
import { toast } from "../lib/toast";

const CATS = ["Career", "Health", "Finance", "Learning", "Personal", "Creative"];

export default function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>(() => load<Goal[]>(KEYS.goals, []));
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState<GoalStatus | "all">("all");
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("Career");
  const [targetDate, setTargetDate] = useState("");
  const [energy] = useState<EnergyLevel>("medium");
  const [newMilestone, setNewMilestone] = useState<Record<string, string>>({});

  const persist = useCallback((g: Goal[]) => { setGoals(g); save(KEYS.goals, g); }, []);

  function addGoal() {
    if (!title.trim()) return;
    const g: Goal = { id: id(), title: title.trim(), category: cat, targetDate: targetDate || null, energy, status: "active", milestones: [], createdAt: new Date().toISOString() };
    persist([...goals, g]);
    setTitle(""); setTargetDate(""); setShowAdd(false);
    toast("Goal created");
  }

  function setStatus(goalId: string, status: GoalStatus) {
    persist(goals.map((g) => (g.id === goalId ? { ...g, status } : g)));
  }

  function removeGoal(goalId: string) {
    persist(goals.filter((g) => g.id !== goalId));
    toast("Goal deleted", "info");
  }

  function addMilestoneToGoal(goalId: string) {
    const text = (newMilestone[goalId] || "").trim();
    if (!text) return;
    const ms: GoalMilestone = { id: id(), title: text, done: false };
    persist(goals.map((g) => (g.id === goalId ? { ...g, milestones: [...g.milestones, ms] } : g)));
    setNewMilestone({ ...newMilestone, [goalId]: "" });
  }

  function toggleMilestone(goalId: string, msId: string) {
    persist(goals.map((g) => {
      if (g.id !== goalId) return g;
      return { ...g, milestones: g.milestones.map((m) => (m.id === msId ? { ...m, done: !m.done } : m)) };
    }));
  }

  function removeMilestone(goalId: string, msId: string) {
    persist(goals.map((g) => {
      if (g.id !== goalId) return g;
      return { ...g, milestones: g.milestones.filter((m) => m.id !== msId) };
    }));
  }

  const filtered = statusFilter === "all" ? goals : goals.filter((g) => g.status === statusFilter);

  function progress(g: Goal): number {
    if (g.milestones.length === 0) return g.status === "completed" ? 100 : 0;
    return Math.round((g.milestones.filter((m) => m.done).length / g.milestones.length) * 100);
  }

  const statusColors: Record<GoalStatus, string> = { active: "badge-emerald", paused: "badge-amber", completed: "badge-cyan" };

  return (
    <div className="anim-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Goals</h1>
          <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", marginTop: 2 }}>
            {goals.filter((g) => g.status === "active").length} active · {goals.filter((g) => g.status === "completed").length} completed
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Icon name={showAdd ? "x" : "plus"} size={16} /> {showAdd ? "Cancel" : "Add Goal"}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass" style={{ padding: "1.25rem", marginBottom: "1rem", overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input className="input" placeholder="What's your goal?" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGoal()} autoFocus />
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: "auto" }}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" className="input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={{ width: "auto", maxWidth: 180 }} />
                <button className="btn btn-primary" onClick={addGoal}>Add</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
        {(["all", "active", "paused", "completed"] as const).map((s) => (
          <button key={s} className={`btn ${statusFilter === s ? "btn-primary" : "btn-ghost"}`} onClick={() => setStatusFilter(s)} style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem", textTransform: "capitalize" }}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🎯</div>
          <p style={{ color: "var(--z-text-sub)", fontSize: "0.9rem" }}>No goals yet. Dream big — set your first goal!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))" }}>
          <AnimatePresence>
            {filtered.map((goal) => {
              const pct = progress(goal);
              return (
                <motion.div key={goal.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 6 }}>{goal.title}</h3>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span className={`badge ${statusColors[goal.status]}`}>{goal.status}</span>
                        <span className="badge badge-violet">{goal.category}</span>
                        {goal.targetDate && (
                          <span className={`badge ${daysUntil(goal.targetDate) < 0 ? "badge-rose" : "badge-cyan"}`}>
                            {daysUntil(goal.targetDate) > 0 ? `${daysUntil(goal.targetDate)}d left` : daysUntil(goal.targetDate) === 0 ? "Today!" : "Overdue"}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Circular progress */}
                    <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                      <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke="url(#grad)" strokeWidth="4" strokeDasharray={`${pct * 1.508} 150.8`} strokeLinecap="round" style={{ transition: "stroke-dasharray 500ms ease" }} />
                        <defs><linearGradient id="grad"><stop offset="0%" stopColor="var(--z-violet)" /><stop offset="100%" stopColor="var(--z-cyan)" /></linearGradient></defs>
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>{pct}%</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar" style={{ marginTop: 12 }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>

                  {/* Milestones */}
                  {goal.milestones.length > 0 && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                      {goal.milestones.map((ms) => (
                        <div key={ms.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem" }}>
                          <button className={`checkbox ${ms.done ? "checked" : ""}`} onClick={() => toggleMilestone(goal.id, ms.id)} style={{ width: 18, height: 18 }}>
                            {ms.done && <Icon name="check" size={12} />}
                          </button>
                          <span style={{ flex: 1, textDecoration: ms.done ? "line-through" : "none", color: ms.done ? "var(--z-text-muted)" : "var(--z-text-sub)" }}>{ms.title}</span>
                          <button className="btn btn-ghost" onClick={() => removeMilestone(goal.id, ms.id)} style={{ padding: 2 }}>
                            <Icon name="x" size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add milestone */}
                  <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                    <input className="input" placeholder="Add milestone..." value={newMilestone[goal.id] || ""} onChange={(e) => setNewMilestone({ ...newMilestone, [goal.id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addMilestoneToGoal(goal.id)} style={{ fontSize: "0.8125rem" }} />
                    <button className="btn btn-secondary" onClick={() => addMilestoneToGoal(goal.id)} style={{ padding: "0.35rem 0.5rem" }}>
                      <Icon name="plus" size={14} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {goal.status !== "active" && <button className="btn btn-ghost" onClick={() => setStatus(goal.id, "active")} style={{ fontSize: "0.75rem" }}>▶ Active</button>}
                    {goal.status !== "paused" && <button className="btn btn-ghost" onClick={() => setStatus(goal.id, "paused")} style={{ fontSize: "0.75rem" }}>⏸ Pause</button>}
                    {goal.status !== "completed" && <button className="btn btn-ghost" onClick={() => setStatus(goal.id, "completed")} style={{ fontSize: "0.75rem" }}>✅ Complete</button>}
                    <button className="btn btn-danger" onClick={() => removeGoal(goal.id)} style={{ fontSize: "0.75rem", marginLeft: "auto" }}>
                      <Icon name="trash" size={14} /> Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
