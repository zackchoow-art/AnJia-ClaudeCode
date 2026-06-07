# T01 — AI合同审查模块

**任务ID**: task-phase1-T01  
**执行Agent**: 全栈资深Agent (`qwen/qwen3-coder-480b-a35b-instruct`) + 数据分析Agent (`nvidia/nemotron-3-nano-30b-a3b`)  
**估时**: 16小时（资深全栈12h + 数据分析4h）  
**依赖**: Phase 0 验收通过  
**分支**: `feature/phase1-T01-ai-contract-review`  
**优先级**: 🔴 High

---

## 任务目标

实现一个 Edge Function，接受合同文本（或合同ID），调用 Nvidia NIM API 进行 AI 分析，识别关键风险条款并返回结构化的审查报告。结果存入数据库供后续查阅。

---

## 执行边界

### 允许的操作
- 新建 `supabase/functions/ai_contract_review/index.ts`
- 新建迁移文件 `supabase/migrations/004_phase1_contract_review.sql`（新增 `contract_reviews` 表）
- 修改 `contracts` 表仅新增列（不修改现有列）
- 调用 Nvidia NIM API（模型: `qwen/qwen3-coder-480b-a35b-instruct`，温度 0.1）

### 禁止的操作
- 不得修改 Phase 0 的 `contracts` 表现有字段
- 不得修改已有的 4 个 Edge Functions
- 不得引入外部 AI 服务（仅 Nvidia NIM）
- 不得存储完整合同文本到数据库（隐私考虑，存摘要和分析结果）

---

## 数据库设计

### 新增表: contract_reviews

```sql
-- supabase/migrations/004_phase1_contract_review.sql

CREATE TABLE contract_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL CHECK (review_type IN ('AUTO_AI', 'MANUAL', 'HYBRID')),
  reviewed_by TEXT NOT NULL,       -- AI model name 或 user_id
  
  -- AI分析结果
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  risk_score NUMERIC(3,1) CHECK (risk_score >= 0 AND risk_score <= 10),
  
  -- 关键发现（JSONB结构化）
  key_findings JSONB NOT NULL DEFAULT '[]',
  /*
  [
    {
      "type": "PAYMENT_TERM|PENALTY|LIABILITY|TERMINATION|AMBIGUITY",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "clause_reference": "第X条",
      "description": "发现的问题描述",
      "recommendation": "建议处理方式"
    }
  ]
  */
  
  -- AI生成的摘要
  executive_summary TEXT,
  
  -- 原始AI响应（用于追溯）
  ai_model TEXT,
  ai_response_tokens INTEGER,
  
  -- 状态
  review_status TEXT NOT NULL DEFAULT 'PENDING' 
    CHECK (review_status IN ('PENDING', 'COMPLETED', 'FAILED')),
  
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 在 contracts 表新增引用列（不改现有列）
ALTER TABLE contracts 
  ADD COLUMN IF NOT EXISTS latest_review_id UUID REFERENCES contract_reviews(id);

-- RLS
ALTER TABLE contract_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY contract_reviews_pm_read ON contract_reviews
  FOR SELECT TO project_manager USING (true);

CREATE POLICY contract_reviews_finance_read ON contract_reviews
  FOR SELECT TO finance USING (true);

CREATE POLICY contract_reviews_reviewer_all ON contract_reviews
  FOR ALL TO reviewer USING (true);

CREATE POLICY contract_reviews_agent_insert ON contract_reviews
  FOR INSERT TO system_agent WITH CHECK (true);

-- 索引
CREATE INDEX idx_contract_reviews_contract ON contract_reviews(contract_id);
CREATE INDEX idx_contract_reviews_risk ON contract_reviews(risk_level, risk_score DESC);
```

---

## Edge Function 实现

### 文件: `supabase/functions/ai_contract_review/index.ts`

**输入**:
```typescript
interface ReviewRequest {
  contract_id: string;    // 合同UUID
  contract_text?: string; // 可选：直接传入合同文本（否则从DB读取key_terms_json）
  review_type?: 'AUTO_AI' | 'MANUAL' | 'HYBRID'; // 默认 AUTO_AI
}
```

**业务逻辑**:
1. 验证 `contract_id` 格式和存在性
2. 从 `contracts` 表读取 `key_terms_json` 和 `payment_milestones`
3. 构建 AI 审查 Prompt（见下方 Prompt 模板）
4. 调用 Nvidia NIM API: `qwen/qwen3-coder-480b-a35b-instruct`
5. 解析 AI 响应，提取 key_findings 和 executive_summary
6. 保存到 `contract_reviews` 表
7. 更新 `contracts.latest_review_id`
8. 写入 audit_log（action: REVIEWED）

**AI Prompt 模板**:
```
你是一位专业的中国房地产合同法律顾问，请审查以下合同信息并识别风险。

合同类型: {contract_type}
合同金额: {total_amount} {currency}
关键条款: {key_terms_json}
支付里程碑: {payment_milestones}

请按以下JSON格式输出审查结果：
{
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "risk_score": 0-10,
  "key_findings": [
    {
      "type": "PAYMENT_TERM|PENALTY|LIABILITY|TERMINATION|AMBIGUITY",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "clause_reference": "第X条或相关条款",
      "description": "风险描述",
      "recommendation": "建议"
    }
  ],
  "executive_summary": "总体评估（200字以内）"
}
```

**输出**:
```typescript
interface ReviewResponse {
  success: boolean;
  data?: {
    review_id: string;
    contract_id: string;
    risk_level: string;
    risk_score: number;
    key_findings: Finding[];
    executive_summary: string;
  };
  error?: ApiError;
  timestamp: string;
}
```

---

## 数据分析Agent的职责

数据分析Agent在全栈资深Agent完成实现后执行：

1. **验证AI输出质量**: 对3个不同风险等级的合同样本进行测试，评估 AI 输出的结构化程度
2. **风险分布分析**: 检查 `key_findings` 的类型分布是否合理
3. **生成测试报告**: 记录到 `.logs/tests/task-phase1-T01-analysis.json`

```bash
# 数据分析Agent使用种子数据中的合同进行测试
curl -X POST "$SUPABASE_URL/functions/v1/ai_contract_review" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contract_id": "c1111111-1111-1111-1111-111111111111"}'

# 验证结果存入了数据库
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT risk_level, risk_score, jsonb_array_length(key_findings) AS findings_count
  FROM contract_reviews
  ORDER BY created_at DESC LIMIT 5;
"
```

---

## 验收标准

| 检查项 | 标准 | 必须/建议 |
|--------|------|---------|
| contract_reviews 表创建成功 | ≥1 条记录可写入 | 必须 |
| Edge Function 部署成功 | HTTP 200 | 必须 |
| AI 输出结构化 | key_findings 是有效 JSON 数组 | 必须 |
| risk_level 字段有值 | LOW/MEDIUM/HIGH/CRITICAL 之一 | 必须 |
| audit_log 记录了 REVIEWED 事件 | ≥1 条 | 必须 |
| AI 延迟 | P95 < 10s（AI推理较慢，放宽标准） | 建议 |
| 单元测试覆盖率 | ≥ 85%（AI调用部分 mock） | 必须 |
| 审查报告对3个样本合同有效 | 无 FAILED 状态 | 必须 |

---

## 交付物

1. `supabase/functions/ai_contract_review/index.ts`
2. `supabase/functions/ai_contract_review/index.test.ts`
3. `supabase/functions/ai_contract_review/deno.json`
4. `supabase/migrations/004_phase1_contract_review.sql`
5. `.logs/tests/task-phase1-T01-analysis.json`（数据分析Agent提供）
6. `.logs/detailed/task-phase1-T01.json`（工作日志）
7. **Git Commit**: `feat(phase1): implement ai contract review edge function [task-phase1-T01]`
