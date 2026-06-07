# REDP Phase 0 - 房地产开发管理平台

**项目**: Real Estate Development Platform (REDP)
**版本**: v0.2.0 (完整可部署版本)
**当前阶段**: Phase 0 - 支付审批Gate + 核心数据脊柱
**部署目标**: Supabase PostgreSQL + Edge Functions
**AI框架**: Hermes Multi-Agent (8个Agent协同)

---

## 📦 文件包内容概览

本文件包包含**完整的、可直接部署的**Phase 0项目结构。Claude Code可以直接基于此进行多Agent协同开发。

```
redp-phase0/
├── 📚 核心文档 (12个)
│   ├── README.md                  ← 你正在看的文件
│   ├── 00_PACKAGE_SUMMARY.md       ← 文件包总览
│   ├── DEPLOYMENT_GUIDE.md         ← Claude Code部署指南
│   ├── ARCHITECTURE.md             ← 系统架构
│   ├── DATA_SCHEMA.md              ← 数据库设计说明
│   ├── CODE_STANDARDS.md           ← 代码规范
│   ├── WORK_LOG_SPEC.md            ← 工作日志规范
│   ├── HERMES_AGENT_TEMPLATES.md   ← Agent任务模板
│   ├── TESTING_SPEC.md             ← 测试规范 ⭐新增
│   ├── E2E_EXAMPLE.md              ← 端到端示例 ⭐新增
│   ├── AGENT_RESILIENCE.md         ← Agent容错机制 ⭐新增
│   └── CROSS_PLATFORM.md           ← 跨平台兼容性 ⭐新增
│
├── 🗄️ 数据库 (supabase/)
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      ← 11张表(含customers)
│   │   ├── 002_rls_policies.sql        ← 角色+RLS策略
│   │   └── 003_indexes_constraints.sql ← 索引优化
│   ├── seed_data.sql                   ← 测试数据 ⭐新增
│   └── functions/
│       ├── validate_payment/index.ts   ← 支付验证逻辑 ⭐
│       ├── approve_payment/index.ts    ← 支付批准 ⭐
│       ├── audit_log/index.ts          ← 审计日志 ⭐
│       ├── create_task_lock/index.ts   ← Agent锁 ⭐
│       └── _shared/                    ← 共享代码
│
├── 🔧 Git配置 (git_setup/)
│   ├── .env.example                ← 环境变量模板
│   ├── .gitignore                  ← Git忽略规则
│   └── hooks/
│       ├── post-commit             ← 自动生成日志
│       └── pre-commit              ← 提交前检查
│
├── 🛠️ 脚本 (scripts/)
│   ├── init_project.sh             ← 一键初始化
│   ├── generate_changelog.sh       ← 生成工作日志
│   ├── create_worktree.sh          ← 创建Agent worktree
│   ├── merge_worktree.sh           ← 合并并清理
│   └── cleanup_locks.sh            ← 清理过期锁
│
└── 🤖 Agent提示词 (prompts/)
    ├── 01_commander.md             ← 项目总指挥
    ├── 02_data_analyst.md          ← 数据分析
    ├── 03_ui_designer.md           ← UI设计
    ├── 04_fullstack_standard.md    ← 全栈(标准)
    ├── 05_fullstack_senior.md      ← 全栈(资深)⭐
    ├── 06_fullstack_assistant.md   ← 全栈(助手)
    ├── 07_reviewer.md              ← 审核
    └── 08_tester.md                ← 测试
```

---

## 🚀 快速开始(给Claude Code的指令)

### 一键部署
```bash
cd redp-phase0
cp git_setup/.env.example .env
# 编辑.env填入Supabase和Nvidia API key
chmod +x scripts/*.sh
bash scripts/init_project.sh
```

`init_project.sh`会自动完成:
1. ✅ 检查依赖(git, psql, npm, curl)
2. ✅ 验证环境变量
3. ✅ 测试数据库连接
4. ✅ 执行3个迁移文件
5. ✅ 验证表和RLS策略
6. ✅ 部署4个Edge Functions
7. ✅ 配置Git hooks
8. ✅ 初始化日志目录
9. ✅ 测试Nvidia API
10. ✅ 完成报告

---

## 🎯 Phase 0要解决的5大痛点

| # | 痛点 | 解决方案 | 涉及表/Function |
|---|------|---------|----------------|
| 1 | 客户数据被销售截留 | RLS策略隔离 | customers + 002_rls_policies |
| 2 | 合同无法约束承包商 | 支付Gate机制 | payments + validate_payment |
| 3 | 土增税计算复杂 | 计划基线追踪 | projects.tax_planning_* |
| 4 | 建筑文件散落 | 不可篡改审计 | audit_log + 触发器 |
| 5 | 销售口头承诺纠纷 | 承诺存证 | customers.commitments_made |

---

## 🤖 8个Agent及其角色

| Agent | 模型 | 用途 |
|-------|------|------|
| 项目总指挥 | `qwen/qwen3-coder-480b-a35b-instruct` | 需求分析、任务拆分、调度 |
| 数据分析 | `nvidia/nemotron-3-nano-30b-a3b` | 快速代码/数据分析 |
| UI设计 | `nvidia/nemotron-3-super-120b-a12b` | 界面设计、交互流程 |
| 全栈(标准) | `minimaxai/minimax-m2.7` | 常规业务逻辑 |
| 全栈(资深) ⭐ | `qwen/qwen3-coder-480b-a35b-instruct` | 复杂推理、架构 |
| 全栈(助手) | `nvidia/nemotron-3-nano-30b-a3b` | 工具函数、文档 |
| 审核 | `minimaxai/minimax-m2.7` | 严格审查所有改动 |
| 测试 | `nvidia/nemotron-3-super-120b-a12b` | 自动化测试 |

详见: [`prompts/01_commander.md`](prompts/01_commander.md) 等8个文件

---

## 📊 数据库表概览(11个表)

### Core(6个核心业务表)
1. **projects** - 项目基础数据(含税金计划字段)
2. **customers** ⭐ - 客户数据(防销售截留的核心)
3. **contracts** - 合同管理
4. **payments** - 支付记录
5. **cost_budget** - 预算
6. **cost_ledger** - 成本账本

### Governance(3个治理表)
7. **approval_gates** - 审批门规则
8. **payment_rules** - 里程碑条件
9. **audit_log** - 不可篡改的审计日志

### Control(3个控制表)
10. **task_locks** - Agent并发控制
11. **schema_version** - 数据库版本
12. **work_logs** - 工作日志Supabase备份

详见: [`DATA_SCHEMA.md`](DATA_SCHEMA.md)

---

## 🔐 安全设计核心

### 销售团队完全无法访问的表
- ❌ `payments` - 支付记录
- ❌ `cost_ledger` - 成本账本
- ❌ `cost_budget` - 预算

### 销售团队的隔离访问
- 🔒 `customers` - 只能看 `sales_agent_id = 自己`
- 🔒 `contracts` - 只能看 `contract_type = 'SALES' AND sales_agent_id = 自己`

### 不可篡改的表
- 🛡️ `audit_log` - 任何人都无法UPDATE或DELETE

详见: [`supabase/migrations/002_rls_policies.sql`](supabase/migrations/002_rls_policies.sql)

---

## 📝 工作日志体系(双备份)

每次commit自动生成:
1. **Git层**: `.logs/detailed/task-xxx.json`
2. **Supabase备份**: `work_logs` 表

详见: [`WORK_LOG_SPEC.md`](WORK_LOG_SPEC.md)

---

## ⚠️ 重要说明

### 当前阶段不做的事
- ❌ 维语支持(Phase 2再做)
- ❌ AI合同审查(Phase 1)
- ❌ 销售CRM(Phase 2)
- ❌ 客户端App(API先行)

### 必须先做的事
- ✅ 部署核心数据库
- ✅ 实现支付Gate
- ✅ 建立Agent协同机制
- ✅ 完善审计日志

---

## 📞 故障排查

如部署遇到问题,查看:
1. [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - 详细的故障排查
2. [`CROSS_PLATFORM.md`](CROSS_PLATFORM.md) - 跨平台问题
3. [`AGENT_RESILIENCE.md`](AGENT_RESILIENCE.md) - Agent失败恢复

---

**版本**: v0.2.0
**生成时间**: 2025-06-02
**适用Claude**: Claude Code、Claude Sonnet 4.6+
