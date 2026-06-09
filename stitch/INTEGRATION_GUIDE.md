# 数据库集成指南

本文档说明了 stitch 应用与 Supabase 后端数据库的集成方式。

## 项目概述

stitch 是一个基于 React + Vite 的前端应用，通过 Supabase Client 连接到后端 PostgreSQL 数据库。应用实现了完整的房地产开发管理功能。

## 集成架构

```
┌─────────────────┐     Supabase SDK      ┌──────────────────┐
│   stitch App    │ ◄────────────────────► │  Supabase DB     │
│   (React)       │     REST API          │  (PostgreSQL)    │
└─────────────────┘                        └──────────────────┘
                                                      │
                                                      │ RLS Policies
                                                      ▼
┌─────────────────┐                                      ┌─────────────────┐
│   Type Definitions (TypeScript)               │  Row-Level Security  │
│   - database.ts │                                      └─────────────────┘
└─────────────────┘
```

## 目录结构

```
stitch/
├── src/
│   ├── types/
│   │   └── database.ts          # 数据库表 TypeScript 类型定义
│   ├── services/
│   │   ├── supabaseClient.ts    # Supabase 客户端封装
│   │   └── api.ts               # 业务逻辑 API 层
│   └── pages/
│       ├── Dashboard.tsx        # 实时运营数据看板
│       ├── Projects.tsx         # 项目管理
│       ├── Contracts.tsx        # 合同管理
│       ├── Sales.tsx            # 销售与客户管理
│       ├── Finance.tsx          # 财务管理
│       ├── Organization.tsx     # 组织架构与权限
│       ├── Approvals.tsx        # 审批流
│       └── Settings.tsx         # 系统设置
```

## 数据库表映射

| 页面 | Supabase 表 | 说明 |
|------|-------------|------|
| Dashboard | `audit_log`, `payments`, `projects` | 实时运营数据 |
| Projects | `projects` | 项目基础数据 |
| Contracts | `contracts` | 合同管理 |
| Sales | `customers`, `properties` | 客户与房源管理 |
| Finance | `payments`, `cost_budget`, `cost_ledger` | 财务数据 |
| Organization | `customers`, `audit_log` | 组织与权限 |

## 环境配置

1. 复制 `.env.example` 到 `.env.local`
2. 填写 Supabase 配置：

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## API 服务层

### supabaseClient.ts

提供通用的 CRUD 操作：

```typescript
import { projectsService, customersService } from './services/supabaseClient';

// 获取所有记录
const { data, error } = await projectsService.getAll();

// 插入新记录
const { data, error } = await projectsService.create({ project_name: 'New Project' });
```

### api.ts

封装业务逻辑：

```typescript
import { getCustomerStats, getPaymentSummary, updatePropertyStatus } from './services/api';

// 获取客户统计
const stats = await getCustomerStats();

// 更新房源状态
await updatePropertyStatus(propertyId, 'RESERVED', '预留原因');
```

## 权限控制 (RLS)

应用通过 Supabase 的 Row Level Security 实现数据隔离：

- **销售团队**: 只能访问自己负责的客户 (`sales_agent_id`)
- **项目管理人员**: 可以访问所有数据
- **财务人员**: 无法看到敏感的合同和付款信息

## 类型系统

所有数据库表都有对应的 TypeScript 接口定义在 `src/types/database.ts`：

```typescript
export interface Project {
  id: string;
  project_name: string;
  location: string;
  project_status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  total_budget: number;
  // ...
}
```

## 开发指南

### 添加新页面

1. 创建 TypeScript 类型定义
2. 在 `api.ts` 中添加业务逻辑函数
3. 在 `services/supabaseClient.ts` 中导出 CRUD 服务
4. 创建页面组件并使用 `createClient` 连接 Supabase

### 数据流

```typescript
// 1. 组件挂载时加载数据
useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  setLoading(true);
  try {
    // 调用 API 服务层
    const { data, error } = await someApiCall();
    setData(data);
  } finally {
    setLoading(false);
  }
};
```

## 构建部署

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 故障排除

### 认证错误
- 检查 `.env.local` 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
- 确认 Supabase 项目的 RLS 策略正确配置

### 数据未显示
- 打开浏览器开发者工具，检查网络请求
- 验证用户已登录 (`supabase.auth.getUser()`)

## 相关文档

- [Supabase 文档](https://supabase.com/docs)
- [React Query](https://tanstack.com/query/latest/docs/react/overview) - 数据获取推荐库
- [Tailwind CSS](https://tailwindcss.com/) - UI 框架
