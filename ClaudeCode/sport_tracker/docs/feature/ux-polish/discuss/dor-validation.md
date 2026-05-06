# Definition of Ready Validation — ux-polish

**Feature**: ux-polish
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-05-04
**DoR version**: 9-item hard gate (nw-leanux-methodology)

---

## Story: UX-01 — Design Token System

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco opens the styled app and sees inconsistent surface colors across screens — he loses trust." Domain language used throughout. |
| User/persona identified with specific characteristics | PASS | Marco (intermediate RR practitioner, 14 months, outdoor park) + Luis (beta friend, first use). Both with specific context. |
| 3+ domain examples with real data | PASS | Dark mode iOS (Marco), light mode Android (Maria), reduced-motion iOS (Luis). All have real names and realistic context. |
| UAT scenarios (3-7) in Given/When/Then | PASS | 4 scenarios. All in Given/When/Then with observable outcomes. No implementation titles. |
| AC derived from UAT | PASS | 5 AC items, each traceable to a UAT scenario. |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | 1-2 days effort (CSS file, no logic). 4 scenarios. |
| Technical notes: constraints/dependencies | PASS | System font stack, CSS custom properties, import order, tabular-nums, no hardcoded hex values. |
| Dependencies resolved or tracked | PASS | None — first story in feature. Explicit "no dependencies." |
| Outcome KPIs defined with measurable targets | PASS | KPI-UX-05 (0 unstyled screens) primary. Guardrail: 62 tests pass. |

### DoR Status: PASSED

---

## Story: UX-02 — Auth Screen Polish

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Luis opens the link and sees a plain white form — browser default. He asks: is this the right link?" Specific pain. |
| User/persona identified with specific characteristics | PASS | Luis (new beta user, Android, first visit) and Maria (beta user, light mode). Specific device context. |
| 3+ domain examples with real data | PASS | Luis dark mode Android, Maria light mode, Marco wrong-password error. All named, realistic. |
| UAT scenarios (3-7) in Given/When/Then | PASS | 3 scenarios. Minimal but sufficient — auth screen has limited UX states. |
| AC derived from UAT | PASS | 5 AC items. Each maps to a scenario. |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | 1 day effort. 3 scenarios (auth screen is one form, limited states). |
| Technical notes: constraints/dependencies | PASS | Error animation timing, no Google OAuth note (per existing AuthScreen.tsx), depends on UX-01. |
| Dependencies resolved or tracked | PASS | UX-01 (tracked, first in sequence). |
| Outcome KPIs defined with measurable targets | PASS | 0 "is this the right link?" questions in beta onboarding. KPI-UX-01 linked. |

### DoR Status: PASSED

---

## Story: UX-03 — Home Screen Polish

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco sees his email as raw text, three plain NavLink elements, no greeting, no orientation." Specific, domain language. |
| User/persona identified with specific characteristics | PASS | Marco returning after session or auth. Specific arrival context. |
| 3+ domain examples with real data | PASS | Marco 7am park (happy path), Marco with 2 queued sets (sync badge), Marco with retry exhaustion (escalation). |
| UAT scenarios (3-7) in Given/When/Then | PASS | 4 scenarios covering orientation, nav active state, sync badge, and escalation. |
| AC derived from UAT | PASS | 5 AC items. Greeting, CTA, nav, sync badge — all traced from scenarios. |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | 1-2 days effort. 4 scenarios. |
| Technical notes: constraints/dependencies | PASS | Greeting pure function (unit-testable), last-session from existing cache, sync badge from existing store, depends on UX-01. |
| Dependencies resolved or tracked | PASS | UX-01 (tracked). |
| Outcome KPIs defined with measurable targets | PASS | CTA tap within 5 seconds in 100% of observed beta sessions. |

### DoR Status: PASSED

---

## Story: UX-04 — Session / Log Set Screen Polish

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "Marco picks up his phone between sets — sweaty, one-handed. He squints at the small form. He types. He goes back to resting." Vivid, domain language. |
| User/persona identified with specific characteristics | PASS | Marco mid-workout, between sets, sweaty hands, time pressure. Specific physical context. |
| 3+ domain examples with real data | PASS | 3rd set dark mode happy path, 2nd set pre-fill, offline save edge case. All named and realistic. |
| UAT scenarios (3-7) in Given/When/Then | PASS | 4 scenarios: glanceability, CTA size, pre-fill, offline silent save. |
| AC derived from UAT | PASS | 6 AC items. Font sizes, CTA dimensions, pre-fill logic, offline path, set counter — all from scenarios. |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | 1-2 days effort. 4 scenarios. |
| Technical notes: constraints/dependencies | PASS | HTML number input with CSS, pre-fill from existing useSessionLogger, offline path verified by existing tests, depends on UX-01. |
| Dependencies resolved or tracked | PASS | UX-01 (tracked). |
| Outcome KPIs defined with measurable targets | PASS | ≤ 30 seconds per set entry. Shared with react-pwa-ui KPI-01. |

### DoR Status: PASSED

---

## Story: UX-04b — 150ms Checkmark Feedback

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "There is a gap (50-300ms) where nothing visible changes. He sometimes taps twice — creating a duplicate set." Specific, causal problem. |
| User/persona identified with specific characteristics | PASS | Marco immediately after tapping save CTA. Peak time-pressure moment. |
| 3+ domain examples with real data | PASS | Online save (80ms write), slow write (200ms Supabase), reduced motion (Luis). All named. |
| UAT scenarios (3-7) in Given/When/Then | PASS | 3 scenarios: checkmark timing, button pulse, reduced motion. |
| AC derived from UAT | PASS | 5 AC items: timing, color, opacity animation, button pulse brightness, duplicate prevention. |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | 0.5-1 day effort. 3 scenarios. Tight, focused. |
| Technical notes: constraints/dependencies | PASS | setTimeout at 150ms, optimistic write timing, existing debounce in useSessionLogger. Depends on UX-04. |
| Dependencies resolved or tracked | PASS | UX-04 (tracked). |
| Outcome KPIs defined with measurable targets | PASS | 0 duplicate entries in beta sessions. KPI-UX-02 linked. |

### DoR Status: PASSED

---

## Story: UX-05 — Rest Timer Screen Polish

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "He puts the phone down and glances from 50cm away. His eye has to search for the number." Specific physical context. |
| User/persona identified with specific characteristics | PASS | Marco mid-rest, phone on bench, reading from arm's length. Specific physical state. |
| 3+ domain examples with real data | PASS | Dark mode 1:23 remaining (Marco), timer at zero (screen visible), light mode outdoor (Maria). |
| UAT scenarios (3-7) in Given/When/Then | PASS | 3 scenarios: digit size, button targets, slide-in animation. |
| AC derived from UAT | PASS | 6 AC items: font-size/weight/feature, surface color, REST label, button sizes, slide-in spec, reduced-motion. |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | 1-2 days effort. 3 scenarios. |
| Technical notes: constraints/dependencies | PASS | tabular-nums feature flag, iOS surface difference, timer zero pulse deferred to UX-05c. Depends on UX-01. |
| Dependencies resolved or tracked | PASS | UX-01 (tracked). UX-05c flagged as separate Slice 3 story. |
| Outcome KPIs defined with measurable targets | PASS | 100% of timer glances require ≤ 1 look. KPI-UX-03 linked. |

### DoR Status: PASSED

---

## Story: UX-06 — Readiness Card Polish

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "His eye goes to the `<h2>` first, but the semantic weight does not match the visual weight he needs." Precise observation. |
| User/persona identified with specific characteristics | PASS | Marco mid-session or post-session, curious → informed emotional arc. Specific context. |
| 3+ domain examples with real data | PASS | NOT YET (2/3 sessions), READY (3/3 sessions), offline at park. All named, concrete. |
| UAT scenarios (3-7) in Given/When/Then | PASS | 4 scenarios: NOT YET, READY, REVIEW, offline. All 4 signal states covered. |
| AC derived from UAT | PASS | 7 AC items covering all three signal states, progress bar, criterion checks, offline color, summary font. |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | 1-2 days effort. 4 scenarios. |
| Technical notes: constraints/dependencies | PASS | ARIA progressbar role, existing isOffline/hasTimedOut props, depends on UX-01. |
| Dependencies resolved or tracked | PASS | UX-01 (tracked). |
| Outcome KPIs defined with measurable targets | PASS | ≤ 3 seconds to readiness comprehension. KPI-UX-04 linked. |

### DoR Status: PASSED

---

## Story: UX-07 — History + Chain Styling

| DoR Item | Status | Evidence |
|----------|--------|----------|
| Problem statement clear, domain language | PASS | "He has to read every row carefully instead of scanning. No teal current-position indicator." Specific friction. |
| User/persona identified with specific characteristics | PASS | Marco post-session, reviewing history or chain. Lower time pressure but still on phone. |
| 3+ domain examples with real data | PASS | History table dark mode (Marco), progression chain current anchor (Marco), offline cached history (Marco at park). |
| UAT scenarios (3-7) in Given/When/Then | PASS | 3 scenarios: alternating rows, current position, offline cached indicator. |
| AC derived from UAT | PASS | 6 AC items: row colors, column header style, current exercise accent, chain step colors, offline indicator. |
| Right-sized (1-3 days, 3-7 scenarios) | PASS | 1-2 days effort. 3 scenarios. Two components but CSS-only changes. |
| Technical notes: constraints/dependencies | PASS | No new data fetching, offline prop may need minor addition (flagged for DESIGN wave), depends on UX-01. |
| Dependencies resolved or tracked | PASS | UX-01 (tracked). Offline prop flag documented as DESIGN wave question. |
| Outcome KPIs defined with measurable targets | PASS | Current chain position found on first look (qualitative). KPI-UX-04 linked (visual hierarchy). |

### DoR Status: PASSED

---

## Anti-Pattern Audit

| Anti-Pattern | Check | Result |
|---|---|---|
| Implement-X titles | All story titles start from user pain or experience | PASS — "Auth Screen Polish" is named for the experience change, not a technical action |
| Generic data | All domain examples use real names (Marco, Luis, Maria) and realistic contexts | PASS — no "user123" or "test@test.com" |
| Technical AC | All AC describe observable outcomes or measurable properties | PASS — e.g., "font-size: 32px" is verifiable; "use CSS Grid" would be technical prescription |
| Technical scenario titles | All scenario titles describe user experience outcomes | PASS — "Timer digits are glanceable from arm's length" not "RestTimer applies 56px font-size via CSS class" |
| Oversized stories | All stories 1-2 days, 3-4 scenarios | PASS — largest is UX-06 with 4 scenarios |
| Abstract requirements | All AC have concrete, measurable criteria | PASS — color values, px dimensions, timing in ms |

---

## Scope Assessment: PASS

7 primary user stories (UX-01 through UX-07), 2 sub-stories (UX-04b, UX-05b as Slice 2),
2 Slice 3 stories (UX-05c, UX-08-offline-styling — documented in story-map.md but not fully
specified as standalone stories, as they are thin and can be done alongside UX-05c's parent).

Total: touching 1 bounded context (presentation layer only). Estimated 5-8 days total.
No new routes, no new backend calls, no new TypeScript types beyond CSS token constants.
Each slice is independently demonstrable. Right-sized per Elephant Carpaccio gate.

---

## Peer Review Summary

Self-review completed against nw-po-review-dimensions criteria:

### Confirmation Bias Check
- Technology bias: None detected — no CSS framework prescribed (pure CSS tokens; implementation choice is DESIGN wave's). No "use Tailwind" or "use styled-components" in any story.
- Happy path bias: All signal states covered in UX-06 (NOT_YET, READY, REVIEW, offline, timeout). Error state in UX-02. Offline paths in UX-03, UX-04, UX-07.
- Availability bias: Reference to Strong app is documented as inspiration, not requirement. Teal/blue vs Strong's red is a deliberate departure, not an uncritical copy.

### Completeness Check
- Stakeholder perspectives: Marco (user + developer), Luis/Maria (beta users). Operations/support not applicable (solo developer). Compliance: WCAG 2.2 AA addressed via SC-03 (reduced-motion) and SC-05 (contrast ratio).
- Error scenarios: Auth error (UX-02), offline readiness (UX-06), sync failure escalation (UX-03), offline log save (UX-04), offline history (UX-07). All covered.
- NFRs: Touch targets (SC-02), contrast ratio (SC-05), reduced-motion (SC-03), system-adaptive theme (SC-04). All specified.

### Clarity Check
- All measurements are quantitative: px dimensions, ms timings, contrast ratios, hex values.
- No vague adjectives ("beautiful", "fast", "clean") without measurable criteria.

### Testability Check
- All AC verifiable via: unit test (greeting pure function, checkmark timing), visual/manual inspection (font sizes, colors on device), or computed property check (contrast ratio via tool).
- No "looks good" AC. All AC have binary pass/fail.

### Priority Validation
- Q1 (largest bottleneck): YES — the visual gap between functional and polished is the current blocker to confident beta sharing.
- Q2 (simpler alternatives): CSS custom properties chosen over Tailwind/CSS-in-JS (simpler, fewer dependencies, SC-08).
- Q3 (constraint prioritization): SC-06 (no E2E) appropriately constrains verification to unit + manual.
- Q4 (data-justified): YES — discovery answers directly map to design decisions (Q1→theme, Q2→accent, Q3→feedback, Q4→typography, Q5→Strong reference).

**Peer Review Status: APPROVED — no critical or high issues identified.**
