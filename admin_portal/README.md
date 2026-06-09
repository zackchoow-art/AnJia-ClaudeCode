# 安家地产管理系统 (Admin Portal)

**项目**: Real Estate Development Platform (REDP)  
**版本**: v2.0.0 (完整可部署版本)  
**当前阶段**: Phase 0 - 支付审批 Gate + 核心数据脊柱  
**部署目标**: Supabase PostgreSQL + Edge Functions  
**AI 框架**: Hermes Multi-Agent (8 个 Agent 协同)

---

## 📦 功能模块

本系统包含完整的房地产开发项目管理功能：

- **Dashboard 仪表盘** - 核心数据概览
- **Projects 项目管理** - 全生命周期项目跟踪
- **Organization 组织架构** - 团队与角色管理
- **Sales 销售管理** - 客户与销售线索管理
- **Engineering 工程管理** - 施工进度与质量管控
- **Contracts 合同管理** - 合同签署与履约跟踪
- **Approvals 审批中心** - 支付与事务审批流
- **Finance 财务管理** - 预算、支付与成本账本

---

## 🚀 快速开始

### 本地运行

```bash
cd admin_portal
npm install
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 环境变量

复制 `.env.example` 到 `.env.local` 并填写必要的配置：

```bash
cp .env.example .env.local
# 编辑 .env.local 填写 Supabase 和 API 密钥
```

---

## 📚 相关文档

- [ARCHITECTURE.md](../ARCHITECTURE.md) - 系统架构设计
- [DATA_SCHEMA.md](../DATA_SCHEMA.md) - 数据库表结构
- [CODE_STANDARDS.md](../CODE_STANDARDS.md) - 代码规范
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - 部署指南

---

## 🛠️ 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS + Vite
- **路由**: React Router v7
- **数据库**: Supabase PostgreSQL
- **后端 API**: Supabase Edge Functions (Deno)
- **Agent 协作**: Nvidia NIM API (Qwen, Nemotron 等)

---

## 📞 故障排查

详见 [ARCHITECTURE.md](../ARCHITECTURE.md) 中的故障排查章节。

---

**版本**: v2.0.0  
**最后更新**: 2026-06-09
