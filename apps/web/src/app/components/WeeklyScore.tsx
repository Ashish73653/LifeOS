"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { Task, Habit, Goal, MoodEntry, FocusSession } from "../lib/types";
import { load, KEYS } from "../lib/storage";
import { last7Days } from "../lib/utils";

interface Dimension {
  label: string;
  score: number;
  color: string;
  icon: string;
  detail: string;
}

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function calcScores(): Dimension[] {
  const days = last7Days();
  const weekStart = getWeekStart();

  // Tasks score
  const tasks = load<Task[]>(KEYS.tasks, []);
  const weekTasks = tasks.filter((t) => t.createdAt.slice(0, 10) >= weekStart || (t.dueAt && t.dueAt >= weekStart));
  const doneCount = weekTasks.filter((t) => t.done).length;
  const taskScore = weekTasks.length > 0 ? Math.round((doneCount / weekTasks.length) * 100) : 0;

  // Habits score
  const habits = load<Habit[]>(KEYS.habits, []);
  let habitTotal = 0, habitDone = 0;
  for (const h of habits) {
    for (const d of days) {
      habitTotal++;
      if (h.completions[d]) habitDone++;
    }
  }
  const habitScore = habitTotal > 0 ? Math.round((habitDone / habitTotal) * 100) : 0;

  // Goals score
  const goals = load<Goal[]>(KEYS.goals, []);
  const activeGoals = goals.filter((g) => g.status === "active");
  let goalTotal = 0;
  for (const g of activeGoals) {
    if (g.milestones.length > 0) {
      goalTotal += Math.round((g.milestones.filter((m) => m.done).length / g.milestones.length) * 100);
    }
  }
  const goalScore = activeGoals.length > 0 ? Math.round(goalTotal / activeGoals.length) : 0;

  // Mood score
  const moods = load<MoodEntry[]>(KEYS.moods, []);
  const weekMoods = moods.filter((m) => m.createdAt.slice(0, 10) >= weekStart);
  const avgMood = weekMoods.length > 0 ? weekMoods.reduce((s, m) => s + m.value, 0) / weekMoods.length : 0;
  const moodScore = Math.round((avgMood / 5) * 100);

  // Focus score (target: 150 min/week)
  const sessions = load<FocusSession[]>(KEYS.focus, []);
  const weekSessions = sessions.filter((s) => s.completedAt.slice(0, 10) >= weekStart);
  const focusMin = weekSessions.reduce((s, f) => s + f.duration, 0);
  const focusScore = Math.min(100, Math.round((focusMin / 150) * 100));

  return [
    { label: "Tasks", score: taskScore, color: "#8b5cf6", icon: "✓", detail: `${doneCount}/${weekTasks.length} completed` },
    { label: "Habits", score: habitScore, color: "#fbbf24", icon: "⚡", detail: `${habitDone}/${habitTotal} check-ins` },
    { label: "Goals", score: goalScore, color: "#34d399", icon: "🎯", detail: `${activeGoals.length} active` },
    { label: "Mood", score: moodScore, color: "#22d3ee", icon: "😊", detail: weekMoods.length > 0 ? `avg ${avgMood.toFixed(1)}/5` : "no entries" },
    { label: "Focus", score: focusScore, color: "#fb7185", icon: "🧠", detail: `${focusMin} min this week` },
  ];
}

// Radar chart math
const CX = 150, CY = 150, R = 110;
const ANGLES = Array.from({ length: 5 }, (_, i) => (2 * Math.PI / 5) * i - Math.PI / 2);

function polar(r: number, i: number) {
  return { x: CX + r * Math.cos(ANGLES[i]), y: CY + r * Math.sin(ANGLES[i]) };
}

function polygon(scores: number[]): string {
  return scores.map((s, i) => {
    const p = polar((s / 100) * R, i);
    return `${p.x},${p.y}`;
  }).join(" ");
}

function gridPolygon(scale: number): string {
  return ANGLES.map((_, i) => {
    const p = polar(R * scale, i);
    return `${p.x},${p.y}`;
  }).join(" ");
}

export default function WeeklyScore() {
  const dims = useMemo(() => calcScores(), []);
  const overall = useMemo(
    () => (dims.length > 0 ? Math.round(dims.reduce((s, x) => s + x.score, 0) / dims.length) : 0),
    [dims],
  );

  const tips: string[] = [];
  for (const d of dims) {
    if (d.score < 30) tips.push(`Your ${d.label.toLowerCase()} score is low — try focusing on it this week.`);
  }

  const scoreColor = overall >= 70 ? "var(--z-emerald)" : overall >= 40 ? "var(--z-amber)" : "var(--z-rose)";
  const weekLabel = `Week of ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(getWeekStart()))}`;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="anim-fade">
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Weekly Life Score</h1>
      <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{weekLabel} · Track your holistic progress</p>

      <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {/* Radar chart */}
        <motion.div variants={item} className="glass" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg width="300" height="300" viewBox="0 0 300 300">
            {/* Grid rings */}
            {[0.33, 0.66, 1].map((s) => (
              <polygon key={s} points={gridPolygon(s)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}
            {/* Axes */}
            {ANGLES.map((_, i) => {
              const p = polar(R, i);
              return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
            })}
            {/* Score polygon */}
            {dims.length > 0 && (
              <>
                <defs>
                  <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(139,92,246,0.4)" />
                    <stop offset="100%" stopColor="rgba(34,211,238,0.3)" />
                  </linearGradient>
                </defs>
                <polygon points={polygon(dims.map((d) => d.score))} fill="url(#radarGrad)" stroke="url(#radarStroke)" strokeWidth="2" />
                <defs>
                  <linearGradient id="radarStroke">
                    <stop offset="0%" stopColor="var(--z-violet)" />
                    <stop offset="100%" stopColor="var(--z-cyan)" />
                  </linearGradient>
                </defs>
              </>
            )}
            {/* Dots + labels */}
            {dims.map((d, i) => {
              const scoreP = polar((d.score / 100) * R, i);
              const labelP = polar(R + 22, i);
              return (
                <g key={d.label}>
                  <circle cx={scoreP.x} cy={scoreP.y} r="5" fill={d.color} stroke="var(--z-bg)" strokeWidth="2" />
                  <text x={labelP.x} y={labelP.y} fill="var(--z-text-sub)" fontSize="11" fontWeight="600" textAnchor="middle" dominantBaseline="middle">
                    {d.icon} {d.label}
                  </text>
                </g>
              );
            })}
            {/* Center score */}
            <text x={CX} y={CY - 8} fill={scoreColor} fontSize="32" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
              {overall}
            </text>
            <text x={CX} y={CY + 16} fill="var(--z-text-muted)" fontSize="11" textAnchor="middle">
              OVERALL
            </text>
          </svg>
        </motion.div>

        {/* Score breakdown */}
        <motion.div variants={item} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {dims.map((d) => (
            <div key={d.label} className="glass" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.25rem" }}>{d.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{d.label}</span>
                </div>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: d.color }}>{d.score}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${d.score}%`, background: d.color }} />
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--z-text-muted)", marginTop: 6 }}>{d.detail}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <motion.div variants={item} className="glass" style={{ padding: "1.25rem", marginTop: "1.25rem" }}>
          <p className="label" style={{ marginBottom: 8, color: "var(--z-amber)" }}>💡 Suggestions</p>
          {tips.map((tip, i) => (
            <p key={i} style={{ fontSize: "0.875rem", color: "var(--z-text-sub)", marginBottom: 4 }}>• {tip}</p>
          ))}
        </motion.div>
      )}

      {/* Motivation */}
      <motion.div variants={item} className="glass" style={{ padding: "1.25rem", marginTop: "1.25rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.9375rem", color: "var(--z-text)", fontStyle: "italic" }}>
          {overall >= 80
            ? "🏆 Outstanding week! You're operating at elite level."
            : overall >= 60
            ? "💪 Strong week! Keep pushing, you're building real momentum."
            : overall >= 40
            ? "📈 Good progress. Focus on weak areas to level up."
            : overall > 0
            ? "🌱 Every step counts. Pick one area and commit to improving it."
            : "Start tracking your activities to see your life score grow!"}
        </p>
      </motion.div>
    </motion.div>
  );
}
