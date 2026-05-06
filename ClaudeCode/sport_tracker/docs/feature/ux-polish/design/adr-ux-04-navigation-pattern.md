# ADR-UX-04: Navigation Pattern — Fixed Bottom Nav with Safe Area Insets

**Status**: Accepted
**Date**: 2026-05-04
**Author**: Morgan (nw-solution-architect)
**Feature**: ux-polish
**Supersedes**: —
**Superseded by**: —

---

## Context

The ux-polish feature includes UX-06 (persistent navigation bar styling). The react-pwa-ui feature
delivered 5 screens (Auth, Home, Session, Timer, Readiness) connected by React Router v6. The
navigation between screens currently relies on programmatic navigation (`useNavigate()`) with no
persistent navigation UI element.

UX-06 specifies a persistent bottom navigation bar for the 3 primary destinations reachable from
the main app state: Home (session log), Progression, and History. The design question is how this
nav bar is positioned, and how it handles iOS safe area insets (the iPhone notch/home indicator
area at the bottom of the screen).

**iOS Safe Area Context**: On iPhones with Face ID (iPhone X and later), the home indicator
occupies approximately 34px at the bottom of the screen. `position: fixed; bottom: 0` places the
nav bar at the very bottom — content is rendered behind the home indicator, making the nav bar
partially obscured. The W3C CSS Environment Variables specification (`env()`) provides
`env(safe-area-inset-bottom)` to read the safe area inset from the browser, allowing the nav
bar to pad itself correctly. This is supported in iOS Safari 11.2+ and Chrome for Android.

**User context**: Marco's primary device is an iPhone (outdoor park use case). The nav bar must
be visually clear and tap-safe on iOS.

**Constraints**:
- SC-02: Minimum 48×48px touch targets; nav items must meet this threshold.
- SC-06: Offline-first; nav bar must render correctly regardless of connectivity.
- SC-08: Free tier; no external navigation library.
- The app is a PWA installed to the home screen. When installed, Safari hides its browser chrome
  (address bar, bottom toolbar). `env(safe-area-inset-bottom)` is the only way to handle the
  safe area in a home-screen-installed PWA.

---

## Decision

### Option A (Chosen): Fixed Bottom Nav Bar with `env(safe-area-inset-bottom)`

A `<nav>` element is positioned `position: fixed; bottom: 0; left: 0; right: 0`. Its
`padding-bottom` is set to `env(safe-area-inset-bottom)`. On iPhones with Face ID, this padding
expands the nav bar height to clear the home indicator. On older iPhones and Android, `env()`
returns `0px` and the nav bar sits flush at the bottom — identical to `padding-bottom: 0`.

The nav bar contains exactly 3 nav items (Home, Progression, History). Each item has:
- `min-height: var(--touch-target)` (44px) on the tappable area
- Icon (SVG inline, no icon library per SC-08) + label text at `--font-size-label` (13px)
- Active state: `--accent` color on icon and label; `--border-strong` underline or indicator
- Inactive state: `--text-secondary` color

The nav bar itself uses:
- `background: var(--bg-surface)` with a top border at `var(--border)`
- `z-index: 100` to appear above all screen content

Screen content has `padding-bottom` calculated to clear the nav bar height so the nav bar does
not occlude the bottom of scrollable content.

**Metadata requirement**: The PWA's `index.html` must include:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```
`viewport-fit=cover` is required to enable `env(safe-area-inset-*)` — without it, the browser
does not expose safe area inset values to CSS, and `env()` returns `0px` on all devices.

---

## Alternatives Considered

### Alternative 1: Top Navigation Bar (Header)

A `position: fixed; top: 0` header bar containing navigation links or a hamburger menu.

**Evaluation**:

Pros: familiar web pattern; no safe area complexity (iOS status bar is handled differently —
Safari respects the status bar automatically at the top).

Cons: **HIG (Human Interface Guidelines) for iOS explicitly recommends bottom navigation for
primary destinations on iPhone**. Marco's use case is a mid-workout PWA held in one hand. Thumb
reach on a modern iPhone (6"+ screen) makes a top navigation bar ergonomically poor — the thumb
must stretch to the top of the screen to change screens. A bottom nav bar places destinations
within thumb reach. The Strong app reference (WD-UX-05) uses a bottom tab bar. Top navigation
is the correct pattern for web desktop contexts; bottom navigation is the correct pattern for
mobile-primary PWAs with 2-5 primary destinations.

**Rejection rationale**: Ergonomically inferior for single-hand mobile use (Marco's primary
context). Contradicts HIG best practice for iOS PWAs. The Strong app reference uses bottom nav.

---

### Alternative 2: Hamburger Menu / Drawer Navigation

A hamburger icon in the top-right corner that opens a side drawer with navigation links.

**Evaluation**:

Pros: scales to many navigation destinations (10+); hides navigation complexity off-screen.

Cons: the app has exactly 3 primary destinations. A drawer is appropriate when the number of
destinations exceeds what a bottom nav bar can display (typically 5+). For 3 destinations, a
drawer hides navigation behind an extra tap — the user must tap the hamburger, then tap the
destination. This is 2 taps for every navigation action. Mid-workout, Marco wants 1 tap. A drawer
also has higher discovery friction — users must know to look for the hamburger icon. Bottom nav
tabs are always visible and persistent. Principle 8 (simplest solution first) applies: a drawer
is a more complex pattern than a tab bar for the same 3 destinations.

**Rejection rationale**: Two-tap navigation for 3 destinations is unjustified complexity.
Bottom nav provides single-tap, always-visible navigation for the same destinations with less
cognitive load.

---

### Alternative 3: React Router v6 Link Components Without Persistent Nav UI

Rely on the existing programmatic navigation (`useNavigate()`) with text links or buttons on each
screen pointing to the other screens. No persistent nav bar.

**Evaluation**:

This is the current state before ux-polish. UX-06 exists precisely because the current
state — no persistent nav — creates navigation friction. Marco navigates to Progression by
completing a session and tapping a readiness card CTA. He cannot navigate directly to History
from the Session screen. There is no persistent indicator of where he is in the app. This
evaluation confirms that a persistent nav bar is needed, not just a design preference.

**Rejection rationale**: Current state is insufficient (this is the problem UX-06 solves).
No persistent nav means no direct path between primary destinations and no location indicator.

---

## Consequences

**Positive**:
- `env(safe-area-inset-bottom)` with `viewport-fit=cover` provides correct rendering on all
  iPhones with Face ID (iPhone X through iPhone 16) without any JavaScript or device detection.
- The nav bar is always visible on all 3 primary screens — Marco can switch between Home,
  Progression, and History in one tap regardless of current screen.
- Single-tap navigation satisfies the 60-second session log constraint (SC-02) — navigation
  overhead is minimized.
- SVG inline icons with no external library satisfies SC-08. The 3 icons (a few dozen bytes each)
  do not measurably affect bundle size.
- The design tokens (`--bg-surface`, `--border`, `--accent`, `--text-secondary`) apply to the
  nav bar — it inherits both dark and light theming from `design-tokens.css` automatically.
- `position: fixed` nav bar is off the scroll flow — it does not jump or reflow when content
  scrolls.

**Negative**:
- `viewport-fit=cover` in the viewport meta tag must be added to `index.html` if not already
  present. This is a one-line change. Software-crafter verifies this during implementation.
- Screen content `padding-bottom` must account for the nav bar height + `env(safe-area-inset-bottom)`
  to prevent content from being obscured behind the nav bar. This is a CSS calculation that
  requires knowing the nav bar's height. Solution: define `--nav-height: 60px` as a token
  (or CSS variable) and set `padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom))`
  on scrollable screen containers. Crafter implements.
- Auth screen (unauthenticated state) should not show the nav bar. Navigation rendering is
  conditional on authentication state — crafter wires this to `authStore.isAuthenticated`.
  This is a one-line conditional render in the root layout component, not a structural change.
- Timer screen (active rest period): the nav bar should be visible but not tappable during a
  rest timer — navigating away from an active timer is a UX risk. Crafter decision: either
  disable nav items during timer, or allow navigation (timer continues in background via
  `timerStore`). This is a functional edge case outside the visual scope of this ADR. Flagged
  for software-crafter to resolve.

**Neutral**:
- `env(safe-area-inset-bottom)` browser support: iOS Safari 11.2+, Chrome 69+, Firefox 65+.
  All current devices in Marco's use case (iOS) are well above these versions. Android support
  is not a primary concern for v1 (Marco is iPhone-primary) but is covered by Chrome 69+.
