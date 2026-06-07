# REDP Phase 1 部署与测试指南

## 已完成的工作

### T01 - AI合同审查模块
- ✅ 数据库迁移: `supabase/migrations/004_phase1_contract_review.sql`
- ✅ Edge Function: `supabase/functions/ai_contract_review/index.ts`
- ✅ 单元测试: `supabase/functions/ai_contract_review/index.test.ts`

### T02 - 土增税风险检测引擎
- ✅ 数据库迁移: `supabase/migrations/005_phase1_tax_detection.sql`
- ✅ Edge Function: `supabase/functions/tax_risk_detection/index.ts`
- ✅ 单元测试: `supabase/functions/tax_risk_detection/index.test.ts`

### T03 - 智能财务规划模块
- ✅ 数据库迁移: `supabase/migrations/006_phase1_financial_planning.sql`
- ✅ Edge Function: `supabase/functions/financial_planning/index.ts`
- ✅ 单元测试: `supabase/functions/financial_planning/index.test.ts`

### T04 - 文档OCR集成
- ✅ 数据库迁移: `supabase/migrations/007_phase1_ocr.sql`
- ✅ Edge Function: `supabase/functions/ocr_document/index.ts`
- ✅ 单元测试: `supabase/functions/ocr_document/index.test.ts`

---

## 部署步骤

### 1. 运行数据库迁移

```bash
# 确保已配置环境变量
export SUPABASE_CONNECTION_STRING="postgresql://postgres:hibbAc-bibkaj-7vyrpa@db.bdonljxgltkhbiheljdi.supabase.co:5432/postgres"

# 按顺序执行迁移文件
psql "$SUPABASE_CONNECTION_STRING" -f supabase/migrations/004_phase1_contract_review.sql
psql "$SUPABASE_CONNECTION_STRING" -f supabase/migrations/005_phase1_tax_detection.sql
psql "$SUPABASE_CONNECTION_STRING" -f supabase/migrations/006_phase1_financial_planning.sql
psql "$SUPABASE_CONNECTION_STRING" -f supabase/migrations/007_phase1_ocr.sql

# 验证迁移结果
psql "$SUPABASE_CONNECTION_STRING" -c "SELECT * FROM schema_version WHERE version_number >= '0.3.0' ORDER BY id DESC;"
```

### 2. 配置环境变量

确保 `.env` 文件包含以下配置：

```bash
# NVIDIA NIM API Key (用于AI和OCR服务)
NVIDIA_API_KEY=nvapi-xxx-your-api-key-here

# Supabase 配置（已存在）
SUPABASE_URL=https://bdonljxgltkhbiheljdi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 3. 部署 Edge Functions

```bash
# 确保已安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 部署所有函数
cd supabase/functions/ai_contract_review
supabase functions deploy --project-ref bdonljxgltkhbiheljdi

cd ../tax_risk_detection
supabase functions deploy --project-ref bdonljxgltkhbiheljdi

cd ../financial_planning
supabase functions deploy --project_ref bdonljxgltkhbiheljdi

cd ../ocr_document
supabase functions deploy --project-ref bdonljxgltkhbiheljdi
```

或者使用自动部署脚本：
```bash
./scripts/deploy_phase1.sh
```

### 4. 运行测试

```bash
# 确保已配置环境变量
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 运行测试脚本
./scripts/run_tests.sh

# 或手动测试
curl -X POST "https://bdonljxgltkhbiheljdi.supabase.co/functions/v1/ai_contract_review" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contract_id": "<your-test-contract-id>"}'
```

---

## 验证清单

### T01 - AI合同审查
- [ ] `contract_reviews` 表创建成功
- [ ] 能够插入审查记录
- [ ] AI 能返回结构化的 risk_level, risk_score, key_findings

### T02 - 土增税检测
- [ ] `tax_calculations` 表创建成功
- [ ] 四档税率计算正确（测试案例：30%, 80%, 150% 增值率）
- [ ] risk_level 正确映射到增值率

### T03 - 财务规划
- [ ] `financial_plans` 表创建成功
- [ ] 现金流预测数据一致 (inflow - outflow = net_flow)
- [ ] 支付建议包含 reason 和 priority 字段

### T04 - OCR 文档
- [ ] `cost_ledger.ocr_extracted_data` 列存在
- [ ] `cost_ledger.ocr_status` 列存在
- [ ] 能够调用 OCR API 并提取发票信息

---

## 常见问题

### Q1: Supabase CLI 安装失败
A: 可以使用 Docker 版本：`docker run --rm -v $(pwd):/app supabase/cli deploy`

### Q2: NVIDIA API 调用失败
A: 检查 API Key 是否有效，访问 https://build.nvidia.com/ 获取 key

### Q3: 迁移脚本执行错误
A: 可以手动执行 SQL 文件中的 DDL 语句，确保按顺序执行
