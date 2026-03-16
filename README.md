# LeanShop RCA

Ultra-Lean Root Cause Analysis Platform for Manufacturing

## Overview

LeanShop RCA is a production-ready SaaS web application for shop-floor troubleshooting. It enables operators, engineers, maintenance technicians, and managers to:

- Log problems quickly with a guided 8-step RCA wizard
- Identify root causes using the 6M Fishbone methodology
- Assign and track corrective actions
- View trends and analytics on the dashboard
- Build a searchable RCA knowledge base

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (7-day tokens) |
| Storage | Local file system (S3-compatible interface) |
| Deploy | Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Run with Docker

```bash
cp .env.example .env
# Edit .env with your secrets
docker compose up -d
```

Frontend: http://localhost:3000
Backend API: http://localhost:4000

### Seed demo data

```bash
docker compose exec backend npm run db:seed
```

Demo accounts:
- `manager@demo.com` / `password123`
- `engineer@demo.com` / `password123`
- `operator@demo.com` / `password123`

## Development Setup

### Backend

```bash
cd backend
npm install
cp ../.env.example .env
# Set DATABASE_URL to your local PostgreSQL
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Set NEXT_PUBLIC_API_URL in .env.local
npm run dev
```

## Features

### 8-Step Guided RCA Wizard

1. **Problem Info** — Title, description, severity
2. **Location** — Facility and machine selection
3. **Process Context** — Process type, tool type, material batch
4. **Symptoms** — Multi-select from categorized options
5. **Possible Causes** — 6M Fishbone categories (Material, Machine, Method, Measurement, Operator, Environment)
6. **Root Cause** — Select category and specific cause
7. **Corrective Action** — Assign person, due date, cost impact
8. **Review & Submit**

### Dashboard

- Key metrics (total, open, in-progress, resolved issues)
- Root cause distribution bar chart
- Monthly trend line chart
- Recent issues list

### Active Issues

- Sortable/filterable issue list
- Inline status updates
- Machine and status filters

### RCA History Library

- Full-text search
- Filter by machine, root cause category, status, date range
- Complete audit trail

### Problem Detail

- Full RCA record view
- Corrective action tracking with completion toggles
- File attachments (photos, videos, PDFs)

### Settings

- Facility management
- Machine management
- Team member overview

## API Endpoints

```
POST   /auth/register
POST   /auth/login
GET    /auth/me
GET    /auth/users

GET    /problems
POST   /problems
GET    /problems/:id
PUT    /problems/:id
DELETE /problems/:id

GET    /actions
POST   /actions
PUT    /actions/:id
DELETE /actions/:id

GET    /facilities
POST   /facilities

GET    /machines
POST   /machines
DELETE /machines/:id

GET    /analytics/summary
GET    /analytics/root-cause-distribution
GET    /analytics/machine-issues
GET    /analytics/trend

POST   /attachments/:problemId
DELETE /attachments/:id
```

## Security

- JWT authentication with role-based access
- Helmet.js security headers
- File upload validation (type and size limits)
- Organization-scoped data isolation (multi-tenant)

## User Roles

| Role | Capabilities |
|------|-------------|
| Operator | Log issues, view issues |
| Engineer | All + manage facilities/machines, analyze root causes |
| Maintenance | All operator capabilities + technical observations |
| Manager | Full access including settings management |
