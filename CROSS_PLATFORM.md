# REDP Phase 0 - 跨平台兼容性

**说明**: REDP系统主要面向Linux/macOS环境,但考虑Zack可能在Windows环境运行Claude Code,本文档说明跨平台注意事项。

---

## 🖥️ 支持的平台

| 平台 | 状态 | 注意事项 |
|------|------|---------|
| **Linux** | ✅ 完全支持 | Ubuntu 20.04+, Debian 11+ |
| **macOS** | ✅ 完全支持 | Big Sur+ |
| **Windows + WSL2** | ✅ 推荐 | 等同于Linux体验 |
| **Windows 原生** | ⚠️ 部分支持 | 需要特殊配置 |

---

## 🔧 Windows原生环境的差异

### 1. 符号链接

**问题**: Windows默认禁止创建符号链接(需要管理员权限)

**解决方案**: `scripts/create_worktree.sh`已自动检测:
```bash
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  # Windows: 复制文件而不是符号链接
  cp .env "$WORKTREE_PATH/.env"
else
  # Unix: 符号链接
  ln -s "$(pwd)/.env" "$WORKTREE_PATH/.env"
fi
```

**代价**: 每个worktree有独立的.env副本,修改密钥时需要更新所有副本

**最佳实践**: 在Windows上使用WSL2,避免这个问题

### 2. 换行符(CRLF vs LF)

**问题**: Windows用CRLF,Unix用LF,可能导致脚本执行异常

**解决方案**: 添加 `.gitattributes`:
```
*.sh text eol=lf
*.bash text eol=lf
.git/hooks/* text eol=lf
```

如果已经被污染:
```bash
# 转换所有sh文件为LF
find . -name "*.sh" -exec dos2unix {} \;
```

### 3. Bash脚本

**问题**: Windows没有原生bash

**解决方案**:
- 选项A: 使用Git Bash(随Git for Windows安装)
- 选项B: 使用WSL2(强烈推荐)
- 选项C: 使用Cygwin

### 4. 路径分隔符

**问题**: Windows用`\`,Unix用`/`

**好消息**: 项目所有代码都用`/`,Git Bash和WSL自动处理

**注意**: 不要在自己编辑文件路径时用`\`

### 5. 文件权限

**问题**: Windows没有Unix的执行权限

**解决方案**:
```bash
# Git保留执行权限
git update-index --chmod=+x scripts/*.sh
git update-index --chmod=+x git_setup/hooks/*

# 验证
git ls-files --stage scripts/ | grep '100755'
```

---

## 📝 PowerShell替代脚本(可选)

如果不想用WSL2,可以为关键脚本提供PowerShell版本:

```powershell
# scripts/create_worktree.ps1
param(
  [Parameter(Mandatory=$true)][string]$TaskId,
  [Parameter(Mandatory=$true)][string]$Branch,
  [Parameter(Mandatory=$true)][string]$Agent,
  [string]$Tables = ""
)

Write-Host "🌿 创建worktree for $Agent"

$worktreePath = "worktrees\$($Branch -replace '/','-')"

# 创建worktree
git worktree add $worktreePath -b $Branch

# 复制.env (Windows用复制)
Copy-Item .env "$worktreePath\.env"

Write-Host "✅ Worktree created at $worktreePath"
```

---

## 🐧 推荐: WSL2配置

如果Zack使用Windows,强烈建议安装WSL2:

### 安装WSL2
```powershell
# 在PowerShell管理员模式
wsl --install -d Ubuntu-22.04

# 重启电脑
```

### 在WSL2中工作
```bash
# 进入WSL
wsl

# 克隆/复制项目到WSL内部(性能更好)
cd ~
cp -r /mnt/c/path/to/redp-phase0 ./redp-phase0
cd redp-phase0

# 正常使用所有Unix命令
bash scripts/init_project.sh
```

### 性能注意
- **重要**: 把项目放在WSL内部(`~/`),不要放在`/mnt/c/`
- 跨文件系统会非常慢

---

## 🔍 平台检测代码

如果Agent生成的代码需要兼容多平台,使用以下检测:

### Bash
```bash
case "$OSTYPE" in
  linux*)   PLATFORM="linux" ;;
  darwin*)  PLATFORM="macos" ;;
  msys*)    PLATFORM="windows_msys" ;;
  cygwin*)  PLATFORM="windows_cygwin" ;;
  win32*)   PLATFORM="windows" ;;
  *)        PLATFORM="unknown" ;;
esac
```

### TypeScript/Deno
```typescript
const platform = Deno.build.os;  // "linux" | "darwin" | "windows"

if (platform === "windows") {
  // Windows specific code
}
```

---

## 📦 依赖管理跨平台

### Node.js
- 所有平台都支持
- 推荐用nvm/nvm-windows管理版本

### Deno
- 所有平台都支持
- 一键安装: https://deno.land/

### PostgreSQL Client
- Linux: `apt install postgresql-client`
- macOS: `brew install libpq`
- Windows: 从 https://www.postgresql.org/download/windows/ 下载
- WSL: 同Linux

### Supabase CLI
- 所有平台: `npm install -g supabase`

---

## ⚠️ 字符集和编码

### 数据库
**问题**: 中文字符可能因encoding错误而损坏

**解决方案**: 已在`001_initial_schema.sql`中明确设置:
```sql
SET client_encoding = 'UTF8';
```

Supabase默认就是UTF8,但显式设置更安全

### 文件
**问题**: Windows的某些工具默认用GBK保存文件

**解决方案**:
- 用VSCode或类似编辑器(默认UTF-8 without BOM)
- 在Windows记事本中不要保存为"ANSI"
- 检查文件编码:
```bash
file *.sql
# 应该输出: UTF-8 Unicode text
```

### Git
```bash
# 全局设置
git config --global core.autocrlf input  # macOS/Linux
git config --global core.autocrlf true   # Windows (原生)

# 处理中文文件名
git config --global core.quotePath false
```

---

## 🧪 跨平台测试

每个PR应在以下环境测试:
- Linux (Ubuntu)
- macOS
- WSL2 on Windows

不强制要求测试Windows原生环境,但记录已知限制

---

## 📋 平台特定的已知问题

### macOS问题
- **问题**: `date -d`不支持(BSD date)
- **解决**: 使用兼容写法:
```bash
# 不要这样(GNU date)
DATE=$(date -d "+1 day")

# 应该这样(跨平台)
DATE=$(date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || \
       date -u -v+1d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
```

### Windows问题
- **问题**: 路径长度限制(260字符)
- **解决**: 启用长路径支持:
```powershell
# 注册表编辑(管理员)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1
```

- **问题**: 病毒扫描可能锁文件
- **解决**: 排除项目目录

### WSL2问题
- **问题**: 系统时钟漂移
- **解决**: `sudo hwclock -s`

---

## ✅ 跨平台兼容性Checklist

部署到新平台前检查:
- [ ] Git, Node, npm 已安装
- [ ] PostgreSQL client (`psql`)能连接Supabase
- [ ] Bash可用(Windows用WSL或Git Bash)
- [ ] 文件编码是UTF-8
- [ ] 换行符是LF
- [ ] 所有sh脚本有执行权限
- [ ] 时区和时钟正确
