-- Seed: test user Marco at Pike Push-up in hspu track
-- Used by walking skeleton tests (WS-4, WS-5)
-- User: test-user-marco-ws | Track: hspu | Exercise: pike-push-up

INSERT INTO user_progression (user_id, track, current_exercise_id)
SELECT
  'test-user-marco-ws',
  'hspu',
  id
FROM exercises
WHERE slug = 'pike-push-up'
ON CONFLICT (user_id, track) DO UPDATE
  SET current_exercise_id = EXCLUDED.current_exercise_id,
      updated_at = now();
