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