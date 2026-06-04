# REDP Phase 0 - 数据库设计说明

## 📊 表结构总览(11个表)

实际的SQL代码在 `supabase/migrations/` 目录,本文档为说明性参考。

---

## Core Tables(6个核心业务表)

### 1. projects - 项目基础数据

```
projects
├── id (UUID PK)
├── project_name
├── location
├── developer_name
├── project_status (PLANNING/IN_PROGRESS/COMPLETED)
├── start_date, expected_completion
├── total_land_area, total_built_area
├── total_budget (NUMERIC)
├── tax_planning_baseline  ← 关键!土增税基线
├── actual_tax_amount
├── tax_planning_completed_at
└── 标准元数据 (created_by/at, updated_by/at)
```

**关键说明**:
- `tax_planning_*` 字段用于解决土增税复杂的痛点
- 项目状态的转换需要严格控制(后续Phase 1完善)

### 2. customers ⭐ - 客户数据(防销售截留的核心!)

```
customers
├── id (UUID PK)
├── project_id (FK projects)
├── customer_name, customer_phone, customer_id_number
├── customer_type (INDIVIDUAL/COMPANY)
├── sales_agent_id ⭐ ← RLS核心字段!
├── sales_agent_name
├── customer_status (POTENTIAL/INTERESTED/NEGOTIATING/SIGNED/CANCELLED)
├── interested_property_type
├── budget_range_min, budget_range_max
├── notes
├── commitments_made (JSONB) ⭐ ← 销售承诺存证!
└── 标准元数据
```

**关键设计**:
- `sales_agent_id` 是RLS隔离的核心,销售只能看到自己创建的客户
- `commitments_made` 字段记录销售对客户做出的所有承诺,JSON结构:
  ```json
  [
    {
      "date": "2025-06-01",
      "content": "承诺学位房学区不变",
      "made_by": "销售A",
      "recorded_by": "系统/客户/销售"
    }
  ]
  ```
- 触发器`customers_commitment_audit`监控承诺变更,记录到audit_log

### 3. contracts - 合同管理

```
contracts
├── id (UUID PK)
├── project_id (FK projects)
├── customer_id (FK customers, 仅销售合同时使用)
├── contract_code (UNIQUE) ← 业务编号
├── contract_name
├── contract_type (SUPPLIER/CONTRACTOR/SALES/CONSULTANT)
├── counterparty_name, counterparty_id
├── contract_status (DRAFT/PENDING_SIGN/SIGNED/ACTIVATED/COMPLETED/TERMINATED)
├── draft_date, signed_date, activated_date, completion_date, termination_date
├── termination_reason
├── total_amount, currency
├── payment_milestones (JSONB)
├── key_terms_json (JSONB)
├── signatory_list (JSONB)
├── all_signatures_complete (BOOL) ← 支付Gate检查项
├── sales_agent_id (仅销售合同时使用)
└── 标准元数据
```

**payment_milestones JSON结构**:
```json
[
  {
    "name": "基础完工",
    "percentage": 20,
    "due_date": "2025-09-01"
  }
]
```

### 4. payments - 支付记录

```
payments
├── id (UUID PK)
├── project_id (FK projects)
├── contract_id (FK contracts)
├── payment_code (UNIQUE)
├── payment_amount, payment_currency
├── payment_date
├── payment_status (PENDING/APPROVED/REJECTED/EXECUTED/CANCELLED)
├── approval_checklist (JSONB) ← 5个检查项
├── approval_checklist_completed_at
├── reviewed_by, reviewed_at
├── approval_notes, rejection_reason
└── 标准元数据
```

**approval_checklist JSON结构**:
```json
{
  "contract_signed": true,
  "documents_received": true,
  "tax_completed": false,
  "milestone_achieved": false,
  "no_blockers": true
}
```

**关键RLS**: 销售team完全无法访问此表!

### 5. cost_budget - 预算

```
cost_budget
├── id (UUID PK)
├── project_id (FK projects)
├── cost_category (LAND/CONSTRUCTION/SALES/TAX/OVERHEAD/...)
├── subcategory
├── budgeted_amount, spent_amount
├── budget_status (APPROVED/PENDING/REVISED)
├── budget_approved_date, budget_approved_by
└── 标准元数据
```

### 6. cost_ledger - 成本账本

```
cost_ledger
├── id (UUID PK)
├── project_id (FK projects)
├── cost_budget_id (FK cost_budget)
├── cost_type, cost_description
├── cost_amount, cost_date
├── receipt_filename, receipt_hash  ← 关键!文件追踪
├── invoice_number, invoice_date
├── verified_by, verification_date
├── verification_status (PENDING/VERIFIED/REJECTED)
└── 标准元数据
```

**关键RLS**: 销售team完全无法访问!

---

## Governance Tables(3个治理表)

### 7. approval_gates - 审批门规则

```
approval_gates
├── id (UUID PK)
├── project_id (FK projects)
├── gate_name, gate_description
├── required_conditions (JSONB) ← 灵活的条件配置
├── override_allowed (BOOL)
├── override_requires_approvals
├── gate_status
└── 元数据
```

### 8. payment_rules - 里程碑条件

```
payment_rules
├── id (UUID PK)
├── contract_id (FK contracts)
├── milestone_name, milestone_description
├── trigger_condition_json (JSONB)
├── payment_percentage (0-100)
├── required_documents (JSONB)
├── min_progress_percentage
├── rule_status
└── 元数据
```

### 9. audit_log 🛡️ - 不可篡改审计日志

```
audit_log
├── id (UUID PK)
├── entity_type (payment/contract/customer/...)
├── entity_id (UUID)
├── action (CREATED/UPDATED/APPROVED/REJECTED/DELETED/SIGNED/EXECUTED)
├── actor_type (USER/AGENT/SYSTEM)
├── actor_id, actor_name
├── change_details (JSONB) ← before/after
├── reason
├── ip_address, user_agent
└── timestamp
```

**特殊设计**:
- 任何人都不能UPDATE或DELETE这个表
- 通过RESTRICTIVE policy实现
- 所有关键操作的触发器都会写入这里

---

## Control Tables(3个控制表)

### 10. task_locks - Agent协调

```
task_locks
├── id (UUID PK)
├── task_id (UUIDv4)
├── agent_id ← 哪个Agent持有锁
├── table_names (TEXT[]) ← 锁定哪些表
├── locked_at, locked_until
├── lock_reason
└── lock_status (ACTIVE/RELEASED/EXPIRED)
```

### 11. schema_version - 数据库版本

```
schema_version
├── id (SERIAL PK)
├── version_number (e.g., "0.2.0")
├── migration_name
├── migration_file
├── executed_at
├── rollback_strategy
├── status (SUCCESS/FAILED)
└── error_message
```

### 12. work_logs - 工作日志备份

```
work_logs
├── id (UUID PK)
├── task_id ← 关联到.redp/tasks/
├── agent_id
├── log_type (schema_change/code_change/review/test)
├── log_content (JSONB)
├── git_commit_hash
├── status (PENDING/REVIEWED/APPROVED/REJECTED)
├── reviewed_by, reviewed_at
└── committed_at
```

---

## 🔗 表关系图

```
projects ←┬─ customers ─── contracts (sales)
          │                  │
          ├─ contracts ──────┴── payments ── audit_log
          │      │                  │
          │      └── payment_rules  │
          │                          │
          ├─ cost_budget ─── cost_ledger
          │
          ├─ approval_gates
          │
          └─ (所有变更都触发audit_log)
```

---

## 🎯 关键设计决策

### 1. 为什么customers表有sales_agent_id?
- 这是RLS的核心,确保销售只能看自己的客户
- 防止销售离职带走全部客户数据

### 2. 为什么commitments_made用JSONB而不是单独表?
- 承诺通常只在销售期间产生
- JSONB保证了原子性记录
- 简化查询(直接获取所有承诺)
- 触发器监控变更

### 3. 为什么approval_checklist用JSONB?
- 不同合同的检查项可能不同
- JSONB允许灵活扩展
- 通过Edge Function维护一致性

### 4. 为什么audit_log不能修改?
- 防止有人销毁证据
- 法律和合规要求
- 用RESTRICTIVE policy强制

### 5. 为什么任务锁定到表级别?
- 太细(行级)会复杂化
- 太粗(数据库级)会阻塞太多
- 表级是平衡点

---

## 📝 命名规范

### 表名
- 复数snake_case: `customers`, `payment_rules`
- 例外: `audit_log`(单数,因为是"日志类")

### 字段名
- snake_case: `created_at`, `payment_status`
- 时间戳后缀: `_at` (e.g., `signed_at`, `created_at`)
- 布尔字段: `is_*` 或 `*_completed` (e.g., `all_signatures_complete`)
- 外键: `<table>_id` (e.g., `project_id`)

### 索引名
- 格式: `idx_<table>_<columns>`
- 例: `idx_customers_sales_agent`

---

## 🚨 性能注意事项

### 已优化的查询路径
- ✅ 客户按销售人员过滤(`idx_customers_sales_agent`)
- ✅ 支付按状态过滤(`idx_payments_pending`)
- ✅ 审计日志按实体查询(`idx_audit_log_entity`)
- ✅ 任务锁按表名查询(`idx_task_locks_tables` - GIN索引)

### 可能的瓶颈
- ⚠️ audit_log会快速增长,需要定期归档
- ⚠️ JSONB字段的查询比普通列慢
- ⚠️ 多表JOIN在大数据量时需要优化

详见: 003_indexes_constraints.sql
