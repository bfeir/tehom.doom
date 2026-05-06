# Wave Decisions — react-pwa-ui DESIGN

**Feature**: react-pwa-ui
**Produced by**: Morgan (nw-solution-architect), DESIGN wave
**Date**: 2026-04-21
**Builds on**: DISCUSS wave-decisions.md
**Hands off to**: acceptance-designer (DISTILL wave), software-crafter (DELIVER wave)

---

## Decisions Made in This Wave

### DD-01 — Component Library: shadcn/ui (Radix UI + Tailwind CSS)

**Decision**: Use shadcn/ui (Radix UI primitives + Tailwind CSS) as the component foundation.
Components are copied into `src/components/ui/` and owned by the codebase — not a runtime dependency.

**Rationale**: Headless Radix primitives provide correct accessibility (ARIA, focus management,
keyboard nav) without bundle overhead. Tailwind with `tailwind.config.ts` design tokens is the
single source of truth for touch target sizes, color, and type scale (SC-06). Bundle size is minimal
versus Mantine (~100–150 KB saved).

**Crafter impact**: Run shadcn/ui CLI to scaffold base components into `src/components/ui/`.
See ADR-009 for full decision record.

---

### DD-02 — Timer Architecture: Date.now() Epoch Anchor (Web Worker preferred, main-thread acceptable)

**Decision**: The rest timer computes remaining time as `duration - (Date.now() - startedAt)`, where
`startedAt` is recorded at the moment of set save. This anchor is stored in Zustand `timerStore`.
Ticks may run in a Web Worker or main-thread `setInterval` — the architectural invariant is the
anchor pattern, not the thread location.

**Rationale**: iOS Safari suspends all JavaScript (main thread AND workers) when the PWA is
backgrounded. The `Date.now()` anchor ensures the displayed time is correct on foreground return
regardless of background duration. See ADR-010.

**Crafter impact**: Implement `TimerWorker` in `src/workers/timer.worker.ts` using Vite's `?worker`
import. `timerStore` shape: `{startedAt: number | null, duration: number, isRunning: boolean}`.
Remaining is computed in the consuming hook, not stored.

**OQ-01 resolution**: Foreground-only timer with `Date.now()` anchor is the correct strategy. iOS
background notifications are not available for PWAs without native app status.

---

### DD-03 — IndexedDB Queue Schema: Domain Session Objects + Queue Metadata

**Decision**: IndexedDB `offline_sessions` store persists `Session` domain objects extended with
`{queuedAt: Date, syncAttempts: number}`. Key path: `id`. Indexes: `by_userId`, `by_queuedAt`.
Replay order: ascending `queuedAt`.

**Rationale**: Storing domain objects eliminates mapping code at sync time. `SyncCoordinator` passes
stored objects directly to `SessionRepository.syncOne()`. Queue is directly readable by UI.
See ADR-011.

**Crafter impact**: Create `src/lib/db.ts` (Dexie.js wrapper — see DD-04). Define `QueuedSession`
type extending `Session` with `queuedAt` and `syncAttempts` fields.

**OQ-02 resolution**: Domain object representation. No transformation on sync.

---

### DD-04 — IndexedDB Library: Dexie.js

**Decision**: Use Dexie.js (MIT license, github.com/dexie/Dexie.js, 11K+ stars) as the IndexedDB
abstraction layer for the offline queue.

**Rationale**: Raw IndexedDB API is callback-based and verbose. Dexie.js provides a Promise-based
API with TypeScript generics, schema versioning, and cursor-based queries matching the queue drain
pattern. Bundle size: ~27 KB gzipped — acceptable for the value delivered (eliminates ~200 lines
of IndexedDB boilerplate). Active maintenance (last commit <2 months at ADR date).

**Crafter impact**: `npm install dexie`. Create `src/lib/db.ts` with Dexie schema definition.

---

### DD-05 — PWA Cache Strategy: Stale-While-Revalidate for Static Assets, Network-First for API

**Decision**: vite-plugin-pwa `workbox` configuration uses:
- **CacheFirst** for static assets with content hashes (JS bundles, CSS, fonts, icons) — safe
  because content-hashed assets never change.
- **StaleWhileRevalidate** for the exercise registry (`/rest/v1/exercises*`) — serves cached copy
  instantly, refreshes in background. Registry changes are infrequent; stale data for one session
  is acceptable.
- **NetworkFirst** for all other API calls (`/rest/v1/sessions*`, Edge Functions) — live data is
  preferred; falls back to cache only when offline. Session writes bypass the service worker cache
  entirely and go directly to IndexedDB queue on offline detection.

**Crafter impact**: Configure in `vite.config.ts` under `VitePWA()` plugin options with
`workbox.runtimeCaching` entries.

---

### DD-06 — React Router: v6 with Data Router Pattern

**Decision**: Use React Router v6 (MIT license, github.com/remix-run/react-router, 53K+ stars)
with the `createBrowserRouter` data router pattern. Route definitions live in `src/main.tsx`.
Protected routes are implemented via a `RequireAuth` wrapper component that reads `authStore.isAuthenticated`.

**Rationale**: React Router v6 is already the default for Vite + React projects. Data router
pattern enables future loader-based data fetching if TanStack Query is ever supplemented. No
alternative routing library offers a meaningful advantage for this use case.

**Crafter impact**: Define all 6 routes in `src/main.tsx`. `RequireAuth` redirects unauthenticated
users to `/auth`. No route-level data loaders in v1 — all data fetching is in hooks.

---

### DD-07 — Auth Adapter: Supabase Auth via React Context Provider

**Decision**: Supabase Auth state is initialized once at boot, stored in `authStore` (Zustand), and
exposed to components via the `useAuth()` hook. The `SupabaseAuthAdapter` class wraps
`supabase.auth.onAuthStateChange()` and writes to `authStore` on every auth event
(SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED). This runs outside the React tree as a boot-time
singleton alongside `SyncCoordinator`.

**Rationale**: Consistent with the AA5 architectural decision (boot-time singletons outside React).
JWT is available globally via `supabase.auth.getSession()` — no React context needed for auth state.
Zustand store is the single source of truth for `{user, isAuthenticated, isLoading}`.

---

### DD-08 — Open Questions Resolved

| OQ | Resolution | ADR |
|----|-----------|-----|
| OQ-01 | Date.now() anchor strategy. iOS background suspension is unavoidable; foreground correction is the correct mitigation. | ADR-010 |
| OQ-02 | Domain Session objects + queuedAt/syncAttempts metadata. No transformation on sync. | ADR-011 |
| OQ-03 | Manual iOS banner (`AddToHomeScreenBanner`) detecting `!window.navigator.standalone` in iOS Safari. Shipped in Slice 3 (UI-08c). | ADR-010 (OQ-03 section) |
| OQ-04 | No batch calls needed. Single `fn-readiness-engine` call for the latest exercise after sync drain. Confirmed by `ReadinessEngine.calculate()` signature in existing code. | ADR-010 (OQ-04 section) |

---

## Constraints Carried Forward to DISTILL

| ID | Constraint | Impact on Acceptance Tests |
|----|------------|---------------------------|
| SC-01 | All session writes offline-first | Offline save path must be testable via mocked navigator.onLine |
| SC-02 | Log entry under 60 seconds | AC must include a "user can complete entry in one tap sequence" behavioral check |
| SC-03 | TypeScript strict mode | Crafter enforces; no `any` in adapter or hook code |
| SC-04 | Free tier only | No paid CDN, no paid auth providers beyond Google OAuth |
| SC-06 | 44×44px touch targets | AC must specify that interactive elements meet touch target minimum |
| WD-02 | Readiness card on-demand only | AC must confirm timer starts on save WITHOUT a readiness fetch |
| WD-03 | Timer auto-starts on save | AC must confirm timer state transitions from idle→running on set save |
| WD-04 | History as table, no charts | AC must confirm history renders as tabular data |

---

## Enforcement Tooling Recommendations

Architecture rules enforced by:
- **import-linter** (`eslint-plugin-import` with `no-restricted-imports` rules): enforces the layer
  boundaries established in brief.md (components cannot import services, services cannot import
  repositories). Configuration in `.eslintrc` / `eslint.config.ts`.
- **TypeScript strict mode** (`"strict": true` in `tsconfig.json`): enforces null safety, no
  implicit any.
- **Vitest `--coverage`**: enforces 80% line coverage threshold on `src/services/`.

---

## Handoff Package Contents

| Artifact | Path |
|----------|------|
| This document | docs/feature/react-pwa-ui/design/wave-decisions.md |
| Upstream changes | docs/feature/react-pwa-ui/design/upstream-changes.md |
| ADR-009: Component library | docs/product/architecture/adr-009-component-library.md |
| ADR-010: Timer architecture | docs/product/architecture/adr-010-timer-architecture.md |
| ADR-011: IndexedDB schema | docs/product/architecture/adr-011-indexeddb-schema.md |
| Updated architecture brief | docs/product/architecture/brief.md (## Application Architecture extended) |
