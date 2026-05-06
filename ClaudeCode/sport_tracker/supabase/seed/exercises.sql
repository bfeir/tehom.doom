-- Seed data: RR Progression Chains (all 4 tracks)
-- Source: r/bodyweightfitness Recommended Routine (CC BY-NC-SA)
-- Reference: https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine
-- Last updated: 2026-05-06

-- ============================================================
-- PUSH chain
-- Push-up → Dip / Pike Push-up → HSPU path
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'wall-push-up',
    'Wall Push-up',
    'push', 1,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'incline-push-up',
    'Incline Push-up',
    'push', 2,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'knee-push-up',
    'Knee Push-up',
    'push', 3,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'regular-push-up',
    'Regular Push-up',
    'push', 4,
    '{"targetReps": 20, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'diamond-push-up',
    'Diamond Push-up',
    'push', 5,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'pike-push-up',
    'Pike Push-up',
    'push', 6,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'elevated-pike-push-up',
    'Elevated Pike Push-up',
    'push', 7,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'wall-hspu',
    'Wall Handstand Push-up',
    'push', 8,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- PULL chain
-- Row progression → Pull-up progression
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'dead-hang',
    'Dead Hang',
    'pull', 1,
    '{"targetReps": 60, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'scapular-pull',
    'Scapular Pull',
    'pull', 2,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'incline-row',
    'Incline Row',
    'pull', 3,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'australian-pull-up',
    'Australian Pull-up (Row)',
    'pull', 4,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'feet-elevated-row',
    'Feet Elevated Row',
    'pull', 5,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'negative-pull-up',
    'Negative Pull-up',
    'pull', 6,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'jumping-pull-up',
    'Jumping Pull-up',
    'pull', 7,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'pull-up',
    'Pull-up',
    'pull', 8,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'chin-up',
    'Chin-up',
    'pull', 9,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'l-sit-pull-up',
    'L-sit Pull-up',
    'pull', 10,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- LEGS chain
-- Squat → Split squat → Pistol path
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'squat',
    'Squat',
    'legs', 1,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'lunge',
    'Lunge',
    'legs', 2,
    '{"targetReps": 12, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'step-up',
    'Step-up',
    'legs', 3,
    '{"targetReps": 12, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'romanian-deadlift',
    'Romanian Deadlift (single-leg)',
    'legs', 4,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'split-squat',
    'Split Squat',
    'legs', 5,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'bulgarian-split-squat',
    'Bulgarian Split Squat',
    'legs', 6,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'shrimp-squat-beginner',
    'Beginner Shrimp Squat',
    'legs', 7,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'pistol-squat',
    'Pistol Squat',
    'legs', 8,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- SKILL chain
-- L-sit progression (RR skill work)
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'tuck-sit',
    'Tuck Sit',
    'skill', 1,
    '{"targetReps": 30, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'tuck-l-sit',
    'Tuck L-sit',
    'skill', 2,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'advanced-tuck-l-sit',
    'Advanced Tuck L-sit',
    'skill', 3,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'one-leg-l-sit',
    'One-leg L-sit',
    'skill', 4,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'l-sit',
    'L-sit',
    'skill', 5,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'straddle-l-sit',
    'Straddle L-sit',
    'skill', 6,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'v-sit',
    'V-sit',
    'skill', 7,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 3}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;
