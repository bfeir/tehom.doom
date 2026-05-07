-- Migration: 001_initial_schema
-- Calisthenics Tracker v1 — initial database schema

-- ============================================================
-- Exercise registry (global, no RLS — shared catalog)
-- ============================================================

CREATE TABLE IF NOT EXISTS exercises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  track         TEXT NOT NULL CHECK (track IN ('push-up', 'hspu', 'row', 'pull-up', 'squat', 'nordic-curl', 'core', 'skill')),
  chain_order   INTEGER,
  rr_criteria   JSONB,
  rr_wiki_url   TEXT NOT NULL DEFAULT '',
  version_tag   TEXT NOT NULL DEFAULT 'rr-2024',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercises_track_order ON exercises (track, chain_order);
CREATE INDEX IF NOT EXISTS idx_exercises_name_search ON exercises USING gin(to_tsvector('english', name));

-- ============================================================
-- Sessions (user-scoped, RLS required)
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  entries     JSONB NOT NULL DEFAULT '[]',
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at   TIMESTAMPTZ,
  is_open     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_logged_at ON sessions (logged_at DESC);

-- ============================================================
-- User progression (user-scoped, RLS required)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_progression (
  user_id             TEXT NOT NULL,
  track               TEXT NOT NULL CHECK (track IN ('push-up', 'hspu', 'row', 'pull-up', 'squat', 'nordic-curl', 'core', 'skill')),
  current_exercise_id UUID NOT NULL REFERENCES exercises(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track)
);

-- ============================================================
-- Progression events (user-scoped, RLS required)
-- ============================================================

CREATE TABLE IF NOT EXISTS progression_events (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  TEXT NOT NULL,
  from_exercise_id         UUID NOT NULL REFERENCES exercises(id),
  to_exercise_id           UUID NOT NULL REFERENCES exercises(id),
  advanced_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  qualifying_session_ids   UUID[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_progression_events_user_id ON progression_events (user_id);
CREATE INDEX IF NOT EXISTS idx_progression_events_advanced_at ON progression_events (advanced_at DESC);

-- ============================================================
-- Row Level Security
-- exercises: NO RLS (global registry, read-only for all authenticated users)
-- ============================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE progression_events ENABLE ROW LEVEL SECURITY;

-- Sessions: users can only access their own sessions
CREATE POLICY "Users can read own sessions"
  ON sessions FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (user_id = auth.uid()::text);

-- User progression: users can only access their own progression
CREATE POLICY "Users can read own progression"
  ON user_progression FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own progression"
  ON user_progression FOR ALL
  USING (user_id = auth.uid()::text);

-- Progression events: users can only access their own events
CREATE POLICY "Users can read own progression events"
  ON progression_events FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own progression events"
  ON progression_events FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);
