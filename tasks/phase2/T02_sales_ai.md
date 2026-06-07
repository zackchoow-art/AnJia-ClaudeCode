# T02 — 销售AI助手

**任务ID**: task-phase2-T02  
**执行Agent**: 全栈资深Agent (`qwen/qwen3-coder-480b-a35b-instruct`) + 数据分析Agent (`nvidia/nemotron-3-nano-30b-a3b`)  
**估时**: 20小时（资深全栈16h + 数据分析4h）  
**依赖**: T01（房源库存）+ T03（CRM增强）  
**分支**: `feature/phase2-T02-sales-ai`  
**优先级**: 🟡 Medium

---

## 任务目标

实现两个AI能力：
1. **房源推荐引擎**: 根据客户预算、偏好、家庭情况推荐最合适的房源
2. **销售辅助对话**: 帮助销售人员回答客户常见问题（政策、合同条款、付款方式等）

---

## 执行边界

### 允许的操作
- 新建 `supabase/functions/sales_ai_recommend/index.ts`（房源推荐）
- 新建 `supabase/functions/sales_ai_qa/index.ts`（问答辅助）
- 新建 `supabase/migrations/009_phase2_ai_sales.sql`（推荐记录、QA历史）
- 调用 Nvidia NIM API 进行推荐和对话

### 禁止的操作
- 不得存储客户完整对话记录（隐私合规）
- 不得让 AI 代替销售承诺具体价格（只能提供参考）
- 不得让 AI 绕过支付Gate审批

---

## 数据库设计

```sql
-- supabase/migrations/009_phase2_ai_sales.sql

-- 推荐记录
CREATE TABLE property_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_agent_id TEXT NOT NULL,
  
  -- 推荐输入
  customer_budget_min NUMERIC(15,2),
  customer_budget_max NUMERIC(15,2),
  customer_preferences JSONB,  -- 从 customers 表读取
  
  -- 推荐结果
  recommended_property_ids UUID[] NOT NULL,
  recommendation_scores JSONB,  -- [{"property_id": "...", "score": 0.95, "reasons": [...]}]
  
  ai_model TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QA记录（脱敏，不存原始问题文本）
CREATE TABLE sales_qa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_agent_id TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_count INTEGER DEFAULT 0,
  categories JSONB DEFAULT '[]',  -- ["付款方式", "合同条款", "政策"]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE property_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_qa_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY recommendations_sales_own ON property_recommendations
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true));

CREATE POLICY qa_sessions_sales_own ON sales_qa_sessions
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true));
```

---

## 推荐引擎设计

### AI Prompt 模板

```
你是一位专业的房产销售顾问，请根据客户情况推荐最合适的房源。

客户信息：
- 预算范围：{budget_min} 至 {budget_max} 万元
- 偏好户型：{interested_property_type}
- 家庭情况：从 notes 字段推断
- 客户类型：{customer_type}

可用房源：
{available_properties_json}

请按适合度排序，给出TOP3推荐，对每套房源说明推荐理由（不超过100字）。
格式：JSON数组，包含 property_id、score(0-1)、reasons(字符串数组)。
```

### QA设计原则

- 只回答政策性、流程性问题（付款方式、合同流程、产权办理）
- 价格相关问题：回答"请以合同为准，销售顾问可为您提供具体报价"
- 不回答竞品比较问题
- 所有回答标注"仅供参考，以实际合同条款为准"

---

## 验收标准

| 检查项 | 标准 | 必须 |
|--------|------|------|
| 推荐结果包含理由 | reasons 数组非空 | 必须 |
| 推荐尊重预算上限 | 不推荐超预算房源 | 必须 |
| QA有免责声明 | 每条回答包含"仅供参考" | 必须 |
| QA不回答竞品问题 | 测试用例验证 | 必须 |
| 推荐记录存入DB | property_recommendations 有记录 | 必须 |
| 单元测试 | ≥ 85%（AI调用mock） | 必须 |

---

## 交付物

1. `supabase/functions/sales_ai_recommend/index.ts` + test
2. `supabase/functions/sales_ai_qa/index.ts` + test
3. `supabase/migrations/009_phase2_ai_sales.sql`
4. `.logs/tests/task-phase2-T02-analysis.json`（数据分析Agent）
5. `.logs/detailed/task-phase2-T02.json`
6. **Git Commit**: `feat(phase2): implement sales ai recommendation and qa assistant [task-phase2-T02]`
