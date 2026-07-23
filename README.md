# Trivia Tracker

A mobile-first web app for groups of friends to log trivia questions and fun facts they hear, and track the venues where they go to trivia nights on an interactive world map.

---

## Concept

At a quiz night, your team hears a great fact you want to remember. Trivia Tracker lets you capture it on your phone in seconds — question, answer (blurred until tapped), category, and the venue you heard it at. Over time your group builds a personal trivia feed and a map of every pub, bar, and café you've competed in.

---

## Tech Stack

| Layer               | Choice                                              |
| ------------------- | --------------------------------------------------- |
| Framework           | Next.js (App Router) + TypeScript                   |
| Styling             | Tailwind CSS                                        |
| Backend / DB / Auth | Supabase (Postgres + PostGIS + Auth + RLS)          |
| Map                 | MapLibre GL JS via `react-map-gl`, globe projection |
| Hosting             | Vercel                                              |
| PWA                 | Installable, offline-capable via service worker     |

---

## Product Decisions

- **Standalone entries allowed** — a fact can be logged without a venue; `entries.venue_id` is nullable.
- **Multi-group membership** — a user can belong to more than one group.
- **Invite-only groups** — groups are joined via a shareable invite code; they are not publicly discoverable.
- **Mobile-first** — designed for logging on a phone at a bar; desktop layout is a secondary concern.
- **Auth** — Supabase email/password authentication.

---

## Data Model

> Enable the PostGIS extension in Supabase before running migrations.

### `groups`

| Column        | Type                     | Notes                 |
| ------------- | ------------------------ | --------------------- |
| `id`          | `uuid` PK                |                       |
| `name`        | `text`                   |                       |
| `invite_code` | `text` UNIQUE            | Generated on creation |
| `created_by`  | `uuid` FK → `auth.users` |                       |
| `created_at`  | `timestamptz`            |                       |

### `memberships`

| Column      | Type                     | Notes               |
| ----------- | ------------------------ | ------------------- |
| `group_id`  | `uuid` FK → `groups`     |                     |
| `user_id`   | `uuid` FK → `auth.users` |                     |
| `role`      | `text`                   | `owner` or `member` |
| `joined_at` | `timestamptz`            |                     |

All RLS policies key off this table.

### `venues`

| Column       | Type                     | Notes    |
| ------------ | ------------------------ | -------- |
| `id`         | `uuid` PK                |          |
| `group_id`   | `uuid` FK → `groups`     |          |
| `name`       | `text`                   |          |
| `location`   | `geography(Point, 4326)` | PostGIS  |
| `address`    | `text`                   | Optional |
| `created_at` | `timestamptz`            |          |

### `entries`

| Column       | Type                     | Notes                             |
| ------------ | ------------------------ | --------------------------------- |
| `id`         | `uuid` PK                |                                   |
| `group_id`   | `uuid` FK → `groups`     |                                   |
| `author_id`  | `uuid` FK → `auth.users` |                                   |
| `question`   | `text`                   |                                   |
| `answer`     | `text`                   | Blurred in UI until tapped        |
| `category`   | `text`                   | Optional tag                      |
| `source`     | `text`                   | e.g. "Tuesday quiz at The Anchor" |
| `heard_on`   | `date`                   |                                   |
| `venue_id`   | `uuid` FK → `venues`     | Nullable                          |
| `created_at` | `timestamptz`            |                                   |

---

## Row-Level Security

All tables enforce RLS. Write and test policies before touching the frontend — retrofitting RLS is painful.

**Read policy (all tables):** `auth.uid()` has a row in `memberships` for the relevant `group_id`.

**Write/update/delete:** Same membership check. Destructive group actions (rename, delete) are restricted to `role = 'owner'`.

**`groups` insert:** Any authenticated user can create a group; a trigger (or transaction) simultaneously inserts an `owner` membership row.

**Join flow:** Looking up a group by `invite_code` and inserting a membership row must be permitted for authenticated users who are not yet members. The invite code is the sole credential for joining.

---

## Map Notes

- `react-map-gl` with the MapLibre GL JS binding; globe projection enabled (flattens on zoom).
- Venue coordinates stored as PostGIS `geography`; use `ST_` functions for distance queries.
- Markers cluster at low zoom levels.
- Tapping a marker opens a venue detail sheet: linked entries and an "Add entry" shortcut.
- `react-globe.gl` (three.js) is noted as a potential stylized landing-page globe — not the working map.

---

## Build Order

### Phase 1 — Project + Auth

- Scaffold Next.js app with Tailwind, TypeScript, and App Router.
- Configure Supabase client (`@supabase/ssr`).
- Implement Supabase email/password auth with protected routes and session middleware.
- Deploy skeleton to Vercel; confirm CI/CD pipeline.

### Phase 2 — Groups + Membership (do RLS here)

- `groups` and `memberships` schema + migrations.
- Create group flow (owner gets membership via DB trigger).
- Invite code generation and join-by-code flow.
- Write all RLS policies; test with multiple users before proceeding.

### Phase 3 — Entries (Trivia Feed)

- `entries` schema + migrations.
- Add/edit entry form (mobile-optimized).
- Feed view: list entries for the active group, filterable by category.
- Tap-to-reveal answer (blur + toggle).
- Search across question and answer text.

### Phase 4 — Venues + Map

- Enable PostGIS extension in Supabase.
- `venues` schema + migrations.
- Venue CRUD (create, edit, list).
- Integrate MapLibre GL JS via `react-map-gl`; enable globe projection.
- Render venue markers; implement clustering.
- Venue detail sheet on marker tap (linked entries, add entry shortcut).

### Phase 5 — PWA Polish

- `manifest.json` with app name, icons, theme color.
- Service worker (via `next-pwa` or manual Workbox) for offline shell.
- Install prompt handling.
- Full mobile layout pass: tap targets, safe areas, keyboard behavior.

---

## Post-MVP Backlog

- **Leaderboard** — per-group stats: facts contributed per member.
- **Quiz Night bundling** — link a date + venue + the entries logged that night into a single event.
- **Shareable recap card** — "Team Quokka: 8 venues, 210 facts" — shareable image for social/growth loop.
- **Difficulty ratings** — mark entries easy / medium / hard.
- **Recurring night reminders** — push notifications for scheduled trivia nights.

---

## Logo

Two quokkas as a trivia team. Generate as raster art (Midjourney / DALL·E / Ideogram / Imagen), keep it legible at favicon size, then vectorize in Figma or Illustrator Image Trace if a scalable version is needed.

---

## Local Development Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd trivia-tracker

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project settings

# 4. Run the dev server
npm run dev
```

> A `.env.example` file will be added during Phase 1 scaffolding.

---

## Environment Variables

| Variable                        | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key                                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key (server-only, never exposed to client) |
