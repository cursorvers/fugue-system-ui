-- Phase 7-2: Execution plan approval table
-- Stores orchestration execution plans and their approval status

CREATE TABLE IF NOT EXISTS fugue_execution_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID,
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'tutti' CHECK (mode IN ('tutti', 'forte', 'max')),
  plan JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executing', 'completed', 'failed')),
  approved_by UUID REFERENCES fugue_users(id),
  rejected_reason TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Authenticated users can read, operators+ can approve/reject
ALTER TABLE fugue_execution_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_plans" ON fugue_execution_plans
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "operators_manage_plans" ON fugue_execution_plans
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'operator')
  );

-- Index for active plan lookups
CREATE INDEX idx_execution_plans_status ON fugue_execution_plans(status)
  WHERE status IN ('pending', 'executing');
