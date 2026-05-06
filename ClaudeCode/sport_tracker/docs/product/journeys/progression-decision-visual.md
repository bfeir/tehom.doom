# Journey: Progression Decision — Visual Map (Product SSOT)

**Product**: calisthenics-tracker-v1
**Source**: docs/feature/calisthenics-tracker-v1/discuss/journey-progression-decision-visual.md
**SSOT bootstrapped**: 2026-04-13

This is the product-level reference copy. For full step-by-step mockups and integration details, see the feature-level source.

---

## Journey Flow

```
TRIGGER: Finishes a push workout set — wonders "Was that enough to progress?"
    |
    v
[Step 1]        [Step 2]          [Step 3]           [Step 4]          [Step 5]
Log Session  →  View Readiness →  Read Rationale  →  Decision Made  →  Tree View
                Signal                                                   (optional)
    |               |                  |                  |                  |
Feels:          Feels:             Feels:             Feels:            Feels:
Neutral         Curious            Understanding      Confident         Oriented
```

## Emotional Arc

```
Uncertainty (start) → Neutral (logging) → Curiosity (signal) → Understanding (rationale) → Confidence (decision)
```

## Key Design Constraints

1. The NOT YET signal must feel informative, not punitive
2. Every signal must cite the specific RR criterion applied — no opaque outputs
3. Session logging must work offline (gym connectivity cannot be assumed)
4. First value delivery (readiness signal with partial progress) must appear on session 1

## Signal States

| State | Trigger | User Emotion |
|-------|---------|--------------|
| READY | All RR criteria met for N consecutive sessions | Excited → Advance CTA |
| NOT YET | Criteria partially met | Informed → "N more sessions" |
| REVIEW | Criteria met on reps but form quality inconsistent | Guided → "Consider form focus" |
