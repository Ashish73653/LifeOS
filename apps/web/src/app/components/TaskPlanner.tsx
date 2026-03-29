"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback, type DragEvent } from "react";
import { Task, EnergyLevel } from "../lib/types";
import { load, save, KEYS } from "../lib/storage";
import { id, todayKey, fmtDate, isOverdue } from "../lib/utils";
import Icon from "./Icon";
import { toast } from "../lib/toast";

type Filter = "all" | "active" | "completed" | "today" | "overdue";

interface IntegrationsState {
  gcal?: boolean;
}

export default function TaskPlanner() {
  const [tasks, setTasks] = useState<Task[]>(() => load<Task[]>(KEYS.tasks, []));
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [dueAt, setDueAt] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const [hasGcal] = useState<boolean>(() => {
    const ig = load<IntegrationsState>("zenith-integrations", {});
    return ig.gcal ?? false;
  });

  const persist = useCallback((t: Task[]) => {
    setTasks(t);
    save(KEYS.tasks, t);
  }, []);

  function addTask() {
    if (!title.trim()) return;
    const t: Task = {
      id: id(),
      title: title.trim(),
      energy,
      done: false,
      dueAt: dueAt || null,
      createdAt: new Date().toISOString(),
      order: tasks.length,
    };
    persist([...tasks, t]);
    setTitle("");
    setDueAt("");
    setEnergy("medium");
    setShowAdd(false);
    toast("Task added");
  }

  function toggle(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    persist(tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));
    toast(task?.done ? "Task reopened" : "Task completed ✓");
  }

  function remove(taskId: string) {
    persist(tasks.filter((t) => t.id !== taskId));
    toast("Task deleted", "info");
  }

  function saveEdit(taskId: string) {
    if (!editTitle.trim()) return;
    persist(tasks.map((t) => (t.id === taskId ? { ...t, title: editTitle.trim() } : t)));
    setEditId(null);
  }

  function handleDragStart(idx: number) {
    dragItem.current = idx;
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === idx) return;
    const reordered = [...filtered];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(idx, 0, moved);
    dragItem.current = idx;
    const ids = new Set(reordered.map((t) => t.id));
    const rest = tasks.filter((t) => !ids.has(t.id));
    persist([...reordered.map((t, i) => ({ ...t, order: i })), ...rest]);
  }

  const today = todayKey();
  const filtered = tasks
    .filter((t) => {
      if (filter === "active") return !t.done;
      if (filter === "completed") return t.done;
      if (filter === "today") return t.dueAt === today || (!t.dueAt && t.createdAt.slice(0, 10) === today);
      if (filter === "overdue") return !t.done && isOverdue(t.dueAt);
      return true;
    })
    .sort((a, b) => a.order - b.order);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Done" },
    { id: "today", label: "Today" },
    { id: "overdue", label: "Overdue" },
  ];

  useEffect(() => {
    if (showAdd && inputRef.current) inputRef.current.focus();
  }, [showAdd]);

  return (
    <div className="anim-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Tasks</h1>
          <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", marginTop: 2 }}>
            {tasks.filter((t) => !t.done).length} active · {tasks.filter((t) => t.done).length} completed
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Icon name={showAdd ? "x" : "plus"} size={16} />
          {showAdd ? "Cancel" : "Add Task"}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass"
            style={{ padding: "1.25rem", marginBottom: "1rem", overflow: "hidden" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input ref={inputRef} className="input" placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["low", "medium", "high"] as const).map((l) => (
                    <button key={l} className={`btn ${energy === l ? "btn-primary" : "btn-secondary"}`} onClick={() => setEnergy(l)} style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem", textTransform: "capitalize" }}>
                      {l}
                    </button>
                  ))}
                </div>
                <input type="date" className="input" value={dueAt} onChange={(e) => setDueAt(e.target.value)} style={{ width: "auto", maxWidth: 180 }} />
                <button className="btn btn-primary" onClick={addTask}>Add</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {filters.map((f) => (
            <button key={f.id} className={`btn ${filter === f.id ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(f.id)} style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {hasGcal && filter === "today" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: "1.25rem" }}>
            <div className="glass" style={{ padding: "1rem", display: "flex", gap: 12, overflowX: "auto", whiteSpace: "nowrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 12, borderRight: "1px solid var(--z-border)", flexShrink: 0 }}>
                <Icon name="calendar" size={16} style={{ color: "var(--z-cyan)" }} />
                <span className="label" style={{ color: "var(--z-cyan)", margin: 0 }}>Schedule</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.25rem 0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: 6, flexShrink: 0 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--z-text-muted)" }}>09:00 AM</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Daily Standup</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.25rem 0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: 6, flexShrink: 0 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--z-text-muted)" }}>11:30 AM</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Product Review</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.25rem 0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: 6, flexShrink: 0 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--z-text-muted)" }}>02:00 PM</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Deep Work Block</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.25rem 0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: 6, flexShrink: 0 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--z-text-muted)" }}>04:30 PM</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>1:1 Catchup</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="glass" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✨</div>
          <p style={{ color: "var(--z-text-sub)", fontSize: "0.9rem" }}>
            {filter === "all" ? "No tasks yet. Add one above!" : "No tasks match this filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <AnimatePresence>
            {filtered.map((task, idx) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e: DragEvent<HTMLDivElement>) => handleDragOver(e, idx)}
                className="glass glass-hover"
                style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "grab" }}
              >
                <button className={`checkbox ${task.done ? "checked" : ""}`} onClick={() => toggle(task.id)}>
                  {task.done && <Icon name="check" size={14} />}
                </button>

                {editId === task.id ? (
                  <input
                    className="input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveEdit(task.id)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(task.id)}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                ) : (
                  <span
                    onDoubleClick={() => { setEditId(task.id); setEditTitle(task.title); }}
                    style={{ flex: 1, fontSize: "0.9rem", textDecoration: task.done ? "line-through" : "none", color: task.done ? "var(--z-text-muted)" : "var(--z-text)", cursor: "text" }}
                  >
                    {task.title}
                  </span>
                )}

                <span className={`badge energy-${task.energy}`} style={{ fontSize: "0.6875rem" }}>{task.energy}</span>

                {task.dueAt && (
                  <span className={`badge ${isOverdue(task.dueAt) && !task.done ? "badge-rose" : "badge-cyan"}`}>
                    {fmtDate(task.dueAt)}
                  </span>
                )}

                <button className="btn btn-ghost" onClick={() => remove(task.id)} style={{ padding: "0.25rem", color: "var(--z-text-muted)" }}>
                  <Icon name="trash" size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
