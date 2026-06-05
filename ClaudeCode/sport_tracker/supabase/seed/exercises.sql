-- Seed data: RR Progression Chains (8 tracks)
-- Source: r/bodyweightfitness Recommended Routine (CC BY-NC-SA)
-- Reference: https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine
-- Last updated: 2026-05-06
--
-- Tracks:
--   push-up      Push-up progression (wall → one-arm prep)
--   hspu         Handstand push-up progression (pike → freestanding)
--   row          Horizontal pull / row progression
--   pull-up      Vertical pull / pull-up progression
--   squat        Squat progression (squat → pistol)
--   nordic-curl  Posterior chain / nordic curl progression
--   core         Core / anterior chain progression
--   skill        L-sit / compression skill progression

-- ============================================================
-- PUSH-UP chain
-- Wall → Incline → Full → Diamond → Archer
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'wall-push-up',
    'Wall Push-up',
    'push-up', 1,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'incline-push-up',
    'Incline Push-up',
    'push-up', 2,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'knee-push-up',
    'Knee Push-up',
    'push-up', 3,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'regular-push-up',
    'Regular Push-up',
    'push-up', 4,
    '{"targetReps": 20, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'diamond-push-up',
    'Diamond Push-up',
    'push-up', 5,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'archer-push-up',
    'Archer Push-up',
    'push-up', 6,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  track        = EXCLUDED.track,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- HSPU chain
-- Pike Push-up → Elevated Pike → Wall HSPU → Freestanding
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'pike-push-up',
    'Pike Push-up',
    'hspu', 1,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'elevated-pike-push-up',
    'Elevated Pike Push-up',
    'hspu', 2,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'wall-hspu',
    'Wall Handstand Push-up (Partial)',
    'hspu', 3,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'wall-hspu-full',
    'Wall Handstand Push-up (Full ROM)',
    'hspu', 4,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'deficit-wall-hspu',
    'Deficit Wall Handstand Push-up',
    'hspu', 5,
    '{"targetReps": 3, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'freestanding-hspu',
    'Freestanding Handstand Push-up',
    'hspu', 6,
    '{"targetReps": 3, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 3}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  track        = EXCLUDED.track,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- ROW chain
-- Incline → Australian → Feet Elevated → Archer Row
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'incline-row',
    'Incline Row',
    'row', 1,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'australian-pull-up',
    'Australian Pull-up (Row)',
    'row', 2,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'feet-elevated-row',
    'Feet Elevated Row',
    'row', 3,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'archer-row',
    'Archer Row',
    'row', 4,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  track        = EXCLUDED.track,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- PULL-UP chain
-- Dead Hang → Scapular → Negatives → Pull-up → L-sit Pull-up
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'dead-hang',
    'Dead Hang',
    'pull-up', 1,
    '{"targetReps": 60, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'scapular-pull',
    'Scapular Pull',
    'pull-up', 2,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'negative-pull-up',
    'Negative Pull-up',
    'pull-up', 3,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'jumping-pull-up',
    'Jumping Pull-up',
    'pull-up', 4,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'pull-up',
    'Pull-up',
    'pull-up', 5,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'chin-up',
    'Chin-up',
    'pull-up', 6,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'l-sit-pull-up',
    'L-sit Pull-up',
    'pull-up', 7,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'archer-pull-up',
    'Archer Pull-up',
    'pull-up', 8,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  track        = EXCLUDED.track,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- SQUAT chain
-- Squat → Split Squat → Pistol
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'squat',
    'Squat',
    'squat', 1,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'lunge',
    'Lunge',
    'squat', 2,
    '{"targetReps": 12, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'step-up',
    'Step-up',
    'squat', 3,
    '{"targetReps": 12, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'romanian-deadlift',
    'Romanian Deadlift (single-leg)',
    'squat', 4,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'split-squat',
    'Split Squat',
    'squat', 5,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'bulgarian-split-squat',
    'Bulgarian Split Squat',
    'squat', 6,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'shrimp-squat-beginner',
    'Beginner Shrimp Squat',
    'squat', 7,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'pistol-squat',
    'Pistol Squat',
    'squat', 8,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  track        = EXCLUDED.track,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- NORDIC CURL chain
-- Glute-Ham Raise → Assisted → Eccentric → Full Nordic
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'glute-bridge',
    'Glute Bridge',
    'nordic-curl', 1,
    '{"targetReps": 20, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'single-leg-glute-bridge',
    'Single-Leg Glute Bridge',
    'nordic-curl', 2,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'hip-hinge',
    'Hip Hinge (bodyweight)',
    'nordic-curl', 3,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'assisted-nordic-curl',
    'Assisted Nordic Curl',
    'nordic-curl', 4,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'eccentric-nordic-curl',
    'Eccentric Nordic Curl',
    'nordic-curl', 5,
    '{"targetReps": 6, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'nordic-curl',
    'Nordic Curl',
    'nordic-curl', 6,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  track        = EXCLUDED.track,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- CORE chain
-- Dead Bug → Hollow Body → Hanging Raises → Dragon Flag
-- ============================================================

INSERT INTO exercises (slug, name, track, chain_order, rr_criteria, rr_wiki_url, version_tag)
VALUES
  (
    'dead-bug',
    'Dead Bug',
    'core', 1,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'hollow-body-hold',
    'Hollow Body Hold',
    'core', 2,
    '{"targetReps": 30, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'hollow-body-rock',
    'Hollow Body Rock',
    'core', 3,
    '{"targetReps": 15, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'hanging-knee-raise',
    'Hanging Knee Raise',
    'core', 4,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'hanging-leg-raise',
    'Hanging Leg Raise',
    'core', 5,
    '{"targetReps": 10, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'toes-to-bar',
    'Toes to Bar',
    'core', 6,
    '{"targetReps": 8, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'dragon-flag-negative',
    'Dragon Flag (negative)',
    'core', 7,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 3, "consecutiveSessions": 2}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  ),
  (
    'dragon-flag',
    'Dragon Flag',
    'core', 8,
    '{"targetReps": 5, "targetSets": 3, "minFormQuality": 4, "consecutiveSessions": 3}'::jsonb,
    'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine', 'rr-2024'
  )
ON CONFLICT (slug) DO UPDATE SET
  name         = EXCLUDED.name,
  track        = EXCLUDED.track,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;

-- ============================================================
-- SKILL chain
-- L-sit progression (unchanged)
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
  track        = EXCLUDED.track,
  chain_order  = EXCLUDED.chain_order,
  rr_criteria  = EXCLUDED.rr_criteria,
  version_tag  = EXCLUDED.version_tag;
