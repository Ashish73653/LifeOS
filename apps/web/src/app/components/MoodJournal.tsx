"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { MoodEntry, MoodLevel } from "../lib/types";
import { load, save, KEYS } from "../lib/storage";
import { id, last7Days, dayLabel, fmtDate } from "../lib/utils";
import { toast } from "../lib/toast";

const MOODS: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: 1, emoji: "😫", label: "Terrible" },
  { value: 2, emoji: "😔", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Amazing" },
];

const MOOD_COLORS = ["#fb7185", "#fbbf24", "#94a3b8", "#34d399", "#8b5cf6"];

export default function MoodJournal() {
  const [entries, setEntries] = useState<MoodEntry[]>(() => load<MoodEntry[]>(KEYS.moods, []));
  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState("");

  const persist = useCallback((e: MoodEntry[]) => { setEntries(e); save(KEYS.moods, e); }, []);

  function logMood() {
    if (!selected) return;
    const entry: MoodEntry = { id: id(), value: selected, note: note.trim(), createdAt: new Date().toISOString() };
    persist([...entries, entry]);
    setSelected(null);
    setNote("");
    toast("Mood logged ✓");
  }

  function removeEntry(entryId: string) {
    persist(entries.filter((e) => e.id !== entryId));
  }

  const days = last7Days();
  const dayMoods = days.map((d) => {
    const dayEntries = entries.filter((e) => e.createdAt.slice(0, 10) === d);
    if (dayEntries.length === 0) return null;
    return Math.round(dayEntries.reduce((s, e) => s + e.value, 0) / dayEntries.length);
  });

  // SVG chart dimensions
  const W = 320, H = 120, PX = 24, PY = 12;
  const chartW = W - PX * 2, chartH = H - PY * 2;
  const points = dayMoods.map((v, i) => {
    if (v === null) return null;
    const x = PX + (i / 6) * chartW;
    const y = PY + chartH - ((v - 1) / 4) * chartH;
    return { x, y };
  }).filter(Boolean) as { x: number; y: number }[];

  const linePath = points.length > 1 ? points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") : "";

  // Stats
  const avg = entries.length > 0 ? (entries.reduce((s, e) => s + e.value, 0) / entries.length).toFixed(1) : "—";
  const distribution = [0, 0, 0, 0, 0];
  entries.forEach((e) => { distribution[e.value - 1]++; });
  const maxDist = Math.max(...distribution, 1);

  return (
    <div className="anim-fade">
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Mood Journal</h1>
      <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
        {entries.length} entries · Average: {avg}/5
      </p>

      {/* Quick log */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <p className="label" style={{ marginBottom: 12, color: "var(--z-violet)" }}>How are you feeling?</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16 }}>
          {MOODS.map((m) => (
            <button key={m.value} className={`mood-btn ${selected === m.value ? "selected" : ""}`} onClick={() => setSelected(m.value)} title={m.label}>
              {m.emoji}
            </button>
          ))}
        </div>
        {selected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea className="textarea" placeholder="What's on your mind? (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 80 }} />
            <button className="btn btn-primary" onClick={logMood} style={{ alignSelf: "flex-end" }}>
              Log Mood
            </button>
          </motion.div>
        )}
      </motion.div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {/* 7-day trend */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass" style={{ padding: "1.25rem" }}>
          <p className="label" style={{ marginBottom: 12 }}>7-Day Trend</p>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
            {/* Grid */}
            {[1, 2, 3, 4, 5].map((v) => {
              const y = PY + chartH - ((v - 1) / 4) * chartH;
              return <line key={v} x1={PX} x2={W - PX} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />;
            })}
            {/* Line */}
            {linePath && <path d={linePath} fill="none" stroke="url(#moodGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
            {/* Dots */}
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--z-violet)" stroke="var(--z-bg)" strokeWidth="2" />
            ))}
            {/* Day labels */}
            {days.map((d, i) => {
              const x = PX + (i / 6) * chartW;
              return <text key={d} x={x} y={H - 2} fill="var(--z-text-muted)" fontSize="9" textAnchor="middle">{dayLabel(d)}</text>;
            })}
            <defs><linearGradient id="moodGrad"><stop offset="0%" stopColor="var(--z-violet)" /><stop offset="100%" stopColor="var(--z-cyan)" /></linearGradient></defs>
          </svg>
        </motion.div>

        {/* Distribution */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass" style={{ padding: "1.25rem" }}>
          <p className="label" style={{ marginBottom: 12 }}>Distribution</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOODS.map((m, i) => (
              <div key={m.value} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.25rem", width: 30, textAlign: "center" }}>{m.emoji}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(distribution[i] / maxDist) * 100}%`, borderRadius: 4, background: MOOD_COLORS[i], transition: "width 400ms ease" }} />
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--z-text-muted)", width: 20, textAlign: "right" }}>{distribution[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent entries */}
      {entries.length > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <p className="label" style={{ marginBottom: 10 }}>Recent Entries</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...entries].reverse().slice(0, 10).map((entry) => (
              <div key={entry.id} className="glass" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "1.5rem" }}>{MOODS[entry.value - 1]?.emoji}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--z-text-sub)" }}>{fmtDate(entry.createdAt)}</span>
                  {entry.note && <p style={{ fontSize: "0.875rem", marginTop: 2, color: "var(--z-text)" }}>{entry.note}</p>}
                </div>
                <button className="btn btn-ghost" onClick={() => removeEntry(entry.id)} style={{ padding: "0.25rem", color: "var(--z-text-muted)" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
