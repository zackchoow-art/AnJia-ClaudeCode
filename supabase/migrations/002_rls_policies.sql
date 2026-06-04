-- ============================================================================
-- REDP Phase 0: Roles + Row Level Security Policies (v0.2.0)
-- Purpose: 防止销售团队导出客户数据,实现完整的权限隔离
-- ============================================================================

-- ============================================================================
-- 1. CREATE ROLES (必须先创建,否则后续RLS会失败)
-- ============================================================================

DO $$
BEGIN
  -- Sales team role
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sales_team') THEN
    CREATE ROLE sales_team;
  END IF;

  -- Project Manager role
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'project_manager') THEN
    CREATE ROLE project_manager;
  END IF;

  -- Finance role
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'finance') THEN
    CREATE ROLE finance;
  END IF;

  -- Reviewer role
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'reviewer') THEN
    CREATE ROLE reviewer;
  END IF;

  -- System Agent role (for AI Agents)
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'system_agent') THEN
    CREATE ROLE system_agent;
  END IF;

  -- Super Admin role
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'super_admin') THEN
    CREATE ROLE super_admin;
  END IF;

  RAISE NOTICE 'All roles created/verified successfully';
END $$;

-- ============================================================================
-- 2. GRANT BASIC PRIVILEGES
-- ============================================================================

GRANT USAGE ON SCHEMA public TO sales_team, project_manager, finance, reviewer, system_agent, super_admin;

-- Super Admin: 完全访问
GRANT ALL ON ALL TABLES IN SCHEMA public TO super_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO super_admin;

-- Project Manager: 读所有表+写大部分
GRANT SELECT ON ALL TABLES IN SCHEMA public TO project_manager;
GRANT INSERT, UPDATE ON projects, contracts, customers, payments, cost_budget, cost_ledger, approval_gates, payment_rules TO project_manager;

-- Finance: 读所有表+写财务相关
GRANT SELECT ON ALL TABLES IN SCHEMA public TO finance;
GRANT INSERT, UPDATE ON payments, cost_budget, cost_ledger TO finance;

-- Reviewer: 读所有表+只更新approval字段
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reviewer;
GRANT UPDATE (payment_status, reviewed_by, reviewed_at, approval_notes, rejection_reason) ON payments TO reviewer;
GRANT UPDATE (contract_status, signed_date) ON contracts TO reviewer;

-- Sales Team: 严格限制(只能访问自己的客户和销售合同)
GRANT SELECT, INSERT ON customers TO sales_team;
GRANT UPDATE (notes, commitments_made, customer_status) ON customers TO sales_team;
GRANT SELECT, INSERT ON contracts TO sales_team;
-- 注意: sales_team不能GRANT到payments或cost_ledger

-- System Agent: 用于AI Agent的操作
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO system_agent;
GRANT UPDATE ON task_locks, work_logs TO system_agent;

-- Authenticated users(所有登录用户): 基础权限
GRANT SELECT ON projects TO authenticated;
GRANT INSERT ON audit_log TO authenticated;

-- ============================================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS POLICIES FOR customers (核心!防止销售导出数据)
-- ============================================================================

-- Sales: 只能看自己创建的客户(关键防泄露策略!)
CREATE POLICY customers_sales_isolation ON customers
  AS PERMISSIVE FOR SELECT TO sales_team
  USING (sales_agent_id::text = current_setting('app.current_user_id', true));

CREATE POLICY customers_sales_insert ON customers
  AS PERMISSIVE FOR INSERT TO sales_team
  WITH CHECK (sales_agent_id::text = current_setting('app.current_user_id', true));

CREATE POLICY customers_sales_update ON customers
  AS PERMISSIVE FOR UPDATE TO sales_team
  USING (sales_agent_id::text = current_setting('app.current_user_id', true));

-- Project Manager: 看所有客户
CREATE POLICY customers_pm_full ON customers
  AS PERMISSIVE FOR ALL TO project_manager USING (true);

-- Finance: 只读
CREATE POLICY customers_finance_read ON customers
  AS PERMISSIVE FOR SELECT TO finance USING (true);

-- Reviewer: 只读
CREATE POLICY customers_reviewer_read ON customers
  AS PERMISSIVE FOR SELECT TO reviewer USING (true);

-- ============================================================================
-- 5. RLS POLICIES FOR contracts
-- ============================================================================

-- Sales: 只能看自己的销售合同
CREATE POLICY contracts_sales_isolation ON contracts
  AS PERMISSIVE FOR SELECT TO sales_team
  USING (
    contract_type = 'SALES' 
    AND sales_agent_id::text = current_setting('app.current_user_id', true)
  );

CREATE POLICY contracts_sales_insert ON contracts
  AS PERMISSIVE FOR INSERT TO sales_team
  WITH CHECK (
    contract_type = 'SALES' 
    AND sales_agent_id::text = current_setting('app.current_user_id', true)
  );

-- Project Manager: 全访问
CREATE POLICY contracts_pm_full ON contracts
  AS PERMISSIVE FOR ALL TO project_manager USING (true);

-- Finance & Reviewer: 只读
CREATE POLICY contracts_finance_read ON contracts
  AS PERMISSIVE FOR SELECT TO finance USING (true);

CREATE POLICY contracts_reviewer_read ON contracts
  AS PERMISSIVE FOR SELECT TO reviewer USING (true);

-- ============================================================================
-- 6. RLS POLICIES FOR payments (严格! 销售完全不能访问)
-- ============================================================================

-- Sales: 完全阻止访问(最高优先级)
CREATE POLICY payments_sales_block ON payments
  AS RESTRICTIVE FOR ALL TO sales_team USING (false);

-- Finance: 完全访问
CREATE POLICY payments_finance_full ON payments
  AS PERMISSIVE FOR ALL TO finance USING (true);

-- Project Manager: 读+创建
CREATE POLICY payments_pm_select ON payments
  AS PERMISSIVE FOR SELECT TO project_manager USING (true);

CREATE POLICY payments_pm_insert ON payments
  AS PERMISSIVE FOR INSERT TO project_manager WITH CHECK (true);

-- Reviewer: 读+审核
CREATE POLICY payments_reviewer_select ON payments
  AS PERMISSIVE FOR SELECT TO reviewer USING (true);

CREATE POLICY payments_reviewer_update ON payments
  AS PERMISSIVE FOR UPDATE TO reviewer USING (true);

-- ============================================================================
-- 7. RLS POLICIES FOR cost_ledger (严格! 销售完全不能访问)
-- ============================================================================

CREATE POLICY cost_ledger_sales_block ON cost_ledger
  AS RESTRICTIVE FOR ALL TO sales_team USING (false);

CREATE POLICY cost_ledger_finance_full ON cost_ledger
  AS PERMISSIVE FOR ALL TO finance USING (true);

CREATE POLICY cost_ledger_pm_read ON cost_ledger
  AS PERMISSIVE FOR SELECT TO project_manager USING (true);

CREATE POLICY cost_ledger_reviewer_read ON cost_ledger
  AS PERMISSIVE FOR SELECT TO reviewer USING (true);

-- ============================================================================
-- 8. RLS POLICIES FOR cost_budget
-- ============================================================================

CREATE POLICY cost_budget_sales_block ON cost_budget
  AS RESTRICTIVE FOR ALL TO sales_team USING (false);

CREATE POLICY cost_budget_finance_full ON cost_budget
  AS PERMISSIVE FOR ALL TO finance USING (true);

CREATE POLICY cost_budget_pm_full ON cost_budget
  AS PERMISSIVE FOR ALL TO project_manager USING (true);

CREATE POLICY cost_budget_reviewer_read ON cost_budget
  AS PERMISSIVE FOR SELECT TO reviewer USING (true);

-- ============================================================================
-- 9. RLS POLICIES FOR audit_log (绝对不可篡改!)
-- ============================================================================

-- 所有authenticated用户可以插入(用于记录操作)
CREATE POLICY audit_log_insert ON audit_log
  AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

-- 只有finance, reviewer, project_manager, super_admin可以读
CREATE POLICY audit_log_read_finance ON audit_log
  AS PERMISSIVE FOR SELECT TO finance USING (true);

CREATE POLICY audit_log_read_reviewer ON audit_log
  AS PERMISSIVE FOR SELECT TO reviewer USING (true);

CREATE POLICY audit_log_read_pm ON audit_log
  AS PERMISSIVE FOR SELECT TO project_manager USING (true);

-- 关键! 任何人都不能修改或删除audit_log
CREATE POLICY audit_log_no_update ON audit_log
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);

CREATE POLICY audit_log_no_delete ON audit_log
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

-- ============================================================================
-- 10. RLS POLICIES FOR task_locks (Agent协调)
-- ============================================================================

CREATE POLICY task_locks_view_all ON task_locks
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY task_locks_agent_manage ON task_locks
  AS PERMISSIVE FOR ALL TO system_agent USING (true);

-- ============================================================================
-- 11. RLS POLICIES FOR work_logs (Agent工作日志)
-- ============================================================================

CREATE POLICY work_logs_agent_insert ON work_logs
  AS PERMISSIVE FOR INSERT TO system_agent WITH CHECK (true);

CREATE POLICY work_logs_view ON work_logs
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY work_logs_reviewer_update ON work_logs
  AS PERMISSIVE FOR UPDATE TO reviewer USING (true);

-- ============================================================================
-- 12. RLS POLICIES FOR projects, approval_gates, payment_rules
-- ============================================================================

-- Projects: 大部分角色都能读
CREATE POLICY projects_authenticated_read ON projects
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY projects_pm_write ON projects
  AS PERMISSIVE FOR ALL TO project_manager USING (true);

-- Approval Gates
CREATE POLICY approval_gates_pm_full ON approval_gates
  AS PERMISSIVE FOR ALL TO project_manager USING (true);

CREATE POLICY approval_gates_others_read ON approval_gates
  AS PERMISSIVE FOR SELECT TO finance, reviewer USING (true);

-- Payment Rules
CREATE POLICY payment_rules_pm_full ON payment_rules
  AS PERMISSIVE FOR ALL TO project_manager USING (true);

CREATE POLICY payment_rules_others_read ON payment_rules
  AS PERMISSIVE FOR SELECT TO finance, reviewer USING (true);

-- ============================================================================
-- 13. HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- 设置当前用户ID(供应用层调用)
CREATE OR REPLACE FUNCTION set_current_user(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql;

-- 获取当前用户ID
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION set_current_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user() TO authenticated;

-- ============================================================================
-- 14. RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.2.1',
  'Roles and RLS Policies',
  '002_rls_policies.sql',
  'DROP POLICY ... ON ... + DROP ROLE ...'
);
