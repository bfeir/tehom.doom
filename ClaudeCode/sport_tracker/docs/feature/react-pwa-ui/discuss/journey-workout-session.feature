# Feature: Workout Session Journey
# Platform: PWA, mobile-first, offline-first
# Persona: Marco — intermediate RR practitioner, outdoor park training
# Jobs: JS-05 (logging), JS-06 (rest timer), JS-01 (readiness), JS-02 (history), JS-03 (progression)
# Source journey: docs/feature/react-pwa-ui/discuss/journey-workout-session.yaml
# Key heuristics: Visibility of system status, User control and freedom, Error prevention

Feature: Workout Session — complete logging journey

  Background:
    Given the RR exercise registry is loaded in the app
    And Marco has signed in with his Google account

  # ============================================================
  # Step 1: Auth Gate
  # ============================================================

  Scenario: First-time sign-in via Google OAuth
    Given Marco opens the app for the first time
    When he taps "Continue with Google" and completes OAuth
    Then he arrives at the home screen within 3 seconds
    And his email is shown as confirmation of successful sign-in

  Scenario: Returning user bypasses auth gate
    Given Marco has signed in previously and his JWT is still valid
    When he opens the app
    Then he arrives directly at the home screen with no auth prompt

  Scenario: Sign-in attempted offline
    Given Marco has no network connectivity
    When he opens the app for the first time
    Then he sees "Sign-in requires a connection" message
    And both sign-in options are visible but disabled

  # ============================================================
  # Step 2: Home / Session Dashboard
  # ============================================================

  Scenario: Home screen shows recent sessions
    Given Marco is signed in and has logged sessions previously
    When he opens the app
    Then he sees his 3 most recent sessions with exercise name, sets, reps, and days ago
    And a prominent "Start New Session" button is above the list

  Scenario: Home screen empty state on first use
    Given Marco has just registered and logged no sessions
    When he views the home screen
    Then he sees "No sessions yet. Tap + to log your first set."
    And the "Start New Session" button is clearly visible

  Scenario: Offline queue badge shown on home screen
    Given Marco logged 2 sessions offline at the park
    When he opens the app without connectivity
    Then the header shows "[2 queued]" indicating unsynced sessions
    And the badge disappears after reconnection and successful sync

  Scenario: Crashed session recovery on home screen
    Given Marco previously had an open session that was not closed
    When he opens the home screen
    Then he sees "Open session found. Continue or close it?"
    And he can choose to continue the session or discard it

  # ============================================================
  # Step 3: Log a Set
  # ============================================================

  Scenario: Marco logs a set online with exercise autocomplete
    Given Marco has started a new session and is online
    When he types "pike" in the exercise field and selects "Pike Push-ups (PPP)" from the autocomplete
    And he enters 3 sets and 8 reps
    And taps "Save Set + Start Timer"
    Then the set is saved to his session
    And the rest timer starts immediately at 1:30
    And the sets-logged counter shows "1 set logged"

  Scenario: Marco logs a set offline at the park
    Given Marco has no network connectivity
    When he enters exercise, sets, reps, and taps Save
    Then the set is saved to the offline queue silently (no error shown)
    And the rest timer starts immediately
    And the offline queue badge increments by 1

  Scenario: Free-text exercise not in the registry
    Given Marco wants to log "Ring Dips" which is not in the exercise registry
    When he types "Ring Dips" and finds no autocomplete match
    Then he can type the name freely and tap Save
    And the set is saved with the free-text name and no exercise_id

  Scenario: Validation prevents zero reps
    Given Marco is on the log screen
    When he enters 0 in the reps field and taps Save
    Then he sees "Enter at least 1 set and 1 rep" inline below the reps field
    And the form is not submitted

  Scenario: Exercise field pre-fills from previous set
    Given Marco just saved a set of Pike Push-ups
    When the rest timer ends and he returns to the log screen
    Then the exercise field is pre-filled with "Pike Push-ups (PPP)"
    And the sets and reps fields are empty for new input

  # ============================================================
  # Step 4: Rest Timer
  # ============================================================

  Scenario: Rest timer auto-starts after saving a set
    Given Marco has just saved a set of Pike Push-ups
    When the save completes
    Then the rest timer starts immediately and shows "1:30" countdown
    And the timer display is large and readable between sets

  Scenario: Marco extends the rest timer
    Given the rest timer is running
    When Marco taps "+ 15s"
    Then the timer adds 15 seconds to the remaining time

  Scenario: Marco skips the rest timer
    Given the rest timer is running at 0:45 remaining
    When Marco taps "Skip"
    Then the timer stops
    And the bottom navigation is accessible for logging the next set

  Scenario: Marco changes the default rest duration
    Given Marco is on the rest timer screen
    When he taps "Change default" and sets 2:00
    Then subsequent timers in this session default to 2:00
    And the change persists for future sessions

  Scenario: Rest timer completes in foreground
    Given Marco's rest timer is counting down
    When the countdown reaches zero
    Then the screen shows a visual cue (color change) and plays an audio ping
    And the log screen is accessible via the bottom navigation

  Scenario: Rest timer continues when app is backgrounded
    Given Marco minimises the app while the timer is running
    When the timer reaches zero
    Then Marco receives a notification "Rest over — log your next set" if notifications are permitted
    And the timer state is accurate when he returns to the app

  # ============================================================
  # Step 5: Readiness Card
  # ============================================================

  Scenario: Readiness card shows NOT YET with specific gap
    Given Marco has logged 2 consecutive sessions of Pike Push-ups at 3x8
    When he taps the Readiness button
    Then he sees "NOT YET" as the headline signal
    And the card shows "Consecutive sessions: 2 of 3 needed"
    And the card shows "1 more session at 3x8+ to advance"

  Scenario: Readiness card shows READY
    Given Marco has logged 3 consecutive sessions of Pike Push-ups at 3x8+
    When he taps the Readiness button
    Then he sees "READY" as the headline signal
    And the card shows "3 consecutive sessions at 3x5-8 — criteria met"
    And a "View Progression Chain" button is visible

  Scenario: Readiness card shows REVIEW for form quality concern
    Given Marco has logged 3 sessions meeting rep criteria but with form_quality below 3
    When he taps the Readiness button
    Then he sees "REVIEW" as the headline signal
    And the card shows "Rep range met — form quality inconsistent. Consider a form focus session."

  Scenario: Readiness check attempted offline
    Given Marco has no network connectivity
    When he taps the Readiness button
    Then he sees "Readiness check needs a connection. Your session is saved."
    And the rest of the session UI is unaffected

  Scenario: First readiness check with no prior sessions
    Given Marco has just logged his very first set of an exercise
    When he taps the Readiness button
    Then he sees "Log at least 1 session to see your readiness — check back after your next session"

  # ============================================================
  # Step 7: Close Session
  # ============================================================

  Scenario: Marco closes a session after logging sets
    Given Marco has logged 3 sets of Pike Push-ups and 3 sets of Pull-up Negatives in a session
    When he taps "Done - Close Session"
    Then he sees a summary table: exercise name, total sets, reps per set
    And the session is marked closed in the app
    And the home screen shows this session in the recent list

  Scenario: Session close with offline queue
    Given Marco trained offline and has entries in the offline queue
    When he taps "Done - Close Session"
    Then the summary is shown
    And he sees "Saved offline - will sync on reconnect" with a queue indicator

  Scenario: Empty session close attempt
    Given Marco started a session but logged no sets
    When he taps "Done - Close Session"
    Then he sees "No sets logged. Close session without saving?"
    And he can confirm discard or return to log

  # ============================================================
  # Step 8: Exercise History View (optional)
  # ============================================================

  Scenario: Marco views session history for Pike Push-ups
    Given Marco has logged 5 sessions of Pike Push-ups
    When he navigates to History and selects Pike Push-ups
    Then he sees the last 5 sessions with date, sets, reps, form quality, and note
    And the readiness status is shown below the table

  Scenario: History view while offline
    Given Marco has no connectivity but the app has cached history
    When he navigates to History
    Then he sees cached session data with an offline indicator in the header

  Scenario: Empty history for an exercise
    Given Marco selects an exercise with no logged sessions
    When the history screen loads
    Then he sees "No sessions logged yet for this exercise."

  # ============================================================
  # Step 9: Progression Chain View (optional)
  # ============================================================

  Scenario: Marco views his position in the push progression chain
    Given Marco's current push exercise is Pike Push-ups (PPP)
    When he navigates to the Progression tab
    Then he sees the full push chain ordered from Wall Push-up to advanced skills
    And Pike Push-ups is marked as his current exercise
    And Pseudo Planche Push-up is marked as next with RR criteria visible

  Scenario: Marco views next exercise RR criteria
    Given Marco is viewing the Progression tab
    When he taps "View full criteria" for Pseudo Planche Push-up
    Then he sees the rep range, consecutive sessions required, and form standard
    And the RR wiki URL is shown as the source citation

  Scenario: Progression view for free-text exercise
    Given Marco logged "Ring Dips" as a free-text exercise
    When he views the Progression tab
    Then he sees "Ring Dips is not in the RR progression registry"
    And the standard push chain is shown so he can orient himself manually

  # ============================================================
  # Cross-cutting: Offline and Sync
  # ============================================================

  @property
  Scenario: Offline sessions sync correctly on reconnect
    Given Marco has logged 3 sessions offline
    When network connectivity is restored
    Then all 3 sessions are synced to Supabase in chronological order
    And the offline queue badge clears to 0
    And no duplicate entries appear in the sessions table

  @property
  Scenario: All user data is isolated by user_id
    Given two users (Marco and his friend Luis) have both logged sessions
    When Marco opens his History view
    Then he sees only his own sessions
    And Luis's sessions are never shown to Marco regardless of exercise or date

  @property
  Scenario: Session logging response time is acceptable mid-workout
    Given Marco is at the park with normal connectivity
    When he taps "Save Set + Start Timer"
    Then the rest timer starts within 500 milliseconds of the tap
    And no loading screen or spinner blocks Marco between set save and timer start
