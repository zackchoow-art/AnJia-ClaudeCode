# T04 — 维语支持

**任务ID**: task-phase2-T04  
**执行Agent**: 全栈资深Agent (`qwen/qwen3-coder-480b-a35b-instruct`)  
**估时**: 12小时  
**依赖**: T01（房源）+ T03（CRM）基本完成  
**分支**: `feature/phase2-T04-uyghur-support`  
**优先级**: 🟡 Medium

---

## 任务目标

为系统关键界面和数据字段增加维吾尔语（维语）支持。维语是喀什的主要语言，目标客户群体中有大量维语用户。

---

## 执行边界

### 允许的操作
- 在现有 JSONB 字段中增加 `ug` 键（不修改现有中文数据）
- 新建翻译辅助 Edge Function
- 为 API 响应增加 `Accept-Language` 头支持

### 禁止的操作
- 不得删除或覆盖现有中文数据
- 不得引入强制双语（维语字段保持可选）
- 不得在数据库层强制 NOT NULL 约束（避免现有数据失效）

---

## 实现策略

### 策略: JSONB双语字段

对于需要显示给用户的字段，采用 JSONB 双语格式：

```json
{
  "zh": "三室两厅",
  "ug": "3 ئۆي 2 مەيدان"
}
```

**涉及字段**（新增维语键）:
- `properties.property_type`: `{"zh": "三室两厅", "ug": "..."}`
- `properties.features`: `[{"zh": "学区房", "ug": "..."}, ...]`
- `customers.commitments_made[].content`: 承诺内容加维语版本
- `contracts.key_terms_json`: 关键条款加维语摘要

---

## 翻译辅助 Edge Function

### 文件: `supabase/functions/translate_text/index.ts`

**用途**: 将中文文本翻译成维语，用于内容录入时的辅助翻译

**输入**:
```typescript
interface TranslateRequest {
  text: string;           // 待翻译的中文文本
  target_lang: 'ug';     // 目标语言（目前只支持维语）
  context?: string;       // 上下文（如 "房产描述"、"合同条款"）
}
```

**AI Prompt**:
```
你是维吾尔语翻译专家，请将以下中文房地产相关文本翻译成维吾尔语（使用阿拉伯文字写法）。
保持专业准确，尽量使用当地习惯用法。

上下文: {context}
中文原文: {text}

只返回翻译结果，不要解释。
```

**注意**: Qwen 系列模型对维语有一定支持，但翻译质量需人工复核。

---

## API多语言支持

在所有返回用户可见文本的 Edge Function 中，增加语言选择：

```typescript
// 读取请求头
const lang = req.headers.get('Accept-Language')?.startsWith('ug') ? 'ug' : 'zh';

// 对 JSONB 双语字段，返回对应语言
function getLocalizedText(field: {zh: string; ug?: string}, lang: string): string {
  if (lang === 'ug' && field.ug) return field.ug;
  return field.zh;
}
```

---

## 维语技术注意事项

1. **文字方向**: 维语（UG）使用从右到左（RTL）书写，前端需设置 `dir="rtl"`
2. **字符编码**: 维语使用 UTF-8，PostgreSQL 完全支持，无需特殊处理
3. **字体**: 前端需引入维语字体（如 Noto Naskh Arabic 或 UKIJ 系列）
4. **输入法**: 移动端需支持维语键盘，不在本任务范围内

---

## 验收标准

| 检查项 | 标准 | 必须 |
|--------|------|------|
| translate_text Function 可调用 | HTTP 200 + 有翻译结果 | 必须 |
| 翻译结果是有效维语 | 包含阿拉伯文字符（非乱码） | 必须 |
| API 支持 Accept-Language: ug | 返回维语版本 | 必须 |
| 现有中文数据未被覆盖 | zh 字段值不变 | 必须 |
| properties.property_type 有双语 | 测试数据中有 ug 键 | 建议 |

---

## 交付物

1. `supabase/functions/translate_text/index.ts` + test
2. `supabase/migrations/011_phase2_i18n.sql`（无结构变更，只更新测试数据）
3. **维语测试数据**: 更新 seed_data.sql 中 properties 的 property_type 字段加入维语
4. `.logs/detailed/task-phase2-T04.json`
5. **Git Commit**: `feat(phase2): add uyghur language support for key fields [task-phase2-T04]`
