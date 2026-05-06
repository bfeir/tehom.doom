<!-- markdownlint-disable MD024 -->
# User Stories — react-pwa-ui

**Feature**: react-pwa-ui
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-04-21
**Platform**: Web PWA, mobile-first (React 18 + Vite + TypeScript strict)
**Personas**: Marco (primary user, self-trained RR practitioner, outdoor park), Luis (beta friend, more advanced)

---

## System Constraints

These cross-cutting constraints apply to every story in this feature. The solution-architect (DESIGN wave) must address all of them in the technical design.

| ID | Constraint | Source |
|----|------------|--------|
| SC-01 | All session writes must work offline. IndexedDB write queue + Supabase sync. No error shown on offline save. | C2 — outdoor park training confirmed |
| SC-02 | Log entry (exercise + sets + reps) must be completable in under 60 seconds. | C1 — pen+paper benchmark |
| SC-03 | TypeScript strict mode throughout. No any types in acceptance criteria scope. | CLAUDE.md |
| SC-04 | Free tier only — Supabase free + Cloudflare Pages. No features requiring paid tier. | CLAUDE.md |
| SC-05 | No social features in v1. All user data isolated by RLS (user_id = auth.uid()). | C4 — D4 wave decision |
| SC-06 | Mobile-first. Minimum touch targets 44×44px. Large text for glanceable mid-workout reads. | D6 — phone used between sets |

---

## UI-01: Auth (Sign Up / Sign In)

### Problem

Marco is an intermediate RR practitioner who wants to start using the calisthenics tracker. He finds it
disruptive to create accounts on apps that require lengthy registration forms — he abandoned previous
fitness apps at the sign-up screen.

### Who

- RR practitioner — first visit to the app OR returning after JWT expiry
- Context: at home before going to the park, or first time trying the app
- Motivation: get to the logging screen as fast as possible

### Solution

Standard Supabase Auth with Google OAuth as the primary path (one tap) and email/password as the
fallback. JWT auto-refreshed by supabase-js — user never sees a re-auth prompt during a session.

### Domain Examples

**1 — Happy Path (Google OAuth):** Marco opens the PWA link his friend shared, taps "Continue with
Google," selects his Gmail account (marco.fitness@gmail.com), and arrives at the home screen within
3 seconds. He never types a password.

**2 — Edge Case (email fallback):** Luis, Marco's friend, does not have a Google account linked to
his browser. He taps "Sign in with email," enters luis.bwf@proton.me and a password he creates, and
arrives at the home screen. He receives a confirmation email.

**3 — Error Path (offline first use):** Marco is at the park with no connectivity and opens the app
for the first time. He sees "Sign-in requires a connection — sign in at home first." He cannot proceed
until he has connectivity, but the message does not show a raw error code.

**4 — Returning user:** Marco signed in 2 days ago. He opens the app at the park. He goes directly
to the home screen — no auth prompt, no loading delay beyond the initial paint. supabase-js has
refreshed the JWT in the background.

### UAT Scenarios (BDD)

#### Scenario: First-time sign-in via Google OAuth reaches home screen quickly
Given Marco opens the PWA for the first time
When he taps "Continue with Google" and completes the OAuth flow
Then he arrives at the home screen within 3 seconds
And his display name or email is shown as confirmation of successful sign-in

#### Scenario: Email/password sign-up creates an account with isolated data
Given Luis opens the PWA for the first time and chooses email sign-up
When he enters luis.bwf@proton.me and a password and submits
Then his account is created and he arrives at the home screen
And a confirmation email is sent to luis.bwf@proton.me
And his data is isolated from Marco's data by row-level security

#### Scenario: Sign-in attempted offline shows a helpful message
Given Marco opens the PWA for the first time with no network connectivity
When the auth screen loads
Then he sees "Sign-in requires a connection. Please connect to the internet and try again."
And neither sign-in button triggers a loading state or error toast

#### Scenario: Returning user bypasses auth on reopen
Given Marco has signed in previously and his JWT has not expired
When he opens the app
Then he arrives directly at the home screen without seeing the auth screen

#### Scenario: Auth error shows recoverable guidance (not raw error code)
Given Marco attempts to sign in and Supabase Auth returns an error
When the error response is received
Then Marco sees a plain-language message such as "Could not sign in. Check your email and password, or try Google."
And he does not see a raw HTTP status code or stack trace

### Acceptance Criteria

- [ ] Google OAuth and email/password sign-in both produce a valid Supabase JWT
- [ ] Home screen reached within 3 seconds of OAuth completion (good connectivity)
- [ ] Returning user with valid JWT bypasses auth screen on reopen
- [ ] Offline first-time open shows helpful message (no raw error code)
- [ ] Auth error messages are plain language (no status codes, no stack traces)
- [ ] Each user's data is isolated — RLS enforced at Postgres level
- [ ] JWT expiry mid-session: auto-refresh attempted; if it fails, user sees "Your session expired — please sign in again" and offline queue entries are preserved (not lost)

### Outcome KPIs

- **Who**: New RR practitioners opening the app for the first time
- **Does what**: Complete sign-up and reach the log screen without abandoning
- **By how much**: 100% of beta users (1-3 people) complete onboarding in under 5 minutes
- **Measured by**: Observation during first beta session; Supabase Auth user count
- **Baseline**: No prior metric (new feature)

### Technical Notes

- Auth provider: Supabase Auth (Google OAuth + email/password) — no custom auth server
- JWT storage: handled by supabase-js client library (localStorage by default on web)
- Token auto-refresh: supabase-js handles this transparently; no application code needed
- RLS: all subsequent tables enforce `user_id = auth.uid()` at Postgres level
- Dependency: Supabase project configured with Google OAuth credentials (pre-existing from architecture)
- Port: No dedicated port — SessionPort, HistoryService etc. all receive JWT implicitly via supabase-js client

---

## UI-02: Start and Close a Session

### Problem

Marco is an RR practitioner who wants to track a complete workout. He finds it confusing to manage
an "open session" concept when apps do not make it clear whether a previous session is still open or
already closed — especially after a crash or if he forgot to close the app.

### Who

- RR practitioner — before and after each workout
- Context: home screen, pre-workout and post-workout
- Motivation: start logging as fast as possible; close cleanly to see session summary

### Solution

"Start New Session" button on home screen initialises a session state. "Close Session" finalises it
and shows a summary. Crash recovery: if an open session exists on app load, prompt to continue or
discard.

### Domain Examples

**1 — Happy Path:** Marco arrives at the park, opens the app, taps "Start New Session." The log
screen appears immediately. After training, he taps "Done — Close Session" and sees "Pike Push-ups
3×8 ×3 sets, Pull-up Negatives 3×5 ×3 sets." He taps confirm. Done.

**2 — Edge Case (crash recovery):** Marco's browser crashed mid-session yesterday. Today he opens
the app and sees "You have an open session from yesterday (Apr 20). Continue or close it?" He taps
Close to discard yesterday's incomplete data and starts fresh.

**3 — Edge Case (empty close):** Marco opens a session but immediately gets interrupted. He taps
Close without logging any sets. He sees "No sets logged. Close session without saving?" and confirms.
No empty session record is created.

### UAT Scenarios (BDD)

#### Scenario: New session starts from home screen
Given Marco is on the home screen
When he taps "Start New Session"
Then the log screen appears within 500 milliseconds
And he can immediately log a set

#### Scenario: Session closes with summary shown
Given Marco has logged 3 sets of Pike Push-ups and 3 sets of Pull-up Negatives
When he taps "Done — Close Session"
Then he sees a summary listing each exercise with total sets and reps
And the session is marked closed in the app

#### Scenario: Open session found on relaunch
Given Marco has an open session that was not closed (crash or forgotten)
When he relaunches the app
Then he sees "Open session found from [date]. Continue or close it?"
And he can choose to continue logging or discard and start fresh

#### Scenario: Empty session close requires confirmation
Given Marco started a session but logged no sets
When he taps "Done — Close Session"
Then he sees "No sets logged. Close session without saving?"
And the session is only closed if he confirms

#### Scenario: Session close while offline shows sync status
Given Marco trained offline at the park and has queued entries
When he taps "Done — Close Session"
Then the summary is shown as normal
And he sees "Saved offline — will sync on reconnect" with a queue count

### Acceptance Criteria

- [ ] "Start New Session" transitions to log screen in under 500ms
- [ ] Session close shows summary of all logged sets (exercise, sets, reps)
- [ ] Open session detection on relaunch: prompt to continue or discard
- [ ] Empty session close requires explicit confirmation (no silent discard)
- [ ] Offline session close shows sync-pending indicator with queue count
- [ ] No duplicate sessions created on crash-recovery continue path

### Outcome KPIs

- **Who**: Marco and beta users
- **Does what**: Complete a session (open → log sets → close) without confusion or data loss
- **By how much**: 0 lost sessions in beta (tracked via Supabase session records vs. beta observation log)
- **Measured by**: Supabase sessions table row count vs. beta user observation
- **Baseline**: No prior metric (new feature)

### Technical Notes

- Session state: managed in Zustand (in-memory); persisted to IndexedDB for crash recovery
- Open session detection: check IndexedDB for `session_status = 'open'` on app load
- SessionPort.create() called on "Start New Session"; SessionPort.close() called on "Done"
- No server-side session concept beyond the sessions table rows — "open" is a UI-state concern
- Dependency: UI-01 (Auth) must be complete; UI-03 (Log a Set) provides the entries shown in summary

---

## UI-03: Log a Set

### Problem

Marco is an RR practitioner who records each workout set. He finds it slow to log data in existing
apps — they require too many taps, have tiny input fields, and force him to remember what he logged
last time. He chose pen and paper because it is faster.

### Who

- RR practitioner — mid-workout between sets
- Context: phone in hand, 90-second rest window, park setting
- Motivation: capture exercise + sets + reps in one flow, faster than writing on paper

### Solution

One-screen log entry: exercise autocomplete from RR registry, numeric pickers for sets and reps
(large tap targets), optional form quality (1-5), optional RPE (1-10), optional text note. One-tap
save writes to Postgres (online) or IndexedDB (offline). Exercise pre-filled from last entry.

### Domain Examples

**1 — Happy Path:** Marco types "pike" — autocomplete shows "Pike Push-ups (PPP)." He taps it.
Sets and reps fields are ready. He enters 3 and 8. Taps "Save Set + Start Timer." Done in 12
seconds. The timer starts.

**2 — Edge Case (form quality note):** After his third set, Marco noticed his form broke down on the
last 2 reps. He gives form quality 3/5 and writes "Left shoulder dipped on final reps." This note
will appear in his history view and informs the readiness card (REVIEW signal if form_quality < 3
consistently).

**3 — Error Path (exercise not in registry):** Marco wants to log "Korean Dips" — not in the RR
registry. He types the full name, finds no autocomplete match. He continues typing and taps Save.
The entry is saved with `exercise_name = "Korean Dips"` and `exercise_id = NULL`. The readiness
card is not available for free-text exercises.

**4 — Edge Case (offline):** Marco is at the park. He saves a set. No connectivity. He sees nothing
unusual — the save completes in under 500ms. The entry is in the IndexedDB queue. He continues to
the next set.

**5 — Boundary (very high reps):** Marco logs 1 set of 25 reps for hollow body holds (timed). The
form accepts any positive integer. No upper bound validation — high reps are valid for some exercises.

### UAT Scenarios (BDD)

#### Scenario: Set logged with autocomplete exercise in under 30 seconds
Given Marco is on the log screen during a session
When he types "pike", selects "Pike Push-ups (PPP)" from autocomplete, enters 3 sets and 8 reps, and taps Save
Then the set is saved to his session
And the rest timer starts within 500 milliseconds of the save tap
And the sets-logged counter increments

#### Scenario: Exercise pre-filled from previous set
Given Marco just saved a set of Pike Push-ups
When the rest timer ends and he returns to the log screen
Then the exercise field is pre-filled with "Pike Push-ups (PPP)"
And the sets and reps fields are clear for new input

#### Scenario: Optional qualitative note saved with set
Given Marco is on the log screen
When he enters a note "Left shoulder dipped on final reps" and saves the set
Then the note is stored with the session entry
And it appears in the history view for this exercise

#### Scenario: Free-text exercise saved when not in registry
Given Marco types "Korean Dips" and no autocomplete match appears
When he completes the entry and taps Save
Then the set is saved with exercise_name "Korean Dips" and no exercise_id
And no error is shown

#### Scenario: Zero reps prevented by inline validation
Given Marco is on the log screen
When he enters 0 in the reps field and taps Save
Then an inline error appears below the reps field: "Enter at least 1 rep"
And the form is not submitted

#### Scenario: Set logged offline with no user-visible disruption
Given Marco has no network connectivity
When he logs a set normally
Then the set is saved to the offline queue within 500 milliseconds
And no error or warning is shown during the save
And the rest timer starts immediately

### Acceptance Criteria

- [ ] Exercise autocomplete returns matches from exercises table (slug and name search)
- [ ] Sets and reps fields use numeric pickers with large tap targets (min 44×44px)
- [ ] Exercise pre-filled from last saved entry in current session
- [ ] Save writes to Postgres (online) or IndexedDB (offline) within 500ms of tap
- [ ] Optional fields (form_quality, rpe, note) do not block save if empty
- [ ] Free-text exercise saves with exercise_name populated and exercise_id null
- [ ] Zero reps shows inline validation error; form not submitted
- [ ] Note field accepts up to 500 characters; truncation warning shown at 480 chars

### Outcome KPIs

- **Who**: Marco and beta users, mid-workout
- **Does what**: Log a complete set entry (exercise + sets + reps) faster than writing on paper
- **By how much**: Set logged in under 30 seconds on first use (pen-and-paper target is ~15s; app budget is 30s on first use)
- **Measured by**: Stopwatch observation during first beta session (not instrumented in v1)
- **Baseline**: Pen-and-paper estimated at ~15 seconds per set entry

### Technical Notes

- Port: SessionPort.addEntry(exercise_id, sets, reps, form_quality?, rpe?, note?)
- Online path: PostgREST POST /rest/v1/sessions with JWT
- Offline path: Write to IndexedDB queue; SyncCoordinator dequeues on reconnect
- exercise_id nullable (free-text fallback): sessions schema allows NULL exercise_id with exercise_name
- Autocomplete data: exercises table pre-fetched by service worker on app load (~50KB)
- form_quality maps to sessions.form_quality (SMALLINT 1-5)
- rpe maps to sessions.rpe (SMALLINT 1-10)
- Dependency: UI-01 (Auth), UI-02 (Session open); fn-readiness-engine read in UI-04

---

## UI-04: Readiness Card Display

### Problem

Marco is an RR practitioner who wants to know whether he has earned the right to advance to the
next exercise in the progression chain. He finds it frustrating to try to remember the RR rep-range
rule mid-workout and to second-guess whether his recent sessions actually met the criteria.

### Who

- RR practitioner — mid-session or just after closing a session
- Context: checking the readiness signal before deciding to progress or continue at current exercise
- Motivation: get a clear, cited answer to "Am I ready to progress?" without opening Reddit

### Solution

A readiness card that shows the signal state (READY / NOT YET / REVIEW) with the specific RR
criterion applied, current streak vs. required streak, and a plain-language description of what
is needed. Powered by fn-readiness-engine Edge Function. NOT YET is informative, not punitive.

### Domain Examples

**1 — NOT YET (common case):** Marco has logged 2 consecutive sessions at 3×8 Pike Push-ups. The
readiness card shows "NOT YET — 2 of 3 consecutive sessions at 3×5-8 completed. 1 more session at
3×8+ to advance." He feels informed, not judged.

**2 — READY (milestone):** Marco has logged 3 consecutive sessions at 3×8 Pike Push-ups. The card
shows "READY — Rep range met for 3 consecutive sessions. You can advance to Pseudo Planche Push-up."
A "View Progression Chain" button is visible.

**3 — REVIEW (form quality concern):** Marco has met the rep threshold but logged form_quality 2/5
in the last 2 sessions. The card shows "REVIEW — Rep range met, but form quality has been low. Focus
on form before advancing."

**4 — Error (Edge Function unavailable):** Marco is offline. He taps Readiness. He sees "Readiness
check needs a connection. Your session is saved — check after syncing." No crash, no blank state.

### UAT Scenarios (BDD)

#### Scenario: NOT YET signal shows specific gap
Given Marco has logged 2 consecutive sessions of Pike Push-ups at 3×8
When he opens the readiness card for Pike Push-ups via the session screen
Then the headline shows "NOT YET"
And the card shows the criterion: "Consecutive sessions: 2 of 3"
And the card shows the next step: "1 more session at 3×8+ to advance"

#### Scenario: READY signal prompts progression
Given Marco has logged 3 consecutive sessions of Pike Push-ups at 3×8+
When he opens the readiness card
Then the headline shows "READY"
And the criterion shown is "3 consecutive sessions at 3×5-8"
And a "View Progression Chain" button is visible below the card

#### Scenario: REVIEW signal provides form guidance
Given Marco has met the rep range but logged form_quality of 2 for the last 2 sessions
When he opens the readiness card
Then the headline shows "REVIEW"
And the card explains "Rep range met, form quality inconsistent. Focus on form before advancing."

#### Scenario: Readiness check offline shows helpful message
Given Marco has no network connectivity
When he taps the Readiness button
Then he sees "Readiness check needs a connection. Your session is saved."
And no error code or technical message is shown
And the rest of the session UI is unaffected

#### Scenario: First session readiness check provides orientation
Given Marco has just logged his first-ever session for an exercise
When he opens the readiness card
Then he sees "Log more sessions to see your readiness. Keep training at this level."
And the RR rep range for the current exercise is shown for reference

### Acceptance Criteria

- [ ] fn-readiness-engine called with session_id after set save (deferred until card tap, not blocking)
- [ ] READY signal: green headline + criterion met + progression CTA
- [ ] NOT YET signal: neutral headline + streak_current/streak_required + "N more sessions" guidance
- [ ] REVIEW signal: amber headline + rep range confirmation + form guidance copy
- [ ] Offline state: plain-language message, no raw error code or blank state
- [ ] Edge Function timeout (>5s): spinner then "Could not compute readiness. Try again."
- [ ] Readiness card accessible via bottom navigation at any point during a session, including while the rest timer is running; navigating to the readiness card does not stop the timer

### Outcome KPIs

- **Who**: Marco and beta users, after logging a set
- **Does what**: Check progression readiness without opening Reddit, RR wiki, or Google Sheets
- **By how much**: 0 external lookups for progression decisions during a beta session
- **Measured by**: Beta session observation (do they open another app or browser tab after seeing the card?)
- **Baseline**: Currently 3 tools consulted per progression check (Reddit + wiki + Google Sheet)

### Technical Notes

- Port: fn-readiness-engine Edge Function — input: session_id, output: { signal_state, criterion_applied, streak_current, streak_required, next_exercise_id }
- Edge Function timeout: 5 seconds (free tier limit); show spinner at 2s, error at 5s
- NOT called on every set save — called only when readiness card is tapped (avoids blocking mid-workout UX)
- signal_state enum: READY | NOT_YET | REVIEW (exact strings from Edge Function contract)
- next_exercise_id used by "View Progression Chain" CTA to deep-link to UI-07
- Dependency: UI-03 (session_id must exist before readiness check is meaningful)

---

## UI-05: Rest Timer

### Problem

Marco is an RR practitioner who opens a separate clock app for 90-second rest between every superset.
He finds it distracting to leave the training context to manage rest timing — the phone switches
apps, he sometimes forgets to come back, and his friend at the park frequently forgets rest times
entirely.

### Who

- RR practitioner — mid-workout, between sets
- Context: phone in hand after logging a set; need to track 90 seconds of rest
- Motivation: know when rest is over without watching the clock; stay in training context

### Solution

90-second countdown timer that auto-starts on set save. Displayed prominently (large, glanceable).
Pause, skip, and extend (+15s) controls available. Audio + visual ping on completion. Configurable
default duration, persisted to localStorage. Replaces the separate clock app.

### Domain Examples

**1 — Happy Path:** Marco saves a set of Pike Push-ups. The timer starts immediately showing "1:30."
He pockets his phone. At 90 seconds, a ping sounds and his phone vibrates. He picks it up, sees the
timer at 0:00, and logs his next set.

**2 — Edge Case (duration change):** Marco is doing heavier pull work today and wants 2-minute rests.
He taps "Change default" on the timer screen and sets 2:00. All subsequent timers in this session
use 2:00. Next session also defaults to 2:00 (persisted).

**3 — Edge Case (app backgrounded):** Marco saves a set and closes the app to check a message. The
timer continues running. When the timer reaches 0, he receives a push notification "Rest over — log
your next set" (if notifications permitted). The timer shows 0:00 when he returns.

**4 — Error (notifications not permitted):** Marco's browser has not been granted notification
permission. The timer still runs correctly. When it reaches 0, a visual flash + audio ping fires
(if the app is in foreground). If backgrounded, no system notification — but the timer state is
correct when he returns.

### UAT Scenarios (BDD)

#### Scenario: Timer auto-starts immediately after set save
Given Marco saves a set of Pike Push-ups during an active session
When the save completes
Then the rest timer starts within 500 milliseconds showing "1:30" countdown
And the timer display is prominent and legible (minimum 48px font for the time value)

#### Scenario: Timer completes with audio and visual cue in foreground
Given Marco's rest timer is counting down in the foreground
When the countdown reaches zero
Then the screen flashes or changes color
And an audio ping plays (if device audio is not silenced)
And the bottom navigation is accessible for logging the next set

#### Scenario: Marco extends the timer by 15 seconds
Given the rest timer shows 0:30 remaining
When Marco taps "+ 15s"
Then the timer shows 0:45 remaining
And continues counting down from the new time

#### Scenario: Marco skips the rest timer
Given the rest timer is running at 0:45 remaining
When Marco taps "Skip"
Then the timer stops immediately
And the session screen is accessible via bottom navigation

#### Scenario: Marco changes the default rest duration
Given Marco is on the rest timer screen
When he taps "Change default" and sets 2:00 minutes
Then the current timer updates to 2:00 if tapped at 0
And all subsequent timers in this session start at 2:00
And the 2:00 default persists across app restarts

#### Scenario: Timer runs while app is backgrounded with notification
Given Marco has granted notification permission
And the rest timer is running
When Marco minimises the app
And the timer reaches zero
Then he receives a system notification "Rest over — log your next set"
And the timer shows 0:00 when he returns to the app

### Acceptance Criteria

- [ ] Timer auto-starts within 500ms of set save completion (no user tap required)
- [ ] Timer display shows MM:SS format with minimum 48px font (glanceable)
- [ ] Audio ping + visual cue on timer completion (foreground)
- [ ] Pause, Skip, and +15s controls visible and reachable with one hand
- [ ] Default duration persists in localStorage across app restarts
- [ ] Timer continues running when app is backgrounded (Web Worker or Service Worker)
- [ ] System notification on timer completion if notification permission granted
- [ ] Timer state is accurate when user returns from background

### Outcome KPIs

- **Who**: Marco and beta users, mid-workout
- **Does what**: Manage rest periods without opening a separate clock app
- **By how much**: 0 external timer app opens observed during a beta session (100% displacement)
- **Measured by**: Beta session observation
- **Baseline**: Separate clock app opened every session for every superset rest (3-5 times per session)

### Technical Notes

- Timer implementation: JS interval in a Web Worker (survives app backgrounding in most browsers)
- Background notification: Web Push API (requires VAPID key setup in Cloudflare Pages / Supabase Edge)
  — considered a nice-to-have; core timer functionality works without it
- Duration storage: Zustand (session) + localStorage (persistence across restarts)
- No server-side component — purely client-side UI state
- Dependency: UI-03 (timer starts after set save event)

---

## UI-06: Exercise History View

### Problem

Marco is an RR practitioner who reviews his training log before each session to see what he did last
time. He currently uses a self-designed paper grid (exercises as columns, sessions as rows) to spot
trends. He finds it tedious to scan back through paper pages and cannot see patterns across more
than a few sessions at a glance.

### Who

- RR practitioner — before or after a session, checking volume trend for an exercise
- Context: home screen or during a session, checking past performance for a specific exercise
- Motivation: see whether volume is improving, check the note from last session, verify streak count

### Solution

A history view showing the last 10 sessions for a selected exercise in a table format: date, sets,
reps, form quality, note. Mirrors the paper grid mental model. Readiness status shown below the table.
Cached for offline access.

### Domain Examples

**1 — Happy Path:** Marco navigates to History and selects "Pike Push-ups (PPP)." He sees the last 5
sessions: Apr 21 (3×8, form 4/5, "Strong"), Apr 18 (3×8, form 3/5, "Tired"), Apr 15 (3×7), Apr 12
(3×6, "A bit ill"), Apr 9 (3×5, "First try"). He can see the reps climbing over time.

**2 — Edge Case (offline):** Marco is at the park with no connectivity. He opens History. He sees
the cached data from his last sync — labelled "Offline — data as of Apr 21." Current session data
not yet synced is not shown (it is in the queue).

**3 — Error Path (no history):** Marco selects a new exercise he has never logged. He sees "No
sessions logged yet for Pike Push-ups. Log your first set to start tracking."

### UAT Scenarios (BDD)

#### Scenario: History table shows last sessions for an exercise
Given Marco has logged 5 sessions of Pike Push-ups
When he navigates to History and selects Pike Push-ups
Then he sees a table with the last 5 sessions
And each row shows: date, sets, reps, form quality (1-5), and the note field (truncated to 40 chars)
And the readiness status is shown below the table

#### Scenario: History available offline with cache indicator
Given Marco has no connectivity but the app has cached session data
When he navigates to History and selects Pike Push-ups
Then he sees the cached session data
And an offline indicator shows "Offline — data as of [last sync date]"

#### Scenario: Empty history state for new exercise
Given Marco selects "Handstand Push-up" which he has never logged
When the history screen loads
Then he sees "No sessions logged yet for Handstand Push-up."
And a "Log your first set" CTA is visible

#### Scenario: History is filtered to Marco's data only
Given Marco and Luis both have accounts
When Marco opens History for Pike Push-ups
Then he sees only his own sessions
And Luis's sessions are never included

### Acceptance Criteria

- [ ] History table shows last 10 sessions for selected exercise (user_id AND exercise_id filter)
- [ ] Each row: date, sets, reps, form quality, note (truncated to 40 chars with "..." if longer)
- [ ] Readiness status badge shown below table (same signal as readiness card)
- [ ] Offline: cached data shown with "Offline — data as of [date]" indicator
- [ ] Empty state: helpful message + Log CTA
- [ ] Data isolated to current user — RLS enforces at DB level

### Outcome KPIs

- **Who**: Marco and beta users
- **Does what**: Check session volume trend without consulting a paper log or spreadsheet
- **By how much**: 0 times Marco opens the paper log or Google Sheet to check history during beta
- **Measured by**: Beta session observation
- **Baseline**: Paper log consulted before every session (~30 seconds per lookup)

### Technical Notes

- Port: HistoryService.findHistory(exercise_id, user_id, limit=10) → sessions rows
- PostgREST query: GET /rest/v1/sessions?exercise_id=eq.{id}&user_id=eq.{auth.uid()}&order=logged_at.desc&limit=10
- RLS enforces user isolation — PostgREST query cannot return other users' rows
- Offline: service worker caches last successful history response per exercise_id
- Dependency: UI-01 (Auth), UI-03 (data must exist in sessions table)

---

## UI-07: Progression Chain View

### Problem

Marco is an RR practitioner who wants to know what exercise comes next in the push/pull/core chain.
He currently searches Reddit, the RR wiki, and a Google Sheets reference — three separate tools —
every time he is ready to progress. He cannot recall the full chain from memory.

### Who

- RR practitioner — when considering progression or curious about the road ahead
- Context: mid-session or post-session, after seeing a READY or NOT YET readiness signal
- Motivation: know what comes next in the chain without leaving the app

### Solution

An in-app view of the RR progression chain for each track (push / pull / legs / skill). Current
exercise is marked. Next exercise is highlighted with its RR criteria. Criteria sourced from the
exercises registry (pre-loaded). Eliminates Reddit / wiki / spreadsheet lookups.

### Domain Examples

**1 — Happy Path:** Marco navigates to Progression. He sees the push chain: Wall Push-up (done) →
Incline Push-up (done) → Standard Push-up (done) → Pike Push-up PPP (← You are here) → Pseudo
Planche Push-up (→ Next). He taps the Next exercise and reads its criteria: "3×5-8 for 3 consecutive
sessions." He did not need to open a browser tab.

**2 — Edge Case (free-text exercise):** Marco logged "Korean Dips" which is not in the registry. He
views the Progression tab. He sees "Korean Dips is not in the RR progression registry." The standard
push chain is shown so he can orient himself manually.

**3 — Edge Case (end of chain):** Marco is at the end of the tracked push chain. He sees "You are
at the end of the currently tracked push progression. Advanced skills will be added in a future
update." No dead end, no blank screen.

**4 — Offline:** Marco views Progression offline. The exercises registry is pre-cached by the service
worker on app load. The full chain loads without a network call.

### UAT Scenarios (BDD)

#### Scenario: Progression chain shows current position and next exercise
Given Marco's current push exercise is Pike Push-ups (PPP)
When he navigates to the Progression tab
Then he sees the full push chain from beginner to advanced
And Pike Push-ups is marked as "You are here"
And Pseudo Planche Push-up is marked as "Next" with its RR criteria visible

#### Scenario: Next exercise criteria visible without extra navigation
Given Marco is viewing the Progression tab
When he looks at the next exercise (Pseudo Planche Push-up)
Then he sees the rep range and consecutive sessions required
And the RR wiki URL is shown as the source citation

#### Scenario: Free-text exercise shows orientation message
Given Marco logged "Korean Dips" as a free-text exercise
When he views the Progression tab
Then he sees "Korean Dips is not in the RR progression registry"
And the standard push chain is displayed for manual orientation

#### Scenario: Progression chain available offline
Given Marco has no connectivity
When he opens the Progression tab
Then the full chain loads from the cached exercises registry
And no network call is required

#### Scenario: End of chain handled gracefully
Given Marco is at the last exercise in the tracked push chain
When he views the Progression tab
Then he sees "You are at the end of the currently tracked push progression"
And a message explains that advanced skills will be added in a future update

### Acceptance Criteria

- [ ] Progression chain shows exercises in chain_order ascending for selected track
- [ ] Current exercise (from user_progression) marked with "You are here"
- [ ] Next exercise (chain_order + 1) marked as "Next" with rr_criteria fields visible
- [ ] RR wiki URL (exercises.rr_wiki_url) shown as source citation for criteria
- [ ] Free-text exercise: orientation message + standard chain shown
- [ ] End of chain: graceful message, no blank screen
- [ ] Chain loads offline from service worker cached exercises registry

### Outcome KPIs

- **Who**: Marco and beta users
- **Does what**: Look up the next exercise in the progression chain without opening external sources
- **By how much**: 0 times external sources (Reddit, RR wiki, Google Sheets) consulted for progression lookup during a beta session
- **Measured by**: Beta session observation
- **Baseline**: 3 external tools consulted per progression lookup

### Technical Notes

- Port: ProgressionRepository.getCurrentProgression(user_id, track) → ordered exercises with current marker
- Data: exercises table (pre-seeded RR registry, pre-cached by service worker on app load, ~50KB)
- user_progression table provides current exercise_id per user per track
- chain_order must be contiguous per track (seeded data — validate on seed, not at runtime)
- rr_wiki_url shown as attribution per exercises table constraint SC-03
- Dependency: UI-01 (Auth — user_id needed for user_progression query)

---

## UI-08: Offline Session Logging

### Problem

Marco is an RR practitioner who trains at an outdoor calisthenics park with no guaranteed wifi. He
needs to log sets during his workout. If the app shows errors when offline, or if sessions are lost
when he reconnects, the app is less reliable than pen and paper — and he will not use it.

### Who

- RR practitioner — outdoor park setting, no wifi, mid-workout
- Context: active session logging with no connectivity
- Motivation: log sets without any interruption; trust that data will not be lost

### Solution

IndexedDB write queue for all session writes. SyncCoordinator dequeues and replays to PostgREST on
reconnect. Offline badge in UI (never blocking). Silent save (no error, no warning during offline
write). Service worker caches exercise registry and recent history for offline read access.

### Domain Examples

**1 — Happy Path (full offline session):** Marco arrives at the park. No wifi. He opens the app
(loads from service worker cache). He logs 6 sets across 2 exercises. All save instantly. Each save
increments the "[6 queued]" badge. He takes the bus home. As soon as his phone connects to home
wifi, the SyncCoordinator dequeues all 6 entries to Postgres in order. The badge disappears. He
opens the app and sees his session in the history view.

**2 — Edge Case (partial session offline):** Marco starts his session online at home (2 sets logged
to Postgres). He walks to the park — connection drops. He logs 4 more sets offline. On reconnect,
only the 4 queued entries sync (the first 2 were already written). No duplicates.

**3 — Error Path (sync failure on reconnect):** The Supabase PostgREST endpoint returns a 500
error during sync replay. The SyncCoordinator retries after 30 seconds (exponential backoff, max 3
retries). The badge remains showing the queued count. Marco sees no error — the retry is silent. If
all retries fail, the badge persists and Marco can see on the home screen that sync is still pending.

### UAT Scenarios (BDD)

#### Scenario: Set logged offline saves silently with no error
Given Marco has no network connectivity
When he logs a set with exercise, sets, and reps and taps Save
Then the set is saved to the offline queue within 500 milliseconds
And no error message or warning toast appears
And the rest timer starts immediately

#### Scenario: Offline queue badge increments per logged set
Given Marco is offline and in an active session
When he logs a second set (2 total queued)
Then the header badge shows "[2 queued]"
And the badge increments with each subsequent set

#### Scenario: Queued sessions sync in order on reconnect
Given Marco has 4 sessions queued offline
When network connectivity is restored
Then the SyncCoordinator replays the 4 entries to PostgREST in chronological order
And no duplicate entries appear in the sessions table
And the offline badge clears to zero

#### Scenario: PWA loads from cache when offline
Given Marco has previously opened the app with connectivity
When he opens the app at the park with no connectivity
Then the app loads fully from the service worker cache
And the exercise autocomplete works from the cached exercises registry
And recent history loads from cached data

#### Scenario: App installs to home screen via PWA prompt
Given Marco opens the app in a mobile browser that supports PWA install
When the browser shows "Add to Home Screen" prompt
Then Marco can add the app to his home screen
And subsequent launches open in standalone mode (no browser chrome)

### Acceptance Criteria

- [ ] Offline set save: IndexedDB write completes in under 500ms; no error shown to user
- [ ] Offline queue badge accurately reflects IndexedDB queue depth on all relevant screens
- [ ] Sync on reconnect: entries replayed in chronological order; no duplicates in sessions table
- [ ] Sync retry on PostgREST error: exponential backoff, max 3 retries; silent during retry attempts; after max retries exhausted, badge remains visible and a tap shows "Sync failed. Check your connection and tap to retry."
- [ ] Exercise registry served from service worker cache offline (~50KB, refreshed on app update)
- [ ] Recent session history available offline from service worker cache
- [ ] PWA manifest configured for home screen install (manifest.json with name, icons, standalone display)
- [ ] Offline queue survives app restart (IndexedDB persists across browser close)

### Outcome KPIs

- **Who**: Marco at outdoor park
- **Does what**: Complete a full workout session with no connectivity and no data loss
- **By how much**: 0 lost sessions across all beta park workouts
- **Measured by**: Compare IndexedDB queue depth before/after park session to Postgres row count after sync
- **Baseline**: 0 data loss guarantee (pen+paper never loses data — app must match this)

### Technical Notes

- IndexedDB schema: offline_queue table { id, session_id, exercise_id, exercise_name, sets, reps, form_quality, rpe, note, logged_at, created_locally_at }
- SyncCoordinator: service worker Background Sync API (with foreground reconnect handler fallback)
- Conflict strategy: LWW on (user_id, exercise_id, logged_at) — single device per user in v1
- Service worker caching strategy: exercises registry (cache-first, update on new app version), session history (network-first with cache fallback)
- PWA manifest: required for home screen install; vite-plugin-pwa handles generation
- Dependency: UI-03 (save path wraps IndexedDB write before PostgREST); UI-01 (Auth JWT needed for sync replay)
