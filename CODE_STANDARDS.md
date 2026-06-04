# REDP Phase 0 - 代码规范

所有Agent生成的代码必须遵守本规范。审核Agent会严格检查。

---

## 📐 SQL 规范

### 命名
- 表名: `snake_case` 复数 (`customers`, `payment_rules`)
- 列名: `snake_case` (`created_at`, `payment_status`)
- 索引: `idx_<table>_<columns>` (`idx_customers_sales_agent`)
- 约束: `<table>_<purpose>_check` (`payments_amount_check`)
- 触发器: `<table>_<event>_trigger`

### 必需字段(所有业务表)
```sql
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 业务字段...
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### CHECK约束规则
- 金额: `CHECK (amount > 0)`
- 百分比: `CHECK (pct >= 0 AND pct <= 100)`
- 状态枚举: `CHECK (status IN ('A', 'B', 'C'))`

### 外键策略
```sql
-- 级联删除(子记录跟随父记录)
project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE

-- 限制删除(防止误删父记录)
contract_id UUID REFERENCES contracts(id) ON DELETE RESTRICT

-- 设置NULL(可选关联)
customer_id UUID REFERENCES customers(id) ON DELETE SET NULL
```

### 时间戳
- 永远用`TIMESTAMP`(不要`DATETIME`)
- 永远用UTC(`CURRENT_TIMESTAMP`)
- 字段后缀`_at`(`created_at`,`signed_at`)

### 注释
```sql
-- 表级注释(必须)
COMMENT ON TABLE customers IS '客户数据,通过sales_agent_id实现RLS隔离';

-- 关键字段注释
COMMENT ON COLUMN customers.commitments_made IS 
  '销售对客户的所有承诺,JSON结构: [{date, content, made_by}]';
```

---

## 📜 TypeScript 规范(Edge Functions)

### 文件结构
```typescript
// 1. Imports
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { ValidationError, errorResponse, successResponse } from "../_shared/errors.ts";
import type { Payment, ApprovalResult } from "../_shared/types.ts";

// 2. 常量
const VALIDATION_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/validate_payment`;

// 3. 业务逻辑函数(纯函数,可测试)
async function approvePayment(request: ApprovalRequest): Promise<ApprovalResult> {
  // ...
}

// 4. HTTP Handler
serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    const body = await req.json();
    const result = await businessLogic(body);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
```

### 类型定义(必须)
```typescript
// ❌ 不要这样
function process(data: any) { ... }

// ✅ 应该这样
interface ProcessInput {
  payment_id: string;
  reviewer_id: string;
}

interface ProcessOutput {
  success: boolean;
  new_status: 'APPROVED' | 'REJECTED';
}

function process(data: ProcessInput): Promise<ProcessOutput> { ... }
```

### 错误处理
```typescript
// 使用自定义错误类
import { ValidationError, NotFoundError, AuthorizationError } from "../_shared/errors.ts";

async function validate(id: string) {
  if (!id) {
    throw new ValidationError('id is required');
  }
  
  const data = await fetchById(id);
  if (!data) {
    throw new NotFoundError('Resource', id);
  }
  
  return data;
}
```

### 返回值规范(ApiResponse)
```typescript
// 所有Edge Function必须返回这种格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}
```

### JSDoc注释
```typescript
/**
 * 验证支付前置条件
 * 
 * @param paymentId - 支付UUID
 * @returns 验证结果,包含5个检查项
 * @throws ValidationError 当payment_id为空
 * @throws NotFoundError 当payment不存在
 * 
 * @example
 * const result = await validatePayment('uuid-here');
 * if (result.status === 'APPROVED') { ... }
 */
async function validatePayment(paymentId: string): Promise<ValidationResult> {
  // ...
}
```

### 禁止事项
- ❌ 不要用`console.log`(用结构化日志)
- ❌ 不要硬编码magic numbers(用const)
- ❌ 不要用`any`类型
- ❌ 不要捕获错误后忽略
- ❌ 不要在Edge Function中存储状态(用数据库)

---

## 🔒 安全规范

### SQL注入防护
```typescript
// ❌ 危险!
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ 用Supabase客户端(自动参数化)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

### 敏感信息
- 永远不在日志中打印完整的:
  - API keys
  - 密码
  - JWT tokens
  - 身份证号
  - 银行账号
- 必要时脱敏: `13800138000` → `138****8000`

### 权限检查
- 每个Edge Function开始时验证用户身份
- 用RLS而不是应用层检查权限
- audit_log不依赖应用层(用触发器)

---

## 📝 Git Commit 规范

### Commit Message格式
```
<type>(<scope>): <subject> [<task-id>]

<body>

<footer>
```

### Type
- `feat`: 新功能
- `fix`: bug修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 工程

### 示例
```
feat(payments): implement validate_payment Edge Function [task-phase0-validate-001]

- Add 5-condition validation logic
- Integrate with cost_ledger and contracts
- Record validation result to audit_log

Closes #42
```

### 关键: task-id必须在方括号中
post-commit hook依赖这个格式提取task-id

---

## 🧪 测试规范要点

(详见 TESTING_SPEC.md)

- 单元测试覆盖率 ≥ 90%
- 所有Edge Functions都要有集成测试
- 关键业务路径要有端到端测试
- 性能测试: P95延迟 < 500ms

---

## 📚 文档规范

### 每个Edge Function目录都要有README.md
```markdown
# validate_payment

## 用途
验证支付前置条件

## API
- 方法: POST
- 路径: /functions/v1/validate_payment
- 请求: { "payment_id": "uuid" }
- 响应: { "success": true, "data": {...} }

## 依赖
- contracts表
- cost_ledger表
- projects表

## 测试
deno test --allow-net --allow-env
```

---

## ✅ 审核Agent的检查清单

提交代码前自查:
- [ ] 命名符合规范
- [ ] 所有函数有JSDoc注释
- [ ] 所有类型都有定义(无any)
- [ ] 错误处理完整
- [ ] 返回值遵循ApiResponse
- [ ] 没有泄露敏感信息
- [ ] 没有SQL注入风险
- [ ] 有对应的单元测试
- [ ] Commit message格式正确,含task-id
- [ ] 工作日志已生成
