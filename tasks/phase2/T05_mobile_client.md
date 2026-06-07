# T05 — 移动客户端

**任务ID**: task-phase2-T05  
**执行Agent**: UI设计Agent (`nvidia/nemotron-3-super-120b-a12b`) + 全栈标准Agent (`minimaxai/minimax-m2.7`)  
**估时**: 30小时（UI设计10h + 全栈标准20h）  
**依赖**: T01 + T02 + T03 稳定运行后  
**分支**: `feature/phase2-T05-mobile-client`  
**优先级**: 🟡 Medium

---

## 任务目标

为销售团队开发移动端 Web App（PWA），重点场景：查看房源、管理客户、录入跟进记录。支持弱网络环境（喀什3G网络）。

---

## 执行边界

### 范围（本任务做的）
- 销售团队移动端 PWA
- 5个核心页面（见下方）
- 中维双语界面
- 离线缓存关键数据

### 不在本任务范围
- 项目经理/财务的管理后台（Phase 3 规划）
- iOS/Android 原生 App
- 客户端（购房者使用的界面）

---

## 技术选型

| 层 | 技术 | 理由 |
|----|------|------|
| 前端框架 | 纯 HTML/JS + Supabase JS SDK | 不引入 React/Vue，降低复杂度 |
| 样式 | Tailwind CSS CDN | 快速开发，移动端友好 |
| PWA | Service Worker + Cache API | 离线支持 |
| 部署 | Supabase Storage + CDN | 统一平台 |
| 认证 | Supabase Auth | 与 RLS 联动 |

---

## 5个核心页面

### 页面1: 登录页 (`/login`)
- 销售人员用手机号 + 密码登录
- 维语/中文切换按钮
- 登录成功后 JWT 存入 localStorage

### 页面2: 今日任务 (`/today`)
- 展示今天需要跟进的客户列表
- 每个客户：姓名 + 意向评分 + 上次跟进时间
- 快捷操作：直接拨号、录入跟进
- 离线时显示缓存数据 + "离线模式"提示

### 页面3: 房源列表 (`/properties`)
- 可用房源卡片（楼层图）
- 筛选：面积区间、楼层、朝向
- 每套房源：面积、户型、参考价（不显示成交价）
- 点击查看详情 + 维语描述

### 页面4: 客户详情 (`/customers/:id`)
- 客户基本信息
- 跟进记录时间线
- 感兴趣的房源（关联到页面3）
- 新增跟进记录的快捷入口
- 销售承诺记录（来自 `commitments_made`，只读）

### 页面5: 录入跟进 (`/followup/new?customer_id=xxx`)
- 跟进类型选择（电话/见面/微信/实地看房）
- 跟进内容输入（支持语音转文字 Web API）
- 客户反馈
- 下次跟进时间设置
- 提交调用 `/functions/v1/crm_management?action=add_followup`

---

## UI设计Agent职责

在全栈标准Agent开始编码前，UI设计Agent需要提供：

1. **5个页面的线框图**（HTML 注释格式，内嵌在 index.html 中）
2. **维语 RTL 布局方案**（CSS 切换策略）
3. **移动端响应式断点**（目标：375px 最小宽度）
4. **色彩规范**（主色调、状态颜色）

线框图格式：
```html
<!-- 
页面: 今日任务
[状态栏]
[销售员姓名] [通知图标]
─────────────────
今日待跟进 (3)
─────────────────
[客户A] [意向:8] [上次:昨天]
  [拨号] [跟进]
─────────────────
[客户B] [意向:5] [上次:3天前]
  [拨号] [跟进]
─────────────────
[底部导航: 今日 | 房源 | 客户 | 我的]
-->
```

---

## 离线支持设计

```javascript
// Service Worker 缓存策略
const CACHE_RESOURCES = [
  '/',
  '/today',
  '/properties',
  '/css/main.css',
  '/js/app.js'
];

// 数据缓存（IndexedDB）
// - 房源列表：每次联网时更新
// - 今日任务：每次联网时更新  
// - 跟进记录：离线录入，联网时同步
```

---

## 验收标准

| 检查项 | 标准 | 必须 |
|--------|------|------|
| 5个页面均可访问 | HTTP 200 | 必须 |
| 移动端可用（375px） | 无横向滚动条，文字可读 | 必须 |
| 中维语切换 | 切换后界面文字变化 | 必须 |
| 登录+查看房源流程 | 端到端可走通 | 必须 |
| 录入跟进 | 数据成功写入 DB | 必须 |
| 离线模式 | 断网后今日任务页仍可展示（缓存） | 建议 |
| 销售只看自己数据 | 通过 Supabase Auth + RLS | 必须 |

---

## 交付物

1. `mobile_client/index.html`（单文件 App，或多页面结构）
2. `mobile_client/sw.js`（Service Worker）
3. `mobile_client/app.js`（业务逻辑）
4. `mobile_client/css/main.css`
5. `mobile_client/README.md`（部署说明）
6. `.logs/detailed/task-phase2-T05.json`
7. **Git Commit**: `feat(phase2): implement sales mobile pwa client [task-phase2-T05]`

---

## 部署方式

```bash
# 上传到 Supabase Storage（public bucket）
supabase storage cp mobile_client/ ss:///mobile/ --recursive

# 访问地址
# https://<project>.supabase.co/storage/v1/object/public/mobile/index.html
```
