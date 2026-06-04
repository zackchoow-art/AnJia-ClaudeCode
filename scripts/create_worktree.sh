#!/bin/bash
# ============================================================================
# create_worktree.sh
# 为Agent创建git worktree并配置环境
# ============================================================================

set -e

# 参数解析
TASK_ID=""
BRANCH_NAME=""
AGENT_ID=""
TABLES=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --task-id) TASK_ID="$2"; shift 2 ;;
    --branch) BRANCH_NAME="$2"; shift 2 ;;
    --agent) AGENT_ID="$2"; shift 2 ;;
    --tables) TABLES="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [ -z "$TASK_ID" ] || [ -z "$BRANCH_NAME" ] || [ -z "$AGENT_ID" ]; then
  echo "Usage: $0 --task-id TASK_ID --branch BRANCH_NAME --agent AGENT_ID [--tables 'table1,table2']"
  exit 1
fi

# 加载环境变量
export $(grep -v '^#' .env | xargs)

WORKTREE_PATH="worktrees/${BRANCH_NAME//\//-}"

echo "🌿 创建worktree for $AGENT_ID"
echo "   Task: $TASK_ID"
echo "   Branch: $BRANCH_NAME"
echo "   Path: $WORKTREE_PATH"

# 1. 创建worktree
if [ -d "$WORKTREE_PATH" ]; then
  echo "⚠️  Worktree already exists, skipping creation"
else
  git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
fi

# 2. 配置环境(符号链接.env)
# 跨平台兼容: Windows用cp, Unix用ln -s
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  # Windows: 复制文件
  cp .env "$WORKTREE_PATH/.env"
  echo "   📝 .env copied (Windows compatibility)"
else
  # Unix: 符号链接
  if [ ! -L "$WORKTREE_PATH/.env" ]; then
    ln -s "$(pwd)/.env" "$WORKTREE_PATH/.env"
    echo "   🔗 .env symlink created"
  fi
fi

# 3. 创建任务锁(通过Supabase API)
if [ -n "$TABLES" ]; then
  IFS=',' read -ra TABLE_ARRAY <<< "$TABLES"
  TABLES_JSON=$(printf '"%s",' "${TABLE_ARRAY[@]}" | sed 's/,$//')
  
  LOCKED_UNTIL=$(date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || \
                 date -u -v+1d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
  
  echo "🔒 Creating task lock for tables: $TABLES"
  
  LOCK_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/create_task_lock" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"task_id\": \"$TASK_ID\",
      \"agent_id\": \"$AGENT_ID\",
      \"table_names\": [${TABLES_JSON}],
      \"locked_until\": \"$LOCKED_UNTIL\",
      \"lock_reason\": \"Worktree for branch $BRANCH_NAME\"
    }")
  
  LOCK_STATUS=$(echo "$LOCK_RESPONSE" | grep -oE '"status"\s*:\s*"[A-Z]+"' | head -1)
  
  if echo "$LOCK_STATUS" | grep -q "CONFLICT"; then
    echo "❌ Failed to acquire lock - conflicts exist"
    echo "$LOCK_RESPONSE"
    git worktree remove "$WORKTREE_PATH"
    exit 1
  fi
  
  echo "✅ Task lock acquired"
fi

# 4. 创建task信息文件
mkdir -p .redp/tasks/active
cat > ".redp/tasks/active/${TASK_ID}.info" << EOF
TASK_ID=$TASK_ID
BRANCH=$BRANCH_NAME
AGENT=$AGENT_ID
WORKTREE_PATH=$WORKTREE_PATH
TABLES_LOCKED=$TABLES
CREATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
STATUS=ACTIVE
EOF

echo ""
echo "✅ Worktree created successfully"
echo "   Path: $WORKTREE_PATH"
echo "   Agent can now work in: cd $WORKTREE_PATH"
