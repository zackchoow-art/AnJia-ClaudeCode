# T01 — 系统完整性验证

**任务ID**: task-phase0-T01  
**执行Agent**: 测试Agent (`nvidia/nemotron-3-super-120b-a12b`)  
**估时**: 2小时  
**依赖**: 无（Phase 0 第一个任务）  
**分支**: `verify/phase0-T01-system-check`  
**优先级**: 🔴 Critical

---

## 任务目标

对已部署的所有 Phase 0 组件进行逐项验证，出具完整的系统健康报告。不写新代码，只验证已有部署。

---

## 执行边界

### 允许的操作
- 执行 `SELECT` 查询验证表结构
- 执行 `psql` 命令连接数据库
- 发送 HTTP 请求到 Edge Functions
- 读取 `.logs/` 目录下的文件
- 向 `.logs/tests/` 写入测试报告

### 禁止的操作
- 不得修改任何数据库表结构
- 不得更改任何 Edge Function 代码
- 不得修改 RLS 策略
- 不得在生产数据中写入非测试数据（seed data 除外）

---

## 执行步骤

### Step 1: 数据库连接与表验证

```bash
# 加载环境变量
export $(grep -v '^#' .env | xargs)

# 1.1 验证表数量（应 ≥ 12）
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT COUNT(*) AS table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public';
"

# 1.2 列出所有表（对照预期清单）
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name;
"
```

**预期表清单**:
`approval_gates`, `audit_log`, `contracts`, `cost_budget`, `cost_ledger`, `customers`, `payment_rules`, `payments`, `projects`, `schema_version`, `task_locks`, `work_logs`

### Step 2: 角色与RLS策略验证

```bash
# 2.1 验证6个自定义角色存在
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT rolname FROM pg_roles 
  WHERE rolname IN ('sales_team','project_manager','finance','reviewer','system_agent','super_admin')
  ORDER BY rolname;
"

# 2.2 验证RLS策略数量（应 ≥ 20）
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT COUNT(*) AS policy_count 
  FROM pg_policies WHERE schemaname = 'public';
"

# 2.3 验证audit_log有RESTRICTIVE策略
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT policyname, cmd, qual 
  FROM pg_policies 
  WHERE tablename = 'audit_log' AND schemaname = 'public';
"
```

### Step 3: 种子数据验证

```bash
# 3.1 验证测试数据存在
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT 
    (SELECT COUNT(*) FROM projects) AS projects,
    (SELECT COUNT(*) FROM customers) AS customers,
    (SELECT COUNT(*) FROM contracts) AS contracts,
    (SELECT COUNT(*) FROM payments) AS payments;
"
```

**预期**: projects=1, customers=2, contracts=1, payments=1

### Step 4: Edge Functions健康检查

```bash
# 4.1 validate_payment
curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "f1111111-1111-1111-1111-111111111111"}'

# 4.2 audit_log
curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/audit_log" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"entity_type":"system","entity_id":"00000000-0000-0000-0000-000000000000","action":"TEST","actor_type":"SYSTEM","actor_id":"health-check","reason":"T01 health check"}'

# 4.3 create_task_lock
curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/create_task_lock" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"task_id":"00000000-0000-0000-0000-000000000099","agent_id":"health-check","table_names":["schema_version"],"lock_hours":1,"lock_reason":"T01 health check"}'
```

**预期**: HTTP 200, `"success": true`

### Step 5: Git Hooks验证

```bash
# 5.1 检查hooks是否可执行
ls -la .git/hooks/pre-commit .git/hooks/post-commit

# 5.2 检查shebang
head -1 .git/hooks/pre-commit
head -1 .git/hooks/post-commit
```

**预期**: 两个文件都是 `-rwxr-xr-x`，shebang 为 `#!/bin/bash`

### Step 6: Worktree脚本验证

```bash
# 6.1 检查脚本可执行性
ls -la scripts/*.sh

# 6.2 验证create_worktree.sh语法
bash -n scripts/create_worktree.sh && echo "syntax OK"
bash -n scripts/merge_worktree.sh && echo "syntax OK"
bash -n scripts/cleanup_locks.sh && echo "syntax OK"
```

---

## 验收标准

以下所有条件必须同时满足，任务才算通过：

| 检查项 | 标准 | 必须/建议 |
|--------|------|---------|
| 数据库表数量 | ≥ 12 张 | 必须 |
| 预期表全部存在 | 12/12 | 必须 |
| 数据库角色 | 6/6 个存在 | 必须 |
| RLS策略数量 | ≥ 20 条 | 必须 |
| audit_log RESTRICTIVE策略 | 存在 UPDATE+DELETE 限制 | 必须 |
| 种子数据 | projects=1, customers=2, contracts=1, payments=1 | 必须 |
| validate_payment HTTP | 200 + success:true | 必须 |
| audit_log HTTP | 200 + success:true | 必须 |
| create_task_lock HTTP | 200 + success:true | 必须 |
| Git hooks可执行 | 两个都是 executable | 必须 |
| 脚本语法 | 三个脚本语法无误 | 必须 |

---

## 交付物

1. **测试报告**: `.logs/tests/task-phase0-T01-report.json`
2. **工作日志**: `.logs/detailed/task-phase0-T01.json`
3. **Git Commit**: `test(system): verify phase0 deployment health [task-phase0-T01]`

### 测试报告格式

```json
{
  "task_id": "task-phase0-T01",
  "executed_at": "<ISO8601时间>",
  "executed_by": "tester_agent",
  "overall_status": "PASS|FAIL",
  "checks": {
    "table_count": { "expected": 12, "actual": <n>, "status": "PASS|FAIL" },
    "roles": { "expected": 6, "actual": <n>, "status": "PASS|FAIL" },
    "rls_policies": { "expected_min": 20, "actual": <n>, "status": "PASS|FAIL" },
    "audit_log_immutable": { "status": "PASS|FAIL" },
    "seed_data": { "status": "PASS|FAIL" },
    "edge_functions": {
      "validate_payment": { "http_status": <n>, "status": "PASS|FAIL" },
      "audit_log": { "http_status": <n>, "status": "PASS|FAIL" },
      "create_task_lock": { "http_status": <n>, "status": "PASS|FAIL" }
    },
    "git_hooks": { "status": "PASS|FAIL" },
    "scripts": { "status": "PASS|FAIL" }
  },
  "failures": [],
  "notes": ""
}
```

---

## 失败处理

| 失败场景 | 处理方式 |
|---------|---------|
| 表数量不足 | 查看 `supabase/migrations/001_initial_schema.sql`，重新执行缺失的migration |
| Edge Function 返回 500 | 查看 Supabase Dashboard > Edge Functions > Logs |
| RLS策略缺失 | 重新执行 `supabase/migrations/002_rls_policies.sql` |
| Git hooks无执行权限 | `chmod +x .git/hooks/pre-commit .git/hooks/post-commit` |

T01失败时，**不得启动T02-T05**，必须先修复所有问题再重跑T01。
