# T06 — Phase 2 验收

**任务ID**: task-phase2-T06  
**执行Agent**: 审核Agent (`minimaxai/minimax-m2.7`)  
**估时**: 4小时  
**依赖**: T01 + T02 + T03 + T04 + T05 全部完成  
**分支**: `review/phase2-T06-acceptance`  
**优先级**: 🔴 High

---

## 任务目标

对 Phase 2 的全部功能进行最终审计，重点验证移动端安全性、数据隔离和业务功能完整性。

---

## 审核重点

### 1. 移动端安全审查

```bash
# 1.1 验证移动端不泄露 service_role key
grep -r "service_role" mobile_client/
# 预期: 无结果（移动端只能用 anon key）

# 1.2 验证 JWT 存储方式
grep -r "localStorage\|sessionStorage" mobile_client/ | grep -i "token\|jwt\|key"
# 记录存储位置，评估安全性

# 1.3 验证移动端不能直接调用财务相关Function
# 尝试用 anon key 调用 approve_payment
curl -X POST "$SUPABASE_URL/functions/v1/approve_payment" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "f1111111-1111-1111-1111-111111111111", "reviewer_id": "test"}'
# 预期: 401 或 403（anon key 无 reviewer 权限）
```

### 2. 数据隔离完整性

```sql
-- 验证 Phase 2 新表全部有 RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'properties', 'property_reservations', 'property_status_history',
    'property_recommendations', 'sales_qa_sessions',
    'customer_followups', 'customer_scores',
    'ocr_jobs', 'financial_plans', 'contract_reviews', 'tax_calculations'
  );
-- 预期: 所有 rowsecurity = true

-- 验证 sales_team 对财务表仍然无权限（Phase 0 保证不被破坏）
SET ROLE sales_team;
SELECT COUNT(*) FROM payments;        -- 预期: 0
SELECT COUNT(*) FROM cost_ledger;     -- 预期: 0
SELECT COUNT(*) FROM tax_calculations; -- 预期: 0 或 ERROR
RESET ROLE;
```

### 3. 移动端功能验收

模拟走通以下流程（实际在移动端浏览器中执行，或用 curl 模拟）：

1. 登录（获取 JWT）
2. 查看今日任务列表
3. 查看房源列表（只看可售房源）
4. 查看客户详情
5. 录入一条跟进记录
6. 验证跟进记录在 DB 中存在

### 4. Phase 0/1 回归测试

确认 Phase 2 没有破坏已有功能：

```bash
# 支付Gate仍然工作
curl -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "f1111111-1111-1111-1111-111111111111"}'
# 预期: HTTP 200 + success:true

# audit_log 仍然不可修改
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE audit_log SET action = 'TAMPERED' LIMIT 1;
"
# 预期: 0 rows affected
```

---

## 验收判定规则

### 通过条件（全部满足）
- 移动端无 service_role key 泄露
- 所有 Phase 2 新表 RLS 启用
- Phase 0/1 回归测试全部通过
- 移动端销售流程端到端可走通
- 数据隔离正确（销售只看自己数据）

### 必须拒绝的条件
- 移动端代码含 service_role key
- 任何 Phase 2 新表未启用 RLS
- Phase 0 的支付Gate被破坏
- 销售可以看到其他销售的客户/跟进记录

---

## 交付物

1. **Phase 2 验收报告**: `.logs/tests/PHASE2_ACCEPTANCE_REPORT.json`
2. **工作日志**: `.logs/detailed/task-phase2-T06.json`
3. **更新 CHANGELOG**: 追加 Phase 2 验收结果
4. **Git Tag**: `v1.0.0-phase2-accepted`
5. **Git Commit**: `docs(acceptance): phase2 acceptance report [task-phase2-T06]`

---

## 项目完成后声明

Phase 2 验收通过后，审核Agent在报告中注明：

```
REDP v1.0.0 正式完成三阶段开发：
- Phase 0: 数据脊柱 + 支付Gate ✅
- Phase 1: AI合同审查 + 税金检测 ✅  
- Phase 2: 房源管理 + CRM + 维语 + 移动端 ✅

建议下一步：
1. 在实际项目中试运行（小范围pilot）
2. 收集销售团队使用反馈
3. 根据实际情况规划 Phase 3（原生App / 更多AI能力）
```
