"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Task, Habit, Goal, MoodEntry, ViewType } from "../lib/types";
import { load, KEYS } from "../lib/storage";
import { greeting, todayKey, last7Days } from "../lib/utils";
import Icon from "./Icon";
import { useApiKey } from "../lib/ApiKeyContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  onNavigate: (v: ViewType) => void;
  onStartFocus: () => void;
}

const MOODS = ["😫", "😔", "😐", "😊", "🤩"];

export default function Dashboard({ onNavigate, onStartFocus }: Props) {
  const { apiKey } = useApiKey();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [briefing, setBriefing] = useState("");
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [energy, setEnergy] = useState<"low" | "medium" | "high">("medium");

  useEffect(() => {
    setTasks(load<Task[]>(KEYS.tasks, []));
    setHabits(load<Habit[]>(KEYS.habits, []));
    setGoals(load<Goal[]>(KEYS.goals, []));
    setMoods(load<MoodEntry[]>(KEYS.moods, []));
  }, []);

  const today = todayKey();
  const todayTasks = tasks.filter(
    (t) => t.dueAt === today || (!t.dueAt && t.createdAt.slice(0, 10) === today)
  );
  const doneTasks = todayTasks.filter((t) => t.done).length;
  const activeGoals = goals.filter((g) => g.status === "active").length;

  const days7 = last7Days();
  const activeStreaks = habits.filter((h) => {
    let streak = 0;
    for (const d of [...days7].reverse()) {
      if (h.completions[d]) streak++;
      else break;
    }
    return streak > 0;
  }).length;

  const lastMood = moods.length > 0 ? moods[moods.length - 1] : null;

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  async function genBriefing() {
    setLoadingBrief(true);
    try {
      const r = await fetch(`${API}/api/ai/briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          energy,
          pendingTasks: tasks.filter((t) => !t.done).slice(0, 5).map((t) => t.title),
          pendingHabits: habits.slice(0, 5).map((h) => h.name),
          activeGoals: goals.filter((g) => g.status === "active").slice(0, 5).map((g) => g.title),
          userApiKey: apiKey,
        }),
      });
      const json = await r.json();
      setBriefing(json.data?.briefing || "Stay focused today.");
    } catch {
      setBriefing(
        energy === "high"
          ? "High energy detected! Tackle your hardest task first. Stack wins before lunch."
          : energy === "low"
          ? "Low energy today — focus on one key task, protect your habits, and rest intentionally."
          : "Steady energy. Balance deep work with small wins. Keep your streaks alive."
      );
    } finally {
      setLoadingBrief(false);
    }
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Greeting */}
      <motion.div variants={item} className="glass" style={{ padding: "1.5rem 2rem", marginBottom: "1.25rem" }}>
        <p className="label" style={{ color: "var(--z-violet)" }}>{todayLabel}</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: 4, letterSpacing: "-0.02em" }}>
          {greeting()} <span className="gradient-text">✦</span>
        </h1>
        <p style={{ color: "var(--z-text-sub)", marginTop: 4, fontSize: "0.9rem" }}>
          Your personal command center is ready. Let&apos;s make today count.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        variants={item}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}
      >
        <div className="stat-card" onClick={() => onNavigate("tasks")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="tasks" size={18} className="gradient-text" style={{}} />
            <span className="label">Today&apos;s Tasks</span>
          </div>
          <div className="stat-value gradient-text">{doneTasks}/{todayTasks.length}</div>
          <div className="stat-label">completed</div>
        </div>

        <div className="stat-card" onClick={() => onNavigate("habits")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="habits" size={18} style={{ color: "var(--z-amber)" }} />
            <span className="label">Active Streaks</span>
          </div>
          <div className="stat-value" style={{ color: "var(--z-amber)" }}>{activeStreaks}</div>
          <div className="stat-label">habits on fire</div>
        </div>

        <div className="stat-card" onClick={() => onNavigate("goals")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="goals" size={18} style={{ color: "var(--z-emerald)" }} />
            <span className="label">Goals</span>
          </div>
          <div className="stat-value" style={{ color: "var(--z-emerald)" }}>{activeGoals}</div>
          <div className="stat-label">in progress</div>
        </div>

        <div className="stat-card" onClick={() => onNavigate("mood")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="mood" size={18} style={{ color: "var(--z-cyan)" }} />
            <span className="label">Mood</span>
          </div>
          <div className="stat-value">{lastMood ? MOODS[lastMood.value - 1] : "—"}</div>
          <div className="stat-label">{lastMood ? "latest" : "not logged"}</div>
        </div>
      </motion.div>

      {/* AI Briefing */}
      <motion.div variants={item} className="glass" style={{ padding: "1.5rem", marginBottom: "1.25rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "var(--z-glow-v)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Icon name="sparkles" size={18} style={{ color: "var(--z-violet)" }} />
          <span className="label" style={{ color: "var(--z-violet)" }}>AI Daily Briefing</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {(["low", "medium", "high"] as const).map((l) => (
            <button
              key={l}
              className={`btn ${energy === l ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setEnergy(l)}
              style={{ textTransform: "capitalize", fontSize: "0.8125rem" }}
            >
              {l === "low" ? "🌙" : l === "medium" ? "⚡" : "🔥"} {l}
            </button>
          ))}
          <button className="btn btn-primary" onClick={genBriefing} disabled={loadingBrief}>
            {loadingBrief ? "Generating..." : "Generate Briefing"}
          </button>
        </div>

        {briefing && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--z-border)", borderRadius: "var(--z-radius-sm)", padding: "1rem", fontSize: "0.9rem", lineHeight: 1.6, color: "var(--z-text-sub)" }}>
            {briefing}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <button className="btn btn-secondary" onClick={() => onNavigate("tasks")}>
          <Icon name="plus" size={16} /> Add Task
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate("mood")}>
          <Icon name="mood" size={16} /> Log Mood
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate("braindump")}>
          <Icon name="brain" size={16} /> Brain Dump
        </button>
        <button className="btn btn-primary" onClick={onStartFocus}>
          <Icon name="focus" size={16} /> Start Focus
        </button>
      </motion.div>

      {/* Today's tasks preview */}
      {todayTasks.length > 0 && (
        <motion.div variants={item} className="glass" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="label">Today&apos;s Tasks</span>
            <button className="btn btn-ghost" style={{ fontSize: "0.75rem" }} onClick={() => onNavigate("tasks")}>
              View All →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {todayTasks.slice(0, 5).map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.5rem 0.75rem", borderRadius: "var(--z-radius-sm)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--z-border)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.done ? "var(--z-emerald)" : "var(--z-text-muted)" }} />
                <span style={{ fontSize: "0.875rem", textDecoration: t.done ? "line-through" : "none", color: t.done ? "var(--z-text-muted)" : "var(--z-text)", flex: 1 }}>
                  {t.title}
                </span>
                <span className={`badge energy-${t.energy}`}>{t.energy}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
