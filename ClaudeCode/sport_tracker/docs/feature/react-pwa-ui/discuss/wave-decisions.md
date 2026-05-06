# Wave Decisions — react-pwa-ui DISCUSS

**Feature**: react-pwa-ui
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-04-21
**Source decisions from DISCOVER**: docs/feature/react-pwa-ui/discover/wave-decisions.md

---

## Key Decisions Made in DISCUSS Wave

### WD-01 — Walking Skeleton: Auth → Log → Readiness → Close

**Decision**: The walking skeleton is the minimum path that validates all 5 integration points: Supabase Auth → PostgREST session write → fn-readiness-engine Edge Function → session close → JWT flow.

**Rationale**: Any story that cannot be tested end-to-end against the real Supabase backend is a development risk. The walking skeleton must be shipped first — before history view, progression chain, or offline support — because integration failures are cheaper to fix when the codebase is small.

**Stories in scope**: UI-01, UI-02, UI-03, UI-04, UI-05

---

### WD-02 — Readiness Card: On-Demand, Not Auto-Called on Save

**Decision**: fn-readiness-engine is called only when the user explicitly taps the Readiness button. It is NOT called automatically on every set save.

**Rationale**: Calling the Edge Function on every save would block the UX between set save and timer start — a critical moment when Marco needs the timer to start immediately. The readiness check is a secondary action; the timer start is part of the primary logging loop. Deferring the Edge Function call eliminates this latency entirely.

**Impact on UI-03**: Save → Timer auto-start must complete in one instant step. Readiness is a separate tap, separate screen.

---

### WD-03 — Rest Timer: Auto-Start on Save, No Confirmation Required

**Decision**: The rest timer starts automatically when Marco saves a set. No "Start Timer?" confirmation prompt.

**Rationale**: Marco's current behaviour (habitual separate timer app every session) confirms that he always wants the timer. An auto-start removes one tap from the critical path. Skip and Pause controls are always visible — the auto-start is not a trap.

**Impact on UI-05**: Timer auto-start is an acceptance criterion, not optional.

---

### WD-04 — Exercise History: Mirrors Paper Grid Mental Model

**Decision**: History is presented as a table (date, sets, reps, form quality, note) mirroring the paper grid Marco designed himself (exercises as columns, sessions as rows conceptually). No graph or chart in v1.

**Rationale**: Marco built his own information architecture (paper grid) without prompting. The mental model is established. The app replicates it. Introducing a chart or graph in v1 would deviate from the known mental model without evidence that it is better.

**DISCOVER assumption changed**: The DISCOVER wave did not explicitly specify a history format. This DISCUSS wave decision locks the format to the table model based on interview evidence (Q3 — self-invented grid).

---

### WD-05 — Scope: 8 Stories in 3 Release Slices

**Decision**: 8 user stories (UI-01 to UI-08), 3 release slices. Walking skeleton first, core loop second, offline resilience third.

**Rationale**: Right-sized per Elephant Carpaccio gate. Each story is 1-3 days. Each slice is independently demonstrable. No story was split or merged during DISCUSS wave — scope from DISCOVER was already appropriate.

**Scope assessment**: PASS — 8 stories, 3 bounded contexts, 3 slices, estimated 8-12 days total.

---

### WD-06 — Auth: Sign Up + Sign In in Single Story (UI-01)

**Decision**: New user sign-up and returning user sign-in are combined in UI-01, not split.

**Rationale**: The auth screen handles both flows from the same screen (Google OAuth works for both new and returning users; email requires a toggle). The acceptance criteria and scenarios cover both paths. Splitting would create an orphan story that cannot be demo'd independently.

---

### WD-07 — Offline: Slice 3, After Online Baseline

**Decision**: Offline support (UI-08) is deferred to Slice 3 — after the online flow (Slices 1 and 2) is stable.

**Rationale**: Offline bugs are harder to debug without a working online baseline. The park training use case is real and non-negotiable, but it is safer to build offline on top of a proven online architecture than to develop both simultaneously. Slice 3 must be completed before Marco's first outdoor beta session.

**Risk**: If the first beta session is outdoors (no wifi), offline support must be completed first. Marco should do the first beta session at home (wifi available) to allow the online baseline to be established first.

---

## Constraints Established from DISCOVER Evidence (carried forward)

| ID | Constraint | Source |
|----|------------|--------|
| C1 | Session log entry completable in under 60 seconds | DISCOVER wave-decisions D6 |
| C2 | Must work offline (outdoor park training, no guaranteed wifi) | DISCOVER wave-decisions D5 |
| C3 | Rest timer is in-app — displaces a separate habitual clock app | DISCOVER wave-decisions D3 |
| C4 | No social features in v1 | DISCOVER wave-decisions D4 |
| SC-01 | All session writes offline-first (IndexedDB → PostgREST) | Architecture brief + C2 |
| SC-03 | TypeScript strict mode throughout | CLAUDE.md |
| SC-04 | Free tier only — Supabase free + Cloudflare Pages | CLAUDE.md |
| SC-06 | Mobile-first — 44×44px touch targets, large glanceable text | D6 |

---

## DISCOVER Assumptions Changed in DISCUSS

| Assumption | DISCOVER State | DISCUSS Change | Rationale |
|------------|----------------|----------------|-----------|
| History view format | Not specified | Locked to table format (mirroring paper grid) | Interview evidence (Q3): Marco self-designed a grid format — the mental model is established |
| Readiness card timing | Not specified | On-demand only (not auto-called on save) | Timer auto-start must be instant; Edge Function latency cannot block the primary logging loop |
| Rest timer interaction | "Configurable per exercise pair" (DISCOVER) | Auto-start on save; configurable default | Auto-start removes a tap from the critical path; per-exercise configuration deferred to v2 |

---

## Open Questions for DESIGN Wave

These questions were not resolvable in the DISCUSS wave — they require solution-architect input or implementation discovery:

| # | Question | Blocking? | Owner |
|---|----------|-----------|-------|
| OQ-01 | Can Web Worker timer run with sufficient precision on iOS Safari PWA? iOS has aggressive background-app throttling. | Yes — affects UI-05 AC | solution-architect |
| OQ-02 | What is the offline-queue schema for IndexedDB — should it mirror the sessions table exactly or use a transformation on sync? | Yes — affects UI-08 implementation | solution-architect |
| OQ-03 | What is the PWA install prompt trigger strategy on iOS (iOS does not support the beforeinstallprompt event)? | No — iOS install is manual; note in UI-08 AC | solution-architect |
| OQ-04 | Does fn-readiness-engine support batch calls (multiple session_ids in one invocation) for use after offline sync? | No — single call per session is sufficient for v1 | solution-architect to confirm |

---

## Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R-01 | iOS Safari PWA timer precision degrades when app backgrounded | MEDIUM | MEDIUM | Verify in beta on iOS; fallback is a foreground-only timer with no background notification |
| R-02 | First beta session is outdoors before offline support (Slice 3) is done | LOW | HIGH | Marco performs first beta session at home (wifi) to validate Slice 1+2 first |
| R-03 | Exercise registry is incomplete — beta user exercises not covered | MEDIUM | MEDIUM | Cover top 10+ exercises per track on seed; measure external lookup rate in beta |
| R-04 | fn-readiness-engine free-tier cold start delays exceed 5s | LOW | LOW | Show spinner at 2s; error at 5s; retry available — not blocking for core logging loop |
| R-05 | IndexedDB quota exceeded on device with many offline sessions | LOW | LOW | Sessions are small (~100 bytes each); quota concern is theoretical for v1 usage volume |

---

## Handoff Package to DESIGN Wave

### Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| Journey visual | docs/feature/react-pwa-ui/discuss/journey-workout-session-visual.md | ASCII mockups + emotional arc + error paths |
| Journey schema | docs/feature/react-pwa-ui/discuss/journey-workout-session.yaml | Structured journey with Gherkin per step |
| Journey feature | docs/feature/react-pwa-ui/discuss/journey-workout-session.feature | Standalone Gherkin scenarios |
| Shared artifacts registry | docs/feature/react-pwa-ui/discuss/shared-artifacts-registry.md | All ${variables} with SSOT + integration risks |
| Story map | docs/feature/react-pwa-ui/discuss/story-map.md | Backbone + walking skeleton + release slices |
| Prioritization | docs/feature/react-pwa-ui/discuss/prioritization.md | Priority order + MoSCoW + dependency graph |
| User stories | docs/feature/react-pwa-ui/discuss/user-stories.md | 8 stories with LeanUX template + UAT + AC |
| DoR validation | docs/feature/react-pwa-ui/discuss/dor-validation.md | All 8 stories PASSED all 9 DoR items |
| Outcome KPIs | docs/feature/react-pwa-ui/discuss/outcome-kpis.md | 5 KPIs with measurement plan + hypothesis |
| Wave decisions | docs/feature/react-pwa-ui/discuss/wave-decisions.md | This document |
| SSOT journey YAML | docs/product/journeys/workout-session.yaml | Product-level canonical journey |
| SSOT journey visual | docs/product/journeys/workout-session-visual.md | Product-level visual reference |
| Updated jobs.yaml | docs/product/jobs.yaml | JS-06 (Rest Timer) added |

### What DESIGN Wave Needs to Decide

1. Component library selection (existing system vs. headless — see CLAUDE.md: "React 18 + Vite + TypeScript")
2. State management architecture for session loop (Zustand store shape)
3. IndexedDB schema (OQ-02 above)
4. Service worker caching strategy (cache-first vs. network-first per resource type)
5. iOS PWA timer precision strategy (OQ-01 above)
6. PWA manifest and icon set
7. Design tokens and visual language (mobile-first, outdoor glanceable)
