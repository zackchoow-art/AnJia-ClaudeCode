# ChromeDevTools MCP 配置与使用指南

## 概述

本项目配置了 ChromeDevTools MCP (Model Context Protocol) 工具，用于通过 Claude Code 自动化浏览器操作、性能分析和页面调试。

**最后更新**: 2026-06-09  
**Node.js 要求**: v20.19.0+ LTS (当前使用 v24.16.0)  
**MCP 工具版本**: chrome-devtools-mcp@latest

---

## 目录

- [ChromeDevTools MCP 配置与使用指南](#chromedevtools-mcp-配置与使用指南)
- [概述](#概述)
- [目录](#目录)
- [安装与配置](#安装与配置)
  - [Node.js 版本要求](#nodejs-版本要求)
  - [MCP 服务器配置](#mcp-服务器配置)
- [使用方法](#使用方法)
  - [基本命令](#基本命令)
  - [主要功能](#主要功能)
  - [常用场景](#常用场景)
- [配置选项](#配置选项)
  - [启动参数](#启动参数)
  - [环境变量](#环境变量)
- [故障排除](#故障排除)

---

## 安装与配置

### Node.js 版本要求

chrome-devtools-mcp 需要 **Node.js v20.19.0 或更高版本**。

当前项目使用的 Node.js 版本：**v24.16.0 LTS**

#### 安装 nvm (Node Version Manager)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

#### 使用 nvm 安装并切换到所需版本

```bash
nvm install --lts
nvm use --lts
nvm alias default node  # 设置为默认版本
```

#### 验证 Node.js 版本

```bash
node --version  # 应输出 v20.19.0 或更高版本
npx --version
```

### MCP 服务器配置

Claude Code 的 MCP 服务器配置文件位于 `~/.claude.json`。

#### 自动连接模式 (Chrome 144+)

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "type": "stdio",
      "command": "/Users/george/.claude/mcp-chrome-devtools.sh",
      "args": [],
      "env": {}
    }
  }
}
```

#### 手动指定 Chrome 实例

```bash
# 启动 Chrome 并启用远程调试
chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-profile
```

然后配置：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "type": "stdio",
      "command": "/Users/george/.claude/mcp-chrome-devtools.sh",
      "args": ["--browserUrl", "http://127.0.0.1:9222"],
      "env": {}
    }
  }
}
```

#### 使用 npx 直接配置

```bash
claude mcp add chrome-devtools --scope user /Users/george/.claude/mcp-chrome-devtools.sh
```

---

## 使用方法

### 基本命令

```bash
# 列出已配置的 MCP 服务器
claude mcp list

# 查看特定服务器详情
claude mcp get chrome-devtools

# 移除 MCP 服务器
claude mcp remove chrome-devtools

# 添加 MCP 服务器（使用包装脚本）
claude mcp add chrome-devtools --scope user /Users/george/.claude/mcp-chrome-devtools.sh
```

### 主要功能

ChromeDevTools MCP 提供以下核心功能：

1. **浏览器控制**
   - 打开新标签页
   - 导航到 URL
   - 前进/后退导航
   - 刷新页面

2. **DOM 操作**
   - 执行 JavaScript 代码
   - 获取元素属性
   - 设置表单值
   - 触发事件

3. **性能分析**
   - 性能追踪 (performance.tracing)
   - 加载时间分析
   - 资源使用监控

4. **屏幕截图**
   - 全页截图
   - 视口截图
   - 指定元素截图

5. **网络监控**
   - 查看网络请求
   - 分析响应数据
   - 网络性能分析

6. **控制台日志**
   - 捕获 console.log 输出
   - 捕获错误信息
   - 警告和提示信息

### 常用场景

#### 1. 性能测试

```
检查 https://example.com 的页面加载性能
```

#### 2. 自动化测试

```
导航到 https://example.com 并验证页面标题包含 "Example"
```

#### 3. 截图分享

```
截取 https://example.com 的全屏截图
```

#### 4. 调试工具

```
打开浏览器并连接调试器来诊断加载问题
```

---

## 配置选项

### 启动参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `--autoConnect` | boolean | 自动连接到本地运行的 Chrome 实例 (Chrome 144+) |
| `--browserUrl` | string | 连接到现有的 Chrome 调试实例，例如 `http://127.0.0.1:9222` |
| `--wsEndpoint` | string | WebSocket 端点连接到现有 Chrome 实例 |
| `--headless` | boolean | 无头模式运行（无 UI） |
| `--channel` | string | 指定 Chrome 渠道：canary, dev, beta, stable |
| `--isolated` | boolean | 使用临时用户数据目录，退出后自动清理 |
| `--viewport` | string | 初始视口大小，例如 `1280x720` |
| `--slim` | boolean | 使用精简工具集（仅导航、脚本执行和截图） |

### 环境变量

| 变量名 | 说明 |
|--------|------|
| `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS` | 禁用使用统计信息收集 |
| `CI` | 设置后禁用使用统计信息（与上面相同功能） |
| `CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS` | 禁用自动更新检查 |

---

## 故障排除

### 问题：Node.js 版本不兼容

**错误信息**: 
```
ERROR: `chrome-devtools-mcp` does not support Node v20.17.0. Please upgrade to Node 20.19.0 LTS or a newer LTS.
```

**解决方案**:

1. 使用 nvm 安装新的 LTS 版本：
   ```bash
   nvm install --lts
   nvm use --lts
   ```

2. 验证版本：
   ```bash
   node --version  # 确保输出 v20.19.0 或更高
   ```

3. 如果使用包装脚本 `/Users/george/.claude/mcp-chrome-devtools.sh`，确保其可执行：
   ```bash
   chmod +x /Users/george/.claude/mcp-chrome-devtools.sh
   ```

### 问题：MCP 连接失败

**错误信息**: 
```
chrome-devtools: npx chrome-devtools-mcp@latest - Failed to connect
```

**解决方案**:

1. 检查 MCP 服务器配置：
   ```bash
   claude mcp list
   ```

2. 移除并重新添加服务器：
   ```bash
   claude mcp remove chrome-devtools
   claude mcp add chrome-devtools --scope user /Users/george/.claude/mcp-chrome-devtools.sh
   ```

3. 验证 Node.js 路径正确：
   ```bash
   ls -la /Users/george/.nvm/versions/node/v24.16.0/bin/
   ```

### 问题：Chrome 实例无法连接

**解决方案**:

1. 启动 Chrome 时启用远程调试：
   ```bash
   open -a Google\ Chrome --args --remote-debugging-port=9222
   ```

2. 在 MCP 配置中指定 browserUrl：
   ```json
   {
     "args": ["--browserUrl", "http://127.0.0.1:9222"]
   }
   ```

---

## 相关链接

- [ChromeDevTools MCP GitHub 仓库](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Claude Code MCP 文档](https://docs.claude.ai/docs/mcp-overview)
- [Node.js 官方网站](https://nodejs.org/)
- [nvm GitHub 仓库](https://github.com/nvm-sh/nvm)

---

## 维护记录

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-06-09 | 配置完成 | 成功配置 ChromeDevTools MCP，使用 Node.js v24.16.0 LTS |
