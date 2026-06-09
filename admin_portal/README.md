# AJ Admin Portal - 管理后台前端

基于 React + TypeScript + Vite + Ant Design 构建的现代化管理后台。

## 技术栈

- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Ant Design 5.x** - UI 组件库
- **Tailwind CSS 4.x** - 样式框架
- **React Router v6** - 路由管理
- **Axios** - HTTP 客户端

## 功能特性

- ✅ 仪表盘 - 数据可视化和统计概览
- ✅ 项目管理 - 房地产项目 CRUD
- ✅ 客户管理 - 客户信息管理和销售分配
- ✅ 合同管理 - 合同创建、审批和状态追踪
- ✅ 支付审批 - 多级支付审批流程
- ✅ 预算成本 - 资金预算和支出管理
- ✅ 审计日志 - 不可篡改的操作记录

## 开发环境

### 依赖安装

```bash
cd admin_portal
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 环境配置

复制 `.env.example` 到 `.env` 并根据需要修改：

```bash
cp .env.example .env
# 编辑 .env 文件
VITE_API_URL=http://localhost:8000
```

## 项目结构

```
admin_portal/
├── src/
│   ├── components/      # 可复用组件
│   ├── layouts/         # 布局组件
│   │   └── DashboardLayout.tsx
│   ├── pages/           # 页面组件
│   │   ├── DashboardPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── PaymentsPage.tsx
│   │   ├── ContractsPage.tsx
│   │   ├── BudgetPage.tsx
│   │   └── AuditPage.tsx
│   ├── types/           # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/           # 工具函数
│   │   └── api.ts       # API 封装
│   ├── styles/          # 全局样式
│   ├── App.tsx          # 主应用组件
│   ├── main.tsx         # 应用入口
│   └── index.css        # 全局 CSS + Tailwind
├── public/              # 静态资源
├── .env                 # 环境变量
├── vite.config.ts       # Vite 配置
└── tsconfig.json        # TypeScript 配置
```

## API 集成

前端通过 `/api` 前缀代理到后端服务器（默认 `http://localhost:8000`）。

如需修改 API 地址，请编辑 `.env` 文件中的 `VITE_API_URL` 变量。

## UI 设计特点

- **科技感**：深色主题 + 渐变色彩
- **玻璃拟态**：半透明卡片效果
- **响应式**：支持移动端、平板和桌面端
- **现代化**：使用最新 React Hooks 和 TypeScript 特性
