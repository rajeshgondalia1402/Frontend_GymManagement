# Copilot Instructions — Gym Management Frontend

Purpose: give AI coding agents immediate, actionable knowledge to be productive in this repo.

Project summary
- React + TypeScript SPA (Vite) with role-based UI (Admin / Member / Gym Owner).
- Tailwind CSS for design tokens; Zustand for state; Axios for HTTP.

Quick commands
- Dev: `npm run dev` (starts Vite)
- Build: `npm run build` (runs `tsc -b` then `vite build`)
- Preview: `npm run preview`
- Local CLAUDE helpers: `npm run claude`, `npm run claude:feature`, `npm run claude:project`

Architecture & key locations
- Pages: [src/pages](src/pages) — grouped by role: `admin`, `gym-owner`, `member`, `auth`.
- Layouts: [src/components/layout](src/components/layout) — `SidebarLayout.tsx`, `Header.tsx` control main app structure.
- Reusable UI: [src/components/ui](src/components/ui) — design-system primitives (buttons, inputs, cards).
- API + auth: [src/services/api.ts](src/services/api.ts) — centralized Axios instance, request/response interceptors handle auth token and refresh.
- Auth store: [src/store/authStore.ts](src/store/authStore.ts) — tokens, user object, role handling.
- Design tokens: `tailwind.config.js`, [src/index.css](src/index.css), [src/lib/designSystem.ts](src/lib/designSystem.ts).

Conventions & patterns (findable in code)
- Imports use the `@/` alias (see [tsconfig.json](tsconfig.json#L1)).
- All HTTP calls should go through the Axios instance at [src/services/api.ts](src/services/api.ts).
- Global state uses Zustand stores under [src/store](src/store). Put auth logic in `authStore`.
- Routing uses React Router v6; role-based redirect happens after login in [src/pages/auth/LoginPage.tsx](src/pages/auth/LoginPage.tsx).
- UI components are small, token-driven (avoid per-page CSS). Use classes from `tailwind.config.js` and helpers in `src/lib/designSystem.ts`.

Auth & flows (practical examples)
- Login returns a `user` with `roleId` and tokens. After login, redirect by role (implemented in `LoginPage.tsx`).
- Axios interceptors manage token expiry and refresh — prefer updating `src/services/api.ts` when altering auth behavior.

When changing UI/UX
- Reuse patterns in `src/components/ui/*` (e.g., `input.tsx`, `button.tsx`) rather than adding ad-hoc styles.
- For app-level layout changes edit `SidebarLayout.tsx` and `Layout.tsx`.

Developer workflow notes
- There is no automated test suite in the repo; add tests under `src/__tests__` if required.
- Use `npm run dev` for local development. Use `npm run build` to run type-check + production bundle.

Files to inspect first when debugging
- Start with [src/services/api.ts](src/services/api.ts), [src/store/authStore.ts](src/store/authStore.ts), and [src/pages/auth/LoginPage.tsx](src/pages/auth/LoginPage.tsx) for auth issues.
- For layout problems check [src/components/layout/SidebarLayout.tsx](src/components/layout/SidebarLayout.tsx) and [src/components/layout/Layout.tsx](src/components/layout/Layout.tsx).

Edit guidelines
- Keep component changes small and token-driven. Prefer composition over altering shared layout files without coordination.
- Follow existing conventions: `@/` imports, Tailwind classes, small pure UI components in `src/components/ui`.

Update this file when you add new roles, global middleware, or change the auth/token flow.

---
Please review — tell me if any sections are unclear or if you want more examples from specific files.
# Copilot Instructions for Gym Management Frontend

## Project Overview
- React + TypeScript SPA for gym management
- Role-based UI: Admin (Gym Owner) and Member
- Uses Vite, Tailwind CSS, Zustand for state, Axios for API

## Architecture & Data Flow
- Pages: `src/pages/{admin,member,auth}`
- Layouts: `src/components/layout/`
- Reusable UI: `src/components/ui/`
- API: `src/services/api.ts` (Axios instance, interceptors for auth)
- State: `src/store/authStore.ts` (tokens, user info, role)
- Design tokens: Tailwind theme in `tailwind.config.js`, CSS vars in `src/index.css`, JS tokens in `src/lib/designSystem.ts`

## Auth & Routing
- Login API returns user object with `roleId`, tokens
- After login, redirect by role:
  - Admin: `/admin/AdminDashboard`
  - Member: `/member/MemberDashboard`
- Use React Router v6 for navigation
- Token refresh handled in Axios response interceptor

## UI & Design System
- All colors, spacing, typography, radius, shadows via Tailwind theme and CSS vars
- No per-screen styling; use design tokens and reusable components
- Mobile-first: sidebar collapses, tables scroll/card, touch-friendly

## Developer Workflows
- Start: `npm start` (Vite dev server)
- Build: `npm run build`
- Lint: `npm run lint`
- No custom test setup found; add tests in `src/__tests__` if needed

## Patterns & Conventions
- Use `@/` alias for imports from `src/`
- API calls via `api.ts` only
- State via Zustand store
- Role-based routing after login
- Responsive layouts via Tailwind classes

## Key Files
- `src/services/api.ts`: API setup, auth interceptors
- `src/store/authStore.ts`: Auth state, user, tokens
- `src/pages/auth/LoginPage.tsx`: Login logic, role redirect
- `src/components/layout/SidebarLayout.tsx`: Responsive sidebar
- `tailwind.config.js`, `src/index.css`, `src/lib/designSystem.ts`: Design system

## Example: Role-based Redirect
```tsx
// After login
if (user.roleId === ADMIN_ROLE_ID) {
  navigate('/admin/AdminDashboard');
} else {
  navigate('/member/MemberDashboard');
}
```

## External Integrations
- No third-party auth; all handled via API and tokens
- Payment, attendance, diet plans: see respective service/page files

---
Update this file if you add new roles, layouts, or major workflows.