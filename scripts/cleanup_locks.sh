#!/bin/bash
# ============================================================================
# cleanup_locks.sh
# 清理过期的任务锁(防止Agent崩溃导致死锁)
# 建议通过cron每5分钟运行一次
# ============================================================================

set -e

export $(grep -v '^#' .env | xargs)

echo "🧹 Cleaning up expired task locks..."

# 调用数据库直接清理
RESULT=$(psql "$SUPABASE_CONNECTION_STRING" -t -c "
  UPDATE task_locks 
  SET lock_status = 'EXPIRED' 
  WHERE locked_until < CURRENT_TIMESTAMP 
    AND lock_status = 'ACTIVE'
  RETURNING task_id, agent_id;
")

if [ -n "$RESULT" ]; then
  echo "Released expired locks:"
  echo "$RESULT" | while read line; do
    if [ -n "$line" ]; then
      echo "  - $line"
    fi
  done
  
  # 同时归档对应的task信息
  ACTIVE_TASKS=$(ls .redp/tasks/active/ 2>/dev/null || true)
  if [ -n "$ACTIVE_TASKS" ]; then
    for task_file in .redp/tasks/active/*.info; do
      if [ -f "$task_file" ]; then
        TASK_ID=$(basename "$task_file" .info)
        if echo "$RESULT" | grep -q "$TASK_ID"; then
          mkdir -p .redp/tasks/failed
          mv "$task_file" ".redp/tasks/failed/${TASK_ID}.info"
          echo "STATUS=EXPIRED" >> ".redp/tasks/failed/${TASK_ID}.info"
          echo "  📁 Archived: $TASK_ID"
        fi
      fi
    done
  fi
else
  echo "✅ No expired locks found"
fi

# 检查长时间运行的任务(超过2小时无更新)
echo ""
echo "🕐 Checking long-running tasks..."
LONG_RUNNING=$(psql "$SUPABASE_CONNECTION_STRING" -t -c "
  SELECT task_id, agent_id, locked_at 
  FROM task_locks 
  WHERE lock_status = 'ACTIVE' 
    AND locked_at < CURRENT_TIMESTAMP - INTERVAL '2 hours';
")

if [ -n "$LONG_RUNNING" ]; then
  echo "⚠️  Long-running tasks (>2h):"
  echo "$LONG_RUNNING"
  echo "  Consider checking if these agents are still responsive"
else
  echo "✅ No long-running tasks"
fi
