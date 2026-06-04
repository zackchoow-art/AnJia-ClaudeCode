#!/bin/bash
# ============================================================================
# generate_changelog.sh
# 自动生成工作日志(JSON格式) + 更新CHANGELOG.md
# ============================================================================

set -e

# 参数解析
TASK_ID=""
COMMIT_HASH=""
COMMIT_MSG=""
AUTHOR=""
DATE=""
SQL_CHANGES="0"
TS_CHANGES="0"

while [[ $# -gt 0 ]]; do
  case $1 in
    --task-id) TASK_ID="$2"; shift 2 ;;
    --commit-hash) COMMIT_HASH="$2"; shift 2 ;;
    --commit-msg) COMMIT_MSG="$2"; shift 2 ;;
    --author) AUTHOR="$2"; shift 2 ;;
    --date) DATE="$2"; shift 2 ;;
    --sql-changes) SQL_CHANGES="$2"; shift 2 ;;
    --ts-changes) TS_CHANGES="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [ -z "$TASK_ID" ]; then
  echo "❌ ERROR: --task-id is required"
  exit 1
fi

# 确保目录存在
mkdir -p .logs/detailed

LOG_FILE=".logs/detailed/${TASK_ID}.json"

# 获取改动的文件列表
CHANGED_FILES=$(git diff HEAD~1 HEAD --name-only 2>/dev/null || echo "")

# 构建文件变更详情JSON
FILE_CHANGES="[]"
if [ -n "$CHANGED_FILES" ]; then
  FILE_CHANGES="["
  FIRST=true
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      if [ "$FIRST" = "false" ]; then
        FILE_CHANGES="${FILE_CHANGES},"
      fi
      FIRST=false
      
      # 获取改动统计
      STATS=$(git diff HEAD~1 HEAD --numstat "$file" 2>/dev/null | head -1)
      ADDED=$(echo "$STATS" | awk '{print $1}')
      REMOVED=$(echo "$STATS" | awk '{print $2}')
      
      # 判断action
      if git diff HEAD~1 HEAD --diff-filter=A --name-only | grep -q "^$file$"; then
        ACTION="created"
      elif git diff HEAD~1 HEAD --diff-filter=D --name-only | grep -q "^$file$"; then
        ACTION="deleted"
      else
        ACTION="modified"
      fi
      
      # 检测语言
      case "$file" in
        *.sql) LANG="sql" ;;
        *.ts|*.tsx) LANG="typescript" ;;
        *.js|*.jsx) LANG="javascript" ;;
        *.md) LANG="markdown" ;;
        *.sh) LANG="bash" ;;
        *) LANG="other" ;;
      esac
      
      FILE_CHANGES="${FILE_CHANGES}{
        \"file_path\": \"$file\",
        \"action\": \"$ACTION\",
        \"language\": \"$LANG\",
        \"lines_added\": ${ADDED:-0},
        \"lines_removed\": ${REMOVED:-0}
      }"
    fi
  done <<< "$CHANGED_FILES"
  FILE_CHANGES="${FILE_CHANGES}]"
fi

# 检测数据库迁移
DB_MIGRATIONS="[]"
SQL_FILES=$(echo "$CHANGED_FILES" | grep -E '\.sql$' || true)
if [ -n "$SQL_FILES" ]; then
  DB_MIGRATIONS="["
  FIRST=true
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      if [ "$FIRST" = "false" ]; then
        DB_MIGRATIONS="${DB_MIGRATIONS},"
      fi
      FIRST=false
      
      MIGRATION_ID=$(basename "$file" .sql)
      
      # 检测migration中的操作
      TABLES_CREATED=$(git diff HEAD~1 HEAD "$file" 2>/dev/null | grep -oE 'CREATE TABLE[[:space:]]+(IF NOT EXISTS )?[a-z_]+' | awk '{print $NF}' | sort -u | head -20 || true)
      
      TABLES_JSON="[]"
      if [ -n "$TABLES_CREATED" ]; then
        TABLES_JSON="["
        FIRST_T=true
        while IFS= read -r t; do
          if [ -n "$t" ]; then
            if [ "$FIRST_T" = "false" ]; then
              TABLES_JSON="${TABLES_JSON},"
            fi
            FIRST_T=false
            TABLES_JSON="${TABLES_JSON}\"$t\""
          fi
        done <<< "$TABLES_CREATED"
        TABLES_JSON="${TABLES_JSON}]"
      fi
      
      DB_MIGRATIONS="${DB_MIGRATIONS}{
        \"migration_id\": \"$MIGRATION_ID\",
        \"migration_file\": \"$file\",
        \"tables_affected\": $TABLES_JSON,
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
      }"
    fi
  done <<< "$SQL_FILES"
  DB_MIGRATIONS="${DB_MIGRATIONS}]"
fi

# 生成工作日志JSON
cat > "$LOG_FILE" << EOF
{
  "task_metadata": {
    "task_id": "${TASK_ID}",
    "agent_id": "git-hook-system",
    "task_type": "code_change",
    "status": "committed",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  },

  "git_info": {
    "commit_hash": "${COMMIT_HASH}",
    "commit_message": $(echo "$COMMIT_MSG" | jq -Rs . 2>/dev/null || echo "\"${COMMIT_MSG//\"/\\\"}\""),
    "author": "${AUTHOR}",
    "commit_date": "${DATE}"
  },

  "change_summary": {
    "total_files_changed": $(echo "$CHANGED_FILES" | wc -l),
    "sql_files_changed": ${SQL_CHANGES},
    "typescript_files_changed": ${TS_CHANGES}
  },

  "database_migrations": ${DB_MIGRATIONS},

  "code_changes": ${FILE_CHANGES},

  "approval_log": [],

  "review_status": "pending"
}
EOF

# 更新CHANGELOG.md
CHANGELOG=".logs/CHANGELOG.md"

if [ ! -f "$CHANGELOG" ]; then
  cat > "$CHANGELOG" << 'EOF'
# 项目变更日志

本文件由Git post-commit hook自动生成。
每个entry记录一次commit的关键信息。

---

EOF
fi

# 追加新entry到CHANGELOG (在文件顶部的标题之后)
TEMP_FILE=$(mktemp)
head -5 "$CHANGELOG" > "$TEMP_FILE"
cat >> "$TEMP_FILE" << EOF

## [${DATE}] ${TASK_ID}

**Author**: ${AUTHOR}  
**Commit**: \`${COMMIT_HASH:0:8}\`  
**Message**: ${COMMIT_MSG}  
**Changes**: ${SQL_CHANGES} SQL files, ${TS_CHANGES} TypeScript files  
**Details**: [\`${LOG_FILE}\`](${LOG_FILE})  
**Review Status**: ⏳ Pending

EOF
tail -n +6 "$CHANGELOG" >> "$TEMP_FILE"
mv "$TEMP_FILE" "$CHANGELOG"

echo "✅ Generated: $LOG_FILE"
echo "✅ Updated: $CHANGELOG"
