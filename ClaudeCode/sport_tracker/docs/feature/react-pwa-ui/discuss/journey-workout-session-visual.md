# Journey: Workout Session — Visual Map

**Feature**: react-pwa-ui
**Journey name**: workout-session
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-04-21
**Platform**: PWA, mobile-first (phone between sets, offline-first)
**Persona**: Marco — intermediate RR practitioner, 14 months training, outdoor park

---

## Journey Flow

```
TRIGGER: Marco opens the app at the park before starting his push workout
    |
    v
[Step 1]         [Step 2]              [Step 3]           [Step 4]         [Step 5]
 Auth Gate    →  Home / Session    →   Log a Set       →  Rest Timer    →  Readiness Card
                 Dashboard                                 Countdown
    |               |                     |                  |                 |
Feels:          Feels:               Feels:             Feels:           Feels:
Briefly         Ready                Efficient          Calm /           Informed /
uncertain       to start             and in flow        Resting          Curious
    |               |                     |                  |                 |
    v               v                     v                  v                 v
[Step 6]         [Step 7]             [Step 8]           [Step 9]
 Log Next Set → Close Session    →   History View    →  Progression
 (repeats 3-5)   (session saved)     (optional)         Chain View
                                                         (optional)
    |               |                     |                  |
Feels:          Feels:               Feels:             Feels:
In flow         Satisfied /          Oriented /         Equipped /
                accomplished         retrospective      confident
```

---

## Emotional Arc

```
Uncertainty (auth) → Ready (home) → Efficient (logging) → Calm (rest) →
  Informed (readiness card) → In flow (next set) → Satisfied (close session) →
    [Optional: Oriented (history) → Equipped (progression chain)]
```

**Arc pattern**: Confidence Building — user starts with mild setup friction (auth once), then enters
a repeating loop of small wins (log set → rest → readiness check) that builds confidence by the
end of the session. The final "Satisfied" state is earned through accumulated logged sets.

**Key emotional design rule**: The NOT YET readiness signal must feel informative, not punitive.
Show what is still needed. Never show a bare "not ready" without citing the specific gap.

---

## Step-by-Step Mockups

### Step 1: Auth Gate (first use only, or after session expiry)

```
+--------------------------------------------------+
| Calisthenics Tracker                             |
|                                                  |
|  Track your RR progression.                      |
|  Works offline. No spreadsheet required.         |
|                                                  |
|  [ Continue with Google ]                        |
|                                                  |
|  [ Sign in with email ]                          |
|                                                  |
|  ─────────────────────────────────               |
|  Don't have an account?  Create one              |
+--------------------------------------------------+
```

**Emotional state (entry)**: Briefly uncertain — is this safe, fast, worth it?
**Emotional state (exit)**: Authenticated — trust established, ready to train
**Error paths**: OAuth failure → email fallback offered; network offline → "Sign in requires a
connection — you can log without signing in after first setup"

---

### Step 2: Home / Session Dashboard

```
+--------------------------------------------------+
| Calisthenics Tracker       [2 queued ↑]         |
|                                                  |
|  Good morning, Marco.                            |
|  Last session: Pike Push-ups — 3d ago            |
|                                                  |
|  [ + Start New Session ]                         |
|                                                  |
|  ──────────  Recent  ──────────                  |
|  Pike Push-ups    3×8     3d ago                 |
|  Pull-up Negatives  3×5   5d ago                 |
|  Hollow Body     3×30s    5d ago                 |
|                                                  |
| [Log]  [History]  [Progression]                  |
+--------------------------------------------------+
```

**${last_exercise}** — source: sessions table, `logged_at DESC` for user
**${sync_indicator}** — source: IndexedDB queue depth
**Emotional state (entry)**: Neutral, arriving from outside
**Emotional state (exit)**: Ready — clear CTA, context is set
**Error paths**: No sessions yet → empty state: "No sessions yet. Tap + to log your first set."

---

### Step 3: Log a Set

```
+--------------------------------------------------+
| ← Session                                        |
|                                                  |
|  Exercise                                        |
|  [ Pike Push-ups (PPP)              ▼ ]          |
|                                                  |
|  Sets          Reps                              |
|  [ 3 ]         [ 8  ]                            |
|                                                  |
|  Form quality (optional)           RPE           |
|  [ ● ● ● ○ ○  Good ]              [ 6 ]         |
|                                                  |
|  Note (optional)                                 |
|  [ Felt strong, no shoulder pain      ]          |
|                                                  |
|  [ Save Set + Start Timer ]                      |
|                                                  |
+--------------------------------------------------+
```

**${exercise_name}** — source: exercises registry (autocomplete from `exercises.slug/name`)
**${sets}**, **${reps}** — user input; numeric pickers, large tap targets
**${form_quality}** — 1-5 star picker, maps to `sessions.form_quality`
**${rpe}** — 1-10 slider, maps to `sessions.rpe`
**Emotional state (entry)**: Ready, slightly rushed (between sets)
**Emotional state (exit)**: Efficient — one tap saves and starts the timer
**Error paths**: Exercise not in registry → free-text fallback; offline → saved to IndexedDB queue

---

### Step 4: Rest Timer

```
+--------------------------------------------------+
| Pike Push-ups — Set 3 of 3 saved                 |
|                                                  |
|           1:23                                   |
|        ┌────────┐                                |
|        │  REST  │    ← large, glanceable         |
|        └────────┘                                |
|                                                  |
|  [    Pause    ]   [  + 15s  ]  [  Skip  ]       |
|                                                  |
|  Default: 90 seconds                             |
|  [ Change default ]                              |
|                                                  |
| [Log]  [History]  [Progression]                  |
+--------------------------------------------------+
```

**${timer_duration}** — source: 90s default, user-configurable per session
**${sets_completed}** — source: current session in-memory count
**Emotional state (entry)**: Calm, recovering — just logged a set
**Emotional state (exit)**: Ready for next set (timer ends → auto-navigate or prompt)
**Error paths**: App backgrounded → timer keeps running (background execution or visual warning that
  timer continues); timer at 0 → gentle haptic + audible ping if possible

---

### Step 5: Readiness Card (mid-session, on demand)

```
+--------------------------------------------------+
| ← Session                   Readiness            |
|                                                  |
|  Pike Push-ups (PPP)                             |
|                                                  |
|  ┌──────────────────────────────────────┐        |
|  │  NOT YET                             │        |
|  │                                      │        |
|  │  Rep range: 3×5-8  ✓  (you: 3×8)   │        |
|  │  Consecutive sessions: 2 / 3 needed  │        |
|  │                                      │        |
|  │  1 more session at 3×8+ to advance   │        |
|  └──────────────────────────────────────┘        |
|                                                  |
|  [ View Progression Chain ]                      |
|  [ View History ]                                |
|                                                  |
| [Log]  [History]  [Progression]                  |
+--------------------------------------------------+
```

**${signal_state}** — source: fn-readiness-engine response (READY / NOT YET / REVIEW)
**${criterion_applied}** — source: fn-readiness-engine `criterion_applied` field
**${streak_current}** / **${streak_required}** — source: fn-readiness-engine response
**Emotional state (entry)**: Curious — "Did I hit the threshold?"
**Emotional state (exit)**: Informed — "I know exactly what I need"
**Error paths**: fn-readiness-engine unavailable (offline) → "Readiness check requires a connection.
  Your session is saved — check after syncing."

---

### Step 6: Log Next Set (repeating loop, Steps 3-5)

Same screen as Step 3. Exercise is pre-filled from last log entry. User adjusts reps if needed.

```
+--------------------------------------------------+
| ← Session                         2 sets logged  |
|                                                  |
|  Exercise                                        |
|  [ Pike Push-ups (PPP)              ▼ ]          |
|                                                  |
|  Sets          Reps                              |
|  [ 3 ]         [ 8  ]        ← pre-filled        |
|                                                  |
|  Note (optional)                                 |
|  [                                    ]          |
|                                                  |
|  [ Save Set + Start Timer ]                      |
|                                                  |
+--------------------------------------------------+
```

**Loop count**: Typically 3-5 sets per exercise pair. Each save writes to IndexedDB first.

---

### Step 7: Close Session

```
+--------------------------------------------------+
| Session complete                                 |
|                                                  |
|  Today's sets                                    |
|  Pike Push-ups    3×8 ×3 sets                   |
|  Pull-up Negative  3×5 ×3 sets                  |
|                                                  |
|  [ Done — Close Session ]                        |
|                                                  |
|  ─────────────────────────────────               |
|  Saved offline — will sync on reconnect   [↑]   |
|                                                  |
| [Log]  [History]  [Progression]                  |
+--------------------------------------------------+
```

**${session_summary}** — source: current session in-memory state (exercises, sets, reps)
**${sync_status}** — source: IndexedDB queue status
**Emotional state (entry)**: Tired, done, post-workout
**Emotional state (exit)**: Satisfied — summary seen, data captured, session closed
**Error paths**: Session already closed (crash recovery) → "You have an open session from earlier.
  Would you like to close it or continue?"

---

### Step 8: Exercise History View (optional, from home or session)

```
+--------------------------------------------------+
| ← Back               Pike Push-ups (PPP)         |
|                                                  |
|  Last 5 sessions                                 |
|  ┌─────────────────────────────────────────┐     |
|  │  Date       Sets  Reps  Form  Note      │     |
|  │  Apr 21     3     8     ●●●●○  Strong   │     |
|  │  Apr 18     3     8     ●●●○○  Tired    │     |
|  │  Apr 15     3     7     ●●●●○  --       │     |
|  │  Apr 12     3     6     ●●●○○  A bit ill│     |
|  │  Apr 09     3     5     ●●○○○  First try│     |
|  └─────────────────────────────────────────┘     |
|                                                  |
|  Readiness: NOT YET — 1 more session needed      |
|                                                  |
| [Log]  [History]  [Progression]                  |
+--------------------------------------------------+
```

**${history_rows}** — source: HistoryService.findHistory() → sessions WHERE exercise_id AND user_id,
  ordered by logged_at DESC, LIMIT 10 default
**Emotional state**: Oriented — seeing the pattern, retrospective awareness
**Error paths**: No history for exercise → "No sessions logged yet for this exercise."

---

### Step 9: Progression Chain View (optional)

```
+--------------------------------------------------+
| ← Back               Push Track                  |
|                                                  |
|  Wall Push-up         ✓ Completed                |
|  Incline Push-up      ✓ Completed                |
|  Standard Push-up     ✓ Completed                |
|  Pike Push-up (PPP)   ← You are here            |
|  Pseudo Planche PU    → Next                     |
|  Straddle Planche PU  · · ·                     |
|                                                  |
|  ─────────────────────────────────               |
|  Next: Pseudo Planche Push-up                    |
|  Criteria: 3×5-8 for 3 consecutive sessions      |
|  [ View full criteria ]                          |
|                                                  |
| [Log]  [History]  [Progression]                  |
+--------------------------------------------------+
```

**${current_exercise}** — source: user_progression table, track = 'push'
**${chain}** — source: ProgressionRepository.getCurrentProgression() →
  exercises WHERE track ORDER BY chain_order
**Emotional state**: Equipped — sees the road ahead, no external lookup needed
**Error paths**: Exercise not in chain (free-text) → "This exercise is not in the RR progression
  registry. Browse the full chain to find your current position."

---

## Error Path Summary

| Error | When | User sees | Recovery |
|-------|------|-----------|----------|
| Auth failure | Sign-in attempt | "Could not sign in. Try a different method or check your connection." | Email fallback offered |
| Offline — session save | No connectivity | "Saved offline — will sync when connected" (silent, no blocking) | Auto-sync on reconnect |
| Offline — readiness check | No connectivity | "Readiness check needs a connection. Session saved." | Check on reconnect |
| Exercise not found | Free-text entry | Free-text field accepted as fallback | None needed |
| Session already open | App crash / re-open | "Open session found. Continue or close it?" | User chooses |
| fn-readiness-engine error | Edge function failure | "Could not compute readiness. Try again." | Retry button |
| No history | New exercise | "No sessions logged yet for this exercise." | Log CTA |

---

## Integration Checkpoints

| Checkpoint | Validates | Artifact |
|------------|-----------|----------|
| IC-01 | Auth JWT flows to PostgREST and Edge Functions correctly | JWT token |
| IC-02 | Session save (online) writes to Postgres via PostgREST with correct user_id | session_id |
| IC-03 | Session save (offline) writes to IndexedDB and syncs on reconnect | offline_queue_entry |
| IC-04 | fn-readiness-engine called with session_id returns signal_state + criterion fields | readiness_response |
| IC-05 | HistoryService.findHistory() returns sessions for correct user_id + exercise_id | history_rows |
| IC-06 | ProgressionRepository.getCurrentProgression() returns ordered chain for user's track | progression_chain |
| IC-07 | Rest timer fires correctly in background / foreground on mobile browsers | timer_state |
