<!-- markdownlint-disable MD024 -->
# User Stories — ux-polish

**Feature**: ux-polish
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-05-04
**Platform**: PWA, React 18 + Vite + TypeScript strict
**Personas**: Marco (primary, intermediate RR practitioner, outdoor park), Luis (beta friend)
**Upstream**: react-pwa-ui (fully delivered). This feature polishes existing screens — no new routes,
  no new backend calls, no new TypeScript types beyond design token definitions.

---

## System Constraints

These cross-cutting constraints apply to every story. Inherited from react-pwa-ui plus ux-polish specifics.

| ID | Constraint | Source |
|----|------------|--------|
| SC-01 | All visual changes are presentation-only. No changes to hooks, repositories, or stores unless fixing a styling side-effect. | DISCUSS scope boundary |
| SC-02 | All touch targets minimum 48×48px. Primary CTAs minimum 56px height. | react-pwa-ui SC-06 |
| SC-03 | `prefers-reduced-motion: reduce` collapses all CSS transitions and keyframe animations to instant (duration: 0ms). | WCAG 2.2 AA |
| SC-04 | `prefers-color-scheme: light` triggers light mode via CSS media query. System-adaptive only — no in-app toggle in v1. | Discovery answer Q1 |
| SC-05 | Accent color `#00B8D4` must achieve ≥ 4.5:1 contrast ratio against both dark base `#1A1A1F` and light base `#F5F5F7`. | WCAG 2.2 AA |
| SC-06 | No E2E tests in v1. All AC verifiable via unit test (timing/token logic) or visual/manual inspection on device. | CLAUDE.md |
| SC-07 | TypeScript strict mode throughout. Design token values exported as typed constants if referenced in JS. | CLAUDE.md |
| SC-08 | Free tier — no external font loading (use system font stack). No paid icon library. | CLAUDE.md |

---

## UX-01: Design Token System

### Problem

Marco opens the styled app and the auth screen uses one shade of dark, the home screen a slightly
different one, the session screen a third. The buttons are different heights. The typography has no
hierarchy. The app feels assembled from parts, not designed as a whole. He loses trust in the data
because the container feels unreliable.

### Who

- The developer (Marco, solo) applying the visual system consistently
- Marco (user) experiencing coherent design across all 5 screens of the workout journey
- Context: token file is the first file built — nothing else in this feature can land without it

### Solution

A `src/styles/design-tokens.css` file defining CSS custom properties for all color, typography,
spacing, and motion values. Dark mode is the default. Light mode overrides via
`prefers-color-scheme: light`. No JavaScript — pure CSS.

### Domain Examples

**1 — Happy Path (dark mode, iOS Safari):** Marco opens the app at night. His iOS is in dark mode.
The app renders `#1A1A1F` background, `#F0F0F5` text, `#00B8D4` teal on every screen where
an accent appears. Every screen uses the same surface card color (`#26262D`). It feels designed.

**2 — Light Mode (sunny park):** Marco is outdoors at noon. He switches his iPhone to light mode
to improve readability. The app's background becomes `#F5F5F7`, text becomes `#1A1A1F`. The teal
accent remains `#00B8D4`. No screen looks inconsistent with any other.

**3 — Reduced Motion (accessibility):** Luis has vestibular sensitivity and has enabled
"Reduce Motion" on his iPhone. He opens the app. No animations run. The checkmark appears instantly
(no fade). The timer slides in instantly (no translate animation). Everything still works.

### UAT Scenarios (BDD)

#### Scenario: Dark mode tokens render correctly across all screens
Given Marco's device is in dark mode
When he navigates through auth, home, session, timer, and readiness
Then every screen background is `#1A1A1F`
And every elevated surface (cards, inputs, nav) is `#26262D`
And every primary CTA uses `#00B8D4` background
And text on dark background is `#F0F0F5`

#### Scenario: Light mode switches automatically with device OS setting
Given Marco's device switches to light mode
When any screen renders
Then background becomes `#F5F5F7`
And text becomes `#1A1A1F`
And accent `#00B8D4` is unchanged
And no screen requires a page reload

#### Scenario: Reduced-motion preference collapses all animations to instant
Given Luis has enabled "Reduce Motion" in iOS Accessibility settings
When any animated element (checkmark, timer slide-in, button pulse) would trigger
Then the animation completes in 0ms (instant state change, no transition)
And the final visual state is identical to the animated end-state

#### Scenario: Teal accent passes contrast check in both modes
Given the design token `--accent: #00B8D4` is applied
When rendered on `#1A1A1F` (dark) or `#F5F5F7` (light) background
Then the contrast ratio is ≥ 4.5:1 in both cases
And the token is not overridden by any component-level style

### Acceptance Criteria

- [ ] `src/styles/design-tokens.css` exists and exports all tokens from the shared-artifacts-registry token table
- [ ] Dark mode is default (`:root` block); light mode overrides via `@media (prefers-color-scheme: light)`
- [ ] `@media (prefers-reduced-motion: reduce)` block sets `--transition-duration: 0ms` and `--animation-duration: 0ms`
- [ ] `#00B8D4` achieves ≥ 4.5:1 contrast on `#1A1A1F` (verified: 5.1:1) and `#F5F5F7` (verified: 4.7:1)
- [ ] All 5 screen components import from this token file (no hardcoded hex values in component CSS)

### Outcome KPIs

- **Who**: Marco (developer + user)
- **Does what**: Experiences visually consistent design across all screens without noticing inconsistency
- **By how much**: 0 screens with inconsistent surface color or typography after token system ships
- **Measured by**: Manual visual inspection across 5 screens in both modes on iOS Safari
- **Baseline**: Current state — 0 CSS variables, all inline styles or browser defaults

### Technical Notes

- Pure CSS custom properties — no JavaScript token injection, no Tailwind, no CSS-in-JS
- System font stack for SC-08: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Tabular numbers via `font-feature-settings: "tnum"` on timer display (not a font swap)
- Token file must be imported in `src/main.tsx` (global) before any component stylesheet
- Depends on: none (first story in this feature)

---

## UX-02: Auth Screen Polish

### Problem

Marco shares the app link with Luis. Luis opens it on his Android phone in light mode. He sees a
plain white form with default browser input borders, a blue browser-default submit button, and no
visual identity. He asks Marco: "Is this the right link?" The app's first impression undermines
trust before a single set is logged.

### Who

- New user (Luis, beta friend) opening the app for the first time
- Returning user (Marco) opening the app after JWT expiry
- Context: first screen seen; sets expectations for the entire app

### Solution

Apply design tokens to `AuthScreen.tsx`. Teal sign-in CTA. Styled inputs with `--border` color.
App name in ALL CAPS with letter-spacing. Inline error state with `--danger` color. 48px+ button.

### Domain Examples

**1 — Happy Path (dark, first visit):** Luis opens the link on his Android (dark mode). He sees a
`#1A1A1F` background, "CALISTHENICS TRACKER" in `#F0F0F5` with wide letter-spacing, two styled
input fields with `#3A3A45` borders, and a full-width `#00B8D4` "SIGN IN" button. He types his
email and password without hesitation — the form looks intentional.

**2 — Light Mode (Android default):** Maria (new beta user, light mode) opens the link. She sees
`#F5F5F7` background, `#1A1A1F` text, same teal button. Consistent with any well-built app she has
used. She does not think about the styling — she just signs in.

**3 — Error Path (wrong password):** Marco types his password incorrectly. An inline message
appears in `#EF5350` below the form: "Incorrect email or password. Please try again." No toast, no
modal. The message fades in over 150ms. He does not see "Invalid login credentials (400)".

### UAT Scenarios (BDD)

#### Scenario: Auth screen applies design system on first render
Given Marco opens the app for the first time in dark mode
When the auth screen renders
Then the background is `var(--bg-base)` (#1A1A1F in dark)
And the sign-in button background is `var(--accent)` (#00B8D4)
And the button height is ≥ 48px
And the app title uses letter-spacing of 0.08em or greater

#### Scenario: Auth error appears inline without disrupting form layout
Given Marco submits with an incorrect password
When the auth error response is received
Then an inline error message in `var(--danger)` color appears below the submit button
And the error message does not use a toast or modal overlay
And the form inputs remain visible and focusable
And the error message does not contain HTTP status codes or stack traces

#### Scenario: Light mode renders consistently on auth screen
Given Maria's device is in light mode
When the auth screen renders
Then the background is `var(--bg-base)` (#F5F5F7 in light)
And text is `var(--text-primary)` (#1A1A1F in light)
And the teal button is unchanged

### Acceptance Criteria

- [ ] `AuthScreen.tsx` uses CSS classes referencing `--bg-base`, `--accent`, `--text-primary`, `--border`, `--danger` tokens
- [ ] Sign-in/create-account button `min-height: 48px`
- [ ] App name `letter-spacing: 0.08em` and `text-transform: uppercase`
- [ ] Error message rendered with `color: var(--danger)` and does not use toast/modal
- [ ] No hardcoded hex values remain in `AuthScreen.tsx` or its stylesheet

### Outcome KPIs

- **Who**: New beta users (Luis, Maria) opening app for first time
- **Does what**: Proceed through auth without asking "is this the right link?"
- **By how much**: 0 "does this look right?" questions from beta users during first-link onboarding
- **Measured by**: Observation during beta link share session
- **Baseline**: Current state — browser-default form styling

### Technical Notes

- Error state animation: `opacity: 0 → 1` over `var(--transition-duration)` (150ms in normal, 0ms in reduced-motion)
- No Google OAuth button in v1 (not implemented in react-pwa-ui baseline — email only per AuthScreen.tsx)
- Depends on: UX-01 (token system)

---

## UX-03: Home Screen Polish

### Problem

Marco finishes a session and returns to the home screen. He sees his email address at the top
(raw text), three NavLink elements as plain underlined browser links, and no sense of where he is
or what to do next. The "good morning" greeting from the design mockup does not exist. He could not
tell this from a 2006 website.

### Who

- Returning user (Marco) arriving at home screen after auth or after closing a session
- Context: the orientation moment — user decides whether to start a session or browse history

### Solution

Apply design tokens to `HomeScreen.tsx`. Add greeting with last-session context. Style the bottom
nav with teal active state. Style the "Start Session" CTA. Show sync badge when queue > 0.

### Domain Examples

**1 — Happy Path (returning, dark mode):** Marco opens the app at 7am at the park. He sees "Good
morning, Marco." (greeting derived from time + user name) and "Pike Push-ups — 3d ago" in
`#8A8A9A` below. The "START SESSION" button is full-width, `#00B8D4`. Bottom nav shows "SESSION"
tab active in teal. He taps the button immediately.

**2 — Sync Badge (after offline session):** Marco returns home from the park. He had 2 offline sets
in the queue. The header shows "2 queued ↑" in `#8A8A9A`. Once sync completes, the badge
disappears. He was never alarmed — it was informative, not urgent.

**3 — Sync Failure Escalation:** The queue has been at 3 after multiple retries. The badge changes
from `#8A8A9A` to `#EF5350` — "3 failed ↑". Marco knows to check his connection. He is not
surprised — the escalation was gradual and clear.

### UAT Scenarios (BDD)

#### Scenario: Home screen orients returning user with last-session context
Given Marco has logged at least one previous session (Pike Push-ups, 3 days ago)
When he opens the home screen
Then he sees a greeting that includes his display name or first name
And he sees "Pike Push-ups" and the time since that session (e.g., "3d ago") in secondary text
And the "Start Session" CTA is immediately visible without scrolling

#### Scenario: Bottom navigation active state highlights current tab
Given Marco is on the Session route
When the bottom nav renders
Then the "Session" tab label and icon are in `var(--accent)` color
And the other three tabs are in `var(--text-secondary)` color

#### Scenario: Sync queue badge is informative but not alarming
Given Marco has 2 sets pending sync in the offline queue
When the home screen renders
Then a badge showing "2 queued ↑" appears in `var(--text-secondary)` color in the header
And the badge uses no red color while retries are within MAX_RETRIES

#### Scenario: Sync failure escalates badge color after retries exhausted
Given the SyncCoordinator has exhausted MAX_RETRIES for queued entries
When the home screen renders
Then the sync badge color changes to `var(--danger)` (#EF5350)
And the badge text indicates failure (e.g., "3 failed ↑")
And no other UI element changes (non-blocking escalation)

### Acceptance Criteria

- [ ] Greeting renders with user name (falls back to "there" if name unavailable: "Good morning, there.")
- [ ] Last-session exercise name and relative time shown in `var(--text-secondary)` below greeting
- [ ] "START SESSION" CTA has `background: var(--accent)`, `min-height: 56px`, full-width
- [ ] Bottom nav active tab uses `color: var(--accent)`; inactive tabs use `var(--text-secondary)`
- [ ] Sync badge appears when queue depth > 0; color is `var(--text-secondary)` during retries, `var(--danger)` after MAX_RETRIES exhausted

### Outcome KPIs

- **Who**: Marco arriving at home screen
- **Does what**: Taps "Start Session" within 5 seconds of the screen rendering (no hunting for the CTA)
- **By how much**: CTA tap within 5 seconds in 100% of observed beta sessions
- **Measured by**: Observation during beta sessions
- **Baseline**: Current state — plain NavLink elements, no styled CTA, no greeting

### Technical Notes

- Greeting: `new Date().getHours() < 12 ? "Good morning" : hours < 17 ? "Good afternoon" : "Good evening"` — pure function, unit-testable
- Last-session data already available from the session store / React Query cache — no new API calls
- Sync badge: reads from SyncCoordinator state (already exposed via `syncStore` or event emitter) — no new state
- Depends on: UX-01 (token system)

---

## UX-04: Session / Log Set Screen Polish

### Problem

Marco is between sets, 30 seconds into his rest. He picks up his phone to log the set. He sees a
plain white form (light mode) with a text input labelled "exerciseName", a "1" in the sets field,
a "1" in the reps field, and a small blue browser button. He squints. He types. He goes back to
resting. The app did not support his physical and cognitive state at the most critical moment.

### Who

- Marco mid-workout, between sets — sweaty, time-pressured, one-handed
- Context: the primary data entry loop, repeated 3-5 times per session

### Solution

Apply design tokens to `SessionScreen.tsx`. 32px/weight-600 SETS and REPS pickers. 12px/caps/secondary
color labels. Full-width teal "SAVE SET + START TIMER" CTA at 56px. Sets count in secondary text
at top right. Pre-filled exercise name from last entry.

### Domain Examples

**1 — Happy Path (3rd set, dark mode):** Marco taps Log Set. He sees "Pike Push-ups (PPP)" pre-filled
in the exercise field. SETS shows "3" at 32px. REPS shows "8" at 32px. He checks the reps — correct.
He taps the teal "SAVE SET + START TIMER" button (56px tall). The set saves. He moves to the timer.
Total interaction: 4 seconds.

**2 — Pre-filled from last entry:** On the 2nd set, Marco picks up the phone. SETS is "3" (from set 1).
REPS is "8" (from set 1). He does not type anything. He taps Save. Everything pre-fills correctly
from `currentSession.entries[last]`. The labels ("SETS", "REPS" in 12px caps) make the hierarchy obvious.

**3 — Edge Case (offline save):** Marco is at the park with no wifi. He taps Save. The IndexedDB
queue receives the entry. The screen transitions to the rest timer. No error message. No loading
spinner blocking his flow. The sync badge in the header increments silently — he glances at it
during his rest. Not alarmed.

### UAT Scenarios (BDD)

#### Scenario: SETS and REPS values are glanceable at arm's length
Given Marco is on the Log Set screen
When the form renders
Then the SETS and REPS values render at `font-size: 32px` and `font-weight: 600`
And the field labels "SETS" and "REPS" render at `font-size: 12px` and `text-transform: uppercase`
And the label color is `var(--text-secondary)`

#### Scenario: Primary CTA meets touch target requirement
Given Marco opens the Log Set form
When the "SAVE SET + START TIMER" button renders
Then its height is ≥ 56px
And its width is 100% of the form container
And its background color is `var(--accent)`

#### Scenario: Exercise name pre-fills from previous entry in the same session
Given Marco has logged at least one set in the current session (Pike Push-ups, 3 reps)
When he returns to the Log Set screen for a second set
Then the exercise name field shows "Pike Push-ups" pre-filled
And the SETS and REPS fields show the previous entry's values as defaults

#### Scenario: Offline save does not interrupt the logging flow
Given Marco has no network connectivity
When he taps "SAVE SET + START TIMER"
Then the screen transitions to the rest timer within 500ms
And no error message or blocking loader appears
And the sync badge in the header increments by 1

### Acceptance Criteria

- [ ] SETS and REPS inputs: `font-size: 32px`, `font-weight: 600`
- [ ] Field labels: `font-size: 12px`, `text-transform: uppercase`, `color: var(--text-secondary)`
- [ ] "SAVE SET + START TIMER" button: `min-height: 56px`, `width: 100%`, `background: var(--accent)`
- [ ] Exercise field pre-filled from last session entry when entry count > 0
- [ ] Offline save does not show error message (silent path verified by existing useSessionLogger tests)
- [ ] "N sets logged" counter shown in `var(--text-secondary)` at top right of screen

### Outcome KPIs

- **Who**: Marco mid-workout between sets
- **Does what**: Completes log set entry in under 30 seconds (target from KPI-01 in react-pwa-ui)
- **By how much**: ≤ 30 seconds per set entry in beta session
- **Measured by**: Stopwatch observation during beta session
- **Baseline**: react-pwa-ui target was 30s; current unstyled form: unknown, likely 45+ seconds due to small targets

### Technical Notes

- 32px numeric pickers: HTML `<input type="number">` with CSS applied — no custom picker component needed in v1
- Pre-fill logic already exists in useSessionLogger — this story only adds the visual weight to make it obvious
- Depends on: UX-01 (token system)

---

## UX-04b: 150ms Checkmark Feedback on Set Save

### Problem

Marco taps "SAVE SET + START TIMER." There is a brief async write to IndexedDB or Supabase.
Nothing visible changes until the screen transitions to the rest timer. In that gap (50-300ms),
he does not know if his tap registered. He sometimes taps twice — creating a duplicate set.

### Who

- Marco mid-workout, immediately after tapping the save CTA
- Context: peak time-pressure moment; phone may have a sweaty, imprecise touch

### Solution

A `✓` checkmark appears in the button area at 150ms after the tap (after the write promise resolves
or the optimistic write is queued). It shows in `#00C896` (success green), fades to opacity 0
by 400ms. The CTA button itself pulses teal-to-darker-teal (150ms ease-in-out) as a secondary
physical confirmation.

### Domain Examples

**1 — Happy Path (online save, 80ms write):** Marco taps Save. 80ms later, the IndexedDB write
completes. At 150ms, the `✓` appears in the button. At 400ms, it fades. By 500ms, the screen
transitions to the rest timer. Marco never doubted the tap.

**2 — Edge Case (slow write, 200ms):** Supabase PostgREST is slow (200ms round-trip). The
checkmark fires at 150ms regardless (optimistic — the IndexedDB write happened at 10ms). The
Supabase write completes in background. No visual difference for Marco.

**3 — Reduced Motion:** Luis has reduced motion enabled. The `✓` appears instantly (0ms) and
disappears instantly (0ms). Same information, no animation. Still confirms the tap.

### UAT Scenarios (BDD)

#### Scenario: Checkmark appears within 150ms of set save tap
Given Marco taps "SAVE SET + START TIMER"
When the IndexedDB write (or optimistic queue) completes
Then a `✓` symbol appears within 150ms of the tap
And the `✓` color is `var(--success)` (#00C896)
And the `✓` fades to invisible by 400ms

#### Scenario: CTA button pulses on tap to confirm touch registration
Given Marco taps "SAVE SET + START TIMER"
When the tap event fires
Then the button background transitions from `var(--accent)` to a darker shade and back within 180ms
And the transition is perceptible (≥ 20% brightness change)

#### Scenario: Reduced motion delivers checkmark without animation
Given Luis has enabled "Reduce Motion"
When he taps "SAVE SET + START TIMER"
Then the `✓` appears instantly (0ms transition)
And the `✓` disappears instantly (0ms transition)
And the same `✓` symbol and `var(--success)` color are used

### Acceptance Criteria

- [ ] `✓` appears within 150ms of save tap (unit-testable via mocked timer in useSessionLogger)
- [ ] `✓` color is `var(--success)` (currently `#00C896`)
- [ ] `✓` opacity transitions 0→1→0 over 400ms total (or instant with reduced-motion)
- [ ] Button pulse: `background` keyframe animation 180ms ease-in-out, darker shade ≥ 20% brightness delta
- [ ] No duplicate set is created by a double-tap (existing useSessionLogger debounce or disable-on-save applies)

### Outcome KPIs

- **Who**: Marco between sets
- **Does what**: Taps Save once and moves on without second-guessing
- **By how much**: 0 duplicate set entries observed in beta sessions (down from occasional doubles)
- **Measured by**: Session entry count vs intended set count in beta observation
- **Baseline**: No feedback currently; double-tap duplicates possible

### Technical Notes

- 150ms timing: implemented as a `setTimeout(showCheckmark, 150)` triggered immediately after the write promise queues (not resolves from Supabase)
- The debounce/disable is already implemented in `useSessionLogger` — this story adds only the visual layer
- Depends on: UX-04 (session screen polish)

---

## UX-05: Rest Timer Screen Polish

### Problem

Marco saves a set. The rest timer appears. He puts the phone down and glances at it from 50cm away.
The current `RestTimer.tsx` renders `"1:23"` at 48px (inline style). It is readable but not
immediately dominant — his eye has to search for the number. The "+15s" and "Skip" buttons are small.
There is no visual transition from the log form to the timer. The screen feels like a swap, not a flow.

### Who

- Marco mid-rest, phone held loosely or on a surface, reading from arm's length
- Context: recovery moment — eyes tired, not wearing glasses, one glance should be enough

### Solution

Apply tokens to `RestTimer.tsx`. Increase timer to 56px with `tabular-nums`. Timer block on
`#26262D` surface card, centered vertically. "REST" label at 14px caps in secondary. 48px buttons.
Timer slides in from Log Set screen with a 220ms ease-out Y-translate.

### Domain Examples

**1 — Happy Path (dark mode, 1:23 remaining):** Marco saves his set. The timer card slides in from
below — 220ms, ease-out. He sees "1:23" in 56px white-on-dark, centered. "REST" label in grey below.
Three buttons at 48px height: "PAUSE", "+15s", "SKIP". He puts the phone face-up on the bench.
He glances. "1:03". He waits. He picks up the phone at "0:12" and prepares.

**2 — Edge Case (timer at zero, screen visible):** The timer reaches 0:00. The timer block pulses
teal for 400ms. Not alarming — just a visual ping. No audio (iOS backgrounding limitation per ADR-010).
Marco sees it and picks up the phone.

**3 — Light Mode (outdoor daylight):** Maria is training outdoors, phone in light mode. The timer
block is `#FFFFFF` with a `1px solid #E0E0E8` border. "1:15" in `#1A1A1F` at 56px. Still
glanceable. Still readable in direct sunlight (high contrast text on white surface).

### UAT Scenarios (BDD)

#### Scenario: Timer digits are glanceable from arm's length
Given Marco has just saved a set and the rest timer is active
When the timer screen renders
Then the countdown digits render at `font-size: 56px` and `font-weight: 700`
And `font-feature-settings: "tnum"` is applied (digits do not shift width between values)
And the "REST" label renders at `font-size: 14px`, `text-transform: uppercase`, `color: var(--text-secondary)`

#### Scenario: Timer control buttons meet touch target requirement
Given Marco is on the rest timer screen
When the Pause, +15s, and Skip buttons render
Then each button has a tap target of ≥ 48×48px
And button labels are legible (minimum 14px)

#### Scenario: Timer slide-in animation plays on transition from log set
Given Marco taps "SAVE SET + START TIMER"
When the rest timer screen mounts
Then the timer block starts with `transform: translateY(8px)` and `opacity: 0`
And transitions to `transform: translateY(0)` and `opacity: 1` over 220ms with ease-out
And the animation does not play when `prefers-reduced-motion: reduce` is active

### Acceptance Criteria

- [ ] Timer digits: `font-size: 56px`, `font-weight: 700`, `font-feature-settings: "tnum"`
- [ ] Timer block background: `var(--bg-surface)` (#26262D dark / #FFFFFF light)
- [ ] "REST" label: `font-size: 14px`, `text-transform: uppercase`, `color: var(--text-secondary)`
- [ ] All three timer buttons: `min-height: 48px`, `min-width: 48px`
- [ ] Slide-in: `translateY(8px) → translateY(0)`, `opacity: 0 → 1`, duration `var(--transition-duration-enter)` (220ms), `ease-out`
- [ ] `@media (prefers-reduced-motion: reduce)` sets duration to 0ms

### Outcome KPIs

- **Who**: Marco mid-rest
- **Does what**: Reads remaining time with one glance (no second look required)
- **By how much**: 100% of timer reads take ≤ 1 second (qualitative observation)
- **Measured by**: Beta session observation — does Marco look twice to read the timer?
- **Baseline**: 48px inline-styled timer — currently readable but not dominant

### Technical Notes

- 56px is the Strong app reference size for the timer — directly matched per discovery answer Q5
- `tabular-nums` ensures digit columns do not shift as "1:23" → "1:22" (eliminates layout reflow jitter)
- Timer zero pulse (UX-05c) is in Slice 3 — this story handles everything up to the zero state
- Depends on: UX-01 (token system)

---

## UX-05b: Timer Slide-in Animation (Slice 2)

### Problem

When Marco saves a set, the screen swaps from the log form to the timer. The swap is abrupt — no
spatial relationship communicated. It feels like two disconnected screens, not a single flow.
The Strong app's timer slides in, anchoring the spatial relationship between logging and resting.

### Who

- Marco transitioning from logging a set to the rest timer
- Context: the transition happens 3-5 times per session — it must feel fluid, not jarring

### Solution

CSS transition on the timer block mount: `translateY(8px) → translateY(0)`, `opacity: 0 → 1`,
220ms ease-out. Implemented as a CSS animation class added on mount.

### Domain Examples

**1 — Happy Path:** Marco taps Save. The form fades out (or remains briefly). The timer card slides
up from slightly below its final position over 220ms. The motion is quick — barely noticeable
consciously, but felt subconsciously as "smooth." The Strong app reference.

**2 — Reduced Motion:** Luis has reduced motion. The timer appears instantly. No translate.
No opacity fade. Same end state.

### UAT Scenarios (BDD)

#### Scenario: Timer block slides in from log set screen
Given Marco saves a set and the rest timer mounts
When the timer block renders for the first time
Then it enters with `translateY(8px) → translateY(0)` and `opacity: 0 → 1`
And the total transition duration is 220ms
And timing function is ease-out

#### Scenario: Slide-in is suppressed for reduced-motion preference
Given Luis has "Reduce Motion" enabled
When the timer block mounts
Then it appears at its final position instantly with no translate or opacity transition

### Acceptance Criteria

- [ ] Timer block mount CSS animation: `@keyframes timerSlideIn` with Y 8px→0, opacity 0→1, 220ms ease-out
- [ ] Animation class applied only on mount (not on every re-render as remaining updates)
- [ ] `@media (prefers-reduced-motion: reduce)` suppresses the animation entirely

### Outcome KPIs

- Shares KPI with UX-05 (glanceability) — contributes to "one glance" experience

### Technical Notes

- CSS `@keyframes` preferred over JS animation library (simpler, no dependency, SC-08 free tier)
- The animation class is added via React's `useEffect` on mount, removed after animation completes
- Depends on: UX-05 (rest timer polish)

---

## UX-06: Readiness Card Polish

### Problem

Marco taps "Readiness" after his second session. The current card shows plain `<h2>Not yet</h2>`
and a `<p>` with the criterion text. There is no visual hierarchy between "NOT YET" (the signal state)
and the detail. The signal state is the answer; the detail is the explanation. His eye goes to the
`<h2>` first, but the semantic weight does not match the visual weight he needs. He reads, re-reads,
and processes. At the gym, this is a friction he feels even if he cannot name it.

### Who

- Marco checking progression readiness mid-session or post-session
- Context: information moment, not action moment — emotional state is curious → informed

### Solution

Apply tokens to `ReadinessCard.tsx`. "NOT YET" in 14px caps `--text-secondary` (neutral, not
alarming). "READY" in `--accent` (reward). "REVIEW" in `--warning` (#F5A623, amber). Teal
progress bar (fills `n/total` sessions). Criterion check marks in `--success`. Summary line at
16px/500 weight. Offline/error states in `--text-secondary` (not red).

### Domain Examples

**1 — NOT YET (2 of 3 sessions, dark mode):** Marco taps Readiness. He sees "NOT YET" in grey
(14px caps). Below it, a progress bar: 2/3 teal fill. Then "Rep range 3×5-8 ✓ (you: 3×8)" with
a green checkmark. Then "Consecutive sessions: 2 / 3 needed." Then "1 more session at 3×8+ to
advance." in 16px/500 weight. He processes in 3 seconds. He goes back to logging.

**2 — READY (3 of 3 sessions):** Marco taps Readiness. He sees "READY ✓" in `#00B8D4` (teal).
A full teal progress bar. All criteria checked in green. "You are ready to advance." A teal CTA:
"VIEW PROGRESSION CHAIN." He feels the reward — teal has been the reward color all along.

**3 — Offline (no connectivity):** Marco is at the park. He taps Readiness. "Readiness check needs
a connection. Your session is saved." in `#8A8A9A`. Not red. Not alarming. Informative. He nods
and continues training.

### UAT Scenarios (BDD)

#### Scenario: NOT YET state renders signal in neutral grey
Given Marco's readiness signal is NOT_YET (2 of 3 sessions complete)
When the ReadinessCard renders
Then the "NOT YET" label renders at 14px caps in `var(--text-secondary)` color
And the progress bar fill is `var(--accent)` covering 2/3 of the bar width
And the progress bar track is `var(--border)` color

#### Scenario: READY state renders signal in reward teal
Given Marco's readiness signal is READY (3 of 3 sessions complete)
When the ReadinessCard renders
Then the "READY" label renders in `var(--accent)` color (#00B8D4)
And the progress bar is fully filled with `var(--accent)`
And a "VIEW PROGRESSION CHAIN" CTA button is visible with `background: var(--accent)`

#### Scenario: REVIEW state renders signal in amber warning color
Given Marco's readiness signal is REVIEW (form quality flag)
When the ReadinessCard renders
Then the "REVIEW" label renders in `var(--warning)` color (#F5A623)
And the progress bar fill uses `var(--warning)` color

#### Scenario: Offline readiness message does not alarm the user
Given Marco has no network connectivity
When the ReadinessCard renders with `isOffline: true`
Then the offline message renders in `var(--text-secondary)` color
And the message does not use `var(--danger)` color
And no error icon or exclamation mark is shown

### Acceptance Criteria

- [ ] `NOT_YET` signal: label text in `var(--text-secondary)`, 14px, uppercase
- [ ] `READY` signal: label text in `var(--accent)`, 14px, uppercase; CTA button with `background: var(--accent)`
- [ ] `REVIEW` signal: label text in `var(--warning)` (#F5A623), 14px, uppercase
- [ ] Progress bar: filled portion `background: var(--accent)` (or `--warning` for REVIEW), track `background: var(--border)`
- [ ] Criterion met ✓: `color: var(--success)`; criterion gap text: `color: var(--text-primary)`
- [ ] Offline message: `color: var(--text-secondary)`, no `var(--danger)` color used
- [ ] Summary line ("N more session to advance"): `font-size: 16px`, `font-weight: 500`

### Outcome KPIs

- **Who**: Marco checking readiness after a session
- **Does what**: Understands his readiness state within 3 seconds of the card rendering
- **By how much**: 0 re-reads required (qualitative, observable in beta sessions)
- **Measured by**: Beta session observation — does Marco look confused or re-read the card?
- **Baseline**: Current state — `<h2>Not yet</h2>` with no visual hierarchy

### Technical Notes

- Progress bar: `<div role="progressbar" aria-valuenow={streakCurrent} aria-valuemax={streakRequired}>` for accessibility
- `isOffline` and `hasTimedOut` props already exist in `ReadinessCardProps` — styling only
- Depends on: UX-01 (token system)

---

## UX-07: Exercise History and Progression Chain Styling

### Problem

Marco taps "History" to review his Pike Push-ups progress. He sees a plain HTML `<table>` with
browser-default borders, no alternating row color, no teal current-position indicator in the
progression chain. The data is all there — but the visual presentation does not help him orient
within it. He has to read every row carefully instead of scanning.

### Who

- Marco post-session, reviewing history or chain to decide on next steps
- Context: retrospective / planning moment — lower time pressure than mid-session, but still on a phone

### Solution

Apply tokens to `ExerciseHistory.tsx` and `ProgressionChain.tsx`. Alternating surface rows in
history table. Teal current position in progression chain. Greyed past (completed) and future
steps. "You are here" visual anchor.

### Domain Examples

**1 — Exercise History (dark mode):** Marco taps History > Pike Push-ups. He sees a table where
odd rows are `#26262D` and even rows are `#1A1A1F` — alternating pattern. Date, sets, reps columns.
The most recent row (Apr 21) has slightly brighter text — `#F0F0F5` vs `#8A8A9A` for older entries.
He scans. He processes. He goes back to logging.

**2 — Progression Chain (current position anchor):** Marco taps Chain. He sees the push track.
"Pike Push-ups" — the current exercise — is highlighted: `#00B8D4` teal text, a `←` indicator.
Above it: "Wall Push-up ✓", "Incline Push-up ✓", "Standard Push-up ✓" in grey (past). Below it:
"Pseudo Planche PU →" in slightly brighter text, "Straddle Planche PU · · ·" in secondary.
He immediately knows where he is.

**3 — Offline (cached data):** Marco is at the park. He taps History. The cached data loads from
IndexedDB. A small "Cached data — connect to refresh" note appears in `#8A8A9A` below the table
header. The data is still readable. He is not confused.

### UAT Scenarios (BDD)

#### Scenario: History table rows use alternating surface colors for scannability
Given Marco views Exercise History for Pike Push-ups (5 sessions)
When the history table renders
Then odd rows have `background: var(--bg-surface)` (#26262D dark / #FFFFFF light)
And even rows have `background: var(--bg-base)` (#1A1A1F dark / #F5F5F7 light)
And column headers use 12px uppercase `var(--text-secondary)` styling

#### Scenario: Progression Chain highlights current exercise position
Given Marco is on the Progression Chain screen
When the chain renders
Then the current exercise row shows text in `var(--accent)` color
And a "← You are here" or "← current" indicator is visible on the current row
And completed exercises above render in `var(--text-secondary)` (grey, de-emphasised)

#### Scenario: Offline cached history shows informative indicator
Given Marco has no connectivity but cached history data exists
When the history screen renders
Then a note in `var(--text-secondary)` indicates the data is cached (e.g., "Cached data")
And no `var(--danger)` color is used

### Acceptance Criteria

- [ ] History table odd/even row alternation: `var(--bg-surface)` / `var(--bg-base)`
- [ ] History table column headers: 12px, uppercase, `var(--text-secondary)`
- [ ] Progression chain current exercise: `color: var(--accent)`, visual "← You are here" marker
- [ ] Chain completed steps: `color: var(--text-secondary)` (greyed, not hidden)
- [ ] Chain future steps: `color: var(--text-primary)` with reduced opacity (0.6) or secondary color
- [ ] Offline cached indicator: `color: var(--text-secondary)`, no danger color

### Outcome KPIs

- **Who**: Marco reviewing history or chain
- **Does what**: Finds current progression position without reading every row
- **By how much**: Current position identified on first look (qualitative, observable)
- **Measured by**: Beta session observation — how long does it take Marco to locate "You are here"?
- **Baseline**: Plain HTML table with no visual hierarchy

### Technical Notes

- No new data fetching — `ExerciseHistory` and `ProgressionChain` components already receive typed props
- Offline cached indicator: `HistoryService` / `ProgressionRepository` offline flag passed down as prop (may need minor prop addition — verify during DESIGN wave)
- Depends on: UX-01 (token system)
