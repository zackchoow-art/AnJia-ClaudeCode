// ============================================================================
// tax_risk_detection Edge Function (T02)
// Land Value Tax risk detection with fallback logic
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { ValidationError, DatabaseError, NotFoundError, errorResponse, successResponse } from "../_shared/errors.ts";

// ============================================================================
// Types
// ============================================================================

interface TaxCalculation {
  id: string;
  project_id: string;
  estimated_revenue?: number;
  land_cost?: number;
  construction_cost?: number;
  development_cost?: number;
  tax_deductions?: number;
  total_deductions?: number;
  appreciation_amount?: number;
  appreciation_rate?: number;
  tax_bracket?: string;
  tax_rate?: number;
  calculated_tax?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_factors: Array<{ factor: string; rate?: number }>;
  ai_suggestions: Array<{ suggestion: string; expected_saving?: number }>;
  ai_model?: string;
  calculation_basis: string;
  data_completeness_pct: number;
  calculated_at: string;
  version: number;
}

interface TaxDetectionRequest {
  project_id: string;
  estimated_revenue?: number;
  use_actual_costs?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

// China Land Value Tax rates (四档税率)
const TAX_RATES = [
  { maxRate: 50, rate: 30, quickDeduction: 0 },
  { maxRate: 100, rate: 40, quickDeduction: 5 },
  { maxRate: 200, rate: 50, quickDeduction: 15 },
  { maxRate: Infinity, rate: 60, quickDeduction: 35 }
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 计算土增税（土地增值税）
 */
function calculateLandValueTax(
  estimatedRevenue: number,
  landCost: number,
  constructionCost: number,
  developmentCost: number,
  taxDeductions: number
): {
  appreciationAmount: number;
  appreciationRate: number;
  totalDeductions: number;
  taxBracket: string;
  taxRate: number;
  calculatedTax: number;
} {
  const totalDeductions = landCost + constructionCost + developmentCost + taxDeductions;
  const appreciationAmount = estimatedRevenue - totalDeductions;
  const appreciationRate = totalDeductions > 0 ? (appreciationAmount / totalDeductions) * 100 : 0;

  let taxBracket = 'Tier1_<=50%';
  let taxRate = TAX_RATES[0].rate;
  let quickDeduction = TAX_RATES[0].quickDeduction;

  if (appreciationRate <= 50) {
    taxBracket = 'Tier1_<=50%';
  } else if (appreciationRate <= 100) {
    taxBracket = 'Tier2_50-100%';
    taxRate = TAX_RATES[1].rate;
    quickDeduction = TAX_RATES[1].quickDeduction;
  } else if (appreciationRate <= 200) {
    taxBracket = 'Tier3_100-200%';
    taxRate = TAX_RATES[2].rate;
    quickDeduction = TAX_RATES[2].quickDeduction;
  } else {
    taxBracket = 'Tier4_>200%';
    taxRate = TAX_RATES[3].rate;
    quickDeduction = TAX_RATES[3].quickDeduction;
  }

  const calculatedTax = (appreciationAmount * (taxRate / 100)) - (totalDeductions * (quickDeduction / 100));

  return { appreciationAmount, appreciationRate, totalDeductions, taxBracket, taxRate, calculatedTax };
}

/**
 * 确定风险等级
 */
function determineRiskLevel(appreciationRate: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (appreciationRate <= 50) return 'LOW';
  if (appreciationRate <= 100) return 'MEDIUM';
  if (appreciationRate <= 200) return 'HIGH';
  return 'CRITICAL';
}

/**
 * 识别风险因素
 */
function identifyRiskFactors(appreciationRate: number, dataCompleteness: number, landCost: number): Array<{ factor: string; rate?: number | string }> {
  const factors: Array<{ factor: string; rate?: number | string }> = [];
  if (appreciationRate > 100) factors.push({ factor: 'HIGH_APPRECIATION', rate: appreciationRate });
  if (dataCompleteness < 70) factors.push({ factor: 'INCOMPLETE_DATA', rate: dataCompleteness });
  if (landCost === 0 || isNaN(landCost)) factors.push({ factor: 'MISSING_LAND_COST' });
  return factors;
}

/**
 * 调用AI生成优化建议（可选）
 */
async function generateAiSuggestions(appreciationRate: number, calculatedTax: number, riskLevel: string): Promise<Array<{ suggestion: string; expected_saving?: number }>> {
  if (riskLevel !== 'HIGH' && riskLevel !== 'CRITICAL') return [];

  const apiKey = Deno.env.get('NVIDIA_NIM_API_KEY') || Deno.env.get('NVIDIA_API_KEY');
  if (!apiKey) {
    console.log('No AI API key configured, using mock suggestions');
    // 返回预设建议
    return [
      { suggestion: '建议咨询税务顾问制定节税方案', expected_saving: calculatedTax * 0.1 },
      { suggestion: '考虑调整付款时间以优化现金流', expected_saving: calculatedTax * 0.05 }
    ];
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: Deno.env.get('AI_MODEL') || 'qwen/qwen3-coder-480b-a35b-instruct',
        messages: [{ role: 'user', content: `作为中国房地产税务专家，请为增值率${appreciationRate.toFixed(2)}%的土增税项目提供2条优化建议。返回JSON数组：[{"suggestion":"内容","expected_saving":100000}]` }],
        temperature: 0.3,
        max_tokens: 512
      })
    });

    if (response.ok) {
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.log('AI suggestion failed, using mock:', String(error));
  }

  return [];
}

/**
 * 计算数据完整度
 */
function calculateDataCompleteness(project: any, costSummary: any): number {
  let score = 0;
  if (project.tax_planning_baseline) score += 25;
  if ((costSummary?.land_cost || 0) > 0) score += 25;
  if ((costSummary?.construction_cost || 0) > 0) score += 25;
  if ((costSummary?.development_cost || 0) > 0) score += 25;
  return Math.round((score / 100) * 100);
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

async function detectTaxRisk(request: TaxDetectionRequest): Promise<any> {
  const supabase = getSupabaseClient();

  if (!request.project_id) {
    throw new ValidationError('project_id is required');
  }

  // 查询项目数据
  const { data: project } = await supabase.from('projects').select('*').eq('id', request.project_id).single();
  if (!project) {
    throw new NotFoundError('Project', request.project_id);
  }

  // 查询成本汇总
  let costSummary: any;
  const { data: summary } = await supabase
    .from('cost_ledger')
    .select('cost_type, cost_amount, verification_status')
    .eq('project_id', request.project_id);

  if (summary && summary.length > 0) {
    costSummary = summary.reduce((acc: any, curr: any) => {
      switch (curr.cost_type?.toUpperCase()) {
        case 'LAND': acc.land_cost = (acc.land_cost || 0) + parseFloat(curr.cost_amount || 0); break;
        case 'CONSTRUCTION':
        case 'BUILDING': acc.construction_cost = (acc.construction_cost || 0) + parseFloat(curr.cost_amount || 0); break;
        default: acc.development_cost = (acc.development_cost || 0) + parseFloat(curr.cost_amount || 0);
      }
      return acc;
    }, {});
  } else {
    costSummary = {};
  }

  // 确定收入数据
  const estimatedRevenue = request.estimated_revenue || Number(project.tax_planning_baseline) || 0;

  // 计算各项成本
  const landCost = parseFloat((costSummary.land_cost || 0).toFixed(2));
  const constructionCost = parseFloat((costSummary.construction_cost || 0).toFixed(2));
  const developmentCost = parseFloat((costSummary.development_cost || 0).toFixed(2));

  // 税金扣除（简化按收入的7%估算）
  const taxDeductions = estimatedRevenue * 0.07;

  // 执行土增税计算
  const calcResult = calculateLandValueTax(estimatedRevenue, landCost, constructionCost, developmentCost, taxDeductions);

  // 确定风险等级
  const riskLevel = determineRiskLevel(calcResult.appreciationRate);

  // 识别风险因素
  const dataCompleteness = calculateDataCompleteness(project, costSummary);
  const riskFactors = identifyRiskFactors(calcResult.appreciationRate, dataCompleteness, landCost);

  // 生成AI优化建议（仅高风险时）
  const aiSuggestions = await generateAiSuggestions(calcResult.appreciationRate, calcResult.calculatedTax, riskLevel);

  // 准备插入数据
  const taxCalcData: any = {
    project_id: request.project_id,
    estimated_revenue: Number(estimatedRevenue.toFixed(2)),
    land_cost: landCost,
    construction_cost: constructionCost,
    development_cost: developmentCost,
    tax_deductions: Number(taxDeductions.toFixed(2)),
    total_deductions: calcResult.totalDeductions,
    appreciation_amount: Number(calcResult.appreciationAmount.toFixed(2)),
    appreciation_rate: Number(calcResult.appreciationRate.toFixed(2)),
    tax_bracket: calcResult.taxBracket,
    tax_rate: calcResult.taxRate,
    calculated_tax: Number(calcResult.calculatedTax.toFixed(2)),
    risk_level: riskLevel,
    risk_factors: riskFactors,
    ai_suggestions: aiSuggestions,
    calculation_basis: 'ACTUAL_COSTS',
    data_completeness_pct: dataCompleteness || 0,
    calculated_by: 'tax_risk_detection_function'
  };

  // 查询最新版本号
  const { data: latestCalc, error: versionError } = await supabase
    .from('tax_calculations')
    .select('version')
    .eq('project_id', request.project_id)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (!versionError && latestCalc) {
    taxCalcData.version = latestCalc.version + 1;
  } else {
    taxCalcData.version = 1;
  }

  // 插入计算结果
  const { data: calculation, error: insertError } = await supabase.from('tax_calculations').insert(taxCalcData).select('*').single();
  if (insertError || !calculation) {
    console.error('Insert error:', insertError);
    throw new DatabaseError(`Failed to insert tax calculation: ${insertError?.message}`);
  }

  // 更新项目表
  await supabase.from('projects').update({
    latest_tax_calc_id: calculation.id,
    tax_risk_level: riskLevel,
    updated_at: new Date().toISOString()
  }).eq('id', request.project_id);

  // 创建审计日志
  await createAuditLog(supabase, 'project', request.project_id, 'TAX_CALCULATED', 'tax_risk_detection_function', {
    risk_level: riskLevel,
    appreciation_rate: calcResult.appreciationRate,
    estimated_tax: calcResult.calculatedTax,
    used_ai_suggestions: aiSuggestions.length > 0
  });

  return successResponse(calculation);
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
    const body: TaxDetectionRequest = await req.json();
    return await detectTaxRisk(body);
  } catch (error) {
    return errorResponse(error);
  }
});
