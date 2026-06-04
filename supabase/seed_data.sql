-- ============================================================================
-- REDP Phase 0: Seed Data for Testing
-- 用于开发和测试,不要在生产环境执行!
-- ============================================================================

-- 1. 测试项目
INSERT INTO projects (id, project_name, location, developer_name, project_status, total_budget, tax_planning_baseline)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 
   '喀什第三期住宅项目', 
   '新疆喀什市', 
   '喀什地产开发有限公司',
   'PLANNING',
   500000000.00,
   45000000.00);

-- 2. 测试销售人员UUID(实际部署需替换为真实Supabase Auth UUID)
-- 销售A: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- 销售B: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

-- 3. 测试客户 (销售A的客户)
INSERT INTO customers (id, project_id, customer_name, customer_phone, sales_agent_id, sales_agent_name, customer_status)
VALUES 
  ('c0000001-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   '张三',
   '13800138000',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '销售A',
   'INTERESTED');

-- 4. 测试客户 (销售B的客户)
INSERT INTO customers (id, project_id, customer_name, customer_phone, sales_agent_id, sales_agent_name, customer_status)
VALUES 
  ('c0000002-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111',
   '李四',
   '13900139000',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '销售B',
   'NEGOTIATING');

-- 5. 测试合同 (建筑承包商合同)
INSERT INTO contracts (id, project_id, contract_code, contract_name, contract_type, counterparty_name, contract_status, signed_date, total_amount, payment_milestones, all_signatures_complete)
VALUES 
  ('c1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'CTR-2025-001',
   '主体结构施工合同',
   'CONTRACTOR',
   '新疆建工集团',
   'SIGNED',
   '2025-05-15',
   80000000.00,
   '[{"name":"基础完工","percentage":20,"due_date":"2025-09-01"},{"name":"主体封顶","percentage":50,"due_date":"2026-03-01"},{"name":"竣工验收","percentage":30,"due_date":"2026-10-01"}]'::jsonb,
   true);

-- 6. 测试支付规则
INSERT INTO payment_rules (contract_id, milestone_name, milestone_description, trigger_condition_json, payment_percentage, required_documents, min_progress_percentage)
VALUES 
  ('c1111111-1111-1111-1111-111111111111',
   '基础完工',
   '地基和基础工程全部完成,通过质量验收',
   '{"type":"milestone","value":"foundation_complete"}'::jsonb,
   20.00,
   '[{"type":"invoice","name":"施工发票","required":true},{"type":"quality_report","name":"质量验收报告","required":true},{"type":"progress_photo","name":"工程进度照片","required":true}]'::jsonb,
   100.00);

-- 7. 测试支付申请 (待审批)
INSERT INTO payments (id, project_id, contract_id, payment_code, payment_amount, payment_date, payment_status, approval_checklist)
VALUES 
  ('f1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'c1111111-1111-1111-1111-111111111111',
   'PAY-2025-0001',
   16000000.00,
   '2025-09-15',
   'PENDING',
   '{"contract_signed":true,"documents_received":false,"tax_completed":false,"milestone_achieved":false}'::jsonb);

-- 8. 测试预算
INSERT INTO cost_budget (project_id, cost_category, budgeted_amount)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'LAND', 100000000.00),
  ('11111111-1111-1111-1111-111111111111', 'CONSTRUCTION', 250000000.00),
  ('11111111-1111-1111-1111-111111111111', 'SALES', 30000000.00),
  ('11111111-1111-1111-1111-111111111111', 'TAX', 80000000.00),
  ('11111111-1111-1111-1111-111111111111', 'OVERHEAD', 40000000.00);

-- 9. 测试审批门
INSERT INTO approval_gates (project_id, gate_name, gate_description, required_conditions)
VALUES 
  ('11111111-1111-1111-1111-111111111111',
   '主体结构付款门',
   '主体结构相关付款的统一审批规则',
   '{"contract_signed":true,"documents_required":["invoice","quality_report"],"milestone_percentage":100,"tax_planned":true}'::jsonb);

-- 验证插入
SELECT 'Seed data inserted:' AS status;
SELECT 'projects' AS table_name, COUNT(*) AS count FROM projects;
SELECT 'customers' AS table_name, COUNT(*) AS count FROM customers;
SELECT 'contracts' AS table_name, COUNT(*) AS count FROM contracts;
SELECT 'payments' AS table_name, COUNT(*) AS count FROM payments;
