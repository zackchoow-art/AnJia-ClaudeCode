# 00 文件包总览 (v2.0.0)

**安家地产管理系统 - Admin Portal**

---

## 🎯 这个文件包是什么

针对房地产开发项目管理的需求，这个文件包包含:

1. **完整的 Admin Portal 前端系统** - 基于 React + TypeScript 的现代化管理后台
2. **Hermes 多 Agent 系统** - 8 个 Nvidia NIM Agent 协同工作
3. **支付审批 Gate 核心** - 解决 5 大业务痛点的核心机制
4. **完整的工作日志体系** - Git + Supabase 双备份

---

## 📊 v2.0.0 的改进

| 类别 | v0.x (stitch) | v2.0.0 (admin_portal) |
|------|---------------|----------------------|
| 目录结构 | `stitch` | `admin_portal` |
| 文档位置 | 分散 | 集中到 docs/ |
| 路由系统 | 手写路由 | React Router v7 |
| UI 框架 | Tailwind CSS | Tailwind CSS + motion |

---

## 📁 文件包内容(共 39 个文件)

### 核心文档(12 个)
- `00_PACKAGE_SUMMARY.md` ← 本文件
- `README.md` - 项目入口
- `DEPLOYMENT_GUIDE.md` - 部署指南(11 步)
- `ARCHITECTURE.md` - 系统架构
- `DATA_SCHEMA.md` - 数据库设计
- `CODE_STANDARDS.md` - 代码规范
- `WORK_LOG_SPEC.md` - 工作日志规范
- `HERMES_AGENT_TEMPLATES.md` - Agent 任务模板
- `TESTING_SPEC.md` ⭐ - 测试规范
- `E2E_EXAMPLE.md` ⭐ - 端到端示例
- `AGENT_RESILIENCE.md` ⭐ - 容错机制
- `CROSS_PLATFORM.md` ⭐ - 跨平台兼容

### SQL 文件(4 个)
- `supabase/migrations/001_initial_schema.sql` - 11 张表
- `supabase/migrations/002_rls_policies.sql` - 角色+RLS
- `supabase/migrations/003_indexes_constraints.sql` - 索引
- `supabase/seed_data.sql` ⭐ - 测试数据

### Edge Functions(7 个 TS 文件)
- `supabase/functions/_shared/types.ts`
- `supabase/functions/_shared/errors.ts`
- `supabase/functions/_shared/supabase_client.ts`
- `supabase/functions/validate_payment/index.ts` ⭐
- `supabase/functions/approve_payment/index.ts` ⭐
- `supabase/functions/audit_log/index.ts` ⭐
- `supabase/functions/create_task_lock/index.ts` ⭐

### 配置文件(2 个+ 4 个 deno.json)
- `git_setup/.env.example`
- `git_setup/.gitignore`
- 4 个 `deno.json` (每个 function 一个)

### 脚本(7 个)
- `git_setup/hooks/post-commit` ⭐
- `git_setup/hooks/pre-commit` ⭐
- `scripts/init_project.sh` ⭐
- `scripts/generate_changelog.sh` ⭐
- `scripts/create_worktree.sh` ⭐
- `scripts/merge_worktree.sh` ⭐
- `scripts/cleanup_locks.sh` ⭐

### Agent Prompts(8 个)
- `prompts/01_commander.md`
- `prompts/02_data_analyst.md`
- `prompts/03_ui_designer.md`
- `prompts/04_fullstack_standard.md`
- `prompts/05_fullstack_senior.md` ⭐
- `prompts/06_fullstack_assistant.md`
- `prompts/07_reviewer.md`
- `prompts/08_tester.md`

⭐ = v2.0.0 新增或大幅完善

---

## 🚀 给 Claude Code 的执行指令

```bash
# Step 1: 进入 admin_portal 目录
cd admin_portal

# Step 2: 安装依赖
npm install

# Step 3: 本地运行
npm run dev

# Step 4: 部署到 Supabase
bash ../scripts/init_project.sh
```

---

## 🎯 8 个 Agent 对应的 Nvidia 模型

| Agent | Nvidia 模型(官方名) |
|-------|-------------------|
| 项目总指挥 | `qwen/qwen3-coder-480b-a35b-instruct` |
| 数据分析 | `nvidia/nemotron-3-nano-30b-a3b` |
| UI 设计 | `nvidia/nemotron-3-super-120b-a12b` |
| 全栈(标准) | `minimaxai/minimax-m2.7` |
| **全栈(资深)** ⭐ | **`qwen/qwen3-coder-480b-a35b-instruct`** |
| 全栈(助手) | `nvidia/nemotron-3-nano-30b-a3b` |
| 审核 | `minimaxai/minimax-m2.7` |
| 测试 | `nvidia/nemotron-3-super-120b-a12b` |

**API 端点**: `https://integrate.api.nvidia.com/v1/chat/completions`  
**速率限制**: 40 RPM(免费版)  
**重试策略**: 见 AGENT_RESILIENCE.md

---

## ✅ 满足的需求清单

### 关键决策
- ✅ 工作日志: Git+Supabase 双备份(选项 C)
- ✅ 日志生成: 混合(自动+手动)
- ✅ 审核流程: 严格(必须 Pass)
- ✅ 全部架构决策由 Claude 定夺

### 5 大业务痛点
- ✅ 客户数据隔离 → customers.sales_agent_id + RLS
- ✅ 合同约束 → 支付 Gate + payment_rules
- ✅ 土增税 → projects.tax_planning_*
- ✅ 文件追踪 → cost_ledger.receipt_filename + audit_log
- ✅ 销售承诺存证 → customers.commitments_made

---

## 📈 接下来应该做的事

### 立即(部署):
1. 检查文件包完整性
2. 编辑.env 填入实际密钥
3. 运行 `bash scripts/init_project.sh`
4. 验证数据库表和 RLS 策略
5. 测试一个简单的 Agent 调用

### 短期(1-2 周):
1. 启动总指挥 Agent
2. 让总指挥拆分 Phase 0 任务
3. 观察 Agent 协同工作
4. 根据实际效果微调 prompt

### 中期(1-2 月):
1. 完成 Phase 0 所有功能
2. 启动 Phase 1(AI 合同审查 + 税金检测)
3. 评估 Agent 的实际产出质量
4. 优化 prompt 和模型选择

---

## 🆘 遇到问题怎么办?

| 问题类型 | 查看文档 |
|---------|---------|
| 部署失败 | DEPLOYMENT_GUIDE.md 的故障排查 |
| Windows/Mac 特定问题 | CROSS_PLATFORM.md |
| Agent 行为异常 | AGENT_RESILIENCE.md |
| 数据库相关 | DATA_SCHEMA.md |
| 不知道怎么用 | E2E_EXAMPLE.md |

---

## 📝 版本信息

- **版本**: v2.0.0
- **生成日期**: 2026-06-09
- **设计者**: Claude (Anthropic) + REDP Team
- **目标平台**: Linux/macOS (推荐), Windows+WSL2 (推荐)
- **预估部署时间**: 2-4 小时(包括环境配置)

---

**祝项目顺利!**
