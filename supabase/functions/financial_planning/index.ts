// ============================================================================
// financial_planning Edge Function (T03)
// Intelligent financial planning without AI dependency
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { ValidationError, DatabaseError, NotFoundError, errorResponse, successResponse } from "../_shared/errors.ts";

// ============================================================================
// Types
// ============================================================================

interface CashFlowMonth {
  month: string;
  expected_inflow: number;
  planned_outflow: number;
  net_flow: number;
  cumulative_balance: number;
}

interface PaymentRecommendation {
  contract_id: string;
  contract_name?: string;
  recommended_payment_date: string;
  amount: number;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  tax_impact?: string;
}

interface RiskAlert {
  alert_type: 'CASH_FLOW_RISK' | 'TAX_DEADLINE' | 'MILESTONE_MISS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  recommended_action: string;
}

interface FinancialPlanRequest {
  project_id: string;
  plan_type?: 'MONTHLY' | 'QUARTERLY' | 'MILESTONE_BASED';
  plan_period_months?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 获取月份列表
 */
function getMonthsBetween(startDate: Date, endDate: Date): string[] {
  const months = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

/**
 * 按月汇总成本
 */
async function getMonthlyCosts(supabase: any, projectId: string, startDate: Date, endDate: Date): Promise<Map<string, number>> {
  const monthlyTotals = new Map<string, number>();
  const months = getMonthsBetween(startDate, endDate);
  months.forEach(month => monthlyTotals.set(month, 0));

  const { data: costs } = await supabase
    .from('cost_ledger')
    .select('cost_date, cost_amount')
    .eq('project_id', projectId)
    .eq('verification_status', 'VERIFIED');

  if (costs) {
    costs.forEach((cost: any) => {
      const costDate = new Date(cost.cost_date);
      const monthKey = `${costDate.getFullYear()}-${String(costDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTotals.has(monthKey)) {
        monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + Number(cost.cost_amount));
      }
    });
  }

  return monthlyTotals;
}

/**
 * 获取支付里程碑
 */
async function getPaymentMilestones(supabase: any, projectId: string, endDate: Date): Promise<Array<{ contract_id: string; amount: number }>> {
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, contract_code, total_amount, payment_milestones')
    .eq('project_id', projectId);

  if (!contracts) return [];

  const milestones: Array<{ contract_id: string; amount: number }> = [];
  contracts.forEach(contract => {
    if (contract.payment_milestones && Array.isArray(contract.payment_milestones)) {
      contract.payment_milestones.forEach((milestone: any) => {
        const dueDate = new Date(milestone.due_date);
        if (dueDate <= endDate) {
          milestones.push({
            contract_id: contract.id,
            amount: contract.total_amount * (milestone.percentage / 100)
          });
        }
      });
    }
  });

  return milestones.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
}

/**
 * 获取最新税务计算
 */
async function getLatestTaxCalculation(supabase: any, projectId: string): Promise<any> {
  const { data } = await supabase
    .from('tax_calculations')
    .select('*')
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1)
    .single();
  return data;
}

/**
 * 预测现金流
 */
function projectCashFlow(monthlyCosts: Map<string, number>, milestones: Array<{ due_date: string; amount: number }>, startDate: Date, currentBalance: number): CashFlowMonth[] {
  const projected: CashFlowMonth[] = [];
  let cumulative = currentBalance;

  // 汇总每月收入（来自里程碑）
  const incomeByMonth = new Map<string, number>();
  milestones.forEach(milestone => {
    const dueDate = new Date(milestone.due_date);
    const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
    incomeByMonth.set(monthKey, (incomeByMonth.get(monthKey) || 0) + milestone.amount);
  });

  // 生成未来12个月的预测
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(startDate);
    monthDate.setMonth(startDate.getMonth() + i);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

    const expectedInflow = incomeByMonth.get(monthKey) || 0;
    const plannedOutflow = monthlyCosts.get(monthKey) || 0;
    const netFlow = expectedInflow - plannedOutflow;

    cumulative += netFlow;

    projected.push({
      month: monthKey,
      expected_inflow: Number(expectedInflow.toFixed(2)),
      planned_outflow: Number(plannedOutflow.toFixed(2)),
      net_flow: Number(netFlow.toFixed(2)),
      cumulative_balance: Number(cumulative.toFixed(2))
    });
  }

  return projected;
}

/**
 * 生成支付建议
 */
function generatePaymentRecommendations(milestones: Array<{ contract_id: string; amount: number }>, taxRiskLevel?: string): PaymentRecommendation[] {
  const recommendations: PaymentRecommendation[] = [];

  milestones.forEach((milestone, index) => {
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (index < 2) priority = 'HIGH';
    else if (index < 4) priority = 'MEDIUM';
    else priority = 'LOW';

    recommendations.push({
      contract_id: milestone.contract_id,
      recommended_payment_date: new Date(milestone.due_date).toISOString().split('T')[0],
      amount: Number(milestone.amount.toFixed(2)),
      reason: `根据合同约定，预计在里程碑阶段支付`,
      priority
    });
  });

  return recommendations;
}

/**
 * 识别风险预警
 */
function identifyRiskAlerts(cashFlow: CashFlowMonth[], taxRiskLevel?: string): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  let cumulativeBalance = 0;

  for (let i = 0; i < cashFlow.length; i++) {
    cumulativeBalance += cashFlow[i].net_flow;
    if (cumulativeBalance < 0 && !alerts.some(a => a.alert_type === 'CASH_FLOW_RISK')) {
      alerts.push({
        alert_type: 'CASH_FLOW_RISK',
        severity: Math.abs(cumulativeBalance) > 100000 ? 'HIGH' : 'MEDIUM',
        description: `预计在 ${cashFlow[i].month} 出现资金缺口 ¥${Math.abs(cumulativeBalance).toLocaleString('zh-CN')}`,
        recommended_action: '建议提前安排融资或调整支付计划'
      });
    }
  }

  if (taxRiskLevel === 'CRITICAL') {
    alerts.push({
      alert_type: 'TAX_DEADLINE',
      severity: 'HIGH',
      description: `土增税风险等级：${taxRiskLevel}，需要密切关注`,
      recommended_action: '建议立即咨询税务顾问'
    });
  }

  return alerts;
}

/**
 * 计算预算使用率
 */
async function calculateBudgetUtilization(supabase: any, projectId: string): Promise<number> {
  const { data: project } = await supabase.from('projects').select('total_budget').eq('id', projectId).single();
  if (!project || !project.total_budget) return 0;

  const { data: costs } = await supabase
    .from('cost_ledger')
    .select('cost_amount')
    .eq('project_id', projectId)
    .eq('verification_status', 'VERIFIED');

  const totalSpent = (costs || []).reduce((sum: number, c: any) => sum + Number(c.cost_amount), 0);
  return Number(((totalSpent / project.total_budget) * 100).toFixed(2));
}

/**
 * 创建审计日志
 */
async function createAuditLog(
  supabase: any,
  entityType: string,
  entityId: string,
  action: string,
  actorId: string,
  changeDetails?: unknown
) {
  await supabase.from('audit_log').insert({
    entity_type: entityType, entity_id: entityId, action,
    actor_type: 'SYSTEM', actor_id: actorId, change_details: changeDetails
  });
}

// ============================================================================
// Main Handler
// ============================================================================

async function createFinancialPlan(request: FinancialPlanRequest): Promise<any> {
  const supabase = getSupabaseClient();

  if (!request.project_id) {
    throw new ValidationError('project_id is required');
  }

  // 查询项目数据
  const { data: project } = await supabase.from('projects').select('*').eq('id', request.project_id).single();
  if (!project) {
    throw new NotFoundError('Project', request.project_id);
  }

  // 确定计划周期（默认6个月）
  const planPeriodMonths = request.plan_period_months || 6;
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() + 1);

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + planPeriodMonths);

  // 获取每月成本
  const monthlyCosts = await getMonthlyCosts(supabase, request.project_id, startDate, endDate);

  // 获取支付里程碑（添加未来日期）
  const milestonesWithDates = (await getPaymentMilestones(supabase, request.project_id, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)))
    .map((m, i) => ({ ...m, due_date: new Date(startDate.getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString() }));

  // 获取最新税务计算
  const taxCalculation = await getLatestTaxCalculation(supabase, request.project_id);

  // 计算预算使用率
  const budgetUtilization = await calculateBudgetUtilization(supabase, request.project_id);

  // 预测现金流
  const projectedCashFlow = projectCashFlow(
    monthlyCosts,
    milestonesWithDates,
    startDate,
    Number(project.total_budget)
  );

  // 生成支付建议
  const paymentRecommendations = generatePaymentRecommendations(milestonesWithDates, taxCalculation?.risk_level);

  // 识别风险预警
  const riskAlerts = identifyRiskAlerts(projectedCashFlow, taxCalculation?.risk_level);

  // 准备插入数据
  const planData: any = {
    project_id: request.project_id,
    plan_type: request.plan_type || 'MONTHLY',
    current_budget_utilization_pct: budgetUtilization,
    projected_cash_flow: { months: projectedCashFlow },
    payment_recommendations: paymentRecommendations,
    risk_alerts: riskAlerts,
    tax_calculation_id: taxCalculation ? taxCalculation.id : null,
    plan_period_start: startDate.toISOString().split('T')[0],
    plan_period_end: endDate.toISOString().split('T')[0],
    generated_by: 'financial_planning_function'
  };

  // 插入规划结果
  const { data: plan } = await supabase.from('financial_plans').insert(planData).select('*').single();
  if (!plan) {
    throw new DatabaseError('Failed to insert financial plan');
  }

  // 创建审计日志
  await createAuditLog(
    supabase,
    'project',
    request.project_id,
    'FINANCIAL_PLAN_CREATED',
    'financial_planning_function',
    { plan_type: request.plan_type, risk_alerts_count: riskAlerts.length }
  );

  return successResponse({
    ...plan,
    projected_cash_flow: plan.projected_cash_flow.months || [],
    payment_recommendations: plan.payment_recommendations || [],
    risk_alerts: plan.risk_alerts || []
  });
}

// ============================================================================
// HTTP Handler
// ============================================================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  try {
    if (req.method !== 'POST') throw new ValidationError('Only POST method allowed');
    const body: FinancialPlanRequest = await req.json();
    return await createFinancialPlan(body);
  } catch (error) {
    return errorResponse(error);
  }
});
