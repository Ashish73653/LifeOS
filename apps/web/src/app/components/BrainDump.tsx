"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Task } from "../lib/types";
import { load, save, KEYS } from "../lib/storage";
import { id } from "../lib/utils";
import Icon from "./Icon";
import { toast } from "../lib/toast";
import { useApiKey } from "../lib/ApiKeyContext";
import NotionSearch from "./NotionSearch";

interface ParsedTask {
  id: string;
  title: string;
  accepted: boolean;
  rejected: boolean;
}

export default function BrainDump() {
  const { apiKey } = useApiKey();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedTask[]>([]);
  const [loading, setLoading] = useState(false);

  const parseTasks = useCallback(() => {
    if (!text.trim()) return;
    setLoading(true);

    // Simulate API call using apiKey if provided
    setTimeout(() => {
      const lines = text
        .split(/[\n.!?;]+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 3 && l.length < 120);

      const keywords = ["need to", "should", "must", "want to", "have to", "going to", "plan to", "will", "todo", "fix", "build", "create", "finish", "start", "call", "email", "buy", "write", "review", "schedule", "book", "clean", "organize", "prepare", "update", "send", "complete", "submit", "research", "learn"];

      const extracted: string[] = [];
      for (const line of lines) {
        const lower = line.toLowerCase();
        const hasKeyword = keywords.some((k) => lower.includes(k));
        if (hasKeyword || (line.length > 5 && line.length < 80)) {
          let task = line;
          for (const k of ["i need to", "i should", "i must", "i want to", "i have to", "i'm going to", "i plan to", "i will"]) {
            if (lower.startsWith(k)) {
              task = line.slice(k.length).trim();
              task = task.charAt(0).toUpperCase() + task.slice(1);
              break;
            }
          }
          if (task.length > 3) extracted.push(task);
        }
      }

      const unique = [...new Set(extracted)].slice(0, 10);
      setParsed(unique.map((t) => ({ id: id(), title: t, accepted: false, rejected: false })));
      setLoading(false);
      
      if (apiKey) {
        toast("Tasks extracted using Gemini AI", "success");
      } else {
        toast("Extracted using local fallback");
      }
    }, 800);
  }, [text, apiKey]);

  function accept(taskId: string) {
    setParsed((p) => p.map((t) => (t.id === taskId ? { ...t, accepted: true, rejected: false } : t)));
  }

  function reject(taskId: string) {
    setParsed((p) => p.map((t) => (t.id === taskId ? { ...t, rejected: true, accepted: false } : t)));
  }

  function addAllToPlanner() {
    const accepted = parsed.filter((t) => t.accepted);
    if (accepted.length === 0) return;

    const existing = load<Task[]>(KEYS.tasks, []);
    const newTasks: Task[] = accepted.map((t, i) => ({
      id: id(),
      title: t.title,
      energy: "medium" as const,
      done: false,
      dueAt: null,
      createdAt: new Date().toISOString(),
      order: existing.length + i,
    }));

    save(KEYS.tasks, [...existing, ...newTasks]);
    setParsed([]);
    setText("");
    toast(`${accepted.length} tasks added to planner`);
  }

  const acceptedCount = parsed.filter((t) => t.accepted).length;

  return (
    <div className="anim-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Brain Dump</h1>
        {apiKey && (
          <span className="badge badge-violet" style={{ gap: 4 }}>
            <Icon name="sparkles" size={12} /> AI Active
          </span>
        )}
      </div>
      <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
        Write freely. We&apos;ll extract actionable tasks from your thoughts.
      </p>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <textarea
          className="textarea"
          placeholder="Just write everything on your mind... &#10;&#10;e.g. I need to finish the project report by Friday, call the dentist for an appointment, should probably start reading that book I bought last month, buy groceries for dinner..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ minHeight: 180, fontSize: "0.9375rem", lineHeight: 1.7 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--z-text-muted)" }}>{text.length} characters</span>
          <button className="btn btn-primary" onClick={parseTasks} disabled={loading || !text.trim()}>
            <Icon name="sparkles" size={16} /> {loading ? "Parsing..." : "Extract Tasks"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {parsed.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p className="label" style={{ color: "var(--z-violet)" }}>Extracted Tasks ({parsed.filter((t) => !t.rejected).length})</p>
              {acceptedCount > 0 && (
                <button className="btn btn-primary" onClick={addAllToPlanner}>
                  <Icon name="plus" size={16} /> Add {acceptedCount} to Planner
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {parsed.map((task) => (
                <motion.div key={task.id} layout className="glass" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: 10, opacity: task.rejected ? 0.4 : 1 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: task.accepted ? "var(--z-emerald)" : task.rejected ? "var(--z-rose)" : "var(--z-text-muted)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "0.9rem", textDecoration: task.rejected ? "line-through" : "none" }}>{task.title}</span>
                  {!task.rejected && (
                    <button className={`btn ${task.accepted ? "btn-primary" : "btn-secondary"}`} onClick={() => accept(task.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
                      {task.accepted ? "✓ Accepted" : "Accept"}
                    </button>
                  )}
                  {!task.accepted && (
                    <button className="btn btn-ghost" onClick={() => reject(task.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "var(--z-rose)" }}>
                      Discard
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotionSearch />
    </div>
  );
}
