# Prioritization: react-pwa-ui

**Feature**: react-pwa-ui
**Date**: 2026-04-21
**Method**: Value × Urgency / Effort + Riskiest Assumption First (Maurya)

---

## Release Priority

| Priority | Release | Target Outcome | KPI Link | Rationale |
|----------|---------|----------------|----------|-----------|
| 1 | Walking Skeleton (Slice 1) | End-to-end Supabase flow proven with real data | KPI-04 (zero-friction first session) | Validates all 5 integration points; unblocks everything else |
| 2 | Core Loop (Slice 2) | All 4 tools replaced in a single session | KPI-01 (log time), KPI-02 (readiness visible) | Completes UVP; enables beta sharing with friends |
| 3 | Resilience (Slice 3) | 0 lost sessions at outdoor park | KPI-03 (offline sync) | Non-negotiable for park use; must be done before first outdoor beta |

---

## Backlog

> Note: Story IDs assigned here. Sub-tasks within stories listed as implementation notes only — they are not separate stories. All stories in Slice 1 are Must Have. Slice 2 is Should Have. Slice 3 is Must Have (due to C2 offline constraint) but deferred until online baseline is stable.

| Story | Release | Priority | MoSCoW | Outcome Link | Job Traced | Dependencies |
|-------|---------|----------|--------|--------------|------------|--------------|
| UI-01 — Auth (sign in + sign up) | Slice 1 (WS) | P1 | Must Have | KPI-04 | JS-05 | None |
| UI-02 — Start and close a session | Slice 1 (WS) | P1 | Must Have | KPI-01, KPI-04 | JS-05 | UI-01 |
| UI-03 — Log a set | Slice 1 (WS) | P1 | Must Have | KPI-01 | JS-05, JS-02 | UI-02 |
| UI-04 — Readiness card display | Slice 1 (WS) | P1 | Must Have | KPI-02 | JS-01 | UI-03 |
| UI-05 — Rest timer | Slice 1 (WS) | P1 | Must Have | KPI-01 | JS-06 | UI-03 |
| UI-06 — Exercise history view | Slice 2 | P2 | Should Have | KPI-01 | JS-02, JS-04 | UI-03 |
| UI-07 — Progression chain view | Slice 2 | P2 | Should Have | KPI-04 | JS-03 | UI-01 |
| UI-08 — Offline session logging | Slice 3 | P3 | Must Have (C2) | KPI-03 | JS-05 | UI-03 |

---

## Dependency Graph

```
UI-01 (Auth)
  └── UI-02 (Session open/close)
        └── UI-03 (Log a set)
              ├── UI-04 (Readiness card)  ← requires fn-readiness-engine
              ├── UI-05 (Rest timer)       ← self-contained after set save
              ├── UI-06 (History view)     ← requires session history in DB
              └── UI-08 (Offline queue)    ← wraps UI-03 save path

UI-01 (Auth)
  └── UI-07 (Progression chain)  ← reads exercises + user_progression; no session dependency
```

---

## Elephant Carpaccio Check

All 8 stories pass the right-sizing test:

| Story | Estimated Days | Scenarios (planned) | Outcome |
|-------|---------------|---------------------|---------|
| UI-01 | 1-2 | 5 | Auth works end-to-end |
| UI-02 | 1 | 5 | Session lifecycle (open/close) |
| UI-03 | 2 | 6 | Set logged to real DB |
| UI-04 | 1-2 | 5 | Readiness signal displayed from Edge Function |
| UI-05 | 1 | 5 | Timer displaces separate clock app |
| UI-06 | 1-2 | 4 | History view populates from real data |
| UI-07 | 1-2 | 4 | Chain view shows real progression data |
| UI-08 | 2 | 5 | Offline session survives app restart and syncs |

All stories: 1-3 days, 4-6 scenarios, demonstrable in a single session. **Scope: PASS.**

No story touches more than 2 bounded contexts. No story requires more than 3 integration points.
