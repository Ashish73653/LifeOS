"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { load } from "../lib/storage";
import { useApiKey } from "../lib/ApiKeyContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface IntegrationsState {
  spotify?: boolean;
}

interface NowPlayingTrack {
  id: string;
  name: string;
  artists: string[];
  albumImage: string | null;
  externalUrl: string | null;
  durationMs: number;
  progressMs: number;
}

interface NowPlayingResponse {
  ok: boolean;
  isPlaying?: boolean;
  data: NowPlayingTrack | null;
  error?: string;
}

export default function SpotifyPlayer() {
  const { spotifyToken } = useApiKey();
  const [hasSpotify, setHasSpotify] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [track, setTrack] = useState<NowPlayingTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We poll localStorage or just load it on mount because it's mocked
    const check = () => {
      const ig = load<IntegrationsState>("zenith-integrations", {});
      setHasSpotify(ig.spotify ?? false);
    };
    check();
    window.addEventListener("focus", check);
    window.addEventListener("integrations", check);
    return () => {
      window.removeEventListener("focus", check);
      window.removeEventListener("integrations", check);
    };
  }, []);

  useEffect(() => {
    if (!hasSpotify || !spotifyToken) {
      setTrack(null);
      setIsPlaying(false);
      return;
    }

    let active = true;

    const fetchNowPlaying = async () => {
      setLoading(true);
      setError(null);

      try {
        const r = await fetch(`${API}/api/integrations/spotify/now-playing`, {
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
          },
        });
        const data = (await r.json()) as NowPlayingResponse;

        if (!active) return;

        if (!r.ok || !data.ok) {
          setError(data.error || "Unable to fetch current track");
          setTrack(null);
          setIsPlaying(false);
          return;
        }

        setTrack(data.data);
        setIsPlaying(Boolean(data.isPlaying));
      } catch {
        if (!active) return;
        setError("Unable to reach Spotify now playing service");
        setTrack(null);
        setIsPlaying(false);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNowPlaying();
    const timer = setInterval(fetchNowPlaying, 10000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [hasSpotify, spotifyToken]);

  if (!hasSpotify) return null;

  const embedSrc = track?.id
    ? `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`
    : "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 150, opacity: 0 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="glass"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          padding: 0,
          borderRadius: "16px",
          width: 320,
          minHeight: 128,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 100,
          boxShadow: isHovered 
            ? "0 12px 40px rgba(29, 185, 84, 0.25)" 
            : "0 8px 32px rgba(0, 0, 0, 0.4)",
          transition: "box-shadow 0.3s ease, transform 0.2s ease",
          transform: isHovered ? "translateY(-4px)" : "translateY(0)"
        }}
      >
        <div style={{ width: "100%", padding: "0.75rem 0.85rem", borderBottom: "1px solid var(--z-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--z-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Spotify Now Playing
            </span>
            <span className={`badge ${isPlaying ? "badge-emerald" : "badge-amber"}`} style={{ fontSize: "0.65rem" }}>
              {isPlaying ? "Live" : "Idle"}
            </span>
          </div>

          {!spotifyToken && (
            <p style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--z-text-sub)" }}>
              Connect Spotify once to read your current song.
            </p>
          )}

          {spotifyToken && loading && (
            <p style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--z-text-sub)" }}>
              Checking current track...
            </p>
          )}

          {spotifyToken && !loading && error && (
            <p style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--z-rose)" }}>
              {error}
            </p>
          )}

          {spotifyToken && !loading && !error && track && (
            <p style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--z-text-sub)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {track.name} - {track.artists.join(", ")}
            </p>
          )}

          {spotifyToken && !loading && !error && !track && (
            <p style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--z-text-sub)" }}>
              No active playback detected. Start music in Spotify.
            </p>
          )}
        </div>

        <iframe
          style={{ borderRadius: "0 0 16px 16px", background: "transparent" }}
          src={embedSrc}
          width="100%"
          height="80"
          frameBorder="0" 
          allowFullScreen 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy"
        />
      </motion.div>
    </AnimatePresence>
  );
}
