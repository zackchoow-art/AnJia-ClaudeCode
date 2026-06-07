# T04 — 文档OCR集成

**任务ID**: task-phase1-T04  
**执行Agent**: 全栈标准Agent (`minimaxai/minimax-m2.7`)  
**估时**: 6小时  
**依赖**: Phase 0 验收通过（与T01/T02并行）  
**分支**: `feature/phase1-T04-document-ocr`  
**优先级**: 🟡 Medium

---

## 任务目标

实现发票/收据的OCR识别功能：用户上传图片，系统自动提取发票号码、金额、日期等关键字段，并与 `cost_ledger` 记录对应。减少手动录入错误。

---

## 执行边界

### 允许的操作
- 新建 `supabase/functions/ocr_document/index.ts`
- 使用 Nvidia NIM 视觉模型（`nvidia/nemotron-3-super-120b-a12b` 或 multimodal 模型）
- 在 `cost_ledger` 表新增 `ocr_extracted_data` JSONB 列（已有 `receipt_filename` 字段）
- 使用 Supabase Storage 存储上传的文件（如项目中已配置）

### 禁止的操作
- 不得直接写入 `cost_ledger.invoice_number` 等字段（OCR 结果需人工确认）
- 不得修改已存在的 cost_ledger 记录的核心字段
- 不得引入外部 OCR 服务（使用 Nvidia NIM 多模态能力）

---

## 数据库变更

```sql
-- supabase/migrations/007_phase1_ocr.sql

-- 在 cost_ledger 表新增 OCR 结果列
ALTER TABLE cost_ledger
  ADD COLUMN IF NOT EXISTS ocr_extracted_data JSONB,
  /*
  {
    "invoice_number": "INV-2026-001",
    "invoice_date": "2026-06-01",
    "vendor_name": "新疆建材公司",
    "total_amount": 85000.00,
    "tax_amount": 11050.00,
    "items": [{"description": "水泥", "qty": 100, "unit_price": 850, "amount": 85000}],
    "ocr_confidence": 0.92,
    "ocr_model": "nvidia/nemotron-3-super-120b-a12b",
    "needs_review": false
  }
  */
  ADD COLUMN IF NOT EXISTS ocr_status TEXT DEFAULT 'NOT_PROCESSED'
    CHECK (ocr_status IN ('NOT_PROCESSED', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW'));

-- 新增 OCR 任务记录表（可选，用于追踪批量处理）
CREATE TABLE IF NOT EXISTS ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_ledger_id UUID REFERENCES cost_ledger(id),
  file_path TEXT NOT NULL,
  job_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (job_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  ocr_result JSONB,
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ocr_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ocr_jobs_finance_all ON ocr_jobs
  FOR ALL TO finance USING (true) WITH CHECK (true);
```

---

## Edge Function 实现

### 文件: `supabase/functions/ocr_document/index.ts`

**输入（multipart/form-data 或 JSON）**:
```typescript
interface OCRRequest {
  cost_ledger_id?: string;   // 关联现有记录
  file_base64?: string;      // base64编码的图片（JPEG/PNG/PDF第一页）
  file_url?: string;         // 或者提供文件URL（Supabase Storage URL）
}
```

**业务逻辑**:
1. 验证输入（文件大小 ≤ 10MB，格式为 JPEG/PNG）
2. 构建 Vision Prompt，发送到 Nvidia NIM 多模态模型
3. 解析 AI 返回的结构化数据
4. 计算置信度（ocr_confidence）
5. 如果置信度 < 0.8，设置 `needs_review = true`
6. 保存提取结果到 `cost_ledger.ocr_extracted_data`
7. 更新 `cost_ledger.ocr_status = 'COMPLETED'`
8. 返回提取结果，并附带"建议填写"的字段映射

**Vision Prompt 模板**:
```
请分析这张中国发票/收据图片，提取以下信息并以JSON格式返回：
- invoice_number: 发票号码
- invoice_date: 开票日期 (YYYY-MM-DD格式)
- vendor_name: 销售方名称
- total_amount: 价税合计金额（数字）
- tax_amount: 税额（数字，如有）
- items: 商品明细列表
- confidence: 整体识别置信度(0-1)

如果某字段无法识别，用null表示。只返回JSON，不要其他文字。
```

---

## 验收标准

| 检查项 | 标准 | 必须/建议 |
|--------|------|---------|
| OCR Function 部署成功 | HTTP 200 | 必须 |
| 对测试发票图片能提取字段 | invoice_number / total_amount 有值 | 必须 |
| 低置信度触发 needs_review | confidence<0.8 时 needs_review=true | 必须 |
| cost_ledger 记录被更新 | ocr_status = COMPLETED | 必须 |
| 不覆盖已人工验证的字段 | verification_status=VERIFIED 的记录 OCR只更新 ocr_extracted_data | 必须 |
| 单元测试（mock AI响应） | ≥ 80% | 必须 |

---

## 交付物

1. `supabase/functions/ocr_document/index.ts`
2. `supabase/functions/ocr_document/index.test.ts`（使用 mock AI 响应）
3. `supabase/functions/ocr_document/deno.json`
4. `supabase/migrations/007_phase1_ocr.sql`
5. `.logs/detailed/task-phase1-T04.json`
6. **Git Commit**: `feat(phase1): implement invoice ocr extraction using nvidia nim [task-phase1-T04]`
