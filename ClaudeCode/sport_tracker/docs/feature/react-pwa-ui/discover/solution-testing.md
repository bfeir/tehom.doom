# Solution Testing — react-pwa-ui Discovery

## Metadata

- Feature: react-pwa-ui
- Date: 2026-04-21
- Phase: 3 — Solution Testing
- Method: Assumption validation against interview evidence (pre-prototype; beta testing is the next iteration)

## Assumption Register

Each assumption is scored using the risk framework:
- Impact if wrong: 1 (minor) | 2 (significant rework) | 3 (solution fails)
- Uncertainty: 1 (have data) | 2 (mixed signals) | 3 (speculation)
- Ease of testing: 1 (days, low cost) | 2 (weeks, moderate) | 3 (months, high cost)
- Risk Score = (Impact x 3) + (Uncertainty x 2) + (Ease x 1)

---

## Assumption A: User will log via phone mid-workout

**Category**: Value + Usability

**Hypothesis**: We believe providing a phone-based logging interface for RR practitioners will achieve session logging without interrupting workout flow. We will know this is TRUE when users log sets within 30 seconds between sets. We will know this is FALSE when users revert to paper or skip logging mid-session.

**Evidence from interview**:
- Phone is already out between sets (past behavior, confirmed)
- Separate timer app is opened every session — phone handling is habitual
- Paper was chosen over Excel because it is faster, not because phone use is avoided

**Validation status**: VALIDATED (HIGH confidence)

**Risk scoring**:
- Impact if wrong: 3 (solution fails — no phone logging = no app)
- Uncertainty: 1 (have direct behavioral evidence)
- Ease of testing: 1 (observable in first beta session)
- Risk Score: (3x3) + (1x2) + (1x1) = 12

**Action**: Test first in beta — observe whether users log on phone or revert to paper.

---

## Assumption B: User needs offline support

**Category**: Feasibility + Value

**Hypothesis**: We believe building offline-first (IndexedDB write queue + Supabase sync) for RR practitioners who train outdoors will achieve uninterrupted session logging regardless of connectivity. We will know this is TRUE when sessions are logged successfully without wifi. We will know this is FALSE when sync errors or blank states appear during outdoor training.

**Evidence from interview**:
- Trains at an outdoor calisthenics park (past behavior, confirmed)
- No mention of wifi at the park
- Offline-first is already an architectural constraint (CLAUDE.md: "offline-first is non-negotiable")

**Validation status**: VALIDATED (HIGH confidence)

**Risk scoring**:
- Impact if wrong: 3 (sessions lost in the park = trust destroyed)
- Uncertainty: 1 (outdoor training confirmed)
- Ease of testing: 1 (simulate offline in first beta session)
- Risk Score: (3x3) + (1x2) + (1x1) = 12

**Action**: Verify IndexedDB write queue works before first outdoor beta session.

---

## Assumption C: User needs rest timer

**Category**: Value

**Hypothesis**: We believe providing a configurable rest timer within the session logging screen for RR practitioners will achieve elimination of the separate clock app. We will know this is TRUE when users stop opening an external timer app during training. We will know this is FALSE when users continue using a separate timer despite the in-app option being available.

**Evidence from interview**:
- Uses a separate clock/timer app every session for 90-second rest between supersets (past behavior, confirmed)
- Friend at the park also "forgot rest times" — independent signal from a second user
- Specific rest duration (90 seconds) is known — a preset suffices

**Validation status**: VALIDATED (HIGH confidence)

**Risk scoring**:
- Impact if wrong: 2 (tool fragmentation persists — significant but not fatal)
- Uncertainty: 1 (habitual behavior confirmed with specific duration)
- Ease of testing: 1 (observable in first beta session)
- Risk Score: (2x3) + (1x2) + (1x1) = 9

**Action**: Build 90-second preset as default; make it configurable. Test displacement in beta.

---

## Assumption D: In-app progression chain eliminates lookup friction

**Category**: Value

**Hypothesis**: We believe providing an in-app RR exercise library with "what comes next" for each exercise will achieve elimination of mid-workout lookups to Reddit, RR wiki, and Google Sheets. We will know this is TRUE when users navigate to the next exercise via the app without opening external sources. We will know this is FALSE when users still open external references mid-session.

**Evidence from interview**:
- Three external tools currently used to answer "what's next?" (past behavior, confirmed)
- The problem is clear and concrete; the solution is not yet tested

**Validation status**: PARTIALLY VALIDATED

- Problem side: HIGH confidence (3 specific tools named, behavior described)
- Solution side: NOT YET TESTED — user has not seen an in-app library

**Risk scoring**:
- Impact if wrong: 2 (fragmentation persists for lookups; not fatal to core logging)
- Uncertainty: 2 (problem confirmed; solution completeness unknown — is the in-app library trusted?)
- Ease of testing: 1 (prototype or static list, show in first beta session)
- Risk Score: (2x3) + (2x2) + (1x1) = 11

**Action**: Ship an exercise library covering at minimum the top 10 RR exercises (push: wall push-up → incline → standard → diamond → pike → pseudo planche; pull: dead hang → scapular pull → negative → Australian; core: hollow body, L-sit progression) with full "what comes next" chains per exercise. Measure external lookup rate in beta sessions — if users still open Reddit/wiki/spreadsheet for any in-scope exercise, that exercise's entry is incomplete. A partial library that misses exercises will not displace the spreadsheet.

---

## Assumption E: Friends need social features

**Category**: Value

**Hypothesis (invalidated)**: We believed sharing training data between friends required social features (sharing, leaderboards, friend connections).

**Evidence from interview**:
- "I would love to send them the app and interview them afterward" — future intent, not current behavior
- No current sharing of training data
- Friend = beta tester with a separate account, not a training partner who shares logs
- User explicitly said they "didn't really share training" — the friend is more advanced and they "wanted to work together," not sync data

**Validation status**: INVALIDATED (HIGH confidence)

**Decision**: Social features are OUT OF SCOPE for v1. Each user has isolated data. Standard Supabase RLS enforces this. No friend-linking, no leaderboards, no shared plans.

---

## Assumption F: Auth must support friend onboarding

**Category**: Usability + Feasibility

**Hypothesis**: We believe standard Supabase Auth (Google OAuth + email/password) with a direct PWA install link will achieve friend onboarding without requiring an app store or custom invite system. We will know this is TRUE when a friend creates an account and logs a session from a shared link within 5 minutes. We will know this is FALSE when the onboarding flow creates confusion or abandonment.

**Evidence from interview**:
- "I would love to send them the app" — PWA install via link is the intended channel
- No app store needed (PWA)
- Each friend needs their own account (separate data)
- Friends are technically capable (RR practitioners, likely have smartphones)

**Validation status**: VALIDATED (HIGH confidence)

**Risk scoring**:
- Impact if wrong: 2 (beta testing delayed if onboarding is broken)
- Uncertainty: 1 (standard pattern; friends are self-selected capable users)
- Ease of testing: 1 (test with first beta link share)
- Risk Score: (2x3) + (1x2) + (1x1) = 9

**Action**: Standard Supabase Auth, no custom invite flow. Share install link. Test onboarding in first beta round.

---

## G3 Gate Evaluation

Note: G3 requires 5+ users tested with >80% task completion. This has not yet been achieved — beta testing has not started. This document captures assumption validation from interview evidence as a pre-beta checkpoint.

| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| Users tested | 5+ | 1 (interview only) | BELOW TARGET |
| Task completion | >80% | Not yet measured | PENDING |
| Value perception | >70% | Implied by workaround evidence | CONDITIONAL |
| Key assumptions validated | >80% | 5/6 validated or invalidated, 1 partial | CONDITIONAL |

**Gate decision**: PROCEED to build beta prototype. G3 full pass requires beta testing with 1-3 users. Document results in solution-testing-beta-round-1.md after beta launch.
