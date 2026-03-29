# LifeOS SaaS - Phase-by-Phase Implementation Plan

This file provides the exact implementation sequence for building LifeOS SaaS from zero to production.

## Delivery Model

- Monorepo with apps and shared packages
- CI/CD from first week
- Vertical slices by feature
- Each phase ends with demo + QA sign-off

## Phase 1 - Foundation (Week 1-2)

### Objectives

- Establish SaaS architecture
- Ship authenticated shell app
- Prepare production-grade developer workflow

### Build Tasks

1. Monorepo and toolchain

- Initialize workspace structure:
  - apps/web (Next.js + TypeScript)
  - apps/api (NestJS or Express + TypeScript)
  - packages/ui, packages/utils, packages/types
- Configure ESLint, Prettier, strict TypeScript, path aliases
- Setup Husky + lint-staged for pre-commit quality gates

2. Frontend baseline

- Implement App Router structure
- Build dashboard shell (sidebar, topbar, responsive containers)
- Add Gemini topbar action icon that opens on-demand token input
- Add theming tokens and typography scale
- Add loading skeleton system and empty state components

3. Backend baseline

- Setup API service with health route and versioned API prefix
- Configure environment validation (zod or class-validator)
- Add logging and error middleware

4. Database and ORM

- Setup PostgreSQL
- Setup Prisma schema and first migration
- Core tables:
  - User
  - Session
  - Workspace (optional for team-ready architecture)

5. Authentication

- Implement auth provider (NextAuth, Clerk, or Auth0)
- Secure session handling and route protection
- Add signup, login, logout, and password reset flow

6. CI/CD and deployment

- Configure pipeline: install, lint, typecheck, test, build
- Deploy web and API preview environments
- Set baseline monitoring and error reporting

### Exit Criteria

- User can sign up, log in, and access dashboard shell
- CI pipeline is green
- API and DB deployed in non-local environment

## Phase 2 - Core Product (Week 3-5)

### Objectives

- Deliver MVP productivity modules
- Ensure smooth UX and persistent user data

### Build Tasks

1. Data model expansion

- Add entities:
  - Task
  - Habit
  - HabitCompletion
  - Goal
  - GoalMilestone
  - MoodEntry
  - EnergyEntry
- Add indexes for user_id + date queries

2. Planner module

- Build drag-and-drop planner UI
- Implement time block logic by energy level
- Add task CRUD, completion state, and filtering
- Add optimistic updates and rollback on API failure

3. Habit tracker

- Habit CRUD with daily/weekly frequency
- Streak engine (7/21/66 milestone states)
- Weekly heatmap grid
- Completion celebration animation

4. Goal tracker

- Goal CRUD and status lanes (active/paused/completed)
- Milestone support and derived progress
- Animated progress bars

5. Mood journal

- Fast mood logging (emoji scale + note)
- Weekly trend chart component
- Mood-energy correlation baseline query

6. AI daily briefing

- Backend Claude proxy endpoint
- Briefing generator service and prompt templates
- Daily cache by user + date
- Token entry via Gemini icon in topbar (user provides token only when needed)
- Keep user-provided token in-memory only (no localStorage/sessionStorage/database persistence)

### Exit Criteria

- Authenticated users can fully use planner, habits, goals, mood, briefing
- Data persists in database (no client-only persistence)
- Core flows pass QA and smoke tests

## Phase 3 - AI and Integrations (Week 6-7)

### Objectives

- Add intelligence and external productivity ecosystem

### Build Tasks

1. Brain dump to tasks

- Capture free-form input
- Parse into structured tasks via Claude
- Accept/edit/discard suggested tasks

2. Notion integration

- OAuth or token connection flow
- Search endpoint and page read rendering
- Respect read-only behavior

3. Google Calendar integration

- OAuth connection and token refresh
- Fetch daily events and overlay planner blocks
- Handle timezone normalization

4. Spotify integration

- OAuth flow and token lifecycle handling
- Mini player controls and playlist mapping by task type

5. Integration reliability

- Add retry + backoff policies
- Add integration status panel and reconnect UX

### Exit Criteria

- All integrations connect and sync for test accounts
- Brain dump generation is stable and actionable
- No secrets exposed to frontend

## Phase 4 - Power Features (Week 8-9)

### Objectives

- Deliver premium differentiated experience

### Build Tasks

1. Flow mode

- Full-screen focus UI
- Pomodoro engine with session tracking
- Keyboard shortcuts and interruption-safe controls

2. Wind-down mode

- End-of-day review flow
- Carry-over logic for unfinished tasks
- Next-day prep generation

3. Weekly life score

- Score engine across habits, focus, mood, goals, energy
- Radar visualization and historical trend cards

4. Motivation engine

- Personalized reminders and streak nudges
- Weekly win recap generation

### Exit Criteria

- End-to-end daily lifecycle works: morning to wind-down
- Premium features are stable and measurable

## Phase 5 - Performance and Polish (Week 10)

### Objectives

- Make UI feel elite, reliable, and launch-ready

### Build Tasks

1. Performance optimization

- Profile and eliminate render bottlenecks
- Add memoization and state slice optimization
- Virtualize heavy lists and defer non-critical UI

2. Motion and interaction polish

- Finalize Framer Motion transitions
- Ensure no layout shift and consistent easing/timing
- Improve tactile feedback on all primary interactions

3. Accessibility and quality

- Keyboard navigation coverage
- Focus states and semantic landmarks
- Contrast checks and screen-reader pass

4. Testing hardening

- Expand unit, integration, and E2E suites
- Add load and reliability test scenarios

5. Release readiness

- Production observability dashboards
- Error budgets and alert thresholds
- Final release checklist and rollback strategy

### Exit Criteria

- Lighthouse and performance targets met
- Accessibility baseline satisfied
- Production release approved

## Definition of Done (All Phases)

- Feature complete against acceptance criteria
- Unit and integration tests for critical logic
- No high-severity security issues
- Documentation updated (README + architecture notes)
- Demo recorded and stakeholder sign-off complete

## Recommended Team Split

- Frontend Lead: UX architecture and interaction performance
- Backend Lead: API, auth, integrations, reliability
- Full-stack Engineer: feature vertical slices
- QA Engineer: automation and release confidence
- Product/Design: prioritization and UX quality gate

## Immediate Next Action

Start with Phase 1 repository setup and auth shell, then open a Phase 2 branch for core productivity modules once CI and deployment are stable.
