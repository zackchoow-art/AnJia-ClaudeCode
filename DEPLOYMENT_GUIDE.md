# REDP Phase 0 - 部署指南

**目标**: 给Claude Code的逐步部署说明。每一步都可以独立执行和验证。

---

## 📋 前置要求

### 必需工具
| 工具 | 最低版本 | 安装命令 |
|------|---------|---------|
| Git | 2.30+ | `apt install git` 或 `brew install git` |
| Node.js | 18+ | https://nodejs.org/ |
| PostgreSQL client (psql) | 14+ | `apt install postgresql-client` |
| Supabase CLI | latest | `npm install -g supabase` |
| Deno (可选,测试用) | 1.40+ | https://deno.land/ |
| curl | any | 系统自带 |

### 必需账户
- ✅ Supabase账户(已连接)
- ✅ Nvidia NIM API账户(从 https://build.nvidia.com 获取免费key)
- ✅ GitHub账户(用于源码管理,可选)

---

## 🚀 部署流程(11个步骤)

### Step 1: 准备工作区

```bash
# 解压文件包到目标目录
unzip redp-phase0.zip -d redp-phase0
cd redp-phase0

# 给所有脚本执行权限
chmod +x scripts/*.sh
chmod +x git_setup/hooks/*

# 验证文件结构
find . -type f | head -30
```

**验证点**: 应该看到约35个文件,包括migrations、functions、scripts、prompts等

---

### Step 2: 配置环境变量

```bash
# 复制模板
cp git_setup/.env.example .env

# 编辑.env (用vim、nano、或Claude直接修改)
nano .env
```

**必填字段**:
```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"   # 谨慎!不要泄露
SUPABASE_DB_PASSWORD=your_password
SUPABASE_PROJECT_ID=your_project_id
NVIDIA_API_KEY=nvapi-xxxxx
```

**获取方式**:
- Supabase keys: Dashboard > Settings > API
- Nvidia API key: https://build.nvidia.com/settings/api-keys

---

### Step 3: 测试数据库连接

```bash
# 加载环境变量
export $(grep -v '^#' .env | xargs)

# 测试连接
psql "$SUPABASE_CONNECTION_STRING" -c "SELECT version();"
```

**预期输出**: PostgreSQL版本信息

**故障排查**:
- 报"connection refused": 检查SUPABASE_URL和密码
- 报"FATAL: password authentication failed": 重置数据库密码
- 报"could not translate host name": 网络问题

---

### Step 4: 执行数据库迁移

按顺序执行3个migration文件:

```bash
# 1. 创建表结构
psql "$SUPABASE_CONNECTION_STRING" < supabase/migrations/001_initial_schema.sql

# 2. 创建角色和RLS策略
psql "$SUPABASE_CONNECTION_STRING" < supabase/migrations/002_rls_policies.sql

# 3. 创建索引
psql "$SUPABASE_CONNECTION_STRING" < supabase/migrations/003_indexes_constraints.sql
```

**验证**:
```bash
# 验证表数量(应该≥11)
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT COUNT(*) AS table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public';
"

# 验证RLS策略数量(应该≥20)
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT COUNT(*) AS policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public';
"

# 验证角色(应该看到6个自定义role)
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT rolname FROM pg_roles 
  WHERE rolname IN ('sales_team', 'project_manager', 'finance', 'reviewer', 'system_agent', 'super_admin');
"
```

---

### Step 5: 加载测试数据(可选)

**警告: 仅在开发/测试环境执行,生产环境跳过!**

```bash
psql "$SUPABASE_CONNECTION_STRING" < supabase/seed_data.sql
```

**验证**:
```bash
psql "$SUPABASE_CONNECTION_STRING" -c "
  SELECT 
    (SELECT COUNT(*) FROM projects) AS projects,
    (SELECT COUNT(*) FROM customers) AS customers,
    (SELECT COUNT(*) FROM contracts) AS contracts,
    (SELECT COUNT(*) FROM payments) AS payments;
"
```

预期: projects=1, customers=2, contracts=1, payments=1

---

### Step 6: 部署Edge Functions

```bash
# 登录Supabase CLI
supabase login

# 链接到你的项目
supabase link --project-ref "$SUPABASE_PROJECT_ID"

# 部署所有functions
supabase functions deploy validate_payment
supabase functions deploy approve_payment
supabase functions deploy audit_log
supabase functions deploy create_task_lock
```

**验证**:
```bash
# 测试validate_payment
curl -X POST "$SUPABASE_URL/functions/v1/validate_payment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "p1111111-1111-1111-1111-111111111111"}'
```

预期: 返回 `{"success": true, "data": {...}}`

---

### Step 7: 配置Git

```bash
# 初始化(如果还没有)
git init
git config user.name "REDP System"
git config user.email "system@redp.local"

# 复制gitignore
cp git_setup/.gitignore .

# 安装Git hooks
cp git_setup/hooks/post-commit .git/hooks/
cp git_setup/hooks/pre-commit .git/hooks/
chmod +x .git/hooks/post-commit .git/hooks/pre-commit

# 验证hooks
ls -la .git/hooks/post-commit .git/hooks/pre-commit
```

---

### Step 8: 测试工作日志生成

```bash
# 做一个微小改动
echo "# Test" >> NOTES.md

# 提交
git add NOTES.md
git commit -m "test: verify work log generation [task-test-001]"

# 验证日志生成
ls -la .logs/detailed/
cat .logs/detailed/task-test-001.json 2>/dev/null || ls .logs/detailed/

# 验证Supabase备份
psql "$SUPABASE_CONNECTION_STRING" -c "SELECT * FROM work_logs ORDER BY committed_at DESC LIMIT 1;"
```

---

### Step 9: 测试Nvidia API

```bash
# 测试Commander Agent的模型可用性
curl -X POST "$NVIDIA_API_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $NVIDIA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/deepseek-v4-pro",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

预期: 返回JSON响应。如果失败,检查:
- API key正确性
- 网络是否能访问 integrate.api.nvidia.com
- 速率限制(40 RPM)

---

### Step 10: 验证Agent协同机制

```bash
# 测试创建worktree
bash scripts/create_worktree.sh \
  --task-id task-test-002 \
  --branch test/worktree-verify \
  --agent system-test \
  --tables 'projects'

# 验证
ls worktrees/
psql "$SUPABASE_CONNECTION_STRING" -c "SELECT * FROM task_locks WHERE task_id = 'task-test-002';"

# 清理测试worktree
git worktree remove worktrees/test-worktree-verify
psql "$SUPABASE_CONNECTION_STRING" -c "
  UPDATE task_locks SET lock_status = 'RELEASED' 
  WHERE task_id = 'task-test-002';
"
```

---

### Step 11: 完成检查

运行完整的验证脚本:

```bash
bash scripts/init_project.sh
```

预期输出: "🎉 REDP Phase 0 初始化完成!"

---

## ✅ 部署成功标志

部署成功后,你应该有:
- ✅ 11+张表创建在Supabase
- ✅ 20+条RLS策略激活
- ✅ 6个数据库role创建
- ✅ 4个Edge Functions部署
- ✅ Git hooks自动生成日志
- ✅ Nvidia API连通
- ✅ Worktree协调机制工作

---

## 🔧 故障排查

### 问题1: psql command not found
```bash
# Ubuntu/Debian
sudo apt install postgresql-client

# macOS
brew install libpq && brew link --force libpq
```

### 问题2: RLS策略报错"role does not exist"
原因: 002_rls_policies.sql包含CREATE ROLE,但权限不足
解决:
```bash
# 用service_role key执行(绕过限制)
psql "$SUPABASE_CONNECTION_STRING" \
  -v ON_ERROR_STOP=1 \
  < supabase/migrations/002_rls_policies.sql
```

### 问题3: Edge Function部署失败
```bash
# 重新登录
supabase logout
supabase login

# 检查项目链接
supabase link --project-ref YOUR_PROJECT_ID
```

### 问题4: Nvidia API 401 Unauthorized
```bash
# 验证API key格式(应该以nvapi-开头)
echo $NVIDIA_API_KEY | head -c 10
# 应该输出: nvapi-xxxx

# 重新生成key
# 访问: https://build.nvidia.com/settings/api-keys
```

### 问题5: Git hook无法执行
```bash
# 检查权限
ls -la .git/hooks/post-commit

# 如果不是executable
chmod +x .git/hooks/post-commit

# 检查shebang
head -1 .git/hooks/post-commit  # 应该是 #!/bin/bash
```

### 问题6: Windows用户的符号链接问题
看 [`CROSS_PLATFORM.md`](CROSS_PLATFORM.md) 详细说明

---

## 📈 下一步: 启动Agent协同

部署完成后,启动第一个Agent协同任务:

```bash
# 1. 调用总指挥Agent (DeepSeek V4 Pro)
# 给它发送Phase 0的高层需求

# 2. 总指挥会生成任务分解
# 输出: .redp/tasks/task-phase0-xxx.json

# 3. 执行任务分配
bash scripts/create_worktree.sh --task-id task-phase0-001 ...

# 4. 各Agent在自己的worktree中工作

# 5. 完成后审核Agent审核
# 6. 通过后merge_worktree.sh合并
```

详见: [`E2E_EXAMPLE.md`](E2E_EXAMPLE.md) - 完整的端到端示例

---

**部署支持**: 如遇到本文档未覆盖的问题,查看 [`AGENT_RESILIENCE.md`](AGENT_RESILIENCE.md)
