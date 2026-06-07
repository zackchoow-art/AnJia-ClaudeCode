# T03 — RLS安全测试

**任务ID**: task-phase0-T03  
**执行Agent**: 测试Agent (`nvidia/nemotron-3-super-120b-a12b`) + 审核Agent (`minimaxai/minimax-m2.7`)  
**估时**: 3小时（测试2h + 审核1h）  
**依赖**: T01（系统完整性验证通过）  
**分支**: `test/phase0-T03-security-rls`  
**优先级**: 🔴 Critical

---

## 任务目标

验证所有RLS策略按设计意图生效，特别是：
1. sales_team 完全无法访问 payments 和 cost_ledger
2. sales_team 只能看到自己名下的 customers
3. audit_log 对所有角色不可修改/删除
4. reviewer 能执行审批操作但不能越权

**这是项目的核心安全测试，失败则整个 Phase 0 不可通过验收。**

---

## 执行边界

### 允许的操作
- 使用 `SET ROLE` 或 `SET app.current_user_id` 模拟不同角色
- 发送不同 Authorization header 的 HTTP 请求
- 读取 pg_policies 元数据
- 向 `.logs/tests/` 写入测试报告

### 禁止的操作
- 不得修改 RLS 策略
- 不得创建新的数据库角色
- 不得使用 service_role key 绕过 RLS 测试（service_role 会绕过RLS，测试时必须用对应角色的 JWT）
- 不得永久删除任何测试数据

---

## 测试场景

### 场景 1: sales_team 完全无法访问 payments

```sql
-- 模拟 sales_team 角色
SET ROLE sales_team;
SET app.current_user_id = 's1111111-1111-1111-1111-111111111111';

-- 1.1 SELECT 应返回空（不报错，但0行）
SELECT * FROM payments;
-- 预期: 0 rows

-- 1.2 INSERT 应失败
INSERT INTO payments (id, project_id, contract_id, payment_code, payment_amount, payment_currency, payment_status, created_by)
VALUES (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'HACK', 1, 'CNY', 'PENDING', 'hacker');
-- 预期: ERROR 或 0 rows affected

-- 1.3 UPDATE 应失败
UPDATE payments SET payment_amount = 999999 WHERE id = 'f1111111-1111-1111-1111-111111111111';
-- 预期: 0 rows affected

RESET ROLE;
```

### 场景 2: sales_team 完全无法访问 cost_ledger 和 cost_budget

```sql
SET ROLE sales_team;
SET app.current_user_id = 's1111111-1111-1111-1111-111111111111';

SELECT * FROM cost_ledger;    -- 预期: 0 rows
SELECT * FROM cost_budget;    -- 预期: 0 rows

RESET ROLE;
```

### 场景 3: sales_team 只能看自己的 customers

```sql
-- 销售A（s1111111...）可以看到自己的客户
SET ROLE sales_team;
SET app.current_user_id = 's1111111-1111-1111-1111-111111111111';

SELECT id, customer_name, sales_agent_id FROM customers;
-- 预期: 只返回 sales_agent_id = 's1111111-1111-1111-1111-111111111111' 的行

-- 验证不能看其他销售的客户
SELECT COUNT(*) FROM customers 
WHERE sales_agent_id != 's1111111-1111-1111-1111-111111111111';
-- 预期: 0

RESET ROLE;
```

### 场景 4: sales_team 不能修改 customers 中其他人的数据

```sql
SET ROLE sales_team;
SET app.current_user_id = 's1111111-1111-1111-1111-111111111111';

-- 尝试更新不属于自己的客户
UPDATE customers 
SET notes = 'hacked' 
WHERE sales_agent_id = 's2222222-2222-2222-2222-222222222222';
-- 预期: 0 rows affected（RLS阻止）

RESET ROLE;
```

### 场景 5: audit_log 对所有角色不可 UPDATE/DELETE

```sql
-- 5.1 project_manager 尝试修改
SET ROLE project_manager;
UPDATE audit_log SET action = 'TAMPERED' LIMIT 1;
-- 预期: 0 rows affected（RESTRICTIVE policy）
DELETE FROM audit_log LIMIT 1;
-- 预期: 0 rows affected
RESET ROLE;

-- 5.2 finance 尝试修改
SET ROLE finance;
UPDATE audit_log SET action = 'TAMPERED' LIMIT 1;
-- 预期: 0 rows affected
RESET ROLE;

-- 5.3 reviewer 尝试修改
SET ROLE reviewer;
UPDATE audit_log SET action = 'TAMPERED' LIMIT 1;
-- 预期: 0 rows affected
RESET ROLE;
```

### 场景 6: reviewer 能审批支付但不能创建合同

```sql
SET ROLE reviewer;

-- 6.1 可以读取 payments（审批需要）
SELECT * FROM payments LIMIT 1;
-- 预期: 返回数据（reviewer有读权限）

-- 6.2 不能创建新合同（超出 reviewer 权限范围）
INSERT INTO contracts (project_id, contract_code, contract_name, contract_type, counterparty_name, total_amount, currency, created_by)
VALUES ('a1111111-1111-1111-1111-111111111111', 'TEST-001', 'Test', 'SUPPLIER', 'Test Co', 1000, 'CNY', 'reviewer');
-- 预期: ERROR（reviewer 无 INSERT on contracts 权限）

RESET ROLE;
```

### 场景 7: SQL注入防护测试

```bash
# 通过 Edge Function 测试注入
curl -s -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "'"'"'; DROP TABLE payments; --'"'"'"}'

# 预期: { "success": false, "error": { "code": "VALIDATION_ERROR" } }
# 验证 payments 表仍然存在:
psql "$SUPABASE_CONNECTION_STRING" -c "SELECT COUNT(*) FROM payments;"
```

### 场景 8: 未授权请求被拒绝

```bash
# 8.1 无 Authorization header
curl -s -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "f1111111-1111-1111-1111-111111111111"}'
# 预期: HTTP 401 或 { "success": false }

# 8.2 错误的 JWT token
curl -s -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Authorization: Bearer invalid-token-here" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "f1111111-1111-1111-1111-111111111111"}'
# 预期: HTTP 401 或 { "success": false }
```

---

## 审核Agent职责

测试Agent完成后，审核Agent需要：

1. **独立复核测试结果**: 抽查2-3个关键场景自行验证
2. **审查测试报告完整性**: 确认所有8个场景都有结果
3. **出具安全审计意见**: 在测试报告基础上追加 `security_audit` 节点

```json
"security_audit": {
  "auditor": "reviewer_agent",
  "audit_timestamp": "<ISO8601>",
  "critical_findings": [],
  "rls_assessment": "SECURE|NEEDS_FIX",
  "injection_resistance": "PASS|FAIL",
  "auth_enforcement": "PASS|FAIL",
  "overall_verdict": "APPROVED|REJECTED",
  "reviewer_notes": ""
}
```

---

## 验收标准

| 场景 | 预期结果 | 权重 |
|------|---------|------|
| 1: sales_team 无法访问 payments | 0行数据，INSERT/UPDATE无效 | 🔴 关键 |
| 2: sales_team 无法访问 cost_ledger/cost_budget | 0行数据 | 🔴 关键 |
| 3: sales_team 只看自己 customers | 只返回自己名下数据 | 🔴 关键 |
| 4: 不能修改他人 customers | 0 rows affected | 🔴 关键 |
| 5: audit_log 全角色不可篡改 | UPDATE/DELETE 均0行 | 🔴 关键 |
| 6: reviewer 权限边界正确 | 能读不能越权写 | 🟡 重要 |
| 7: SQL注入防护 | 表存在，返回错误响应 | 🔴 关键 |
| 8: 未授权请求被拒 | 401 或 success:false | 🔴 关键 |

**任意一个🔴关键场景失败，T06验收自动不通过。**

---

## 交付物

1. **安全测试报告**: `.logs/tests/task-phase0-T03-security-report.json`（含审核Agent的 security_audit 节点）
2. **工作日志**: `.logs/detailed/task-phase0-T03.json`
3. **Git Commit**: `test(security): rls and injection resistance validation [task-phase0-T03]`
