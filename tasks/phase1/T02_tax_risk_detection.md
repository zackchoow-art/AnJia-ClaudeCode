# T02 — 土增税风险检测引擎

**任务ID**: task-phase1-T02  
**执行Agent**: 全栈资深Agent (`qwen/qwen3-coder-480b-a35b-instruct`)  
**估时**: 12小时  
**依赖**: Phase 0 验收通过  
**分支**: `feature/phase1-T02-tax-detection`  
**优先级**: 🔴 High

---

## 任务目标

实现土增税（土地增值税）风险检测引擎，能根据项目的实际成本数据自动估算税负，并在税负超过预设阈值时生成预警。

**背景**: 土地增值税是中国房地产开发的重要税种，计算复杂，错误估算可能导致项目利润大幅缩水。Phase 0 已有 `projects.tax_planning_*` 字段，Phase 1 在此基础上增加自动检测。

---

## 执行边界

### 允许的操作
- 新建 `supabase/functions/tax_risk_detection/index.ts`
- 新建迁移文件 `supabase/migrations/005_phase1_tax_detection.sql`（新增 `tax_calculations` 表）
- 修改 `projects` 表仅新增列
- 使用 AI 辅助生成税务优化建议（调用 Nvidia NIM API）

### 禁止的操作
- 不得将引擎的计算结果直接写入 `actual_tax_amount`（该字段由财务人员手动确认后写入）
- 不得修改 Phase 0 的任何表的现有字段
- 不得实现实际缴税操作（本模块只是预测和预警）

---

## 土增税计算规则

### 中国土增税四档税率

| 增值率 | 税率 | 速算扣除系数 |
|--------|------|-------------|
| ≤ 50% | 30% | 0 |
| 50%~100% | 40% | 5% |
| 100%~200% | 50% | 15% |
| > 200% | 60% | 35% |

**增值率计算**:
```
增值额 = 转让收入 - 扣除项目
增值率 = 增值额 / 扣除项目 × 100%
应缴税额 = 增值额 × 税率 - 扣除项目 × 速算扣除系数
```

**扣除项目**（简化版）:
- 取得土地使用权支付的金额
- 开发成本（建筑安装）
- 开发费用（管理费、销售费，约为成本的10%）
- 税金（营业税、城建税、教育附加）

---

## 数据库设计

### 新增表: tax_calculations

```sql
-- supabase/migrations/005_phase1_tax_detection.sql

CREATE TABLE tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 输入数据（来自 projects 和 cost_ledger）
  estimated_revenue NUMERIC(15,2),     -- 预计销售收入
  land_cost NUMERIC(15,2),             -- 土地取得成本
  construction_cost NUMERIC(15,2),     -- 建设成本
  development_cost NUMERIC(15,2),      -- 开发费用
  tax_deductions NUMERIC(15,2),        -- 税金扣除
  total_deductions NUMERIC(15,2),      -- 总扣除项
  
  -- 计算结果
  appreciation_amount NUMERIC(15,2),   -- 增值额
  appreciation_rate NUMERIC(5,2),      -- 增值率(%)
  tax_bracket TEXT,                    -- 适用税率档次
  tax_rate NUMERIC(4,2),              -- 税率(%)
  calculated_tax NUMERIC(15,2),        -- 计算得出的应缴税额
  
  -- 风险评估
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  risk_factors JSONB DEFAULT '[]',     -- 风险因素列表
  
  -- AI 优化建议
  ai_suggestions JSONB DEFAULT '[]',   -- [{suggestion, expected_saving, feasibility}]
  ai_model TEXT,
  
  -- 数据来源
  calculation_basis TEXT,              -- ACTUAL_COSTS | ESTIMATED | MIXED
  data_completeness_pct INTEGER,       -- 数据完整度(%)
  
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculated_by TEXT NOT NULL,
  
  -- 版本控制（项目可多次计算）
  version INTEGER NOT NULL DEFAULT 1
);

-- 在 projects 表新增列
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS latest_tax_calc_id UUID REFERENCES tax_calculations(id),
  ADD COLUMN IF NOT EXISTS tax_risk_level TEXT;

-- RLS
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tax_calc_finance_all ON tax_calculations
  FOR ALL TO finance USING (true) WITH CHECK (true);

CREATE POLICY tax_calc_pm_read ON tax_calculations
  FOR SELECT TO project_manager USING (true);

CREATE POLICY tax_calc_agent_insert ON tax_calculations
  FOR INSERT TO system_agent WITH CHECK (true);

-- 索引
CREATE INDEX idx_tax_calc_project ON tax_calculations(project_id, calculated_at DESC);
CREATE INDEX idx_tax_calc_risk ON tax_calculations(risk_level);
```

---

## Edge Function 实现

### 文件: `supabase/functions/tax_risk_detection/index.ts`

**输入**:
```typescript
interface TaxDetectionRequest {
  project_id: string;
  estimated_revenue?: number;  // 可选，若提供则覆盖DB中的数据
  use_actual_costs?: boolean;  // 是否使用 cost_ledger 的实际成本（默认true）
}
```

**业务逻辑**:
1. 读取 `projects` 的 `tax_planning_baseline` 和 `total_budget`
2. 汇总 `cost_ledger` 中 `verification_status=VERIFIED` 的实际成本
3. 按类型（LAND/CONSTRUCTION/OVERHEAD）分类
4. 执行土增税四档税率计算
5. 评估风险等级：
   - `LOW`: 增值率 ≤ 50%
   - `MEDIUM`: 50% < 增值率 ≤ 100%
   - `HIGH`: 100% < 增值率 ≤ 200%
   - `CRITICAL`: 增值率 > 200%（最高税率60%）
6. 如果风险等级 ≥ HIGH，调用 AI 生成优化建议
7. 保存到 `tax_calculations`，更新 `projects.tax_risk_level`
8. 写入 audit_log

**风险因素识别**:
```typescript
const riskFactors = [];
if (appreciationRate > 100) riskFactors.push({ factor: "HIGH_APPRECIATION", rate: appreciationRate });
if (dataCompletion < 70) riskFactors.push({ factor: "INCOMPLETE_DATA", pct: dataCompletion });
if (landCost === 0) riskFactors.push({ factor: "MISSING_LAND_COST" });
```

---

## 验收标准

| 检查项 | 标准 | 必须/建议 |
|--------|------|---------|
| tax_calculations 表创建 | 可正常写入 | 必须 |
| 四档税率计算正确 | 对3个不同增值率的测试案例结果准确 | 必须 |
| risk_level 评估正确 | 与增值率对应关系正确 | 必须 |
| 数据不完整时有警告 | `data_completeness_pct` 字段有值 | 必须 |
| AI建议在 HIGH/CRITICAL 时生成 | `ai_suggestions` 非空 | 建议 |
| audit_log 记录 | 有对应操作记录 | 必须 |
| 单元测试覆盖率 | ≥ 90%（税率计算是纯函数，100% 可达） | 必须 |

### 测试案例验证

```bash
# 测试案例1: 增值率30%（LOW风险）
# 输入: revenue=1000, deductions=769.2 → appreciation_rate=30%, tax=0.30*230.8=69.2万

# 测试案例2: 增值率80%（MEDIUM风险）
# 输入: revenue=1000, deductions=555.6 → appreciation_rate=80%, tax=0.40*444.4-5%*555.6

# 测试案例3: 增值率150%（HIGH风险）
# 验证AI建议被生成
```

---

## 交付物

1. `supabase/functions/tax_risk_detection/index.ts`
2. `supabase/functions/tax_risk_detection/index.test.ts`（含3个税率档次测试）
3. `supabase/functions/tax_risk_detection/deno.json`
4. `supabase/migrations/005_phase1_tax_detection.sql`
5. `.logs/detailed/task-phase1-T02.json`（工作日志）
6. **Git Commit**: `feat(phase1): implement land value tax risk detection engine [task-phase1-T02]`
