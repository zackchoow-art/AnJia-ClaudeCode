# T04 — Agent协同机制验证

**任务ID**: task-phase0-T04  
**执行Agent**: 全栈资深Agent (`qwen/qwen3-coder-480b-a35b-instruct`)  
**估时**: 3小时  
**依赖**: T01（系统完整性验证通过）  
**分支**: `test/phase0-T04-agent-orchestration`  
**优先级**: 🟡 High

---

## 任务目标

验证 Hermes Multi-Agent 协同机制的核心组件可以端到端运转：
1. Worktree 创建与隔离
2. task_locks 并发控制（锁获取、冲突检测、过期清理）
3. 工作日志双备份（Git + Supabase）
4. Worktree 合并与清理

---

## 执行边界

### 允许的操作
- 执行 `scripts/create_worktree.sh` 和 `scripts/merge_worktree.sh`
- 在测试 worktree 中做测试提交
- 向 `task_locks` 表插入和更新测试锁记录
- 向 `work_logs` 表插入测试记录
- 清理所有测试产生的 worktree 和锁记录

### 禁止的操作
- 不得修改任何 `scripts/*.sh` 脚本内容
- 不得修改 Git hooks
- 不得在主分支（main/master）直接提交
- 不得删除非本次任务创建的 task_locks 或 work_logs 记录

---

## 测试步骤

### Step 1: Worktree 创建测试

```bash
# 1.1 创建测试 worktree（使用合法UUID格式的task_id）
bash scripts/create_worktree.sh \
  --task-id "$(python3 -c 'import uuid; print(uuid.uuid4())')" \
  --branch test/T04-worktree-a \
  --agent T04-test-agent \
  --tables 'schema_version'

# 记录生成的 task_id 供后续步骤使用
TASK_A_ID=$(cat .redp/tasks/active/*.info 2>/dev/null | grep task_id | tail -1 | awk '{print $2}')

# 1.2 验证 worktree 已创建
ls worktrees/
# 预期: 包含 test-T04-worktree-a 目录

# 1.3 验证锁已创建
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT task_id, agent_id, table_names, lock_status 
  FROM task_locks 
  WHERE agent_id = 'T04-test-agent';
"
# 预期: lock_status = 'ACTIVE'
```

### Step 2: 并发锁冲突检测

```bash
# 2.1 创建第二个 worktree，尝试锁定相同的表
TASK_B_ID=$(python3 -c 'import uuid; print(uuid.uuid4())')

bash scripts/create_worktree.sh \
  --task-id "$TASK_B_ID" \
  --branch test/T04-worktree-b \
  --agent T04-test-agent-b \
  --tables 'schema_version'

# 预期: 脚本检测到 schema_version 已被锁定，输出冲突警告
# 行为取决于脚本实现：可能等待、可能报错退出、可能输出 CONFLICT 提示

# 2.2 验证只有第一个锁是 ACTIVE
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT task_id, agent_id, lock_status, table_names
  FROM task_locks 
  WHERE agent_id IN ('T04-test-agent', 'T04-test-agent-b')
  ORDER BY locked_at;
"
```

### Step 3: 工作日志双备份测试

```bash
# 3.1 在测试 worktree 中做提交（触发 post-commit hook）
cd worktrees/test-T04-worktree-a
echo "# T04 test" > T04_test_file.md
git add T04_test_file.md
git commit -m "test(orchestration): verify work log generation [task-phase0-T04]"

# 3.2 验证 Git 层日志生成
ls ../../.logs/detailed/
cat ../../.logs/detailed/task-phase0-T04.json
# 预期: JSON 文件存在，包含 commit_hash 和 task_id

# 3.3 验证 Supabase 备份
psql "../../$SUPABASE_CONNECTION_STRING" -c "
  SELECT task_id, agent_id, log_type, git_commit_hash, committed_at
  FROM work_logs
  ORDER BY committed_at DESC
  LIMIT 5;
"
# 预期: 有新记录，git_commit_hash 与刚才的提交匹配

cd ../..
```

### Step 4: 锁过期清理测试

```bash
# 4.1 手动将测试锁设置为过期
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE task_locks 
  SET locked_until = NOW() - INTERVAL '1 hour'
  WHERE agent_id = 'T04-test-agent';
"

# 4.2 运行清理脚本
bash scripts/cleanup_locks.sh

# 4.3 验证过期锁被标记为 EXPIRED
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT task_id, agent_id, lock_status 
  FROM task_locks 
  WHERE agent_id = 'T04-test-agent';
"
# 预期: lock_status = 'EXPIRED'
```

### Step 5: Worktree 合并与清理

```bash
# 5.1 执行合并（从测试 worktree 合并到 master）
bash scripts/merge_worktree.sh --task-id task-phase0-T04

# 5.2 验证 worktree 已删除
ls worktrees/
# 预期: test-T04-worktree-a 目录不存在

# 5.3 验证锁已释放
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT lock_status FROM task_locks WHERE agent_id = 'T04-test-agent';
"
# 预期: lock_status = 'RELEASED'

# 5.4 清理 B 的残留
git worktree remove worktrees/test-T04-worktree-b --force 2>/dev/null || true
git branch -D test/T04-worktree-b 2>/dev/null || true
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE task_locks SET lock_status = 'RELEASED' WHERE agent_id = 'T04-test-agent-b';
"
```

---

## 已知问题与处理

| 已知问题 | 处理方式 |
|---------|---------|
| `create_task_lock` 要求 task_id 为合法UUID | 使用 `python3 -c 'import uuid; print(uuid.uuid4())'` 生成 |
| `cleanup_locks.sh` 可能不存在 `--help` 参数 | 直接运行，查看日志输出 |
| Worktree merge 失败（分支有冲突） | 先在 worktree 内解决冲突再 merge |

---

## 验收标准

| 检查项 | 预期结果 | 是否必须 |
|--------|---------|---------|
| Worktree 创建成功 | 目录存在，锁 ACTIVE | 必须 |
| 并发锁冲突被检测 | 脚本有警告输出 | 必须 |
| Git 日志文件生成 | `.logs/detailed/*.json` 存在 | 必须 |
| Supabase 备份写入 | `work_logs` 有对应记录 | 必须 |
| 过期锁被清理 | lock_status = EXPIRED | 必须 |
| Worktree 合并成功 | 目录删除，锁 RELEASED | 必须 |

---

## 交付物

1. **测试报告**: `.logs/tests/task-phase0-T04-report.json`
2. **工作日志**: `.logs/detailed/task-phase0-T04.json`
3. **Git Commit**: `test(orchestration): verify multi-agent coordination mechanism [task-phase0-T04]`
