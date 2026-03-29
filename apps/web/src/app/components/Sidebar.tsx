"use client";

import { ViewType } from "../lib/types";
import Icon from "./Icon";

const NAV: { id: ViewType; label: string; icon: string; divider?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
  { id: "habits", label: "Habits", icon: "habits" },
  { id: "goals", label: "Goals", icon: "goals" },
  { id: "mood", label: "Mood Journal", icon: "mood" },
  { id: "braindump", label: "Brain Dump", icon: "brain" },
  { id: "score", label: "Life Score", icon: "star", divider: true },
  { id: "focus", label: "Focus Mode", icon: "focus" },
  { id: "winddown", label: "Wind Down", icon: "moon" },
  { id: "data", label: "Data & Backup", icon: "download", divider: true },
  { id: "integrations", label: "Integrations", icon: "refresh" },
  { id: "settings", label: "Settings", icon: "settings" },
];

interface Props {
  activeView: ViewType;
  onNavigate: (v: ViewType) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  activeView,
  onNavigate,
  isOpen,
  onToggle,
  isMobileOpen,
  onMobileClose,
}: Props) {
  const collapsed = !isOpen;

  function handleNav(v: ViewType) {
    onNavigate(v);
    onMobileClose();
  }

  return (
    <>
      {isMobileOpen && (
        <div className="mobile-overlay" onClick={onMobileClose} />
      )}

      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.25rem 0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--z-violet), var(--z-cyan))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "1rem",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            Z
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <h1
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                Zenith
              </h1>
              <p
                style={{
                  fontSize: "0.625rem",
                  color: "var(--z-text-muted)",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Ascend Your Potential
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV.map((item) => (
            <div key={item.id}>
              {item.divider && <hr className="divider" style={{ margin: "0.5rem 0" }} />}
              <button
                className={`nav-item ${activeView === item.id ? "active" : ""}`}
                onClick={() => handleNav(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">
                  <Icon name={item.icon} size={20} />
                </span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          className="nav-item"
          onClick={onToggle}
          style={{ marginTop: "auto" }}
        >
          <span className="nav-icon">
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={20} />
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
    </>
  );
}
