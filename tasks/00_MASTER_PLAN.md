# REDP 开发计划执行总表

**项目**: Real Estate Development Platform (REDP) — 喀什第三期住宅项目  
**制定日期**: 2026-06-06  
**当前状态**: Phase 0 基础设施已部署完成，进入任务执行阶段  
**执行主体**: Hermes Multi-Agent System (8个Agent)  
**验收责任人**: Zack (项目负责人)

---

## 部署现状确认

Phase 0 基础设施于 2026-06-04 全量部署完成：

| 组件 | 状态 | 备注 |
|------|------|------|
| 12张数据库表 | ✅ 已部署 | Supabase PostgreSQL |
| 44条RLS策略 | ✅ 已激活 | 6个角色完整 |
| 4个Edge Functions | ✅ 已部署验证 | validate/approve/audit/lock |
| 测试种子数据 | ✅ 已加载 | 1项目/2客户/1合同/1支付 |
| Git hooks | ✅ 已配置 | pre-commit + post-commit |
| Nvidia NIM API | ✅ 已连通 | 8个模型可用 |
| Worktree协调机制 | ✅ 已验证 | scripts/create_worktree.sh |

---

## 三阶段总体路线图

```
Phase 0 (当前 → 2026-07-31)
数据脊柱 + 支付Gate完整验证
────────────────────────────────────────
  T01 系统完整性验证         [测试Agent]
  T02 支付Gate端到端测试     [测试Agent]
  T03 RLS安全测试            [测试Agent + 审核Agent]
  T04 Agent协同机制验证      [全栈资深]
  T05 性能基准测试           [测试Agent]
  T06 Phase 0 完整验收       [审核Agent]

Phase 1 (2026-08 → 2026-10)
AI合同审查 + 税金检测
────────────────────────────────────────
  T01 AI合同审查模块         [全栈资深 + 数据分析]
  T02 土增税风险检测引擎     [全栈资深]
  T03 智能财务规划模块       [全栈标准 + 数据分析]
  T04 文档OCR集成            [全栈标准]
  T05 Phase 1 验收           [审核Agent]

Phase 2 (2026-11 → 2027-03)
房源管理 + CRM + 移动端
────────────────────────────────────────
  T01 房源库存管理模块       [全栈标准]
  T02 销售AI助手             [全栈资深 + 数据分析]
  T03 客户CRM                [全栈标准]
  T04 维语支持               [全栈资深]
  T05 移动客户端             [UI设计 + 全栈标准]
  T06 Phase 2 验收           [审核Agent]
```

---

## Agent能力矩阵快查

| Agent | 模型 | 适用任务 | 时间上限/任务 |
|-------|------|---------|--------------|
| 项目总指挥 | qwen3-coder-480b | 需求分析、任务拆分、调度决策 | 无限制 |
| 全栈(资深) | qwen3-coder-480b | 复杂业务逻辑、架构设计、RLS | 16h |
| 全栈(标准) | minimax-m2.7 | 常规CRUD、工具函数、文档 | 8h |
| 全栈(助手) | nemotron-30b-nano | 辅助工具、格式转换、脚本 | 4h |
| 数据分析 | nemotron-30b-nano | 数据查询、报表、指标分析 | 4h |
| UI设计 | nemotron-120b-super | 界面设计、交互流程、原型 | 8h |
| 测试 | nemotron-120b-super | 单元/集成/E2E/性能/安全测试 | 6h |
| 审核 | minimax-m2.7 | 代码审查、安全审计、验收 | 4h |

---

## 全局执行规则

### 不可逾越的边界
1. **测试先行**: 无测试的代码不得合并，审核Agent强制执行
2. **审核必须通过**: review_status=approved 才能触发 merge
3. **audit_log不可修改**: 任何绕过此约束的代码立即拒绝
4. **销售隔离**: 任何让 sales_team 访问 payments/cost_ledger 的改动立即拒绝
5. **Commit格式**: `type(scope): subject [task-id]` — post-commit hook依赖此格式

### 任务依赖规则
- `depends_on` 列出的任务未完成前，不启动本任务
- worktree 分支命名: `feature/<phase>-<task-short-name>`
- 任务文件存储: `.redp/tasks/active/task-<id>.json`
- 完成后归档: `.redp/tasks/completed/`

### 工作日志要求
每个任务完成后必须在 `.logs/detailed/task-<id>.json` 中记录:
- 完成的内容
- 遇到的问题和解决方案
- 测试结果摘要
- 耗时统计

---

## 文件索引

| 文件 | 内容 |
|------|------|
| `tasks/phase0/00_PHASE0_OVERVIEW.md` | Phase 0 概述与任务依赖图 |
| `tasks/phase0/T01_verify_deployment.md` | 系统完整性验证任务 |
| `tasks/phase0/T02_payment_gate_test.md` | 支付Gate端到端测试 |
| `tasks/phase0/T03_security_rls_test.md` | RLS安全测试 |
| `tasks/phase0/T04_agent_orchestration.md` | Agent协同机制验证 |
| `tasks/phase0/T05_performance_benchmark.md` | 性能基准测试 |
| `tasks/phase0/T06_phase0_acceptance.md` | Phase 0完整验收 |
| `tasks/phase1/00_PHASE1_OVERVIEW.md` | Phase 1 概述 |
| `tasks/phase1/T01_ai_contract_review.md` | AI合同审查模块 |
| `tasks/phase1/T02_tax_risk_detection.md` | 税金风险检测引擎 |
| `tasks/phase1/T03_financial_planning.md` | 智能财务规划 |
| `tasks/phase1/T04_document_ocr.md` | 文档OCR集成 |
| `tasks/phase1/T05_phase1_acceptance.md` | Phase 1验收 |
| `tasks/phase2/00_PHASE2_OVERVIEW.md` | Phase 2 概述 |
| `tasks/phase2/T01_property_inventory.md` | 房源库存管理 |
| `tasks/phase2/T02_sales_ai.md` | 销售AI助手 |
| `tasks/phase2/T03_crm.md` | 客户CRM |
| `tasks/phase2/T04_uyghur_support.md` | 维语支持 |
| `tasks/phase2/T05_mobile_client.md` | 移动客户端 |
| `tasks/phase2/T06_phase2_acceptance.md` | Phase 2验收 |
