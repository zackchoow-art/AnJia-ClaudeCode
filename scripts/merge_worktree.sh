#!/bin/bash
# ============================================================================
# merge_worktree.sh
# 审核通过后合并worktree并清理
# ============================================================================

set -e

TASK_ID=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --task-id) TASK_ID="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [ -z "$TASK_ID" ]; then
  echo "Usage: $0 --task-id TASK_ID"
  exit 1
fi

# 加载task信息
TASK_INFO=".redp/tasks/active/${TASK_ID}.info"
if [ ! -f "$TASK_INFO" ]; then
  echo "❌ Task info not found: $TASK_INFO"
  exit 1
fi

export $(grep -v '^#' "$TASK_INFO" | xargs)
export $(grep -v '^#' .env | xargs)

echo "🔀 Merging worktree for $TASK_ID"
echo "   Branch: $BRANCH"
echo "   Worktree: $WORKTREE_PATH"

# 1. 验证审核状态
echo "📋 Step 1: 验证审核状态..."
LOG_FILE=".logs/detailed/${TASK_ID}.json"
if [ -f "$LOG_FILE" ]; then
  REVIEW_STATUS=$(grep -o '"review_status":\s*"[a-z]*"' "$LOG_FILE" | head -1 | grep -o '"[a-z]*"$' | tr -d '"')
  if [ "$REVIEW_STATUS" != "approved" ]; then
    echo "❌ Review status is '$REVIEW_STATUS', not 'approved'"
    echo "   Cannot merge without approval"
    exit 1
  fi
  echo "✅ Review approved"
else
  echo "⚠️  No work log found, proceeding with caution..."
fi

# 2. 检查worktree中是否有未提交的改动
cd "$WORKTREE_PATH"
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Worktree has uncommitted changes"
  cd - > /dev/null
  exit 1
fi

# 3. 切回主目录
cd - > /dev/null

# 4. 合并分支到main
echo "📋 Step 2: 合并到main..."
git checkout main 2>/dev/null || git checkout master
git merge "$BRANCH" --no-ff -m "merge: $TASK_ID approved and merged"

# 5. 删除worktree
echo "📋 Step 3: 清理worktree..."
git worktree remove "$WORKTREE_PATH"

# 6. 释放锁
echo "📋 Step 4: 释放task lock..."
curl -s -X DELETE "$SUPABASE_URL/functions/v1/create_task_lock" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\"}" > /dev/null

# 7. 归档task信息
mkdir -p .redp/tasks/completed
mv "$TASK_INFO" ".redp/tasks/completed/${TASK_ID}.info"
echo "STATUS=COMPLETED" >> ".redp/tasks/completed/${TASK_ID}.info"
echo "COMPLETED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> ".redp/tasks/completed/${TASK_ID}.info"

# 8. 删除已合并的分支
git branch -d "$BRANCH" 2>/dev/null || git branch -D "$BRANCH"

echo ""
echo "✅ Merged successfully"
echo "   Branch $BRANCH deleted"
echo "   Worktree cleaned"
echo "   Lock released"
echo "   Task archived to .redp/tasks/completed/"
