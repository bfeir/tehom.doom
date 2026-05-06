# Interview Log — react-pwa-ui Discovery

## Metadata

- Feature: react-pwa-ui
- Interview date: 2026-04-21
- Interviewer: Scout (Product Discovery Facilitator)
- Participant: Primary user (solo RR practitioner)
- Method: Mom Test (past-behavior focused, commitment-seeking)
- Total questions: 8

---

## Q&A Log

### Q1: Current tracking tool

**Question**: What tool do you currently use to track your calisthenics training?

**Answer**: Pen and paper. Excel felt too heavy — too much setup, too slow to reach mid-workout.

**Key observations**:
- Past behavior confirmed: paper is the current tool, not digital
- Excel was tried and abandoned — complexity was the reason
- Simplicity and speed are the two implicit requirements a new tool must meet
- This is evidence against feature-heavy UX; less is more

---

### Q2: What he records

**Question**: What exactly do you write down when you train?

**Answer**: Exercise name and "3 sets x 3" (sets x reps). Checks it before the next session of the same exercise.

**Key observations**:
- Minimum viable data: name, sets, reps
- The check-before-next-session pattern = readiness signal already embedded in his workflow
- He is the user of his own log — no audience, no sharing
- Data model is simple: exercise + volume per session

---

### Q3: Format

**Question**: How is the paper organized?

**Answer**: Self-invented grid — exercises as columns, sessions as rows. Qualitative notes per session (e.g., "a bit ill", "easy to do").

**Key observations**:
- User designed his own information architecture without any prompting
- The grid = session history view; exercises across top, sessions down = matrix of volume
- Qualitative notes are first-class data, not decoration — they explain anomalies
- The app must replicate this mental model, not impose a new one

---

### Q4: Progression decision

**Question**: How do you decide when to move to the next exercise in the progression chain?

**Answer**: Intuitive — he felt stagnated and bored after 3x10 pike push-ups. Did not know he was past the 3x5-8 rep-range threshold when he crossed it. Discovered this retroactively.

**Key observations**:
- Past behavior: progression was triggered by boredom + intuition, not rule
- He was beyond the threshold without knowing = missed multiple progression windows
- The app does not need to replace intuition — it needs to surface the rule at the right moment
- This is the highest-value problem: proactive readiness signal

---

### Q5: Next exercise lookup

**Question**: Once you decided to progress, how did you find out what the next exercise was?

**Answer**: Searched externally — Reddit, RR wiki, and a separate Google Sheets reference spreadsheet mid-workout.

**Key observations**:
- Three separate tools used to answer one question: "what do I do next?"
- Context switching mid-workout = friction peak
- None of these tools are integrated with his training log
- In-app progression chain with "what comes next" eliminates this entirely

---

### Q6: Training with friend

**Question**: Tell me about training with your friend at the park.

**Answer**: Trains outdoors at a calisthenics park. Friend's observed pain points: "forgot rest times" and "don't remember what to train."

**Key observations**:
- Outdoor setting confirmed — wifi not guaranteed
- Friend's problems are separate data points: rest timer and workout recall
- These are not the user's own stated problems — they are observed pain in another user
- Rest timer emerges as a real need from another practitioner, not just the interviewee

---

### Q7: Phone usage mid-workout

**Question**: Do you use your phone during training? When and for what?

**Answer**: Yes, phone comes out between sets. Uses a separate clock/timer app for 90-second rest between supersets every session.

**Key observations**:
- Past behavior confirmed: phone is already in hand mid-workout
- Separate timer app is habitual — used every session, 90s rest
- This is a real tool the app can replace, not a hypothetical desire
- Mid-workout interaction is realistic — phone UX must work between sets (large targets, fast input)

---

### Q8: Friend sharing and social features

**Question**: Do you share your training data with your friend or train together on the same plan?

**Answer**: "I would love to send them the app and interview them after how they used it." Did not share training data. The friend is more advanced — they wanted to work together, not share logs. Friends = beta testers, not social training partners.

**Key observations**:
- No current sharing behavior — this was future intent, not past behavior
- Social features are not needed: friends = separate accounts, separate data
- Beta testing channel confirmed: direct link share (PWA install, no app store needed)
- The more-advanced friend will stress-test progression chain and exercise library
- Standard auth is sufficient; no friend-linking, no leaderboards, no social graph

---

## Interview Quality Assessment

| Criterion | Result |
|-----------|--------|
| Past behavior questions | All 8 questions focused on past specifics |
| Future intent accepted as evidence | None — Q8 was probed and invalidated social features |
| Commitment signals | Beta testing commitment confirmed (will share app, will interview afterward) |
| Sample size | 1 interview (acknowledged limitation — see problem-validation.md) |
| Emotional intensity | Frustration evident on progression lookup and tool fragmentation |
| Workarounds confirmed | 4 tools: paper + timer + Reddit/wiki + Google Sheet |
