# REDP Phase 0 - 工作日志规范

**核心目标**: 每个Agent的每次代码改动都必须有完整、可追溯的工作日志。

**存储策略**: Git + Supabase 双备份(用户选项C)

---

## 📂 工作日志的三层结构

### Layer 1: Git Commit Message
- 简短,人类可读
- 自动提取task_id
- 格式: `<type>(<scope>): <subject> [<task-id>]`

### Layer 2: 详细JSON日志 (`.logs/detailed/`)
- 完整的改动详情
- 文件级粒度
- 由post-commit hook自动生成

### Layer 3: Supabase备份 (`work_logs` 表)
- 跨Worktree的同步
- 长期归档
- 可查询和审计

---

## 🔧 自动生成机制

### 触发流程
```
git commit
   ↓
.git/hooks/post-commit (脚本)
   ↓
scripts/generate_changelog.sh
   ├─→ 生成 .logs/detailed/task-xxx.json
   ├─→ 更新 .logs/CHANGELOG.md
   └─→ POST到 Supabase work_logs 表
```

### post-commit hook做的事
1. 提取commit message中的task_id
2. 统计SQL/TS/MD改动数量
3. 调用generate_changelog.sh
4. 备份到Supabase

如果commit message中没有task_id,自动生成`task-auto-<timestamp>`

---

## 📋 JSON日志格式(.logs/detailed/task-xxx.json)

```json
{
  "task_metadata": {
    "task_id": "task-phase0-validate-001",
    "agent_id": "fullstack_engineer_senior",
    "task_type": "code_change",
    "status": "committed",
    "timestamp": "2025-06-02T10:30:00Z"
  },

  "git_info": {
    "commit_hash": "abc123def456",
    "commit_message": "feat(payments): implement validate_payment [task-phase0-validate-001]",
    "author": "Qwen3 Coder Agent",
    "commit_date": "2025-06-02T10:30:00Z"
  },

  "change_summary": {
    "total_files_changed": 5,
    "sql_files_changed": 1,
    "typescript_files_changed": 3
  },

  "database_migrations": [
    {
      "migration_id": "001_initial_schema",
      "migration_file": "supabase/migrations/001_initial_schema.sql",
      "tables_affected": ["payments", "audit_log"],
      "timestamp": "2025-06-02T10:30:00Z"
    }
  ],

  "code_changes": [
    {
      "file_path": "supabase/functions/validate_payment/index.ts",
      "action": "created",
      "language": "typescript",
      "lines_added": 145,
      "lines_removed": 0
    },
    {
      "file_path": "supabase/functions/_shared/types.ts",
      "action": "modified",
      "language": "typescript",
      "lines_added": 12,
      "lines_removed": 3
    }
  ],

  "approval_log": [],

  "review_status": "pending"
}
```

---

## ✅ 手动追加内容

某些信息需要Agent手动追加到日志中:

### 审核记录
审核Agent审核后,在`approval_log`数组中追加:
```json
{
  "approval_log": [
    {
      "reviewer": "minimax_reviewer",
      "review_timestamp": "2025-06-02T11:00:00Z",
      "review_status": "approved",
      "review_notes": "代码符合规范,测试通过",
      "issues_found": []
    }
  ],
  "review_status": "approved"
}
```

### 测试结果
测试Agent追加:
```json
{
  "test_results": {
    "executed_at": "2025-06-02T10:45:00Z",
    "total_tests": 23,
    "passed": 23,
    "failed": 0,
    "coverage_percentage": 95.2
  }
}
```

---

## 🗄️ Supabase work_logs表结构

```sql
CREATE TABLE work_logs (
  id UUID PRIMARY KEY,
  task_id TEXT,
  agent_id TEXT,
  log_type VARCHAR(50),  -- schema_change/code_change/review/test
  log_content JSONB,      -- 完整的JSON日志
  git_commit_hash TEXT,
  status VARCHAR(50),     -- PENDING/REVIEWED/APPROVED/REJECTED
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  committed_at TIMESTAMP
);
```

---

## 🔍 查询日志

### 查看某个任务的所有日志
```sql
SELECT * FROM work_logs 
WHERE task_id = 'task-phase0-validate-001'
ORDER BY committed_at;
```

### 查看待审核的任务
```sql
SELECT task_id, agent_id, committed_at 
FROM work_logs 
WHERE status = 'PENDING'
ORDER BY committed_at;
```

### 查看某个Agent最近的工作
```sql
SELECT task_id, log_type, committed_at 
FROM work_logs 
WHERE agent_id = 'fullstack_engineer_senior'
ORDER BY committed_at DESC
LIMIT 20;
```

---

## 🎯 CHANGELOG.md(人类可读)

由post-commit hook自动维护`.logs/CHANGELOG.md`:

```markdown
# 项目变更日志

## [2025-06-02T11:00:00Z] task-phase0-validate-001

**Author**: Qwen3 Coder Agent
**Commit**: `abc123de`
**Message**: feat(payments): implement validate_payment
**Changes**: 1 SQL files, 3 TypeScript files
**Details**: [.logs/detailed/task-phase0-validate-001.json]
**Review Status**: ⏳ Pending

## [2025-06-02T10:30:00Z] task-phase0-schema-001

**Author**: Mistral Engineer
**Commit**: `def456gh`
...
```

---

## 🔒 严格的审核流程(用户选项)

**用户选择**: 严格 - 必须Reviewer Pass才能merge

### 流程
1. Agent完成任务并commit
2. post-commit自动生成日志
3. 通知Reviewer Agent
4. Reviewer审核:
   - 读取work_logs
   - 读取git diff
   - 运行测试
   - 检查日志完整性
5. Reviewer更新`review_status`:
   - `approved`: 可以merge
   - `rejected`: 必须返工
   - `needs_changes`: 修改后重新审核
6. 只有`approved`状态才能调用`merge_worktree.sh`

### 阻断机制
`merge_worktree.sh`会检查日志中的`review_status`:
```bash
REVIEW_STATUS=$(grep -o '"review_status":\s*"[a-z]*"' "$LOG_FILE" ...)
if [ "$REVIEW_STATUS" != "approved" ]; then
  echo "❌ Cannot merge without approval"
  exit 1
fi
```

---

## 📊 日志的用途

### 1. 审计追踪
- 谁在什么时候做了什么改动?
- 为什么做这个改动?
- 改动经过谁的审核?

### 2. 知识传承
- 后续Agent可以理解历史决策
- 新Agent入职时可以快速了解项目

### 3. 故障排查
- 出bug时,找到引入bug的commit
- 看到当时的所有上下文

### 4. 进度追踪
- 用户(Zack)可以随时看到项目进展
- 估算剩余工作量

### 5. AI模型评估
- 哪个Agent的代码经常被拒?
- 哪种任务最容易出问题?

---

## ⚠️ 关键注意事项

### 日志中不要包含敏感信息
- ❌ API keys
- ❌ 密码
- ❌ 完整的客户身份证号
- ❌ 银行账号

如有泄露,触发`pre-commit` hook的secret detection会拒绝提交

### 日志的持久性
- Git层: 跟随源代码,永久保留
- Supabase层: 永不删除,但可以归档
- 不要手动删除日志文件

### 日志的隐私
- `work_logs`表受RLS保护
- 销售team无法查看(他们看不到agent活动)
- 只有reviewer和super_admin能完整看到

---

## 🛠️ 故障恢复

### 如果post-commit hook失败
```bash
# 手动生成日志
bash scripts/generate_changelog.sh \
  --task-id task-xxx \
  --commit-hash $(git rev-parse HEAD) \
  --commit-msg "$(git log -1 --pretty=%B)" \
  --author "$(git log -1 --pretty=%an)" \
  --date "$(git log -1 --pretty=%aI)"
```

### 如果Supabase备份失败
- 不影响主流程
- Git层日志仍然完整
- 可以稍后手动重新备份:
```bash
curl -X POST "$SUPABASE_URL/rest/v1/work_logs" ...
```

详见: `AGENT_RESILIENCE.md`
