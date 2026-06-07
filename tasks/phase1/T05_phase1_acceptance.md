# T05 — Phase 1 验收

**任务ID**: task-phase1-T05  
**执行Agent**: 审核Agent (`minimaxai/minimax-m2.7`)  
**估时**: 4小时  
**依赖**: T01 + T02 + T03 + T04 全部完成且通过  
**分支**: `review/phase1-T05-acceptance`  
**优先级**: 🔴 High

---

## 任务目标

对 Phase 1 的4个新模块进行独立审计，确认 AI 功能符合业务需求，数据库向前兼容，安全策略一致。

---

## 审核重点

### 1. 数据库向前兼容性

```bash
# 验证 Phase 0 的12张核心表结构未被修改
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('projects','customers','contracts','payments','cost_ledger','approval_gates')
  ORDER BY table_name, ordinal_position;
" > /tmp/phase1_schema_check.txt

# 与 Phase 0 基线对比（手动确认无删除/类型变更）
```

### 2. AI功能质量验证

```bash
# 2.1 合同审查：对种子合同执行
curl -X POST "$SUPABASE_URL/functions/v1/ai_contract_review" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contract_id": "c1111111-1111-1111-1111-111111111111"}'

# 验证结果有实质内容
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT risk_level, risk_score, jsonb_array_length(key_findings) as findings
  FROM contract_reviews ORDER BY created_at DESC LIMIT 1;
"
# 预期: risk_level 非null，findings > 0

# 2.2 税务检测：对种子项目执行
curl -X POST "$SUPABASE_URL/functions/v1/tax_risk_detection" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "a1111111-1111-1111-1111-111111111111"}'

# 验证计算逻辑
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT appreciation_rate, tax_bracket, calculated_tax, risk_level
  FROM tax_calculations ORDER BY calculated_at DESC LIMIT 1;
"
```

### 3. 新增表的RLS策略验证

```sql
-- 验证所有Phase 1新表都有RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('contract_reviews', 'tax_calculations', 'financial_plans', 'ocr_jobs');
-- 预期: 所有 rowsecurity = true

-- 验证 sales_team 对新表无访问权限
SET ROLE sales_team;
SELECT COUNT(*) FROM contract_reviews;  -- 预期: 0 或 ERROR
SELECT COUNT(*) FROM tax_calculations;  -- 预期: 0 或 ERROR
RESET ROLE;
```

### 4. 代码审查清单

对 T01-T04 的每个 Edge Function:
- [ ] 无 `any` 类型
- [ ] 错误处理完整
- [ ] AI 调用有超时处理（< 30s timeout）
- [ ] AI 响应解析失败时有优雅降级
- [ ] 敏感信息（API key）从环境变量读取

---

## 验收判定规则

### 通过条件（全部满足）
- Phase 0 核心表结构无变更
- 4个新 Function 均可成功调用
- AI 输出有实质内容（非空、有结构）
- 所有新表 RLS 启用且策略正确
- sales_team 对新表无权限

### 必须拒绝的条件
- Phase 0 核心表有非增量变更（删列/改类型）
- 任何新表未启用 RLS
- AI 调用无超时处理（可能导致 Function 挂起）
- service_role key 硬编码在代码中

---

## 交付物

1. **Phase 1 验收报告**: `.logs/tests/PHASE1_ACCEPTANCE_REPORT.json`
2. **工作日志**: `.logs/detailed/task-phase1-T05.json`
3. **更新 CHANGELOG**: 追加 Phase 1 验收结果
4. **Git Commit**: `docs(acceptance): phase1 acceptance report [task-phase1-T05]`
