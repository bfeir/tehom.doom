# Journey: Progression Decision — Visual Map

**Feature**: calisthenics-tracker-v1
**Wave**: DISCUSS
**Journey**: Progression Decision
**Persona**: Marco — intermediate RR practitioner, 14 months training, follows r/BWF RR, used Google Sheets for 7 months
**Date**: 2026-04-13

---

## Journey Overview

```
TRIGGER: Finishes a push workout set — wonders "Was that enough to progress?"
    |
    v
[Step 1]        [Step 2]          [Step 3]           [Step 4]          [Step 5]
Log Session  →  View Readiness →  Read Rationale  →  Decision Made  →  (optional) Tree
                Signal                                                   Navigator
    |               |                  |                  |                  |
Feels:          Feels:             Feels:             Feels:            Feels:
Neutral /       Curious /          Understanding /    Confident /       Oriented /
Routine         Alert              Informed           Resolved          Equipped
```

**Emotional arc**: Uncertainty → Neutral (logging) → Curiosity (signal appears) → Understanding (rationale read) → Confidence (decision made)

---

## Step 1: Log the Session

**Trigger**: Marco finishes his push day — pike push-ups as main push exercise, 3 sets

**Emotional state**: Neutral, slightly distracted (gym noise, sweaty). Wants this to be fast.

**User actions**:
1. Opens the PWA from home screen (installed as PWA on his iPhone)
2. Taps "+ New Session"
3. Types "pike" — autocomplete shows "Pike Push-up (PPP progression)" and "Pike Push-up Hold"
4. Selects "Pike Push-up (PPP progression)"
5. Enters sets and reps: 3×8
6. Taps form quality: 4/5 (good form, slight hip hike on last rep)
7. Optional: enters RPE 7
8. Taps "Save Session" — auto-saves immediately

**UI Mockup — Session Logging Screen**:

```
┌─────────────────────────────────────────────┐
│  ← Today's Session            Wed Apr 13    │
│─────────────────────────────────────────────│
│                                             │
│  Exercise                                   │
│  ┌─────────────────────────────────────┐    │
│  │ pike                            [×] │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ Pike Push-up (PPP progression)  ✓   │    │
│  │ Pike Push-up Hold               →   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Sets × Reps                               │
│  ┌────────┐   ┌────────┐                   │
│  │   3    │ × │   8    │   + Add set       │
│  └────────┘   └────────┘                   │
│                                             │
│  Form Quality (optional)                    │
│  ○ ○ ○ ● ○    4 / 5                        │
│                                             │
│  RPE (optional)                             │
│  ─────────●──  7                            │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │          Save Session               │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Shared artifacts produced**: `session_id`, `exercise_id` (Pike Push-up / PPP progression), `sets=3`, `reps=8`, `form_quality=4`, `rpe=7`, `session_date`

**Integration checkpoint**: Exercise name must resolve to a canonical RR exercise record with associated progression criteria. If "Pike Push-up (PPP progression)" is not in the exercise registry, the readiness engine cannot evaluate this session.

**Failure modes**:
- Exercise not found in autocomplete (user trains a variation not in RR library)
- Offline — app must queue save and sync when connected

---

## Step 2: View Readiness Signal

**Trigger**: Session save completes — readiness signal appears automatically as a result card below the saved session

**Emotional state**: Shifts from neutral/routine to curious. "What does it say?"

**User actions**:
1. Sees the readiness signal card slide in below the session summary
2. Reads the headline signal: "NOT YET — 1 more session needed"
3. Sees the criterion summary (collapsed by default)
4. (Optional) taps to expand the full rationale

**UI Mockup — Readiness Signal Card**:

```
┌─────────────────────────────────────────────┐
│  Session saved ✓   Pike Push-up  3×8  RPE 7  │
│─────────────────────────────────────────────│
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │  ⏳  NOT YET                        │    │
│  │                                     │    │
│  │  1 more qualifying session needed   │    │
│  │                                     │    │
│  │  RR requires: 3×8 at form ≥ 3/5    │    │
│  │  for 2 consecutive sessions        │    │
│  │                                     │    │
│  │  Your streak: 1 of 2  ●○            │    │
│  │                                     │    │
│  │  ▸ See full rationale               │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Next exercise if you advance:              │
│  Pike Push-up with Feet Elevated (PPP)      │
│  ──────────────────────────────────────     │
│  [ View in Progression Tree ]               │
└─────────────────────────────────────────────┘
```

**Signal states and visual treatment**:

```
READY signal:
┌──────────────────────────────────────────┐
│                                          │
│  ✅  READY TO ADVANCE                   │
│                                          │
│  You have met RR criteria for            │
│  Pike Push-up (PPP progression)          │
│                                          │
│  Met: 3×8 at form ≥ 3/5 × 2 sessions   │
│                                          │
│  Suggested next: Feet Elevated PPP       │
│                                          │
└──────────────────────────────────────────┘

NOT YET signal:
┌──────────────────────────────────────────┐
│                                          │
│  ⏳  NOT YET                            │
│                                          │
│  1 more qualifying session needed        │
│  [progress bar: 1 of 2]                  │
│                                          │
└──────────────────────────────────────────┘

REVIEW signal:
┌──────────────────────────────────────────┐
│                                          │
│  🔍  REVIEW RECOMMENDED                 │
│                                          │
│  Your reps are consistent but your      │
│  form scores vary (3, 4, 2, 4).         │
│  Consider form focus before advancing.  │
│                                          │
└──────────────────────────────────────────┘
```

**Shared artifacts consumed**: `exercise_id`, `session_history` (last N sessions for this exercise), `rr_criteria` (rep target, form threshold, consecutive sessions required)

**Shared artifacts produced**: `readiness_signal` (READY / NOT YET / REVIEW), `readiness_rationale` (criterion applied, current streak, gap remaining)

**Failure modes**:
- Insufficient data for signal (< 1 session logged — show "Log one more session to see your readiness")
- Exercise has no RR criteria mapped (show "No RR advancement criteria found for this exercise — see wiki")

---

## Step 3: Read the Rationale

**Trigger**: Marco taps "See full rationale" on the readiness card

**Emotional state**: Shifts to understanding. "Why does it say that? Is it right?"

**User actions**:
1. Expands the rationale accordion
2. Reads the criterion that was applied
3. Sees the session-by-session evidence table
4. Sees the RR source citation with a link to the wiki

**UI Mockup — Expanded Rationale**:

```
┌─────────────────────────────────────────────┐
│  ▾ Full rationale                           │
│─────────────────────────────────────────────│
│                                             │
│  Criterion applied:                         │
│  "Complete 3×8 with form quality ≥ 3/5     │
│  for 2 consecutive sessions"               │
│                                             │
│  Source: r/BWF Recommended Routine wiki ↗  │
│                                             │
│  Your recent sessions:                      │
│  ┌────────────────────────────────────┐     │
│  │ Date       Reps   Form   Qualifies │     │
│  │ Apr 10     3×8    4/5    ✓         │     │
│  │ Apr 13     3×8    4/5    ✓ ← today │     │
│  │ Apr 7      3×6    3/5    ✗         │     │
│  └────────────────────────────────────┘     │
│                                             │
│  Streak: 2 of 2 consecutive ✓✓             │
│                                             │
│  ⚠  Wait — this session counted.           │
│  This was session 2. You ARE ready.         │
│  [Signal updated to READY]                  │
│                                             │
└─────────────────────────────────────────────┘
```

Note: The expanded rationale may reveal that the initial signal was computed before the current session was incorporated. Signal should re-evaluate in real-time when expanded.

**Shared artifacts consumed**: `session_history` (with dates, reps, form scores), `rr_criteria`, `readiness_rationale`

**Failure modes**:
- RR wiki link returns 404 (cached citation must remain visible; link is supplementary)
- Rationale refers to a criterion the user disputes (show "Disagree with this criterion? See the RR wiki for the full rule")

---

## Step 4: Decision Made

**Trigger**: Marco reads the rationale and understands why READY (or NOT YET). The ambiguity is resolved.

**Emotional state**: Confident, resolved. "OK — I know what to do next session."

**User actions**:
- If READY: taps "Advance to [next exercise]" → progression tree updates, new exercise becomes active
- If NOT YET: closes the card and notes the requirement. Knows what to bring to the next session.
- Either way: Marco closes the app knowing exactly where he stands.

**UI Mockup — Decision Action (READY state)**:

```
┌─────────────────────────────────────────────┐
│  ✅  READY TO ADVANCE                       │
│─────────────────────────────────────────────│
│                                             │
│  You've met RR criteria for:               │
│  Pike Push-up (PPP progression)            │
│                                             │
│  Next exercise:                             │
│  Pike Push-up with Feet Elevated (PPP)     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │      ▶ Advance to Feet Elevated PPP │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │      Not yet — I'll decide later    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  "Advancing means your next push day       │
│   will start with Feet Elevated PPP        │
│   as your primary push exercise."          │
└─────────────────────────────────────────────┘
```

**Shared artifacts produced**: `current_exercise` (updated if user advances), `progression_event` (date + exercise + from/to)

**Failure modes**:
- User advances but changes their mind (must be reversible — undo within 24 hours)
- User dismisses without deciding (current exercise unchanged; signal shown again next session)

---

## Step 5: RR Progression Tree (Optional Navigation)

**Trigger**: Marco taps "View in Progression Tree" from the readiness card

**Emotional state**: Oriented, exploring. "Where am I in the overall progression? What's the bigger picture?"

**User actions**:
1. Opens the progression tree
2. Sees his current position highlighted in the push progression chain
3. Sees exercises behind him (completed), his current exercise, and exercises ahead
4. Can tap any exercise to see its RR criteria

**UI Mockup — Progression Tree View**:

```
┌─────────────────────────────────────────────┐
│  ← Push Progression               Apr 13    │
│─────────────────────────────────────────────│
│                                             │
│  Your progression chain:                   │
│                                             │
│  ✓ Full Push-up       3×10  completed      │
│  ✓ Diamond Push-up    3×8   completed      │
│  ✓ Archer Push-up     3×5   completed      │
│  ● Pike Push-up       3×8   CURRENT        │  ← highlighted
│  ○ PPP (feet elevated)  —   next           │
│  ○ Wall Handstand P-up  —   future         │
│  ○ Handstand Push-up    —   future         │
│                                             │
│  [ Pike Push-up ]                           │
│  RR criteria: 3×8 at form ≥3/5 × 2 sessions│
│  Source: r/BWF RR wiki ↗                    │
│─────────────────────────────────────────────│
│  3 exercises completed  ●●●○○○○             │
└─────────────────────────────────────────────┘
```

**Shared artifacts consumed**: `current_exercise`, `progression_history`, `rr_progression_chain` (ordered exercise list for user's active tracks)

**Failure modes**:
- User's progression chain is not configured (show setup flow for first-time users)
- An exercise in the chain has no RR criteria mapped

---

## Emotional Arc — Annotated

```
Emotion
  │
10│                         ╔════╗  CONFIDENCE — "I know what to do"
  │                    ╔════╝    ╚════════════
  │                  UNDERSTANDING
  │              ╔════╝
 5│   ╔══════════╝
  │   CURIOSITY — signal appears
  │ NEUTRAL — logging (fast, familiar)
  │
  ├───────────────────────────────────────────── Journey steps
      Step 1       Step 2       Step 3       Step 4       Step 5
      Log         Signal       Rationale    Decision     Tree
```

**Design note**: The journey must never dip below neutral. The NOT YET signal must not feel punitive — it is informative. Copy must frame NOT YET as "here's exactly what you need" not "you failed." The REVIEW signal must feel like helpful guidance, not ambiguity or confusion.

---

## Integration Summary

| Data | Source | Consumers | Risk |
|------|--------|-----------|------|
| `exercise_id` | Exercise registry (RR canonical list) | Session logger, Readiness engine, Tree navigator | HIGH — must cover all named RR exercises |
| `rr_criteria` | RR wiki (ingested, parsed, stored) | Readiness engine, Rationale view | HIGH — stale criteria break signal accuracy |
| `session_history` | Session log (user data) | Readiness engine, Rep trend analysis, History view | HIGH — offline log must sync before signal computes |
| `readiness_signal` | Readiness engine (computed) | Readiness card, History annotations | MEDIUM — re-computation must be near-real-time |
| `current_exercise` | User progression state | Progression tree, Session logger autocomplete | MEDIUM — must update when user advances |
| `rr_wiki_url` | Static reference | Rationale citation | LOW — link for human verification; not blocking |
