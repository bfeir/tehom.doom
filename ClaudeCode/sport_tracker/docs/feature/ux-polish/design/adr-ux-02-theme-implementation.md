# ADR-UX-02: Theme Implementation — System-Adaptive via CSS Media Query

**Status**: Accepted
**Date**: 2026-05-04
**Author**: Morgan (nw-solution-architect)
**Feature**: ux-polish
**Supersedes**: —
**Superseded by**: —

---

## Context

The ux-polish feature requires dark/light mode support (SC-04). The DISCUSS wave established the
approach (WD-UX-01): system-adaptive only, no in-app toggle in v1. The question for this ADR is
the exact technical implementation of that decision.

The choice is: how do dark and light token values get applied to the DOM, and what triggers the
switch?

Three implementation strategies exist:

1. **Pure CSS**: `@media (prefers-color-scheme: light)` override in `design-tokens.css`. Zero JS.
2. **JS class toggle on `<html>`**: JavaScript reads `window.matchMedia('(prefers-color-scheme: dark)')`,
   adds/removes a `.dark` or `.light` class on `<html>`, CSS rules scope to that class.
3. **React context / Zustand store**: A `ThemeProvider` reads OS preference and distributes the
   current theme to components via context or a global store. Components render conditionally.

**Constraints**:
- SC-04: `prefers-color-scheme: light` triggers light mode via CSS media query. System-adaptive
  only — no in-app toggle in v1.
- SC-07: TypeScript strict; no unnecessary JS runtime overhead.
- SC-01: All visual changes are presentation-only. No changes to hooks or stores.
- Simplicity is a first-class constraint (solo developer, free tier).

---

## Decision

### Option A (Chosen): Pure CSS Media Query in `design-tokens.css`

The `design-tokens.css` file contains exactly two `@media` blocks in addition to the `:root`
default block:

1. `@media (prefers-color-scheme: light)` — overrides color custom properties to light values.
2. `@media (prefers-reduced-motion: reduce)` — sets `--transition-duration` and
   `--animation-duration` to `0ms`.

No JavaScript is involved in theme detection or switching. The browser reads the OS preference
directly and applies the correct CSS custom property values. If the user changes their OS theme
while the app is open, the browser re-evaluates the media query and the CSS custom properties
update immediately — components re-render automatically because they reference `var(--token)`.

**Structure**:
```
:root {
  /* dark values — default */
}

@media (prefers-color-scheme: light) {
  :root {
    /* light overrides only — only tokens that differ in light mode */
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-duration: 0ms;
    --animation-duration: 0ms;
  }
}
```

Only color tokens that differ between dark and light mode appear in the light override block.
Tokens that are identical in both modes (e.g., `--accent: #00B8D4`, which is the same in both)
are NOT duplicated in the light override block — they are defined once in `:root` and inherited.

---

## Alternatives Considered

### Alternative 1: JavaScript Class Toggle on `<html>`

A script in `src/main.tsx` (or a custom hook) reads `window.matchMedia('(prefers-color-scheme: dark)')`
and adds class `dark` or `light` to `document.documentElement`. CSS rules are scoped to
`:root.dark` and `:root.light`. A `MediaQueryList.addEventListener('change', ...)` listener
updates the class if the OS preference changes at runtime.

**Evaluation**:

Pros: enables a future in-app toggle (just change the class without changing the OS setting).
The class-based approach is the pattern used by Tailwind's `darkMode: 'class'` strategy and is
widely documented.

Cons: adds JavaScript to a task that CSS handles natively. Adds a `MediaQueryList` event listener
that must be cleaned up (memory leak if not removed). Requires testing the listener logic. For
v1 where no in-app toggle exists, the class toggle mechanism provides zero additional user value —
its only benefit is enabling a feature explicitly deferred to v2. SC-01 prohibits changes to
stores; a class toggle on `<html>` is technically outside a store but violates the spirit of
"no new JS for visual concerns." Violates Principle 8 (simplest solution first).

**Rejection rationale**: JavaScript overhead for zero v1 user value. Pure CSS achieves identical
behavior without a listener, cleanup requirement, or testable JS path. If v2 requires an in-app
toggle, the JS class toggle approach can be adopted then (migration cost: add JS listener,
change CSS selectors from `@media` to `:root.dark`/`:root.light`).

---

### Alternative 2: React Context / Zustand ThemeStore

A `ThemeProvider` component reads OS preference via `window.matchMedia`, stores the current theme
in React context or a Zustand store, and distributes it to all components. Components read from
context or store and apply inline styles or conditional class names.

**Evaluation**:

Pros: theme is a first-class piece of application state — inspectable, testable, extensible.
Enables server-side rendering (SSR) scenarios where CSS media queries are not available during
server render (not applicable to this PWA — Vite builds a pure client-side app, no SSR).

Cons: adds an entire state management layer (Context or Zustand store + provider) to a problem
that pure CSS solves in 15 lines. Every component that wants to know the current theme must be
connected to the context — this is component coupling to a concern that CSS custom properties
handle transparently. React context re-renders all consumers on theme change — for a theme change
that could simply update a CSS variable, triggering a React re-render tree is overhead. Violates
SC-01 (changes to stores) and Principle 8 (simplest solution first) severely.

**Rejection rationale**: Massively over-engineered for a CSS variable system. Adds React
re-render cost, provider boilerplate, and state management complexity to a problem that `@media`
solves natively. Not justified until SSR or an in-app toggle is required.

---

## Consequences

**Positive**:
- Zero JavaScript added for theme switching. Theme detection is handled entirely by the browser's
  built-in media query evaluation.
- Instantaneous response to OS preference changes (no event listener debounce, no React setState
  cycle, no re-render). The browser's CSS engine updates custom property values and re-paints in
  a single frame.
- `@media (prefers-reduced-motion: reduce)` is in the same file — both accessibility accommodations
  (theme + motion) are co-located and consistent.
- No testing required for theme switching behavior — it is native browser behavior, not application
  code.
- No cleanup required — no event listeners, no subscriptions, no providers to unmount.
- Future migration to in-app toggle is straightforward: add a `data-theme` attribute to `<html>`,
  change CSS selectors from `@media (prefers-color-scheme: light)` to `[data-theme="light"]`.
  The token values themselves do not change.

**Negative**:
- Users who want dark mode on a light-mode device (or vice versa) cannot override within the app.
  Accepted for v1 per WD-UX-01. Deferred to v2.
- If a component needs to know the current theme in JavaScript (e.g., to choose between two
  programmatic color values), it must call `window.matchMedia('(prefers-color-scheme: dark)').matches`
  directly rather than reading from a store. This is a one-liner but is not encapsulated.
  Mitigation: add a `getCurrentTheme(): 'dark' | 'light'` utility to `src/lib/theme.ts` if needed.
  In v1, no known JS code needs the theme value.

**Neutral**:
- This is consistent with WD-UX-01 from the DISCUSS wave. No new decision is being made — this
  ADR specifies the exact CSS structure that implements that wave decision.
