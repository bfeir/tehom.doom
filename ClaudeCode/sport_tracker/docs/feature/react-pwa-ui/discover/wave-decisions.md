# Wave Decisions — react-pwa-ui Discovery

## Metadata

- Feature: react-pwa-ui
- Date: 2026-04-21
- Wave: Discovery (Scout) → Requirements (product-owner)

---

## Key Decisions

### D1 — Scope: UI layer only, no new backend

**Decision**: react-pwa-ui is the UI layer for already-implemented backend services. No new backend work in this wave.

**Evidence**: Backend services (ReadinessEngine, SyncCoordinator, PlateauDetector) are already built and tested (docs/scenarios/calisthenics-tracker-v1/). Architecture ADRs are in place (docs/product/architecture/).

**Impact**: The engineering scope for this wave is React 18 + Vite + TypeScript (strict) frontend only. Supabase Auth, PostgREST, and Edge Functions are pre-existing.

---

### D2 — Auth: Standard Supabase Auth, isolated data per user

**Decision**: Google OAuth + email/password via Supabase Auth. Each user (primary + beta friends) has isolated data via Row Level Security (RLS). No custom invite system, no friend-linking.

**Evidence**: Interview Q8 — friends are beta testers with separate accounts, not social training partners. No current sharing behavior observed.

**Impact**: No social graph, no shared plans, no leaderboards. RLS enforces data isolation automatically.

---

### D3 — Rest timer: In scope for v1

**Decision**: 90-second configurable rest timer is in scope for v1. It replaces a concrete, habitual, separate tool the user already opens every session.

**Evidence**: Interview Q7 — uses a separate clock app for 90-second rest between supersets, every session. Friend at the park "forgot rest times" — second data point.

**Impact**: Adds one screen element (timer widget) to the session log screen. Preset at 90s; configurable. This is a low-effort addition with immediate displacement value.

---

### D4 — Social features: Out of scope for v1

**Decision**: No sharing, no leaderboards, no friend connections, no training partner features in v1.

**Evidence**: Interview Q8 — "I didn't really share my training with someone." Friends = beta testers, not social training partners. No current sharing behavior confirmed.

**Impact**: Simplifies auth model (RLS per user), removes a class of complexity (real-time sync, privacy controls, shared state), and keeps v1 focused on the solo practitioner workflow.

---

### D5 — Offline: Non-negotiable

**Decision**: Offline-first is a hard requirement. IndexedDB write queue + Supabase sync is the architecture (already established in CLAUDE.md and ADR-002).

**Evidence**: Interview Q6 — trains at an outdoor calisthenics park. No wifi guaranteed. Session logging must work without connectivity.

**Impact**: All session writes go to IndexedDB first. Sync happens when connectivity is restored. UI must handle offline state gracefully (no error screens; queued writes are silent).

---

### D6 — Mobile-first UX

**Decision**: All UI must be designed for phone use between sets. Large tap targets, minimal input, glanceable cards.

**Evidence**: Interview Q7 — phone is already out between sets. Pen and paper was chosen over Excel because it is faster. The app must be faster than paper for logging a set.

**Impact**: Session log entry must be completable in under 60 seconds (C1). No dense forms, no multi-step flows for core actions. Readiness card and rest timer must be glanceable — no need to read fine print mid-workout.

---

### D7 — MVP screen set

**Decision**: v1 ships with 5 screens. All others deferred to v2.

| In v1 | Deferred to v2 |
|-------|---------------|
| Session log entry | Settings / profile |
| Readiness card | Notifications |
| Exercise history | Analytics dashboard |
| Progression chain view | Social features |
| Rest timer | Export / import |

**Evidence**: Each v1 screen maps directly to a confirmed problem or validated assumption. Deferred screens have no behavioral evidence from the interview.

---

## Constraints Established from Evidence

| ID | Constraint | Source |
|----|------------|--------|
| C1 | One-session logging must be completable in under 60 seconds | Excel was too heavy; paper was chosen for speed |
| C2 | Must work offline (park training, no guaranteed wifi) | Interview Q6 — outdoor calisthenics park confirmed |
| C3 | Rest timer required — habitual existing behavior | Interview Q7 — separate timer app every session |
| C4 | No social features in v1 | Interview Q8 — no current sharing behavior |

---

## Validated Assumptions

| ID | Assumption | Confidence | Evidence |
|----|------------|------------|---------|
| VA1 | Phone usage mid-workout is realistic | HIGH | Habitual current behavior — timer app every session |
| VA2 | Offline-first is needed | HIGH | Outdoor park confirmed in past-behavior question |
| VA3 | Rest timer eliminates a separate tool | HIGH | Uses separate clock every session, 90s confirmed |
| VA4 | Friends = separate accounts only | HIGH | No current sharing behavior; beta tester framing confirmed |

---

## Invalidated Assumptions

| ID | Assumption | Confidence | Evidence |
|----|------------|------------|---------|
| IA1 | Social/sharing features needed in v1 | HIGH — INVALIDATED | Friends = beta testers; no sharing behavior exists |
| IA2 | User knows progression chain intuitively | HIGH — INVALIDATED | Looked up externally every time; was past threshold without knowing |

---

## Open Questions for Beta Testing

These questions were not answered in the discovery interview and should be resolved during the beta round:

1. **Exercise library completeness**: Does the in-app library cover enough exercises to eliminate the external spreadsheet? Which exercises are missing?
2. **Logging speed**: Can a set be logged in under 60 seconds on the first use, without instruction?
3. **Readiness card comprehension**: Does the user understand the rep-range threshold display in under 10 seconds?
4. **Offline sync reliability**: Does the IndexedDB queue sync cleanly when the user returns to wifi after a park session?
5. **Rest timer adoption**: Does the user stop opening the external clock app within the first session?

---

## Handoff Checklist

- [x] Phase 1 (Problem Validation) complete — conditional (n=1, acknowledged)
- [x] Phase 2 (Opportunity Mapping) complete — 6 opportunities scored, all >8
- [x] Phase 3 (Solution Testing) complete — 5/6 assumptions validated or invalidated; beta round pending
- [x] Phase 4 (Market Viability) complete — Lean Canvas written, 4 risks assessed
- [x] G1 gate: CONDITIONAL PROCEED (sample size acknowledged)
- [x] G2 gate: PROCEED (all 6 opportunities >8)
- [x] G3 gate: CONDITIONAL PROCEED (beta required for full pass)
- [x] G4 gate: PROCEED (all risks GREEN or YELLOW)
- [x] Evidence quality: past behavior only — no future intent accepted as evidence
- [x] Peer review: pending (see below)
- [x] Go/No-Go: GO — build beta prototype, run beta testing round, revisit G1/G3 after beta
