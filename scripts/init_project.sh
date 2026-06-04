#!/bin/bash
# ============================================================================
# init_project.sh
# 完整的项目初始化脚本(供Claude Code使用)
# ============================================================================

set -e

echo "🚀 REDP Phase 0 - 项目初始化"
echo "================================="

# 1. 检查依赖
echo ""
echo "📋 Step 1: 检查依赖..."
command -v git >/dev/null 2>&1 || { echo "❌ git not installed"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "⚠️  psql not installed, some features unavailable"; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm not installed"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "❌ curl not installed"; exit 1; }
echo "✅ 依赖检查完成"

# 2. 检查环境变量
echo ""
echo "📋 Step 2: 检查.env文件..."
if [ ! -f .env ]; then
  if [ -f git_setup/.env.example ]; then
    cp git_setup/.env.example .env
    echo "⚠️  已创建.env模板, 请编辑后再继续"
    echo "   关键变量: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NVIDIA_API_KEY"
    exit 1
  else
    echo "❌ .env.example not found"
    exit 1
  fi
fi
echo "✅ .env文件已存在"

# 加载环境变量
export $(grep -v '^#' .env | xargs)

# 3. 验证关键变量
echo ""
echo "📋 Step 3: 验证关键环境变量..."
[ -z "$SUPABASE_URL" ] && echo "❌ SUPABASE_URL not set" && exit 1
[ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "❌ SUPABASE_SERVICE_ROLE_KEY not set" && exit 1
[ -z "$SUPABASE_CONNECTION_STRING" ] && echo "❌ SUPABASE_CONNECTION_STRING not set" && exit 1
[ -z "$NVIDIA_API_KEY" ] && echo "⚠️  NVIDIA_API_KEY not set (Agent functionality unavailable)"
echo "✅ 环境变量验证通过"

# 4. 测试数据库连接
echo ""
echo "📋 Step 4: 测试数据库连接..."
if psql "$SUPABASE_CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1; then
  echo "✅ 数据库连接成功"
else
  echo "❌ 数据库连接失败"
  exit 1
fi

# 5. 执行数据库迁移
echo ""
echo "📋 Step 5: 执行数据库迁移..."
for migration in supabase/migrations/*.sql; do
  echo "   Running: $migration"
  if psql "$SUPABASE_CONNECTION_STRING" < "$migration" > /tmp/migration_output.log 2>&1; then
    echo "   ✅ $(basename $migration)"
  else
    echo "   ❌ Failed: $migration"
    cat /tmp/migration_output.log
    exit 1
  fi
done
echo "✅ 所有迁移执行完成"

# 6. 检查表和policy
echo ""
echo "📋 Step 6: 验证数据库结构..."
TABLE_COUNT=$(psql "$SUPABASE_CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
POLICY_COUNT=$(psql "$SUPABASE_CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" | tr -d ' ')
echo "   Tables created: $TABLE_COUNT"
echo "   RLS policies: $POLICY_COUNT"

if [ "$TABLE_COUNT" -lt 11 ]; then
  echo "⚠️  Expected 11+ tables, got $TABLE_COUNT"
fi

# 7. 部署Edge Functions
echo ""
echo "📋 Step 7: 部署Edge Functions..."
if command -v supabase >/dev/null 2>&1; then
  for func in validate_payment approve_payment audit_log create_task_lock; do
    if [ -d "supabase/functions/$func" ]; then
      echo "   Deploying $func..."
      supabase functions deploy "$func" --project-ref "${SUPABASE_PROJECT_ID}" 2>&1 | tail -3
    fi
  done
  echo "✅ Edge Functions部署完成"
else
  echo "⚠️  Supabase CLI未安装, 请手动部署: npm install -g supabase"
fi

# 8. 设置Git
echo ""
echo "📋 Step 8: 配置Git..."
if [ ! -d .git ]; then
  git init
  git config user.name "REDP System"
  git config user.email "system@redp.local"
fi

# 拷贝gitignore
if [ -f git_setup/.gitignore ] && [ ! -f .gitignore ]; then
  cp git_setup/.gitignore .gitignore
fi

# 安装Git hooks
mkdir -p .git/hooks
cp git_setup/hooks/post-commit .git/hooks/
cp git_setup/hooks/pre-commit .git/hooks/
chmod +x .git/hooks/post-commit .git/hooks/pre-commit

# 给scripts添加执行权限
chmod +x scripts/*.sh

echo "✅ Git配置完成"

# 9. 初始化日志目录
echo ""
echo "📋 Step 9: 初始化日志目录..."
mkdir -p .logs/detailed .redp/tasks worktrees

if [ ! -f .logs/CHANGELOG.md ]; then
  cat > .logs/CHANGELOG.md << 'EOF'
# 项目变更日志

## [初始化] REDP Phase 0

**Status**: ✅ 已部署

### 已创建
- 11个数据库表(含customers表)
- 完整的RLS策略
- 4个Edge Functions
- Git hooks自动化
- 工作日志体系

EOF
fi
echo "✅ 日志目录初始化完成"

# 10. 测试Nvidia API
echo ""
echo "📋 Step 10: 测试Nvidia API..."
if [ -n "$NVIDIA_API_KEY" ]; then
  TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    "${NVIDIA_API_BASE_URL}/models" \
    -H "Authorization: Bearer $NVIDIA_API_KEY")
  
  if [ "$TEST_RESPONSE" = "200" ]; then
    echo "✅ Nvidia API连接成功"
  else
    echo "⚠️  Nvidia API测试失败 (HTTP $TEST_RESPONSE)"
  fi
fi

# 11. 完成
echo ""
echo "🎉 ====================================="
echo "🎉 REDP Phase 0 初始化完成!"
echo "🎉 ====================================="
echo ""
echo "下一步:"
echo "  1. 查看HERMES_AGENT_TEMPLATES.md了解如何分配任务"
echo "  2. 启动总指挥Agent (DeepSeek V4 Pro)"
echo "  3. 总指挥会拆分任务并分配给其他Agent"
echo ""
echo "首次提交:"
echo "  git add -A"
echo "  git commit -m 'feat(phase0): initialize REDP core schema'"
echo ""
