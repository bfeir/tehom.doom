# Problem Validation — react-pwa-ui Discovery

## Metadata

- Feature: react-pwa-ui
- Date: 2026-04-21
- Phase: 1 — Problem Validation
- Interviews completed: 1 (primary user, self-reported)
- Gate G1 target: 5+ interviews, >60% confirmation

## Sample Size Acknowledgment

This discovery is based on a single interview with the primary user (who is also the product owner and developer). This is an acknowledged limitation. The sample does not meet the G1 threshold of 5+ independent interviews.

**Rationale for proceeding**: The product is being built as a personal tool first, with 1-3 beta testers. The user IS the customer. The interview produced rich, past-behavior-grounded evidence. Beta testers will serve as the next validation cohort. Additional interviews should be conducted as beta access expands.

**Risk**: Solutions may be over-fit to one user's workflow. Mitigation: keep the scope narrow (v1 = personal tool), prioritize the beta feedback loop explicitly in lean-canvas.md.

---

## Problem 1: Tool Fragmentation During Workouts

**Statement (in customer words)**: "I use pen and paper, a clock app for rest, Reddit, the RR wiki, and a Google Sheet — all during one session."

**Evidence**:
- Pen and paper: confirmed current tool (Excel abandoned for being too heavy)
- Separate timer app: used every session, 90-second rest between supersets
- Reddit + RR wiki + Google Sheet: all three used to answer "what do I do next?" when progressing

**Confirmation**: HIGH — 4 distinct tools confirmed through past-behavior questions, not hypothetical

**Frequency**: Every training session

**Emotional signal**: Implicit frustration in describing context switches mid-workout; Excel was abandoned because the switching cost was too high

**Current spending**: Time and attention (no monetary spend, but behavioral cost is real)

**Validated**: YES — meets qualitative threshold despite n=1

---

## Problem 2: Missed Progression Windows

**Statement (in customer words)**: "I was already past the [3x10] threshold and I didn't know. I only noticed because I felt bored and stagnant."

**Evidence**:
- Was performing 3x10 pike push-ups before realizing he should have progressed
- Progression rule (3x5-8 rep range) was known in principle but not surfaced at the right moment
- Discovery was retroactive — multiple sessions passed without the trigger firing

**Confirmation**: HIGH — specific past incident described with exercise, rep counts, and subjective signal (boredom)

**Frequency**: Occurred at least once; likely recurs at each progression step without a rule-surfacing mechanism

**Emotional signal**: Frustration at missing the window; recognized the gap between knowing the rule and applying it

**Validated**: YES

---

## Problem 3: In-Workout Context Switching to Look Up Next Exercise

**Statement (in customer words)**: "I had to search — Reddit, the RR wiki, and a separate Google Sheets reference."

**Evidence**:
- Three external sources consulted mid-workout
- Each lookup requires leaving the training context entirely
- No single source was sufficient; he used all three

**Confirmation**: HIGH — specific tools named, behavior described in past tense

**Frequency**: Every time a progression decision is made

**Emotional signal**: The act of describing three separate sources signals friction; pen-and-paper was chosen specifically to avoid this kind of overhead elsewhere

**Validated**: YES

---

## Problem 4: No Rest Timer in Training Context

**Statement (in customer words)**: "I use a separate clock app for 90 seconds of rest between supersets."

**Evidence**:
- Habitual behavior: timer app opened every session between sets
- Rest duration is specific (90 seconds) — this is a real workflow, not a vague preference
- Friend at the park also "forgot rest times" — independent corroboration of the problem

**Confirmation**: HIGH — habitual, specific, past behavior confirmed

**Frequency**: Every session, multiple times per session (between each superset pair)

**Emotional signal**: Described matter-of-factly as part of the routine; the switching cost is normalized but eliminable

**Validated**: YES

---

## G1 Gate Evaluation

| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| Interviews completed | 5+ | 1 | BELOW TARGET |
| Problem confirmation rate | >60% | 4/4 problems confirmed | PASS (within sample) |
| Customer words documented | Yes | Yes (quotes captured) | PASS |
| Past-behavior evidence | 3+ examples | 8 distinct behavioral examples | PASS |
| Emotional intensity | Frustration evident | Yes — on context switching and missed progression | PASS |
| Workarounds confirmed | $0+ spend | 4 tools in active use | PASS |

**Gate decision**: CONDITIONAL PROCEED — qualitative evidence is strong; sample size risk is acknowledged and mitigated by the personal-tool framing of v1. Beta cohort (1-3 users) is the next validation stage.

**Remediation required before full G1 pass**: Conduct 4+ additional interviews with beta testers after app delivery. Document in a follow-up interview-log.md.

**Hard gate for v2 scope expansion**: G1 is not fully passed until at least 4 additional beta user interviews are completed and documented. No v2 features may be scoped until this gate passes. This is not optional — it is a prerequisite. If beta interviews surface problems inconsistent with the current problem statements, those statements must be revised before v2 work begins.
