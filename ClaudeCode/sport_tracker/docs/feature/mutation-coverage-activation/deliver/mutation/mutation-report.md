# Mutation Report — mutation-coverage-activation

Generated: 2026-06-05
Config: `stryker.mutation-coverage-activation.cjs`
Vitest config: `vitest.mutation-coverage-activation.config.ts`
Stryker version: perTest coverage analysis

---

## Overall Kill Rate

**61.65% — NEEDS_IMPROVEMENT (threshold: 80%)**

| Metric | Count |
|--------|-------|
| Total mutants | 266 |
| Killed | 164 |
| Survived | 70 |
| Timeout | 0 |
| No coverage | 32 |
| Errors | 0 |
| Run time | 41 seconds |

---

## Per-File Breakdown

| File | Score (total) | Score (covered) | Killed | Survived | No Coverage |
|------|---------------|-----------------|--------|----------|-------------|
| ReadinessCard.tsx | **96.97%** | 96.97% | 32 | 1 | 0 |
| ExerciseHistory.tsx | **79.41%** | 84.38% | 27 | 5 | 2 |
| RestTimer.tsx | **58.82%** | 58.82% | 20 | 14 | 0 |
| SessionScreen.tsx | **51.52%** | 62.96% | 85 | 50 | 30 |

---

## Surviving Mutants — Coverage Gaps

### ReadinessCard.tsx (1 surviving mutant)

**1. `if (false)` replaces `if (!url) return null`** (line 13)
- The `wikiUrl` guard early-return is never tested with a `null` url scenario.
- Tests cover the happy path (url present) but never verify the null-url guard produces a null return or renders nothing.

---

### ExerciseHistory.tsx (5 surviving, 2 no-coverage)

**1. `<=` replaces `<` in note truncation** (line 9: `note.length <= NOTE_MAX_LENGTH`)
- The boundary condition is not tested. Tests verify a note > 40 chars is truncated and a note exactly at the boundary is not tested (off-by-one gap).

**2. `if (false)` replaces null-note early return guard** (line 8)
- A null/empty note is never passed to `formatNote()`. No test exercises the null guard on the truncation helper path.

**3. Key template literal mutation** (line 64: `key={\`${session.id}-${idx}\`}` → `key={\`\`}`)
- React key uniqueness is not asserted. Tests verify row count and content but not that each row has a stable, unique key.

**4. Conditional survived: `formQuality !== null ? ... : "—"` → `{true ? ...}`** (line 68)
- No test exercises the null `formQuality` path where the dash `"—"` should be rendered instead of the value.

**5. Offline message string** (line 42: `"You are offline — data may be outdated"` → `""`)
- The BEM test for the offline banner only checks the CSS class presence, not the text content of the offline message.

---

### RestTimer.tsx (14 surviving mutants)

**1. `setNumber !== undefined` guard mutations** (line 53, 5 mutants)
- Multiple mutations to the `setNumber !== undefined &&` conditional all survived. Tests pass `setNumber=undefined` in the "omits label" test, but the label text content ("Rest after set N") is never asserted — only the absence of the element. When `setNumber` is defined, tests don't assert the label text value.

**2. `sticky = false` default prop flipped to `true`** (line 20)
- The `sticky` prop default is never exercised in a test that verifies sticky vs non-sticky class behaviour. The `timer--sticky` class string mutations also survived.

**3. ArrowFunction mutations for `hook.extend` and `hook.skip` fallback paths** (lines 39, 43)
- The `onExtend` and `onSkip` props are provided in RestTimer unit tests, so the `hook.extend` / `hook.skip` fallback arms (when the prop is absent) are never invoked. No test renders RestTimer without providing `onExtend`/`onSkip` and then triggers those actions.

**4. `duration ?? DEFAULT_DURATION_MS` → `duration && DEFAULT_DURATION_MS`** (line 94)
- The nullish coalescing on `duration` is not covered. No test passes an explicit `duration` prop that is `0` or `undefined` and verifies the fallback vs override logic.

---

### SessionScreen.tsx (50 surviving, 30 no-coverage)

The largest gap. 30 no-coverage mutants are concentrated in the session-close flow (lines 134–155 and 326–343), confirming the close/confirm overlay is entirely untested.

**Top 3 real coverage gaps:**

**1. Confirm-close overlay (lines 331–343, ~15 no-coverage + 2 survived)**
- `handleCloseRequest`, `handleConfirmClose`, `handleCancelClose` functions have zero test coverage. The "Done — End Session" button, the confirm dialog, the `confirmClose` state flag, and the `isClosing` state are all exercised only by those handlers.
- What to test: tap "Done — End Session" shows the confirm overlay; tap "End session" closes the session and navigates; tap "Keep going" dismisses without closing.

**2. `hasPendingSync` always-true mutation survived** (line 80)
- `const hasPendingSync = session.syncedAt === null` — the test for "shows sync-pending status indicator" only exercises `syncedAt === null`. No test passes a session with a non-null `syncedAt` and asserts the sync badge is absent. The equality operator is untested on the false side.

**3. Form field onChange handlers and derived state** (lines 287–299, ~8 survived)
- `setSets(Math.max(SETS_MIN, parseInt(...) || SETS_MIN))` — the `Math.max` vs `Math.min` mutation survived. The sets input onChange is never tested with a value below `SETS_MIN` (i.e., 0 or negative input) to verify the clamp behaviour. The `parseInt || SETS_MIN` fallback for non-numeric input also has no test.
- Similarly `setReps(parseInt(...) || REPS_MIN)` — the `|| REPS_MIN` NaN fallback is untested.

---

## Verdict

**NEEDS_IMPROVEMENT — 61.65% (threshold: 80%)**

The two files with the largest deficits are:
- `SessionScreen.tsx`: 51.52% — the session-close confirmation flow (30 no-coverage mutants) and multiple survived UI-state conditionals account for the majority.
- `RestTimer.tsx`: 58.82% — the `setNumber` label conditional has 5 mutations in a cluster, and sticky/fallback prop paths are uncovered.

`ReadinessCard.tsx` is the only file meeting the threshold (96.97%). `ExerciseHistory.tsx` is near the threshold at 79.41% with targeted improvements possible.
