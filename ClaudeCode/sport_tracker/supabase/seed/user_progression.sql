-- Seed: test user Marco at Pike Push-up in push track
-- Used by walking skeleton tests (WS-4, WS-5)
-- User: test-user-marco-ws | Track: push | Exercise: pike-push-up-ppp

INSERT INTO user_progression (user_id, track, current_exercise_id)
VALUES (
  'test-user-marco-ws',
  'push',
  '8a7ffc4a-5499-4661-9985-d69e548210df'
)
ON CONFLICT (user_id, track) DO UPDATE
  SET current_exercise_id = EXCLUDED.current_exercise_id,
      updated_at = now();
