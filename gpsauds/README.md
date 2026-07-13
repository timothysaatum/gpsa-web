# GPSA-UDS Frontend

React + TypeScript frontend for the GPSA-UDS departmental website.

## Stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | React Router v6 |
| Data fetching | TanStack Query v5 |
| State | Zustand v5 |
| Forms | React Hook Form + Zod |
| HTTP | Axios (with silent JWT refresh) |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |

## Setup

```bash
npm install
cp .env.example .env
npm run dev       # → http://localhost:3000
```

The Vite dev server proxies `/api` → `http://localhost:8000`, so make sure
the FastAPI backend is running first.

## Key architectural decisions

**Token storage**
- Access token → `sessionStorage` (cleared on tab close, reduces XSS window)
- Refresh token → `localStorage` (persists for the 30-day session)

**Silent refresh**
The Axios interceptor in `src/api/client.ts` catches 401 responses and
automatically calls `/auth/refresh` once, queuing concurrent failed requests
until the new token arrives. On refresh failure, it fires a custom
`auth:logout` DOM event that `App.tsx` listens to.

**Route protection**
`ProtectedRoute` in `src/components/shared/RouteGuards.tsx` handles both
authentication and optional role-based access. `GuestRoute` redirects
authenticated users away from login/register.

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Type-check + production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

## Pages

| Route | Component | Auth |
|---|---|---|
| `/` | Home | Public |
| `/academics` | Academics Hub | Public |
| `/events` | Events list | Public |
| `/events/:id` | Event detail | Public |
| `/welfare` | Public |
| `/opportunities` | Opportunities Hub | Public |
| `/news` | News list | Public |
| `/news/:id` | News detail | Public |
| `/certificates/verify` | Certificate verifier | Public |
| `/notifications` | Notification inbox | Auth required |
| `/profile` | Edit profile | Auth required |
| `/certificates` | My certificates | Auth required |
| `/settings` | Change password / sessions | Auth required |
| `/login` | Sign in | Guest only |
| `/register` | Create account | Guest only |
| `/forgot-password` | Password reset | Guest only |
| `/verify-email` | Email verification | Public |
