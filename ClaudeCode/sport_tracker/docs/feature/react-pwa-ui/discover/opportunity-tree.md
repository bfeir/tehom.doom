# Opportunity Tree — react-pwa-ui Discovery

## Metadata

- Feature: react-pwa-ui
- Date: 2026-04-21
- Phase: 2 — Opportunity Mapping
- Scoring: Opportunity Algorithm — Score = Importance + Max(0, Importance - Satisfaction)
- Scale: Importance 1-10, Satisfaction 1-10, Max score 20

## Desired Outcome

**"Train without switching to another tool — log it, know what's next, and trust the timer."**

Derived from customer words: "I use pen and paper, a clock app, Reddit, the RR wiki, and a Google Sheet — all during one session."

---

## Opportunity Scoring

Scores are estimated from the single interview. Importance is inferred from behavioral signals (frequency, workarounds, emotional intensity). Satisfaction with current solution is inferred from the number and nature of workarounds.

| ID | Opportunity | Importance | Satisfaction (current) | Score | Priority |
|----|-------------|------------|----------------------|-------|----------|
| JS-01 | Readiness Decision: surface the progression rule at the right moment | 9 | 2 | 9 + (9-2) = 16 | HIGH |
| JS-03 | RR Knowledge Access: in-app exercise library + what-comes-next | 8 | 2 | 8 + (8-2) = 14 | HIGH |
| JS-06 | Rest Timer: replace the separate clock app | 8 | 3 | 8 + (8-3) = 13 | HIGH |
| JS-02 | Volume Tracking: replace pen-and-paper grid with automatic history | 7 | 5 | 7 + (7-5) = 9 | HIGH |
| JS-04 | Plateau Detection: surface the backend warning in the UI | 8 | 1 | 8 + (8-1) = 15 | HIGH |
| JS-05 | Logging Without Fragmentation: single app covers log + timer + readiness + history | 9 | 1 | 9 + (9-1) = 17 | HIGH |

All six opportunities score above the >8 threshold. This is consistent with a user who has significant unmet needs and has built elaborate workarounds.

---

## Opportunity Solution Tree

```
Desired Outcome: "Train without switching to another tool"
  |
  +-- JS-05: Logging Without Fragmentation (score: 17)
  |     +-- Single PWA session screen: log + timer + readiness card
  |     +-- Bottom navigation: log | history | progression chain
  |     +-- Offline-first sync: IndexedDB write queue
  |
  +-- JS-01: Readiness Decision (score: 16)
  |     +-- Readiness card: shows current volume vs. rep-range threshold
  |     +-- Proactive nudge: "You've hit 3x10 for 2 sessions — ready to progress?"
  |     +-- In-session progression gate surfaced before logging
  |
  +-- JS-04: Plateau Detection (score: 15)
  |     +-- PlateauDetector backend already built — UI surfaces the warning
  |     +-- Plateau badge on exercise card: "Stalled for N sessions"
  |     +-- Linked directly to progression chain view
  |
  +-- JS-03: RR Knowledge Access (score: 14)
  |     +-- In-app exercise library with progression chains pre-loaded
  |     +-- "What comes next" card on exercise detail
  |     +-- Eliminates Reddit + RR wiki + Google Sheet lookups
  |
  +-- JS-06: Rest Timer (score: 13)
  |     +-- 90-second preset timer, configurable
  |     +-- Triggered from session log screen after set is recorded
  |     +-- Visual countdown — glanceable between sets
  |
  +-- JS-02: Volume Tracking (score: 9)
        +-- Session history view: exercise x session grid (mirrors paper format)
        +-- Qualitative notes field per session
        +-- Auto-populated from logged sets — no re-entry needed
```

---

## Top 2-3 Opportunities for v1

Based on scores and the G2 gate (top opportunities >8), all six qualify. For v1 MVP scope, prioritize:

1. **JS-05 — Logging Without Fragmentation** (17): The meta-opportunity that makes all others cohesive. The single-app experience is the UVP.
2. **JS-01 — Readiness Decision** (16): Highest-value insight from the interview — missed windows are the user's clearest pain. Backend already supports this.
3. **JS-04 — Plateau Detection** (15): Backend is already built. UI surfacing is a low-effort, high-value addition.

**JS-06 (Rest Timer)** is included in v1 because it replaces a concrete, habitual, separate tool — the effort is low and the displacement value is immediate.

**JS-03 (RR Knowledge Access)** is included as an in-app library — a static dataset that eliminates three external lookups.

**JS-02 (Volume Tracking)** is the baseline; without it, none of the others work.

---

## Job Step Coverage

| Universal Job Map Step | Covered by | Opportunity |
|------------------------|------------|-------------|
| Define (what needs doing today) | Readiness card | JS-01, JS-04 |
| Locate (find next exercise) | In-app library | JS-03 |
| Prepare (ready to log) | Session log screen | JS-05 |
| Confirm (verify readiness to progress) | Rep-range threshold display | JS-01 |
| Execute (log the set) | Session log entry | JS-02, JS-05 |
| Monitor (rest between sets) | Rest timer | JS-06 |
| Modify (adjust if needed) | Notes field | JS-02 |
| Conclude (session complete) | History auto-saved | JS-02, JS-05 |

Coverage: 8/8 job steps = 100%

---

## G2 Gate Evaluation

| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| Opportunities identified | 5+ distinct | 6 | PASS |
| Top scores | >8 / max 20 | All 6 score 9-17 | PASS |
| Job step coverage | 80%+ | 100% (8/8) | PASS |
| Team alignment | Stakeholder confirmed | Solo developer — self-confirmed | CONDITIONAL PASS |

**Gate decision**: PROCEED to Phase 3 (Solution Testing).
