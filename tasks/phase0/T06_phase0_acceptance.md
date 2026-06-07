# T06 — Phase 0 完整验收

**任务ID**: task-phase0-T06  
**执行Agent**: 审核Agent (`minimaxai/minimax-m2.7`)  
**估时**: 3小时  
**依赖**: T02 + T03 + T04 + T05 全部完成且通过  
**分支**: `review/phase0-T06-acceptance`  
**优先级**: 🔴 Critical

---

## 任务目标

审核Agent对整个 Phase 0 进行全面独立审计，汇总 T01-T05 的测试结果，出具最终验收报告。审核Agent的 `overall_verdict` 决定 Phase 0 是否可以宣告完成。

---

## 执行边界

### 允许的操作
- 读取所有 `.logs/tests/` 和 `.logs/detailed/` 下的报告
- 抽查性地重新执行 T01-T05 中的任意测试场景（独立验证）
- 查看数据库中的实际状态
- 查看所有 Edge Function 代码

### 禁止的操作
- 不得修改任何代码或配置
- 不得修改其他任务的测试报告
- 不得跳过任何失败项直接宣布通过

---

## 审核清单

### 1. 测试报告完整性核查

| 报告文件 | 是否存在 | overall_status |
|---------|---------|----------------|
| `.logs/tests/task-phase0-T01-report.json` | ☐ | ☐ PASS |
| `.logs/tests/task-phase0-T02-report.json` | ☐ | ☐ PASS |
| `.logs/tests/task-phase0-T03-security-report.json` | ☐ | ☐ PASS |
| `.logs/tests/task-phase0-T04-report.json` | ☐ | ☐ PASS |
| `.logs/tests/task-phase0-T05-perf-report.json` | ☐ | ☐ PASS |

### 2. 关键功能独立验证（审核Agent自行执行）

```bash
# 2.1 独立验证支付Gate拒绝逻辑
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE contracts SET all_signatures_complete = false 
  WHERE id = 'c1111111-1111-1111-1111-111111111111';
"
# 创建测试支付 payment_id=f9999999-9999-9999-9999-999999999999
# 调用 validate_payment → 应该 REJECTED
# 还原数据

# 2.2 独立验证 RLS
psql "$SUPABASE_CONNECTION_STRING" -c "
  SET ROLE sales_team;
  SELECT COUNT(*) FROM payments;
  RESET ROLE;
"
# 预期: 0

# 2.3 独立验证 audit_log 不可修改
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE audit_log SET action = 'TEST_TAMPER' LIMIT 1;
"
# 预期: 0 rows affected
```

### 3. 代码质量审查

审核以下文件，对照 `CODE_STANDARDS.md` 检查：

```bash
# 审查 Edge Functions 代码
cat supabase/functions/validate_payment/index.ts
cat supabase/functions/approve_payment/index.ts
cat supabase/functions/audit_log/index.ts
cat supabase/functions/create_task_lock/index.ts
```

**检查项**:
- [ ] 所有函数有 JSDoc 注释
- [ ] 无 `any` 类型使用
- [ ] 错误处理完整（不吞异常）
- [ ] 返回值符合 `ApiResponse<T>` 格式
- [ ] 无 `console.log`（应使用结构化日志）
- [ ] 无 SQL 拼接（使用 Supabase 客户端参数化查询）

### 4. 安全审计

```bash
# 4.1 确认 .env 未被提交
git log --oneline --all -- .env
# 预期: 无输出

# 4.2 确认 service_role key 未出现在代码中
grep -r "eyJhbGc" supabase/functions/ --include="*.ts"
# 预期: 无输出（key应从环境变量读取）

# 4.3 确认 RESTRICTIVE 策略对 audit_log 存在
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT policyname, permissive 
  FROM pg_policies 
  WHERE tablename = 'audit_log' AND permissive = 'PERMISSIVE';
"
# 预期: 只有 INSERT 的 PERMISSIVE 策略，UPDATE/DELETE 都是 RESTRICTIVE
```

### 5. 业务逻辑正确性验证

对照 `ARCHITECTURE.md` 的"支付Gate核心流程"：

```
用户申请支付
  → [创建 payment, status=PENDING]          ← 验证: payments 表有记录
  → validate_payment 验证5个条件            ← 验证: T02 场景A已覆盖
  → [全过] → 等待审批                       ← 验证: status=PENDING_APPROVAL
  → reviewer 调用 approve_payment           ← 验证: T02 场景A已覆盖
  → 再次 validate (二次确认)                ← 验证: approve_payment 内部调用 validate
  → status=APPROVED                         ← 验证: T02 场景A结果
  → 写入 audit_log（不可篡改）              ← 验证: T02 场景F + T03 场景5
```

逐项在 T02 测试报告中找到对应验证记录。

---

## 验收总结报告格式

```json
{
  "acceptance_report": {
    "project": "REDP Phase 0",
    "auditor": "reviewer_agent",
    "audit_date": "<ISO8601>",
    "phase": "Phase 0 - 数据脊柱 + 支付Gate"
  },
  
  "prerequisite_tasks": {
    "T01_system_health": "PASS|FAIL",
    "T02_payment_gate_e2e": "PASS|FAIL",
    "T03_security_rls": "PASS|FAIL",
    "T04_agent_orchestration": "PASS|FAIL",
    "T05_performance": "PASS|FAIL"
  },
  
  "independent_verification": {
    "payment_gate_reject": "PASS|FAIL",
    "rls_isolation": "PASS|FAIL",
    "audit_log_immutable": "PASS|FAIL"
  },
  
  "code_quality": {
    "jsdoc_complete": true,
    "no_any_types": true,
    "error_handling_complete": true,
    "api_response_format": true,
    "no_console_log": true,
    "no_sql_injection_risk": true
  },
  
  "security_audit": {
    "env_not_committed": true,
    "secrets_not_in_code": true,
    "audit_log_restrictive": true
  },
  
  "business_logic_completeness": {
    "payment_lifecycle_covered": true,
    "all_5_gate_conditions": true,
    "dual_validation_in_approve": true
  },
  
  "critical_issues": [],
  "warnings": [],
  
  "overall_verdict": "APPROVED|REJECTED",
  "verdict_reason": "<说明通过/拒绝的理由>",
  
  "next_steps": [
    "Phase 0 验收通过，可启动 Phase 1 规划",
    "建议在 Phase 1 前优化: <具体建议>"
  ]
}
```

---

## 验收判定规则

### 自动通过条件（全部满足）
- T01-T05 的 overall_status 均为 PASS
- 独立验证的3个场景全部 PASS
- 代码质量检查项全部满足
- 安全审计无严重发现
- 无 critical_issues

### 有条件通过（可以通过，但需记录）
- T05 性能有 Warning（P95 超标但未超 P99）
- 代码有轻微格式问题（非安全问题）

### 必须拒绝的条件（任一触发则 REJECTED）
- T02 支付Gate逻辑有任何失败
- T03 任何🔴关键安全场景失败
- T01 系统缺少关键组件（表/角色/策略）
- 独立验证发现 T02/T03 报告不真实
- 发现 service_role key 在代码中硬编码

---

## 交付物

1. **验收报告**: `.logs/tests/PHASE0_ACCEPTANCE_REPORT.json`
2. **工作日志**: `.logs/detailed/task-phase0-T06.json`
3. **更新 CHANGELOG**: 在 `.logs/CHANGELOG.md` 追加 Phase 0 验收结果
4. **Git Commit**: `docs(acceptance): phase0 acceptance report - [APPROVED|REJECTED] [task-phase0-T06]`

---

## 验收通过后的后续动作

审核Agent在报告中注明以下内容，由 Zack 确认后执行：

```bash
# 在 master 分支打 tag
git tag -a v0.2.0-phase0-accepted -m "Phase 0 accepted by reviewer_agent on <date>"

# 更新 CHANGELOG
# 追加: ## [Phase 0 ACCEPTED] <date>

# 通知 Zack: Phase 1 可以开始规划
```
