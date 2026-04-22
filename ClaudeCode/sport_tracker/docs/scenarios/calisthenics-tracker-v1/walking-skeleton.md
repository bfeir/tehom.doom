# Walking Skeleton — calisthenics-tracker-v1

**Feature**: calisthenics-tracker-v1
**Wave**: DISTILL
**Author**: Quinn (nw-acceptance-designer)
**Date**: 2026-04-13

---

## Walking Skeleton Definition

**"The One Decision"** — User logs a push session, receives a readiness signal with the RR criterion cited, and can view their position in the push progression chain. End-to-end in under 2 minutes on a mobile PWA.

### User Goal (stakeholder-readable)
Can Marco log a push session after his workout and know — with a cited reason — whether he is ready to advance, without consulting Reddit or a wiki?

### Stories in Scope
- US-01 (core): exercise autocomplete, sets/reps entry, session save
- US-02 (core): READY/NOT YET signal with cited RR criterion
- US-04 (MVP): push chain with current position

### Stories NOT in Walking Skeleton
Per DIS-04 and story-map.md walking skeleton scope:
- Form quality input (Release 1)
- REVIEW signal variant (Release 1)
- Full rationale accordion (Release 1)
- Undo advancement (Release 1)
- Pull/legs tracks (Release 2)
- Plateau warning (Release 2)
- Progress history chart (Release 2)
- AI coaching (Release 3, conditional)

---

## WS Strategy: B

**Strategy B: Real local adapters + skip costly externals**

Real: Supabase (local dev project), IndexedDB (jsdom), Vitest
Skipped: Claude API (not v1 scope)

All WS scenarios tagged: `@walking_skeleton @real-io`

---

## Adapter Coverage Audit

Every driven adapter must have at least one `@real-io` scenario. Audit:

| Adapter | Has @real-io scenario | Location |
|---------|----------------------|----------|
| `SupabaseSessionAdapter` / `IndexedDBSessionAdapter` | Yes | `walking-skeleton.test.ts` — offline path + online log |
| `SupabaseExerciseAdapter` | Yes | `walking-skeleton.test.ts` — exercise registry search + chain |
| `EdgeFunctionReadinessAdapter` | Yes | `walking-skeleton.test.ts` — readiness signal after log |
| `SupabaseProgressionAdapter` | Yes | `walking-skeleton.test.ts` + `us-04-progression-tree.test.ts` |

All adapters covered. Audit: PASS.

---

## Implementation Sequence

Software-crafter enables one scenario at a time, in this order:

1. **[Enable first]** `walking-skeleton.test.ts` — "finds Pike Push-up in the exercise registry by typing a partial name"
   - Wire `ExerciseRepository` against Supabase test project
   - Populate exercise registry seed data
   - Expected first failure: `Error("Not yet implemented -- RED scaffold")` from `beforeAll`

2. `walking-skeleton.test.ts` — "logs a push session with sets, reps, and form quality"
   - Wire `SessionRepository` against Supabase test project + jsdom IndexedDB

3. `walking-skeleton.test.ts` — "receives a readiness signal with the RR criterion cited after logging"
   - Wire `ReadinessEngine` with `EdgeFunctionReadinessAdapter`
   - Deploy `fn-readiness-engine` to local Supabase

4. `walking-skeleton.test.ts` — "can see their current position in the push progression chain"
   - Verify full chain data seeded in exercise registry

5. `walking-skeleton.test.ts` — "session is stored locally when the device is offline and syncs automatically on reconnect"
   - Wire `SyncCoordinator` with jsdom IndexedDB + real Supabase
   - Verify Background Sync / foreground reconnect handler

6. Enable US-01 focused scenarios one at a time
7. Enable US-02 focused scenarios one at a time
8. Enable US-03, US-04, US-05 focused scenarios one at a time

---

## Walking Skeleton Litmus Test

| Criterion | Result |
|-----------|--------|
| Title describes user goal, not technical flow | PASS — "Marco makes his first progression decision" |
| Given/When describe user actions, not system state setup | PASS — "When he searches for Pike Push-up" |
| Then describes user observations, not internal side effects | PASS — "readiness signal is NOT YET with streak 1 of 2" |
| Non-technical stakeholder can confirm "yes, that is what users need" | PASS — reviewable at demo |

---

## Demonstration Script (Sprint 3 Pilot)

1. Open PWA from iPhone home screen (cached service worker)
2. Type "pike" in exercise search → "Pike Push-up (PPP progression)" appears
3. Enter 3 sets of 8 reps, form quality 4/5, tap Save
4. Readiness signal appears: "NOT YET — 1 of 2 qualifying sessions · 3×8 at form ≥3/5 for 2 consecutive sessions · Source: r/BWF wiki"
5. Tap "View in Progression Tree" → push chain shows Pike Push-up highlighted as current
6. Turn off wifi, log another session → "Saved offline" indicator
7. Restore wifi → session syncs, signal updates

Total time: under 2 minutes. Demonstrates SC-01 (offline), DIS-06 (criterion cited), DIS-03 (informative signal).
