# HERMES Multi-Agent 任务模板

本文档定义Agent之间的任务分配机制和模板格式。

---

## 🎯 任务指令文件格式

每个任务都有一个JSON指令文件,存储在 `.redp/tasks/active/task-xxx.json`

### 完整结构

```json
{
  "task_metadata": {
    "task_id": "task-phase0-validate-001",
    "task_name": "实现validate_payment Edge Function",
    "assigned_to": "fullstack_engineer_senior",
    "model": "qwen/qwen3-coder-480b-a35b-instruct",
    "priority": "critical",
    "deadline": "2025-06-05T18:00:00Z",
    "estimated_hours": 8,
    "depends_on": ["task-phase0-schema-001"]
  },

  "task_objective": "实现支付审批的核心验证逻辑,检查5个前置条件",

  "task_requirements": [
    "验证合同已签署(contracts.contract_status = SIGNED 且 all_signatures_complete = true)",
    "验证文件齐全(cost_ledger中至少有1条verification_status = VERIFIED且有receipt_filename)",
    "验证税金已计划(projects.tax_planning_completed_at IS NOT NULL)",
    "验证里程碑达成(payment_rules中有active规则)",
    "验证无blockers(同contract无REJECTED的payment)"
  ],

  "execution_constraints": {
    "allowed_tables": [
      "payments",
      "contracts",
      "cost_ledger",
      "projects",
      "payment_rules",
      "audit_log"
    ],
    "forbidden_operations": [
      "不能直接修改payment_status",
      "不能跳过audit_log记录",
      "不能修改其他Agent的代码"
    ],
    "worktree_location": "worktrees/feature-validate-payment",
    "branch_name": "feature/phase0-validate-payment"
  },

  "acceptance_criteria": [
    "Edge Function部署成功",
    "validate_payment端点返回正确的ApiResponse格式",
    "所有5个检查项的逻辑正确",
    "单元测试覆盖率≥90%",
    "集成测试通过(用seed_data)",
    "审核Agent批准"
  ],

  "deliverables": [
    "supabase/functions/validate_payment/index.ts",
    "supabase/functions/validate_payment/deno.json",
    "supabase/functions/validate_payment/index.test.ts",
    "工作日志: .logs/detailed/task-phase0-validate-001.json"
  ],

  "implementation_steps": [
    "1. 阅读ARCHITECTURE.md的支付Gate章节",
    "2. 阅读已有的_shared/types.ts和errors.ts",
    "3. 实现validatePayment业务逻辑函数",
    "4. 添加HTTP handler(支持POST和OPTIONS)",
    "5. 实现单元测试",
    "6. 本地测试: deno test",
    "7. 部署: supabase functions deploy validate_payment",
    "8. 集成测试: 用seed_data中的p1111111-...支付ID测试",
    "9. 生成工作日志并提交"
  ],

  "context_files": [
    "ARCHITECTURE.md",
    "DATA_SCHEMA.md",
    "CODE_STANDARDS.md",
    "supabase/functions/_shared/types.ts",
    "supabase/functions/_shared/errors.ts"
  ],

  "test_scenarios": [
    {
      "name": "happy_path",
      "input": { "payment_id": "p1111111-1111-1111-1111-111111111111" },
      "expected_status": "APPROVED"
    },
    {
      "name": "contract_not_signed",
      "setup": "UPDATE contracts SET contract_status = 'DRAFT' WHERE id = ...",
      "expected_status": "REJECTED",
      "expected_reason_contains": "合同状态"
    }
  ]
}
```

---

## 🔀 任务依赖管理

### 串行任务(必须有顺序)
```
task-A (创建schema)
   ↓
task-B (实现Function,依赖schema)
   ↓
task-C (写测试,依赖Function)
```

依赖通过`depends_on`字段表达:
```json
{
  "task_metadata": {
    "task_id": "task-B",
    "depends_on": ["task-A"]
  }
}
```

总指挥会等A完成再启动B

### 并行任务(可以同时)
```
   ┌─→ task-X (UI设计)
   │
parent
   │
   └─→ task-Y (后端实现)
```

`depends_on`数组为空或不包含同辈任务

### 死锁防护
- 检测循环依赖,总指挥拒绝创建
- 长时间等待自动报警
- `cleanup_locks.sh`处理悬挂的锁

---

## 🎭 8个Agent的能力矩阵

| 任务类型 | 推荐Agent | 模型 | 时间估算 |
|---------|----------|------|---------|
| 数据库schema设计 | 全栈(资深) | Qwen 480B | 4-8h |
| 简单CRUD function | 全栈(标准) | Mistral 128B | 2-4h |
| 复杂业务逻辑 | 全栈(资深) | Qwen 480B | 8-16h |
| 工具函数 | 全栈(助手) | Qwen 32B | 1-2h |
| RLS策略 | 全栈(资深)+审核 | Qwen 480B | 4-8h |
| UI/UX设计 | UI设计 | GLM-5.1 | 4-8h |
| 数据查询/分析 | 数据分析 | Qwen 32B | 1-2h |
| 自动化测试 | 测试 | Nemotron | 2-4h |
| 代码审核 | 审核 | MiniMax M2.7 | 1-2h |
| 文档编写 | 全栈(助手)or 数据分析 | Qwen 32B | 1-3h |

---

## 🚦 任务状态机

```
        ┌─────────┐
        │PLANNING │
        └────┬────┘
             ↓
        ┌─────────┐
        │ASSIGNED │
        └────┬────┘
             ↓
        ┌─────────┐
        │  ACTIVE │
        └────┬────┘
             ↓
        ┌─────────┐
        │COMMITTED│
        └────┬────┘
             ↓
        ┌─────────────┐
        │ IN_REVIEW   │
        └─────┬───────┘
              ↓
         ┌────┴────┐
        ↓          ↓
   ┌────────┐ ┌────────┐
   │APPROVED│ │REJECTED│
   └───┬────┘ └────┬───┘
       ↓           ↓
   ┌────────┐ (返工→PLANNING)
   │ MERGED │
   └────────┘
```

存储位置:
- `PLANNING` → `.redp/tasks/planned/`
- `ASSIGNED`,`ACTIVE`,`COMMITTED`,`IN_REVIEW` → `.redp/tasks/active/`
- `APPROVED`,`MERGED` → `.redp/tasks/completed/`
- `REJECTED`(死亡) → `.redp/tasks/failed/`

---

## 📞 Agent间通信

Agent之间不直接通信,通过文件和数据库:

### Agent A → Agent B (任务交接)
1. Agent A完成任务并commit
2. Agent A更新task文件状态为`COMMITTED`
3. 总指挥分配下一个task给Agent B
4. Agent B读取上一个task的工作日志了解context

### Agent需要协调(同时改一个表)
1. 都尝试获取table_lock
2. 后到者得到`CONFLICT`响应
3. 后到者等待或拆分任务

### Agent需要协助(Q&A)
1. Agent在task文件中追加`questions`数组
2. 总指挥定期扫描questions
3. 总指挥用更强的模型回答,写回task文件

---

## 🎨 实际任务分配示例

### 用户输入:
> "我需要实现Phase 0的支付审批Gate"

### 总指挥的响应:

```markdown
## 需求理解
实现Phase 0的核心功能:支付Gate。包括前置条件验证、批准流程、审计记录。

## 任务拆分

| Task ID | 任务 | Agent | 模型 | 时间 | 依赖 |
|---------|------|-------|------|------|------|
| task-phase0-schema-001 | 创建payments+approval_gates表 | 全栈(标准) | Mistral | 4h | - |
| task-phase0-rls-001 | payments的RLS策略 | 全栈(资深) | Qwen 480B | 4h | schema-001 |
| task-phase0-validate-001 | validate_payment Function | 全栈(资深) | Qwen 480B | 8h | schema-001 |
| task-phase0-approve-001 | approve_payment Function | 全栈(标准) | Mistral | 6h | validate-001 |
| task-phase0-audit-001 | audit_log Function | 全栈(标准) | Mistral | 3h | schema-001 |
| task-phase0-test-001 | 单元+集成测试 | 测试 | Nemotron | 6h | approve-001 |
| task-review-001 | 全面审核 | 审核 | MiniMax | 3h | test-001 |

## 时间线
Day 1: schema-001
Day 2: rls-001, audit-001 (并行), validate-001 开始
Day 3: validate-001 结束, approve-001
Day 4: test-001
Day 5: review-001 + merge

## 执行命令(给Claude Code)
```bash
# 生成所有task文件
for task in schema-001 rls-001 validate-001 approve-001 audit-001 test-001 review-001; do
  # ... 生成 .redp/tasks/active/task-phase0-${task}.json
done

# 启动第一批
bash scripts/create_worktree.sh --task-id task-phase0-schema-001 ...
```
```

详见: `E2E_EXAMPLE.md` 完整执行示例

---

## 🤝 Agent的最佳实践

### 接到任务后
1. **先读context**: 完整阅读task中`context_files`列出的文件
2. **检查依赖**: 确认所有`depends_on`的任务已完成
3. **进入worktree**: `cd worktrees/feature-xxx`
4. **检查锁**: 确认你持有需要的表锁
5. **再开始编码**

### 编码中
1. **小步提交**: 每完成一个逻辑单元就commit
2. **及时测试**: 不要等到最后才跑测试
3. **遇阻立即问**: 不确定的时候在task文件中追加question

### 完成后
1. **自检清单**: 对照CODE_STANDARDS.md自查
2. **运行所有测试**: 确保都通过
3. **更新task状态**: `IN_REVIEW`
4. **通知审核**: 让总指挥知道可以审核
