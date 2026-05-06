# Upstream Changes — react-pwa-ui DESIGN

**Feature**: react-pwa-ui
**Produced by**: Morgan (nw-solution-architect), DESIGN wave
**Date**: 2026-04-21
**Purpose**: Document any changes the DESIGN wave requires in DISCUSS artifacts (AC updates,
story scope changes, clarifications). The acceptance-designer (DISTILL wave) must read this
before writing acceptance tests.

---

## Summary

Three DISCUSS artifacts require updates based on DESIGN wave decisions. All changes are additive
or clarifying — no story is removed or descoped.

---

## Change 1: UI-05 (Rest Timer) — OQ-01 Resolution Adds iOS Limitation Note

**Affected artifact**: `docs/feature/react-pwa-ui/discuss/user-stories.md`, UI-05 section.

**What changed**: OQ-01 is resolved. The DESIGN wave establishes that iOS Safari PWA timers
cannot run in the background — the `Date.now()` anchor corrects display on foreground return.

**Required AC addition** (for acceptance-designer):
Add to UI-05 Acceptance Criteria:

> - Timer remaining time is accurate on foreground return after app is backgrounded (uses wall-clock
>   elapsed, not accumulated tick count)
> - Completion ping fires on foreground return if rest period elapsed while app was backgrounded
> - Timer state persists across component remounts (stored in Zustand, not component state)

**Required note addition** (for acceptance-designer and crafter):
> iOS limitation (not a defect): The completion audio/vibration ping does not fire while the PWA
> is backgrounded on iOS. This is an OS-level constraint. The ping fires when the user returns
> the app to the foreground. Document in the DISTILL AC as a known platform limitation, not a
> testable failure case.

---

## Change 2: UI-08 (Offline Session Logging) — OQ-03 Resolution Adds iOS Install Instructions

**Affected artifact**: `docs/feature/react-pwa-ui/discuss/user-stories.md`, UI-08 section.

**What changed**: OQ-03 is resolved. iOS does not support `beforeinstallprompt`. The install
prompt is replaced with a manual banner component (`AddToHomeScreenBanner`).

**Required AC addition** (for acceptance-designer):
Add to UI-08 (or UI-08c in Slice 3) Acceptance Criteria:

> - On iOS Safari with PWA not yet installed (`!window.navigator.standalone`), a dismissable banner
>   displays with text: "Add to Home Screen: tap Share, then 'Add to Home Screen'"
> - Banner is shown at most once per dismissal (persisted in localStorage)
> - Banner does not appear on Chrome/Android (which supports `beforeinstallprompt`) or when the
>   PWA is already installed (`window.navigator.standalone === true`)

---

## Change 3: UI-03 (Log a Set) — Port Wiring Constraint

**Affected artifact**: `docs/feature/react-pwa-ui/discuss/user-stories.md`, UI-03 Technical Notes.

**What changed**: DESIGN wave establishes that the save path goes through `SessionPort.addEntry()`,
not a direct Supabase call. The offline path goes through the IndexedDB queue via `SessionRepository`
in offline mode. The AC must confirm the behavioral outcome, not the implementation path.

**Required AC clarification** (for acceptance-designer):
Ensure the existing AC "Set is persisted when saved" is expressed behaviorally:

> - After tapping Save (online): the set appears in the current session's entry list immediately
> - After tapping Save (online): the rest timer starts within 200ms of the save completing
> - After tapping Save (offline): a "Saved offline" indicator is visible within 200ms — no error
>   is shown, and the set appears in the current session's entry list
> - The readiness card is NOT triggered automatically on save (WD-02 constraint)

The 200ms targets are behavioral (user-observable) not implementation constraints.

---

## No Changes Required

The following DISCUSS artifacts are confirmed accurate and require no updates:

| Artifact | Status |
|----------|--------|
| user-stories.md — UI-01 (Auth) | Confirmed — Supabase Auth integration unchanged |
| user-stories.md — UI-02 (Session) | Confirmed — SessionPort.create() / close() unchanged |
| user-stories.md — UI-04 (Readiness Card) | Confirmed — on-demand call to ReadinessEngine.calculate() |
| user-stories.md — UI-06 (History) | Confirmed — table format via HistoryService.findHistory() |
| user-stories.md — UI-07 (Progression Chain) | Confirmed — ExerciseRepository.findProgressionChain() |
| story-map.md | Confirmed — slice boundaries and story mapping unchanged |
| outcome-kpis.md | Confirmed — KPI measurement plan unchanged |
| wave-decisions.md (DISCUSS) | Confirmed — WD-01 through WD-07 all respected in DESIGN |
