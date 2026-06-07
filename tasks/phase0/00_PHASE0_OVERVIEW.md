# Phase 0 任务概述

**目标**: 验证已部署的基础设施端到端可用，确保支付Gate、RLS隔离、Agent协同机制均符合业务需求  
**截止**: 2026-07-31  
**前置条件**: Phase 0 基础设施已于 2026-06-04 全量部署完成

---

## 任务依赖图

```
T01 系统完整性验证
    │
    ├──→ T02 支付Gate端到端测试
    │         │
    │         └──→ T05 性能基准测试
    │
    ├──→ T03 RLS安全测试
    │
    ├──→ T04 Agent协同机制验证
    │
    └── (T02 + T03 + T04 + T05 全部通过)
              │
              ↓
         T06 Phase 0 完整验收
```

**并行可行**: T02、T03、T04 在 T01 完成后可并行执行  
**串行必须**: T05 依赖 T02；T06 依赖所有前置任务

---

## 任务清单

| ID | 任务名称 | 执行Agent | 估时 | 依赖 | 优先级 |
|----|---------|----------|------|------|--------|
| T01 | 系统完整性验证 | 测试Agent | 2h | 无 | 🔴 Critical |
| T02 | 支付Gate端到端测试 | 测试Agent | 4h | T01 | 🔴 Critical |
| T03 | RLS安全测试 | 测试Agent + 审核Agent | 3h | T01 | 🔴 Critical |
| T04 | Agent协同机制验证 | 全栈资深Agent | 3h | T01 | 🟡 High |
| T05 | 性能基准测试 | 测试Agent | 2h | T02 | 🟡 High |
| T06 | Phase 0完整验收 | 审核Agent | 3h | T02+T03+T04+T05 | 🔴 Critical |

**总估时**: 约17小时（串行）；并行优化后约9小时

---

## Phase 0 成功定义

验收通过的标志（全部满足）：

- [ ] 12张表均可正常读写（按权限角色）
- [ ] 支付Gate完整流程：PENDING → APPROVED → EXECUTED 走通
- [ ] sales_team 无法查看 payments 和 cost_ledger（RLS验证）
- [ ] audit_log 不可被任何角色 UPDATE 或 DELETE
- [ ] 4个Edge Functions P95延迟 < 500ms
- [ ] 所有测试覆盖率 ≥ 90%
- [ ] Agent并发锁机制无死锁
- [ ] 审核Agent出具 review_status=approved 报告
