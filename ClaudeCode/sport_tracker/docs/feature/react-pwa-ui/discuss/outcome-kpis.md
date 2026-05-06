# Outcome KPIs — react-pwa-ui

**Feature**: react-pwa-ui
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-04-21
**Source**: Gothelf/Seiden "Who Does What By How Much" + Maurya Running Lean (OMTM)

---

## Feature: react-pwa-ui (Calisthenics Tracker PWA)

### Objective

Replace 4 separate tools (pen+paper, clock app, Reddit/wiki, Google Sheet) with a single PWA that
an RR practitioner can use mid-workout at an outdoor park — by the time the first beta session ends.

---

### Outcome KPIs

| # | Who | Does What | By How Much | Baseline | Measured By | Type |
|---|-----|-----------|-------------|----------|-------------|------|
| KPI-01 | RR practitioner mid-workout | Logs a complete set (exercise + sets + reps) faster than pen and paper | Under 60 seconds per set entry | Pen+paper estimated 15s; app target 30s on first use | Stopwatch observation during first beta session | Leading (Activation) |
| KPI-02 | RR practitioner after closing a session | Views the readiness card without opening Reddit, wiki, or spreadsheet | 0 external lookups per session | Currently 3 tools consulted per progression check | Beta session observation (does user open another app?) | Leading (Outcome) |
| KPI-03 | RR practitioner at outdoor park | Completes a full workout session offline and sees all data synced on reconnect | 0 lost sessions across all beta park workouts | Pen+paper never loses data (current baseline = 0 loss) | IndexedDB queue count vs Postgres row count after sync | Leading (Reliability) |
| KPI-04 | New RR practitioner (beta friend) | Completes first session (sign in → log → readiness → close) without asking for help | Under 5 minutes, 100% of beta onboarding | No prior baseline (new feature) | Observation during first beta link share | Leading (Activation) |
| KPI-05 | RR practitioner mid-workout | Uses in-app rest timer instead of a separate clock app | 0 external timer app opens per session (100% displacement) | External timer app opened 3-5 times per session | Beta session observation | Leading (Outcome) |

---

### Metric Hierarchy

- **North Star**: Daily sessions logged per user (are users training with the app, not paper?)
  - This is the OMTM for the Stickiness phase: does Marco use the app every training day?
  - Target: 3+ sessions logged per week per user during beta

- **Leading Indicators** (behaviour changes predicting the north star):
  - KPI-01: Log speed under 60s (adoption blocker — if slower than paper, user reverts)
  - KPI-02: Zero external progression lookups (value delivery — replaces 3 tools)
  - KPI-03: Zero lost sessions offline (trust — equivalent to pen+paper reliability)
  - KPI-04: First-session completion rate (activation — is the app discoverable on its own?)
  - KPI-05: Rest timer displacement (adoption confirmation — separate clock app closed)

- **Guardrail Metrics** (must NOT degrade):
  - Session data integrity: 0 duplicate entries in Postgres after sync replay
  - Auth reliability: 0 JWT failures causing mid-session data loss (token auto-refresh must work)
  - Offline queue persistence: IndexedDB queue survives app restart (0 queue drops on relaunch)
  - Readiness card accuracy: signal_state from fn-readiness-engine matches expected output for known test cases

---

### Measurement Plan

| KPI | Data Source | Collection Method | Frequency | Owner |
|-----|------------|-------------------|-----------|-------|
| KPI-01 (log speed) | Stopwatch + observer notes | Direct observation during beta session 1 | Once (first beta session) | Marco (self-observer or friend) |
| KPI-02 (zero external lookups) | Observer notes | Screen-sharing or co-present observation | Per beta session | Marco |
| KPI-03 (no lost sessions) | IndexedDB queue depth + Supabase sessions count | Manual comparison after each park session | Per park workout | Marco |
| KPI-04 (first-session completion) | Observer notes | Observe friend onboarding via shared link | Once per new beta user | Marco |
| KPI-05 (timer displacement) | Observer notes | Do they open the clock app? | Per beta session | Marco |
| North Star (sessions/week) | Supabase sessions table | COUNT(sessions) GROUP BY user_id, week | Weekly after beta starts | Marco |

---

### Hypothesis

We believe that a mobile-first PWA with offline session logging, in-app rest timer, and readiness
signal card for RR practitioners will achieve zero external-tool usage during a training session.

We will know this is true when Marco and 1-3 beta users log entire workout sessions without opening
pen+paper, a clock app, Reddit, the RR wiki, or Google Sheets — in at least 3 consecutive sessions
per user.

---

### KPI-to-Story Traceability

| KPI | Primary Story | Supporting Stories |
|-----|---------------|-------------------|
| KPI-01 (log speed) | UI-03 (Log a Set) | UI-02 (session start), UI-05 (timer auto-start) |
| KPI-02 (zero external lookups) | UI-04 (Readiness Card) | UI-07 (Progression Chain) |
| KPI-03 (no lost sessions) | UI-08 (Offline Logging) | UI-02 (session close), UI-03 (save path) |
| KPI-04 (first-session completion) | UI-01 (Auth) | UI-02, UI-03, UI-04 |
| KPI-05 (timer displacement) | UI-05 (Rest Timer) | UI-03 (timer auto-start trigger) |

---

### Smell Test Results

| Check | KPI-01 | KPI-02 | KPI-03 | KPI-04 | KPI-05 |
|-------|--------|--------|--------|--------|--------|
| Measurable today? | Yes (stopwatch) | Yes (observation) | Yes (DB count) | Yes (observation) | Yes (observation) |
| Rate not total? | Yes (seconds per set) | Yes (rate = 0 external opens) | Yes (rate = 0 lost) | Yes (completion %) | Yes (rate = 0 external opens) |
| Outcome not output? | Yes (user behaviour) | Yes (user behaviour) | Yes (reliability) | Yes (user behaviour) | Yes (user behaviour) |
| Has baseline? | Partial (paper ~15s; app target 30s) | Yes (3 tools per check) | Yes (paper = 0 loss) | No (new) | Yes (3-5 opens/session) |
| Team can influence? | Yes (UX design) | Yes (readiness card UX) | Yes (offline architecture) | Yes (onboarding UX) | Yes (timer UX) |
| Has guardrails? | Yes (data integrity, auth reliability) | Yes (readiness accuracy) | Yes (no duplicates) | Yes (auth reliability) | Yes (timer accuracy) |

All KPIs pass the smell test. KPI-04 baseline is marked "No" — this is expected for a first-time
feature. Baseline will be established during the first beta onboarding session.
