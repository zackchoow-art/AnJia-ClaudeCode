-- ============================================================================
-- REDP Phase 1: Land Value Tax Risk Detection Engine (T02)
-- Created: 2026-06-07
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- NEW TABLE: tax_calculations
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

-- ============================================================================
-- MODIFY TABLE: projects
-- ============================================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS latest_tax_calc_id UUID REFERENCES tax_calculations(id),
  ADD COLUMN IF NOT EXISTS tax_risk_level TEXT;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tax_calc_finance_all ON tax_calculations
  FOR ALL TO finance USING (true) WITH CHECK (true);

CREATE POLICY tax_calc_pm_read ON tax_calculations
  FOR SELECT TO project_manager USING (true);

CREATE POLICY tax_calc_agent_insert ON tax_calculations
  FOR INSERT TO system_agent WITH CHECK (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tax_calc_project ON tax_calculations(project_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tax_calc_risk ON tax_calculations(risk_level);

-- ============================================================================
-- RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.3.1',
  'Phase 1 - Land Value Tax Risk Detection Engine (T02)',
  '005_phase1_tax_detection.sql',
  'DROP TABLE tax_calculations CASCADE; ALTER TABLE projects DROP COLUMN latest_tax_calc_id, DROP COLUMN tax_risk_level;'
);
