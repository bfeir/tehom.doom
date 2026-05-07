# manual-rest-timer — Evolution Archive

**Feature**: Manual rest timer with set counter in session screen
**Delivered**: 2026-05-06
**Steps**: 3 | **Tests added**: 8 new active tests | **Commits**: 3

## Changes

### 01-01: Remove auto-start timer from useSessionLogger
- Removed automatic `timerStore.start()` from `logSet` side-effect
- Timer is now user-controlled only (WD-03 behaviour reversed by product decision)

### 01-02: Make RestTimer always visible with idle state
- `RestTimer` no longer returns null when not running
- Idle state renders a "Start Rest" button that calls `start()` from `useRestTimer`
- Running state unchanged (countdown + Skip/+15s)
- Added `padding-bottom: 80px` to `.session` so sticky timer doesn't overlap close button

### 01-03: Add set counter and timer context label
- `RestTimer` accepts optional `setNumber?: number` prop
- Idle label: "Set N+1" (next set to do)
- Running label: "Rest after set N" (just-completed set)
- `SessionScreen` passes `setNumber={entryCount}` to `<RestTimer sticky />`

## Files Modified
- src/hooks/useSessionLogger.ts
- src/components/RestTimer.tsx
- src/components/SessionScreen.tsx
- src/styles/timer.css
- src/styles/session.css
- tests/unit/hooks/useSessionLogger.test.ts
- tests/unit/components/RestTimer.test.tsx
- tests/unit/components/SessionScreen.test.tsx
