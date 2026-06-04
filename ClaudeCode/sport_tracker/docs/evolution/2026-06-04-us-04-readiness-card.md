# Evolution: us-04-readiness-card

**Date**: 2026-06-04
**Feature ID**: us-04-readiness-card
**Wave**: DELIVER (complete)
**Status**: Shipped

---

## Feature Summary

Activated 7 previously-skipped acceptance scenarios in `tests/acceptance/react-pwa-ui/us-04-readiness-card.test.ts`, bringing the acceptance suite to 9/9 active and passing. Also activated 2 ReadinessCard component tests in `src/components/__tests__/ReadinessCard.test.tsx` (offline and timeout scenarios). No new production source files were modified — ReadinessEngine is a thin delegate and the Edge Function already contained all required logic; this work proved it by activating the acceptance coverage.

This delivery is a sub-delivery within the larger **react-pwa-ui** feature. The DESIGN and DISTILL wave artifacts live under `docs/feature/react-pwa-ui/`, not under this feature directory.

---

## Business Context

The Readiness Card surfaces an athlete's workout readiness signal based on recent training history. It integrates with a Supabase Edge Function that evaluates signals (READY, REVIEW, first-session-null, offline, timeout, WD-02, timer, free-text exercise null) and returns a structured result to the React UI.

Three categories of scenario were activated:

**Signal return tests (step 01-01)** — READY, REVIEW, and first-session-null signals. These exercise the happy path where the Edge Function is reachable and returns a classification. The first-session-null case validates that new users with no training history receive a graceful null signal rather than an error.

**Contract pass-through tests (step 01-02)** — offline, timeout, WD-02, and timer scenarios. These are contract-documentation tests: they assert architectural guarantees (e.g. that offline state surfaces a known UI contract, that timeout is handled gracefully) using inline assertions. The same contract-documentation pattern was established in earlier acceptance waves (`us-05-rest-timer`, `us-08-offline-logging`).

**Free-text exercise null (step 01-03)** — validates that a non-UUID exerciseId (e.g. a free-text label entered by the user) causes the Edge Function to return null via its UUID guard, rather than throwing or returning a misleading result.

Activating these tests makes architectural guarantees machine-verifiable and closes the test gap identified in the DISTILL wave review.

---

## Key Design Decisions

### All scenarios passed immediately on unskip

No production code was written. All 7 acceptance scenarios and both component tests passed upon removing `.skip`. This confirms:
- The Edge Function UUID guard was already in place and correct.
- ReadinessEngine's delegation contract was already satisfied.
- The ReadinessCard component already handled offline and timeout states.

The correct procedure was: unskip, run, observe — only write code if tests are red. No code was needed.

### RED_UNIT skipped for all three steps

No step introduced new domain logic. RED_UNIT was marked `NOT_APPLICABLE` for each step with explicit rationale recorded in `execution-log.json`:
- 01-01: no unit-level implementation gap found.
- 01-02: contract-documented pass-through scenarios require only `.skip` removal.
- 01-03: Edge Function UUID guard already returns null; no null-guard needed in ReadinessEngine.

### Mutation testing not applicable

No new production source files were modified. ReadinessEngine is a thin delegate with no branching logic of its own. The Edge Function logic runs on Deno and is not mutatable by Stryker. Mutation testing was correctly skipped for this delivery.

### Adversarial review resolved (NEEDS_REVISION)

The adversarial review raised two issues:
1. **Offline/timeout component tests not activated** — resolved by activating the 2 `ReadinessCard.test.tsx` component tests (offline + timeout).
2. **Stale comment noted** — marked DES-blocked (context requires DESIGN wave update outside this delivery scope).

### Integrity: PASS

All 3 steps have complete DES traces. Each step progressed through PREPARE → RED_ACCEPTANCE → RED_UNIT (NOT_APPLICABLE) → GREEN → COMMIT without rollback or rework.

---

## Steps Completed

| Step | Name | Result | Timestamp |
|------|------|--------|-----------|
| 01-01 | READY, REVIEW, first-session-null signals | PASS | 2026-06-04T07:01:41Z |
| 01-02 | Contract-documented pass-throughs (offline, timeout, WD-02, timer) | PASS | 2026-06-04T07:04:16Z |
| 01-03 | Free-text exercise null | PASS | 2026-06-04T07:24:56Z |

All steps completed in a single phase (Phase 01). Total estimated effort: 0.7 hours.

### Step 01-01 detail

Removed `it.skip` from READY, REVIEW, and first-session-null signal scenarios. All passed immediately on unskip — the Edge Function already returned the correct signal classification for each case. RED_UNIT skipped (`NOT_APPLICABLE`). Commit recorded at `2026-06-04T07:00:32Z`.

### Step 01-02 detail

Removed `it.skip` from offline, timeout, WD-02, and timer contract-documentation scenarios. These use inline assertions documenting architectural pass-through guarantees. All passed immediately. RED_UNIT skipped (`NOT_APPLICABLE`). Commit recorded at `2026-06-04T07:06:21Z`.

### Step 01-03 detail

Removed `it.skip` from the free-text exercise null scenario. The Edge Function's UUID guard already returns null for non-UUID exerciseIds; no guard was needed in ReadinessEngine. Passed immediately. RED_UNIT skipped (`NOT_APPLICABLE`). Commit recorded at `2026-06-04T07:25:36Z`.

---

## Test Results

| Metric | Value |
|--------|-------|
| Acceptance tests passing | 9 / 9 |
| Acceptance tests skipped | 0 |
| Component tests activated | 2 (offline + timeout in ReadinessCard.test.tsx) |
| Acceptance test file | `tests/acceptance/react-pwa-ui/us-04-readiness-card.test.ts` |
| Component test file | `src/components/__tests__/ReadinessCard.test.tsx` |
| Mutation testing | Not applicable — no new production code written |

---

## Lessons Learned

**Thin delegates with correct upstream logic pass all tests without code changes.** ReadinessEngine delegates to the Edge Function for all signal evaluation. Because the Edge Function was already correct, every scenario passed on unskip. When a component is a delegate, check the upstream implementation before assuming the delegate needs modification.

**UUID guard in Edge Functions provides implicit null handling for free-text inputs.** The guard that rejects non-UUID exerciseIds is a general-purpose input validation fence, not a special case. The free-text null scenario was already satisfied without ReadinessEngine knowing about it. Document this guard as a contract so future callers understand the null return is expected, not an error.

**Contract-documentation tests are defensible only with traceable references.** The pass-through tests (offline, timeout, WD-02, timer) are only meaningful to reviewers who can trace them to an architectural decision or contract document. Ensure test descriptions carry explicit references (e.g. `WD-02`, `SC-06`) so future auditors do not mistake inline assertions for incomplete tests.

**Adversarial review catches component-level gaps that acceptance tests miss.** The component tests for offline and timeout were identified by the reviewer, not by the acceptance suite. Acceptance tests exercise the feature end-to-end; component tests protect individual UI rendering paths. Both layers are needed.

---

## Issues Encountered

**Adversarial review: NEEDS_REVISION** — the reviewer flagged two issues: offline/timeout component tests not activated, and a stale comment. The component tests were activated as requested. The stale comment was acknowledged as DES-blocked and deferred. After resolution the review passed.

No other blocking issues were encountered. No rollback was required at any step.

---

## Files Modified

| File | Change |
|------|--------|
| `tests/acceptance/react-pwa-ui/us-04-readiness-card.test.ts` | Removed `it.skip` from 7 scenarios across 3 steps |
| `src/components/__tests__/ReadinessCard.test.tsx` | Activated 2 component tests (offline + timeout) |
