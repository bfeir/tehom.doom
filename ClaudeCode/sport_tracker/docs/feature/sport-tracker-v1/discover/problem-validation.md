# Problem Validation — Sport Tracker v1

**Phase:** 1 — Problem Validation
**Gate:** G1
**Date:** 2026-04-13
**Evidence standard:** Past behavior only (future intent inadmissible)

---

## Problem Statement (Customer Words)

Primary (from Signal A-03, A-04, B-01):
> "No single app does everything I need — so I end up with 4 apps, still missing things, and eventually I stop using all of them."

Secondary (from Signal A-05, C-02, C-03):
> "The app shows me numbers but doesn't tell me what to do. After a few weeks of seeing data I can't act on, I quit."

Tertiary (from Signal C-02, C-03):
> "When I miss a week there's no way back in. The app just shows me how far I've fallen behind. So I delete it."

---

## Evidence Summary

### Confirmed Problems (past behavior signals)

| # | Problem | Signal IDs | Frequency | Severity |
|---|---------|------------|-----------|----------|
| 1 | App fragmentation — users need 2-4 apps to cover one training cycle | A-03, A-04, B-01, B-02 | 67% of runners (RunRepeat 2023) | High |
| 2 | Data without insight — tracked numbers produce no actionable output | A-05, A-07, C-03 | 42% abandoned for this reason (Rock Health 2022) | High |
| 3 | No re-engagement path after lapse — shame spiral leads to deletion | C-02, C-03 | Day-30 retention 6.2% (Business of Apps 2024) | High |
| 4 | Metric overload causes users to disable the product | A-01, A-06 | Documented across Strava/running communities | Medium |
| 5 | Subscription paywalls fragment long-term data continuity | A-02, B-03 | Recurring in top-rated 1-star reviews across Strava, MFP | High |

### Not Confirmed as Primary Problems (insufficient signal)

| Problem | Signal | Assessment |
|---------|--------|------------|
| Sports fan score tracking | D-01, D-02 | Real pain, but lower severity and well-addressed by ESPN/Sleeper/Yahoo |
| Fantasy sports management | D-02 | Pain exists but distinct JTBD from athletic performance; deprioritize |
| Nutrition-exercise correlation | B-03 | Real unmet need but niche (serious athletes); Phase 2 will score |

---

## Job-to-Be-Done Map (Primary Segment)

**Segment:** Recreational-to-serious athletic performance tracker (runs, cycles, swims, lifts 3-6x/week; goal-oriented; uses wearables)

**Core JTBD:** "Help me improve my athletic performance over time without managing a stack of apps or interpreting raw data myself."

### Job Map

| Step | Current State | Pain | Outcome Desired |
|------|---------------|------|-----------------|
| Define | Decide what to track this training cycle | Medium — no single app handles multi-sport | Minimize time to define tracking scope across disciplines |
| Locate | Find my historical data across apps | High — data fragmented across 2-4 apps | Minimize time to access full training history from one place |
| Prepare | Set up a training plan aligned to my goal | High — plan lives in one app, tracking in another | Minimize configuration effort to align plan + tracking |
| Confirm | Check that today's workout matches my plan | Medium — requires switching apps | Minimize app-switching to confirm daily training intent |
| Execute | Complete the workout and auto-log data | Low — wearables handle capture well | Minimize manual logging steps after activity |
| Monitor | Understand if I'm on track toward my goal | Very High — data exists but insight doesn't | Minimize time to interpret whether training is working |
| Modify | Adjust plan after a missed week or injury | Very High — no recovery path, just shame | Minimize friction to re-engage after a lapse |
| Conclude | Review a completed training block | Medium — requires manual aggregation | Minimize effort to understand progress across a training block |

**Highest-pain steps: Monitor + Modify** (steps 6 and 7)

---

## Assumption Register — Phase 1

All assumptions scored using: Risk Score = (Impact x 3) + (Uncertainty x 2) + (Ease x 1)

| # | Assumption | Category | Impact (1-3) | Uncertainty (1-3) | Ease (1-3) | Risk Score | Priority |
|---|-----------|----------|-------------|-------------------|------------|------------|----------|
| A1 | Athletic performance tracking is the primary JTBD (not fan tracking) | Value | 3 | 1 | 1 | 12 | Test First |
| A2 | Users will pay for a unified tracking experience | Value | 3 | 2 | 2 | 17 | Test First |
| A3 | Re-engagement after lapse is a meaningful differentiator | Value | 3 | 2 | 1 | 14 | Test First |
| A4 | Actionable insight (not raw data) is the core value driver | Value | 3 | 1 | 1 | 12 | Test First |
| A5 | Data aggregation across apps (Garmin, Strava, Apple Health) is technically feasible | Feasibility | 2 | 2 | 2 | 15 | Test First |
| A6 | Users will trust a new app with 3+ years of athletic data | Value | 3 | 2 | 2 | 17 | Test First |
| A7 | Social features are necessary for retention | Value | 2 | 2 | 1 | 11 | Test Soon |
| A8 | Casual users (goal-less) are a viable segment | Value | 2 | 3 | 1 | 13 | Test First |
| A9 | Wearable integration (Garmin, Apple Watch, Whoop) is table stakes | Feasibility | 2 | 1 | 2 | 10 | Test Soon |
| A10 | Nutrition correlation is a must-have in v1 | Value | 2 | 2 | 1 | 11 | Test Soon |

**Highest risk assumptions to test next (>12):** A2, A3, A4, A6, A8, A5

---

## Competitive Landscape (Past-Behavior Evidence)

| App | What Users Do With It | Where Users Leave It | Evidence |
|-----|----------------------|---------------------|----------|
| Strava | Social sharing, segment racing, route logging | When paywall hits or social pressure harms training | A-01, A-02 |
| Garmin Connect | Device sync, detailed metrics | Interface friction; use RunGap + TP instead | A-04 |
| Apple Fitness+ | Guided workouts, health aggregation | When cross-platform sync needed | B-02 |
| TrainingPeaks | Structured plan management | Too complex for recreational users | B-01 |
| MyFitnessPal | Calorie/nutrition logging | After paywalls and feature cuts | B-03 |
| Nike Run Club | Beginner running plans | After leveling up (lacks advanced analytics) | Secondary |

**Key gap:** No app serves the goal-oriented recreational-to-serious athlete with (1) unified data, (2) actionable insight, and (3) friction-free re-engagement. Every existing solution optimizes for one of these, not all three.

---

## Directional Decision: Sport Tracker Focus

**Chosen direction:** Athletic performance tracker for goal-oriented recreational and serious athletes

**Rejected directions (with evidence):**
- Sports fan/score tracker: Lower pain severity; ESPN, Bleacher Report, team apps address this; no behavioral evidence of spending on alternatives
- Fantasy sports: Distinct JTBD; Sleeper, Yahoo, ESPN well-established; multi-platform management is the pain, not tracking per se
- General wellness: MyFitnessPal, Apple Health dominate; no differentiation opportunity visible in evidence

---

## G1 Gate Decision

| Criterion | Target | Result | Status |
|-----------|--------|--------|--------|
| 5+ signals with past behavior | 5 | 16 | PASS |
| >60% confirm core pain | 60% | 87.5% | PASS |
| Problem documented in customer words | Required | 3 distinct articulations | PASS |
| 3+ specific past examples | 3 | 16 | PASS |
| Skeptics and non-users included | Required | A-06, A-07, C-01 included | PASS |
| Clear directional choice | Required | Athletic performance | PASS |

**G1 VERDICT: PASS**
**Proceed to Phase 2: Opportunity Mapping**
