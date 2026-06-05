# Evolution: Fix Acceptance Test Failures

**Date**: 2026-06-05
**Feature ID**: fix-acceptance-test-failures
**Type**: Bug Fix (test infrastructure / seed data)

## Feature Summary

Fixed 4 pre-existing acceptance test failures caused entirely by seed data values and test fixture strings. No production application logic was changed. All 14 acceptance test files now pass (126/127 tests; 1 intentional skip for live-Supabase offline test).

## Steps Completed

### 01-01: exercises.sql — Seed Data Corrections
- Changed pike-push-up `targetReps` from 10 to 8 (matching RR wiki spec and test assertions)
- Added Deficit Wall HSPU at `chain_order=5` to satisfy test requiring >5 exercises in the hspu chain
- Renumbered freestanding-hspu to `chain_order=6`
- Re-applied seed via psql

### 01-02: us-02-readiness-signal.test.ts — Track Name and UUID Fixes
- Fixed 4 `findProgressionChain("push")` calls to `"hspu"` — "push" track does not exist in schema
- Fixed `FEET_ELEVATED_PPP_ID` population
- Fixed `advance()` UUID crash caused by incorrect track reference

### 01-03: us-03-progress-history.test.ts — Search String and Track Constraint Fixes
- Changed `search("rows")` to `search("row")` to match "Australian Pull-up (Row)" via ilike
- Changed `track:"pull"` to `track:"row"` in fallback insert — "pull" is not a valid CHECK value in schema

## Root Causes (from RCA)

| Root Cause | Location | Impact |
|------------|----------|--------|
| Seed data divergence | exercises.sql `targetReps=10` | Test asserting 8 failed at runtime |
| Track name mismatch | Test fixture used non-existent "push" track | findProgressionChain returned null, cascading failures |
| Search substring mismatch | ilike('%rows%') does not match 'row' | Australian Pull-up not found in search results |
| Schema CHECK violation | 'pull' not in track CHECK constraint values | Fallback insert rejected by database |
| Incomplete seed | hspu chain had 5 entries, test required >5 | chain boundary assertions failed |

## Lessons Learned

**Seed-test contract drift is silent until runtime.** A test asserting `targetReps=8` and a seed inserting `targetReps=10` compile and parse without error — the mismatch only surfaces as a runtime assertion failure. This class of divergence requires explicit contract testing between seed data and test fixtures.

**Track name validation should be centralised.** Tests referencing track identifiers directly (e.g., "push", "hspu", "row") must align with the schema CHECK constraint. A shared constants file or zod enum would catch mismatches at the TypeScript compilation stage rather than at test runtime.

**Acceptance tests are the canonical spec for seed data.** When acceptance tests and seed data disagree on a business value (targetReps), the test is correct — it reflects the documented domain rule (RR wiki). Seed data is the artifact to fix.

## Metrics

- Acceptance tests passing: 126/127 (1 intentional skip — live-Supabase offline scenario)
- Acceptance test files passing: 14/14
- Production application code changes: 0
- Files changed: 3 (exercises.sql, us-02-readiness-signal.test.ts, us-03-progress-history.test.ts)
