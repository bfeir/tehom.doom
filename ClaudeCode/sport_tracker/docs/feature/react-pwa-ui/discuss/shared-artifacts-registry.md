# Shared Artifacts Registry — react-pwa-ui / workout-session

**Feature**: react-pwa-ui
**Journey**: workout-session
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-04-21

Every `${variable}` appearing in journey mockups is documented here with its single source of truth
and all consumers. Untracked variables are the primary cause of horizontal integration failures.

---

## Registry

### jwt_token

| Field | Value |
|-------|-------|
| Source of truth | Supabase Auth — issued on successful OAuth or email sign-in |
| Owner | Supabase Auth / supabase-js client library (auto-refresh) |
| Integration risk | HIGH — if JWT is missing or expired, all API calls return 401 |
| Validation | Verify: PostgREST returns 200 (not 401) after sign-in |
| Consumers | All PostgREST calls (Authorization: Bearer), all Edge Function calls |
| Journey steps | 1 (produced), 2, 3, 5, 7, 8, 9 (consumed) |

---

### exercise_id

| Field | Value |
|-------|-------|
| Source of truth | `exercises` table — `exercises.id` (UUID) |
| Owner | exercises registry (pre-loaded, immutable per version_tag) |
| Integration risk | HIGH — exercise_id mismatch between log, readiness, history, and chain views produces split data |
| Validation | Autocomplete must resolve slug/name to `exercises.id`; free-text falls back to `exercise_name` with `exercise_id = NULL` |
| Consumers | sessions.exercise_id (write), fn-readiness-engine input, HistoryService filter, ProgressionRepository anchor |
| Journey steps | 3 (produced via autocomplete), 5, 8, 9 (consumed) |

---

### session_entry / session_id

| Field | Value |
|-------|-------|
| Source of truth | `sessions` table row (UUID primary key `gen_random_uuid()`) or IndexedDB queue entry |
| Owner | SessionPort (create, addEntry, close) |
| Integration risk | HIGH — session_id is the key input to fn-readiness-engine; wrong or missing ID produces incorrect signal |
| Validation | session_id returned from PostgREST insert must match sessions.id in DB |
| Consumers | fn-readiness-engine (input), session close summary, history rows |
| Journey steps | 3 (produced on Save), 5 (consumed as fn-readiness-engine input), 7, 8 |

---

### offline_queue_depth

| Field | Value |
|-------|-------|
| Source of truth | IndexedDB offline queue — count of unsynced session entries |
| Owner | SyncCoordinator (service worker) |
| Integration risk | MEDIUM — badge must reflect actual queue; stale count misleads user about sync state |
| Validation | Badge decrements exactly on successful PostgREST replay; never goes negative |
| Consumers | Home screen header badge, session close screen, log screen (implicit) |
| Journey steps | 2 (displayed), 3 (incremented on offline save), 7 (shown on close) |

---

### readiness_response

| Field | Value |
|-------|-------|
| Source of truth | fn-readiness-engine Edge Function response |
| Owner | fn-readiness-engine (Supabase Edge Function) |
| Integration risk | HIGH — readiness signal is the core value proposition; wrong signal = user makes wrong progression decision |
| Validation | Response schema: `{ signal_state: READY|NOT_YET|REVIEW, criterion_applied: string, streak_current: int, streak_required: int, next_exercise_id: UUID }` |
| Consumers | Readiness card (Step 5), history view readiness badge (Step 8) |
| Journey steps | 5 (produced and displayed), 8 (badge summary) |

---

### signal_state

| Field | Value |
|-------|-------|
| Source of truth | fn-readiness-engine `signal_state` field (enum: READY, NOT_YET, REVIEW) |
| Owner | fn-readiness-engine |
| Integration risk | HIGH — display text and CTA differ per signal state; wrong value produces wrong UX path |
| Validation | UI must handle all three states explicitly; no fallback to generic text |
| Consumers | Readiness card headline (Step 5) |
| Journey steps | 5 |

---

### timer_duration

| Field | Value |
|-------|-------|
| Source of truth | User preference — 90s default stored in app state (localStorage or Zustand), user-configurable |
| Owner | UI state (Zustand) — not stored in Supabase for v1 |
| Integration risk | LOW — incorrect default is annoying but not data-corrupting |
| Validation | Default = 90s on first use; persists across app restarts via localStorage |
| Consumers | Rest timer countdown display (Step 4) |
| Journey steps | 4 |

---

### sets_completed

| Field | Value |
|-------|-------|
| Source of truth | In-memory session state — count of saved session entries in current session |
| Owner | UI state (Zustand) — derived from sessions saved during current session |
| Integration risk | MEDIUM — incorrect count misleads user about how many sets logged |
| Validation | Matches actual number of session entry records for current session_id |
| Consumers | Rest timer header (Step 4), log screen counter (Steps 3, 6) |
| Journey steps | 3, 4, 6 |

---

### recent_sessions

| Field | Value |
|-------|-------|
| Source of truth | `sessions` table — ORDER BY logged_at DESC, LIMIT 3, WHERE user_id = auth.uid() |
| Owner | TanStack Query (server state cache) |
| Integration risk | MEDIUM — stale cache shows wrong recent sessions after offline sync |
| Validation | Cache invalidated on reconnect after sync completes; home screen refreshes automatically |
| Consumers | Home screen recent list (Step 2) |
| Journey steps | 2 |

---

### history_rows

| Field | Value |
|-------|-------|
| Source of truth | HistoryService.findHistory() — sessions WHERE user_id AND exercise_id ORDER BY logged_at DESC LIMIT 10 |
| Owner | HistoryService (port in domain layer) |
| Integration risk | MEDIUM — RLS must enforce user isolation; wrong filter = wrong data shown |
| Validation | PostgREST query must include `user_id=eq.{auth.uid()}` and `exercise_id=eq.{id}`; RLS double-enforces |
| Consumers | History view table (Step 8) |
| Journey steps | 8 |

---

### current_exercise

| Field | Value |
|-------|-------|
| Source of truth | `user_progression` table — WHERE user_id AND track, yields exercise_id |
| Owner | ProgressionRepository |
| Integration risk | MEDIUM — wrong current exercise = wrong "You are here" marker and wrong readiness anchor |
| Validation | user_progression.exercise_id must match a valid exercises.id with the correct track |
| Consumers | Progression chain view "You are here" marker (Step 9), readiness card context |
| Journey steps | 5, 9 |

---

### progression_chain

| Field | Value |
|-------|-------|
| Source of truth | ProgressionRepository.getCurrentProgression() — exercises WHERE track ORDER BY chain_order |
| Owner | ProgressionRepository (reads exercises table) |
| Integration risk | LOW — exercises table is static registry; chain order is seeded data, not user-generated |
| Validation | chain_order must be contiguous per track; no gaps (exercise A at order 3, B at order 5 with no 4 = UI gap) |
| Consumers | Progression chain view ordered list (Step 9) |
| Journey steps | 9 |

---

## Integration Risks Summary

| Risk Level | Artifact | Failure Description |
|------------|----------|---------------------|
| HIGH | jwt_token | 401 on all API calls; user blocked from app |
| HIGH | exercise_id | Data split between log, readiness, history, and chain views |
| HIGH | session_id | fn-readiness-engine gets wrong session; signal incorrect |
| HIGH | readiness_response | Wrong progression decision made by user |
| HIGH | signal_state | Wrong UX path shown (READY when NOT YET) |
| MEDIUM | offline_queue_depth | Stale badge misleads user about sync state |
| MEDIUM | recent_sessions | Stale home screen after offline sync |
| MEDIUM | history_rows | Wrong user's data shown if RLS misconfigured |
| MEDIUM | current_exercise | Wrong "You are here" position in chain |
| MEDIUM | sets_completed | Misleading set count in timer header |
| LOW | timer_duration | Wrong default rest time (annoying, not data-corrupting) |
| LOW | progression_chain | Gap in chain display (static data, validated on seed) |

---

## Validation Checklist

- [ ] IC-01: JWT included in Authorization header on first PostgREST call after sign-in
- [ ] IC-02: exercise_id resolves correctly from autocomplete to exercises.id UUID
- [ ] IC-03: session_id returned from PostgREST insert matches sessions.id in DB
- [ ] IC-04: IndexedDB queue depth badge matches actual queue length on all screens
- [ ] IC-05: fn-readiness-engine response includes all 5 required fields
- [ ] IC-06: signal_state is handled for all three values (READY, NOT_YET, REVIEW) in UI
- [ ] IC-07: HistoryService query includes both user_id and exercise_id filters
- [ ] IC-08: user_progression.exercise_id matches exercises.id with correct track
- [ ] IC-09: exercises chain_order is contiguous per track (no gaps in progression chain display)
- [ ] IC-10: timer_duration persists across app restarts via localStorage
