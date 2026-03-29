"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { save, load } from "../lib/storage";
import { toast } from "../lib/toast";
import Icon from "./Icon";

interface UserSettings {
  userName: string;
  workDuration: number;
  breakDuration: number;
  backupReminder: boolean;
  lastBackup: string;
}

const DEFAULTS: UserSettings = {
  userName: "",
  workDuration: 25,
  breakDuration: 5,
  backupReminder: true,
  lastBackup: "",
};

const KEY = "zenith-settings";

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(() => load<UserSettings>(KEY, DEFAULTS));
  const [saved, setSaved] = useState(false);

  function update(patch: Partial<UserSettings>) {
    setSettings((s) => ({ ...s, ...patch }));
    setSaved(false);
  }

  function handleSave() {
    save(KEY, settings);
    setSaved(true);
    toast("Settings saved", "success");
    setTimeout(() => setSaved(false), 2000);
  }

  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Settings</h1>
      <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Personalize your Zenith experience.</p>

      {/* Profile */}
      <motion.div variants={item} className="glass" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <p className="label" style={{ marginBottom: 12, color: "var(--z-violet)" }}>Profile</p>
        <label style={{ display: "block", marginBottom: 6, fontSize: "0.8125rem", color: "var(--z-text-sub)" }}>Your Name</label>
        <input
          className="input"
          placeholder="Enter your name for personalized greetings"
          value={settings.userName}
          onChange={(e) => update({ userName: e.target.value })}
        />
        <p style={{ fontSize: "0.75rem", color: "var(--z-text-muted)", marginTop: 6 }}>
          Used in dashboard greetings. Leave blank for generic greeting.
        </p>
      </motion.div>

      {/* Focus */}
      <motion.div variants={item} className="glass" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <p className="label" style={{ marginBottom: 12, color: "var(--z-cyan)" }}>Focus Mode Defaults</p>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: "0.8125rem", color: "var(--z-text-sub)" }}>Work Duration (min)</label>
            <input
              type="number"
              className="input"
              min={1}
              max={90}
              value={settings.workDuration}
              onChange={(e) => update({ workDuration: Math.max(1, Math.min(90, +e.target.value)) })}
              style={{ width: 100 }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: "0.8125rem", color: "var(--z-text-sub)" }}>Break Duration (min)</label>
            <input
              type="number"
              className="input"
              min={1}
              max={30}
              value={settings.breakDuration}
              onChange={(e) => update({ breakDuration: Math.max(1, Math.min(30, +e.target.value)) })}
              style={{ width: 100 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Backup */}
      <motion.div variants={item} className="glass" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <p className="label" style={{ marginBottom: 12, color: "var(--z-emerald)" }}>Backup Reminder</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => update({ backupReminder: !settings.backupReminder })}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: settings.backupReminder ? "linear-gradient(135deg, var(--z-violet), var(--z-cyan))" : "rgba(255,255,255,0.1)",
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "background 200ms ease",
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: 3,
              left: settings.backupReminder ? 23 : 3,
              transition: "left 200ms ease",
            }} />
          </button>
          <span style={{ fontSize: "0.875rem", color: "var(--z-text-sub)" }}>
            Weekly reminder to export your data backup
          </span>
        </div>
        {settings.lastBackup && (
          <p style={{ fontSize: "0.75rem", color: "var(--z-text-muted)", marginTop: 8 }}>
            Last backup: {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(settings.lastBackup))}
          </p>
        )}
      </motion.div>

      {/* Keyboard shortcuts */}
      <motion.div variants={item} className="glass" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <p className="label" style={{ marginBottom: 12, color: "var(--z-amber)" }}>Keyboard Shortcuts</p>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {[
            ["1-9", "Navigate sidebar views"],
            ["Space", "Pause/resume (Focus Mode)"],
            ["Esc", "Exit Focus Mode"],
          ].map(([keys, desc]) => (
            <div key={keys} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem" }}>
              <kbd style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.08)", border: "1px solid var(--z-border)", fontSize: "0.75rem", fontFamily: "var(--font-jetbrains)", color: "var(--z-text)" }}>{keys}</kbd>
              <span style={{ color: "var(--z-text-sub)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* About */}
      <motion.div variants={item} className="glass" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <p className="label" style={{ marginBottom: 12 }}>About</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--z-violet), var(--z-cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.125rem", color: "#fff" }}>
            Z
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Zenith</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--z-text-muted)" }}>v1.0.0 · Ascend Your Potential</p>
          </div>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--z-text-sub)", lineHeight: 1.6 }}>
          AI-powered productivity operating system. Built with Next.js, React, Framer Motion, and Tailwind CSS.
          All data stored locally in your browser.
        </p>
      </motion.div>

      {/* Save button */}
      <button className="btn btn-primary" onClick={handleSave} style={{ width: "100%", height: 48, fontSize: "1rem" }}>
        <Icon name={saved ? "check" : "sparkles"} size={18} />
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </motion.div>
  );
}
