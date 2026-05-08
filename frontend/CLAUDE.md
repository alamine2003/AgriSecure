# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgriWatch is a **surveillance agricole** (agricultural surveillance) frontend for Senegal. It monitors farmland via connected cameras with AI-based intrusion detection (humans, animals, vehicles). Two user roles exist: `agent_agricole` (field agent) and `maintenancier` (system administrator).

## Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

No test framework is configured.

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_USE_MOCK` | Set to `"false"` to disable mock adapter and hit real backend | `true` (mocks enabled) |
| `VITE_API_URL` | Backend API base URL | `/api/v1` |
| `VITE_WS_URL` | WebSocket base URL | `ws://localhost:8000` |
| `VITE_DISABLE_HMR` | Disable hot module replacement | `false` |
| `VITE_DEV_THROUGH_NGINX` | Adjust HMR for nginx proxy setup | `false` |

## Architecture

### Mock System

The app ships with a **full mock adapter** (`src/api/mockAdapter.js`) that intercepts all axios requests when `VITE_USE_MOCK !== 'false'`. This means the app runs entirely without a backend by default. Mock state is mutable in-memory (persists during session, resets on reload).

Demo credentials: `agent@agriwatch.sn` / `agent123` (agent), `admin@agriwatch.sn` / `admin123` (maintenancier).

### Auth Flow

- JWT-based auth stored in `localStorage` (`access_token`, `refresh_token`, `user`)
- Auto-refresh on 401 via axios interceptor (`src/api/client.js`)
- `ProtectedRoute` blocks unauthenticated access; `RequireRole` enforces role-based routing
- Users with `must_change_password: true` are forced to `/change-password`

### Routing & Roles

- **Agent agricole**: `/agent/dashboard`, `/agent/perimeter`, `/surveillance`, `/reports`
- **Maintenancier**: `/maintenancier/dashboard`, `/maintenancier/inscription`, `/maintenancier/agents`, `/maintenancier/rendezvous`
- Public pages: `/`, `/login`, `/register-agent`

### Component Organization (Atomic Design)

- `src/components/atoms/` — Smallest units (StatCard, LoadingSpinner, DeviceCard)
- `src/components/molecules/` — Composed units (AlertItem, CameraCard, PerimeterCard)
- `src/components/organisms/` — Full sections (StatsGrid, AlertsSection, CamerasSection)
- `src/components/templates/` — Page layouts
- `src/components/ui/` — Generic reusable primitives (button, card, dialog, inputs)

### Key Conventions

- Path alias: `@` maps to `src/` (configured in vite.config.js)
- Dark mode is forced on load (`document.documentElement.classList.add('dark')`)
- CSS variables define the color system in `src/index.css` — brand colors are HSL-based
- TailwindCSS with custom `brand-*` color scale and `tailwindcss-animate` plugin
- Fonts: "Plus Jakarta Sans" for display, "Inter" for body
- Maps use Leaflet/react-leaflet for perimeter drawing
- Toasts use Sonner (`<Toaster>` in main.jsx)
- Server-state management via TanStack React Query

### Backend Integration

When mock is disabled, the Vite proxy forwards:
- `/api/v1/*` → `http://backend:8000`
- `/ws/*` → `ws://backend:8000` (WebSocket)

API endpoints follow pattern: `/auth/*`, `/users/*`, `/surveillance/*`, `/reports/*`

### Docker

Multi-stage build: Node 20 builds the app, then static files are served via nginx on port 80.
