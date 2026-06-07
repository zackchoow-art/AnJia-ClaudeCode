# Phase 1 任务概述

**目标**: 在 Phase 0 数据脊柱基础上，增加 AI 驱动的合同审查、税金风险检测和文档智能处理能力  
**启动前提**: Phase 0 验收通过（T06 overall_verdict = APPROVED）  
**计划周期**: 2026-08 至 2026-10（约3个月）  
**核心价值**: 从数据记录系统升级为智能辅助决策系统

---

## 任务依赖图

```
Phase 0 验收通过
       │
       ├──→ T01 AI合同审查模块
       │         │
       │         └──→ T05 Phase 1 验收 ←─────────────────────┐
       │                                                       │
       ├──→ T02 土增税风险检测引擎                              │
       │         │                                             │
       │         └──→ T03 智能财务规划（依赖 T02 的检测结果）──┘
       │
       └──→ T04 文档OCR集成（相对独立）
```

**并行可行**: T01、T02、T04 可以并行  
**串行必须**: T03 依赖 T02；T05 依赖所有前置任务

---

## 任务清单

| ID | 任务名称 | 执行Agent | 估时 | 依赖 | 优先级 |
|----|---------|----------|------|------|--------|
| T01 | AI合同审查模块 | 全栈资深 + 数据分析 | 16h | Phase 0 通过 | 🔴 High |
| T02 | 土增税风险检测引擎 | 全栈资深 | 12h | Phase 0 通过 | 🔴 High |
| T03 | 智能财务规划模块 | 全栈标准 + 数据分析 | 8h | T02 | 🟡 Medium |
| T04 | 文档OCR集成 | 全栈标准 | 6h | Phase 0 通过 | 🟡 Medium |
| T05 | Phase 1 验收 | 审核Agent | 4h | T01+T02+T03+T04 | 🔴 High |

**总估时**: 约46小时（串行）；并行优化后约28小时

---

## Phase 1 技术约束

1. **
2. **Edge Functions 扩展**: 新功能以新的 Edge Function 形式添加，不修改 Phase 0 的 4 个已有 Function
3. **数据库向前兼容**: Phase 1 的 schema 变更必须是增量的（新增列/表），不修改 Phase 0 的表结构
4. **迁移文件编号**: 从 `004_phase1_*.sql` 开始，不覆盖 001-003
5. **RLS 延续**: 所有新表必须启用 RLS，角色权限延续 Phase 0 的设计

---

## Phase 1 成功定义

- [ ] AI合同审查能识别合同中的关键风险条款（准确率 ≥ 85%）
- [ ] 土增税检测能自动计算当前项目的税负估算
- [ ] 财务规划模块能基于项目进度生成支付建议
- [ ] OCR能从上传的发票图片中提取关键字段
- [ ] 所有新 Edge Functions P95 延迟 < 2000ms（AI推理允许更长）
- [ ] 审核Agent出具 overall_verdict=APPROVED

---

## 详细任务文件

- `tasks/phase1/T01_ai_contract_review.md`
- `tasks/phase1/T02_tax_risk_detection.md`
- `tasks/phase1/T03_financial_planning.md`
- `tasks/phase1/T04_document_ocr.md`
- `tasks/phase1/T05_phase1_acceptance.md`
