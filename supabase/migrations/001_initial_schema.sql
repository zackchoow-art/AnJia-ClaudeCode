-- ============================================================================
-- REDP Phase 0: Initial Schema (v0.2.0)
-- Created: 2025-06-02
-- Charset: UTF-8 (支持中文)
-- ============================================================================

-- Set encoding for Chinese support
SET client_encoding = 'UTF8';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE BUSINESS TABLES (6个)
-- ============================================================================

-- Projects: 项目基础数据
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  location TEXT NOT NULL,
  developer_name TEXT NOT NULL,
  project_status VARCHAR(50) DEFAULT 'PLANNING',
  start_date DATE,
  expected_completion DATE,
  total_land_area NUMERIC(15, 2),
  total_built_area NUMERIC(15, 2),
  total_budget NUMERIC(15, 2) NOT NULL CHECK (total_budget > 0),
  tax_planning_baseline NUMERIC(15, 2),
  actual_tax_amount NUMERIC(15, 2),
  tax_planning_completed_at TIMESTAMP,
  tax_planning_notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers: 客户数据 (核心!之前遗漏的关键表)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 客户基本信息
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_id_number TEXT,  -- 身份证号
  customer_address TEXT,
  customer_type VARCHAR(50) DEFAULT 'INDIVIDUAL',  -- INDIVIDUAL, COMPANY
  
  -- 关键: 销售归属字段(用于RLS隔离)
  sales_agent_id UUID,  -- 这个客户属于哪个销售人员
  sales_agent_name TEXT,
  
  -- 客户状态
  customer_status VARCHAR(50) DEFAULT 'POTENTIAL',  -- POTENTIAL, INTERESTED, NEGOTIATING, SIGNED, CANCELLED
  source TEXT,  -- 客户来源
  
  -- 客户意向
  interested_property_type TEXT,
  budget_range_min NUMERIC(15, 2),
  budget_range_max NUMERIC(15, 2),
  
  -- 备注和承诺(防止销售口头承诺纠纷的关键!)
  notes TEXT,
  commitments_made JSONB DEFAULT '[]',  -- [{date, content, made_by, recorded_by}]
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts: 合同管理
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),  -- 关联客户(销售合同时使用)
  
  contract_code TEXT NOT NULL UNIQUE,
  contract_name TEXT NOT NULL,
  contract_type VARCHAR(50) NOT NULL,  -- SUPPLIER, CONTRACTOR, SALES, CONSULTANT
  counterparty_name TEXT NOT NULL,
  counterparty_id TEXT,
  
  contract_status VARCHAR(50) DEFAULT 'DRAFT' 
    CHECK (contract_status IN ('DRAFT', 'PENDING_SIGN', 'SIGNED', 'ACTIVATED', 'COMPLETED', 'TERMINATED')),
  draft_date DATE,
  signed_date DATE,
  activated_date DATE,
  completion_date DATE,
  termination_date DATE,
  termination_reason TEXT,
  
  total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount > 0),
  currency VARCHAR(3) DEFAULT 'CNY',
  
  payment_milestones JSONB DEFAULT '[]',
  key_terms_json JSONB,
  signatory_list JSONB,
  all_signatures_complete BOOLEAN DEFAULT FALSE,
  
  -- 关键: 销售归属(用于RLS)
  sales_agent_id UUID,
  
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments: 支付记录
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  payment_code TEXT NOT NULL UNIQUE,
  payment_amount NUMERIC(15, 2) NOT NULL CHECK (payment_amount > 0),
  payment_currency VARCHAR(3) DEFAULT 'CNY',
  payment_date DATE NOT NULL,
  
  payment_status VARCHAR(50) DEFAULT 'PENDING'
    CHECK (payment_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED')),
  
  approval_checklist JSONB DEFAULT '{}',
  approval_checklist_completed_at TIMESTAMP,
  
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  approval_notes TEXT,
  rejection_reason TEXT,
  
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Budget: 预算表
CREATE TABLE IF NOT EXISTS cost_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  cost_category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  budgeted_amount NUMERIC(15, 2) NOT NULL CHECK (budgeted_amount > 0),
  spent_amount NUMERIC(15, 2) DEFAULT 0,
  
  budget_status VARCHAR(50) DEFAULT 'APPROVED',
  budget_approved_date DATE,
  budget_approved_by TEXT,
  
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Ledger: 成本账本
CREATE TABLE IF NOT EXISTS cost_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_budget_id UUID REFERENCES cost_budget(id),
  
  cost_type VARCHAR(100) NOT NULL,
  cost_description TEXT,
  cost_amount NUMERIC(15, 2) NOT NULL CHECK (cost_amount > 0),
  cost_date DATE NOT NULL,
  
  receipt_filename TEXT,
  receipt_hash TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  
  verified_by UUID,
  verification_date TIMESTAMP,
  verification_status VARCHAR(50) DEFAULT 'PENDING',
  
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. GOVERNANCE TABLES (3个)
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  gate_name VARCHAR(100) NOT NULL,
  gate_description TEXT,
  required_conditions JSONB NOT NULL,
  override_allowed BOOLEAN DEFAULT FALSE,
  override_requires_approvals INTEGER DEFAULT 2,
  gate_status VARCHAR(50) DEFAULT 'ACTIVE',
  
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  milestone_name VARCHAR(100) NOT NULL,
  milestone_description TEXT,
  trigger_condition_json JSONB NOT NULL,
  payment_percentage NUMERIC(5, 2) NOT NULL 
    CHECK (payment_percentage > 0 AND payment_percentage <= 100),
  required_documents JSONB DEFAULT '[]',
  min_progress_percentage NUMERIC(5, 2) DEFAULT 0,
  rule_status VARCHAR(50) DEFAULT 'ACTIVE',
  
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL 
    CHECK (action IN ('CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'DELETED', 'SIGNED', 'EXECUTED')),
  actor_type VARCHAR(50) NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  change_details JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. CONTROL TABLES (3个)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  table_names TEXT[] NOT NULL,
  locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_until TIMESTAMP NOT NULL CHECK (locked_until > locked_at),
  lock_reason TEXT,
  lock_status VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version_number VARCHAR(20) NOT NULL UNIQUE,
  migration_name VARCHAR(255) NOT NULL,
  migration_file TEXT,
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rollback_strategy TEXT,
  status VARCHAR(50) DEFAULT 'SUCCESS',
  error_message TEXT
);

-- Work Logs: Supabase备份(用户选项C - Git+Supabase双备份)
CREATE TABLE IF NOT EXISTS work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  log_type VARCHAR(50) NOT NULL,  -- schema_change, code_change, review, test
  log_content JSONB NOT NULL,
  git_commit_hash TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, REVIEWED, APPROVED, REJECTED
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  committed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN VALUES ('projects'), ('customers'), ('contracts'), ('payments'), 
                  ('cost_budget'), ('cost_ledger'), ('approval_gates'), ('payment_rules')
  LOOP
    EXECUTE format('
      CREATE TRIGGER %I_updated_at 
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp()
    ', t || '_trigger', t);
  END LOOP;
END $$;

-- Audit trigger for payments
CREATE OR REPLACE FUNCTION log_payment_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (entity_type, entity_id, action, actor_type, actor_id, change_details)
  VALUES (
    'payment', NEW.id,
    CASE WHEN TG_OP = 'INSERT' THEN 'CREATED' ELSE 'UPDATED' END,
    'SYSTEM', 'trigger',
    jsonb_build_object(
      'status', CASE WHEN TG_OP = 'UPDATE' 
        THEN jsonb_build_object('before', OLD.payment_status, 'after', NEW.payment_status) 
        ELSE jsonb_build_object('initial', NEW.payment_status) END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_audit_trigger 
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_payment_change();

-- Audit trigger for customer commitments(防止销售口头承诺纠纷)
CREATE OR REPLACE FUNCTION log_customer_commitment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.commitments_made IS DISTINCT FROM NEW.commitments_made THEN
    INSERT INTO audit_log (entity_type, entity_id, action, actor_type, actor_id, change_details)
    VALUES (
      'customer_commitment', NEW.id, 'UPDATED', 'SYSTEM', 'trigger',
      jsonb_build_object(
        'before', OLD.commitments_made,
        'after', NEW.commitments_made
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_commitment_audit 
  AFTER UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION log_customer_commitment_change();

-- ============================================================================
-- 5. RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.2.0',
  'Initial REDP Phase 0 Schema (v0.2.0)',
  '001_initial_schema.sql',
  'See 999_rollback.sql for complete rollback'
);

-- ============================================================================
-- ROLLBACK STRATEGY
-- ============================================================================
-- To rollback this migration, execute the following in reverse order:
--
-- DROP TRIGGER IF EXISTS customers_commitment_audit ON customers;
-- DROP TRIGGER IF EXISTS payments_audit_trigger ON payments;
-- DROP FUNCTION IF EXISTS log_customer_commitment_change();
-- DROP FUNCTION IF EXISTS log_payment_change();
-- DROP FUNCTION IF EXISTS update_updated_at_timestamp();
-- 
-- DROP TABLE IF EXISTS work_logs CASCADE;
-- DROP TABLE IF EXISTS schema_version CASCADE;
-- DROP TABLE IF EXISTS task_locks CASCADE;
-- DROP TABLE IF EXISTS audit_log CASCADE;
-- DROP TABLE IF EXISTS payment_rules CASCADE;
-- DROP TABLE IF EXISTS approval_gates CASCADE;
-- DROP TABLE IF EXISTS cost_ledger CASCADE;
-- DROP TABLE IF EXISTS cost_budget CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS contracts CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
--
-- DROP EXTENSION IF EXISTS pgcrypto;
-- DROP EXTENSION IF EXISTS "uuid-ossp";
