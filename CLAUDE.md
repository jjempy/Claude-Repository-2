# CLAUDE.md — LeanShop RCA

This file documents the codebase structure, conventions, and development workflows for AI assistants working on this repository.

---

## Project Overview

**LeanShop RCA** is a production-ready multi-tenant SaaS platform for manufacturing root cause analysis (RCA). It enables shop-floor teams to log problems quickly, analyze root causes using the 6M Fishbone methodology, assign corrective actions, and track resolution trends over time.

**Core design principle:** Zero learning curve — operators should be productive within 30 seconds.

---

## Repository Structure

```
Claude-Repository-2/
├── backend/                  # Node.js/Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (source of truth)
│   │   └── seed.ts           # Demo data seeder
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts       # JWT verification + role guard
│   │   ├── routes/
│   │   │   ├── auth.ts       # Registration, login, user list
│   │   │   ├── problems.ts   # RCA CRUD (core resource)
│   │   │   ├── actions.ts    # Corrective action CRUD
│   │   │   ├── analytics.ts  # Dashboard data endpoints
│   │   │   ├── facilities.ts # Facility management
│   │   │   ├── machines.ts   # Machine management
│   │   │   └── attachments.ts# File upload/delete
│   │   └── server.ts         # Express app entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js 14 App Router
│   ├── src/
│   │   ├── app/              # Next.js pages (file-based routing)
│   │   │   ├── page.tsx              # / — Dashboard
│   │   │   ├── login/page.tsx        # /login
│   │   │   ├── register/page.tsx     # /register
│   │   │   ├── issues/page.tsx       # /issues — Active issues list
│   │   │   ├── history/page.tsx      # /history — RCA search library
│   │   │   ├── settings/page.tsx     # /settings
│   │   │   ├── problems/
│   │   │   │   ├── new/page.tsx      # /problems/new — 8-step wizard
│   │   │   │   └── [id]/page.tsx     # /problems/:id — Detail view
│   │   │   ├── layout.tsx            # Root layout (wraps AuthProvider)
│   │   │   └── globals.css           # Tailwind base + component classes
│   │   ├── components/
│   │   │   ├── AppShell.tsx          # Sidebar layout, dark mode, auth guard
│   │   │   └── StatusBadge.tsx       # StatusBadge + SeverityBadge
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # JWT auth state (login/logout/register)
│   │   └── lib/
│   │       ├── api.ts                # Centralized fetch client
│   │       └── constants.ts          # Domain data (symptoms, causes, etc.)
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
├── docker-compose.yml        # Full-stack deployment
├── .env.example              # Required environment variables
└── README.md
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Next.js (App Router) | 14.2.3 |
| Frontend UI | React | 18.3.1 |
| Styling | Tailwind CSS | 3.4.3 |
| Charts | Recharts | 2.12.3 |
| Icons | @heroicons/react | 2.1.3 |
| Backend runtime | Node.js + TypeScript | TS 5.4.3 |
| Backend framework | Express | 4.18.3 |
| ORM | Prisma | 5.10.2 |
| Database | PostgreSQL | 15 |
| Auth | jsonwebtoken + bcryptjs | 9.0.2 / 2.4.3 |
| File uploads | multer | 1.4.5-lts.1 |
| Security | Helmet, CORS | 7.1.0 / 2.8.5 |

---

## Development Commands

### Backend

```bash
cd backend
npm install
npm run dev            # ts-node-dev with hot reload
npm run build          # Compile TypeScript → dist/
npm run start          # Run compiled dist/server.js
npm run db:migrate     # Deploy pending Prisma migrations
npm run db:seed        # Seed demo data (users, facilities, machines)
npm run db:generate    # Regenerate Prisma client (runs automatically on postinstall)
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # Next.js dev server (port 3000)
npm run build          # Production build
npm run start          # Serve production build
npm run lint           # ESLint check
```

### Docker (full stack)

```bash
cp .env.example .env
docker compose up -d                           # Start all services
docker compose exec backend npm run db:seed    # Seed demo data
docker compose down                            # Stop services
docker compose down -v                         # Stop + delete volumes
```

---

## Environment Variables

Defined in `.env.example`. The backend reads these at startup; the frontend reads `NEXT_PUBLIC_*` at build time.

| Variable | Service | Default | Notes |
|----------|---------|---------|-------|
| `POSTGRES_PASSWORD` | postgres, backend | `leanshop_secret` | Change in production |
| `JWT_SECRET` | backend | `supersecretjwtkey_change_in_production` | Change in production |
| `NODE_ENV` | backend | `production` | Set to `development` locally |
| `PORT` | backend | `4000` | Internal container port |
| `UPLOAD_DIR` | backend | `./uploads` | Set to `/uploads` in Docker |
| `DATABASE_URL` | backend | — | Auto-constructed in Docker Compose |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:4000` | Must match backend URL |

---

## Database Schema

All models live in `backend/prisma/schema.prisma`. The database is PostgreSQL.

### Enums

```prisma
enum Role         { OPERATOR | ENGINEER | MAINTENANCE | MANAGER }
enum ActionStatus { OPEN | IN_PROGRESS | RESOLVED }
```

### Models

**Organization** — top-level multi-tenant boundary
- `id`, `name`, `slug` (unique), `createdAt`
- All user data, problems, machines, and facilities are scoped to an org

**User**
- `id`, `email` (unique), `password` (hashed), `name`, `role`, `organizationId`
- Two problem relations: `reporter` (problems they logged), `responsible` (assigned corrective actions)

**Facility** — physical location within an org
- `id`, `name`, `organizationId`
- Contains many machines; problems can reference a facility directly

**Machine** — individual piece of equipment
- `id`, `name`, `machineType` (optional), `facilityId`, `organizationId`

**Problem** — the core RCA record
- Human-readable `problemId` (`RCA-0001`, org-scoped sequential counter)
- Context fields: `severity`, `facilityId`, `machineId`, `operatorId`, `materialBatch`, `toolType`, `processType`, `parameters` (JSON)
- Structured arrays: `observedSymptoms[]`, `suspectedCauses[]`
- Root cause: `rootCauseCategory` (6M category name), `rootCause` (specific cause text)
- Resolution: `correctiveAction`, `responsiblePersonId`, `actionStatus`, `dueDate`, `resolutionDate`, `outcome`, `estimatedCostImpact`

**Action** — individual corrective action item linked to a Problem
- `description`, `assignedToId`, `dueDate`, `status`, `completedAt`, `notes`

**Attachment** — uploaded file linked to a Problem
- `filename`, `url` (path under `/uploads/`), `mimeType`, `size`

### Key schema rules
- IDs use `@default(cuid())`
- Deleting a Problem cascades: manually delete `Attachment` + `Action` records first (handled in `problems.ts` DELETE route)
- `resolutionDate` is auto-set in the update route when `actionStatus` transitions to `RESOLVED`

---

## API Reference

Base URL: `http://localhost:4000`

All routes except `/auth/register`, `/auth/login`, and `/health` require `Authorization: Bearer <token>`.

All routes are scoped to the authenticated user's `organizationId` — users cannot access other organizations' data.

### Auth

| Method | Path | Body / Notes |
|--------|------|-------|
| POST | `/auth/register` | `{email, password, name, role?, orgName?, orgSlug?}` — creates org if no orgSlug |
| POST | `/auth/login` | `{email, password}` → `{token, user}` |
| GET | `/auth/me` | Returns current user from token |
| GET | `/auth/users` | Lists all users in same org (for assignment dropdowns) |

JWT tokens expire in **7 days**.

### Problems

| Method | Path | Notes |
|--------|------|-------|
| GET | `/problems` | Query params: `status`, `machineId`, `search`, `dateFrom`, `dateTo`, `rootCauseCategory`, `page`, `limit` (default 20) |
| GET | `/problems/:id` | Full record with nested machine, facility, operator, responsiblePerson, attachments, actions |
| POST | `/problems` | Auto-generates `problemId`. Partial submissions accepted (wizard saves incrementally) |
| PUT | `/problems/:id` | Partial updates. Auto-sets `resolutionDate` on first `RESOLVED` transition |
| DELETE | `/problems/:id` | Cascades to attachments and actions |

### Actions

| Method | Path | Notes |
|--------|------|-------|
| GET | `/actions` | Query params: `status`, `problemId` |
| POST | `/actions` | Requires `description`, `assignedToId`, `problemId` |
| PUT | `/actions/:id` | Auto-sets `completedAt` on RESOLVED |
| DELETE | `/actions/:id` | — |

### Analytics

| Method | Path | Notes |
|--------|------|-------|
| GET | `/analytics/summary` | `{total, open, inProgress, resolved, avgResolutionHours}` |
| GET | `/analytics/root-cause-distribution` | `{data: [{category, count}]}` sorted by count |
| GET | `/analytics/machine-issues` | Top 10 machines by issue count |
| GET | `/analytics/trend` | `?period=week\|month` — last 12 periods, `{data: [{label, count}]}` |

### Facilities & Machines

| Method | Path | Notes |
|--------|------|-------|
| GET | `/facilities` | Includes nested machines |
| POST | `/facilities` | `{name}` |
| GET | `/machines` | Optional: `?facilityId=` |
| POST | `/machines` | `{name, machineType?, facilityId}` |
| DELETE | `/machines/:id` | Does not delete related problems |

### Attachments

| Method | Path | Notes |
|--------|------|-------|
| POST | `/attachments/:problemId` | `multipart/form-data`, field name `files`, max 10 files, 50MB total |
| DELETE | `/attachments/:id` | Removes file from disk and DB record |

Allowed file types: `jpeg`, `jpg`, `png`, `gif`, `mp4`, `mov`, `avi`, `pdf`, `xlsx`, `csv`

Uploaded files are served statically at `GET /uploads/<filename>`.

### Health

| Method | Path |
|--------|------|
| GET | `/health` |

---

## Frontend Architecture

### Auth Flow

1. `AuthProvider` wraps the entire app in `layout.tsx`
2. On mount, it reads `token` from `localStorage` and calls `/auth/me` to validate it
3. `AppShell` redirects to `/login` if no authenticated user
4. Login/register store the token in `localStorage` and update context state
5. All API calls in `api.ts` inject `Authorization: Bearer <token>` automatically

### Page Protection

Every protected page uses `AppShell` as its wrapper. `AppShell` handles the auth redirect — individual pages do not need to implement auth guards.

### API Client (`src/lib/api.ts`)

Single module with one `request()` function that:
- Reads token from `localStorage`
- Sets `Content-Type: application/json` and `Authorization` headers
- Throws `Error` with the API's `error` message on non-2xx responses

File uploads use a separate raw `fetch()` call (no `Content-Type` so browser sets multipart boundary).

Always import from `@/lib/api` and use the `api` object:

```typescript
import { api } from '@/lib/api';
const { problems } = await api.getProblems({ status: 'OPEN' });
```

### Domain Constants (`src/lib/constants.ts`)

All structured domain data lives here — **do not hardcode these values in components**:

- `PROCESS_TYPES` — 12 manufacturing process options
- `SYMPTOM_OPTIONS` — 17 symptoms across 6 categories (`{ id, label, category }`)
- `CAUSE_CATEGORIES` — 6M Fishbone categories with `{ id, label, icon, color, causes[] }`
- `SEVERITY_OPTIONS` — low/medium/high/critical with Tailwind color classes
- `STATUS_OPTIONS` — OPEN/IN_PROGRESS/RESOLVED with Tailwind color classes
- `ROLE_OPTIONS` — OPERATOR/ENGINEER/MAINTENANCE/MANAGER
- `TOOL_TYPES` — 11 tooling options

### Component Conventions

**`AppShell`** — use as the root wrapper on every authenticated page:

```tsx
export default function MyPage() {
  return (
    <AppShell>
      <div>page content</div>
    </AppShell>
  );
}
```

**`StatusBadge` / `SeverityBadge`** — always use these instead of raw inline styles:

```tsx
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
<StatusBadge status={problem.actionStatus} />
<SeverityBadge severity={problem.severity} />
```

### CSS Utility Classes (defined in `globals.css`)

These Tailwind `@layer components` classes are available globally:

| Class | Usage |
|-------|-------|
| `.btn-primary` | Blue primary action button |
| `.btn-secondary` | White/gray secondary button |
| `.btn-danger` | Red destructive action button |
| `.card` | White rounded card with shadow and border |
| `.input` | Form input with focus ring |
| `.label` | Form field label |
| `.badge` | Small inline status pill |

Dark mode variants are defined for `.card`, `.input`, and `.label`.

### Dark Mode

Dark mode uses Tailwind's `class` strategy — toggled by adding `dark` to `<html>`. The toggle is in `AppShell` and persists to `localStorage` under key `darkMode`. When adding dark mode support to new components, use `dark:` prefixed Tailwind classes.

---

## Domain Logic

### The 6M Fishbone Model

Root causes are categorized into six groups (defined in `CAUSE_CATEGORIES`):

| ID | Label | Icon | Example Causes |
|----|-------|------|----------------|
| `Material` | Material | 📦 | Raw material defect, Wrong material grade |
| `Machine` | Machine | ⚙️ | Worn tooling, Machine misalignment |
| `Method` | Method | 📋 | Incorrect procedure, Process deviation |
| `Measurement` | Measurement | 📏 | Wrong gauge, Calibration issue |
| `Operator` | Operator | 👷 | Incorrect setup, Lack of training |
| `Environment` | Environment | 🌡️ | Temperature variation, Contamination |

When creating or updating problems, `rootCauseCategory` must be one of these IDs. `rootCause` is a free-text field (typically selected from the predefined `causes[]` list in `CAUSE_CATEGORIES`).

### Problem ID Generation

`problemId` is auto-generated in the POST `/problems` route:

```typescript
const count = await prisma.problem.count({ where: { organizationId: orgId } });
return `RCA-${String(count + 1).padStart(4, '0')}`;
```

This is sequential per organization and is human-readable (e.g. `RCA-0042`).

### Multi-Tenancy

Every database query that reads or modifies data **must** include `organizationId: req.user!.organizationId` in the where clause. This is enforced per-route — there is no global middleware for this.

When adding new routes or queries, always scope to the user's org.

### Status Transitions

```
OPEN → IN_PROGRESS → RESOLVED
```

The `resolutionDate` field is auto-set the first time a problem transitions to `RESOLVED`. The `completedAt` field on `Action` is auto-set when an action reaches `RESOLVED`.

---

## The RCA Wizard (`/problems/new`)

The 8-step wizard collects all RCA data progressively. Step 1 (title) is the only required field — users can submit a minimal record and fill in details later via the detail view.

| Step | Fields |
|------|--------|
| 1 – Problem Info | `title` (required), `description`, `severity` |
| 2 – Location | `facilityId`, `machineId` |
| 3 – Process Context | `processType`, `toolType`, `materialBatch`, `parameters` |
| 4 – Symptoms | `observedSymptoms[]` (multi-select) |
| 5 – Possible Causes | `suspectedCauses[]` (multi-select from 6M) |
| 6 – Root Cause | `rootCauseCategory`, `rootCause` |
| 7 – Corrective Action | `correctiveAction`, `responsiblePersonId`, `dueDate`, `estimatedCostImpact` |
| 8 – Review | Shows summary, submits to `POST /problems` |

The wizard navigates with local `useState` — no routing between steps. The "Back" button navigates to completed steps (shown in green).

---

## Adding New Features

### New API endpoint

1. Add route handler in the appropriate file under `backend/src/routes/`
2. Use `authMiddleware` (applied at router level, already set up on all route files)
3. Always filter by `req.user!.organizationId`
4. Register the route in `backend/src/server.ts` if creating a new route file

### New frontend page

1. Create `frontend/src/app/<path>/page.tsx`
2. Mark as `'use client'` if using hooks or browser APIs
3. Wrap content in `<AppShell>` for auth protection and navigation
4. Use `api.*` methods from `@/lib/api` for data fetching

### New database model

1. Add model to `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>` in the backend directory
3. The Prisma client is auto-regenerated after migration

### New domain options (symptoms, causes, etc.)

Add to the appropriate array in `frontend/src/lib/constants.ts`. If the option is also stored in the database, ensure the backend accepts it without hard validation (the API stores whatever string is sent).

---

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL 15 Alpine |
| `backend` | 4000 | Express API |
| `frontend` | 3000 | Next.js (standalone output) |

**Volumes:**
- `postgres_data` — database files (persists across restarts)
- `uploads_data` — user-uploaded files at `/uploads` inside the backend container

The backend container CMD runs `prisma migrate deploy` then starts the server — migrations are applied automatically on container start.

---

## Seed Data

Running `npm run db:seed` (or `docker compose exec backend npm run db:seed`) creates:

- **Organization:** Demo Factory (`slug: demo-factory`)
- **Facilities:** Building A - Machining, Building B - Assembly
- **Machines:** CNC Mill #1, CNC Lathe #3, Assembly Station 7
- **Users:**
  - `manager@demo.com` / `password123` — MANAGER role
  - `engineer@demo.com` / `password123` — ENGINEER role
  - `operator@demo.com` / `password123` — OPERATOR role

The seed uses `upsert` with fixed IDs so it is idempotent.

---

## Security Considerations

- **Never expose `JWT_SECRET` or `POSTGRES_PASSWORD`** in committed code — use `.env` (gitignored)
- **Organization isolation** is enforced per query — always include `organizationId` filter
- **File uploads** are validated by extension whitelist — do not relax this without review
- **Role permissions** are checked with `requireRole()` middleware — import from `middleware/auth.ts`
- The `password` field is never returned in any API response (use `select` to exclude it)

---

## Known Constraints & Design Decisions

- **No real-time updates** — pages refresh data on mount and after mutations; no WebSockets
- **No pagination UI** — history/issues pages fetch up to 100 records; add pagination for large datasets
- **Sequential problem IDs are not gap-free** — if a problem is deleted, that number is skipped
- **File storage is local** — attachments are stored on disk in Docker volume; replace multer with S3 SDK for cloud storage
- **No email notifications** — corrective action assignments are not emailed
- **TypeScript `strict` mode is off** in both frontend and backend to keep code lean — enable gradually
