# REDP Phase 0 - Agent容错与失败恢复

**核心目标**: Agent崩溃或失败时,系统能够自动恢复,不需要人工干预。

---

## 🎯 失败场景分类

### Level 1: 临时性故障(自动重试)
- Nvidia API速率限制(429)
- 网络抖动
- 临时的数据库连接问题
- Supabase Edge Function冷启动

### Level 2: 任务级失败(需要重新分配)
- Agent超时(>2小时无更新)
- Agent返回的代码语法错误
- 审核被拒绝(needs_changes)

### Level 3: 系统级失败(需要人工介入)
- 数据库结构损坏
- Supabase账户问题
- Git仓库损坏

---

## ⚡ Level 1: 自动重试机制

### Nvidia API速率限制(40 RPM)

**自动重试逻辑(在Claude Code的Agent调用封装中)**:

```typescript
async function callAgent(model: string, messages: Message[], maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {...},
        body: JSON.stringify({ model, messages })
      });
      
      // 429 = Rate Limited
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        console.log(`⏳ Rate limited, waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      // 5xx = 服务器错误
      if (response.status >= 500) {
        const backoff = Math.pow(2, attempt) * 1000;  // 1s, 2s, 4s
        console.log(`⚠️  Server error ${response.status}, retry in ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
      
      return response;
      
    } catch (error) {
      lastError = error;
      const backoff = Math.pow(2, attempt) * 1000;
      console.log(`❌ Network error, retry in ${backoff}ms: ${error.message}`);
      await sleep(backoff);
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}
```

### 模型降级策略

如果首选模型不可用,降级到备用模型:

```typescript
const MODEL_FALLBACK_CHAIN = {
  "fullstack_senior": [
    "qwen/qwen3-coder-480b-a35b-instruct",   // 首选
    "mistralai/mistral-medium-3.5-128b",      // 降级1
    "nvidia/nemotron-3-nano-30b-a3b"           // 最终降级
  ],
  "commander": [
    "deepseek-ai/deepseek-v4-pro",
    "qwen/qwen3-coder-480b-a35b-instruct"
  ]
};

async function callAgentWithFallback(role: string, messages: Message[]) {
  const models = MODEL_FALLBACK_CHAIN[role];
  
  for (const model of models) {
    try {
      const response = await callAgent(model, messages);
      console.log(`✅ Used model: ${model}`);
      return response;
    } catch (error) {
      console.warn(`⚠️  Model ${model} failed, trying next...`);
    }
  }
  
  throw new Error(`All fallback models failed for role: ${role}`);
}
```

---

## 🔄 Level 2: 任务恢复机制

### 超时检测

**cleanup_locks.sh** 定时运行(建议每5分钟):

```bash
# 检查长时间运行的任务(>2h)
LONG_RUNNING=$(psql ... -c "
  SELECT task_id, agent_id, locked_at 
  FROM task_locks 
  WHERE lock_status = 'ACTIVE' 
    AND locked_at < CURRENT_TIMESTAMP - INTERVAL '2 hours';
")

# 标记为EXPIRED
psql ... -c "
  UPDATE task_locks 
  SET lock_status = 'EXPIRED' 
  WHERE locked_until < CURRENT_TIMESTAMP 
    AND lock_status = 'ACTIVE'
"
```

### 任务恢复流程

```
检测到过期任务
   ↓
检查worktree状态:
   ├── 有未提交改动 → 保留,标记为RECOVERED,通知用户
   ├── 已提交但未审核 → 直接进入审核流程
   └── 完全没动静 → 标记FAILED,清理worktree

   ↓
更新任务状态
   ├── RECOVERED: .redp/tasks/recovered/
   └── FAILED: .redp/tasks/failed/

   ↓
释放task_lock(允许其他Agent接手)

   ↓
如果需要重做,总指挥重新分配
```

### 自动恢复脚本

```bash
#!/bin/bash
# scripts/recover_failed_tasks.sh

for task_info in .redp/tasks/active/*.info; do
  TASK_ID=$(basename "$task_info" .info)
  source "$task_info"
  
  # 检查lock状态
  LOCK_STATUS=$(psql ... -t -c "
    SELECT lock_status FROM task_locks WHERE task_id = '$TASK_ID';
  ")
  
  if [ "$(echo $LOCK_STATUS | tr -d ' ')" = "EXPIRED" ]; then
    echo "🔧 Recovering task: $TASK_ID"
    
    # 检查worktree
    if [ -d "$WORKTREE_PATH" ]; then
      cd "$WORKTREE_PATH"
      
      if ! git diff --quiet; then
        # 有未提交改动
        echo "   📝 Has uncommitted changes, marking as RECOVERED"
        cd ..
        mv "$task_info" ".redp/tasks/recovered/${TASK_ID}.info"
      else
        # 干净的worktree
        UNCOMMITTED=$(git log main..HEAD --oneline | wc -l)
        if [ "$UNCOMMITTED" -gt 0 ]; then
          echo "   ✅ Has commits, moving to review"
          mv "$task_info" ".redp/tasks/active/in_review/${TASK_ID}.info"
        else
          echo "   ❌ Nothing done, marking as FAILED"
          cd ..
          git worktree remove "$WORKTREE_PATH"
          mv "$task_info" ".redp/tasks/failed/${TASK_ID}.info"
        fi
      fi
    fi
  fi
done
```

---

## 🛡️ Level 3: 系统级保护

### 数据库备份

每天通过Supabase的自动备份:
- 7天滚动备份(免费版)
- 用 `pg_dump` 手动备份关键时刻

```bash
# 手动备份
pg_dump "$SUPABASE_CONNECTION_STRING" > backup_$(date +%Y%m%d_%H%M).sql
```

### Git仓库备份

```bash
# 镜像到远程
git remote add backup https://github.com/yourusername/redp-backup.git
git push --mirror backup
```

### 工作日志的双备份

- **Git层**: `.logs/detailed/` 跟随源代码
- **Supabase层**: `work_logs`表
- 两者独立,任一损坏都可恢复

---

## 🚨 监控与报警

### 关键指标

```sql
-- 1. 过去24小时的失败率
SELECT 
  COUNT(*) FILTER (WHERE status = 'PENDING' AND committed_at < NOW() - INTERVAL '2 hours') AS stuck,
  COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
  COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected
FROM work_logs
WHERE committed_at > NOW() - INTERVAL '24 hours';

-- 2. 当前活跃任务
SELECT COUNT(*) FROM task_locks WHERE lock_status = 'ACTIVE';

-- 3. 长时间运行的任务
SELECT task_id, agent_id, locked_at, locked_until - NOW() AS time_remaining
FROM task_locks 
WHERE lock_status = 'ACTIVE'
ORDER BY locked_at;
```

### 健康检查脚本

```bash
#!/bin/bash
# scripts/health_check.sh

echo "🏥 REDP系统健康检查"

# 1. 检查Supabase连接
psql "$SUPABASE_CONNECTION_STRING" -c "SELECT 1" > /dev/null && \
  echo "✅ Supabase: OK" || echo "❌ Supabase: FAIL"

# 2. 检查Edge Functions
for func in validate_payment approve_payment audit_log; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$SUPABASE_URL/functions/v1/$func" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
  if [ "$STATUS" = "405" ] || [ "$STATUS" = "400" ]; then
    # 405/400正常(因为我们没传body)
    echo "✅ Function $func: deployed"
  else
    echo "❌ Function $func: HTTP $STATUS"
  fi
done

# 3. 检查Nvidia API
NV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$NVIDIA_API_BASE_URL/models" \
  -H "Authorization: Bearer $NVIDIA_API_KEY")
[ "$NV_STATUS" = "200" ] && \
  echo "✅ Nvidia API: OK" || echo "❌ Nvidia API: HTTP $NV_STATUS"

# 4. 检查过期的锁
EXPIRED=$(psql "$SUPABASE_CONNECTION_STRING" -t -c "
  SELECT COUNT(*) FROM task_locks 
  WHERE lock_status = 'ACTIVE' AND locked_until < NOW();
" | tr -d ' ')
[ "$EXPIRED" = "0" ] && \
  echo "✅ Locks: clean" || echo "⚠️  Locks: $EXPIRED expired"

# 5. 检查Git状态
[ -d .git ] && echo "✅ Git: initialized" || echo "❌ Git: not initialized"

# 6. 检查worktrees
WORKTREE_COUNT=$(git worktree list | wc -l)
echo "ℹ️  Worktrees: $WORKTREE_COUNT active"

echo ""
echo "完成"
```

---

## 🔧 常见故障处理

### 故障1: Agent返回乱码或截断

```bash
# 可能原因: 上下文窗口超限
# 解决:
# 1. 检查输入token数量
# 2. 拆分任务到更小的单元
# 3. 用更大上下文的模型
```

### 故障2: 数据库迁移失败一半

```bash
# 找到失败的迁移
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT * FROM schema_version 
  WHERE status = 'FAILED'
  ORDER BY executed_at DESC LIMIT 1;
"

# 执行rollback strategy
# (每个迁移都在末尾注释了rollback steps)
psql "$SUPABASE_CONNECTION_STRING" -f <(grep "^-- DROP" supabase/migrations/001_initial_schema.sql)

# 修复后重新执行
```

### 故障3: 两个Agent同时拿到锁(理论上不应发生)

```bash
# 立即停止两个Agent
kill -SIGTERM <pid1> <pid2>

# 检查冲突
psql ... -c "
  SELECT * FROM task_locks 
  WHERE table_names && ARRAY['contested_table'] 
  ORDER BY locked_at;
"

# 保留先到的,释放后到的
psql ... -c "
  UPDATE task_locks SET lock_status = 'RELEASED' 
  WHERE id = '<later_lock_id>';
"

# 调查为什么create_task_lock允许了冲突
# (可能是Edge Function的race condition)
```

### 故障4: 工作日志没生成

```bash
# 检查git hook是否被执行
cat .git/hooks/post-commit  # 应该存在
ls -la .git/hooks/post-commit  # 应该是executable

# 检查脚本权限
ls -la scripts/generate_changelog.sh
chmod +x scripts/generate_changelog.sh

# 手动生成
bash scripts/generate_changelog.sh \
  --task-id $(git log -1 --pretty=%B | grep -oE 'task-[a-z0-9-]+') \
  --commit-hash $(git log -1 --pretty=%H) \
  ...

# 检查Supabase备份
psql ... -c "SELECT * FROM work_logs ORDER BY committed_at DESC LIMIT 5;"
```

---

## 📋 灾难恢复Checklist

如果发生重大故障(如数据库被误删):

- [ ] 1. 停止所有Agent活动
- [ ] 2. 评估损失范围(哪些表?哪些任务?)
- [ ] 3. 从Supabase备份恢复数据库
- [ ] 4. 从Git重新部署所有Edge Functions
- [ ] 5. 验证RLS策略仍然激活
- [ ] 6. 运行 `scripts/health_check.sh`
- [ ] 7. 通知用户损失范围和恢复状态
- [ ] 8. 决定是否重新执行失败的任务

---

## 📊 SLA目标

| 指标 | 目标 |
|------|------|
| Agent调用成功率 | ≥ 99% |
| Task完成率 | ≥ 95% |
| 数据库可用性 | ≥ 99.9%(Supabase保证) |
| 工作日志完整性 | 100% (双备份) |
| 平均任务时长 | < 8小时 |
| 失败自动恢复率 | ≥ 90% |
