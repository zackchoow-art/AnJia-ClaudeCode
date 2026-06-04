# REDP Phase 0 - 系统架构

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     用户界面 (Phase 2+)                       │
│              (Web/Mobile, 暂未实现)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                Supabase Edge Functions (Phase 0)             │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │validate_     │ │approve_      │ │audit_log    │         │
│  │payment       │ │payment       │ │             │         │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘         │
│         │                │                 │                 │
│         └────────────────┼─────────────────┘                 │
│                          ↓                                   │
│         ┌──────────────────────────────┐                    │
│         │  create_task_lock            │                    │
│         │  (Agent协调机制)              │                    │
│         └──────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         Supabase PostgreSQL Database                         │
│                                                              │
│  ┌─────────────────┐ ┌──────────────────┐                  │
│  │ Core Tables (6) │ │ Governance (3)    │                  │
│  │ - projects      │ │ - approval_gates  │                  │
│  │ - customers ⭐   │ │ - payment_rules   │                  │
│  │ - contracts     │ │ - audit_log 🛡️    │                  │
│  │ - payments      │ └──────────────────┘                  │
│  │ - cost_budget   │                                        │
│  │ - cost_ledger   │ ┌──────────────────┐                  │
│  └─────────────────┘ │ Control (3)      │                  │
│                      │ - task_locks     │                  │
│                      │ - schema_version │                  │
│                      │ - work_logs      │                  │
│                      └──────────────────┘                  │
│                                                              │
│  Row Level Security (RLS) Policies                          │
│  - 销售team: payments/cost_ledger ❌ BLOCKED                 │
│  - 销售team: customers 🔒 仅自己的                          │
│  - audit_log: 🛡️ 任何人不可修改                              │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │
┌─────────────────────────────────────────────────────────────┐
│          Hermes Multi-Agent System                           │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │  项目总指挥 (DeepSeek V4 Pro, 1.6T)               │       │
│  │  - 需求分析、任务拆分、Agent调度                   │       │
│  └──────────────────────────────────────────────────┘       │
│           │                  │                  │            │
│      ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐       │
│      │全栈(资深)│      │全栈(标准)│      │全栈(助手)│       │
│      │Qwen 480B │      │Mistral   │      │Qwen 32B  │       │
│      └──────────┘      │128B      │      └──────────┘       │
│                        └──────────┘                          │
│      ┌──────────┐      ┌──────────┐      ┌──────────┐       │
│      │UI设计    │      │数据分析  │      │测试      │       │
│      │GLM-5.1   │      │Qwen 32B  │      │Nemotron  │       │
│      └──────────┘      └──────────┘      └──────────┘       │
│                                                              │
│      ┌──────────────────────────────┐                       │
│      │  审核 (MiniMax M2.7)          │                       │
│      │  最后防线!                    │                       │
│      └──────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 支付Gate核心流程

支付Gate是Phase 0的灵魂,确保每笔支付都经过严格验证:

```
用户/系统申请支付
       │
       ↓
[创建payment记录, status=PENDING]
       │
       ↓
┌──────────────────────────────────┐
│ validate_payment() 验证          │
│ ┌──────────────────────────┐    │
│ │ 1. 合同已签署?            │    │
│ │ 2. 文件齐全?              │    │
│ │ 3. 税金已计划?            │    │
│ │ 4. 里程碑达成?            │    │
│ │ 5. 无blocker?             │    │
│ └──────────────────────────┘    │
└──────────────────────────────────┘
       │
   ┌───┴───┐
   ↓       ↓
[全过]   [有失败]
   │       │
   ↓       ↓
[等待   [更新status=REJECTED
 审批]    记录rejection_reasons]
   │
   ↓
[reviewer调用approve_payment()]
   │
   ↓
[再次validate_payment 二次确认]
   │
   ↓
[更新status=APPROVED]
   │
   ↓
[写入audit_log (不可篡改)]
```

---

## 🔐 权限模型(RLS)

### 6个数据库角色

| 角色 | 权限范围 | 关键限制 |
|------|---------|---------|
| `super_admin` | 全部 | 无 |
| `project_manager` | 大部分读写 | 不能删audit_log |
| `finance` | 财务表读写 | 不能删audit_log |
| `reviewer` | 全部只读+审批字段 | 只能改payment.status等 |
| `sales_team` | 严格隔离 | 完全禁止访问payments和cost_ledger |
| `system_agent` | Agent操作所需 | 主要是task_locks和work_logs |

### Sales Team的特殊限制

**这是项目的核心安全设计!**

```sql
-- customers表: 只能看自己创建的
CREATE POLICY customers_sales_isolation ON customers
  FOR SELECT TO sales_team
  USING (sales_agent_id::text = current_setting('app.current_user_id', true));

-- payments表: 完全禁止访问
CREATE POLICY payments_sales_block ON payments
  AS RESTRICTIVE FOR ALL TO sales_team USING (false);

-- cost_ledger表: 完全禁止访问  
CREATE POLICY cost_ledger_sales_block ON cost_ledger
  AS RESTRICTIVE FOR ALL TO sales_team USING (false);
```

### audit_log的不可篡改性

```sql
-- 任何人都不能修改或删除
CREATE POLICY audit_log_no_update ON audit_log
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);

CREATE POLICY audit_log_no_delete ON audit_log
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);
```

---

## 🤖 Agent协同机制

### 工作流

```
用户提需求
   │
   ↓
项目总指挥分析+拆分
   │
   ↓
生成.redp/tasks/task-xxx.json
   │
   ↓
创建git worktree (并发)
   │
   ↓
申请task_lock (锁定相关表)
   │
   ↓
分配给具体Agent执行
   │
   ↓
Agent在worktree中编码
   │
   ↓
git commit (触发post-commit hook)
   │
   ↓
自动生成工作日志
   │   ├─→ .logs/detailed/*.json (Git)
   │   └─→ work_logs表 (Supabase备份)
   │
   ↓
通知审核Agent
   │
   ↓
审核Agent严格审查
   │
   ↓
[APPROVED] → merge_worktree.sh
[REJECTED] → 返工
   │
   ↓
合并到main + 清理worktree + 释放锁
```

### 并发控制

通过`task_locks`表实现表级别锁定:

```sql
-- Agent A 锁定contracts表
INSERT INTO task_locks (
  task_id, agent_id, table_names, locked_until
) VALUES (
  'task-xxx', 'agent-a', ARRAY['contracts'], 
  NOW() + INTERVAL '4 hours'
);

-- Agent B 尝试也修改contracts → 检查锁 → 等待
```

死锁防护:
- 每个锁都有`locked_until`(强制过期)
- `cleanup_locks.sh`定时清理过期锁
- 长时间运行的任务自动报警

---

## 📊 数据流: 一笔支付的生命周期

```
1. PM创建合同 (contracts)
   ├─ 关联到project
   ├─ 设置total_amount
   └─ 记录到audit_log

2. PM创建payment_rules
   ├─ 关联到contract
   └─ 设置里程碑条件

3. 合同签署完成
   ├─ contracts.contract_status = 'SIGNED'
   ├─ contracts.all_signatures_complete = true
   └─ 记录到audit_log

4. 项目进展,达到里程碑
   ├─ 文件录入 (cost_ledger)
   ├─ 发票上传 (cost_ledger.receipt_filename)
   └─ 财务验证 (cost_ledger.verification_status = 'VERIFIED')

5. 税金计划完成
   └─ projects.tax_planning_completed_at = NOW()

6. PM/财务申请支付
   ├─ 创建payment记录 (status=PENDING)
   └─ 自动触发audit_log

7. 系统调用validate_payment
   ├─ 检查5个条件
   ├─ 更新approval_checklist
   └─ 设置status (APPROVED/REJECTED)

8. Reviewer审批
   ├─ 调用approve_payment Edge Function
   ├─ 二次验证
   ├─ 更新status=APPROVED
   ├─ 记录reviewed_by
   └─ 不可篡改地写入audit_log

9. 财务执行支付
   └─ status = EXECUTED
```

---

## 🌐 技术栈

| 层 | 技术 | 理由 |
|----|------|------|
| 数据库 | Supabase PostgreSQL | 内置RLS, 集成Auth |
| API | Supabase Edge Functions (Deno) | 与DB紧密集成,自动扩展 |
| 认证 | Supabase Auth | 内置,与RLS联动 |
| 多Agent | Nvidia NIM API | 免费,多模型选择 |
| 版本控制 | Git + Worktree | 并行开发, 历史完整 |
| 工作日志 | JSON + Supabase | 双备份, 可追溯 |
| 部署 | Supabase CLI | 自动化部署 |

---

## 🔄 Phase演进路径

### Phase 0 (当前) - 数据脊柱
- ✅ 11个核心表
- ✅ 4个Edge Functions
- ✅ 完整RLS策略
- ✅ Agent协同机制

### Phase 1 (后续3-6月)
- 📋 AI合同审查模块
- 📋 税金风险检测
- 📋 智能财务规划
- 📋 文档OCR集成

### Phase 2 (6-12月)
- 📋 房源库存管理
- 📋 销售AI助手
- 📋 客户CRM + AI分析
- 📋 维语支持
- 📋 移动客户端

详见: 后续Phase的独立设计文档
