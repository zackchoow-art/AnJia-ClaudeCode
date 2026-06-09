-- ============================================================================
-- REDP Phase 3: Project Management Enhancement (T01)
-- Created: 2026-06-08
-- Description: 扩展项目表，新增property_units房源明细表
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- 1. EXTEND projects TABLE
-- ============================================================================

-- 基础信息字段
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planning_scheme TEXT;        -- 规划方案
ALTER TABLE projects ADD COLUMN IF NOT EXISTS design_scheme TEXT;          -- 设计方案
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_sales NUMERIC(15,2);  -- 预估销售总额

-- 时间节点字段
ALTER TABLE projects ADD COLUMN IF NOT EXISTS land_acquisition_date DATE;       -- 拿地时间
ALTER TABLE projects ADD COLUMN IF NOT EXISTS commencement_date DATE;           -- 动工时间
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pre_sale_date DATE;               -- 预售时间
ALTER TABLE projects ADD COLUMN IF NOT EXISTS main_capping_date DATE;           -- 主体封顶时间
ALTER TABLE projects ADD COLUMN IF NOT EXISTS main_acceptance_date DATE;        -- 主体验收时间
ALTER TABLE projects ADD COLUMN IF NOT EXISTS delivery_date DATE;               -- 交房时间

-- 费用类字段
ALTER TABLE projects ADD COLUMN IF NOT EXISTS management_fee NUMERIC(15,2);     -- 管理费用
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketing_expense NUMERIC(15,2);  -- 营销费用
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sales_commission NUMERIC(15,2);   -- 销售佣金

-- 税金类字段 (JSONB存储各税种明细)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tax_estimates JSONB;              -- {"vAT": 100000, "income_tax": 50000}

-- 规划指标字段 (JSONB存储各类规划指标)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planning_metrics JSONB;           -- {"green_rate": 30, "plot_ratio": 2.5}

-- ============================================================================
-- 2. CREATE property_units TABLE (详细房源明细表)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 唯一标识
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
  
  -- 特征标签（用于AI推荐）
  features JSONB DEFAULT '[]',
  -- ["学区房", "南北通透", "电梯房", "带车位"]
  
  -- 元数据
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. CREATE property_units_status_history TABLE (状态变更日志)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_units_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_unit_id UUID NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);

-- ============================================================================
-- 4. RLS POLICIES FOR property_units
-- ============================================================================

ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_units_status_history ENABLE ROW LEVEL SECURITY;

-- sales_team 只能看 AVAILABLE 和 RESERVED 状态的房源（价格信息可见）
CREATE POLICY IF NOT EXISTS property_units_sales_read ON property_units
  FOR SELECT TO sales_team
  USING (property_status IN ('AVAILABLE', 'RESERVED'));

-- project_manager 全权管理
CREATE POLICY IF NOT EXISTS property_units_pm_all ON property_units
  FOR ALL TO project_manager USING (true) WITH CHECK (true);

-- 管理人员可以查看状态历史
CREATE POLICY IF NOT EXISTS units_status_history_pm_all ON property_units_status_history
  FOR ALL TO project_manager USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_property_units_project ON property_units(project_id);
CREATE INDEX IF NOT EXISTS idx_property_units_code ON property_units(property_code);
CREATE INDEX IF NOT EXISTS idx_property_units_status ON property_units(property_status);
CREATE INDEX IF NOT EXISTS idx_property_units_building ON property_units(building_number, floor_number);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_units_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS property_units_updated_at ON property_units;
CREATE TRIGGER property_units_updated_at
  BEFORE UPDATE ON property_units
  FOR EACH ROW
  EXECUTE FUNCTION update_property_units_updated_at();

-- Log status changes
CREATE OR REPLACE FUNCTION log_property_units_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.property_status IS DISTINCT FROM NEW.property_status THEN
    INSERT INTO property_units_status_history (
      property_unit_id, old_status, new_status, changed_by
    ) VALUES (
      NEW.id, OLD.property_status, NEW.property_status,
      COALESCE(current_setting('app.current_user_id', true), 'system')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_property_units_status ON property_units;
CREATE TRIGGER log_property_units_status
  BEFORE UPDATE ON property_units
  FOR EACH ROW
  EXECUTE FUNCTION log_property_units_status_change();

-- ============================================================================
-- 7. RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.5.0',
  'Phase 3 - Project Management Enhancement (T01)',
  '012_phase3_project_enhancement.sql',
  'ALTER TABLE projects DROP COLUMN planning_scheme; DROP TABLE property_units_status_history CASCADE; DROP TABLE property_units CASCADE;'
);

