-- ============================================================================
-- REDP Phase 3: Project Advanced Features Enhancement (T01)
-- Created: 2026-06-09
-- Description: 添加项目高级功能支持
--   1. 文档上传（规划方案、设计方案）
--   2. 自定义时间计划节点
--   3. 可维护的成本分类
--   4. 可维护的税金和费用类别
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- 0. 添加新列到 projects 表 (如果不存在)
-- ============================================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS remarks TEXT; -- 备注字段

-- ============================================================================
-- 1. 创建 planning_documents 表（规划方案文档）
-- ============================================================================

CREATE TABLE IF NOT EXISTS planning_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,          -- 原始文件名
  file_url TEXT NOT NULL,           -- 文件在 Storage 中的路径
  file_size BIGINT,                 -- 文件大小（字节）
  mime_type TEXT,                   -- MIME 类型
  uploaded_by TEXT REFERENCES auth.users(id),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. 创建 design_documents 表（设计方案文档）
-- ============================================================================

CREATE TABLE IF NOT EXISTS design_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,          -- 原始文件名
  file_url TEXT NOT NULL,           -- 文件在 Storage 中的路径
  file_size BIGINT,                 -- 文件大小（字节）
  mime_type TEXT,                   -- MIME 类型
  uploaded_by TEXT REFERENCES auth.users(id),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. 创建 custom_timeline_events 表（自定义时间计划节点）
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name_zh TEXT NOT NULL,            -- 中文名称
  name_en TEXT NOT NULL,            -- 英文名称
  event_date DATE NOT NULL,         -- 事件日期
  sort_order INTEGER DEFAULT 0,     -- 排序顺序
  remark TEXT,                      -- 备注

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. 创建 cost_categories 表（成本分类）
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES cost_categories(id) ON DELETE SET NULL,

  code TEXT NOT NULL,               -- 分类代码，例如：LAND, CONSTRUCTION
  name_zh TEXT NOT NULL,            -- 中文名称
  name_en TEXT NOT NULL,            -- 英文名称
  is_system BOOLEAN DEFAULT false,  -- 是否为系统预设分类

  remark TEXT,                      -- 备注
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cost_categories_project ON cost_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_categories_parent ON cost_categories(parent_id);

-- ============================================================================
-- 5. 创建 tax_types 表（税金类别）
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  name_zh TEXT NOT NULL,            -- 中文名称，例如：增值税、所得税
  name_en TEXT NOT NULL,            -- 英文名称
  rate NUMERIC(6,4),                -- 税率（百分比格式）
  amount NUMERIC(15,2) DEFAULT 0,   -- 预估金额

  remark TEXT,                      -- 备注

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. 创建 expense_items 表（费用项）
-- ============================================================================

CREATE TABLE IF NOT EXISTS expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  name_zh TEXT NOT NULL,            -- 中文名称，例如：管理费用、营销费用
  name_en TEXT NOT NULL,            -- 英文名称
  amount NUMERIC(15,2) DEFAULT 0,   -- 预估金额

  remark TEXT,                      -- 备注

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. 更新 cost_budget 表以关联到新的成本分类
-- ============================================================================

ALTER TABLE cost_budget ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES cost_categories(id);
ALTER TABLE cost_budget ADD COLUMN IF NOT EXISTS remark TEXT;

-- 将现有的硬编码分类迁移到 cost_categories 表
DO $$
DECLARE
  project RECORD;
  land_category UUID;
  construction_category UUID;
  sales_category UUID;
  tax_category UUID;
  overhead_category UUID;
  marketing_category UUID;
  financing_category UUID;
BEGIN
  -- 为每个项目创建默认成本分类
  FOR project IN SELECT id FROM projects WHERE id IS NOT NULL LOOP
    -- 检查是否已有数据
    IF NOT EXISTS (SELECT 1 FROM cost_categories WHERE project_id = project.id LIMIT 1) THEN
      INSERT INTO cost_categories (project_id, code, name_zh, name_en, is_system, sort_order)
      VALUES
        (project.id, 'LAND', '土地成本', 'Land Cost', true, 1)
        RETURNING id INTO land_category;

      INSERT INTO cost_categories (project_id, code, name_zh, name_en, is_system, sort_order)
      VALUES
        (project.id, 'CONSTRUCTION', '建安成本', 'Construction', true, 2)
        RETURNING id INTO construction_category;

      INSERT INTO cost_categories (project_id, code, name_zh, name_en, is_system, sort_order)
      VALUES
        (project.id, 'SALES', '销售费用', 'Sales', true, 3)
        RETURNING id INTO sales_category;

      INSERT INTO cost_categories (project_id, code, name_zh, name_en, is_system, sort_order)
      VALUES
        (project.id, 'TAX', '税金支出', 'Tax', true, 4)
        RETURNING id INTO tax_category;

      INSERT INTO cost_categories (project_id, code, name_zh, name_en, is_system, sort_order)
      VALUES
        (project.id, 'OVERHEAD', '管理费用', 'Overhead', true, 5)
        RETURNING id INTO overhead_category;

      INSERT INTO cost_categories (project_id, code, name_zh, name_en, is_system, sort_order)
      VALUES
        (project.id, 'MARKETING', '营销费用', 'Marketing', true, 6)
        RETURNING id INTO marketing_category;

      INSERT INTO cost_categories (project_id, code, name_zh, name_en, is_system, sort_order)
      VALUES
        (project.id, 'FINANCING', '融资成本', 'Financing', true, 7)
        RETURNING id INTO financing_category;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 8. RLS 策略
-- ============================================================================

ALTER TABLE planning_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

-- planning_documents policies
CREATE POLICY IF NOT EXISTS planning_docs_read ON planning_documents
  FOR SELECT TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS planning_docs_insert ON planning_documents
  FOR INSERT TO project_manager WITH CHECK (true);

CREATE POLICY IF NOT EXISTS planning_docs_update ON planning_documents
  FOR UPDATE TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS planning_docs_delete ON planning_documents
  FOR DELETE TO project_manager USING (true);

-- design_documents policies
CREATE POLICY IF NOT EXISTS design_docs_read ON design_documents
  FOR SELECT TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS design_docs_insert ON design_documents
  FOR INSERT TO project_manager WITH CHECK (true);

CREATE POLICY IF NOT EXISTS design_docs_update ON design_documents
  FOR UPDATE TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS design_docs_delete ON design_documents
  FOR DELETE TO project_manager USING (true);

-- custom_timeline_events policies
CREATE POLICY IF NOT EXISTS timeline_read ON custom_timeline_events
  FOR SELECT TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS timeline_insert ON custom_timeline_events
  FOR INSERT TO project_manager WITH CHECK (true);

CREATE POLICY IF NOT EXISTS timeline_update ON custom_timeline_events
  FOR UPDATE TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS timeline_delete ON custom_timeline_events
  FOR DELETE TO project_manager USING (true);

-- cost_categories policies
CREATE POLICY IF NOT EXISTS cost_cats_read ON cost_categories
  FOR SELECT TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS cost_cats_insert ON cost_categories
  FOR INSERT TO project_manager WITH CHECK (true);

CREATE POLICY IF NOT EXISTS cost_cats_update ON cost_categories
  FOR UPDATE TO project_manager USING (true);

-- 只有非系统分类且未被使用才允许删除
CREATE POLICY IF NOT EXISTS cost_cats_delete ON cost_categories
  FOR DELETE TO project_manager
  USING (is_system = false OR NOT EXISTS (
    SELECT 1 FROM cost_budget WHERE category_id = cost_categories.id
  ));

-- tax_types policies
CREATE POLICY IF NOT EXISTS tax_types_read ON tax_types
  FOR SELECT TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS tax_types_insert ON tax_types
  FOR INSERT TO project_manager WITH CHECK (true);

CREATE POLICY IF NOT EXISTS tax_types_update ON tax_types
  FOR UPDATE TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS tax_types_delete ON tax_types
  FOR DELETE TO project_manager USING (true);

-- expense_items policies
CREATE POLICY IF NOT EXISTS expenses_read ON expense_items
  FOR SELECT TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS expenses_insert ON expense_items
  FOR INSERT TO project_manager WITH CHECK (true);

CREATE POLICY IF NOT EXISTS expenses_update ON expense_items
  FOR UPDATE TO project_manager USING (true);

CREATE POLICY IF NOT EXISTS expenses_delete ON expense_items
  FOR DELETE TO project_manager USING (true);

-- ============================================================================
-- 9. 触发器
-- ============================================================================

-- 更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_planning_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS planning_documents_updated_at ON planning_documents;
CREATE TRIGGER planning_documents_updated_at
  BEFORE UPDATE ON planning_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_documents_updated_at();

-- design_documents updated_at trigger
CREATE OR REPLACE FUNCTION update_design_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS design_documents_updated_at ON design_documents;
CREATE TRIGGER design_documents_updated_at
  BEFORE UPDATE ON design_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_design_documents_updated_at();

-- custom_timeline_events updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_timeline_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS custom_timeline_events_updated_at ON custom_timeline_events;
CREATE TRIGGER custom_timeline_events_updated_at
  BEFORE UPDATE ON custom_timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_timeline_events_updated_at();

-- cost_categories updated_at trigger
CREATE OR REPLACE FUNCTION update_cost_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cost_categories_updated_at ON cost_categories;
CREATE TRIGGER cost_categories_updated_at
  BEFORE UPDATE ON cost_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_cost_categories_updated_at();

-- tax_types updated_at trigger
CREATE OR REPLACE FUNCTION update_tax_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tax_types_updated_at ON tax_types;
CREATE TRIGGER tax_types_updated_at
  BEFORE UPDATE ON tax_types
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_types_updated_at();

-- expense_items updated_at trigger
CREATE OR REPLACE FUNCTION update_expense_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expense_items_updated_at ON expense_items;
CREATE TRIGGER expense_items_updated_at
  BEFORE UPDATE ON expense_items
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_items_updated_at();

-- ============================================================================
-- 10. 索引
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_planning_documents_project ON planning_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_design_documents_project ON design_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_timeline_events_project ON custom_timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_tax_types_project ON tax_types(project_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_project ON expense_items(project_id);

-- ============================================================================
-- 11. 记录迁移
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.6.0',
  'Phase 3 - Project Advanced Features Enhancement',
  '014_phase3_project_advanced_features.sql',
  'ALTER TABLE projects DROP COLUMN remarks; DROP TABLE planning_documents CASCADE; DROP TABLE design_documents CASCADE; DROP TABLE custom_timeline_events CASCADE; DROP TABLE cost_categories CASCADE; DROP TABLE tax_types CASCADE; DROP TABLE expense_items CASCADE;'
);
