# Outcome KPIs — ux-polish

**Feature**: ux-polish
**Produced by**: Luna (nw-product-owner), DISCUSS wave
**Date**: 2026-05-04
**Source**: Gothelf/Seiden "Who Does What By How Much" + Maurya Running Lean (OMTM)

---

## Feature: ux-polish (Visual Design System for Calisthenics Tracker PWA)

### Objective

Transform the functionally complete but visually raw app into a precision instrument that Marco
trusts immediately on first look — so that the design never becomes a reason to switch back to
pen and paper — by the end of the first beta outdoor session.

---

### Outcome KPIs

| # | Who | Does What | By How Much | Baseline | Measured By | Type |
|---|-----|-----------|-------------|----------|-------------|------|
| KPI-UX-01 | Marco (or Luis) opening the app for the first time after polish | Rates the app "looks serious / trustworthy" without prompting | ≥ 4 out of 5 on first-impression rating | Baseline: current unstyled app — expected rating ≤ 2/5 based on raw HTML output | Qualitative rating question asked immediately after first open, before any logging | Leading (Activation) |
| KPI-UX-02 | Marco mid-workout between sets | Completes log set entry without double-tapping the CTA or expressing uncertainty ("did that save?") | 0 double-taps and 0 verbal "did that work?" in a full beta session | Baseline: double-tap occurs occasionally with current unstyled form (no feedback confirmation) | Direct observation during beta session | Leading (Outcome) |
| KPI-UX-03 | Marco at the park reading the rest timer | Reads remaining time correctly on first glance (no re-read) | 100% of timer glances require only 1 look (5+ observations per session) | Baseline: current 48px timer — readable but not dominant; estimated 30% re-read rate informally | Observation during beta session: does Marco look at the timer more than once per glance? | Leading (Outcome) |
| KPI-UX-04 | Marco reviewing readiness signal | Understands readiness state (READY / NOT YET / REVIEW) within 3 seconds | 100% of readiness-card views resolved in ≤ 3 seconds of reading | Baseline: current plain-h2 card — no visual hierarchy; estimated 5-8 seconds of processing | Time-to-comprehension observation (stopwatch from card render to Marco's next action) | Leading (Outcome) |
| KPI-UX-05 | Marco or Luis on any screen after polish | Sees consistent visual identity (no screen that looks un-styled or inconsistent) | 0 screens with browser-default styling visible after Slice 1 ships | Baseline: all screens currently browser-default | Visual inspection across all 5 screens in both dark and light mode | Leading (Reliability) |

---

### Metric Hierarchy

- **North Star**: App trust score — "This looks like a serious training tool" (qualitative, per KPI-UX-01)
  - This is the OMTM for the ux-polish feature: does the visual design build trust, not erode it?
  - Target: Marco and at least 1 other beta user rate ≥ 4/5 after first polished session

- **Leading Indicators** (behaviour changes predicting the north star):
  - KPI-UX-02: Zero double-taps (feedback confirmation works → trust in save action)
  - KPI-UX-03: Single-glance timer read (56px timer eliminates cognitive load → trust in data)
  - KPI-UX-04: ≤ 3 second readiness comprehension (visual hierarchy works → trust in signal)
  - KPI-UX-05: Zero unstyled screens (design system coherence → consistent trust)

- **Guardrail Metrics** (must NOT degrade from react-pwa-ui baseline):
  - Zero lost sessions: offline save still works after visual refactor (no hooks/stores touched)
  - Log speed: set entry still completable in ≤ 30 seconds (larger touch targets should help, not hurt)
  - Readiness accuracy: `ReadinessCard` state rendering must match `signal.state` exactly (visual polish must not break the conditional rendering logic)
  - Test coverage: all 62 existing tests must still pass after CSS changes (no TypeScript regressions)

---

### Measurement Plan

| KPI | Data Source | Collection Method | Frequency | Owner |
|-----|------------|-------------------|-----------|-------|
| KPI-UX-01 (first impression) | Marco's verbal rating + Luis/Maria verbal rating | Ask immediately after first open of polished app: "Rate 1-5: does this look like a serious training app?" | Once per new beta user | Marco |
| KPI-UX-02 (no double-tap) | Direct observation | Watch Marco's thumb during save interactions in beta session | Per set logged in beta session | Marco (self-observer or co-present friend) |
| KPI-UX-03 (single glance timer) | Direct observation | Count how many times Marco looks at the timer display per rest period | Per rest period in beta session | Marco (self-observer) |
| KPI-UX-04 (readiness comprehension) | Stopwatch | Time from readiness card render to Marco tapping away or acting | Per readiness check in beta session | Marco |
| KPI-UX-05 (no unstyled screens) | Visual inspection | Open app in dark + light mode on iOS Safari and Chrome Android, review all 5 screens | Once after Slice 1 ships | Marco (developer) |
| Guardrail: log speed | Stopwatch | Same as react-pwa-ui KPI-01 protocol | First polished beta session | Marco |
| Guardrail: 62 tests pass | Vitest output | `vitest run` after each story | After each UX story merge | CI / Marco |

---

### Hypothesis

We believe that applying a system-adaptive teal/blue precision-instrument design system (inspired
by the Strong app aesthetic) to the existing functional calisthenics tracker PWA will make Marco
trust the app as a serious training tool on first look.

We will know this is true when Marco and at least one beta user rate the app ≥ 4/5 on
first-impression trust, and when Marco completes a full outdoor session without double-tapping the
save button or expressing uncertainty about whether his data was captured.

---

### KPI-to-Story Traceability

| KPI | Primary Story | Supporting Stories |
|-----|---------------|-------------------|
| KPI-UX-01 (first impression / trust) | UX-01 (token system) | UX-02, UX-03, UX-04, UX-05, UX-06 |
| KPI-UX-02 (no double-tap) | UX-04b (150ms checkmark) | UX-04 (button size / touch targets) |
| KPI-UX-03 (single-glance timer) | UX-05 (56px timer) | UX-05b (slide-in animation) |
| KPI-UX-04 (readiness comprehension) | UX-06 (readiness card) | UX-06b (progress bar + state color) |
| KPI-UX-05 (no unstyled screens) | UX-01 (token system) | UX-02 through UX-07 |

---

### Smell Test Results

| Check | KPI-UX-01 | KPI-UX-02 | KPI-UX-03 | KPI-UX-04 | KPI-UX-05 |
|-------|-----------|-----------|-----------|-----------|-----------|
| Measurable today? | Yes (qualitative rating) | Yes (direct observation) | Yes (count glances) | Yes (stopwatch) | Yes (visual inspection) |
| Rate not total? | Yes (1-5 rating scale) | Yes (rate = 0 double-taps) | Yes (rate = 1 glance per read) | Yes (seconds to comprehend) | Yes (count = 0 unstyled) |
| Outcome not output? | Yes (user trust, not "CSS shipped") | Yes (user behaviour) | Yes (user behaviour) | Yes (user behaviour) | Yes (user experience) |
| Has baseline? | Partial (expected ≤ 2/5; no formal measurement yet) | Partial (double-tap observed informally) | Partial (estimated 30% re-read rate) | No (new metric) | Yes (100% unstyled currently) |
| Team can influence? | Yes (design system) | Yes (feedback timing + touch targets) | Yes (font size) | Yes (visual hierarchy) | Yes (CSS coverage) |
| Has guardrails? | Yes (62 tests must pass) | Yes (no duplicate entries) | Yes (timer accuracy unchanged) | Yes (signal.state rendering correct) | Yes (no broken layouts) |

KPI-UX-04 baseline is "No" — this is expected for a first-time metric on a new screen design.
Baseline will be established at first polished beta session.
