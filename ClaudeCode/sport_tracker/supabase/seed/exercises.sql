-- Seed data: RR Push Chain
-- Source: r/bodyweightfitness Recommended Routine (CC BY-NC-SA)
-- Reference: https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'wall-push-up',
    'Wall Push-up',
    'push',
    1,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine',
    'rr-2024'
  ),
  (
    'incline-push-up',
    'Incline Push-up',
    'push',
    2,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine',
    'rr-2024'
  ),
  (
    'knee-push-up',
    'Knee Push-up',
    'push',
    3,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine',
    'rr-2024'
  ),
  (
    'regular-push-up',
    'Regular Push-up',
    'push',
    4,
    '{"targetReps": 20, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine',
    'rr-2024'
  ),
  (
    'diamond-push-up',
    'Diamond Push-up',
    'push',
    5,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine',
    'rr-2024'
  ),
  (
    'pike-push-up-ppp',
    'Pike Push-up (PPP progression)',
    'push',
    6,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine',
    'rr-2024'
  ),
  (
    'pike-push-up-advanced',
    'Pike Push-up (Advanced)',
    'push',
    7,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine',
    'rr-2024'
  ),
  (
    'hspu-progression',
    'HSPU Progression',
    'push',
    8,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine',
    'rr-2024'
  )
ON CONFLICT (slug) DO NOTHING;
