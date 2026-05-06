# Definition of Ready Validation — react-pwa-ui

**Feature**: react-pwa-ui
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-04-21
**Gate**: All 9 DoR items must PASS before handoff to DESIGN wave

---

## Definition of Ready Validation

### Story: UI-01 — Auth (Sign Up / Sign In)

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco finds lengthy registration forms disruptive and abandoned previous fitness apps at sign-up" |
| User/persona with specific characteristics | PASS | "Marco — RR practitioner, first visit OR returning after JWT expiry; Luis — beta friend, no Google account" |
| 3+ domain examples with real data | PASS | 4 examples: Marco via OAuth (marco.fitness@gmail.com), Luis via email (luis.bwf@proton.me), offline first use, returning user |
| UAT scenarios in Given/When/Then (3-7) | PASS | 5 scenarios: OAuth sign-in, email sign-up, offline attempt, returning user bypass, auth error message |
| AC derived from UAT | PASS | 6 AC items, each traceable to a scenario |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | Estimated 1-2 days, 5 scenarios |
| Technical notes: constraints/dependencies | PASS | Supabase Auth, JWT storage, token auto-refresh, RLS, dependency on Supabase project config |
| Dependencies resolved or tracked | PASS | Supabase Auth configured (architecture in place); no unresolved blockers |
| Outcome KPIs defined with measurable targets | PASS | KPI-04: 100% of beta users complete onboarding in under 5 minutes |

### DoR Status: PASSED
**Peer review note**: AC updated to add JWT expiry mid-session scenario (offline queue preserved on re-auth).

---

### Story: UI-02 — Start and Close a Session

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco finds open-session state management confusing, especially after crashes" |
| User/persona with specific characteristics | PASS | "Marco — pre-workout (home screen) and post-workout; RR practitioner needing clean session lifecycle" |
| 3+ domain examples with real data | PASS | 3 examples: normal open/close with Pike Push-ups + Pull-up Negatives, crash recovery (Apr 20 session), empty session guard |
| UAT scenarios in Given/When/Then (3-7) | PASS | 5 scenarios: new session start, session close with summary, open session on relaunch, empty session, offline close |
| AC derived from UAT | PASS | 6 AC items derived from scenarios |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | Estimated 1 day, 5 scenarios |
| Technical notes: constraints/dependencies | PASS | Zustand session state, IndexedDB crash recovery, SessionPort.create/close, dependency on UI-01 |
| Dependencies resolved or tracked | PASS | UI-01 (Auth) is a prerequisite; tracked in story map |
| Outcome KPIs defined with measurable targets | PASS | KPI-03 (0 lost sessions) + KPI-01 (log time) |

### DoR Status: PASSED

---

### Story: UI-03 — Log a Set

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco chose pen+paper because apps are too slow between sets — too many taps, tiny inputs" |
| User/persona with specific characteristics | PASS | "Marco — mid-workout between sets, phone in hand, 90-second rest window, park setting" |
| 3+ domain examples with real data | PASS | 5 examples: Pike Push-ups autocomplete (3×8), form quality note with shoulder note, Korean Dips free-text, offline park session, 25-rep hollow body |
| UAT scenarios in Given/When/Then (3-7) | PASS | 6 scenarios: autocomplete log, exercise pre-fill, optional note, free-text exercise, zero reps validation, offline save |
| AC derived from UAT | PASS | 8 AC items, each traceable to a scenario |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | Estimated 2 days, 6 scenarios |
| Technical notes: constraints/dependencies | PASS | SessionPort.addEntry(), PostgREST path, IndexedDB path, exercise_id nullable, autocomplete from pre-cached registry |
| Dependencies resolved or tracked | PASS | UI-01 (Auth), UI-02 (session open); fn-readiness-engine used in UI-04 (separate story) |
| Outcome KPIs defined with measurable targets | PASS | KPI-01: under 30 seconds per set entry |

### DoR Status: PASSED

---

### Story: UI-04 — Readiness Card Display

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco second-guesses himself mid-workout trying to remember the rep-range rule; was past threshold without knowing" |
| User/persona with specific characteristics | PASS | "Marco — mid-session or post-session; checking before deciding to progress or stay at current exercise" |
| 3+ domain examples with real data | PASS | 4 examples: NOT YET (2 of 3 sessions, Pike Push-ups), READY (3 sessions, advance CTA), REVIEW (form 2/5), offline error path |
| UAT scenarios in Given/When/Then (3-7) | PASS | 5 scenarios: NOT YET with gap, READY with CTA, REVIEW with form guidance, offline message, first session orientation |
| AC derived from UAT | PASS | 7 AC items, each traceable to a scenario |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | Estimated 1-2 days, 5 scenarios |
| Technical notes: constraints/dependencies | PASS | fn-readiness-engine port, 5-second timeout, signal_state enum (READY/NOT_YET/REVIEW), next_exercise_id, dependency on UI-03 |
| Dependencies resolved or tracked | PASS | UI-03 (session_id); fn-readiness-engine Edge Function (pre-existing, documented in architecture) |
| Outcome KPIs defined with measurable targets | PASS | KPI-02: 0 external lookups per session |

### DoR Status: PASSED

---

### Story: UI-05 — Rest Timer

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco opens a separate clock app for 90-second rest between every superset — every session — and his friend forgets rest times" |
| User/persona with specific characteristics | PASS | "Marco — mid-workout between sets, phone in hand; friend Luis also confirmed to forget rest times" |
| 3+ domain examples with real data | PASS | 4 examples: auto-start after Pike Push-ups save, 2-minute duration change, app backgrounded with notification, notifications not permitted fallback |
| UAT scenarios in Given/When/Then (3-7) | PASS | 6 scenarios: auto-start, foreground completion, +15s extension, skip, duration change, background notification |
| AC derived from UAT | PASS | 8 AC items, each traceable to a scenario |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | Estimated 1 day, 6 scenarios |
| Technical notes: constraints/dependencies | PASS | Web Worker for background timer, Web Push API (VAPID), Zustand + localStorage, dependency on UI-03 (save trigger) |
| Dependencies resolved or tracked | PASS | UI-03 (timer starts on set save event); Web Push VAPID key setup noted as prerequisite |
| Outcome KPIs defined with measurable targets | PASS | KPI-05: 0 external timer app opens per session |

### DoR Status: PASSED

---

### Story: UI-06 — Exercise History View

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco uses a self-designed paper grid to spot volume trends — tedious to scan and limited to a few sessions at a glance" |
| User/persona with specific characteristics | PASS | "Marco — before or after a session, checking past performance; also during session when uncertain about last session's volume" |
| 3+ domain examples with real data | PASS | 3 examples: 5 Pike Push-ups sessions table (Apr 21 to Apr 9 with form + notes), offline cached history, empty state for new exercise |
| UAT scenarios in Given/When/Then (3-7) | PASS | 4 scenarios: history table, offline cache indicator, empty state, data isolation |
| AC derived from UAT | PASS | 6 AC items derived from scenarios |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | Estimated 1-2 days, 4 scenarios |
| Technical notes: constraints/dependencies | PASS | HistoryService.findHistory(), PostgREST query with user_id + exercise_id filters, service worker cache strategy |
| Dependencies resolved or tracked | PASS | UI-01 (Auth), UI-03 (data must exist); HistoryService port is pre-existing |
| Outcome KPIs defined with measurable targets | PASS | North Star (sessions/week) + KPI-01 indirect (history view reduces lookup time) |

### DoR Status: PASSED

---

### Story: UI-07 — Progression Chain View

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco consults Reddit, the RR wiki, and a Google Sheets reference — 3 tools — every time he wants to know what comes next" |
| User/persona with specific characteristics | PASS | "Marco — considering progression or curious about the road ahead; context: post-session or after seeing readiness signal" |
| 3+ domain examples with real data | PASS | 4 examples: push chain with Pike Push-ups current (Wall PU → ... → Pseudo Planche Next), Korean Dips free-text, end of chain, offline load |
| UAT scenarios in Given/When/Then (3-7) | PASS | 5 scenarios: chain with current + next, criteria without extra nav, free-text message, offline load, end of chain |
| AC derived from UAT | PASS | 7 AC items derived from scenarios |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | Estimated 1-2 days, 5 scenarios |
| Technical notes: constraints/dependencies | PASS | ProgressionRepository.getCurrentProgression(), exercises table pre-cached, user_progression for current anchor, rr_wiki_url attribution |
| Dependencies resolved or tracked | PASS | UI-01 (Auth — user_id for user_progression); exercises registry (pre-seeded, documented in architecture) |
| Outcome KPIs defined with measurable targets | PASS | KPI-02: 0 external lookups (shared with readiness card) |

### DoR Status: PASSED

---

### Story: UI-08 — Offline Session Logging

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco trains at an outdoor park with no guaranteed wifi; if the app shows errors offline or loses data, it is less reliable than pen+paper and he will not use it" |
| User/persona with specific characteristics | PASS | "Marco at outdoor park, no wifi, mid-workout; constraint C2 is non-negotiable per CLAUDE.md" |
| 3+ domain examples with real data | PASS | 3 examples: full offline session (6 sets, bus home, sync on wifi), partial session offline (2 online + 4 offline), sync failure with retry |
| UAT scenarios in Given/When/Then (3-7) | PASS | 5 scenarios: offline save silent, badge increments, sync on reconnect, PWA offline load, home screen install |
| AC derived from UAT | PASS | 8 AC items derived from scenarios |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | Estimated 2 days, 5 scenarios |
| Technical notes: constraints/dependencies | PASS | IndexedDB schema, SyncCoordinator, Background Sync API, LWW conflict strategy, service worker cache strategies, PWA manifest (vite-plugin-pwa) |
| Dependencies resolved or tracked | PASS | UI-03 (save path wraps IndexedDB write); UI-01 (JWT needed for sync replay); vite-plugin-pwa (in project CLAUDE.md stack) |
| Outcome KPIs defined with measurable targets | PASS | KPI-03: 0 lost sessions across all beta park workouts |

### DoR Status: PASSED

---

## Overall DoR Gate: PASSED

All 8 user stories pass all 9 DoR items. No handoff blockers.

| Story | DoR Status |
|-------|------------|
| UI-01 | PASSED |
| UI-02 | PASSED |
| UI-03 | PASSED |
| UI-04 | PASSED |
| UI-05 | PASSED |
| UI-06 | PASSED |
| UI-07 | PASSED |
| UI-08 | PASSED |

**Handoff to DESIGN wave: APPROVED — all stories ready.**
