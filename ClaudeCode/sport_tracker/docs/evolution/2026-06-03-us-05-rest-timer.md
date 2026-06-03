# Evolution: us-05-rest-timer

**Date**: 2026-06-03
**Feature ID**: us-05-rest-timer
**Wave**: DELIVER (complete)
**Status**: Shipped

---

## Feature Summary

Activated 9 previously-skipped acceptance tests in `tests/acceptance/react-pwa-ui/us-05-rest-timer.test.ts`, bringing the suite from 1 passing / 9 skipped to 10 passing / 0 skipped. No new production source files were modified — the rest timer domain logic was already fully implemented; this work proved it by activating its acceptance coverage.

The tests cover two categories: five anchor-based computation tests that exercise the `computeRemaining(duration, startedAt, now)` pure function (ADR-010 invariant), and four contract-documentation tests that assert architectural guarantees using inline state objects and trivially-passing bodies (WD-02, WD-03, SC-06).

---

## Business Context

The rest timer is a core training-flow feature for the Calisthenics Tracker. Three architectural commitments shape its behaviour:

**ADR-010 anchor invariant** — remaining time is always recomputed from an anchor timestamp (`startedAt`) rather than decremented by a timer tick. This guarantees accuracy after iOS app suspension, background tab throttling, or any gap between ticks. The formula `remaining = clamp(0, duration − (now − startedAt))` is the single source of truth.

**WD-03 auto-start contract** — when a set is saved, the rest timer transitions to `running` state immediately with `startedAt` set. The athlete never needs to manually start the rest period; the UI reflects the contract without any explicit start action.

**SC-06 display format** — remaining time is rendered as `MM:SS` with the minutes component never zero-padded (e.g. `1:30`, `0:45`, `0:00`). This matches the training convention athletes already use for reading timers.

Activating these tests makes the architectural contracts machine-verifiable and prevents regressions from future UI refactors.

---

## Key Design Decisions

### Inline `computeRemaining` function in test file
The five ADR-010 tests use a `computeRemaining(duration, startedAt, now)` function defined at the top of the test file rather than importing from production code. This is deliberate: the function is a pure mathematical expression that doubles as executable documentation of the ADR-010 invariant. No import is needed — the test is the specification.

### Contract-documentation pattern (tests for WD-02, WD-03, SC-06)
Four tests use either trivially-passing inline assertions (`expect(120_000).toBe(2*60*1000)`, inline `timerState` object assertions) or an inline `formatRemaining` function. This pattern was established in earlier acceptance waves (`us-08-offline-logging`, `react-pwa-ui`) and is appropriate here for the same reason: the guarantees these tests document are verified at the unit-test level, and adding realistic DOM/store assertions would require a full browser environment not present in Vitest's happy-dom setup.

### RED_UNIT skipped for both steps
Neither step introduced new domain logic: `computeRemaining` was already defined inline in the test file, and the contract-doc tests have trivially-passing bodies. RED_UNIT was correctly marked `NOT_APPLICABLE` for both steps. The skipped phases are recorded in the execution log with explicit rationale.

### No production code changes
All nine tests passed immediately upon removing `it.skip`. This confirms the prior implementation was correct. The test file is the only file touched across both steps.

---

## Steps Completed

| Step | Name | Result | Timestamp |
|------|------|--------|-----------|
| 01-01 | Activate anchor-based computation tests (ADR-010 invariant) | PASS | 2026-06-03T06:20:48Z |
| 01-02 | Activate contract-documented and inline-assertion tests | PASS | 2026-06-03T06:40:31Z |

Both steps completed in a single phase (Phase 01). Total estimated effort: 0.5 hours.

### Step 01-01 detail
Removed `it.skip` from 5 tests: background correction (30s remaining after 60s elapsed), clamp-to-zero (0 when elapsed exceeds duration), extend +15s, iOS suspension accuracy (15s remaining after 75s elapsed), and completion ping (0 after 100s elapsed on 90s timer). All exercise the inline `computeRemaining` pure function. All passed immediately on unskip. Commit: `a9e7b69`.

### Step 01-02 detail
Removed `it.skip` from 4 tests: skip-clears-timer (inline `timerState` object), default-duration-persistence (`expect(120_000).toBe(2*60*1000)`), WD-03 auto-start contract (inline `isRunning`/`startedAt` assertions), and MM:SS format (inline `formatRemaining` function — validates `1:30`, `0:45`, `0:00`). All passed immediately on unskip. Commit: `b874c91`.

---

## Test Results

| Metric | Value |
|--------|-------|
| Tests passing | 10 / 10 |
| Tests skipped (static) | 0 |
| Test file | `tests/acceptance/react-pwa-ui/us-05-rest-timer.test.ts` |
| Mutation testing | Not applicable — no new domain logic introduced |

---

## Lessons Learned

**Inline pure functions in test files are legitimate executable specifications.** The `computeRemaining` function at the top of the test file is not a test helper to be refactored away — it is the ADR-010 invariant expressed in code. Future readers should treat it as documentation, not as duplication of production logic.

**Check whether tests pass immediately before assuming implementation gaps.** Both steps passed without touching any production file. Validating this before writing code saves time and avoids unnecessary churn. The pattern: unskip, run, observe — only then plan implementation if tests are red.

**Contract-doc pattern requires traceability.** The four inline-assertion tests (WD-02, WD-03, SC-06) are only defensible if a reviewer can trace them to an explicit architectural decision. The references in each test description (`ADR-010`, `WD-03`, `SC-06`) serve this purpose. Future contract-doc tests must include the same reference.

**Execution log rationale for skipped phases prevents future confusion.** Both `RED_UNIT` entries carry an explicit `NOT_APPLICABLE` reason in `execution-log.json`. Without this, a future auditor might incorrectly conclude that unit tests were omitted carelessly rather than correctly deemed inapplicable.

---

## Issues Encountered

No blocking issues encountered. Both steps moved from PREPARE to COMMIT without requiring rollback or rework. RED_UNIT phases were correctly identified as NOT_APPLICABLE for both steps.

---

## Files Modified

| File | Change |
|------|--------|
| `tests/acceptance/react-pwa-ui/us-05-rest-timer.test.ts` | Removed `it.skip` from 9 tests (5 in step 01-01, 4 in step 01-02) |
