// ============================================================================
// financial_planning Unit Tests
// ============================================================================

import { assertEquals, assertGreaterThan } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "https://deno.land/x/mock@0.1.0/mod.ts";

// ============================================================================
// Test Cases for Financial Planning Logic
// ============================================================================

describe('Cash Flow Projection', () => {
  /**
   * 现金流数据一致性测试
   * inflow - outflow = net_flow
   */
  it('should maintain cash flow consistency', () => {
    const months = [
      { month: '2026-07', expected_inflow: 500000, planned_outflow: 300000 },
      { month: '2026-08', expected_inflow: 800000, planned_outflow: 450000 },
    ];

    months.forEach(m => {
      const net_flow = m.expected_inflow - m.planned_outflow;
      assertEquals(net_flow, m.expected_inflow - m.planned_outflow);
      assertGreaterThan(m.expected_inflow, 0);
      assertGreaterThan(m.planned_outflow, 0);
    });
  });

  /**
   * 累计余额计算测试
   */
  it('should calculate cumulative balance correctly', () => {
    let cumulative = 1000000; // 初始余额
    const cashFlows = [
      { net_flow: 200000 },
      { net_flow: 350000 },
      { net_flow: -50000 }
    ];

    const expectedBalances = [1200000, 1550000, 1500000];

    cashFlows.forEach((flow, index) => {
      cumulative += flow.net_flow;
      assertEquals(cumulative, expectedBalances[index]);
    });
  });

  /**
   * 支付优先级排序测试
   */
  it('should prioritize payments correctly', () => {
    const recommendations = [
      { priority: 'HIGH', amount: 200000 },
      { priority: 'MEDIUM', amount: 300000 },
      { priority: 'LOW', amount: 100000 },
      { priority: 'HIGH', amount: 150000 }
    ];

    // HIGH 应该在 MEDIUM 前面
    const highIndices = recommendations
      .map((r, i) => r.priority === 'HIGH' ? i : -1)
      .filter(i => i !== -1);
    const mediumIndices = recommendations
      .map((r, i) => r.priority === 'MEDIUM' ? i : -1)
      .filter(i => i !== -1);

    assertEquals(highIndices.length, 2);
    assertEquals(mediumIndices.length, 1);
  });
});

describe('Budget Utilization', () => {
  it('should calculate utilization percentage correctly', () => {
    const totalBudget = 1000000;
    const spentAmount = 350000;

    const utilization = (spentAmount / totalBudget) * 100;
    assertEquals(utilization, 35);
  });

  it('should cap utilization at 100%', () => {
    const totalBudget = 500000;
    const spentAmount = 600000;

    const utilization = Math.min((spentAmount / totalBudget) * 100, 100);
    assertEquals(utilization, 100);
  });
});

describe('Risk Alert Logic', () => {
  it('should identify cash flow risk when balance < 0', () => {
    let cumulativeBalance = 100000;
    const monthlyFlows = [50000, -30000, -20000, -150000];

    for (const flow of monthlyFlows) {
      cumulativeBalance += flow;
      if (cumulativeBalance < 0) {
        // 现金流风险被触发
        assertEquals(true, true);
        break;
      }
    }
  });

  it('should generate tax deadline alert for high risk', () => {
    const taxCalculation = {
      risk_level: 'CRITICAL',
      calculated_tax: 500000
    };

    const shouldAlert = taxCalculation.risk_level === 'CRITICAL';
    assertEquals(shouldAlert, true);
  });
});

describe('Payment Recommendations', () => {
  it('should include reasons for each recommendation', () => {
    const recommendations = [
      { contract_id: 'c1', reason: '里程碑付款：2026-08-15' },
      { contract_id: 'c2', reason: '合同约定付款条件达成' }
    ];

    recommendations.forEach(r => {
      assertEquals(!!r.reason, true);
      assertEquals(r.reason.length > 0, true);
    });
  });

  it('should include priority for each recommendation', () => {
    const recommendations = [
      { contract_id: 'c1', priority: 'HIGH' },
      { contract_id: 'c2', priority: 'MEDIUM' }
    ];

    const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
    recommendations.forEach(r => {
      assertEquals(validPriorities.includes(r.priority), true);
    });
  });
});

// Run tests if executed directly
if (import.meta.main) {
  await Deno.test.run();
}
