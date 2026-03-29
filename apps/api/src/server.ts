import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown server error";
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "lifeos-api", timestamp: new Date().toISOString() });
});

const briefingInputSchema = z.object({
  energy: z.enum(["low", "medium", "high"]),
  pendingTasks: z.array(z.string()).max(20).default([]),
  pendingHabits: z.array(z.string()).max(20).default([]),
  activeGoals: z.array(z.string()).max(20).default([]),
  userApiKey: z.string().min(10).optional()
});

app.post("/api/ai/briefing", (req, res) => {
  const parsed = briefingInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
  }

  const { energy, pendingTasks, pendingHabits, activeGoals, userApiKey } = parsed.data;
  const priorities = [
    pendingTasks[0] || "Complete one high-impact task early",
    pendingHabits[0] || "Protect at least one habit streak",
    activeGoals[0] || "Move one active goal forward"
  ];

  // We intentionally do not persist or log userApiKey.
  const hasUserKey = Boolean(userApiKey && userApiKey.trim());

  return res.json({
    ok: true,
    data: {
      briefing: `Your energy is ${energy} today. Keep momentum by finishing priority work first, then close loops before evening. Stay intentional with your schedule and avoid context switching.`,
      priorities,
      motivation: hasUserKey
        ? "Your personal API key was provided for this request only and was not stored."
        : "No user key provided. You can still use local fallback generation securely."
    }
  });
});

app.post("/api/integrations/notion/search", async (req, res) => {
  const { query, notionKey } = req.body;
  if (!notionKey) return res.status(401).json({ ok: false, error: "Missing Notion integration key" });

  try {
    const r = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        query: query || "",
        sort: { direction: "descending", timestamp: "last_edited_time" },
        page_size: 10,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ ok: false, error: data });
    }

    return res.json({ ok: true, data });
  } catch (err: unknown) {
    return res.status(500).json({ ok: false, error: getErrorMessage(err) });
  }
});

app.get("/api/integrations/spotify/now-playing", async (req, res) => {
  const authHeader = req.header("authorization") || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ ok: false, error: "Missing Spotify access token" });
  }

  try {
    const r = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (r.status === 204) {
      return res.json({ ok: true, data: null, isPlaying: false });
    }

    const payload = (await r.json()) as {
      is_playing?: boolean;
      progress_ms?: number;
      item?: {
        id?: string;
        name?: string;
        duration_ms?: number;
        external_urls?: { spotify?: string };
        album?: { images?: Array<{ url?: string }> };
        artists?: Array<{ name?: string }>;
      };
      error?: { message?: string };
    };

    if (!r.ok) {
      return res.status(r.status).json({ ok: false, error: payload.error?.message || "Spotify API request failed" });
    }

    const track = payload.item;
    if (!track?.id) {
      return res.json({ ok: true, data: null, isPlaying: Boolean(payload.is_playing) });
    }

    return res.json({
      ok: true,
      isPlaying: Boolean(payload.is_playing),
      data: {
        id: track.id,
        name: track.name || "Unknown track",
        artists: (track.artists || []).map((a) => a.name || "Unknown artist"),
        albumImage: track.album?.images?.[0]?.url || null,
        externalUrl: track.external_urls?.spotify || null,
        durationMs: track.duration_ms || 0,
        progressMs: payload.progress_ms || 0,
      },
    });
  } catch (err: unknown) {
    return res.status(500).json({ ok: false, error: getErrorMessage(err) });
  }
});

app.listen(port, () => {
  console.log(`[lifeos-api] listening on http://localhost:${port}`);
});
