# T01 — 房源库存管理

**任务ID**: task-phase2-T01  
**执行Agent**: 全栈标准Agent (`minimaxai/minimax-m2.7`)  
**估时**: 10小时  
**依赖**: Phase 1 验收通过  
**分支**: `feature/phase2-T01-property-inventory`  
**优先级**: 🔴 High

---

## 任务目标

建立房源（单套房产）管理模块，实现从开盘前的预售管理到交房的全生命周期追踪。这是销售AI和移动端的数据基础。

---

## 执行边界

### 允许的操作
- 新建 `supabase/migrations/008_phase2_properties.sql`（新增 `properties` 和 `property_reservations` 表）
- 新建 `supabase/functions/property_management/index.ts`（CRUD + 状态机）
- 修改 `customers` 表仅新增 `interested_property_ids` 列

### 禁止的操作
- 不得修改 Phase 0/1 任何表的现有字段
- 不得删除或重命名任何现有 Edge Function

---

## 数据库设计

### 新增表: properties（房源）

```sql
-- supabase/migrations/008_phase2_properties.sql

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 房源标识
  building_number TEXT NOT NULL,   -- 栋号: "A栋"
  floor_number INTEGER NOT NULL,   -- 楼层
  unit_number TEXT NOT NULL,       -- 单元号: "1单元"
  room_number TEXT NOT NULL,       -- 户号: "101"
  property_code TEXT UNIQUE NOT NULL,  -- 系统编号: "A-1-1-101"
  
  -- 基本信息（支持双语）
  property_type JSONB NOT NULL,    -- {"zh": "三室两厅", "ug": "3 ئۆي 2 مەيدان"}
  floor_area NUMERIC(8,2) NOT NULL CHECK (floor_area > 0),  -- 建筑面积(㎡)
  usable_area NUMERIC(8,2),       -- 套内面积(㎡)
  orientation TEXT,               -- 朝向: "南北通透"
  
  -- 定价
  list_price NUMERIC(15,2),       -- 标牌价
  final_price NUMERIC(15,2),      -- 成交价（签约后填入）
  price_per_sqm NUMERIC(10,2),    -- 单价(元/㎡)
  
  -- 状态机
  property_status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK (property_status IN (
      'AVAILABLE',      -- 可售
      'RESERVED',       -- 已认购（预留）
      'UNDER_CONTRACT', -- 合同签署中
      'SOLD',           -- 已售出
      'OWNER_OCCUPIED', -- 自持
      'UNAVAILABLE'     -- 暂不出售（工程原因）
    )),
  
  -- 关联
  customer_id UUID REFERENCES customers(id),        -- 购房客户
  contract_id UUID REFERENCES contracts(id),        -- 购房合同
  
  -- 特征标签（用于AI推荐）
  features JSONB DEFAULT '[]',
  -- ["学区房", "南北通透", "电梯房", "带车位"]
  
  -- 元数据
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 状态变更日志
CREATE TABLE property_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);

-- 认购记录（预留但未签合同）
CREATE TABLE property_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_agent_id TEXT NOT NULL,
  reservation_amount NUMERIC(10,2),  -- 意向金
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,               -- 认购有效期
  reservation_status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (reservation_status IN ('ACTIVE', 'CONVERTED', 'EXPIRED', 'CANCELLED')),
  notes TEXT
);

-- RLS（继承 sales_team 隔离模式）
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_status_history ENABLE ROW LEVEL SECURITY;

-- sales_team 只能看 AVAILABLE 状态的房源（价格信息可见）
CREATE POLICY properties_sales_read ON properties
  FOR SELECT TO sales_team
  USING (property_status IN ('AVAILABLE', 'RESERVED'));

-- sales_team 只能看自己负责的认购
CREATE POLICY reservations_sales_isolation ON property_reservations
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true))
  WITH CHECK (sales_agent_id = current_setting('app.current_user_id', true));

-- project_manager 全权管理
CREATE POLICY properties_pm_all ON properties FOR ALL TO project_manager USING (true) WITH CHECK (true);
CREATE POLICY reservations_pm_all ON property_reservations FOR ALL TO project_manager USING (true) WITH CHECK (true);

-- 索引
CREATE INDEX idx_properties_project ON properties(project_id);
CREATE INDEX idx_properties_status ON properties(property_status);
CREATE INDEX idx_properties_code ON properties(property_code);
CREATE INDEX idx_reservations_property ON property_reservations(property_id);
```

---

## Edge Function 实现

### 文件: `supabase/functions/property_management/index.ts`

支持的操作（通过 action 字段路由）:

| action | 描述 |
|--------|------|
| `list` | 列出项目房源（支持按状态/楼层筛选） |
| `get` | 获取单套房源详情 |
| `reserve` | 认购房源（AVAILABLE → RESERVED） |
| `convert_to_contract` | 转合同（RESERVED → UNDER_CONTRACT） |
| `mark_sold` | 标记售出（UNDER_CONTRACT → SOLD） |
| `release` | 释放认购（RESERVED → AVAILABLE） |
| `update_price` | 更新定价（仅 project_manager） |

**状态机约束**:
```
AVAILABLE ──reserve()──→ RESERVED ──convert()──→ UNDER_CONTRACT ──mark_sold()──→ SOLD
    ↑                        │
    └────release()───────────┘
```

---

## 验收标准

| 检查项 | 标准 | 必须 |
|--------|------|------|
| properties 表创建成功 | 可写入测试数据 | 必须 |
| 状态机转换正确 | 非法转换被拒绝 | 必须 |
| sales_team 无法看到 SOLD 房源的成交价 | final_price 字段受限 | 必须 |
| 认购有隔离 | 销售只能看自己的 reservation | 必须 |
| 单元测试 | ≥ 85% | 必须 |

---

## 交付物

1. `supabase/functions/property_management/index.ts`
2. `supabase/functions/property_management/index.test.ts`
3. `supabase/functions/property_management/deno.json`
4. `supabase/migrations/008_phase2_properties.sql`
5. `.logs/detailed/task-phase2-T01.json`
6. **Git Commit**: `feat(phase2): implement property inventory management [task-phase2-T01]`
