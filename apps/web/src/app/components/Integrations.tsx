"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { save, load } from "../lib/storage";
import { toast } from "../lib/toast";
import Icon from "./Icon";
import { useApiKey } from "../lib/ApiKeyContext";

interface IntegrationState {
  notion: boolean;
  gcal: boolean;
  spotify: boolean;
}

const DEFAULTS: IntegrationState = {
  notion: false,
  gcal: false,
  spotify: false,
};

const KEY = "zenith-integrations";
const SPOTIFY_SCOPES = "user-read-currently-playing user-read-playback-state";

function getSpotifyRedirectUri(): string {
  const envRedirect = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI?.trim();
  if (envRedirect) return envRedirect;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export default function Integrations() {
  const { setNotionKey } = useApiKey();
  const [integrations, setIntegrations] = useState<IntegrationState>(() => load<IntegrationState>(KEY, DEFAULTS));
  const [loading, setLoading] = useState<keyof IntegrationState | null>(null);

  function persist(state: IntegrationState) {
    setIntegrations(state);
    save(KEY, state);
    window.dispatchEvent(new Event("integrations"));
  }

  function handleConnect(service: keyof IntegrationState, name: string) {
    if (service === "notion") {
      const token = prompt("Enter your Notion Internal Integration Token (begins with ntn_ or secret_):");
      if (!token || token.trim().length === 0) {
        toast("Connection cancelled", "info");
        return;
      }
      setNotionKey(token.trim());
      setLoading(service);
      setTimeout(() => {
        persist({ ...integrations, [service]: true });
        setLoading(null);
        toast(`Successfully connected to ${name} ✅`, "success");
      }, 500);
      return;
    }

    if (service === "spotify") {
      const clientId = prompt("Enter your Spotify Developer Client ID:");
      if (!clientId || clientId.trim().length === 0) {
        toast("Connection cancelled", "info");
        return;
      }

      const redirectUri = getSpotifyRedirectUri();
      if (!redirectUri) {
        toast("Missing redirect URI. Set NEXT_PUBLIC_SPOTIFY_REDIRECT_URI.", "error");
        return;
      }
      
      // Temporarily save the intent so when they return it shows Connected
      persist({ ...integrations, spotify: true });
      
      window.location.assign(
        `https://accounts.spotify.com/authorize?client_id=${encodeURIComponent(clientId.trim())}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}`,
      );
      return;
    }

    setLoading(service);
    // Simulate OAuth flow for anything else (Gcal)
    setTimeout(() => {
      persist({ ...integrations, [service]: true });
      setLoading(null);
      toast(`Successfully connected to ${name} ✅`, "success");
    }, 1500);
  }

  function handleDisconnect(service: keyof IntegrationState, name: string) {
    persist({ ...integrations, [service]: false });
    if (service === "notion") setNotionKey("");
    toast(`Disconnected from ${name}`, "info");
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  const SERVICES: { id: keyof IntegrationState; name: string; desc: string; icon: string; color: string }[] = [
    {
      id: "notion",
      name: "Notion",
      desc: "Search pages and create brain dump notes directly into your Notion workspace.",
      icon: "dashboard",
      color: "var(--z-text)",
    },
    {
      id: "gcal",
      name: "Google Calendar",
      desc: "Sync your daily events and overlay them onto your task planner timeline automatically.",
      icon: "calendar",
      color: "var(--z-cyan)",
    },
    {
      id: "spotify",
      name: "Spotify",
      desc: "Control your focus playlists and automate music based on currently active tasks.",
      icon: "play",
      color: "var(--z-emerald)",
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon name="refresh" size={24} className="gradient-text" />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Integrations</h1>
      </div>
      <p style={{ color: "var(--z-text-sub)", fontSize: "0.9375rem", marginBottom: "2rem" }}>
        Connect your favorite tools to power up your workflows and AI suggestions.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {SERVICES.map((srv) => {
          const isConnected = integrations[srv.id];
          const isLoading = loading === srv.id;

          return (
            <motion.div key={srv.id} variants={item} className="glass glass-hover" style={{ padding: "1.5rem", display: "flex", alignItems: "flex-start", gap: "1.5rem", flexDirection: "row", flexWrap: "wrap" }}>
              <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--z-border)" }}>
                <Icon name={srv.icon} size={24} style={{ color: srv.color }} />
              </div>
              
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>{srv.name}</h3>
                  {isConnected && (
                    <span className="badge badge-emerald" style={{ gap: 4, padding: "0.2rem 0.5rem" }}>
                      <Icon name="check" size={10} /> Connected
                    </span>
                  )}
                </div>
                <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>
                  {srv.desc}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", height: 48 }}>
                {isConnected ? (
                  <button className="btn btn-ghost" onClick={() => handleDisconnect(srv.id, srv.name)}>
                    Disconnect
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={() => handleConnect(srv.id, srv.name)} disabled={isLoading}>
                    {isLoading ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
