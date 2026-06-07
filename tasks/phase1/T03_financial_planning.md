# T03 — 智能财务规划模块

**任务ID**: task-phase1-T03  
**执行Agent**: 全栈标准Agent (`minimaxai/minimax-m2.7`) + 数据分析Agent (`nvidia/nemotron-3-nano-30b-a3b`)  
**估时**: 8小时（标准全栈6h + 数据分析2h）  
**依赖**: T02（土增税风险检测引擎完成）  
**分支**: `feature/phase1-T03-financial-planning`  
**优先级**: 🟡 Medium

---

## 任务目标

基于项目的预算、实际成本、合同支付里程碑和税金预测，生成智能支付建议报告。帮助项目经理优化支付时序，避免资金链断裂和税务风险。

---

## 执行边界

### 允许的操作
- 新建 `supabase/functions/financial_planning/index.ts`
- 新建 `supabase/migrations/006_phase1_financial_planning.sql`（新增 `financial_plans` 表）
- 读取 Phase 0 和 Phase 1 T01/T02 的数据

### 禁止的操作
- 不得直接修改 `payments` 表的状态（规划只是建议，不执行）
- 不得调用 approve_payment（财务规划不等于审批）
- 不得修改任何已有表的现有字段

---

## 数据库设计

### 新增表: financial_plans

```sql
-- supabase/migrations/006_phase1_financial_planning.sql

CREATE TABLE financial_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('MONTHLY', 'QUARTERLY', 'MILESTONE_BASED')),
  
  -- 资金健康指标
  current_budget_utilization_pct NUMERIC(5,2),  -- 当前预算使用率
  projected_cash_flow JSONB NOT NULL DEFAULT '{}',
  /*
  {
    "months": [
      {
        "month": "2026-07",
        "expected_inflow": 500000,
        "planned_outflow": 300000,
        "net_flow": 200000,
        "cumulative_balance": 1200000
      }
    ]
  }
  */
  
  -- 支付建议
  payment_recommendations JSONB NOT NULL DEFAULT '[]',
  /*
  [
    {
      "contract_id": "uuid",
      "contract_name": "...",
      "recommended_payment_date": "2026-08-15",
      "amount": 200000,
      "reason": "里程碑达成时间窗口",
      "priority": "HIGH|MEDIUM|LOW",
      "tax_impact": "延迟支付可节税约X万元"
    }
  ]
  */
  
  -- 风险预警
  risk_alerts JSONB NOT NULL DEFAULT '[]',
  /*
  [
    {
      "alert_type": "CASH_FLOW_RISK|TAX_DEADLINE|MILESTONE_MISS",
      "severity": "LOW|MEDIUM|HIGH",
      "description": "...",
      "recommended_action": "..."
    }
  ]
  */
  
  -- 关联的税务计算
  tax_calculation_id UUID REFERENCES tax_calculations(id),
  
  plan_period_start DATE NOT NULL,
  plan_period_end DATE NOT NULL,
  
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by TEXT NOT NULL
);

-- RLS
ALTER TABLE financial_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_plans_finance_all ON financial_plans
  FOR ALL TO finance USING (true) WITH CHECK (true);

CREATE POLICY financial_plans_pm_read ON financial_plans
  FOR SELECT TO project_manager USING (true);

-- 索引
CREATE INDEX idx_financial_plans_project ON financial_plans(project_id, generated_at DESC);
```

---

## Edge Function 实现

### 文件: `supabase/functions/financial_planning/index.ts`

**输入**:
```typescript
interface FinancialPlanRequest {
  project_id: string;
  plan_type: 'MONTHLY' | 'QUARTERLY' | 'MILESTONE_BASED';
  plan_period_months?: number;  // 默认6个月
}
```

**业务逻辑**:
1. 读取项目基础数据（`projects.total_budget`, 开始/结束日期）
2. 读取预算执行情况（`cost_budget`: budgeted vs spent）
3. 读取实际成本（`cost_ledger` 按月汇总）
4. 读取未来支付里程碑（`payment_rules` 的 trigger_condition_json）
5. 读取最新税务估算（`tax_calculations` 最新版本）
6. 生成现金流预测（按月/季度）
7. 基于里程碑和税务时间窗口生成支付建议
8. 识别风险（资金链、税务截止、里程碑延误）
9. 保存到 `financial_plans`

---

## 数据分析Agent职责

数据分析Agent在全栈标准Agent完成实现后：

1. 对种子数据生成规划报告
2. 验证现金流数据的内在一致性（inflow - outflow = net_flow）
3. 检查 payment_recommendations 排序是否合理（高优先级在前）
4. 输出分析结论到测试报告

---

## 验收标准

| 检查项 | 标准 | 必须/建议 |
|--------|------|---------|
| financial_plans 表创建成功 | 可正常写入 | 必须 |
| 现金流数据一致性 | inflow - outflow = net_flow 误差 < 1元 | 必须 |
| 支付建议有理由说明 | reason 字段非空 | 必须 |
| 风险预警有实际内容 | 种子项目至少有1条预警 | 建议 |
| 关联了税务计算 | `tax_calculation_id` 有值 | 建议 |
| 单元测试覆盖率 | ≥ 85% | 必须 |

---

## 交付物

1. `supabase/functions/financial_planning/index.ts`
2. `supabase/functions/financial_planning/index.test.ts`
3. `supabase/functions/financial_planning/deno.json`
4. `supabase/migrations/006_phase1_financial_planning.sql`
5. `.logs/tests/task-phase1-T03-analysis.json`（数据分析Agent提供）
6. `.logs/detailed/task-phase1-T03.json`
7. **Git Commit**: `feat(phase1): implement intelligent financial planning module [task-phase1-T03]`
