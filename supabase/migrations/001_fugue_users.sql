-- Phase 7-1: User management table
-- Stores FUGUE user profiles linked to CF Access identities

CREATE TABLE IF NOT EXISTS fugue_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'operator', 'viewer')),
  cf_identity JSONB,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only read their own row; admins can read all
ALTER TABLE fugue_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own" ON fugue_users
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "admins_read_all" ON fugue_users
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admins_manage" ON fugue_users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS for existing tables
ALTER TABLE fugue_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_agents" ON fugue_agents
  FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER TABLE fugue_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_tasks" ON fugue_tasks
  FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER TABLE fugue_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_runs" ON fugue_runs
  FOR SELECT
  USING (auth.role() = 'authenticated');
