-- ============================================================================
-- REDP Phase 1: Intelligent Financial Planning Module (T03)
-- Created: 2026-06-07
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- NEW TABLE: financial_plans
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

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE financial_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_plans_finance_all ON financial_plans
  FOR ALL TO finance USING (true) WITH CHECK (true);

CREATE POLICY financial_plans_pm_read ON financial_plans
  FOR SELECT TO project_manager USING (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_financial_plans_project ON financial_plans(project_id, generated_at DESC);

-- ============================================================================
-- RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.3.2',
  'Phase 1 - Intelligent Financial Planning Module (T03)',
  '006_phase1_financial_planning.sql',
  'DROP TABLE financial_plans CASCADE;'
);
