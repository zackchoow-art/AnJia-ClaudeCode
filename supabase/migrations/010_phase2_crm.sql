-- ============================================================================
-- REDP Phase 2: Customer CRM Enhancement (T03)
-- Created: 2026-06-07
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- MODIFY TABLE: customers
-- Add CRM-related columns
-- ============================================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS interested_property_ids UUID[],
  ADD COLUMN IF NOT EXISTS latest_followup_date DATE,
  ADD COLUMN IF NOT EXISTS latest_intent_score INTEGER,
  ADD COLUMN IF NOT EXISTS funnel_stage TEXT DEFAULT 'INITIAL'
    CHECK (funnel_stage IN (
      'INITIAL',
      'CONTACTED',
      'INTERESTED',
      'NEGOTIATING',
      'DECISION',
      'CLOSED_WON',
      'CLOSED_LOST'
    ));

-- ============================================================================
-- NEW TABLE: customer_followups (跟进记录)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_agent_id TEXT NOT NULL,

  followup_type TEXT NOT NULL
    CHECK (followup_type IN ('CALL', 'VISIT', 'WECHAT', 'EMAIL', 'SITE_VISIT')),
  followup_content TEXT NOT NULL,
  customer_response TEXT,
  next_action TEXT,
  next_followup_date DATE,

  -- 意向变化
  intent_before TEXT,
  intent_after TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NEW TABLE: customer_scores (意向评分)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_agent_id TEXT NOT NULL,

  intent_score INTEGER CHECK (intent_score BETWEEN 1 AND 10),
  -- 1-3: 低意向  4-6: 中意向  7-10: 高意向

  score_factors JSONB DEFAULT '{}',
  -- {"budget_match": 8, "urgency": 6, "decision_power": 7}

  scored_by TEXT NOT NULL,
  CHECK (scored_by IN ('SALES', 'AI_SYSTEM')),

  scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE customer_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_scores ENABLE ROW LEVEL SECURITY;

-- sales_team 只能访问自己的跟进记录
CREATE POLICY IF NOT EXISTS followups_sales_own ON customer_followups
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true))
  WITH CHECK (sales_agent_id = current_setting('app.current_user_id', true));

CREATE POLICY IF NOT EXISTS scores_sales_own ON customer_scores
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true))
  WITH CHECK (sales_agent_id = current_setting('app.current_user_id', true));

-- project_manager 全权管理
CREATE POLICY IF NOT EXISTS followups_pm_all ON customer_followups
  FOR ALL TO project_manager USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS scores_pm_all ON customer_scores
  FOR ALL TO project_manager USING (true) WITH CHECK (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_followups_customer ON customer_followups(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_followups_agent ON customer_followups(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_followups_next_date ON customer_followups(next_followup_date)
  WHERE next_followup_date >= CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_scores_customer ON customer_scores(customer_id, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_agent ON customer_scores(sales_agent_id);

-- ============================================================================
-- FUNCTION: update_latest_followup
-- 更新 customers 表的 latest_followup_date 字段
-- ============================================================================

CREATE OR REPLACE FUNCTION update_customers_latest_followup()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET
    latest_followup_date = NEW.next_followup_date,
    latest_intent_score = NULLIF(NEW.intent_after, '')::INTEGER,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: on_followup_insert
-- ============================================================================

DROP TRIGGER IF EXISTS on_followup_insert ON customer_followups;
CREATE TRIGGER on_followup_insert
  AFTER INSERT ON customer_followups
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_latest_followup();

-- ============================================================================
-- FUNCTION: update_funnel_stage_trigger_fn
-- 自动更新销售漏斗阶段
-- ============================================================================

CREATE OR REPLACE FUNCTION update_funnel_stage_based_on_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.intent_score >= 7 THEN
    NEW.funnel_stage = 'INTERESTED';
  ELSIF NEW.intent_score >= 4 THEN
    NEW.funnel_stage = 'CONTACTED';
  ELSE
    NEW.funnel_stage = COALESCE(NEW.funnel_stage, 'INITIAL');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_followup_count_by_type
-- 统计跟进类型分布（用于项目管理）
-- ============================================================================

CREATE OR REPLACE FUNCTION get_followup_stats(project_id UUID)
RETURNS TABLE (
  followup_type TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.followup_type,
    COUNT(*)::BIGINT AS count,
    ROUND((COUNT(*)::NUMERIC / NULLIF(SUM(COUNT(*)) OVER(), 0) * 100), 2)::NUMERIC AS percentage
  FROM customer_followups f
  INNER JOIN customers c ON f.customer_id = c.id
  WHERE c.project_id = project_id
  GROUP BY f.followup_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.4.1',
  'Phase 2 - Customer CRM Enhancement (T03)',
  '010_phase2_crm.sql',
  'ALTER TABLE customers DROP COLUMN interested_property_ids, DROP COLUMN latest_followup_date, DROP COLUMN latest_intent_score, DROP COLUMN funnel_stage; DROP TABLE customer_scores CASCADE; DROP TABLE customer_followups CASCADE;'
);
