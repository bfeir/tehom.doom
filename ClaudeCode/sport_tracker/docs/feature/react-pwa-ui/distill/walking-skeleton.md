# Walking Skeleton — react-pwa-ui

**Feature**: react-pwa-ui
**Produced by**: Quinn (nw-acceptance-designer), DISTILL wave
**Date**: 2026-04-21

---

## Walking Skeleton Path

The walking skeleton answers: "Can Marco sign in, log one set, and close a session —
does the React PWA wire correctly to Supabase Auth, PostgREST, and the session domain?"

Steps:
1. **Auth** — Marco is authenticated (existing Supabase user, valid JWT)
2. **Start session** — SessionPort.create(userId) → open session returned
3. **Log one set** — SessionPort.addEntry(sessionId, {Pike Push-up, 3×8}) → entry persisted
4. **Close session** — SessionPort.close(sessionId) → closed session with entries returned

**Note**: fn-readiness-engine is NOT in the walking skeleton per WD-02 (readiness is on-demand,
not on save). The timer auto-start is tested in us-05 as a pure function invariant (no real I/O).

**Litmus test**:
- Title: "Marco completes a full workout session from start to close" — user goal framing ✓
- Given/When: user actions (start session, log set, close) — not system setup ✓
- Then: observable outcomes (session closed, entries visible in summary) — not internal state ✓
- Non-technical stakeholder confirmation: "yes, that is what users need" ✓

---

## Adapter Strategy: Strategy B

| Adapter | Test Approach | Tag |
|---------|--------------|-----|
| Supabase Auth | Real (service role client, .env.test) | @real-io |
| Supabase PostgREST (sessions) | Real (service role client, .env.test) | @real-io |
| fn-readiness-engine Edge Function | Mocked (vi.mock) in component/unit tests | — |
| fn-readiness-engine (real call) | Real call in integration test | @requires_external |
| IndexedDB (offline queue) | fake-indexeddb for unit; real Dexie for integration | @in-memory |

**Rationale**: Supabase is free-tier and available in CI. fn-readiness-engine has
cold-start latency (~150ms) and a monthly invocation budget — it is the "costly" adapter
that warrants mocking in the majority of tests, with one @requires_external integration test.

---

## First Scenario Location

File: `tests/acceptance/react-pwa-ui/us-02-session-lifecycle.test.ts`
Describe: "Marco completes a full workout session from start to close"
Test: "creates a session, accepts one set entry, and closes with a summary containing that entry"
Status: NOT SKIPPED — RED-ready, first to implement

## One-at-a-Time Implementation Sequence

1. `us-02-session-lifecycle.test.ts` first scenario (WS) — implement SessionRepository
2. `us-03-set-logging.test.ts` first scenario — extend addEntry validation
3. `us-05-rest-timer.test.ts` first scenario — implement computeRemaining pure logic
4. `us-04-readiness-card.test.ts` first scenario — implement ReadinessEngine + NotYet signal
5. `us-06-exercise-history.test.ts` first scenario — implement HistoryService query
6. `us-07-progression-chain.test.ts` first scenario — implement ProgressionRepository
7. `us-01-auth.test.ts` first scenario — implement SupabaseAuthAdapter
8. `us-08-offline-logging.test.ts` first scenario — implement IndexedDB offline adapter
