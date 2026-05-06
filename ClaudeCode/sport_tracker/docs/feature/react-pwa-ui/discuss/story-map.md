# Story Map: react-pwa-ui

**User**: Marco — intermediate RR practitioner, outdoor park training, phone out between sets
**Goal**: Log an entire workout session — sets, reps, timer, readiness — in a single app without switching tools
**Date**: 2026-04-21
**Walking skeleton definition**: User signs in → logs one set → sees readiness card → closes session

---

## Backbone (User Activities — left to right)

| Authenticate | Start Session | Log a Set | Manage Rest | Check Progress | Close Session | Browse Data |
|---|---|---|---|---|---|---|
| Sign up (new user) | Open app → home | Pick exercise | Start timer | View readiness card | Tap Done | View history |
| Sign in (returning) | Tap "Start New Session" | Enter sets + reps | Pause / skip timer | Read criterion detail | See summary | Browse chain |
| Token auto-refresh | Resume open session | Add qualitative note | Adjust duration | Navigate to chain | Confirm close | See exercise detail |
| | | Save set | Wait for ping | | | |
| | | Loop to next set | | | | |

---

## Story Map Grid

```
ACTIVITY:   Authenticate    Start Session    Log a Set       Manage Rest     Check Progress   Close Session    Browse Data
            ───────────     ──────────────   ────────────    ────────────    ──────────────   ─────────────    ───────────
SKELETON:   Sign in         Start session    Log one set     90s timer       Readiness card   Close session    (none in WS)
            [UI-01]         [UI-02a]         [UI-03]         [UI-05]         [UI-04]          [UI-02b]
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ WALKING SKELETON LINE ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
SLICE 2:    Sign up         Resume open      Free-text       Pause/skip      View chain from   Empty session   History view
            (new user)      session          exercise        timer           readiness card    guard            [UI-06]
            [UI-01b]        [UI-02c]         [UI-03b]        [UI-05b]        [UI-07]           [UI-02d]
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ SLICE 2 LINE ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
SLICE 3:    Token            PWA install      Offline set     Timer           Offline           Offline          Offline
            auto-refresh     banner           log (queue)     notification    readiness         close + queue    cached history
            [UI-01c]         [UI-08c]         [UI-08a]        [UI-05c]        handling          [UI-08b]         [UI-06b]
```

---

## Walking Skeleton

**Minimum end-to-end path that proves the UI works against the real backend:**

1. **UI-01** (Auth — sign in): Marco signs in via Google OAuth. JWT issued. PostgREST returns 200.
2. **UI-02a** (Start session): Marco taps "Start New Session". Session state initialised in UI.
3. **UI-03** (Log one set): Marco picks "Pike Push-ups (PPP)" from autocomplete, enters 3×8, taps Save. Session entry written to Postgres via PostgREST with correct user_id.
4. **UI-05** (Rest timer, basic): 90-second timer starts automatically. Marco waits. Timer pings at 0.
5. **UI-04** (Readiness card): Marco taps Readiness. fn-readiness-engine called with session_id. Signal returned and displayed (READY / NOT YET / REVIEW).
6. **UI-02b** (Close session): Marco taps Done. Session closed. Summary shown.

**Why this is the walking skeleton**: This slice touches all 5 backend integration points (Auth → PostgREST → fn-readiness-engine → session close → JWT flow) with real data. If any of these 6 steps fail, the product has no value. Everything else is enhancement.

---

## Release Slices

### Slice 1 — Walking Skeleton: "Auth → Log → Readiness → Close"

**Outcome target**: Prove the end-to-end flow works against the real Supabase backend with a real user session.
**KPI**: Marco can sign in, log one set, see the readiness card, and close the session in under 3 minutes on first use.
**Riskiest assumption validated**: Can the React PWA call Supabase Auth, PostgREST, and fn-readiness-engine in sequence without errors?

Stories:
- UI-01 (Auth — sign in with Google OAuth or email) → JS-05
- UI-02 (Start and close a session — basic open/close) → JS-05
- UI-03 (Log a set — exercise autocomplete + sets×reps + optional note) → JS-05, JS-02
- UI-04 (Readiness card — signal + criterion display) → JS-01
- UI-05 (Rest timer — 90s default, start/stop/skip) → JS-06

**Deliverable**: Working PWA where Marco can log a set and see his readiness signal. No offline, no history, no chain view yet.

---

### Slice 2 — Core Loop: "History + Progression Chain + Full Session UX"

**Outcome target**: Complete the core daily-use experience. Marco can replace all 4 tools (paper, timer, Reddit/wiki, spreadsheet) with the app in a single session.
**KPI**: External lookup rate = 0 during a beta session. Rest timer displacement = no separate clock app opened.

Stories:
- UI-06 (Exercise history view — last N sessions per exercise) → JS-02, JS-04
- UI-07 (Progression chain view — current position + what comes next) → JS-03
- UI-02c (Resume open session — crash recovery) → JS-05
- UI-01b (Sign up for new user — registration flow) → JS-05
- UI-03b (Free-text exercise fallback — exercise not in registry) → JS-05
- UI-05b (Timer quality — adjust duration, pause, notifications) → JS-06

**Deliverable**: Full MVP screen set. Marco's friend can install via PWA link, create an account, and complete a full session independently.

---

### Slice 3 — Resilience: "Offline + PWA Install + Error States"

**Outcome target**: App works reliably at the outdoor park without wifi. Beta users trust the app with their training data.
**KPI**: 0 lost sessions during a park workout (offline save → sync on reconnect verified in beta).

Stories:
- UI-08 (Offline session logging — IndexedDB queue + sync indicator + badge) → JS-05
- UI-08b (Offline close + queue indicator on session summary) → JS-05
- UI-06b (Offline history — cached data shown with offline indicator) → JS-02
- UI-08c (PWA install prompt — "Add to Home Screen" banner) → JS-05
- UI-01c (JWT auto-refresh — token expiry handled gracefully) → JS-05

**Deliverable**: Marco can train at the park with no connectivity, return home, and see his session synced. App is installable from the browser.

---

## Priority Rationale

**Priority order: Walking Skeleton → Slice 2 → Slice 3**

1. **Walking Skeleton first** — validates the riskiest technical assumption (Supabase integration end-to-end). Without this working, no amount of feature polish matters. This is the foundation everything else is built on.

2. **Slice 2 second** — completes the value proposition. The UVP ("replace 4 tools with 1") is not delivered until history and progression chain are in the app. The beta testing commitment (sharing with friends) requires a complete daily-use experience. Urgency: beta testing cannot start until Slice 2 is done.

3. **Slice 3 third** — offline resilience is non-negotiable (C2) but not the first thing to prove. Slice 3 is built after the online flow is solid because offline bugs are harder to debug without a working online baseline. The park training use case is real and frequent — this slice must be completed before the first outdoor beta session, which is the natural next milestone after Slice 2.

**Priority formula applied** (Value × Urgency / Effort):

| Slice | Value (1-5) | Urgency (1-5) | Effort (1-5) | Score |
|-------|-------------|---------------|--------------|-------|
| Walking Skeleton | 5 | 5 | 2 | 12.5 |
| Slice 2 | 5 | 4 | 3 | 6.7 |
| Slice 3 | 4 | 3 | 3 | 4.0 |

Tie-breaking rule: Walking Skeleton > Riskiest Assumption > Highest Value. Walking skeleton wins slot 1 by definition.

---

## Scope Assessment: PASS

8 user stories (UI-01 to UI-08), touching 3 bounded contexts (Auth, Session/Logging, Progression), estimated 8-12 days total across 3 release slices. Each slice is independently deliverable and demonstrable. No story is estimated beyond 2 days. Scope is right-sized.
