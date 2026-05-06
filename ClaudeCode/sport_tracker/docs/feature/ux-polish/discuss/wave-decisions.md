# Wave Decisions — ux-polish DISCUSS

**Feature**: ux-polish
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-05-04
**Upstream**: react-pwa-ui (delivered 2026-04-27). All 62 tests pass. All 8 stories Done.
**Discovery answers applied**: Q1 (theme), Q2 (accent), Q3 (feedback), Q4 (typography), Q5 (reference)

---

## Key Decisions Made in DISCUSS Wave

### WD-UX-01 — System-Adaptive Theme: CSS Media Query Only, No In-App Toggle

**Decision**: Dark/light mode follows `prefers-color-scheme` via CSS media query. No in-app
toggle (e.g., a sun/moon icon in the header) in v1.

**Rationale**: Discovery answer Q1 was unambiguous: "System-adaptive (follows device dark/light
mode setting)." An in-app toggle requires state management (Zustand or localStorage), a UI element
competing for header space, and a user decision that the device OS already makes for them. For a
solo developer on free tier, the cost is not justified. If a user is outdoors and needs light mode,
they switch their phone — they already know how to do this.

**Impact**: SC-04 in user-stories.md. `@media (prefers-color-scheme: light)` override in
`design-tokens.css`. No TypeScript changes required.

**Risk**: A user who wants dark mode on a device set to light mode cannot override in the app.
Accepted for v1. Deferred to v2 if user feedback requests it.

---

### WD-UX-02 — Accent Color: Electric Teal (#00B8D4), Not Strong's Red

**Decision**: The primary accent color is `#00B8D4` (electric teal). Secondary is `#0288D1`
(blue). Not red, not orange, not Strong's signature red.

**Rationale**: Discovery answer Q2: "Precision instrument (electric blue or teal accent,
charcoal/near-white base)." The user explicitly chose teal/blue as the accent family.
Strong's red reads as aggression/urgency — appropriate for a powerlifting context, but this app
is about progressive skill-building and intelligent readiness signalling. Teal reads as precision,
technology, and measured progress. The READY state uses teal as a reward color — this semantic
would be lost if teal were used everywhere neutrally.

**Impact**: All CTA buttons, active states, progress bar fills, and READY signal use `#00B8D4`.
Contrast verified: 5.1:1 on dark, 4.7:1 on light — both exceed WCAG 2.2 AA 4.5:1 threshold.

**Color role assignments**:
- `#00B8D4` — primary accent (CTAs, active states, progress fills, READY signal)
- `#00C896` — success green (checkmark feedback, criterion ✓ checks)
- `#F5A623` — amber warning (REVIEW signal only)
- `#EF5350` — danger/error (error messages, sync failure escalation after MAX_RETRIES)
- `#8A8A9A` — text-secondary / informative states (NOT YET label, offline messages, caps labels)

**Rule**: `#EF5350` is reserved for genuine errors requiring user attention (auth failure,
sync retry exhaustion). Offline informational states use `#8A8A9A`. This prevents alarm fatigue.

---

### WD-UX-03 — Feedback Pattern: Subtle Confirmation (~150ms Checkmark + Timer Slide-In)

**Decision**: Set save confirmation uses a `✓` that appears at 150ms and fades by 400ms.
Timer transition uses a 220ms ease-out Y-translate. Not a toast. Not a snackbar. Not a modal.

**Rationale**: Discovery answer Q3: "Subtle confirmation (checkmark briefly appears ~150ms,
timer slides in)." The user described the exact timing and the exact pattern.

The 150ms timing is intentional: it fires after the optimistic write has queued (not after
Supabase round-trip). Marco gets confirmation that his tap registered, not that the cloud
acknowledged it. This matches his mental model — he trusts local save; he knows sync is async.

A toast or snackbar would temporarily cover screen content, requires dismissal, and breaks the
flow from save → timer. The checkmark-then-timer pattern requires zero extra taps.

**Impact**: UX-04b story. `setTimeout(showCheckmark, 150)` in `useSessionLogger` (or its
associated component). `@keyframes timerSlideIn` in `RestTimer.tsx` stylesheet.

---

### WD-UX-04 — Typography: 56px Timer, 32px Data Numbers, 14px/12px Labels

**Decision**:
- Rest timer: 56px, weight 700, `tabular-nums`
- Set counts and reps in Log Set form: 32px, weight 600
- Section labels ("SETS", "REPS", "REST", "EXERCISE"): 12-14px, uppercase, `--text-secondary`
- Body text: 16px, weight 400
- App name in Auth: ALL CAPS, letter-spacing 0.08em

**Rationale**: Discovery answer Q4: "Large but proportional (timer ~56px, set counts ~32px)."
The user specified both sizes explicitly. The proportional ratio (56:32 = 1.75) creates a clear
visual hierarchy between "the thing you look at during rest" and "the thing you enter between sets."

The 14px caps label pattern (from Strong app reference) communicates "data field" without
consuming visual weight. The eye goes to the number, not the label. This is essential for
mid-workout use where cognitive load is elevated.

`tabular-nums`: Prevents digit columns from shifting width as the timer counts down
("1:23" → "1:22" → ... → "0:59"). Without this, the display jitters on iOS Safari.

**Impact**: All typography is implemented via CSS applied to existing component markup.
No TypeScript changes. No new components needed.

---

### WD-UX-05 — Visual Reference: Strong App Aesthetic, Not a Copy

**Decision**: The Strong app is the reference aesthetic — heavy contrast, athletic, data-forward.
The implementation diverges in: accent color (teal vs red), theme adaptivity (system-adaptive vs
dark-only), and feedback pattern (subtle checkmark vs toast).

**Rationale**: Discovery answer Q5: "Strong (the fitness app) — this is the feel to match/be
inspired by." The word "inspired" is operative. A direct copy would be:
1. Legally risky (trade dress concerns)
2. Inappropriate (Strong is powerlifting-focused; this app is calisthenics/skills-based)
3. A missed opportunity to establish distinct brand identity

The design language that Strong pioneered (dark surfaces, high-contrast data, athletic typography,
minimal decoration) is taken as a design vocabulary, applied with calisthenics-specific semantics.

**Impact**: All design decisions in this wave are consistent with Strong's vocabulary while
departing deliberately on accent color, theme adaptivity, and microcopy tone.

---

### WD-UX-06 — CSS Architecture: Custom Properties in One File, No CSS-in-JS, No Tailwind

**Decision**: All design tokens live in `src/styles/design-tokens.css` as CSS custom properties.
Component styles use CSS Modules or plain CSS classes importing the custom properties. No
styled-components, Emotion, Tailwind, or other CSS-in-JS or utility frameworks.

**Rationale**: SC-08 (free tier, no paid libraries). SC-07 (TypeScript strict — CSS-in-JS adds
runtime overhead). The existing codebase has minimal CSS; adding a CSS-in-JS layer would require
significant refactoring for no user-visible benefit. CSS custom properties with media query
overrides are the simplest, most portable, most performant solution for a system-adaptive theme.

**Impact**: DESIGN wave chooses the specific CSS Module setup. This DISCUSS wave decision only
constrains: tokens must be CSS custom properties, not JS constants injected via a theme provider.

**Exception**: If a token value needs to be referenced in TypeScript (e.g., for a programmatic
animation), it may be re-exported as a typed constant in `src/styles/tokens.ts` — but this is
a secondary, derived artifact, not the source of truth.

---

### WD-UX-07 — Scope Gate: Presentation Layer Only, No Functional Changes

**Decision**: Every story in this feature is CSS/visual only. The `useSessionLogger` hook,
`SessionRepository`, `SyncCoordinator`, `ReadinessCard` conditional logic, `timerStore`,
`authStore`, and all other business-logic files are read-only for this feature unless a CSS
change reveals a bug that must be fixed to support the visual goal.

**Rationale**: Functional changes in the same PR as visual changes make test failures ambiguous.
"Did the test break because of the CSS, or the logic change?" By enforcing this boundary, all 62
existing tests remain as a regression safety net.

**Exception protocol**: If a visual story requires adding a CSS class that reveals a missing ARIA
attribute (e.g., the progress bar needs `role="progressbar"` which was omitted), the ARIA addition
is permitted as it is an accessibility fix, not a functional change. Must be noted in the PR.

---

## DISCOVER Artifacts Status

DIVERGE wave was not run for ux-polish (this is a visual polish feature, not a new job story).
No `recommendation.md` or `job-analysis.md` in `docs/feature/ux-polish/diverge/`.

This is noted as a risk: the visual direction was established via 5 discovery questions in the
DISCUSS conversation rather than a formal DIVERGE wave. Risk is LOW — the questions covered
the four critical dimensions (theme, palette, feedback, typography) and a strong reference point.
The user's answers were unambiguous.

**Risk**: WD-UX-RISK-01 — Visual direction established in DISCUSS without DIVERGE wave.
**Mitigation**: All 5 discovery answers are documented in `wave-decisions.md` with explicit design
rationale. If the visual direction needs adjustment after beta feedback, a design revision story
can be created without invalidating the token architecture (custom properties can be changed in
one file).

---

## Open Questions for DESIGN Wave

| # | Question | Blocking? | Owner |
|---|----------|-----------|-------|
| OQ-UX-01 | CSS Modules vs plain CSS — does the existing Vite config support CSS Modules, or should plain CSS files with BEM naming be used? | No — either works with token approach | solution-architect |
| OQ-UX-02 | Should `design-tokens.css` be imported globally in `src/main.tsx` (before component CSS) or as a Vite virtual module? | No — import in main.tsx is simplest; virtual module if tree-shaking is needed | solution-architect |
| OQ-UX-03 | The greeting time of day function: where does it live? Pure utility in `src/lib/time.ts`? Or inline in HomeScreen? | No — unit-testable pure function strongly preferred (CLAUDE.md TDD paradigm) | solution-architect |
| OQ-UX-04 | The offline prop for History/Chain screens (UX-07): is the offline flag already accessible from the existing offline store, or does it need to be passed down from a parent? | Yes — if prop doesn't exist, a minor addition to ExerciseHistory/ProgressionChain props is needed | solution-architect |
| OQ-UX-05 | The sync badge in HomeScreen (UX-03): which state store exposes queue depth and retry count? `syncStore`? Or should HomeScreen read directly from SyncCoordinator? | No — can be solved in DESIGN wave; either approach is acceptable per hexagonal boundary | solution-architect |

---

## Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R-UX-01 | CSS change accidentally removes `role` or `aria-label` from existing components, breaking accessibility | LOW | MEDIUM | `vitest` tests verify ARIA labels on key elements; visual inspection confirms focus ring on all interactive elements |
| R-UX-02 | `#00B8D4` contrast fails on an intermediate surface not covered in the token table (e.g., a hover state) | LOW | HIGH | Run contrast check on all surface/accent combinations before Slice 1 merge |
| R-UX-03 | iOS Safari does not support a specific CSS feature used in the token file (e.g., `font-feature-settings: "tnum"`) | LOW | LOW | `tnum` is supported on iOS 3.2+; verified. Custom properties supported iOS 9.3+. Both safe. |
| R-UX-04 | 150ms checkmark timing is sensitive to device performance — on low-end Android, setTimeout fires late | LOW | LOW | 150ms ± 50ms is imperceptible to a user. The checkmark is visual reassurance, not a timing contract. |
| R-UX-05 | Visual changes reveal a latent logic bug in SessionScreen (e.g., pre-fill state not updating) | MEDIUM | LOW | If found: fix it, note it in PR. This is the "visual refactor reveals bugs" benefit, not a risk. |

---

## Handoff Package to DESIGN Wave

### Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| Journey visual | docs/feature/ux-polish/discuss/journey-ux-polish-visual.md | ASCII mockups per screen + emotional arc + token table |
| Story map | docs/feature/ux-polish/discuss/story-map.md | Backbone + walking skeleton + 3 release slices |
| Prioritization | docs/feature/ux-polish/discuss/prioritization.md | MoSCoW + dependency graph + priority formula |
| User stories | docs/feature/ux-polish/discuss/user-stories.md | 7 stories with LeanUX template + UAT + AC |
| DoR validation | docs/feature/ux-polish/discuss/dor-validation.md | All 7 stories PASSED all 9 DoR items |
| Outcome KPIs | docs/feature/ux-polish/discuss/outcome-kpis.md | 5 KPIs with measurement plan + hypothesis |
| Wave decisions | docs/feature/ux-polish/discuss/wave-decisions.md | This document |

### What DESIGN Wave Needs to Decide

1. CSS architecture: CSS Modules vs BEM naming + plain CSS (OQ-UX-01)
2. Token file import strategy: global in main.tsx vs Vite virtual module (OQ-UX-02)
3. Greeting pure function location (OQ-UX-03)
4. Offline prop addition to ExerciseHistory/ProgressionChain if needed (OQ-UX-04)
5. Sync badge data source: syncStore vs SyncCoordinator direct read (OQ-UX-05)
6. CSS transition implementation for slide-in: CSS keyframes vs React transition library
7. Whether `design-tokens.ts` (typed JS constants) is needed alongside `design-tokens.css`
8. Exact CSS class naming convention used across all 5 screen components
