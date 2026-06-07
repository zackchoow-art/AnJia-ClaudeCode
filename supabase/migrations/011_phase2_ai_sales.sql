-- ============================================================================
-- REDP Phase 2: Sales AI Enhancement (T02)
-- Created: 2026-06-07
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- NEW TABLE: property_recommendations (推荐记录)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_agent_id TEXT NOT NULL,

  -- 推荐输入
  customer_budget_min NUMERIC(15,2),
  customer_budget_max NUMERIC(15,2),
  customer_preferences JSONB,

  -- 推荐结果
  recommended_property_ids UUID[] NOT NULL,
  recommendation_scores JSONB,
  -- [{"property_id": "uuid", "score": 0.95, "reasons": ["学区好", "价格合理"]}]
  -- reasons 支持双语: {"zh": ["学区好"], "ug": ["مەكتەپ يaqىنلىقىدا"]}

  ai_model TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NEW TABLE: sales_qa_sessions (QA记录 - 脱敏)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_qa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_agent_id TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_count INTEGER DEFAULT 0,
  categories JSONB DEFAULT '[]',
  -- ["付款方式", "合同条款", "政策"]
  answers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NEW TABLE: sales_qa_questions (详细问题记录)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sales_qa_sessions(id) ON DELETE CASCADE,
  question_hash TEXT NOT NULL,  -- MD5 hash for deduplication
  question_category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NEW TABLE: property_recommendation_details (推荐详情展开表)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_recommendation_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES property_recommendations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  score NUMERIC(3,2) CHECK (score BETWEEN 0 AND 1),
  reasons_zh TEXT[],
  reasons_ug TEXT[],
  rank INTEGER
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE property_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_qa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_recommendation_details ENABLE ROW LEVEL SECURITY;

-- Sales team can only see their own recommendations and QA sessions
CREATE POLICY IF NOT EXISTS recommendations_sales_own ON property_recommendations
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true));

CREATE POLICY IF NOT EXISTS qa_sessions_sales_own ON sales_qa_sessions
  FOR ALL TO sales_team
  USING (sales_agent_id = current_setting('app.current_user_id', true));

CREATE POLICY IF NOT EXISTS qa_questions_sales_own ON sales_qa_questions
  FOR ALL TO sales_team
  USING (
    EXISTS (
      SELECT 1 FROM sales_qa_sessions s
      WHERE s.id = sales_qa_questions.session_id
        AND s.sales_agent_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY IF NOT EXISTS recommendation_details_sales_own ON property_recommendation_details
  FOR ALL TO sales_team
  USING (
    EXISTS (
      SELECT 1 FROM property_recommendations r
      WHERE r.id = property_recommendation_details.recommendation_id
        AND r.sales_agent_id = current_setting('app.current_user_id', true)
    )
  );

-- Project manager has full access
CREATE POLICY IF NOT EXISTS recommendations_pm_all ON property_recommendations
  FOR ALL TO project_manager USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS qa_sessions_pm_all ON sales_qa_sessions
  FOR ALL TO project_manager USING (true) WITH CHECK (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_recommendations_customer ON property_recommendations(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_agent ON property_recommendations(sales_agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_agent ON sales_qa_sessions(sales_agent_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_qa_questions_session ON sales_qa_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_hash ON sales_qa_questions(question_hash);

-- ============================================================================
-- FUNCTION: calculate_recommendation_score
-- AI 推荐引擎评分函数（简化版，实际由 AI 服务计算）
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_property_score(
  property JSONB,
  customer_preferences JSONB
) RETURNS NUMERIC(3,2) AS $$
DECLARE
  score NUMERIC(3,2) := 0;
  budget_max NUMERIC(15,2);
  budget_min NUMERIC(15,2);
  prop_price NUMERIC(15,2);
BEGIN
  -- Get customer preferences
  budget_max := COALESCE(customer_preferences->>'budget_max'::text, '999999999')::numeric;
  budget_min := COALESCE(customer_preferences->>'budget_min'::text, '0')::numeric;

  -- Get property price
  prop_price := COALESCE(property->>'list_price', property->>'final_price')::numeric;

  -- Budget match score (40% weight)
  IF prop_price <= budget_max THEN
    score := score + 40;
    -- Additional points for being well under budget
    IF prop_price < budget_min * 1.2 THEN
      score := score + 10;  -- Bonus for affordable properties
    END IF;
  ELSE
    RETURN 0;  -- Property is out of budget
  END IF;

  -- Property type match (30% weight)
  IF property->>'property_type' ? 'zh' AND customer_preferences->>'preferred_types' IS NOT NULL THEN
    -- Check if property type matches preferences
    score := score + 30;
  ELSE
    score := score + 15;  -- Partial credit for no specific preference
  END IF;

  -- Location/feature bonus (30% weight)
  -- Simple implementation - in real app, would check features match
  score := score + 20;

  RETURN LEAST(score, 100)::NUMERIC(3,2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: create_qa_session
-- 创建新的 QA 会话记录
-- ============================================================================

CREATE OR REPLACE FUNCTION create_qa_session(sales_agent_id TEXT)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO sales_qa_sessions (sales_agent_id, questions_count, answers_count)
  VALUES (sales_agent_id, 0, 0)
  RETURNING id INTO session_id;

  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: log_qa_question
-- 记录 QA 问题（去重）
-- ============================================================================

CREATE OR REPLACE FUNCTION log_qa_question(
  p_session_id UUID,
  p_question TEXT,
  p_category TEXT DEFAULT 'general'
)
RETURNS UUID AS $$
DECLARE
  question_hash TEXT;
  existing_id UUID;
  new_id UUID;
BEGIN
  -- Calculate hash for deduplication
  question_hash := md5(lower(p_question));

  -- Check if already exists in this session
  SELECT id INTO existing_id
  FROM sales_qa_questions
  WHERE question_hash = question_hash AND session_id = p_session_id;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  -- Insert new question
  INSERT INTO sales_qa_questions (session_id, question_hash, question_category)
  VALUES (p_session_id, question_hash, p_category)
  RETURNING id INTO new_id;

  -- Update session counts
  UPDATE sales_qa_sessions
  SET questions_count = questions_count + 1
  WHERE id = p_session_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.4.2',
  'Phase 2 - Sales AI Enhancement (T02)',
  '011_phase2_ai_sales.sql',
  'DROP TABLE property_recommendation_details CASCADE; DROP TABLE sales_qa_questions CASCADE; DROP TABLE sales_qa_sessions CASCADE; DROP TABLE property_recommendations CASCADE;'
);
