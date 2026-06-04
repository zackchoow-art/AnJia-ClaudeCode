# REDP Phase 0 - 测试规范

**核心原则**: 没有测试的代码不能合并!测试Agent严格执行。

---

## 🧪 测试金字塔

```
        ┌──────────┐
        │  E2E (5%) │  ← 端到端,真实环境
        └────┬──────┘
             │
        ┌────┴────────┐
        │  集成 (25%)  │  ← Edge Functions + Supabase
        └────┬────────┘
             │
        ┌────┴───────────┐
        │   单元 (70%)    │  ← 纯函数,业务逻辑
        └────────────────┘
```

---

## 1️⃣ 单元测试

### 框架: Deno Testing
```typescript
import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.208.0/testing/bdd.ts";

describe("validatePaymentLogic", () => {
  it("should approve when all 5 conditions met", async () => {
    const result = await validatePayment("test-id");
    assertEquals(result.status, "APPROVED");
  });

  it("should reject when contract not signed", async () => {
    // mock合同未签署的情况
    const result = await validatePayment("test-id-2");
    assertEquals(result.status, "REJECTED");
    assertEquals(result.rejection_reasons.length > 0, true);
  });
});
```

### 覆盖率要求
- **整体**: ≥ 90%
- **关键业务逻辑**: 100%
- **错误处理路径**: ≥ 80%
- **边缘情况**: ≥ 80%

### 必须测试的内容
- ✅ Happy path(正常路径)
- ✅ 输入验证(空、null、错误类型)
- ✅ 边缘情况(0、最大值、负数)
- ✅ 错误处理(数据库错误、网络错误)
- ✅ 幂等性(同一请求多次执行)
- ✅ 并发安全(race condition)

---

## 2️⃣ 集成测试

### 测试Edge Function + Supabase

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

describe("validate_payment integration", () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  beforeEach(async () => {
    // 重置测试数据
    await supabase.rpc('reset_test_data');
  });

  it("should validate real payment from seed data", async () => {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/validate_payment`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_id: 'p1111111-1111-1111-1111-111111111111' })
      }
    );
    
    const result = await response.json();
    assertEquals(result.success, true);
    assertEquals(result.data.status, "REJECTED");  // seed data故意有缺失
  });
});
```

### 必须测试的集成场景
- ✅ Function → Database 读写
- ✅ Function → Function 调用(approve_payment调用validate)
- ✅ RLS策略实际生效
- ✅ 触发器实际触发
- ✅ 事务回滚

---

## 3️⃣ 端到端测试(E2E)

### 完整业务流程
```typescript
describe("E2E: Payment Approval Flow", () => {
  it("should complete full payment lifecycle", async () => {
    // 1. 创建项目
    const project = await createProject({...});
    
    // 2. 创建合同
    const contract = await createContract({...});
    
    // 3. 完成里程碑
    await completeMilestone({...});
    
    // 4. 上传文件
    await uploadInvoice({...});
    
    // 5. 完成税金计划
    await completeTaxPlanning({...});
    
    // 6. 创建支付申请
    const payment = await createPayment({...});
    
    // 7. 调用validate
    const validateResult = await validatePayment(payment.id);
    assertEquals(validateResult.status, "APPROVED");
    
    // 8. 调用approve
    const approveResult = await approvePayment(payment.id, reviewerId);
    assertEquals(approveResult.success, true);
    
    // 9. 验证audit_log
    const logs = await getAuditLogs('payment', payment.id);
    assertEquals(logs.length >= 2, true);  // CREATE + APPROVED
  });
});
```

---

## 4️⃣ RLS测试(必须!)

确保安全策略实际生效:

```typescript
describe("RLS: Sales Team Isolation", () => {
  it("sales team CANNOT see other sales' customers", async () => {
    // 模拟销售A登录
    await supabase.rpc('set_current_user', { user_id: 'sales-A-uuid' });
    
    const { data } = await supabase
      .from('customers')
      .select('*');
    
    // 应该只看到自己的客户
    assertEquals(data.every(c => c.sales_agent_id === 'sales-A-uuid'), true);
  });

  it("sales team CANNOT access payments AT ALL", async () => {
    await supabase.rpc('set_current_user', { user_id: 'sales-A-uuid' });
    
    const { data, error } = await supabase
      .from('payments')
      .select('*');
    
    // RLS会让查询返回空,而不是报错
    assertEquals(data, []);  // 或 error.code === 'PGRST301'
  });

  it("audit_log CANNOT be updated by anyone", async () => {
    const { error } = await supabase
      .from('audit_log')
      .update({ action: 'TAMPERED' })
      .eq('id', 'some-id');
    
    // 必须报错
    assertEquals(error !== null, true);
  });
});
```

---

## 5️⃣ 性能测试

### 工具: hey 或 k6

```bash
# 安装 hey (HTTP load tester)
go install github.com/rakyll/hey@latest

# 50并发,200个请求
hey -n 200 -c 50 \
  -m POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "p1111111-1111-1111-1111-111111111111"}' \
  "$SUPABASE_URL/functions/v1/validate_payment"
```

### 性能目标
| 指标 | 目标 |
|------|------|
| P50延迟 | < 200ms |
| P95延迟 | < 500ms |
| P99延迟 | < 1000ms |
| 错误率 | < 0.1% |
| 吞吐量 | > 100 RPS |

---

## 6️⃣ 安全测试

### 必须测试的安全场景
- ✅ SQL注入(用恶意payload测试每个endpoint)
- ✅ XSS(在文本字段中插入`<script>`)
- ✅ 权限绕过(用错误的JWT尝试访问)
- ✅ 越权(角色A尝试访问角色B的数据)
- ✅ 敏感数据泄露(检查日志和错误消息)

```typescript
describe("Security: Injection Attempts", () => {
  it("should resist SQL injection in payment_id", async () => {
    const malicious = "'; DROP TABLE payments; --";
    const response = await callValidate(malicious);
    
    // 应该返回错误,而不是执行恶意SQL
    assertEquals(response.success, false);
    
    // 表应该还在
    const tableCheck = await checkTableExists('payments');
    assertEquals(tableCheck, true);
  });
});
```

---

## 📊 测试报告格式

测试Agent生成的报告:

```json
{
  "test_run_id": "test-2025-06-02-001",
  "executed_at": "2025-06-02T15:00:00Z",
  "executed_by": "tester_agent",
  
  "summary": {
    "total_tests": 87,
    "passed": 85,
    "failed": 2,
    "skipped": 0,
    "duration_seconds": 142,
    "coverage_percentage": 93.5
  },
  
  "by_category": {
    "unit": { "total": 60, "passed": 60 },
    "integration": { "total": 20, "passed": 19, "failed": 1 },
    "e2e": { "total": 5, "passed": 5 },
    "rls": { "total": 10, "passed": 10 },
    "security": { "total": 8, "passed": 7, "failed": 1 }
  },
  
  "failed_tests": [
    {
      "name": "validate_payment: concurrent requests",
      "file": "validate_payment/index.test.ts",
      "line": 145,
      "error": "Expected approved but got pending",
      "severity": "medium"
    }
  ],
  
  "performance": {
    "validate_payment": {
      "p50_ms": 127,
      "p95_ms": 245,
      "p99_ms": 489
    }
  },
  
  "recommendations": [
    "Add retry logic for concurrent requests",
    "Improve error handling in approve_payment"
  ]
}
```

---

## 🚀 运行测试

### 本地运行
```bash
# 单元测试
deno test --allow-net --allow-env supabase/functions/

# 特定function
deno test --allow-net --allow-env supabase/functions/validate_payment/

# 带覆盖率
deno test --coverage=coverage --allow-net --allow-env

# 查看覆盖率
deno coverage coverage --lcov > coverage.lcov
```

### CI运行
应该集成到Git workflow:
1. pre-commit: 快速单元测试
2. pre-push: 集成测试
3. merge前: 完整测试套件(由测试Agent执行)

---

## ✅ 任务completion criteria

测试Agent必须在工作日志中追加:
```json
{
  "test_results": {
    "all_tests_passed": true,
    "coverage_percentage": 93.5,
    "performance_acceptable": true,
    "security_checks_passed": true,
    "test_report_file": ".logs/tests/test-2025-06-02-001.json"
  }
}
```

只有这个`all_tests_passed=true`时,审核Agent才会考虑通过审核。
