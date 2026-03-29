"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { FocusSession, Task } from "../lib/types";
import { load, save, KEYS } from "../lib/storage";
import { id, fmtTime, todayKey } from "../lib/utils";
import Icon from "./Icon";

interface Props {
  onExit: () => void;
}

export default function FocusMode({ onExit }: Props) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [totalSec, setTotalSec] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [taskTitle, setTaskTitle] = useState("");
  const [tasks] = useState<Task[]>(() => load<Task[]>(KEYS.tasks, []).filter((t) => !t.done));
  const [showSetup, setShowSetup] = useState(true);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
      if (e.key === " " && !showSetup) { e.preventDefault(); setRunning((r) => !r); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onExit, showSetup]);

  const saveSession = useCallback(() => {
    const existing = load<FocusSession[]>(KEYS.focus, []);
    const session: FocusSession = {
      id: id(),
      taskTitle: taskTitle || "Focus session",
      duration: workDuration,
      completedAt: new Date().toISOString(),
    };
    save(KEYS.focus, [...existing, session]);
  }, [taskTitle, workDuration]);

  useEffect(() => {
    if (!running) {
      if (interval.current) clearInterval(interval.current);
      return;
    }

    interval.current = setInterval(() => {
      setSeconds((s) => {
        if (s === 0) {
          setMinutes((m) => {
            if (m === 0) {
              setRunning(false);
              if (!isBreak) {
                saveSession();
                setSessions((p) => p + 1);
              }
              setIsBreak((b) => !b);
              const nextDur = isBreak ? workDuration : breakDuration;
              setMinutes(nextDur);
              setTotalSec(nextDur * 60);
              setSeconds(0);
              return nextDur;
            }
            return m - 1;
          });
          return 59;
        }
        return s - 1;
      });
    }, 1000);

    return () => { if (interval.current) clearInterval(interval.current); };
  }, [running, isBreak, workDuration, breakDuration, saveSession]);

  function startFocus() {
    setShowSetup(false);
    setMinutes(workDuration);
    setSeconds(0);
    setTotalSec(workDuration * 60);
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    const dur = isBreak ? breakDuration : workDuration;
    setMinutes(dur);
    setSeconds(0);
    setTotalSec(dur * 60);
  }

  const elapsed = totalSec - (minutes * 60 + seconds);
  const progress = totalSec > 0 ? elapsed / totalSec : 0;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);

  const todayFocus = load<FocusSession[]>(KEYS.focus, []).filter(
    (s) => s.completedAt.slice(0, 10) === todayKey()
  );
  const todayMinutes = todayFocus.reduce((s, f) => s + f.duration, 0);

  if (showSetup) {
    return (
      <div className="focus-overlay" style={{ gap: 24 }}>
        <button className="btn btn-ghost" onClick={onExit} style={{ position: "absolute", top: 24, right: 24 }}>
          <Icon name="x" size={24} /> Exit
        </button>

        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: "3rem", marginBottom: 8 }}>🎯</div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 4 }}>
            <span className="gradient-text">Focus Mode</span>
          </h1>
          <p style={{ color: "var(--z-text-sub)", marginBottom: 24 }}>Eliminate distractions. One task. Deep work.</p>

          <div className="glass" style={{ padding: "1.5rem", textAlign: "left" }}>
            <label className="label" style={{ display: "block", marginBottom: 8 }}>What are you working on?</label>
            {tasks.length > 0 ? (
              <select className="input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} style={{ marginBottom: 16 }}>
                <option value="">Select a task or type below...</option>
                {tasks.map((t) => <option key={t.id} value={t.title}>{t.title}</option>)}
              </select>
            ) : null}
            <input className="input" placeholder="Task description..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} style={{ marginBottom: 16 }} />

            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label" style={{ display: "block", marginBottom: 4 }}>Work (min)</label>
                <input type="number" className="input" value={workDuration} min={1} max={90} onChange={(e) => setWorkDuration(+e.target.value)} style={{ width: 80 }} />
              </div>
              <div>
                <label className="label" style={{ display: "block", marginBottom: 4 }}>Break (min)</label>
                <input type="number" className="input" value={breakDuration} min={1} max={30} onChange={(e) => setBreakDuration(+e.target.value)} style={{ width: 80 }} />
              </div>
            </div>

            <button className="btn btn-primary" onClick={startFocus} style={{ width: "100%", height: 44 }}>
              <Icon name="play" size={18} /> Start Focus Session
            </button>
          </div>

          {todayMinutes > 0 && (
            <p style={{ marginTop: 16, fontSize: "0.8125rem", color: "var(--z-text-muted)" }}>
              Today: {todayMinutes} minutes focused across {todayFocus.length} sessions
            </p>
          )}
        </div>

        <p style={{ color: "var(--z-text-muted)", fontSize: "0.75rem", position: "absolute", bottom: 24 }}>
          Press <kbd style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", fontSize: "0.6875rem" }}>Space</kbd> to pause/resume · <kbd style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", fontSize: "0.6875rem" }}>Esc</kbd> to exit
        </p>
      </div>
    );
  }

  return (
    <div className="focus-overlay" style={{ gap: 32 }}>
      <button className="btn btn-ghost" onClick={onExit} style={{ position: "absolute", top: 24, right: 24 }}>
        <Icon name="x" size={24} />
      </button>

      {taskTitle && (
        <p style={{ fontSize: "0.875rem", color: "var(--z-text-sub)", letterSpacing: "0.04em" }}>
          {isBreak ? "☕ Break Time" : `Working on: ${taskTitle}`}
        </p>
      )}

      {/* Timer ring */}
      <div className="timer-ring">
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
          <circle
            cx="140" cy="140" r="120"
            fill="none"
            stroke={isBreak ? "var(--z-emerald)" : "url(#focusGrad)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          <defs>
            <linearGradient id="focusGrad">
              <stop offset="0%" stopColor="var(--z-violet)" />
              <stop offset="100%" stopColor="var(--z-cyan)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="timer-display">
          <div className="time" style={{ color: isBreak ? "var(--z-emerald)" : "var(--z-text)" }}>
            {fmtTime(minutes * 60 + seconds)}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--z-text-muted)", marginTop: 4 }}>
            {isBreak ? "Break" : "Focus"} · Session {sessions + 1}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn btn-secondary" onClick={reset} style={{ width: 48, height: 48, borderRadius: "50%", padding: 0 }}>
          <Icon name="refresh" size={20} />
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setRunning(!running)}
          style={{ width: 64, height: 64, borderRadius: "50%", padding: 0, fontSize: "1.25rem" }}
        >
          <Icon name={running ? "pause" : "play"} size={24} />
        </button>
        <button className="btn btn-secondary" onClick={onExit} style={{ width: 48, height: 48, borderRadius: "50%", padding: 0 }}>
          <Icon name="x" size={20} />
        </button>
      </div>

      <p style={{ color: "var(--z-text-muted)", fontSize: "0.75rem", position: "absolute", bottom: 24 }}>
        <kbd style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", fontSize: "0.6875rem" }}>Space</kbd> pause/resume · <kbd style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", fontSize: "0.6875rem" }}>Esc</kbd> exit
      </p>
    </div>
  );
}
