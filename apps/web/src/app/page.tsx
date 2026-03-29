"use client";

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import { ViewType } from "./lib/types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TaskPlanner from "./components/TaskPlanner";
import HabitTracker from "./components/HabitTracker";
import GoalTracker from "./components/GoalTracker";
import MoodJournal from "./components/MoodJournal";
import BrainDump from "./components/BrainDump";
import FocusMode from "./components/FocusMode";
import WindDown from "./components/WindDown";
import DataManager from "./components/DataManager";
import WeeklyScore from "./components/WeeklyScore";
import Settings from "./components/Settings";
import ToastContainer from "./components/Toast";
import Topbar from "./components/Topbar";
import Integrations from "./components/Integrations";
import SpotifyPlayer from "./components/SpotifyPlayer";
import { ApiKeyProvider, useApiKey } from "./lib/ApiKeyContext";

const VIEW_KEYS: ViewType[] = [
  "dashboard", "tasks", "habits", "goals", "mood",
  "braindump", "score", "focus", "winddown", "integrations",
];

interface AppContentProps {
  activeView: ViewType;
  setActiveView: Dispatch<SetStateAction<ViewType>>;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
  focusFullscreen: boolean;
  setFocusFullscreen: Dispatch<SetStateAction<boolean>>;
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focusFullscreen, setFocusFullscreen] = useState(false);

  return (
    <ApiKeyProvider>
      <AppContent 
        activeView={activeView} 
        setActiveView={setActiveView} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen}
        focusFullscreen={focusFullscreen}
        setFocusFullscreen={setFocusFullscreen}
      />
    </ApiKeyProvider>
  );
}

function AppContent({ activeView, setActiveView, sidebarOpen, setSidebarOpen, mobileOpen, setMobileOpen, focusFullscreen, setFocusFullscreen }: AppContentProps) {
  const { setSpotifyToken } = useApiKey();

  useEffect(() => {
    // Catch Spotify OAuth Token from URL hash
    if (window.location.hash.includes("access_token")) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get("access_token");
      if (token) {
        setSpotifyToken(token);
        // Clean URL without reloading page
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [setSpotifyToken]);

  // Global keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (focusFullscreen) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

    const num = parseInt(e.key);
    if (num >= 1 && num <= VIEW_KEYS.length) {
      e.preventDefault();
      setActiveView(VIEW_KEYS[num - 1]);
    }
  }, [focusFullscreen, setActiveView]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (focusFullscreen) {
    return (
      <>
        <FocusMode onExit={() => setFocusFullscreen(false)} />
        <ToastContainer />
      </>
    );
  }

  function renderView() {
    switch (activeView) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveView} onStartFocus={() => setFocusFullscreen(true)} />;
      case "tasks":
        return <TaskPlanner />;
      case "habits":
        return <HabitTracker />;
      case "goals":
        return <GoalTracker />;
      case "mood":
        return <MoodJournal />;
      case "braindump":
        return <BrainDump />;
      case "focus":
        return <FocusMode onExit={() => setActiveView("dashboard")} />;
      case "winddown":
        return <WindDown />;
      case "data":
        return <DataManager />;
      case "score":
        return <WeeklyScore />;
      case "integrations":
        return <Integrations />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActiveView} onStartFocus={() => setFocusFullscreen(true)} />;
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="main-content">
        <Topbar onOpenMobileMenu={() => setMobileOpen(true)} />
        {renderView()}
      </main>

      <ToastContainer />
      <SpotifyPlayer />
    </div>
  );
}
