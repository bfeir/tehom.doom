# ADR-UX-01: Token Architecture and Component Styling

**Status**: Accepted
**Date**: 2026-05-04
**Author**: Morgan (nw-solution-architect)
**Feature**: ux-polish
**Supersedes**: ADR-009 (Component Library — shadcn/ui + Tailwind CSS)
**Superseded by**: —

---

## Context

ADR-009 selected shadcn/ui (Radix UI primitives + Tailwind CSS) as the component foundation for
the react-pwa-ui feature. That decision was correct for that feature's scope: accelerating
development of 8 interaction-heavy user stories with accessible primitives (Dialog, Select,
Combobox) and a utility-first styling layer.

The ux-polish feature has a fundamentally different scope: it is a **presentation-only** visual
polish pass over existing screens. The 7 stories in ux-polish introduce no new interactive
primitives, no new routes, and no new business logic. The task is:

1. Establish a unified design token system as the single source of truth for all visual values.
2. Apply those tokens consistently across the 5 existing screens (Auth, Home, Session, Timer,
   Readiness).
3. Implement system-adaptive light/dark theming with zero JavaScript.

The context that makes ADR-009 not directly applicable to this decision:

- **Tailwind CSS design tokens are in `tailwind.config.ts`**, not in CSS custom properties.
  For the ux-polish theme to work via `@media (prefers-color-scheme)` without JavaScript, the
  tokens must be CSS custom properties — Tailwind's JIT engine generates static utility classes
  that cannot change at runtime based on a media query without additional PostCSS configuration
  (e.g., `tailwindcss-dark-mode` or `class` strategy requiring JS).
- **Tailwind's `dark:` variant requires a class toggle** on `<html>` or `<body>` for the `class`
  strategy, or PostCSS plugin configuration for `media` strategy. Either path adds tooling
  complexity (WD-UX-06 from DISCUSS wave forbids this; SC-08 requires no paid libraries).
- **shadcn/ui components are retained** as accessible interactive primitives. This ADR does not
  remove or replace Radix UI components. It establishes the CSS custom property layer _underneath_
  shadcn/ui's Tailwind classes.

The decision is specifically about: **what is the source of truth for design tokens, and what
CSS methodology governs non-Radix component styling in ux-polish?**

**Constraints driving this decision**:
- SC-04: Light/dark theme via `prefers-color-scheme` only, zero JS.
- SC-07: TypeScript strict; motion constants must be typed if referenced in JS.
- SC-08: Free tier; no paid libraries, no external CSS frameworks added.
- Solo developer; simplicity is a first-class constraint.
- Existing codebase has Tailwind configured; cannot remove it (shadcn/ui components depend on it).

---

## Decision

### Option A (Chosen): CSS Custom Properties as SSOT; Plain CSS + BEM for New Styles

**Token source of truth**: `src/styles/design-tokens.css` — a single CSS file defining all design
tokens as CSS custom properties on `:root`. Dark values are the default. Light overrides are in
`@media (prefers-color-scheme: light)`. Reduced motion is in
`@media (prefers-reduced-motion: reduce)`.

**Import strategy**: `design-tokens.css` is imported once in `src/main.tsx` before all component
imports. CSS custom properties cascade globally.

**Component styling for ux-polish additions**: Plain CSS files with BEM naming convention.
Each screen component that receives new styles in this feature gets a co-located `.css` file
(e.g., `HomeScreen.css`, `SessionScreen.css`). These files import no frameworks — they reference
CSS custom properties directly via `var(--token-name)`.

**Secondary artifact**: `src/styles/tokens.ts` exports the two motion duration constants
(`TRANSITION_DURATION = 150` and `ANIMATION_DURATION = 220`, in milliseconds as plain numbers)
for use in any TypeScript file that needs programmatic timing (e.g., `setTimeout(show, TRANSITION_DURATION)`).
This file is derived from `design-tokens.css` — if the CSS value changes, `tokens.ts` must be
updated to match. The CSS file is always the canonical value.

**Coexistence with Tailwind**: Tailwind CSS and shadcn/ui components are retained unchanged.
The CSS custom properties layer is additive — it does not conflict with Tailwind's generated
classes. Where a Tailwind class and a CSS custom property address the same visual property on
the same element, the more specific selector wins (standard CSS cascade). New ux-polish styles
use plain CSS + BEM, not Tailwind utilities, to keep the token-referencing styles readable
without framework knowledge.

---

## Alternatives Considered

### Alternative 1: Tailwind CSS `dark:` Variant (Media Query Strategy)

Tailwind's `media` strategy for dark mode uses `@media (prefers-color-scheme: dark)` under the
hood and allows `dark:` utility variants in JSX.

**Evaluation**:

Pros: consistent with ADR-009's Tailwind choice; no new CSS methodology introduced.

Cons: requires updating `tailwind.config.ts` to set `darkMode: 'media'`, then auditing every
component's JSX to add `dark:` variants for all color utilities. For 5 screens with 50+ utility
class strings each, this is a full rewrite of component markup. The token values themselves remain
in `tailwind.config.ts` as JavaScript — not as CSS custom properties — meaning they cannot be
read by non-Tailwind CSS or by JavaScript without importing the config. Motion constants would need
a separate export from `tailwind.config.ts` or a manual `tokens.ts` file regardless.

The critical problem: Tailwind's media strategy compiles `dark:bg-[#1A1A1F]` into separate
`@media (prefers-color-scheme: dark)` blocks per class. There is no single override block — the
theme switching logic is distributed across hundreds of generated utility classes. If a token value
needs to change (e.g., the accent color shifts from teal to blue in v2), you change `tailwind.config.ts`
and rebuild. With CSS custom properties, you change one line and the browser updates instantly
without a rebuild. For a design token system intended to be the long-term SSOT, CSS custom
properties are structurally superior.

**Rejection rationale**: Full JSX markup audit required for 5 screens; design tokens remain
non-readable without Tailwind toolchain; CSS custom property approach achieves the same
`prefers-color-scheme` behavior with less total change and a more maintainable token SSOT.

---

### Alternative 2: CSS Modules with Token Imports

CSS Modules (`.module.css`) would scope all class names at build time, eliminating class name
collisions. Vite supports CSS Modules natively.

**Evaluation**:

Pros: class name scoping prevents accidental style leakage between components. Consistent with
Vite's first-class CSS Modules support.

Cons: for a presentation-only feature with no new interactive components, class name collision
risk is low — existing screens are already isolated. CSS Modules add a build-time transform that
renames classes (e.g., `.session-card` becomes `._session-card_xyz12_1`), making browser DevTools
debugging harder (especially for a solo developer doing visual inspection). The class scoping
benefit does not outweigh the DevTools ergonomics cost for a feature where visual inspection is
the primary verification method (SC-06: no E2E tests in v1). Plain CSS with BEM naming provides
sufficient collision protection via naming convention without the build-time opacity.

**Rejection rationale**: DevTools ergonomics cost not justified for a presentation-only feature
where visual inspection is the primary acceptance method. BEM naming provides sufficient
collision protection.

---

### Alternative 3: Retain Tailwind + CSS Custom Properties Hybrid (Tokens in Tailwind Config)

Define tokens in `tailwind.config.ts` as CSS custom property values: `--accent: theme('colors.accent')`.

**Evaluation**:

This approach is technically viable but creates a bidirectional dependency: Tailwind config references
CSS variables; CSS variables reference Tailwind config values. The SSOT becomes ambiguous —
which file do you change when the accent color needs updating? This bidirectional coupling is
an anti-pattern for a design token system. The token SSOT must have a single, unambiguous home.

**Rejection rationale**: SSOT ambiguity. Bidirectional dependency between CSS and Tailwind config
is an anti-pattern. CSS custom properties as the sole SSOT is simpler and unambiguous.

---

## Consequences

**Positive**:
- Single file (`design-tokens.css`) is the unambiguous SSOT for all visual values. Color, type,
  spacing, motion, and radius changes require editing exactly one file.
- CSS custom properties cascade globally — any component that references `var(--accent)` inherits
  the correct value in both light and dark mode without any additional configuration.
- `@media (prefers-color-scheme: light)` override in one block. If a future team member needs
  to understand the theming system, they read one `@media` block.
- `@media (prefers-reduced-motion: reduce)` in one block. Accessibility compliance is a
  two-line change in one file.
- Tailwind and shadcn/ui components are unaffected. No migration cost for existing components.
- Plain CSS + BEM is readable without framework knowledge. Any developer can understand the
  styles without Tailwind documentation.
- `tokens.ts` provides TypeScript type safety for motion constants used in JS timing logic.

**Negative**:
- Two CSS methodologies now coexist: Tailwind utilities (existing shadcn/ui components) and
  plain CSS + BEM (new ux-polish additions). A future developer might be confused about which
  to use for new components.
  Mitigation: Document the rule in `CLAUDE.md`: "For components using shadcn/ui primitives, use
  Tailwind utilities. For new presentation components in ux-polish, use plain CSS + BEM."
- `tokens.ts` is a derived artifact that can drift from `design-tokens.css` if a developer
  updates one but not the other.
  Mitigation: Comment in both files cross-referencing each other. Consider a CI lint rule that
  verifies the two numeric values match (Vitest snapshot or custom lint check).
- Tailwind's purge/JIT will not include `var(--token)` references in plain CSS files as
  "used" utilities — but this is irrelevant since the custom properties are defined in
  `design-tokens.css`, not generated by Tailwind. No purge conflict.

**Neutral**:
- This ADR supersedes ADR-009's Tailwind design token layer (`tailwind.config.ts`) as the SSOT.
  ADR-009's decision to use shadcn/ui primitives (Radix UI) is fully retained and unaffected.

---

## License Summary

| Component | License | Notes |
|-----------|---------|-------|
| CSS custom properties (W3C standard) | Open standard | No dependency |
| BEM naming convention | Open standard | No dependency |
| Tailwind CSS v3 (retained) | MIT | github.com/tailwindlabs/tailwindcss |
| Radix UI primitives (retained) | MIT | github.com/radix-ui/primitives |
| shadcn/ui (retained) | MIT | github.com/shadcn-ui/ui |

All tooling is OSS/open standard. No proprietary dependency introduced.
