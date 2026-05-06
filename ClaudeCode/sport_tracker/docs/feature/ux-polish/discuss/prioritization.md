# Prioritization: ux-polish

**Feature**: ux-polish
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-05-04

---

## Release Priority

| Priority | Release | Target Outcome | KPI | Rationale |
|----------|---------|----------------|-----|-----------|
| 1 | Walking Skeleton (Slice 1) | Every screen in the core workout journey feels visually coherent | Qualitative: Marco rates ≥ 4/5 on first look | Design tokens are the dependency for everything; all 6 core-journey screens must ship together |
| 2 | Feedback Quality (Slice 2) | Every interaction confirms itself — no "did that save?" moments | Zero "did that register?" observations in a beta session | Microinteractions complete the emotional arc; progress bar + state colors finish the readiness card |
| 3 | Edge State Quality (Slice 3) | No screen looks unstyled even in rare states (timer zero, sync failure) | No visual surprise during a park session | Edge states are real but rare; builds on Slice 2 foundation |

---

## Backlog Stories

> **Note**: Story IDs (UX-01 through UX-07) are assigned in Phase 4 (Requirements). Sub-stories
> (UX-01b, UX-04b, UX-05b, etc.) are suffixed to indicate they belong to the same story arc.

| Story | Release | Priority | MoSCoW | Outcome Link | Dependencies |
|-------|---------|----------|--------|-------------|--------------|
| UX-01 — Design token system | Slice 1 (WS) | P1 | Must | KPI-UX-01 (visual coherence) | None — first to build |
| UX-02 — Auth screen polish | Slice 1 (WS) | P1 | Must | KPI-UX-01 | UX-01 |
| UX-03 — Home screen polish | Slice 1 (WS) | P1 | Must | KPI-UX-01 | UX-01 |
| UX-04 — Session/Log Set polish | Slice 1 (WS) | P1 | Must | KPI-UX-01, KPI-UX-02 | UX-01 |
| UX-05 — Rest Timer polish | Slice 1 (WS) | P1 | Must | KPI-UX-01 | UX-01 |
| UX-06 — Readiness Card polish | Slice 1 (WS) | P1 | Must | KPI-UX-01 | UX-01 |
| UX-04b — 150ms checkmark feedback | Slice 2 | P2 | Must | KPI-UX-02 | UX-04 |
| UX-01b — prefers-reduced-motion | Slice 2 | P2 | Must | KPI-UX-03 (accessibility) | UX-01 |
| UX-05b — Timer slide-in animation | Slice 2 | P2 | Should | KPI-UX-02 | UX-05 |
| UX-03b — Sync badge escalation | Slice 2 | P2 | Should | KPI-UX-02 | UX-03 |
| UX-02b — Auth error state inline | Slice 2 | P2 | Must | KPI-UX-02 | UX-02 |
| UX-06b — Readiness progress bar + REVIEW | Slice 2 | P2 | Should | KPI-UX-02 | UX-06 |
| UX-07 — History + Chain styling | Slice 2 | P2 | Should | KPI-UX-01 | UX-01 |
| UX-05c — Timer zero visual pulse | Slice 3 | P3 | Could | KPI-UX-02 | UX-05, UX-05b |
| UX-08-offline — Offline state styling completeness | Slice 3 | P3 | Could | KPI-UX-01 | UX-01, UX-06 |

---

## MoSCoW Summary

| Category | Stories | Rationale |
|----------|---------|-----------|
| **Must Have** | UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-04b, UX-01b, UX-02b | Without these, the app either has no consistent style or gives no feedback on the most critical interaction (set save). UX-01b is Must because WCAG 2.2 AA compliance requires reduced-motion support. |
| **Should Have** | UX-05b, UX-03b, UX-06b, UX-07 | Important for full polish quality. History/Chain (UX-07) is Should rather than Must because functional unstyled tables are still readable — just not premium. |
| **Could Have** | UX-05c, UX-08-offline | Edge states. Real but rare. The timer zero pulse is a delightful micro-moment, not a functional requirement. |
| **Won't Have** | Custom icon set, illustration system, loading skeletons, haptic feedback | Out of scope for v1. Free tier, solo developer. Deferred to v2. |

---

## Value / Effort Matrix

```
HIGH VALUE
    |
    |  UX-01  UX-04  UX-04b  UX-05  UX-06     <-- Quick wins or strategic investments
    |  UX-02  UX-03  UX-01b  UX-06b UX-07
    |                UX-02b  UX-05b UX-03b
    |
    |                              UX-05c
    |                              UX-08-offline
LOW VALUE
    ─────────────────────────────────────────────
    LOW EFFORT                         HIGH EFFORT
```

All Slice 1 stories (UX-01 through UX-06) are in the "high value, low-medium effort" quadrant.
The token system (UX-01) is a strategic investment (shared dependency) but still low effort
(CSS custom properties, no logic).

---

## Dependency Graph

```
UX-01 (Token System)
  ├── UX-02 (Auth polish)
  │     └── UX-02b (Auth error state inline)
  ├── UX-03 (Home polish)
  │     └── UX-03b (Sync badge escalation)
  ├── UX-04 (Session/Log Set polish)
  │     └── UX-04b (150ms checkmark)
  ├── UX-05 (Rest Timer polish)
  │     ├── UX-05b (Slide-in animation)
  │     └── UX-05c (Timer zero pulse) ← depends on UX-05b
  ├── UX-06 (Readiness Card polish)
  │     └── UX-06b (Progress bar + REVIEW amber)
  │           └── UX-08-offline (offline state styling completeness)
  ├── UX-01b (prefers-reduced-motion)
  └── UX-07 (History + Chain styling)
```

**Critical path**: UX-01 → UX-04 → UX-04b (the checkmark feedback is the highest-value
microinteraction and depends on both the token system and the base session screen styling).
