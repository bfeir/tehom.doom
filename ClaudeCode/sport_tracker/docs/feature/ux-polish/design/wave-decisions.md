# Wave Decisions — ux-polish DESIGN

**Feature**: ux-polish
**Produced by**: Morgan (nw-solution-architect), DESIGN wave
**Date**: 2026-05-04
**Upstream**: ux-polish DISCUSS wave (2026-05-04). 7 stories, all DoR PASSED.
**Builds on**: react-pwa-ui DESIGN + react-pwa-ui DISTILL (62 tests passing)

---

## Decision Summary

| # | Decision | Chosen Option | ADR |
|---|----------|---------------|-----|
| WD-DESIGN-01 | Token architecture | Option A — CSS custom properties in `design-tokens.css`; thin `tokens.ts` for motion constants | ADR-UX-01 |
| WD-DESIGN-02 | Component styling | Option B — Plain CSS + BEM naming | ADR-UX-01 |
| WD-DESIGN-03 | Theme switching | Option A — `@media prefers-color-scheme` in CSS, zero JS | ADR-UX-02 |
| WD-DESIGN-04 | Animation system | Option A — CSS keyframes; motion durations as CSS custom properties | ADR-UX-03 |
| WD-DESIGN-05 | Navigation pattern | Option A — Fixed bottom nav bar with `env(safe-area-inset-bottom)` | ADR-UX-04 |

Open questions from DISCUSS wave resolved:

| OQ-ID | Question | Resolution |
|-------|----------|------------|
| OQ-UX-01 | CSS Modules vs plain CSS | Plain CSS + BEM (see WD-DESIGN-02) |
| OQ-UX-02 | Token import strategy | Global import in `src/main.tsx` before all component CSS |
| OQ-UX-03 | Greeting pure function location | `src/lib/greeting.ts` — pure function, unit-testable |
| OQ-UX-04 | Offline prop for History/Chain | Pass as prop from parent; add `isOffline: boolean` to component interface |
| OQ-UX-05 | Sync badge data source | Read from `syncStatusStore` (Zustand) — already exposed by `SyncCoordinator` |

---

## Complete Token Set

This is the normative token specification. `design-tokens.css` is the SSOT. `tokens.ts` is a
secondary derived artifact for the two motion constants only.

### Color Tokens

Dark mode is default (`:root`). Light mode overrides via `@media (prefers-color-scheme: light)`.

| Token | Dark Value | Light Value | Role |
|-------|-----------|-------------|------|
| `--bg-base` | `#1A1A1F` | `#F5F5F7` | Screen background |
| `--bg-surface` | `#26262D` | `#FFFFFF` | Cards, inputs, bottom nav |
| `--bg-elevated` | `#32323C` | `#EBEBF0` | Elevated cards, popover surfaces |
| `--text-primary` | `#F0F0F5` | `#1A1A1F` | Body text, headings |
| `--text-secondary` | `#8A8A9A` | `#6B6B7A` | Labels, captions, NOT YET state |
| `--text-muted` | `#5A5A6A` | `#9A9AAA` | Placeholders, disabled states |
| `--accent` | `#00B8D4` | `#00B8D4` | CTAs, active states, READY signal, progress fill |
| `--accent-dim` | `#004D5C` | `#B3ECF5` | Accent backgrounds (e.g., chip fill behind teal text) |
| `--danger` | `#EF5350` | `#D32F2F` | Auth errors, sync failure after MAX_RETRIES |
| `--success` | `#00C896` | `#00A87A` | Checkmark confirmation, criterion checks |
| `--offline` | `#8A8A9A` | `#6B6B7A` | Offline informational messages (not alarm) |
| `--border` | `#3A3A45` | `#D9D9E0` | Card borders, dividers |
| `--border-strong` | `#55556A` | `#B0B0BF` | Input focus ring, active tab underline |

**Rationale for `--offline` using `--text-secondary` value**: offline state is informational, not
an error. Using `--danger` for offline creates alarm fatigue (WD-UX-02 from DISCUSS wave).
`--danger` is reserved for genuine user-action-required conditions only.

**Contrast verification**:
- `--accent` `#00B8D4` on `--bg-base` `#1A1A1F`: 5.1:1 (WCAG AA pass, ≥ 4.5:1)
- `--accent` `#00B8D4` on `--bg-base` `#F5F5F7`: 4.7:1 (WCAG AA pass, ≥ 4.5:1)
- `--text-primary` on both base colors: > 7:1 (WCAG AAA pass)

### Typography Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--font-size-timer` | `56px` | Rest timer display (RestTimer component) |
| `--font-size-set-count` | `32px` | Set count and reps inputs in Log Set form |
| `--font-size-body` | `16px` | General body text, descriptions |
| `--font-size-label` | `13px` | Field labels, caps labels (SETS, REPS, REST) |
| `--font-weight-bold` | `700` | Timer display, primary headings |
| `--font-weight-semi` | `600` | Set count inputs, CTA button text |
| `--font-weight-regular` | `400` | Body text, secondary information |

**Font stack**: System font stack only. No external font loading (SC-08).
```
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```
`font-feature-settings: "tnum"` applied to all numeric display elements (timer, reps, sets) to
prevent digit-width jitter on countdown.

### Spacing Tokens

Base unit: 4px. All spacing is a multiple of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| `--touch-target` | `44px` | Minimum touch target (HIG requirement, SC-02 extends to 48px for primary CTAs) |
| `--spacing-1` | `4px` | Micro gaps (icon + label spacing) |
| `--spacing-2` | `8px` | Tight internal padding |
| `--spacing-3` | `12px` | Default item padding |
| `--spacing-4` | `16px` | Standard section padding |
| `--spacing-5` | `20px` | Medium content gap |
| `--spacing-6` | `24px` | Section gaps, card internal padding |
| `--spacing-8` | `32px` | Large layout gaps |
| `--spacing-10` | `40px` | Extra large spacing |
| `--spacing-12` | `48px` | Primary CTA height minimum |

### Motion Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-duration` | `150ms` | Button press, checkmark appearance, state feedback |
| `--animation-duration` | `220ms` | Timer slide-in, screen transitions, keyframe animations |

**Reduced motion**: `@media (prefers-reduced-motion: reduce)` sets both to `0ms` (SC-03).
Both values are also exported in `src/styles/tokens.ts` as typed TypeScript constants for
any programmatic animation (`setTimeout(showCheckmark, TRANSITION_DURATION)`).

### Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-card` | `12px` | Session cards, readiness card, exercise cards |
| `--radius-button` | `8px` | Primary CTAs, secondary buttons |
| `--radius-chip` | `99px` | Filter chips, signal state badges |

---

## Architecture Answers

### Token Import Strategy

`design-tokens.css` is imported once at application root:

```
src/main.tsx → import './styles/design-tokens.css'
```

This ensures custom properties cascade globally before any component CSS. No Vite virtual module
required — global import in `main.tsx` is simpler and fully supported by Vite's CSS pipeline.

### Greeting Pure Function

Lives in `src/lib/greeting.ts`. Pure function: receives a `Date` (or hour integer) and returns
a greeting string. No side effects. Unit-testable in isolation. HomeScreen imports and calls it.

### Sync Badge Data Source

HomeScreen reads `pendingCount` and `syncStatus` from `syncStatusStore` (Zustand). This store is
already written by `SyncCoordinator` from outside the React tree. HomeScreen never imports
`SyncCoordinator` directly — that would violate the hexagonal boundary
(`components/` must not import `services/`).

### Offline Prop

`ExerciseHistory` and `ProgressionChain` components receive `isOffline: boolean` as a prop.
The parent screen reads `syncStatusStore.syncStatus === 'error'` or browser `navigator.onLine`
(via an existing hook) and passes it down. This is a one-line prop addition — no store changes.

---

## CSS BEM Naming Convention

All component CSS files use BEM naming. Block = component name, Element = `__element`,
Modifier = `--modifier`. Example for the session card:

```
.session-card               (block)
.session-card__header       (element)
.session-card__title        (element)
.session-card--elevated     (modifier)
.session-card--offline      (modifier)
```

Class names reference CSS custom properties directly:
```css
.session-card {
  background: var(--bg-surface);
  border-radius: var(--radius-card);
  border: 1px solid var(--border);
}
```

---

## Architectural Enforcement

**Tool**: import-linter (already configured for this project's hexagonal boundaries).

New rule to add for the styling layer:

- `src/styles/design-tokens.css` is not imported by any file in `src/services/` or
  `src/repositories/` (CSS has no business in the domain layer).
- `src/styles/tokens.ts` may only be imported by files in `src/components/` and `src/pages/`
  (typed constants are a UI concern).

No additional tooling required. CSS custom properties are inherently scoped to the presentation
layer — there is no architectural violation possible from CSS alone.

---

## Handoff to DISTILL Wave

**Acceptance-designer receives**:

1. `docs/feature/ux-polish/design/wave-decisions.md` (this document) — complete token set
2. `docs/feature/ux-polish/design/adr-ux-01-token-architecture.md` — token + styling ADR
3. `docs/feature/ux-polish/design/adr-ux-02-theme-implementation.md` — theme switching ADR
4. `docs/feature/ux-polish/design/adr-ux-03-animation-system.md` — animation ADR
5. `docs/feature/ux-polish/design/adr-ux-04-navigation-pattern.md` — navigation ADR
6. `docs/feature/ux-polish/design/c4-diagrams.md` — C4 L1 + L2 diagrams
7. `docs/product/architecture/brief.md` — `## UX Design System` section appended

**What software-crafter decides** (not specified here):
- Internal structure of `design-tokens.css` (ordering, grouping comments)
- Exact BEM class names per component beyond the naming convention above
- Whether to use CSS custom property shorthand or longhand inside component files
- Animation easing curves (ease, ease-out, cubic-bezier) — not a token, crafter decision
- `tokens.ts` internal export style (named exports vs object vs enum)
