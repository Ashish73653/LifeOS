# Zenith — Ascend Your Potential

> AI-powered productivity operating system. Plan, track habits, set goals, journal your mood, and focus — all in one beautiful command center.

## Features

### ✅ Task Planner
- Full task CRUD with drag-and-drop reordering
- Energy-level tags (low / medium / high)
- Due date tracking with overdue indicators
- Filter by: All, Active, Completed, Today, Overdue
- Inline editing on double-click

### ⚡ Habit Tracker
- Daily/weekly habits with category badges
- 7-day interactive heatmap grid
- Streak engine with milestone celebrations (🔥 7 · ⭐ 21 · 💎 66 days)
- Confetti animation on completion

### 🎯 Goal Tracker
- Goals with milestones and derived progress
- Circular progress rings + progress bars
- Status lanes: Active / Paused / Completed
- Target date countdown

### 😊 Mood Journal
- Quick emoji-based mood logging (5-point scale)
- Optional journal note
- 7-day SVG trend chart
- Mood distribution visualization

### 🧠 Brain Dump
- Free-form text area for raw thoughts
- Smart task extraction from natural language
- Accept / edit / discard individual suggestions
- One-click "Add to Planner" integration

### 🎯 Focus Mode
- Full-screen immersive Pomodoro timer
- Configurable work/break durations
- Circular progress animation
- Keyboard shortcuts (Space: pause/resume, Esc: exit)
- Session tracking with daily totals

### 🌙 Wind Down
- End-of-day review flow (3 steps)
- Completed vs. unfinished task summary
- Carry-over tasks to tomorrow
- Gratitude journaling (3 things)
- Tomorrow's top 3 priorities

### 💾 Data & Backup
- Export all data as JSON backup file
- Import from backup to restore
- Data overview dashboard
- Clear all data (with confirmation)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + Custom CSS Design System |
| Animations | Framer Motion |
| Fonts | Inter + JetBrains Mono (via next/font) |
| Storage | localStorage (persistent, instant) |
| API | Express + Zod validation |
| Schema | Prisma ORM (PostgreSQL-ready) |
| Monorepo | npm workspaces |

## Getting Started

```bash
# Install dependencies
npm install

# Start the frontend
npm run dev:web

# (Optional) Start the API for AI briefing
npm run dev:api
```

Open [http://localhost:3000](http://localhost:3000) to use Zenith.

## Vercel Deployment

Set these environment variables in Vercel for the web app:

- `NEXT_PUBLIC_API_URL` = your deployed API URL (for example `https://your-api.onrender.com`)
- `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` = your deployed web URL (for example `https://your-lifeos.vercel.app`)

Spotify setup for production:

1. In Spotify Developer Dashboard, add your deployed URL to Redirect URIs (must match exactly).
2. Enable `Web API` in API/SDK selection.
3. Save settings and reconnect Spotify from Integrations page.

Local development defaults:

- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000`

## Project Structure

```
apps/
  web/          → Next.js frontend (Zenith UI)
    src/app/
      components/   → All feature modules
      lib/          → Types, storage, utilities
  api/          → Express API (AI briefing endpoint)

packages/
  ui/           → Shared UI components (future)
  utils/        → Shared utilities (future)
  types/        → Shared type definitions (future)

prisma/
  schema.prisma → Database schema (PostgreSQL-ready)
```

## Data Persistence

All data is stored in your browser's **localStorage** — it persists across page refreshes, browser restarts, and reboots. Use the **Data & Backup** section to export/import JSON backups.

The Prisma schema is ready for future migration to PostgreSQL when you need multi-device sync or cloud storage.

## Design

- Deep space-dark theme with violet/cyan/emerald gradient accents
- Glassmorphism cards with backdrop blur
- Framer Motion micro-animations throughout
- Responsive design: mobile, tablet, desktop
- Custom scrollbar, selection colors, focus states

## License

ISC
