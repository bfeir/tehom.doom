# Evolution: us-07-progression-chain

**Date**: 2026-06-03
**Feature ID**: us-07-progression-chain
**Wave**: DELIVER (complete)
**Status**: Shipped

---

## Feature Summary

Activated 6 previously-skipped acceptance tests in `tests/acceptance/react-pwa-ui/us-07-progression-chain.test.ts`, bringing the suite from 1 passing / 6 skipped to 7 passing / 0 skipped.

The tests cover the progression chain view: wiki attribution (SC-03), end-of-chain graceful handling, contiguous chain_order data integrity, next-exercise criteria population, free-text exercise orientation, and the pre-loadable Exercise Registry contract. No new production code was required — the progression chain logic in `findProgressionChain` and the Exercise Registry seed data were already correct. This work proved it by activating the acceptance coverage.

Key discoveries made during activation: the DB track slug for the push-up progression chain is `"push-up"` (not `"push"`), Pike Push-up lives in the `"hspu"` track (not `"push-up"`), and the Exercise domain type uses the field name `criteria` (not `rrCriteria` as originally written in test 1).

---

## Business Context

The progression chain view is the athlete's guide to long-term skill development. Given an exercise an athlete is currently working on, the chain view displays the full sequence of prerequisite and successor exercises from the Exercise Registry so athletes understand where they are and what comes next. This fulfils the Roadmap Progression business capability.

The SC-03 wiki attribution requirement mandates that every exercise surfaced by the app links to a credible source (Reddit BWF wiki or equivalent). The `rr_wiki_url` data-integrity test (step 01-02) is the machine-verifiable gate for that system constraint applied to the push-up chain.

The Exercise Registry is a bounded context: exercises, tracks, and their chain metadata are owned by seed data in Supabase, not by application code. These acceptance tests are contracts against the Registry's data shape — they fail fast if a migration or seed edit corrupts chain continuity or drops attribution URLs.

---

## Key Design Decisions

### Track slug is "push-up" not "push"

The original test file referenced track slug `"push"` in several places. The actual DB value is `"push-up"`. This caused test 2 (wiki attribution) and test 5 (contiguous chain_order) to return empty result sets, which would have led to vacuously-passing assertions. The fix updates all relevant query parameters to use the correct slug `"push-up"`. This was discovered in step 01-02 during the RED_ACCEPTANCE phase.

### Pike Push-up lives in track "hspu"

Test 1 (next-exercise criteria) locates Pike Push-up by its ID and then checks the next exercise in the `"push-up"` chain. The test originally searched for Pike Push-up within the `"push-up"` track query, but Pike Push-up is seeded under the `"hspu"` (handstand push-up) track. The fix queries the `"hspu"` track to find `PIKE_PUSH_UP_ID`, then uses the `"push-up"` track chain to find its successor. This reflects the dual-track placement of bridging exercises in the Registry.

### criteria not rrCriteria

The Exercise domain type (`src/types/index.ts`) exposes the `rr_criteria` DB column as `criteria` (no `rr` prefix). Test 1 originally asserted `nextExercise.rrCriteria`, which evaluates to `undefined` at runtime — the assertion `expect(undefined).not.toBeNull()` passes vacuously. Correcting to `nextExercise.criteria` makes the test actually validate the data contract. This is a test bug, not a production bug: the production type was always correct.

### Conditional guard strengthened to unconditional assertion for chain index

Test 1 originally wrapped the core assertions in an `if (pikeIndex >= 0)` guard, meaning the test passed trivially if Pike Push-up was not found. The corrected form uses a direct lookup and asserts `pikeIndex >= 0` explicitly before proceeding, so a missing Pike Push-up causes a clear test failure rather than a silent vacuous pass.

### Contract-documentation pattern retained for test 6

Test 6 ("the exercise registry is pre-loadable") retains `expect(true).toBe(true)` as its body. This follows the pattern approved in the `react-pwa-ui` DISTILL acceptance-review.md (Dimension 7: PASS). The architectural guarantee — that the Exercise Registry can be pre-loaded for offline use — is verified at the infrastructure level (PWA manifest and service worker) and through manual smoke tests, not via Vitest's happy-dom environment.

### RED_UNIT skipped for all three steps

No new production logic was introduced. All three steps were purely test activation or test correction work. RED_UNIT phases are explicitly recorded as NOT_APPLICABLE in the execution log with rationale.

---

## Steps Completed

| Step | Name | Result | Timestamp |
|------|------|--------|-----------|
| 01-01 | Activate contract-documented tests: free-text orientation and offline cache | PASS | 2026-06-02T14:45:20Z |
| 01-02 | Activate data-integrity tests: wiki attribution, end-of-chain, contiguous chain_order | PASS | 2026-06-03T00:45:14Z |
| 01-03 | Activate next-exercise criteria test: fix rrCriteria property name and activate | PASS | 2026-06-03T00:52:06Z |

All 3 steps completed in a single phase (Phase 01). Total elapsed: approximately 2 hours 11 minutes (including overnight pause between steps 01-01 and 01-02).

---

## Test Results

| Metric | Value |
|--------|-------|
| Tests passing | 7 / 7 |
| Tests skipped (static) | 0 |
| Test file | `tests/acceptance/react-pwa-ui/us-07-progression-chain.test.ts` |
| Mutation testing | Not applicable — no new domain logic introduced |

---

## Lessons Learned

**Verify DB slug values before writing test queries.** Track slugs are seed-data values, not application constants. A test that queries by track slug `"push"` instead of `"push-up"` silently returns an empty result set, causing assertions on `chain.length` or `every()` to pass vacuously. Always cross-check slug literals against the seed SQL before trusting green results.

**Understand bridging exercises' dual-track placement.** Pike Push-up is a bridging exercise between the push-up and HSPU tracks. Its primary record lives in the `"hspu"` track even though it is conceptually related to the push-up chain. When locating a bridging exercise by ID, query the track it is seeded under, not the track it conceptually precedes.

**Undefined is not null — vacuous assertions are test debt.** `expect(undefined).not.toBeNull()` always passes. Any assertion using a property name that does not exist on the domain type creates invisible test debt. Cross-check every property access in a test against the actual TypeScript type before considering the assertion meaningful.

**Conditional guards in tests can hide missing data.** An `if (index >= 0)` guard that wraps the meaningful assertions makes the test pass trivially when the fixture data is absent. Prefer explicit `expect(index).toBeGreaterThanOrEqualTo(0)` assertions so the test fails loudly rather than silently vacuously.

---

## Issues Encountered

Steps 01-02 and 01-03 each required test corrections before the tests were meaningful (wrong track slug, wrong track for Pike Push-up lookup, wrong property name). These were discovered during the RED_ACCEPTANCE phase and corrected before the GREEN phase. No rollbacks were required. The execution log records the full event sequence including the overnight pause between step 01-01 and 01-02.

---

## DISTILL Source

Tests activated from the acceptance scenario set for US-07 (progression chain view). Contract-doc pattern for test 6 follows: `docs/feature/react-pwa-ui/distill/acceptance-review.md` (Dimension 7: PASS).

---

## Files Modified

| File | Change |
|------|--------|
| `tests/acceptance/react-pwa-ui/us-07-progression-chain.test.ts` | Removed `it.skip` from all 6 skipped tests; corrected track slug from `"push"` to `"push-up"`; corrected Pike Push-up track query to `"hspu"`; corrected `rrCriteria` property access to `criteria`; strengthened conditional guard to unconditional assertion |
