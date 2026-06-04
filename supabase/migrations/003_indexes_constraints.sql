-- ============================================================================
-- REDP Phase 0: Indexes and Constraints (v0.2.0)
-- ============================================================================

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(location);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Customers (核心索引!RLS依赖sales_agent_id)
CREATE INDEX IF NOT EXISTS idx_customers_sales_agent ON customers(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_customers_project ON customers(project_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(customer_phone);

-- Contracts
CREATE INDEX IF NOT EXISTS idx_contracts_project_type ON contracts(project_id, contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_contracts_signed_date ON contracts(signed_date) WHERE signed_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_sales_agent ON contracts(sales_agent_id) WHERE contract_type = 'SALES';
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id) WHERE customer_id IS NOT NULL;

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_project_status ON payments(project_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_reviewed_by ON payments(reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_pending ON payments(project_id) WHERE payment_status = 'PENDING';

-- Cost ledger
CREATE INDEX IF NOT EXISTS idx_cost_ledger_project_date ON cost_ledger(project_id, cost_date DESC);
CREATE INDEX IF NOT EXISTS idx_cost_ledger_type ON cost_ledger(project_id, cost_type);
CREATE INDEX IF NOT EXISTS idx_cost_ledger_status ON cost_ledger(verification_status);

-- Cost budget
CREATE INDEX IF NOT EXISTS idx_cost_budget_project_category ON cost_budget(project_id, cost_category);

-- Approval gates / Payment rules
CREATE INDEX IF NOT EXISTS idx_approval_gates_project ON approval_gates(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_rules_contract ON payment_rules(contract_id);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);

-- Task locks (重要! Agent协调)
CREATE INDEX IF NOT EXISTS idx_task_locks_agent ON task_locks(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_locks_active ON task_locks(locked_until) WHERE lock_status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_task_locks_tables ON task_locks USING GIN(table_names);

-- Work logs
CREATE INDEX IF NOT EXISTS idx_work_logs_task ON work_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_status ON work_logs(status);
CREATE INDEX IF NOT EXISTS idx_work_logs_committed ON work_logs(committed_at DESC);

-- Record migration
INSERT INTO schema_version (version_number, migration_name, migration_file)
VALUES ('0.2.2', 'Indexes and Constraints', '003_indexes_constraints.sql');
