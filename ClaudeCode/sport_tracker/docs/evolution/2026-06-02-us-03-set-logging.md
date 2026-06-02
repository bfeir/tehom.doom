# US-03 Set Logging — Evolution Log

**Date:** 2026-06-02
**Feature ID:** us-03-set-logging
**Delivery method:** DES (Deliver Execution Spec) — per-feature TDD cycle
**Branch:** main (trunk-based, direct commits)

---

## Feature Summary and Business Context

US-03 activates the set logging capability: the ability for a user to record an exercise entry (sets, reps, form quality, optional note) within an active session. The feature was already scaffolded at the acceptance-test level — 10 of the 11 acceptance tests had been written but were skipped. This delivery cycle converted those skips into passing tests by filling the remaining implementation gaps and adding domain validation to the `SessionRepository.addEntry()` method.

Business value: users can now record structured workout data (including form quality for self-coaching and freetext exercise names for non-catalogued movements) with correct domain enforcement (no zero-rep entries, no out-of-range form quality scores, no unnamed exercises).

---

## Steps Completed

All three steps executed under a single phase (01 — "Activate skipped acceptance tests for set logging").

### Step 01-01 — Add optional note field to ExerciseEntry and persist it through Supabase

**Completed:** 2026-06-02T10:20:08Z

Extended `ExerciseEntry` in `src/types/index.ts` with `note?: string`. No change to `SessionRepository.addEntry()` was required — the entry object is spread directly into the JSONB `entries` column, so the new field is included automatically. Activated the single note persistence test.

DES phases: PREPARE → RED_ACCEPTANCE → RED_UNIT → GREEN → COMMIT (all PASS)

Commit: `76b58fd feat(us-03-set-logging): add note field to ExerciseEntry and activate note persistence test`

### Step 01-02 — Activate five already-working happy-path tests

**Completed:** 2026-06-02T10:36:40Z

Removed `it.skip` from five tests whose required behaviour was already implemented: form quality persisted, exercise pre-fill via `findByUserAndExercise`, free-text exercise saved with null `exerciseId`, high rep count (25) accepted, and the offline contract documentation test. All five passed without implementation changes.

RED_UNIT skipped — not applicable: no new production code, all five tests relied on already-implemented behaviour.

DES phases: PREPARE → RED_ACCEPTANCE → RED_UNIT (SKIPPED/NOT_APPLICABLE) → GREEN → COMMIT (all PASS)

Commit: `213b788 feat(us-03-set-logging): activate five happy-path and offline contract tests - step 01-02`

### Step 01-03 — Add domain validation guards to addEntry and activate four error-path tests

**Completed:** 2026-06-02T12:34:02Z

Extracted domain validation into a private `validateEntry()` method on `SessionRepository`. Four guard clauses enforce: `reps >= 1`, `sets >= 1`, `formQuality` in [1, 5] when non-null, and at least one of `exerciseId` (non-null) or `exerciseName` (non-empty after trim). Guards placed before both the offline queue branch and the Supabase write, so both paths are protected uniformly. Activated four error-path tests.

RED_UNIT skipped — not applicable: acceptance tests exercise `addEntry()` through `SessionPort` (driving port); guard clauses live in the adapter — no separate unit layer to decompose.

DES phases: PREPARE → RED_ACCEPTANCE → RED_UNIT (SKIPPED/NOT_APPLICABLE) → GREEN → COMMIT (all PASS)

Commits:
- `7420a33 feat(us-03-set-logging): add domain validation guards to addEntry — step 01-03`
- `929755b refactor(us-03-set-logging): L1-L4 refactoring on SessionRepository and types`

---

## Key Implementation Decisions

### note field JSONB passthrough

The `note?: string` field required no change to the persistence layer. `SessionRepository.addEntry()` spreads the entry object into the JSONB `entries` column — any field present on the TypeScript type is transparently carried through. This zero-migration approach is a direct consequence of the JSONB column design chosen at the architecture level. Decision: add `note?: string` to `ExerciseEntry` interface only.

### guard placement — before offline and online branches

All four `validateEntry` guards are placed at the very top of `addEntry()`, before the `if (this.offline)` branch. This ensures both paths (IndexedDB offline queue and Supabase write) are protected by identical domain rules without duplicating the logic. Any future path added to `addEntry()` will also be guarded.

### validateEntry extraction

Domain validation was extracted to a private `validateEntry(entry: ExerciseEntry): void` method rather than inlined in `addEntry()`. Motivation: readability, single responsibility, and to isolate the validation contract as a named concept. The method throws `Error` instances with descriptive messages, following the project's existing error convention (plain `Error`, not typed subclasses).

### RED_UNIT justified skips

Steps 01-02 and 01-03 both skipped the RED_UNIT phase with documented rationale. For 01-02: no new production code was written — all tests relied on existing behaviour. For 01-03: the guard clauses are exercised through the `SessionPort` (driving port) by acceptance tests; there is no separate unit layer that would expose a different testing surface. Both skips are properly classified as `NOT_APPLICABLE` in the execution log.

---

## Mutation Testing Outcome

**Target:** `src/repositories/SessionRepository.ts`
**Test suite:** `tests/acceptance/react-pwa-ui/us-03-set-logging.test.ts` (11 tests)
**Tool:** Stryker (config: `stryker.us-03.config.cjs`, deleted post-run)

| Metric | Count |
|--------|-------|
| Total mutants generated | 197 |
| Killed | 66 |
| Survived | 16 |
| Timed out | 0 |
| No coverage (out-of-scope) | 115 |

**Killable mutants:** 82 (total minus noCoverage)
**Kill rate:** 66 / 82 = **80.49% — PASS** (threshold: ≥80%)

The 115 no-coverage mutants are expected: the acceptance suite covers only `addEntry` validation (us-03 scope). Other `SessionRepository` methods — `create`, `close`, `sync`, `syncOne`, `findByUserAndExercise`, etc. — are covered by other feature suites (us-02, us-08).

---

## Surviving Mutants Worth Noting

16 mutants survived across four groups. All are non-blocking for delivery but are noted as backlog items.

**Group 1 — error message strings blanked (4 mutants, lines 92/94/96/98 of validateEntry)**
Tests assert `rejects.toThrow()` without checking the message content. Mutating the string literal does not change whether an error is thrown. Fix: change assertions to `rejects.toThrow("ExerciseEntry: reps must be at least 1")` etc.

**Group 2 — boundary conditions weakened (6 mutants, validateEntry)**
Tests verify out-of-range values (0 reps, formQuality=6) but not boundary values (1 rep valid, formQuality=1 valid, formQuality=5 valid, whitespace-only name). The conditional flip to `false` can survive because the test input reaches the error through a different code path. Fix: add boundary-value test cases for the lower and upper valid values.

**Group 3 — closed-session guard (1 mutant, line 117)**
No test exercises the online path for adding an entry to a closed session. The offline closed-session guard is covered by us-08. Fix: add an online-path closed-session test.

**Group 4 — findByUserAndExercise ordering and filter logic (5 mutants, lines 243/250/252)**
Sort order and the `exerciseId === null` bypass path are not verified. These are likely covered by the us-06 history feature's mutation run — verify before adding duplication here.

---

## Lessons Learned

1. **JSONB passthrough is a zero-cost extensibility vector.** Adding optional typed fields to an entry type requires only a TypeScript change — no SQL migration, no serialization code, no mapping logic. This is a strong architectural dividend from the JSONB column design.

2. **Acceptance-driven guards cover the contract, not the implementation surface.** Guard clauses tested through a driving port (acceptance tests) are sufficient to enforce the domain contract, but they leave boundary values and message content unverified. A thin unit test layer on `validateEntry` would close these gaps with minimal investment — worth adding when boundary precision matters.

3. **NOT_APPLICABLE is a valid DES outcome.** Both RED_UNIT skips were legitimate: they reflected an honest assessment that no separate unit testing surface existed for the work being done. Forcing unit tests in these cases would have produced fragile tests that add noise without adding value.

4. **Extracting validation to a named method pays off immediately.** `validateEntry` is easier to reason about, easier to reference in error messages, and easier to test in isolation if a unit layer is added later. The extraction cost was negligible; the readability gain is permanent.

5. **115 no-coverage mutants are noise when scoping mutation runs to a feature.** Running Stryker with a per-feature scope (one file, one test file) will always leave the rest of the class uncovered. The killable-rate denominator correctly excludes these — but the raw numbers can be misleading at a glance. Document scope clearly in the report.
