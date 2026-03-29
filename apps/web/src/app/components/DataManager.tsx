"use client";

import { useState, useRef } from "react";
import { exportAll, importAll, KEYS } from "../lib/storage";
import Icon from "./Icon";

export default function DataManager() {
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const json = exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zenith-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsgType("success");
    setMessage("Backup downloaded successfully!");
    setTimeout(() => setMessage(""), 3000);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importAll(reader.result as string);
      if (ok) {
        setMsgType("success");
        setMessage("Data restored successfully! Refresh to see changes.");
      } else {
        setMsgType("error");
        setMessage("Invalid backup file. Please use a valid Zenith export.");
      }
      setTimeout(() => setMessage(""), 4000);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClear() {
    if (!confirm("⚠️ This will permanently delete ALL your data. Are you sure?")) return;
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    setMsgType("success");
    setMessage("All data cleared. Refresh to start fresh.");
    setTimeout(() => setMessage(""), 3000);
  }

  const storageKeys = Object.entries(KEYS);
  const counts: Record<string, number> = {};
  storageKeys.forEach(([name, key]) => {
    try {
      const raw = localStorage.getItem(key);
      counts[name] = raw ? JSON.parse(raw).length || 0 : 0;
    } catch {
      counts[name] = 0;
    }
  });

  return (
    <div className="anim-fade" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Data & Backup</h1>
      <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Export, import, and manage your Zenith data. All data is stored locally in your browser.
      </p>

      {message && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "var(--z-radius-sm)",
            marginBottom: "1rem",
            fontSize: "0.875rem",
            background: msgType === "success" ? "rgba(52,211,153,0.1)" : "rgba(251,113,133,0.1)",
            border: `1px solid ${msgType === "success" ? "rgba(52,211,153,0.2)" : "rgba(251,113,133,0.2)"}`,
            color: msgType === "success" ? "var(--z-emerald)" : "var(--z-rose)",
          }}
        >
          {message}
        </div>
      )}

      {/* Data overview */}
      <div className="glass" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <p className="label" style={{ marginBottom: 12 }}>Data Overview</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
          {storageKeys.map(([name]) => (
            <div key={name} style={{ padding: "0.75rem", borderRadius: "var(--z-radius-sm)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--z-border)" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{counts[name]}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--z-text-muted)", textTransform: "capitalize" }}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="glass" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: 2 }}>Export Backup</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--z-text-muted)" }}>Download a JSON file with all your data</p>
          </div>
          <button className="btn btn-primary" onClick={handleExport}>
            <Icon name="download" size={16} /> Export
          </button>
        </div>

        <div className="glass" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: 2 }}>Import Backup</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--z-text-muted)" }}>Restore from a previously exported file</p>
          </div>
          <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
            <Icon name="upload" size={16} /> Import
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          </label>
        </div>

        <div className="glass" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: 2, color: "var(--z-rose)" }}>Clear All Data</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--z-text-muted)" }}>Permanently delete everything. Cannot be undone.</p>
          </div>
          <button className="btn btn-danger" onClick={handleClear}>
            <Icon name="trash" size={16} /> Clear
          </button>
        </div>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--z-text-muted)" }}>
          💡 Tip: Export a backup regularly to keep your data safe. We recommend weekly backups.
        </p>
      </div>
    </div>
  );
}
