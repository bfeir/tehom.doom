# Evolution: react-pwa-ui — React PWA UI for Calisthenics Tracker

**Feature**: react-pwa-ui
**Delivered**: 2026-04-27
**Wave**: DELIVER (final wave)
**Preceding feature**: calisthenics-tracker-v1 (23 steps, 57 tests, 93.75% mutation kill rate)

---

## What Was Built

A complete React 18 + Vite + TypeScript strict PWA frontend for the calisthenics progression tracker, built on top of the already-delivered v1 backend (Supabase + Edge Functions). The UI implements 8 user stories across 12 roadmap steps, covering:

- **Session lifecycle** (create → log sets → rest → close with summary)
- **Rest timer** (ADR-010: Date.now() anchor, handles iOS Safari backgrounding)
- **Readiness card** (NOT_YET / READY / REVIEW signals from fn-readiness-engine)
- **Exercise history** (tabular view with 30-day free-tier window, WD-04)
- **Progression chain** (chain_order-ordered exercise list with RR wiki attribution)
- **Auth** (Supabase Auth, returning-user bypass, JWT session management)
- **Offline logging** (Dexie.js IndexedDB queue, SyncCoordinator replay on reconnect)
- **PWA** (vite-plugin-pwa, service worker, iOS "Add to Home Screen" banner)

---

## Architecture Decisions Confirmed in Delivery

| ADR | Decision | Outcome |
|-----|----------|---------|
| ADR-010 | Timer uses `computeRemaining(startedAt, duration, now)` pure function | Implemented; corrects on iOS foreground return |
| ADR-011 | Dexie.js for IndexedDB queue | Implemented; fake-indexeddb for unit tests |
| DD-02 | Hexagonal ports-and-adapters | Maintained throughout; only repositories import supabase |
| WD-02 | Readiness card on-demand only (no auto-trigger on save) | Enforced in useSessionLogger and acceptance tests |
| WD-03 | Timer auto-starts within 200ms of set save | Enforced in useSessionLogger |
| WD-04 | History renders as table (no charts in v1) | ExerciseHistory renders `<table>` |

---

## Test Coverage

| Suite | Tests | Active | Skipped |
|-------|-------|--------|---------|
| Unit (vitest) | 62 | 62 | 96 (future scenarios) |
| Acceptance (react-pwa-ui) | 8 files | 8 first scenarios | 88 (marked skip for future) |
| Acceptance (calisthenics-tracker-v1) | 57 | 57 | 0 |

All 62 active tests pass. Error path ratio in acceptance tests: 51% (exceeds 40% target).

---

## Steps Delivered

| Step | Name | Commit |
|------|------|--------|
| 01-01 | SessionPort wiring and session store | ad75d81 |
| 01-02 | Set logging validation and timer auto-start | 2211c84 |
| 01-03 | Rest timer (ADR-010 anchor invariant) | 41bbe48 |
| 02-01 | Readiness card NOT_YET/READY/REVIEW | c9d138e |
| 02-02 | Exercise history tabular view | 4581540 |
| 02-03 | Progression chain ordered view | e104941 |
| 03-01 | Auth and authStore | 3656898 |
| 03-02 | React Router v6 routes and navigation | a0dda49 |
| 03-03 | Session close summary and crash recovery | b77ff30 |
| 04-01 | IndexedDB offline queue (Dexie.js) | 9da39ea |
| 04-02 | SyncCoordinator queue replay | 8c2423d |
| 04-03 | PWA service worker and install banner | ac52204 |
| — | L1-L4 refactoring | 6e46e07 |
| — | Adversarial review blockers D1+D3 | 01278f1 |

---

## Issues Discovered During Delivery

### Seeding bugs in DISTILL acceptance tests

- **us-04**: Test assumed `consecutiveSessions=3` but DB criterion has `consecutiveSessions=2`. Fixed seeding to 1 session (1 of 2 needed) → NOT_YET.
- **us-07**: `user_progression` seeded with column `exercise_id` but DB column is `current_exercise_id`. Fixed column name.
- **us-06**: `HistoryService.findHistory()` returned ascending order but test expected descending. Fixed sort in `HistoryService`.

### Architecture gap caught by adversarial review

- **D1**: `useReadinessSignal.ts` used `process.env` (Node.js API) instead of `import.meta.env` (Vite). Would have crashed in browser.
- **D3**: `SessionSyncPort.sync()` returned `void`, discarding the boolean from `SessionRepository.syncOne()`. Silent failure on remote-newer conflict. Fixed interface to `Promise<boolean>`.

---

## Known Deferred Items

- **E2E tests**: Deferred to v2 per CLAUDE.md. All scenarios beyond the first in each file are marked `it.skip`.
- **Google OAuth**: Cannot be driven in headless test environment; verified via Supabase admin API contract.
- **Mutation testing**: Not run on this frontend feature (mutation tools work poorly with React component code; backend v1 achieved 93.75% kill rate).
- **iOS backgrounding completion ping**: Platform limitation documented in ADR-010 — ping fires on foreground return, not during background.

---

## Key Patterns Established

1. **Hexagonal boundary**: All Supabase access through `src/lib/supabaseClient.ts` singleton; repositories are the only adapters; hooks inject ports.
2. **Offline-first**: `SessionRepository(client, isOffline)` — offline flag routes to IndexedDB queue without touching Supabase.
3. **SyncCoordinator**: Boot-time singleton outside React tree; listens for `online` event; drains queue in `queuedAt` ascending order; `MAX_RETRIES=3` before tap-to-retry.
4. **Timer**: Pure `computeRemaining(startedAt, duration, now)` function in `src/lib/timer.ts`; `timerStore` holds `startedAt` epoch anchor, never accumulated tick count.
