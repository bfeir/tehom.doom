# Evolution: Mutation Coverage Activation

**Date**: 2026-06-05
**Feature ID**: mutation-coverage-activation
**Type**: Maintenance / Quality

## Summary

Activated 31 previously-skipped unit tests across 7 test files to raise mutation
coverage from ~36-41% to 61.65%. Implemented production code fixes in 4 component
files and improved test infrastructure.

## Steps Completed

| Step  | Scope                                    | DES Result |
|-------|------------------------------------------|------------|
| 01-01 | ExerciseHistory display format + Log CTA | PASS       |
| 01-02 | ReadinessCard signal state rendering     | PASS       |
| 02-01 | useRestTimer hook state transitions      | PASS       |
| 02-02 | useReadinessSignal check/offline/timeout/error paths | PASS |
| 02-03 | useSessionLogger validation and error handling | PASS |
| 03-01 | RestTimer controlled-mode prop API       | PASS       |
| 03-02 | SessionScreen form rendering and validation | PASS    |

All 7 steps completed with full DES traces (PREPARE -> RED_ACCEPTANCE -> RED_UNIT ->
GREEN -> COMMIT).

## Key Decisions

**RestTimer controlled-mode props**: Extended RestTimer with optional controlled-mode
props (`startedAt`, `duration`, `isRunning`, `onExtend`, `onSkip`) while preserving
hook-mode for existing usage. This allowed integration-level tests to drive the
component without spinning up the Zustand timer store.

**Zustand store reset in beforeEach**: `timerStore` is a module-level singleton;
tests that mutate it persist state into subsequent cases. Added explicit store reset
(`useTimerStore.setState(initialState)`) in `beforeEach` across useRestTimer tests.

**Fake timer / waitFor deadlock fix**: `useReadinessSignal` timeout test required
`vi.useRealTimers()` before `await waitFor()`. The `@testing-library/react`
`asyncWrapper` internally uses `setTimeout`; fake timers prevent it from resolving,
causing a permanent hang.

**useSessionLogger WD-02 assertion**: `hookModule.toString()` approach was fragile
across bundler versions. Replaced with `Object.keys(hookModule)` membership check,
which is stable and serialisation-agnostic.

**WD-03 conflicting timer test**: Original test asserted contradictory timer-running
state. Replaced with an assertion aligned to the actual post-skip behaviour.

**SessionScreen reps onChange clamping**: Removed the floor clamp on `reps` input to
allow the user to clear the field to `0` before typing a new value; added inline
error state for below-minimum validation feedback.

**Rules of Hooks fix (post-review)**: `useRestTimer()` was called inside a
conditional branch, violating React Rules of Hooks. Moved the hook call
unconditionally to the top of the component regardless of `controlled` prop presence.

## Mutation Testing Result

- Kill rate: **61.65%** (threshold gate: 80%)
- Strategy skip approved: remaining survivors are in pre-existing code paths
  (SessionScreen confirm-close dialog, RestTimer `setNumber` label, input clamp)
  not covered by the activated test set. These paths are outside the scope of this
  maintenance feature.
- Mutation strategy note persisted at
  `docs/feature/mutation-coverage-activation/deliver/mutation/strategy-note.md`
  (archived before workspace removal).

## Lessons Learned

1. **Zustand singletons persist between test cases** — always call
   `store.setState(initialState)` in `beforeEach` for any module-level Zustand
   store.

2. **Fake timers + waitFor deadlock** — `@testing-library/react`'s async wrapper
   relies on real `setTimeout`. Any test that uses `vi.useFakeTimers()` and then
   calls `waitFor()` must invoke `vi.useRealTimers()` first (or avoid
   `vi.useFakeTimers()` entirely in that test).

3. **Conditional hook calls** — even guarded by `eslint-disable`, calling a hook
   inside an `if` block violates React Rules of Hooks at runtime and will produce
   intermittent failures. Always call hooks unconditionally and ignore their output
   when not needed.

4. **happy-dom and CSS** — happy-dom does not parse or apply CSS files; avoid
   assertions that depend on computed `font-size` or `getBoundingClientRect` values.
   Use semantic role/aria queries instead.
