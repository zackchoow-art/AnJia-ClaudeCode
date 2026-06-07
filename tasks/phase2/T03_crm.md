# T03 — 客户CRM增强

**任务ID**: task-phase2-T03  
**执行Agent**: 全栈标准Agent (`minimaxai/minimax-m2.7`)  
**估时**: 8小时  
**依赖**: Phase 1 验收通过  
**分支**: `feature/phase2-T03-crm`  
**优先级**: 🔴 High

---

## 任务目标

在 Phase 0 的 `customers` 表基础上，增强客户关系管理能力：跟进记录、意向评分、销售漏斗管理。

---

## 执行边界

### 允许的操作
- 修改 `customers` 表仅新增列
- 新建 `supabase/migrations/010_phase2_crm.sql`（新增 `customer_followups`、`customer_scores` 表）
- 新建 `supabase/functions/crm_management/index.ts`

### 禁止的操作
- 不得修改 `customers` 表现有字段
- 不得绕过 `sales_agent_id` 的 RLS 隔离

---

## 数据库设计

```sql
-- supabase/migrations/010_phase2_crm.sql

-- 跟进记录
CREATE TABLE customer_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_agent_id TEXT NOT NULL,
  
  followup_type TEXT NOT NULL 
    CHECK (followup_type IN ('CALL', 'VISIT', 'WECHAT', 'EMAIL', 'SITE_VISIT')),
  followup_content TEXT NOT NULL,  -- 跟进内容摘要
  customer_response TEXT,          -- 客户反馈
  next_action TEXT,                -- 下次跟进计划
  next_followup_date DATE,         -- 下次联系日期
  
  -- 意向变化
  intent_before TEXT,              -- 跟进前状态
  intent_after TEXT,               -- 跟进后状态
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 意向评分（由AI或销售人员评定）
CREATE TABLE customer_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_agent_id TEXT NOT NULL,
  
  intent_score INTEGER CHECK (intent_score BETWEEN 1 AND 10),
  -- 1-3: 低意向  4-6: 中意向  7-10: 高意向
  
  score_factors JSONB DEFAULT '{}',
  -- {"budget_match": 8, "urgency": 6, "decision_power": 7}
  
  scored_by TEXT NOT NULL,  -- 'SALES' | 'AI_SYSTEM'
  scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 在 customers 表新增列
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS interested_property_ids UUID[],  -- 感兴趣的房源
  ADD COLUMN IF NOT EXISTS latest_followup_date DATE,
  ADD COLUMN IF NOT EXISTS latest_intent_score INTEGER,
  ADD COLUMN IF NOT EXISTS funnel_stage TEXT DEFAULT 'INITIAL'
    CHECK (funnel_stage IN ('INITIAL', 'CONTACTED', 'INTERESTED', 'NEGOTIATING', 'DECISION', 'CLOSED_WON', 'CLOSED_LOST'));

-- RLS（严格的销售隔离）
ALTER TABLE customer_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY followups_sales_own ON customer_followups
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true))
  WITH CHECK (sales_agent_id = current_setting('app.current_user_id', true));

CREATE POLICY scores_sales_own ON customer_scores
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true));

CREATE POLICY followups_pm_all ON customer_followups FOR ALL TO project_manager USING (true);
CREATE POLICY scores_pm_all ON customer_scores FOR ALL TO project_manager USING (true);

-- 索引
CREATE INDEX idx_followups_customer ON customer_followups(customer_id, created_at DESC);
CREATE INDEX idx_followups_agent ON customer_followups(sales_agent_id);
CREATE INDEX idx_followups_next_date ON customer_followups(next_followup_date) 
  WHERE next_followup_date >= CURRENT_DATE;
```

---

## Edge Function 实现

### 文件: `supabase/functions/crm_management/index.ts`

支持的 action:

| action | 描述 |
|--------|------|
| `add_followup` | 添加跟进记录，自动更新 `customers.latest_followup_date` |
| `list_followups` | 列出客户跟进历史 |
| `get_today_tasks` | 获取今天需要跟进的客户（按 next_followup_date） |
| `update_funnel_stage` | 更新销售漏斗阶段 |
| `score_customer` | 录入/更新客户意向评分 |
| `get_funnel_stats` | 获取销售漏斗统计（仅 project_manager） |

---

## 验收标准

| 检查项 | 标准 | 必须 |
|--------|------|------|
| 跟进记录严格按销售隔离 | 销售A看不到销售B的跟进 | 必须 |
| get_today_tasks 只返回今天及之前的 | 按日期过滤正确 | 必须 |
| 跟进后 latest_followup_date 自动更新 | 触发器或Function内更新 | 必须 |
| funnel_stage 枚举值约束 | 无效值被拒绝 | 必须 |
| 单元测试 | ≥ 85% | 必须 |

---

## 交付物

1. `supabase/functions/crm_management/index.ts` + test
2. `supabase/migrations/010_phase2_crm.sql`
3. `.logs/detailed/task-phase2-T03.json`
4. **Git Commit**: `feat(phase2): implement customer crm enhancement [task-phase2-T03]`
