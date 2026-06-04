# REDP Phase 0 - 端到端使用示例

**目的**: 展示如何从零开始,用Hermes多Agent系统实现一个真实功能。

**场景**: 用户(Zack)需要实现支付审批Gate

---

## 🎬 完整流程演示

### 第一步: 部署完成后,启动总指挥Agent

Claude Code执行:
```bash
# 1. 准备发送给总指挥的请求
REQUEST='我需要实现Phase 0的支付审批Gate。包括:
- 支付前置条件验证
- 批准流程  
- 完整的审计追踪'

# 2. 调用Nvidia API
curl -X POST "$NVIDIA_API_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $NVIDIA_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"deepseek-ai/deepseek-v4-pro\",
    \"messages\": [
      {\"role\": \"system\", \"content\": \"$(cat prompts/01_commander.md)\"},
      {\"role\": \"user\", \"content\": \"$REQUEST\"}
    ],
    \"temperature\": 0.3,
    \"max_tokens\": 4096
  }"
```

### 第二步: 总指挥返回任务拆分

```markdown
## 需求理解
实现Phase 0的支付Gate,涉及5个验证条件、批准流程、审计记录。
工作量预估3-5天,需要协调多个Agent并行+串行。

## 任务拆分

| Task ID | 任务 | Agent | 优先级 | 时间 |
|---------|------|-------|--------|------|
| task-phase0-001 | 创建payments+相关表 | 全栈(标准) | Critical | 4h |
| task-phase0-002 | 创建RLS策略 | 全栈(资深) | Critical | 4h |
| task-phase0-003 | validate_payment Function | 全栈(资深) | Critical | 8h |
| task-phase0-004 | approve_payment Function | 全栈(标准) | High | 6h |
| task-phase0-005 | audit_log Function | 全栈(标准) | High | 3h |
| task-phase0-006 | 单元+集成测试 | 测试 | High | 6h |
| task-phase0-007 | 全面审核 | 审核 | Critical | 3h |

## 依赖关系
001 → 002 → 003 → 004 → 006 → 007
            └─→ 005 ─────────┘

## 时间线(基于40RPM限制和并行可能)
- Day 1: 001 完成, 002 开始
- Day 2: 002 完成, 003 开始, 005 并行
- Day 3: 003 完成, 004 开始
- Day 4: 004 完成, 006 测试
- Day 5: 007 审核 + merge

## 生成的任务文件
.redp/tasks/active/task-phase0-001.json
.redp/tasks/active/task-phase0-002.json
...
```

### 第三步: Claude Code执行任务文件生成

```bash
# 总指挥的输出会包含具体的JSON,Claude Code将其保存:

cat > .redp/tasks/active/task-phase0-001.json << 'EOF'
{
  "task_metadata": {
    "task_id": "task-phase0-001",
    "task_name": "创建payments相关表",
    "assigned_to": "fullstack_engineer_standard",
    "model": "mistralai/mistral-medium-3.5-128b",
    "priority": "critical",
    "estimated_hours": 4
  },
  "task_objective": "创建payments, approval_gates, payment_rules三个核心表",
  "task_requirements": [...],
  ...
}
EOF

# 类似地保存002-007的任务文件
```

### 第四步: 启动第一个任务

```bash
# 1. 创建worktree(用脚本)
bash scripts/create_worktree.sh \
  --task-id task-phase0-001 \
  --branch feature/phase0-payments-schema \
  --agent fullstack_engineer_standard \
  --tables 'payments,approval_gates,payment_rules'

# 输出:
# 🌿 创建worktree for fullstack_engineer_standard
#    Task: task-phase0-001
#    Branch: feature/phase0-payments-schema
#    Path: worktrees/feature-phase0-payments-schema
# ✅ Task lock acquired
# ✅ Worktree created successfully

# 2. 进入worktree
cd worktrees/feature-phase0-payments-schema

# 3. 调用具体Agent
TASK_FILE="../../.redp/tasks/active/task-phase0-001.json"
AGENT_PROMPT=$(cat ../../prompts/04_fullstack_standard.md)

curl -X POST "$NVIDIA_API_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $NVIDIA_API_KEY" \
  -d "{
    \"model\": \"mistralai/mistral-medium-3.5-128b\",
    \"messages\": [
      {\"role\": \"system\", \"content\": \"$AGENT_PROMPT\"},
      {\"role\": \"user\", \"content\": \"执行任务: $(cat $TASK_FILE)\"}
    ]
  }" > agent_response.json

# 4. Agent输出代码,Claude Code保存到对应文件
# (这里是Mistral生成的SQL代码)
```

### 第五步: Agent执行任务并提交

```bash
# Agent完成后,Claude Code执行:

# 1. 保存Agent输出的代码
# 假设输出包含: supabase/migrations/004_payments_schema.sql

# 2. 执行测试
psql "$SUPABASE_CONNECTION_STRING" < supabase/migrations/004_payments_schema.sql

# 3. 验证
psql "$SUPABASE_CONNECTION_STRING" -c "\d payments"

# 4. Git提交(自动触发post-commit)
git add supabase/migrations/004_payments_schema.sql
git commit -m "feat(schema): create payments and approval tables [task-phase0-001]"

# 自动发生:
# - .git/hooks/post-commit触发
# - scripts/generate_changelog.sh生成日志
# - .logs/detailed/task-phase0-001.json创建
# - work_logs表写入备份记录
```

### 第六步: 调用审核Agent

```bash
# 任务完成,通知审核
REVIEWER_PROMPT=$(cat ../../prompts/07_reviewer.md)
DIFF=$(git diff main)
TASK_INFO=$(cat .redp/tasks/active/task-phase0-001.json)
LOG=$(cat .logs/detailed/task-phase0-001.json)

curl -X POST "$NVIDIA_API_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $NVIDIA_API_KEY" \
  -d "{
    \"model\": \"minimaxai/minimax-m2.7\",
    \"messages\": [
      {\"role\": \"system\", \"content\": \"$REVIEWER_PROMPT\"},
      {\"role\": \"user\", \"content\": \"审核以下任务:\\n\\n任务信息:\\n$TASK_INFO\\n\\nGit Diff:\\n$DIFF\\n\\n工作日志:\\n$LOG\"}
    ]
  }" > review_response.json

# 审核Agent返回:
{
  "review_status": "approved",  
  "issues_found": [],
  "summary": "代码符合规范,所有检查项通过"
}

# 更新工作日志
jq '.review_status = "approved" | .approval_log += [{
  "reviewer": "minimax_reviewer",
  "review_timestamp": "2025-06-02T15:30:00Z",
  "review_status": "approved"
}]' .logs/detailed/task-phase0-001.json > tmp.json && mv tmp.json .logs/detailed/task-phase0-001.json
```

### 第七步: 审核通过,执行合并

```bash
# 回到主目录
cd ../..

# 调用merge脚本
bash scripts/merge_worktree.sh --task-id task-phase0-001

# 自动发生:
# 1. 验证review_status = approved
# 2. git checkout main && git merge feature/phase0-payments-schema
# 3. 删除worktree
# 4. 释放task_lock
# 5. 归档task文件到 .redp/tasks/completed/

# 输出:
# ✅ Merged successfully
#    Branch feature/phase0-payments-schema deleted
#    Worktree cleaned
#    Lock released
#    Task archived to .redp/tasks/completed/
```

### 第八步: 启动下一个任务

```bash
# 现在task-001已完成,可以启动依赖它的task-002
bash scripts/create_worktree.sh \
  --task-id task-phase0-002 \
  --branch feature/phase0-rls-policies \
  --agent fullstack_engineer_senior \
  --tables 'payments,cost_ledger'

# 重复上面的流程...
```

### 第九步: 并行执行(task-003和task-005)

```bash
# task-003依赖002, task-005依赖001(已完成)
# 所以002完成后,003和005可以并行

# Terminal 1
bash scripts/create_worktree.sh \
  --task-id task-phase0-003 \
  --branch feature/phase0-validate-payment \
  --agent fullstack_engineer_senior \
  --tables 'payments,contracts,cost_ledger'

# Terminal 2 (或后台)
bash scripts/create_worktree.sh \
  --task-id task-phase0-005 \
  --branch feature/phase0-audit-log \
  --agent fullstack_engineer_standard \
  --tables 'audit_log'

# 两个Agent可以同时工作,不冲突(锁定的表不同)
```

---

## 🔄 失败场景处理

### 场景1: Agent超时

```bash
# task-003运行8小时还没完成
# 系统cleanup_locks.sh会发现异常

# 自动操作:
# 1. lock_status = EXPIRED
# 2. task文件移到 .redp/tasks/failed/
# 3. 通知用户

# 手动恢复:
# 1. 检查worktree的代码状态
# 2. 决定: 继续 / 放弃 / 重启
# 3. 重启的话,清理worktree重新分配
```

### 场景2: 审核拒绝

```bash
# 审核返回:
{
  "review_status": "rejected",
  "issues_found": [
    {
      "severity": "critical",
      "description": "validate_payment没有处理并发请求"
    }
  ]
}

# 自动操作:
# 1. task文件添加 "needs_rework: true"
# 2. 重新分配给原Agent(或更资深的)
# 3. 上一次的代码作为参考

# Agent修改后,重新提交+审核
```

### 场景3: API速率限制

```bash
# Nvidia API返回 429 Too Many Requests

# 自动操作(在Claude Code的封装中):
# 1. 等待60秒
# 2. 重试(最多3次)
# 3. 如还失败,降级到其他模型
# 4. 通知用户

# 详见: AGENT_RESILIENCE.md
```

---

## 📊 进度监控

用户随时可以查看进度:

### 查看活跃任务
```bash
ls .redp/tasks/active/
# task-phase0-003.info
# task-phase0-005.info

# 查看具体任务
cat .redp/tasks/active/task-phase0-003.info
```

### 查看已完成任务
```bash
ls .redp/tasks/completed/
# task-phase0-001.info
# task-phase0-002.info
```

### 查看变更日志
```bash
cat .logs/CHANGELOG.md
```

### 查询数据库
```sql
-- 查看所有任务状态
SELECT task_id, agent_id, status, committed_at
FROM work_logs
WHERE committed_at > NOW() - INTERVAL '7 days'
ORDER BY committed_at DESC;

-- 查看活跃的锁
SELECT * FROM task_locks WHERE lock_status = 'ACTIVE';

-- 查看Agent的产出统计
SELECT agent_id, COUNT(*) as tasks_completed
FROM work_logs
WHERE status = 'APPROVED'
GROUP BY agent_id;
```

---

## 🎯 关键时间节点(用户的视角)

```
Day 1 上午: 用户提需求 → 总指挥拆分任务
Day 1 下午: task-001完成 → 审核通过 → merge
Day 2 上午: task-002启动 (资深Agent处理RLS)
Day 2 下午: task-002完成,003和005并行
Day 3: 003继续(复杂逻辑),005完成审核
Day 4: 003完成,004启动
Day 5: 004完成,006测试
Day 6: 006完成,007最终审核
Day 7: 全部merge,Phase 0完成

总时间: 约1周(单线程估算)
并行优化后: 约4-5天
```

---

## 💡 用户(Zack)的最佳实践

1. **不要打断Agent工作**: 让任务自然完成
2. **审查任务拆分**: 如果总指挥的拆分不合理,要纠正
3. **关注审核Agent的反馈**: 它发现的问题通常是真的
4. **定期备份**: Supabase的work_logs是关键
5. **遇到失败不慌**: cleanup_locks.sh会处理
6. **看进度看日志**: .logs/CHANGELOG.md是最简洁的进度视图
