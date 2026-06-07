-- ============================================================================
-- REDP Phase 2: Property Inventory Management (T01)
-- Created: 2026-06-07
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- NEW TABLE: properties (房源表)
-- ============================================================================

CREATE TABLE IF NOT EXISTS properties (
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
  customer_id UUID REFERENCES customers(id),
  contract_id UUID REFERENCES contracts(id),

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
-- NEW TABLE: property_status_history (状态变更日志)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);

-- ============================================================================
-- NEW TABLE: property_reservations (认购记录)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_reservations (
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

-- ============================================================================
-- MODIFY TABLE: customers
-- Add interested_property_ids column
-- ============================================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS interested_property_ids UUID[];

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_status_history ENABLE ROW LEVEL SECURITY;

-- sales_team 只能看 AVAILABLE 和 RESERVED 状态的房源（价格信息可见）
CREATE POLICY IF NOT EXISTS properties_sales_read ON properties
  FOR SELECT TO sales_team
  USING (property_status IN ('AVAILABLE', 'RESERVED'));

-- sales_team 可以查看自己负责的认购
CREATE POLICY IF NOT EXISTS reservations_sales_own ON property_reservations
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true))
  WITH CHECK (sales_agent_id = current_setting('app.current_user_id', true));

-- project_manager 全权管理
CREATE POLICY IF NOT EXISTS properties_pm_all ON properties
  FOR ALL TO project_manager USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS reservations_pm_all ON property_reservations
  FOR ALL TO project_manager USING (true) WITH CHECK (true);

-- 管理人员可以查看状态历史
CREATE POLICY IF NOT EXISTS status_history_pm_all ON property_status_history
  FOR ALL TO project_manager USING (true) WITH CHECK (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_properties_project ON properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(property_status);
CREATE INDEX IF NOT EXISTS idx_properties_code ON properties(property_code);
CREATE INDEX IF NOT EXISTS idx_reservations_property ON property_reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON property_reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_agent ON property_reservations(sales_agent_id);

-- ============================================================================
-- FUNCTION: update_updated_at_column
-- 自动更新 updated_at 时间戳
-- ============================================================================

CREATE OR REPLACE FUNCTION update_property_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: properties_updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS properties_updated_at ON properties;
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_property_updated_at();

-- ============================================================================
-- FUNCTION: log_property_status_change
-- 记录状态变更到历史表
-- ============================================================================

CREATE OR REPLACE FUNCTION log_property_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.property_status IS DISTINCT FROM NEW.property_status THEN
    INSERT INTO property_status_history (
      property_id, old_status, new_status, changed_by
    ) VALUES (
      NEW.id, OLD.property_status, NEW.property_status,
      COALESCE(current_setting('app.current_user_id', true), 'system')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: log_property_status
-- ============================================================================

DROP TRIGGER IF EXISTS log_property_status ON properties;
CREATE TRIGGER log_property_status
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION log_property_status_change();

-- ============================================================================
-- FUNCTION: check_property_status_transition
-- 验证状态转换是否合法
-- 合法转换:
--   AVAILABLE -> RESERVED, UNAVAILABLE
--   RESERVED -> UNDER_CONTRACT, AVAILABLE (release)
--   UNDER_CONTRACT -> SOLD, AVAILABLE (contract cancelled)
--   SOLD, OWNER_OCCUPIED -> 不可再转换（最终状态）
--   UNAVAILABLE -> AVAILABLE (恢复销售)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_property_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transition BOOLEAN := FALSE;
BEGIN
  -- 如果状态没有变化，直接通过
  IF OLD.property_status = NEW.property_status THEN
    RETURN NEW;
  END IF;

  -- 定义合法的状态转换
  CASE OLD.property_status
    WHEN 'AVAILABLE' THEN
      IF NEW.property_status IN ('RESERVED', 'UNAVAILABLE') THEN
        valid_transition := TRUE;
      END IF;
    WHEN 'RESERVED' THEN
      IF NEW.property_status IN ('UNDER_CONTRACT', 'AVAILABLE') THEN
        valid_transition := TRUE;
      END IF;
    WHEN 'UNDER_CONTRACT' THEN
      IF NEW.property_status IN ('SOLD', 'AVAILABLE') THEN
        valid_transition := TRUE;
      END IF;
    WHEN 'SOLD', 'OWNER_OCCUPIED' THEN
      -- 最终状态，不允许转换
      RAISE EXCEPTION 'Cannot change status from % to %. Final states cannot be changed.', OLD.property_status, NEW.property_status;
    WHEN 'UNAVAILABLE' THEN
      IF NEW.property_status = 'AVAILABLE' THEN
        valid_transition := TRUE;
      END IF;
  END CASE;

  IF NOT valid_transition THEN
    RAISE EXCEPTION 'Invalid status transition: % -> %. Valid transitions: AVAILABLE->RESERVED/UNAVAILABLE, RESERVED->UNDER_CONTRACT/AVAILABLE, UNDER_CONTRACT->SOLD/AVAILABLE, UNAVAILABLE->AVAILABLE.',
      OLD.property_status, NEW.property_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: validate_property_status_transition
-- ============================================================================

DROP TRIGGER IF EXISTS validate_property_status_transition ON properties;
CREATE CONSTRAINT TRIGGER validate_property_status_transition
  AFTER UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION check_property_status_transition();

-- ============================================================================
-- RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.4.0',
  'Phase 2 - Property Inventory Management (T01)',
  '008_phase2_properties.sql',
  'ALTER TABLE customers DROP COLUMN interested_property_ids; DROP TABLE property_reservations CASCADE; DROP TABLE property_status_history CASCADE; DROP TABLE properties CASCADE;'
);
