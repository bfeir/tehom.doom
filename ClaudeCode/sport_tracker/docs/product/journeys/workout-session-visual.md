# Journey: Workout Session — Visual Map (Product SSOT)

**Product**: calisthenics-tracker-v1
**Source**: docs/feature/react-pwa-ui/discuss/journey-workout-session-visual.md
**SSOT bootstrapped**: 2026-04-21

This is the product-level reference copy. For full step-by-step mockups and integration details, see the feature-level source.

---

## Journey Flow

```
TRIGGER: Marco opens the app at the park before his push workout
    |
    v
[Step 1]    [Step 2]      [Step 3]    [Step 4]    [Step 5]
Auth Gate → Home Screen → Log a Set → Rest Timer → Readiness Card
                              |            |             |
                              +------- repeating loop ---+
                                           |
                                           v
                          [Step 7]      [Step 8]      [Step 9]
                       Close Session → History View → Progression Chain
                                       (optional)     (optional)
```

## Emotional Arc

```
Uncertain (first use) → Ready (home) → Efficient (logging) → Calm (rest) →
  Informed (readiness card) → In flow (next set) → Satisfied (close) →
    [Optional: Oriented (history) → Equipped (progression chain)]
```

**Arc pattern**: Confidence Building — each logged set is a small win that builds toward session satisfaction.

## Key Design Constraints

1. Log entry completable in under 60 seconds per set — pen+paper was chosen for speed; app must be faster
2. Offline-first — all session writes go to IndexedDB first; no error shown on offline save
3. Rest timer is in-app — displaces a separate habitual clock app; 90s default
4. No social features — all data isolated per user via RLS

## Signal States (Readiness Card)

| State | Trigger | User Emotion |
|-------|---------|--------------|
| READY | All RR criteria met for N consecutive sessions | Excited — advance CTA shown |
| NOT YET | Criteria partially met | Informed — "N more sessions needed" |
| REVIEW | Rep range met but form quality inconsistent | Guided — "Consider a form focus session" |
