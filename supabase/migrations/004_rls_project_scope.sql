-- Phase 9.0-4: RLS policy hardening
-- Adds WITH CHECK clauses and standardizes admin full-access

-- =============================================================================
-- fugue_users: Add WITH CHECK to admins_manage
-- Previously: USING only (reads restricted, writes unrestricted for matching rows)
-- Fix: Ensure admins can only write rows that also satisfy the admin check
-- =============================================================================

DROP POLICY IF EXISTS "admins_manage" ON fugue_users;
CREATE POLICY "admins_manage" ON fugue_users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- fugue_execution_plans: Add WITH CHECK to operators_manage_plans
-- Previously: UPDATE with USING only, no INSERT policy
-- Fix: Add WITH CHECK + INSERT policy for operators+
-- =============================================================================

DROP POLICY IF EXISTS "operators_manage_plans" ON fugue_execution_plans;
CREATE POLICY "operators_manage_plans" ON fugue_execution_plans
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'operator'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'operator'));

-- Allow admins/operators to insert execution plans
CREATE POLICY "operators_insert_plans" ON fugue_execution_plans
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'operator'));

-- Admin full-access policy (superset, consistent with fugue_users pattern)
CREATE POLICY "admins_full_access_plans" ON fugue_execution_plans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- agent_performance_metrics: Document write policy
-- Writes are service_role only (backend inserts via service key).
-- No user-facing write policy needed. Read policy already exists.
-- =============================================================================

-- Admin read-all for completeness (already covered by authenticated_read_metrics,
-- but explicit admin policy ensures future policy changes don't break admin access)
CREATE POLICY "admins_read_all_metrics" ON agent_performance_metrics
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- fugue_agents: Admin write access (for agent management UI)
-- =============================================================================

CREATE POLICY "admins_manage_agents" ON fugue_agents
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- fugue_tasks: Operator+ write access (task management)
-- =============================================================================

CREATE POLICY "operators_manage_tasks" ON fugue_tasks
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'operator'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'operator'));

-- =============================================================================
-- fugue_runs: Admin write access
-- =============================================================================

CREATE POLICY "admins_manage_runs" ON fugue_runs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
