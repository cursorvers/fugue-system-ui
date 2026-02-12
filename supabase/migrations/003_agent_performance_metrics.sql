-- Phase 8-2: Agent performance metrics
-- Stores time-series performance data for heatmap visualization

CREATE TABLE IF NOT EXISTS agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  latency_p50 REAL,
  latency_p99 REAL,
  error_rate REAL,
  task_count INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_metrics" ON agent_performance_metrics
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Index for time-range queries
CREATE INDEX idx_perf_metrics_agent_time
  ON agent_performance_metrics(agent_id, recorded_at DESC);

-- Auto-cleanup: keep 30 days of data (use pg_cron in production)
-- DELETE FROM agent_performance_metrics WHERE recorded_at < NOW() - INTERVAL '30 days';
