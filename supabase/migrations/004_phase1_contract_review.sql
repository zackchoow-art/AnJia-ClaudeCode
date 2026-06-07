-- ============================================================================
-- REDP Phase 1: AI Contract Review Module (T01)
-- Created: 2026-06-07
-- ============================================================================

-- Set encoding for Chinese support
SET client_encoding = 'UTF8';

-- ============================================================================
-- NEW TABLE: contract_reviews
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL CHECK (review_type IN ('AUTO_AI', 'MANUAL', 'HYBRID')),
  reviewed_by TEXT NOT NULL,

  -- AI analysis results
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  risk_score NUMERIC(3,1) CHECK (risk_score >= 0 AND risk_score <= 10),

  -- Key findings (structured JSONB)
  key_findings JSONB NOT NULL DEFAULT '[]',

  -- AI-generated summary
  executive_summary TEXT,

  -- Raw AI response (for audit trail)
  ai_model TEXT,
  ai_response_tokens INTEGER,

  -- Status
  review_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (review_status IN ('PENDING', 'COMPLETED', 'FAILED')),

  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODIFY TABLE: contracts
-- Add reference to latest review (forward-only change)
-- ============================================================================

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS latest_review_id UUID REFERENCES contract_reviews(id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE contract_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY contract_reviews_pm_read ON contract_reviews
  FOR SELECT TO project_manager USING (true);

CREATE POLICY contract_reviews_finance_read ON contract_reviews
  FOR SELECT TO finance USING (true);

CREATE POLICY contract_reviews_reviewer_all ON contract_reviews
  FOR ALL TO reviewer USING (true);

CREATE POLICY contract_reviews_agent_insert ON contract_reviews
  FOR INSERT TO system_agent WITH CHECK (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contract_reviews_contract ON contract_reviews(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_reviews_risk ON contract_reviews(risk_level, risk_score DESC);

-- ============================================================================
-- RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.3.0',
  'Phase 1 - AI Contract Review Module (T01)',
  '004_phase1_contract_review.sql',
  'DROP TABLE contract_reviews CASCADE; ALTER TABLE contracts DROP COLUMN latest_review_id;'
);
