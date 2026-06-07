# T02 — 支付Gate端到端测试

**任务ID**: task-phase0-T02  
**执行Agent**: 测试Agent (`nvidia/nemotron-3-super-120b-a12b`)  
**估时**: 4小时  
**依赖**: T01（系统完整性验证通过）  
**分支**: `test/phase0-T02-payment-gate`  
**优先级**: 🔴 Critical

---

## 任务目标

对支付Gate的完整业务流程进行端到端测试，覆盖所有5个验证条件的正向路径和反向路径，确保业务逻辑与设计文档完全一致。

---

## 执行边界

### 允许的操作
- 使用 seed data 中的测试数据
- 在测试前/后修改 seed data 的状态字段（测试完后必须还原）
- 调用所有 4 个 Edge Functions
- 向 `.logs/tests/` 写入测试报告

### 禁止的操作
- 不得删除 seed data 中的测试记录
- 不得修改 Edge Function 业务逻辑代码
- 不得修改 RLS 策略
- 不得操作非 seed data 范围的数据

---

## 测试场景

### 场景 A: 完整支付审批流（Happy Path）

**前置条件**（使用 seed data 原始状态验证）:
- contracts: `contract_status = 'SIGNED'`, `all_signatures_complete = true`
- cost_ledger: 至少1条 `verification_status = 'VERIFIED'` 且有 `receipt_filename`
- projects: `tax_planning_completed_at IS NOT NULL`
- payment_rules: 有 `rule_status = 'ACTIVE'` 的记录
- 无 `REJECTED` 状态的同合同支付

**执行**:
```bash
# A1: 调用 validate_payment
curl -s -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "f1111111-1111-1111-1111-111111111111"}'

# 预期响应:
# { "success": true, "data": { "status": "PENDING_APPROVAL", "approval_checklist": { all 5 items... } } }

# A2: 调用 approve_payment（reviewer身份）
curl -s -X POST "$SUPABASE_URL/functions/v1/approve_payment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "f1111111-1111-1111-1111-111111111111", "reviewer_id": "r1111111-1111-1111-1111-111111111111", "approval_notes": "T02测试审批通过"}'

# 预期响应:
# { "success": true, "data": { "new_status": "APPROVED" } }

# A3: 验证 audit_log 有两条记录（CREATED + APPROVED）
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT action, actor_type, actor_name, timestamp
  FROM audit_log
  WHERE entity_type = 'payment' AND entity_id = 'f1111111-1111-1111-1111-111111111111'
  ORDER BY timestamp ASC;
"
```

**验收标准**:
- validate 返回 success:true
- approve 返回 success:true, new_status=APPROVED
- audit_log 有 ≥2 条记录

---

### 场景 B: 合同未签署 → 拒绝

```bash
# B1: 临时修改合同状态
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE contracts SET contract_status = 'DRAFT', all_signatures_complete = false 
  WHERE id = 'c1111111-1111-1111-1111-111111111111';
"

# 创建新的PENDING支付用于测试（避免污染已完成的A场景）
psql "$SUPABASE_CONNECTION_STRING" -c "
  INSERT INTO payments (id, project_id, contract_id, payment_code, payment_amount, payment_currency, payment_status, created_by)
  VALUES (
    'f2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'PAY-TEST-B',
    50000.00, 'CNY', 'PENDING', 'tester'
  );
"

# B2: 调用 validate_payment
curl -s -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "f2222222-2222-2222-2222-222222222222"}'

# 预期:
# { "success": true, "data": { "status": "REJECTED", "rejection_reasons": ["合同状态..."] } }

# B3: 还原合同状态
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE contracts SET contract_status = 'SIGNED', all_signatures_complete = true 
  WHERE id = 'c1111111-1111-1111-1111-111111111111';
"

# B4: 清理测试数据
psql "$SUPABASE_CONNECTION_STRING" -c "
  DELETE FROM payments WHERE id = 'f2222222-2222-2222-2222-222222222222';
"
```

**验收标准**: status=REJECTED，rejection_reasons 包含"合同"相关描述

---

### 场景 C: 税金计划未完成 → 拒绝

```bash
# C1: 临时清空税金完成时间
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE projects SET tax_planning_completed_at = NULL 
  WHERE id = 'a1111111-1111-1111-1111-111111111111';
"

# C2: 创建测试支付 + 调用validate（同B2格式，支付ID改为f3333...）
# ...（省略，结构同B）

# C3: 还原 + 清理
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE projects SET tax_planning_completed_at = NOW() 
  WHERE id = 'a1111111-1111-1111-1111-111111111111';
"
```

**验收标准**: status=REJECTED，rejection_reasons 包含"税金"相关描述

---

### 场景 D: 无效 payment_id → 404错误

```bash
curl -s -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "00000000-0000-0000-0000-000000000000"}'

# 预期: { "success": false, "error": { "code": "NOT_FOUND", ... } }
```

---

### 场景 E: 缺少 payment_id → 400错误

```bash
curl -s -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# 预期: { "success": false, "error": { "code": "VALIDATION_ERROR", ... } }
```

---

### 场景 F: audit_log不可篡改验证

```bash
# 尝试更新 audit_log（应该失败）
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE audit_log SET action = 'TAMPERED' WHERE id = (SELECT id FROM audit_log LIMIT 1);
"
# 预期: ERROR 或 0 rows affected

# 尝试删除 audit_log（应该失败）
psql "$SUPABASE_CONNECTION_STRING" -c "
  DELETE FROM audit_log WHERE id = (SELECT id FROM audit_log LIMIT 1);
"
# 预期: ERROR 或 0 rows affected
```

---

## 验收标准

| 场景 | 预期结果 | 是否必须通过 |
|------|---------|-------------|
| A: Happy Path 完整流程 | validate→approve→audit_log全部成功 | 必须 |
| B: 合同未签署 | REJECTED + 包含合同相关错误原因 | 必须 |
| C: 税金未完成 | REJECTED + 包含税金相关错误原因 | 必须 |
| D: 无效ID | success:false + NOT_FOUND | 必须 |
| E: 缺少参数 | success:false + VALIDATION_ERROR | 必须 |
| F: audit_log不可篡改 | UPDATE/DELETE 均无效 | 必须 |

**注意**: 所有临时修改的数据必须在测试后完全还原。最终验证：

```bash
# 验证数据完全还原
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT 
    (SELECT contract_status FROM contracts WHERE id = 'c1111111-1111-1111-1111-111111111111') AS contract_status,
    (SELECT tax_planning_completed_at IS NOT NULL FROM projects WHERE id = 'a1111111-1111-1111-1111-111111111111') AS tax_completed;
"
# 预期: SIGNED, true
```

---

## 交付物

1. **测试报告**: `.logs/tests/task-phase0-T02-report.json`
2. **工作日志**: `.logs/detailed/task-phase0-T02.json`
3. **Git Commit**: `test(payment-gate): e2e validation of payment approval flow [task-phase0-T02]`

### 测试报告格式

```json
{
  "task_id": "task-phase0-T02",
  "executed_at": "<ISO8601>",
  "executed_by": "tester_agent",
  "overall_status": "PASS|FAIL",
  "scenarios": {
    "A_happy_path": { "status": "PASS|FAIL", "notes": "" },
    "B_contract_not_signed": { "status": "PASS|FAIL", "notes": "" },
    "C_tax_not_completed": { "status": "PASS|FAIL", "notes": "" },
    "D_invalid_id": { "status": "PASS|FAIL", "notes": "" },
    "E_missing_param": { "status": "PASS|FAIL", "notes": "" },
    "F_audit_log_immutable": { "status": "PASS|FAIL", "notes": "" }
  },
  "data_restored": true,
  "failures": []
}
```
