# T05 — 性能基准测试

**任务ID**: task-phase0-T05  
**执行Agent**: 测试Agent (`nvidia/nemotron-3-super-120b-a12b`)  
**估时**: 2小时  
**依赖**: T02（支付Gate端到端测试通过）  
**分支**: `test/phase0-T05-performance`  
**优先级**: 🟡 High

---

## 任务目标

对所有4个 Edge Functions 进行负载测试，确认在合理并发下满足性能目标。同时验证数据库核心查询路径的响应时间。

---

## 执行边界

### 允许的操作
- 使用 `hey`、`curl` 或 `ab` 工具进行负载测试
- 使用 seed data 的支付ID进行重复测试（validate_payment 是幂等的）
- 记录测试结果到 `.logs/tests/`

### 禁止的操作
- 不得发送超过 40 RPM 的 Nvidia API 请求（避免触发 rate limit）
- 不得在生产数据库上执行大批量写入测试
- 不得修改任何 Function 或数据库配置

---

## 性能目标

| 指标 | 目标值 | 测试工具 |
|------|--------|---------|
| P50 响应时间 | < 200ms | hey |
| P95 响应时间 | < 500ms | hey |
| P99 响应时间 | < 1000ms | hey |
| 错误率 | < 1% | hey |
| 并发支持 | ≥ 10 concurrent | hey |

---

## 测试步骤

### Step 1: 安装测试工具

```bash
# 检查是否有 hey
which hey || go install github.com/rakyll/hey@latest

# 备选: 使用 ab (apache benchmark)
which ab || apt install apache2-utils

# 备选: 使用 wrk
which wrk || apt install wrk
```

### Step 2: validate_payment 负载测试

```bash
# 2.1 预热（5个请求，确认连通）
for i in {1..5}; do
  curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" \
    -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"payment_id": "f1111111-1111-1111-1111-111111111111"}'
done

# 2.2 负载测试（50请求，10并发）
hey -n 50 -c 10 \
  -m POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "f1111111-1111-1111-1111-111111111111"}' \
  "$SUPABASE_URL/functions/v1/validate_payment" \
  2>&1 | tee .logs/tests/perf-validate-payment.txt
```

**注意**: 50请求 / 10并发，持续约5-10秒，不会超过Supabase免费额度。

### Step 3: audit_log 负载测试

```bash
# 注意：audit_log 会写入数据，使用较少请求
hey -n 20 -c 5 \
  -m POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"entity_type":"perf_test","entity_id":"00000000-0000-0000-0000-000000000000","action":"TEST","actor_type":"SYSTEM","actor_id":"perf-tester","reason":"T05 performance test"}' \
  "$SUPABASE_URL/functions/v1/audit_log" \
  2>&1 | tee .logs/tests/perf-audit-log.txt
```

### Step 4: 数据库查询性能

```bash
# 4.1 customers 表按 sales_agent_id 过滤（RLS核心查询）
psql "$SUPABASE_CONNECTION_STRING" -c "
  EXPLAIN ANALYZE 
  SELECT * FROM customers 
  WHERE sales_agent_id = 's1111111-1111-1111-1111-111111111111';
"

# 4.2 payments 按状态过滤
psql "$SUPABASE_CONNECTION_STRING" -c "
  EXPLAIN ANALYZE 
  SELECT * FROM payments WHERE payment_status = 'PENDING';
"

# 4.3 audit_log 按实体查询
psql "$SUPABASE_CONNECTION_STRING" -c "
  EXPLAIN ANALYZE 
  SELECT * FROM audit_log 
  WHERE entity_type = 'payment' AND entity_id = 'f1111111-1111-1111-1111-111111111111'
  ORDER BY timestamp DESC LIMIT 10;
"
```

**预期**: 所有查询使用索引（`Index Scan` 或 `Bitmap Index Scan`），不出现 `Seq Scan` on 大表。

### Step 5: 结果汇总

从 `hey` 输出中提取关键指标：

```bash
# 解析 hey 的输出，提取 P50/P95/P99
grep -E "50% in|95% in|99% in|Requests/sec|Error distribution" \
  .logs/tests/perf-validate-payment.txt
```

---

## 验收标准

| Function | P50 | P95 | P99 | 错误率 | 通过标准 |
|---------|-----|-----|-----|--------|---------|
| validate_payment | <200ms | <500ms | <1000ms | <1% | 必须全达标 |
| audit_log | <300ms | <600ms | <1200ms | <1% | 必须全达标 |
| 数据库查询 | 使用索引 | - | - | - | 必须使用索引 |

**如果某项超标**:
- P50超标：可能是 Function 冷启动，重跑一次排除
- P95超标：记录为 Warning，不阻塞验收，但需记录到报告
- P99超标：记录为 Critical Warning，需在 Phase 1 前优化
- 错误率超标：阻塞验收，必须找根因

---

## 交付物

1. **性能报告**: `.logs/tests/task-phase0-T05-perf-report.json`
2. **原始数据**: `.logs/tests/perf-*.txt`（hey的原始输出）
3. **工作日志**: `.logs/detailed/task-phase0-T05.json`
4. **Git Commit**: `test(performance): baseline benchmark for edge functions [task-phase0-T05]`

### 性能报告格式

```json
{
  "task_id": "task-phase0-T05",
  "executed_at": "<ISO8601>",
  "executed_by": "tester_agent",
  "overall_status": "PASS|FAIL",
  "results": {
    "validate_payment": {
      "requests_sent": 50,
      "concurrency": 10,
      "p50_ms": <n>,
      "p95_ms": <n>,
      "p99_ms": <n>,
      "error_rate_pct": <n>,
      "status": "PASS|FAIL|WARNING"
    },
    "audit_log": {
      "requests_sent": 20,
      "concurrency": 5,
      "p50_ms": <n>,
      "p95_ms": <n>,
      "p99_ms": <n>,
      "error_rate_pct": <n>,
      "status": "PASS|FAIL|WARNING"
    },
    "db_queries": {
      "customers_by_agent": { "uses_index": true, "plan_ms": <n> },
      "payments_by_status": { "uses_index": true, "plan_ms": <n> },
      "audit_log_by_entity": { "uses_index": true, "plan_ms": <n> }
    }
  },
  "warnings": [],
  "recommendations": []
}
```
