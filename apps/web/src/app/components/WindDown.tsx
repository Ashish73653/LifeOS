"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { Task, GratitudeEntry } from "../lib/types";
import { load, save, KEYS } from "../lib/storage";
import { id, todayKey } from "../lib/utils";

interface WindDownState {
  tasks: Task[];
  gratitude: string[];
  priorities: string[];
  saved: boolean;
}

function getInitialState(): WindDownState {
  const tasks = load<Task[]>(KEYS.tasks, []);
  const entries = load<GratitudeEntry[]>(KEYS.gratitude, []);
  const todayEntry = entries.find((e) => e.createdAt.slice(0, 10) === todayKey());

  return {
    tasks,
    gratitude: todayEntry?.items.length === 3 ? todayEntry.items : ["", "", ""],
    priorities: todayEntry?.tomorrowPriorities.length === 3 ? todayEntry.tomorrowPriorities : ["", "", ""],
    saved: Boolean(todayEntry),
  };
}

export default function WindDown() {
  const initial = getInitialState();
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [gratitude, setGratitude] = useState<string[]>(initial.gratitude);
  const [priorities, setPriorities] = useState<string[]>(initial.priorities);
  const [saved, setSaved] = useState(initial.saved);
  const [step, setStep] = useState(0);

  const todayTasks = tasks.filter((t) => t.dueAt === todayKey() || (!t.dueAt && t.createdAt.slice(0, 10) === todayKey()));
  const done = todayTasks.filter((t) => t.done);
  const undone = todayTasks.filter((t) => !t.done);

  const carryOver = useCallback((taskId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tKey = tomorrow.toISOString().slice(0, 10);
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, dueAt: tKey } : t));
    setTasks(updated);
    save(KEYS.tasks, updated);
  }, [tasks]);

  function saveWindDown() {
    const entries = load<GratitudeEntry[]>(KEYS.gratitude, []);
    const existing = entries.findIndex((e) => e.createdAt.slice(0, 10) === todayKey());
    const entry: GratitudeEntry = {
      id: existing >= 0 ? entries[existing].id : id(),
      items: gratitude,
      tomorrowPriorities: priorities,
      createdAt: existing >= 0 ? entries[existing].createdAt : new Date().toISOString(),
    };
    if (existing >= 0) entries[existing] = entry;
    else entries.push(entry);
    save(KEYS.gratitude, entries);
    setSaved(true);
  }

  const steps = [
    { title: "Day Review", icon: "📋" },
    { title: "Gratitude", icon: "🙏" },
    { title: "Tomorrow", icon: "🌅" },
  ];

  return (
    <div className="anim-fade" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Wind Down</h1>
      <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Reflect on your day, express gratitude, and prepare for tomorrow.
      </p>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        {steps.map((s, i) => (
          <button
            key={i}
            className={`btn ${step === i ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setStep(i)}
            style={{ flex: 1, fontSize: "0.8125rem" }}
          >
            {s.icon} {s.title}
          </button>
        ))}
      </div>

      {/* Step 0: Day Review */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <div className="glass" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <p className="label" style={{ color: "var(--z-emerald)", marginBottom: 12 }}>✅ Completed ({done.length})</p>
            {done.length === 0 ? (
              <p style={{ color: "var(--z-text-muted)", fontSize: "0.875rem" }}>No tasks completed today.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {done.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--z-text-sub)" }}>
                    <span style={{ color: "var(--z-emerald)" }}>✓</span> {t.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass" style={{ padding: "1.5rem" }}>
            <p className="label" style={{ color: "var(--z-amber)", marginBottom: 12 }}>⏳ Unfinished ({undone.length})</p>
            {undone.length === 0 ? (
              <p style={{ color: "var(--z-text-muted)", fontSize: "0.875rem" }}>All tasks done! Great work! 🎉</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {undone.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--z-text-sub)" }}>{t.title}</span>
                    <button className="btn btn-secondary" onClick={() => carryOver(t.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", whiteSpace: "nowrap" }}>
                      → Tomorrow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => setStep(1)} style={{ marginTop: 16, width: "100%" }}>
            Next → Gratitude
          </button>
        </motion.div>
      )}

      {/* Step 1: Gratitude */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <div className="glass" style={{ padding: "1.5rem" }}>
            <p className="label" style={{ color: "var(--z-violet)", marginBottom: 4 }}>Three things you&apos;re grateful for</p>
            <p style={{ color: "var(--z-text-muted)", fontSize: "0.8125rem", marginBottom: 16 }}>Gratitude rewires your brain for positivity.</p>

            {gratitude.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: "1.25rem" }}>
                  {["💛", "💚", "💜"][i]}
                </span>
                <input
                  className="input"
                  placeholder={`Grateful for #${i + 1}...`}
                  value={g}
                  onChange={(e) => { const u = [...gratitude]; u[i] = e.target.value; setGratitude(u); }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setStep(0)} style={{ flex: 1 }}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(2)} style={{ flex: 1 }}>Next → Tomorrow</button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Tomorrow */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <div className="glass" style={{ padding: "1.5rem" }}>
            <p className="label" style={{ color: "var(--z-cyan)", marginBottom: 4 }}>Top 3 priorities for tomorrow</p>
            <p style={{ color: "var(--z-text-muted)", fontSize: "0.8125rem", marginBottom: 16 }}>Set intention tonight so tomorrow starts with clarity.</p>

            {priorities.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, var(--z-violet), var(--z-cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <input
                  className="input"
                  placeholder={`Priority #${i + 1}...`}
                  value={p}
                  onChange={(e) => { const u = [...priorities]; u[i] = e.target.value; setPriorities(u); }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
            <button className="btn btn-primary" onClick={saveWindDown} style={{ flex: 1 }}>
              {saved ? "✓ Saved" : "Save & Complete"}
            </button>
          </div>

          {saved && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", marginTop: 24 }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🌙</div>
              <p style={{ color: "var(--z-text-sub)", fontSize: "0.9rem" }}>
                Great job today. Rest well and come back stronger tomorrow.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
