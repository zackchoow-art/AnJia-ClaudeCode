-- ============================================================================
-- REDP Phase 1 Database Migrations (T01-T04)
-- Run these SQL statements to deploy the database schema changes
-- ============================================================================

-- ============================================================================
-- Migration 004: AI Contract Review Module (T01)
-- ============================================================================

SET client_encoding = 'UTF8';

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

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS latest_review_id UUID REFERENCES contract_reviews(id);

ALTER TABLE contract_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY contract_reviews_pm_read ON contract_reviews
  FOR SELECT TO project_manager USING (true);

CREATE POLICY contract_reviews_finance_read ON contract_reviews
  FOR SELECT TO finance USING (true);

CREATE POLICY contract_reviews_reviewer_all ON contract_reviews
  FOR ALL TO reviewer USING (true);

CREATE POLICY contract_reviews_agent_insert ON contract_reviews
  FOR INSERT TO system_agent WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_contract_reviews_contract ON contract_reviews(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_reviews_risk ON contract_reviews(risk_level, risk_score DESC);

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.3.0',
  'Phase 1 - AI Contract Review Module (T01)',
  '004_phase1_contract_review.sql',
  'DROP TABLE contract_reviews CASCADE; ALTER TABLE contracts DROP COLUMN latest_review_id;'
);

-- ============================================================================
-- Migration 005: Land Value Tax Risk Detection Engine (T02)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Input data (from projects and cost_ledger)
  estimated_revenue NUMERIC(15,2),
  land_cost NUMERIC(15,2),
  construction_cost NUMERIC(15,2),
  development_cost NUMERIC(15,2),
  tax_deductions NUMERIC(15,2),
  total_deductions NUMERIC(15,2),

  -- Calculation results
  appreciation_amount NUMERIC(15,2),
  appreciation_rate NUMERIC(5,2),
  tax_bracket TEXT,
  tax_rate NUMERIC(4,2),
  calculated_tax NUMERIC(15,2),

  -- Risk assessment
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  risk_factors JSONB DEFAULT '[]',

  -- AI optimization suggestions
  ai_suggestions JSONB DEFAULT '[]',
  ai_model TEXT,

  -- Data source info
  calculation_basis TEXT,
  data_completeness_pct INTEGER,

  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculated_by TEXT NOT NULL,

  -- Version control (project can have multiple calculations)
  version INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS latest_tax_calc_id UUID REFERENCES tax_calculations(id),
  ADD COLUMN IF NOT EXISTS tax_risk_level TEXT;

ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tax_calc_finance_all ON tax_calculations
  FOR ALL TO finance USING (true) WITH CHECK (true);

CREATE POLICY tax_calc_pm_read ON tax_calculations
  FOR SELECT TO project_manager USING (true);

CREATE POLICY tax_calc_agent_insert ON tax_calculations
  FOR INSERT TO system_agent WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_tax_calc_project ON tax_calculations(project_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tax_calc_risk ON tax_calculations(risk_level);

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.3.1',
  'Phase 1 - Land Value Tax Risk Detection Engine (T02)',
  '005_phase1_tax_detection.sql',
  'DROP TABLE tax_calculations CASCADE; ALTER TABLE projects DROP COLUMN latest_tax_calc_id, DROP COLUMN tax_risk_level;'
);

-- ============================================================================
-- Migration 006: Intelligent Financial Planning Module (T03)
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('MONTHLY', 'QUARTERLY', 'MILESTONE_BASED')),

  -- Cash health indicators
  current_budget_utilization_pct NUMERIC(5,2),
  projected_cash_flow JSONB NOT NULL DEFAULT '{}',

  -- Payment recommendations
  payment_recommendations JSONB NOT NULL DEFAULT '[]',

  -- Risk alerts
  risk_alerts JSONB NOT NULL DEFAULT '[]',

  -- Related tax calculation
  tax_calculation_id UUID REFERENCES tax_calculations(id),

  plan_period_start DATE NOT NULL,
  plan_period_end DATE NOT NULL,

  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by TEXT NOT NULL
);

ALTER TABLE financial_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_plans_finance_all ON financial_plans
  FOR ALL TO finance USING (true) WITH CHECK (true);

CREATE POLICY financial_plans_pm_read ON financial_plans
  FOR SELECT TO project_manager USING (true);

CREATE INDEX IF NOT EXISTS idx_financial_plans_project ON financial_plans(project_id, generated_at DESC);

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.3.2',
  'Phase 1 - Intelligent Financial Planning Module (T03)',
  '006_phase1_financial_planning.sql',
  'DROP TABLE financial_plans CASCADE;'
);

-- ============================================================================
-- Migration 007: Document OCR Integration (T04)
-- ============================================================================

ALTER TABLE cost_ledger
  ADD COLUMN IF NOT EXISTS ocr_extracted_data JSONB,
  ADD COLUMN IF NOT EXISTS ocr_status TEXT DEFAULT 'NOT_PROCESSED'
    CHECK (ocr_status IN ('NOT_PROCESSED', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW'));

CREATE TABLE IF NOT EXISTS ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_ledger_id UUID REFERENCES cost_ledger(id),
  file_path TEXT NOT NULL,
  job_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (job_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  ocr_result JSONB,
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ocr_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ocr_jobs_finance_all ON ocr_jobs
  FOR ALL TO finance USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ocr_jobs_cost_ledger ON ocr_jobs(cost_ledger_id);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_status ON ocr_jobs(job_status);

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.3.3',
  'Phase 1 - Document OCR Integration (T04)',
  '007_phase1_ocr.sql',
  'ALTER TABLE cost_ledger DROP COLUMN ocr_extracted_data, DROP COLUMN ocr_status; DROP TABLE ocr_jobs CASCADE;'
);
