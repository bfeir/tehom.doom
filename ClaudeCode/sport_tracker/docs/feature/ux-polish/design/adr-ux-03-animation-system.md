# ADR-UX-03: Animation System — CSS Keyframes with Token-Driven Durations

**Status**: Accepted
**Date**: 2026-05-04
**Author**: Morgan (nw-solution-architect)
**Feature**: ux-polish
**Supersedes**: —
**Superseded by**: —

---

## Context

The ux-polish feature introduces two animations (UX-04):

1. **Set save checkmark**: A `✓` appears after the optimistic save at `--transition-duration`
   (150ms), held briefly, then fades. This is the confirmation feedback replacing a toast/snackbar.
2. **Timer slide-in**: After the checkmark, the RestTimer slides up from below at
   `--animation-duration` (220ms ease-out). This transitions the user from "logging" mode to
   "resting" mode.

Additionally, all interactive elements (buttons, nav items) receive CSS `transition` for
press states (background-color, opacity) at `--transition-duration` (150ms).

The design constraint from WD-UX-03 (DISCUSS wave): 150ms for confirmation feedback, 220ms for
the timer slide-in. Both values must be accessible via CSS custom properties (so that the
`@media (prefers-reduced-motion: reduce)` block can collapse both to `0ms` in one place).

The architectural question: how are the animation durations made available to TypeScript, and what
implementation strategy governs the animations themselves?

Three implementation strategies were evaluated:

1. **CSS keyframes with durations as CSS custom properties** — animations defined in CSS,
   durations controlled via `var(--transition-duration)` and `var(--animation-duration)`.
   TypeScript accesses durations via `tokens.ts` constants.
2. **React Transition Group / Framer Motion** — a JavaScript animation library manages enter/exit
   transitions for React components.
3. **CSS keyframes with hardcoded durations + separate JS constants** — animations in CSS with
   literal `150ms`/`220ms` values, JS constants defined independently in a separate file without
   a CSS custom property link.

---

## Decision

### Option A (Chosen): CSS Keyframes with Durations as CSS Custom Properties

**Animation implementation**: All animations are defined as CSS `@keyframes` in the relevant
component `.css` files (co-located with the component, not in `design-tokens.css`). The `@keyframes`
rule itself is pure animation geometry (what transforms/opacities change). The duration is applied
via the `animation-duration` CSS property using `var(--animation-duration)` or
`var(--transition-duration)` depending on which applies.

**Duration source of truth**: `design-tokens.css` defines `--transition-duration: 150ms` and
`--animation-duration: 220ms` in `:root`. The `@media (prefers-reduced-motion: reduce)` block
overrides both to `0ms`. Since keyframe durations reference the CSS custom property, reduced
motion disables all animations in one CSS block — no JavaScript or component-level conditional
required.

**TypeScript access**: `src/styles/tokens.ts` exports:
- `TRANSITION_DURATION = 150` (number, milliseconds)
- `ANIMATION_DURATION = 220` (number, milliseconds)

These constants are used in TypeScript for any programmatic timing that must match the CSS
animation (e.g., `setTimeout(hideCheckmark, TRANSITION_DURATION + ANIMATION_DURATION)`). They
are plain number literals — not computed from the CSS file at runtime — so they must stay in
sync with `design-tokens.css` manually.

**Reduced motion**: The `@media (prefers-reduced-motion: reduce)` block in `design-tokens.css`
sets both custom properties to `0ms`. CSS animations with `animation-duration: 0ms` execute
their `@keyframes` instantly (jump to the final frame). The final visual state is identical to
the animated end-state. This satisfies SC-03 without any JS conditional or `if` branch in
component code.

For the TypeScript `setTimeout` callsite: if `prefers-reduced-motion` is active, the timeout
fires immediately because the CSS animation completes in 0ms — the UI updates before the timeout
fires, but the timeout still fires and produces the correct final state. The timing is not
perceptibly wrong.

---

## Alternatives Considered

### Alternative 1: Framer Motion

Framer Motion (MIT license, github.com/framer/motion, 24K+ stars) is the de facto React animation
library. It provides declarative `motion.*` components with enter/exit animations, spring physics,
and gesture support.

**Evaluation**:

Pros: `animate` prop provides declarative animation definitions; `AnimatePresence` handles
exit animations cleanly; `useReducedMotion()` hook integrates with `prefers-reduced-motion`
automatically.

Cons: Framer Motion's minimum bundle size is ~31 KB gzipped. For two animations (a checkmark
fade and a slide-in), this is disproportionate overhead. SC-08 (free tier, minimize bundle size)
weighs against adding a 31 KB dependency for 2 animations. The `useReducedMotion()` hook requires
a React hook call — this is fine, but it distributes the reduced-motion logic into components
rather than keeping it in the CSS file where all other motion decisions live. The CSS-only approach
already handles reduced motion correctly with zero JS. Framer Motion would add JS overhead to
replace a CSS-native behavior.

Additionally, SC-01 (presentation-only, no changes to hooks) — while `useReducedMotion()` is a
presentation hook, adding a new hook dependency to components blurs the presentation boundary.

**Rejection rationale**: 31 KB bundle overhead for 2 animations is unjustified. CSS keyframes
achieve identical visual results with zero additional dependencies. Reduced motion is handled
more maintainably in CSS than via a per-component hook call.

---

### Alternative 2: React Transition Group

React Transition Group (MIT license, github.com/reactjs/react-transition-group, 10K+ stars) is
a lower-level library that manages component enter/exit lifecycle (`entering`, `entered`, `exiting`,
`exited` states) via CSS class toggling.

**Evaluation**:

Pros: lighter than Framer Motion (~6 KB gzipped). Adds CSS class at the right moment for
enter/exit — useful for unmounting animations (e.g., animating a component out before it is
removed from the DOM).

Cons: the checkmark and timer slide-in in this feature do not require unmounting animations —
the checkmark fades (opacity 1 → 0) while remaining in the DOM, then is hidden via `display: none`
or `visibility: hidden`. There is no component unmounting problem to solve. React Transition Group
solves a problem (coordinated unmount timing) that this feature does not have. Even at 6 KB,
adding a dependency to solve a non-problem violates Principle 8 (simplest solution first).

`prefers-reduced-motion` is not handled by React Transition Group — the developer must add
`window.matchMedia` checks or a hook, distributing the responsibility that CSS currently handles
in one place.

**Rejection rationale**: Solves a problem (unmount coordination) this feature does not have.
CSS keyframes are sufficient. Dependency overhead not justified.

---

### Alternative 3: Hardcoded CSS Durations + Separate JS Constants

Define CSS animations with literal `150ms`/`220ms` values in the CSS files. Define matching
constants in `src/styles/tokens.ts` independently. No CSS custom properties for durations.

**Evaluation**:

This approach was considered and rejected specifically because it makes the `prefers-reduced-motion`
implementation harder. Without CSS custom property durations, the `@media (prefers-reduced-motion: reduce)`
block cannot collapse animations to `0ms` by overriding one property. Instead, every `@keyframes`
animation and every `transition` property with a literal duration would need to be individually
overridden in the reduced motion block. For 5 screens with multiple animated elements, this creates
a maintenance burden: add an animation somewhere, forget to add its override in the reduced motion
block, and SC-03 is silently violated.

CSS custom properties with a centralized reduced motion override are architecturally superior for
maintainability.

**Rejection rationale**: Reduced motion implementation becomes a per-animation maintenance burden
instead of a one-line override. CSS custom property approach is strictly better.

---

## Consequences

**Positive**:
- `@media (prefers-reduced-motion: reduce)` disabling all animations is a two-line change in one
  file (`design-tokens.css`). Adding a new animation anywhere in the app automatically inherits
  reduced motion behavior if it uses `var(--animation-duration)` or `var(--transition-duration)`.
- No new runtime JS dependency. Animation logic is in CSS — the browser's compositor handles it,
  not the JS thread. CSS animations run on the compositor thread and do not block React renders.
- Zero bundle size increase for the animation system.
- CSS keyframes are debuggable in browser DevTools' Animations panel.
- The `tokens.ts` constants give TypeScript code correct timing values for any `setTimeout`
  callbacks that must coordinate with animations.

**Negative**:
- CSS `animation-duration: var(--animation-duration)` — CSS custom properties inside animation
  shorthand properties work in all modern browsers (Chrome 49+, Firefox 31+, Safari 9.1+, iOS 9.3+)
  but require validation. Risk: LOW (all target browsers are well above these versions).
- `tokens.ts` constants can drift from `design-tokens.css` if a developer changes one without
  the other. Mitigation: comment in both files; Vitest snapshot test verifying the value (optional,
  crafter's decision).
- Exit animations (elements leaving the DOM) cannot be driven purely by CSS if the component is
  immediately unmounted. If a future story requires an element to animate out before unmounting,
  a small amount of JS timing coordination will be needed (not a problem in v1 scope).

**Neutral**:
- CSS easing functions (`ease`, `ease-out`, `cubic-bezier(...)`) are not design tokens — they
  are crafter-level decisions about animation feel. This ADR intentionally does not specify easing
  curves; software-crafter chooses the appropriate easing for each animation.
