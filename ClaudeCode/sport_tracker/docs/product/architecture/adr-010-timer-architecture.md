# ADR-010: Rest Timer Architecture — Web Worker with Date.now() Anchoring

**Status**: Accepted
**Date**: 2026-04-21
**Author**: Morgan (nw-solution-architect)
**Feature**: react-pwa-ui — UI-05 (Rest Timer)
**Resolves**: OQ-01 (iOS Safari PWA timer precision under background throttling)
**Supersedes**: —
**Superseded by**: —

---

## Context

The rest timer (UI-05) must auto-start when a set is saved (WD-03) and count down from 90 seconds
(default) with a completion ping. The DISCUSS wave flagged OQ-01: iOS Safari aggressively throttles
background-tab timers (`setInterval`, `setTimeout`) to ≥1-second intervals when the PWA is not the
frontmost app, and may pause them entirely if the device enters a low-power state.

The risk: a 90-second countdown could display 86 seconds remaining after 10 real seconds have elapsed,
making the timer unreliable as a rest timer and defeating KPI-05 (displacement of the external clock
app).

Three approaches were evaluated:

1. **requestAnimationFrame (rAF) polling**: high-frequency UI updates, pauses when tab is hidden.
2. **setInterval with drift correction**: fires at ~1s intervals, applies drift correction against
   `Date.now()`, pauses on iOS background.
3. **Web Worker with Date.now() anchor**: timer logic runs in a dedicated worker thread; worker
   posts tick messages to the main thread; elapsed time computed by comparing current `Date.now()`
   against the start timestamp — never accumulated from interval ticks.

The fundamental issue with all browser timer mechanisms on iOS is that **they all pause** when the
PWA is backgrounded. The iOS operating system suspends JavaScript execution in background web apps
regardless of whether the timer runs in a Worker, a Service Worker, or the main thread. This is
an OS-level constraint, not a JavaScript limitation.

The decision therefore cannot be "make the timer work in the background on iOS." It cannot. The
correct decision is: **ensure the timer remains correct when the user returns the app to the
foreground**, even after arbitrary background duration.

---

## Decision

Implement the rest timer as a **Web Worker with `Date.now()` epoch anchoring**:

1. On set save, the main thread records a `startedAt = Date.now()` timestamp and posts it to the
   `TimerWorker`.
2. The `TimerWorker` runs a `setInterval` at 250ms (4 ticks/second for smooth display) and posts
   the elapsed milliseconds back to the main thread on each tick. Elapsed is computed as
   `Date.now() - startedAt`, not accumulated from interval counts.
3. The main thread updates the Zustand `timerStore` with `remaining = duration - elapsed`.
4. When the user returns to the foreground (visibility change event), the main thread queries the
   worker for current elapsed time — the `Date.now()` anchor gives the correct elapsed time regardless
   of how long the app was backgrounded.
5. On completion (`elapsed >= duration`), the worker posts a `TIMER_COMPLETE` message. The main thread
   triggers an `AudioContext` beep (300ms tone at 880 Hz) or a `Vibration API` pulse as the completion
   ping, and clears the timer state.

**iOS background behavior**: When the iOS user backgrounds the PWA mid-timer:
- The Web Worker is suspended (same as main thread — iOS suspends all JS).
- On foreground return, the `Date.now()` anchor ensures the displayed remaining time is correct.
- If the 90-second timer elapsed entirely while the PWA was backgrounded, `remaining` is 0 or
  negative on foreground return — the UI shows "0:00" and the completion ping fires immediately on
  return.
- The user knows the rest period ended while the app was backgrounded. This is the correct behavior:
  the timer is accurate (based on wall clock), not artificially paused at the moment of backgrounding.

**Why Web Worker over main-thread `setInterval`**: The Worker is isolated from main-thread jank.
If the user is scrolling the history view while the timer runs, main-thread `setInterval` callbacks
may be delayed by rendering work. The Worker's `setInterval` is unaffected by main-thread blocking.
This is a reliability improvement, not a correctness improvement — both approaches produce the same
elapsed calculation.

**iOS install context**: The timer runs identically whether the PWA is installed to the home screen
or used from Mobile Safari. There is no foreground notification capability for PWA timers on iOS
(Web Notifications require user permission and are blocked when the app is backgrounded). The
completion ping is therefore an in-app audio/vibration event, not a system notification. This
matches R-01 mitigation from the DISCUSS risk register.

**OQ-03 resolution — iOS PWA install prompt**: iOS does not support `beforeinstallprompt`. The
workaround is a manual banner component (`AddToHomeScreenBanner`) that:
1. Detects iOS Safari using `navigator.userAgent` and `!window.navigator.standalone`.
2. Shows a one-time dismissable banner with instructions: "Tap the Share button, then 'Add to Home
   Screen'."
3. Persists the dismiss decision in `localStorage` so the banner does not re-appear.
4. Is rendered in Slice 3 (UI-08c), after the online baseline is proven.

---

## Alternatives Considered

### Alternative 1: requestAnimationFrame (rAF)

`requestAnimationFrame` calls back at the display refresh rate (~60fps) while the page is visible.

**Evaluation**:

Pros: highest frequency updates, smooth countdown display.

Cons: rAF is completely paused when the page is hidden (the browser does not call rAF callbacks
for hidden tabs/apps). On foreground return, there is no mechanism to know how much time elapsed
while rAF was paused without an external time anchor. The rAF approach without a `Date.now()`
anchor would show a frozen timer on foreground return. With a `Date.now()` anchor, rAF is
functionally equivalent to the `setInterval` approach but burns more CPU.

**Rejection rationale**: Higher CPU cost, same correctness as `setInterval` with `Date.now()` anchor.
rAF is appropriate for animation frames, not for a countdown timer.

---

### Alternative 2: Service Worker Background Sync as Timer Proxy

Use the Service Worker to fire a timer event and notify the PWA via `postMessage` when the rest
period ends.

**Evaluation**:

Pros: the Service Worker can receive events even when the PWA is backgrounded (on Chrome/Android).

Cons: the Background Sync API is triggered by connectivity events, not by timer expiry. There is no
standard browser API for "fire this Service Worker event after N seconds." The Periodic Background
Sync API (`periodicSync`) exists but its minimum interval is 12 hours (not 90 seconds) and it is
not available on iOS. Constructing a timer proxy via Service Worker would require polling from the
worker at 1-second intervals and using `postMessage` to the main thread — this is more complex than
a Web Worker and has the same iOS suspension behavior.

**Rejection rationale**: No browser API exists for a 90-second Service Worker timer. Constructing
one is significantly more complex than a Web Worker and provides no correctness advantage.

---

### Alternative 3: Main-Thread setInterval with Drift Correction

Run a `setInterval` at 1000ms on the main thread. On each tick, compare `Date.now()` against the
start anchor and correct the display.

**Evaluation**:

Pros: simplest implementation — no Worker, no cross-thread message passing.

Cons: main-thread `setInterval` at 1000ms is susceptible to drift when the main thread is busy
(e.g., rendering a large exercise list). On iOS, the same suspension behavior applies as with the
Worker — the timer pauses on backgrounding. The `Date.now()` anchor corrects the value on return,
same as the Worker approach. The only difference is worker isolation from main-thread jank.

For a solo developer with a simple PWA (~15 screens), main-thread jank is unlikely to be severe
enough to cause timer inaccuracy visible to the user (>1 second drift during active use).

**Not rejected on correctness grounds.** If the implementation proves simpler for the crafter, a
main-thread `setInterval` with `Date.now()` anchor is an acceptable simplification for v1.
**The architectural requirement is the `Date.now()` epoch anchor — not the thread isolation.**
The crafter may choose between Web Worker and main-thread implementations as long as the anchor
pattern is preserved.

---

## OQ-04 Resolution: fn-readiness-engine Batch Calls After Offline Sync

**OQ-04**: Does fn-readiness-engine support batch calls (multiple session_ids) for post-sync use?

**Resolution**: Batch calls are not needed for v1. The sync architecture drains the queue
sequentially and calls `fn-readiness-engine` once for the **latest exercise** after all sessions
are synced (ADR-002, step 7). The readiness signal is shown for the most recent exercise only —
not for every exercise that was logged offline. This is consistent with the on-demand readiness
model (WD-02) and requires only a single Edge Function invocation post-sync.

The `fn-readiness-engine` function signature accepts `{userId, exerciseId}` (single exercise,
as confirmed by `ReadinessEngine.calculate()` in `src/services/ReadinessEngine.ts`). No batch
API is required or designed in v1.

---

## Consequences

**Positive**:
- Timer remains accurate on foreground return after any background duration — KPI-05 reliability
  is preserved (Marco can background the app during rest and return to an accurate countdown).
- Web Worker isolation protects timer ticks from main-thread jank during UI interactions.
- `Date.now()` anchor is a stateless, idempotent calculation — the timer can be reconstructed
  from `startedAt` alone, enabling crash recovery if the PWA is restarted mid-timer.
- `timerStore` (Zustand) holds `{startedAt, duration, isRunning}` — the remaining time is computed
  on read, not stored — this prevents stale `remaining` values in the store after a background period.

**Negative**:
- Web Worker requires a separate file (`src/workers/timer.worker.ts`) and Vite's `?worker` import
  convention. This adds one file and one import pattern for the crafter to understand.
- No system notification on iOS when rest period ends while app is backgrounded. The completion ping
  (audio/vibration) fires on foreground return if the timer elapsed while backgrounded. Accepted:
  this matches the DISCUSS risk register R-01 mitigation.

**Neutral**:
- The crafter may implement Alternative 3 (main-thread setInterval) as a v1 simplification if the
  Web Worker adds perceived complexity. The architectural invariant — `Date.now()` epoch anchor,
  remaining computed from anchor not accumulated from ticks — must be preserved regardless.
