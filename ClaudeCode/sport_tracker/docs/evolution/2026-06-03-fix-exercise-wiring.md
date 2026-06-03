# Evolution: fix-exercise-wiring

**Date**: 2026-06-03
**Feature ID**: fix-exercise-wiring
**Type**: Bug fix / wiring correction
**Commits**: cceafbd (step 01-01), 697ffd8 (step 01-02)

## Feature Summary

Two targeted fixes to complete the exercise selection data flow:

1. **SessionScreen exercise wiring** — Wired `setCurrentExercise` from Zustand `sessionStore` into `SessionScreen.tsx` via a `useEffect` watching `exerciseName` and `suggestions`. When the exercise input value exactly matches a suggestion name, `setCurrentExercise(suggestion.id)` is called; when no match exists, `setCurrentExercise(null)` is called. This enables `ReadinessPage` and `HistoryPage` (both consuming `sessionStore.currentExercise`) to receive a valid exercise ID once the user selects an exercise during a session.

2. **ChainPage TypeScript fix** — Fixed a TypeScript type error in `ChainPage` inside `main.tsx` where `useState<Track>("push")` used an invalid track value. Corrected to `useState<Track>("push-up")`, the first valid `Track` value in the `TRACKS` array.

## Business Context

Without the exercise wiring fix, `ReadinessPage` and `HistoryPage` would always receive `null` for `currentExercise`, silently breaking exercise-specific readiness and history lookups. The `ChainPage` type error, while caught at compile time, would block TypeScript strict-mode builds.

## Steps Completed

| Step | Name | Result |
|------|------|--------|
| 01-01 | Wire setCurrentExercise in SessionScreen | PASS |
| 01-02 | Fix ChainPage initial track from 'push' to 'push-up' | PASS |

### Step 01-01: Wire setCurrentExercise in SessionScreen

**Files modified**: `src/components/SessionScreen.tsx`, `tests/unit/components/SessionScreen.test.tsx`

**Approach**: Added `setCurrentExercise` selector from `useSessionStore` into `SessionScreen`. Added a `useEffect` watching `[exerciseName, suggestions]` — on each change, finds a suggestion whose `name` matches `exerciseName.trim()` and calls `setCurrentExercise(match?.id ?? null)`. The effect approach (rather than inline `onChange`) was chosen because suggestions may lag one render behind the typed value.

**Test phases**:
- PREPARE: PASS
- RED_ACCEPTANCE: PASS
- RED_UNIT: SKIPPED (acceptance-level tests cover all unit behavior; no additional lower-level tests needed)
- GREEN: PASS
- COMMIT: PASS (cceafbd)

### Step 01-02: Fix ChainPage initial track from 'push' to 'push-up'

**Files modified**: `src/main.tsx`

**Approach**: Single one-character fix — `useState<Track>("push")` → `useState<Track>("push-up")`. The value `"push"` is not in the `TRACKS` array and is not assignable to the local `Track` type. `"push-up"` is the first entry in `TRACKS` and the correct default. TypeScript type system (`tsc --noEmit`) enforces correctness; no dedicated unit test was warranted.

**Test phases**:
- PREPARE: PASS
- RED_ACCEPTANCE: SKIPPED (TypeScript compilation is the enforced gate for a type-only change)
- RED_UNIT: SKIPPED (ChainPage is not exported from main.tsx; TypeScript type system enforces correctness)
- GREEN: PASS
- COMMIT: PASS (697ffd8)

## Key Decisions

1. **useEffect for exercise matching, not onChange** — Matching inside `onChange` would miss cases where suggestions update asynchronously after the user finishes typing. The `useEffect` watching both `exerciseName` and `suggestions` ensures the store is always updated with the latest resolved state.

2. **No unit test for ChainPage** — `ChainPage` is a local component inside `main.tsx` and is not exported. Isolated unit testing would require restructuring the file. The TypeScript type system provides sufficient correctness enforcement for a type-only bug fix.

3. **Direct fix delivery (no DISCUSS/DESIGN/DISTILL waves)** — Both fixes were narrowly scoped, had clear acceptance criteria, and required no architectural decisions. The standard DELIVER wave was sufficient.

## Issues Encountered

None. Both steps executed cleanly on the first attempt with no rework required.

## Lessons Learned

- When Zustand store actions need to react to derived UI state (e.g., search suggestions resolving), a `useEffect` watching the relevant state slices is more reliable than inline event handlers that may see stale values.
- TypeScript strict mode catches type mismatches like invalid `Track` union values at compile time, making them low-risk fixes with minimal test overhead.

## Migrated Artifacts

None — this was a direct fix delivery. No design, distill, or discuss artifacts were produced. All lasting knowledge is captured in this evolution document and the git history.
