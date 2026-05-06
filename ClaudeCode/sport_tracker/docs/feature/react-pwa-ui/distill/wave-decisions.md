# Wave Decisions — react-pwa-ui DISTILL

**Feature**: react-pwa-ui
**Produced by**: Quinn (nw-acceptance-designer), DISTILL wave
**Date**: 2026-04-21
**Builds on**: DESIGN wave-decisions.md (DD-01 through DD-14)

---

## WS Strategy Declaration

**Strategy B applies**: Real local (real Supabase via `.env.test`) + fake costly
(fn-readiness-engine mocked with vi.mock for component/unit tests; real call tagged
`@requires_external` for integration tests).

**Rationale**:
- Supabase (PostgREST + Auth) is the driven adapter for session and history data.
  It is local-equivalent: credentials are in `.env.test`, cost is zero, available in CI.
  Real I/O is used everywhere Supabase is the adapter.
- fn-readiness-engine is an Edge Function with a cold-start latency (~150ms) and
  a free-tier invocation budget. It is the "costly" adapter. Component tests use
  vi.mock on ReadinessEngine. Integration tests tagged `@requires_external` call the
  real Edge Function.
- IndexedDB: `fake-indexeddb` for unit tests; real Dexie.js for integration tests.
  Offline adapter tests in us-08 use fake-indexeddb for speed.

**Walking skeleton tag**: `@walking_skeleton @real-io` — tests drive real Supabase;
fn-readiness-engine is mocked at the acceptance test level.

---

## Key Decisions Made in DISTILL Wave

### DT-01 — Testing Framework: Vitest + React Testing Library (No E2E)

Per CLAUDE.md: unit tests only in v1, no E2E. Acceptance tests use:
- Vitest + real Supabase service role client for service/port-level tests
- React Testing Library for component behavior
- vi.mock for hook-level isolation tests

### DT-02 — Walking Skeleton Scenario Placement

The walking skeleton lives in `us-02-session-lifecycle.test.ts` (first scenario,
not skipped). It exercises SessionPort.create → addEntry → close against real Supabase.
fn-readiness-engine is not called in the walking skeleton (WD-02 compliance).

### DT-03 — WD-02 Enforcement in Tests

WD-02 (readiness card on-demand only) is enforced at two levels:
1. `useSessionLogger.test.ts` verifies the hook does not call ReadinessPort
2. `us-04-readiness-card.test.ts` includes an explicit scenario confirming no
   readiness fetch occurs on set save

### DT-04 — WD-03 Enforcement (Timer Auto-Start)

WD-03 (timer starts within 200ms of set save, no readiness in path) is verified in:
1. `useSessionLogger.test.ts` — mockTimerStart called after addEntry resolves
2. `us-05-rest-timer.test.ts` — timer auto-start within 200ms scenario

### DT-05 — ADR-010 Pure Function Extraction (Mandate 4)

The `computeRemaining` function (ADR-010 invariant: `remaining = duration - (Date.now() - startedAt)`)
is tested as a pure function in `us-05-rest-timer.test.ts`. No fixture, no Supabase,
no IndexedDB required — the invariant is expressed and tested in isolation.

### DT-06 — Error Path Strategy

Error path ratio targets ≥40% per file. Achieved via:
- Domain validation errors (zero reps, both exercise fields null)
- Infrastructure failures (Edge Function timeout, network error during sync)
- State errors (closed session immutability, missing exercise in registry)
- Boundary conditions (timer negative clamping, 30-day free-plan window)

### DT-07 — One-at-a-Time Implementation Sequence

Implementation order (all scenarios after the first WS are marked `it.skip`):

1. `us-02-session-lifecycle.test.ts` — WS first scenario (SessionPort create/add/close)
2. `us-03-set-logging.test.ts` — first scenario (addEntry with registry exercise)
3. `us-05-rest-timer.test.ts` — first scenario (computeRemaining pure function)
4. `us-04-readiness-card.test.ts` — first scenario (NOT YET signal)
5. `us-06-exercise-history.test.ts` — first scenario (history table format)
6. `us-07-progression-chain.test.ts` — first scenario (chain ordering)
7. `us-01-auth.test.ts` — first scenario (returning user recognised)
8. `us-08-offline-logging.test.ts` — first scenario (offline addEntry silent save)
