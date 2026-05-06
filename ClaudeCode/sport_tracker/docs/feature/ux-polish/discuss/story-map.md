# Story Map: ux-polish

**User**: Marco — intermediate RR practitioner, outdoor park training, phone out between sets
**Goal**: Every screen feels like a precision instrument — visually coherent, glanceable, feedback-crisp
**Date**: 2026-05-04
**Platform**: PWA, React 18 + Vite + TypeScript strict

---

## Context: What Already Exists

The react-pwa-ui feature delivered all functional screens (Auth, Home, Session, RestTimer,
ReadinessCard, ExerciseHistory, ProgressionChain). All 8 user stories passed DoR and all 62 active
tests pass. The UX polish feature layers visual design on top of the working functional baseline.

**Scope boundary**: This story map covers ONLY visual/UX polish. No new functionality. No backend
changes. No new routes.

---

## Backbone (User Activities — left to right)

| Establish Token System | Polish Auth Screen | Polish Home Screen | Polish Session + Log | Polish Rest Timer | Polish Readiness Card | Polish History + Chain |
|---|---|---|---|---|---|---|
| Define CSS variables | Apply dark/light theme | Greeting + last session | Exercise picker + pickers | 56px fullscreen timer | State-colored signal | Tabular history style |
| Set typography scale | Form input styling | Start Session CTA | Checkmark at 150ms | Slide-in animation | Progress bar | Chain position indicator |
| Set spacing system | Error state styling | Sync badge in header | SETS/REPS labels | Pause/+15s/Skip buttons | READY teal / NOT YET grey | Teal current position |
| Prefers-reduced-motion | — | Bottom nav active state | Pre-filled next set UX | Timer zero pulse | REVIEW amber state | Offline cached indicator |
| Prefers-color-scheme | — | — | Offline silent save UX | — | — | — |

---

## Story Map Grid

```
ACTIVITY:      Token System     Auth            Home            Session/Log      Rest Timer      Readiness       History/Chain
               ────────────     ────────────    ────────────    ─────────────    ────────────    ────────────    ─────────────
SKELETON:      CSS tokens +     Auth screen     Home screen     Log Set form     Rest timer      Readiness       (no changes
               typography       dark/light      dark/light      dark/light       dark/light      card dark/light  in skeleton)
               [UX-01]          [UX-02]         [UX-03]         [UX-04]          [UX-05]         [UX-06]
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ WALKING SKELETON LINE ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
SLICE 2:       prefers-         Error state     Sync badge      150ms           Slide-in         Progress bar    History table
               reduced-motion   styling         in header       checkmark        animation        + state color   + chain style
               [UX-01b]         [UX-02b]        [UX-03b]        feedback         [UX-05b]         [UX-06b]        [UX-07]
                                                                [UX-04b]
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ SLICE 2 LINE ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
SLICE 3:       —                —               —               —               Timer zero        —               —
                                                                                pulse + offline
                                                                                indicator
                                                                                [UX-05c]
```

---

## Walking Skeleton

**Minimum end-to-end path that proves the design system is applied across the full app:**

1. **UX-01** (Token system): CSS custom properties defined in `design-tokens.css`. Dark mode tokens
   active by default. Light mode via `prefers-color-scheme: light` media query.
2. **UX-02** (Auth screen): Dark/light theme applied. Teal sign-in button. Label typography (14px
   caps for "EMAIL", "PASSWORD"). 48px button height.
3. **UX-03** (Home screen): Greeting, last-session context line. Teal "Start Session" CTA. Bottom
   nav with teal active state. Alternating surface rows in Recent list.
4. **UX-04** (Session / Log Set): 32px/600 SETS and REPS pickers. LABEL style (12px caps, secondary
   color). Teal "SAVE SET + START TIMER" CTA. 48px minimum touch targets.
5. **UX-05** (Rest Timer): 56px tabular-nums countdown. "REST" label at 14px caps. Pause/+15s/Skip
   buttons at 48px. Timer block on `#26262D` surface.
6. **UX-06** (Readiness Card): "NOT YET" in grey, "READY" in teal, "REVIEW" in amber. Criterion
   check ✓ in success green. "Needs a connection" in text-secondary (not red).

**Why this is the walking skeleton**: A user who goes through auth → home → log set → timer →
readiness will see a complete, coherent visual system. If any screen is unstyled, the experience
breaks — the app oscillates between "precision instrument" and "raw HTML." All 6 screens must land
together for the design system to be credible.

---

## Release Slices

### Slice 1 — Walking Skeleton: "Coherent Visual System Across Core Journey"

**Outcome target**: Marco opens the app, goes through auth → log → timer → readiness, and every
screen feels like it belongs to the same product.
**KPI**: First impression score (qualitative) — "Does this look like a serious training app?"
  Target: Marco rates ≥ 4/5 on first look at the styled app.
**Riskiest assumption validated**: Do the CSS tokens render correctly on both iOS Safari (dark) and
  Chrome Android (light)?

Stories:
- UX-01 (Design token system — CSS custom properties, typography, spacing, color)
- UX-02 (Auth screen polish — theme, form, button, error state)
- UX-03 (Home screen polish — greeting, CTA, recent list, nav, sync badge)
- UX-04 (Session/Log Set polish — pickers, labels, CTA, offline silent path)
- UX-05 (Rest Timer polish — 56px timer, slide-in, buttons)
- UX-06 (Readiness Card polish — state colors, progress bar, criterion display)

**Deliverable**: Visually complete app for the primary workout journey. History and Chain are
functional but un-polished (still readable — default browser styles don't break them).

---

### Slice 2 — Feedback Quality: "Microinteractions + State-Complete Polish"

**Outcome target**: Every interaction confirms itself. Marco never wonders if his tap registered.
**KPI**: Zero "did that save?" moments during a beta session (observable).

Stories:
- UX-04b (150ms checkmark feedback on set save — microinteraction)
- UX-01b (prefers-reduced-motion collapses all transitions to instant)
- UX-05b (Timer slide-in animation 220ms ease-out from Log Set)
- UX-03b (Sync badge styling — text-secondary → danger color escalation on retry exhaustion)
- UX-02b (Auth error state — inline red, fade-in, no toast)
- UX-06b (Readiness progress bar + REVIEW amber state)
- UX-07 (History table + Progression Chain styling — teal current position, greyed future steps)

**Deliverable**: Complete, fully polished app. Every screen and every state is styled.

---

### Slice 3 — Edge State Quality: "Timer Zero Pulse + Offline Indicator Completeness"

**Outcome target**: Even edge states (timer at zero, sync failures) feel designed, not forgotten.
**KPI**: No screen looks unstyled or broken during a park session (including offline states).

Stories:
- UX-05c (Timer zero visual pulse — single teal flash, no audio in v1)
- UX-08-offline-styling (Offline state in History + Readiness shows text-secondary styling,
  not browser-default grey)

**Deliverable**: No visual surprise in any state Marco encounters at the park.

---

## Priority Rationale

**Priority order: Walking Skeleton → Slice 2 → Slice 3**

1. **Slice 1 (Walking Skeleton) first** — The design system token file is the dependency for
   everything. Without UX-01, no other story can be built. The 5 screen stories (UX-02 through
   UX-06) all import from the token file. All 6 must ship together.

2. **Slice 2 second** — Microinteractions are what separate "styled" from "polished." The 150ms
   checkmark is the single highest-value feedback element (it anchors the core loop). Slice 2
   completes the quality bar and validates the emotional arc.

3. **Slice 3 third** — Edge states (timer zero, offline styling) are real but rare. Marco encounters
   them once per session at most. The risk is low; the visual impact when encountered is high. Builds
   on Slice 2.

**Priority formula applied** (Value × Urgency / Effort):

| Slice | Value (1-5) | Urgency (1-5) | Effort (1-5) | Score |
|-------|-------------|---------------|--------------|-------|
| Walking Skeleton | 5 | 5 | 3 | 8.3 |
| Slice 2 | 4 | 4 | 3 | 5.3 |
| Slice 3 | 3 | 2 | 2 | 3.0 |

Tie-breaking rule: Walking Skeleton wins slot 1 by definition.

---

## Scope Assessment: PASS

8 user stories (UX-01 to UX-07, plus 2 sub-stories that are part of Slice 2/3), touching 1
bounded context (UI/presentation layer only), estimated 5-8 days total across 3 release slices.
No backend changes. No new routes. No new TypeScript types. Each slice is independently
demonstrable (open the app, look at it). Scope is right-sized.

No story is estimated beyond 2 days. No story requires >3 integration points. Token system
(UX-01) is a dependency for all others — it ships first and is the only cross-cutting story.
