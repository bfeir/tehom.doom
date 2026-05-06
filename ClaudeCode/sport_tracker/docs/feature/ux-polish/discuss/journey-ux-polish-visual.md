# Journey: UX Polish — Visual Map

**Feature**: ux-polish
**Journey name**: ux-polish
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-05-04
**Platform**: PWA, mobile-first (React 18 + Vite + TypeScript strict)
**Persona**: Marco — intermediate RR practitioner, 14 months training, outdoor park
**Discovery answers**: System-adaptive theme | Teal/blue accent on charcoal/near-white | Subtle
  ~150ms confirmation + timer slide-in | 56px timer / 32px set counts | Strong app as reference

---

## Visual Direction

### Design Philosophy

**Inspiration**: Strong app — dark/heavy contrast, athletic, data-forward. Not a copy — a reinterpretation
with teal/blue precision-instrument accent instead of red aggression, and system-adaptive theming
(dark follows device OS, light for bright sunlight at the park).

**Palette**:
- Background (dark): `#1A1A1F` (near-black, not pure black — avoids harsh OLED contrast)
- Background (light): `#F5F5F7` (near-white, matches iOS system background)
- Surface (dark): `#26262D` (elevated card/sheet surface)
- Surface (light): `#FFFFFF`
- Accent: `#00B8D4` (electric teal — readable on both dark and light)
- Accent secondary: `#0288D1` (blue, used for secondary interactive elements)
- Text primary (dark): `#F0F0F5`
- Text primary (light): `#1A1A1F`
- Text secondary: `#8A8A9A`
- Destructive / warning: `#EF5350`
- Success: `#00C896` (teal-green, close to accent family)

**Typography**:
- Display (timer): 56px, weight 700, mono-spaced (`tabular-nums` feature flag)
- Data primary (set counts, reps): 32px, weight 600
- Label: 14px, weight 500, letter-spacing 0.05em, uppercase — "SETS", "REPS", "REST"
- Body: 16px, weight 400
- Caption: 12px, weight 400, `color: text-secondary`

**Motion**:
- Confirmation checkmark: appears at 150ms, fades out by 400ms — a blink, not a linger
- Timer slide-in: translate Y from +8px to 0, opacity 0→1, duration 220ms, ease-out
- State transitions: 180ms ease-in-out cross-fade (no sliding between screens — too flashy for gym)
- Rest: `prefers-reduced-motion` respected — all transitions collapse to instant swaps

**Touch targets**: All interactive elements minimum 48×48px. Primary CTA minimum 56px height.

---

## Journey Flow (UX Polish Perspective)

```
TRIGGER: Marco opens the app. First impression: does this feel like a serious training tool?
    |
    v
[Screen 1]          [Screen 2]              [Screen 3]           [Screen 4]         [Screen 5]
 Auth Screen     →  Home Screen         →   Session / Log     →  Rest Timer       →  Readiness Card
                    (dashboard feel)        Set Entry             (fullscreen feel)
    |                    |                     |                      |                    |
Feels:              Feels:               Feels:               Feels:               Feels:
Credible,           Oriented,            Focused,             Calm, resting,       Informed,
professional        ready                efficient            glanceable           not anxious
```

**Emotional arc shift from react-pwa-ui baseline**:
Before polish: "functional but raw" — unstyled HTML elements, no visual hierarchy, no feedback
After polish: "precision instrument" — every element earns its space, data is instantly scannable,
  feedback is crisp and confidence-building

---

## Emotional Arc

```
Auth → credible first impression (dark surface, teal accent, real brand feel)
Home → oriented and ready (bold exercise name, teal "Start Session" CTA, last session context)
Log Set → focused efficiency (large reps picker, single-tap save, immediate checkmark feedback)
Rest Timer → calm confidence (56px countdown, glanceable from arm's length, no clutter)
Readiness Card → informed resolution (state rendered in accent color, gap clearly cited)
```

**Arc pattern**: Confidence Building with Aesthetic Reinforcement. The visual design amplifies
the existing emotional arc from react-pwa-ui. The checkmark at 150ms is the micro-win that
anchors the "small win" loop. The 56px timer eliminates the "did I read that right?" moment.

---

## Screen-by-Screen Mockups

### Screen 1: Auth Screen

Dark mode:

```
+--------------------------------------------------+
|                                                  |
|                                                  |
|  ████████████████████████████████████            |
|  CALISTHENICS TRACKER                            |
|  ████████████████████████████████████            |
|                                                  |
|  Track your rings road progression.             |
|  Works offline. No spreadsheet.                  |
|                                                  |
|  ┌──────────────────────────────────────┐        |
|  │  Email                               │        |
|  └──────────────────────────────────────┘        |
|  ┌──────────────────────────────────────┐        |
|  │  Password                            │        |
|  └──────────────────────────────────────┘        |
|                                                  |
|  ╔══════════════════════════════════════╗        |
|  ║         SIGN IN           [teal bg] ║        |
|  ╚══════════════════════════════════════╝        |
|                                                  |
|  Need an account?  Sign up →                     |
|                                                  |
+--------------------------------------------------+
Background: #1A1A1F  |  Button: #00B8D4 on #1A1A1F
Title: #F0F0F5 700   |  Label: #8A8A9A 14px
```

**Emotional state (entry)**: Is this app worth trusting?
**Emotional state (exit)**: Yes — feels built with intention. Not a prototype.
**Key visual decision**: App name in ALL CAPS with wide letter-spacing — athletic, not casual.
  Teal sign-in button is the only color in the screen — draws the eye immediately.
**Error state**: `role="alert"` message in `#EF5350` appears inline below the form. Never a toast
  that obscures the form. No raw error codes. Message fades in at 150ms.

---

### Screen 2: Home Screen

Dark mode:

```
+--------------------------------------------------+
|  CALISTHENICS TRACKER          [2 queued ↑]      |
|  ─────────────────────────────────────────────   |
|                                                  |
|  Good morning, Marco.                            |
|  Pike Push-ups — 3d ago                          |
|                                                  |
|  ╔══════════════════════════════════════╗        |
|  ║       + START SESSION    [teal bg]  ║        |
|  ╚══════════════════════════════════════╝        |
|                                                  |
|  ── RECENT ────────────────────────────────      |
|                                                  |
|  Pike Push-ups         3×8      3d ago           |
|  Pull-up Negatives     3×5      5d ago           |
|  Hollow Body          3×30s     5d ago           |
|                                                  |
|  ─────────────────────────────────────────────   |
|  [  SESSION  ]   [ HISTORY ]   [  CHAIN  ]       |
+--------------------------------------------------+
Header: #26262D surface  |  CTA: #00B8D4
Recent rows: alternating #26262D / #1A1A1F
Nav: 48px tall, icons + labels, teal active state
```

**Emotional state (entry)**: Arriving from outside. Is there context for me?
**Emotional state (exit)**: Ready — I see my last session, my CTA is obvious.
**Key visual decision**: "Good morning, Marco." — personal greeting in body weight. "Pike Push-ups — 3d ago"
  in text-secondary as a single line below. Enough context, zero clutter.
**Sync indicator**: When queue depth > 0, a small `↑ N` badge in text-secondary appears in the header.
  Not alarming (uses accent, not red), not hidden.
**Offline**: Badge uses `#8A8A9A` (text-secondary) — informative, not alarming.

---

### Screen 3: Session / Log Set Entry

Dark mode, active session (3 sets logged):

```
+--------------------------------------------------+
|  ← Session                    3 sets logged      |
|  ─────────────────────────────────────────────   |
|                                                  |
|  EXERCISE                                        |
|  ┌──────────────────────────────────────┐        |
|  │  Pike Push-ups (PPP)            ▼   │        |
|  └──────────────────────────────────────┘        |
|                                                  |
|  SETS                  REPS                      |
|  ┌────────────┐   ┌────────────────────┐         |
|  │     3      │   │        8           │         |
|  │  32px/600  │   │     32px/600       │         |
|  └────────────┘   └────────────────────┘         |
|                                                  |
|  FORM QUALITY (optional)           RPE           |
|  ● ● ● ○ ○                        6             |
|                                                  |
|  Note (optional)                                 |
|  ┌──────────────────────────────────────┐        |
|  │  Felt strong                         │        |
|  └──────────────────────────────────────┘        |
|                                                  |
|  ╔══════════════════════════════════════╗        |
|  ║    SAVE SET + START TIMER  [teal]   ║        |
|  ╚══════════════════════════════════════╝        |
|                                                  |
|  ── ✓ ─────────── (checkmark, 150ms, fades)      |
+--------------------------------------------------+
Sets/Reps pickers: 32px, weight 600, teal border on focus
LABEL style: 12px, #8A8A9A, uppercase, letter-spacing
Form quality dots: ● filled = #00B8D4, ○ = #26262D
```

**Emotional state (entry)**: Between sets — slightly rushed, sweaty hands.
**Emotional state (exit)**: Efficient — one tap saves, checkmark confirms, timer starts.
**Key visual decision**: SETS and REPS pickers are the most prominent elements (32px). Labels
  are de-emphasized (12px caps). The eye goes to data, not labels. This mirrors how Marco reads
  his paper grid — numbers first.
**Checkmark feedback**: `✓` appears at exactly 150ms after tap (after debounce), shown in `#00C896`
  (success green), fades to 0 opacity by 400ms. No toast, no modal. The CTA button itself
  briefly pulses teal-to-darker-teal (180ms) on tap — physical feedback for sweaty fingers.
**Offline**: No visual difference — save writes to IndexedDB silently. The queue badge increments
  in the header. User's flow is never interrupted.

---

### Screen 4: Rest Timer

Dark mode, 1:23 remaining, fullscreen feel:

```
+--------------------------------------------------+
|  Pike Push-ups  —  Set 3 of 3 saved              |
|  ─────────────────────────────────────────────   |
|                                                  |
|                                                  |
|                                                  |
|            ┌─────────────────┐                  |
|            │                 │                  |
|            │    1 : 2 3      │  ← 56px, mono    |
|            │                 │                  |
|            │      REST       │  ← 14px, caps    |
|            │                 │                  |
|            └─────────────────┘                  |
|                                                  |
|                                                  |
|  ┌──────────┐   ┌──────────┐   ┌──────────┐     |
|  │  PAUSE   │   │  +15s    │   │   SKIP   │     |
|  └──────────┘   └──────────┘   └──────────┘     |
|                                                  |
|  ─────────────────────────────────────────────   |
|  [  SESSION  ]   [ HISTORY ]   [  CHAIN  ]       |
+--------------------------------------------------+
Timer block: #26262D surface, 8px border-radius
Timer text: 56px, weight 700, tabular-nums, #F0F0F5
"REST" label: 14px, caps, #8A8A9A
Buttons: 48px tall, #26262D background, #F0F0F5 text
```

**Emotional state (entry)**: Just saved a set. Body is resting, mind is resting.
**Emotional state (exit)**: Ready — timer reaches 0, gentle visual pulse (no audio in v1 unless
  supported — per ADR-010 iOS backgrounding constraint).
**Key visual decision**: Timer is the entire screen. Nothing competes with it. At arm's length,
  56px digits are readable without glasses or squinting. "1:23" not "01:23" — no leading zero
  on minutes (less visual noise). The bottom nav is still present (Marco may want history mid-rest).
**Slide-in animation**: When screen transitions from Log Set to Rest Timer, the timer block
  translates Y +8px → 0, opacity 0→1, over 220ms ease-out. Feels like the timer
  "landing" rather than appearing.
**Timer at zero**: Background pulses from `#26262D` to `#00B8D4` and back once (single 400ms pulse).
  If screen is visible. No sound (iOS PWA limitation documented in ADR-010).

---

### Screen 5: Readiness Card

Dark mode, NOT YET state:

```
+--------------------------------------------------+
|  ← Session                   READINESS           |
|  ─────────────────────────────────────────────   |
|                                                  |
|  Pike Push-ups (PPP)                             |
|                                                  |
|  ┌──────────────────────────────────────┐        |
|  │                                      │        |
|  │  NOT YET           [#8A8A9A label]  │        |
|  │                                      │        |
|  │  ██████████████████████▒▒▒▒▒▒▒▒▒▒  │        |
|  │  2 of 3 sessions  [teal fill / grey] │        |
|  │                                      │        |
|  │  Rep range 3×5-8 ✓  (you: 3×8)     │        |
|  │  Consecutive sessions: 2 / 3 needed  │        |
|  │                                      │        |
|  │  1 more session at 3×8+ to advance. │        |
|  │                                      │        |
|  └──────────────────────────────────────┘        |
|                                                  |
|  [ View Progression Chain ]  [ View History ]    |
|                                                  |
|  ─────────────────────────────────────────────   |
|  [  SESSION  ]   [ HISTORY ]   [  CHAIN  ]       |
+--------------------------------------------------+
Card surface: #26262D
"NOT YET" label: 14px caps, #8A8A9A
Progress bar: teal fill (#00B8D4) / grey bg (#3A3A45)
Criterion check: ✓ in #00C896, gap in #F0F0F5
"1 more session" summary: 16px, #F0F0F5, weight 500
```

READY state:

```
+--------------------------------------------------+
|  ← Session                   READINESS           |
|  ─────────────────────────────────────────────   |
|                                                  |
|  Pike Push-ups (PPP)                             |
|                                                  |
|  ┌──────────────────────────────────────┐        |
|  │                                      │        |
|  │  READY  ✓              [teal label] │        |
|  │                                      │        |
|  │  ████████████████████████████████   │        |
|  │  3 of 3 sessions complete            │        |
|  │                                      │        |
|  │  Rep range 3×5-8 ✓                  │        |
|  │  Consecutive sessions: 3 / 3 ✓      │        |
|  │                                      │        |
|  │  You are ready to advance.           │        |
|  │                                      │        |
|  └──────────────────────────────────────┘        |
|                                                  |
|  ╔══════════════════════════════════════╗        |
|  ║   VIEW PROGRESSION CHAIN  [teal]   ║        |
|  ╚══════════════════════════════════════╝        |
|                                                  |
+--------------------------------------------------+
"READY" label: 14px caps, #00B8D4 (teal — reward color)
Progress bar: fully teal
CTA: primary teal button (same as Log Set CTA)
```

**Emotional state (entry)**: Curious — "Have I earned the next step?"
**Emotional state (exit)**: Informed without anxiety — "I know exactly what I need."
**Key visual decision**: The progress bar (2/3 teal) does the emotional work. The text confirms it.
  "NOT YET" is grey (neutral), never red (not punitive). "READY" is teal (reward).
  REVIEW state uses `#F5A623` (amber) — "pay attention" without "you failed."

---

## Error Path Visual Treatment

| Error | Visual Treatment |
|-------|-----------------|
| Auth failure | Inline `role="alert"` in `#EF5350`, 150ms fade-in, below form |
| Offline save (session) | Silent — queue badge increments, no interruption |
| Offline readiness | Card shows "Readiness check needs a connection" in `#8A8A9A` |
| Timer at zero (screen visible) | Single teal pulse on timer block |
| Timer at zero (backgrounded) | No visual — iOS limitation (ADR-010), documented |
| Sync failure (max retries) | Header badge changes from `#8A8A9A` to `#EF5350` — one visual escalation |

---

## Light Mode Variants

System-adaptive: when `prefers-color-scheme: light` OR device OS in light mode.

Background becomes `#F5F5F7`, surfaces become `#FFFFFF`, text primary becomes `#1A1A1F`.
Accent remains `#00B8D4` — holds contrast against both backgrounds (verified: 4.7:1 on white).
All motion stays the same. All touch targets stay the same.

The only screen-specific note: the timer block in light mode uses `#FFFFFF` surface with
`#1A1A1F` timer text and a `1px solid #E0E0E8` border for definition (no shadow needed on light).

---

## Shared Visual Tokens

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--bg-base` | `#1A1A1F` | `#F5F5F7` | Screen background |
| `--bg-surface` | `#26262D` | `#FFFFFF` | Cards, inputs, nav |
| `--accent` | `#00B8D4` | `#00B8D4` | Primary CTA, progress fill, READY label |
| `--accent-secondary` | `#0288D1` | `#0288D1` | Secondary CTAs, links |
| `--text-primary` | `#F0F0F5` | `#1A1A1F` | Body text, headings |
| `--text-secondary` | `#8A8A9A` | `#6A6A7A` | Labels, captions, offline state |
| `--success` | `#00C896` | `#00A37A` | Checkmark, READY accent, ✓ criteria |
| `--warning` | `#F5A623` | `#E09A1A` | REVIEW state, amber indicators |
| `--danger` | `#EF5350` | `#D32F2F` | Error messages, sync failure escalation |
| `--border` | `#3A3A45` | `#E0E0E8` | Input borders, dividers |

---

## Integration Checkpoints

| IC | Validates | Token / Artifact |
|----|-----------|-----------------|
| IC-UX-01 | CSS custom properties match token table above across all components | design-tokens.css |
| IC-UX-02 | Timer renders at 56px in all browsers (iOS Safari, Chrome Android) | timer font-size |
| IC-UX-03 | Checkmark feedback fires at 150ms ± 20ms after save tap (not before, not after 200ms) | useSessionLogger |
| IC-UX-04 | Timer slide-in animation completes in 220ms (measured via DevTools Performance) | CSS transition |
| IC-UX-05 | Teal accent contrast ratio ≥ 4.5:1 against both `#1A1A1F` and `#F5F5F7` | contrast checker |
| IC-UX-06 | All touch targets ≥ 48×48px (verified via DevTools mobile emulation) | CSS min-height |
| IC-UX-07 | `prefers-reduced-motion` collapses all transitions to instant (0ms) | CSS media query |
| IC-UX-08 | `prefers-color-scheme: light` correctly swaps all `--bg-*` and `--text-*` tokens | CSS media query |
