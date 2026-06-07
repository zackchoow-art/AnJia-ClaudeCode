// ============================================================================
// ai_contract_review Edge Function (T01)
// Contract review with optional AI analysis
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { ValidationError, NotFoundError, errorResponse, successResponse } from "../_shared/errors.ts";

// ============================================================================
// Types
// ============================================================================

interface KeyFinding {
  type: 'PAYMENT_TERM' | 'PENALTY' | 'LIABILITY' | 'TERMINATION' | 'AMBIGUITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  clause_reference: string;
  description: string;
  recommendation: string;
}

interface AIReviewResult {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  key_findings: KeyFinding[];
  executive_summary: string;
  ai_model?: string;
  ai_response_tokens?: number;
  is_mock_data?: boolean;
}

interface ReviewRequest {
  contract_id: string;
  contract_text?: string;
  review_type?: 'AUTO_AI' | 'MANUAL' | 'HYBRID';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 构建AI审查Prompt（供后续集成使用）
 */
function buildReviewPrompt(
  contractType: string,
  totalAmount: number,
  currency: string,
  keyTermsJson: unknown,
  paymentMilestones: unknown
): string {
  return `你是一位专业的中国房地产合同法律顾问，请审查以下合同信息并识别风险。

合同类型: ${contractType}
合同金额: ${totalAmount} ${currency}
关键条款: ${JSON.stringify(keyTermsJson, null, 2)}
支付里程碑: ${JSON.stringify(paymentMilestones, null, 2)}

请按以下JSON格式输出审查结果：
{
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "risk_score": 0-10,
  "key_findings": [
    {
      "type": "PAYMENT_TERM|PENALTY|LIABILITY|TERMINATION|AMBIGUITY",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "clause_reference": "第X条或相关条款",
      "description": "风险描述",
      "recommendation": "建议"
    }
  ],
  "executive_summary": "总体评估（200字以内）"
}

要求：
1. 风险等级基于风险评分：LOW (0-3), MEDIUM (4-5), HIGH (6-7), CRITICAL (8-10)
2. key_findings 至少返回 1 条，最多 5 条
3. 每条发现必须有明确的条款引用和建议
4. executive_summary 不超过 200 字`;
}

/**
 * 使用规则引擎生成审查结果（无需AI）
 */
function generateMockReview(contract: any): AIReviewResult {
  console.log('Using mock rule-based review (no AI configured)');

  // 基于合同金额和类型的风险评估规则
  const totalAmount = Number(contract.total_amount || 0);
  const contractType = contract.contract_type || 'CONTRACTOR';

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let riskScore = 2;
  const findings: KeyFinding[] = [];

  // 基础规则引擎
  if (totalAmount > 1000000) {
    riskLevel = 'MEDIUM';
    riskScore = 5;
    findings.push({
      type: 'PAYMENT_TERM',
      severity: 'MEDIUM',
      clause_reference: '第4条',
      description: `大额合同（¥${totalAmount.toLocaleString()}）建议增加分期付款条款`,
      recommendation: '考虑分阶段支付以降低资金风险'
    });
  }

  // 基于合同类型的风险
  if (contractType === 'SALES') {
    findings.push({
      type: 'LIABILITY',
      severity: 'LOW',
      clause_reference: '第7条',
      description: '销售合同建议增加产品质量责任条款',
      recommendation: '明确质量标准和违约责任'
    });
  } else if (contractType === 'CONTRACTOR') {
    findings.push({
      type: 'PENALTY',
      severity: 'LOW',
      clause_reference: '第12条',
      description: '施工合同建议增加工期延误罚则',
      recommendation: '设定合理的工期和违约金标准'
    });
  }

  // 如果没有发现，添加一条通用提醒
  if (findings.length === 0) {
    findings.push({
      type: 'AMBIGUITY',
      severity: 'LOW',
      clause_reference: '其他',
      description: '建议在签署前由法务人员最终审核',
      recommendation: '确保所有空白字段已填写完整'
    });
  }

  return {
    risk_level: riskLevel,
    risk_score: riskScore,
    key_findings: findings,
    executive_summary: `合同审查完成。风险等级：${riskLevel}，共发现${findings.length}个关键条款问题。建议根据具体合同内容进一步细化审核。`,
    ai_model: 'rule_engine_v1',
    is_mock_data: true
  };
}

/**
 * 调用AI服务（可选）
 */
async function callAIService(prompt: string): Promise<AIReviewResult | null> {
  const apiKey = Deno.env.get('NVIDIA_NIM_API_KEY') || Deno.env.get('NVIDIA_API_KEY');

  if (!apiKey) {
    console.log('No AI API key configured, using mock review');
    return null;
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: Deno.env.get('AI_MODEL') || 'qwen/qwen3-coder-480b-a35b-instruct',
        messages: [
          { role: 'system', content: '你是一个专业的合同法律分析师，专注于中国房地产合同风险识别。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      console.log('AI API failed, falling back to mock:', response.statusText);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';
    const tokensUsed = result.usage?.total_tokens || 0;

    // 提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;

    return {
      ...JSON.parse(jsonContent),
      ai_model: 'nvidia_nim',
      ai_response_tokens: tokensUsed
    };
  } catch (error) {
    console.log('AI service error, using mock:', String(error));
    return null;
  }
}

/**
 * 构建审计日志记录
 */
async function createAuditLog(
  supabase: any,
  entityType: string,
  entityId: string,
  action: string,
  actorId: string,
  changeDetails?: unknown
) {
  const { error } = await supabase
    .from('audit_log')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor_type: 'SYSTEM',
      actor_id: actorId,
      change_details: changeDetails
    });

  if (error) {
    console.error('Failed to create audit log:', error);
  }
}

// ============================================================================
// Main Handler
// ============================================================================

async function reviewContract(request: ReviewRequest): Promise<any> {
  const supabase = getSupabaseClient();

  // 验证 contract_id 格式
  if (!request.contract_id) {
    throw new ValidationError('contract_id is required');
  }

  // 查询合同数据
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', request.contract_id)
    .single();

  if (contractError || !contract) {
    throw new NotFoundError('Contract', request.contract_id);
  }

  // 尝试调用AI服务
  let aiResult = await callAIService(buildReviewPrompt(
    contract.contract_type,
    contract.total_amount,
    contract.currency,
    contract.key_terms_json || {},
    contract.payment_milestones || []
  ));

  // 如果AI失败，使用规则引擎
  if (!aiResult) {
    aiResult = generateMockReview(contract);
  }

  // 准备插入数据
  const reviewData: any = {
    contract_id: request.contract_id,
    review_type: request.review_type || 'AUTO_AI',
    reviewed_by: aiResult.ai_model || 'mock_engine',
    risk_level: aiResult.risk_level,
    risk_score: parseFloat(aiResult.risk_score.toFixed(1)),
    key_findings: aiResult.key_findings || [],
    executive_summary: aiResult.executive_summary,
    review_status: 'COMPLETED',
    created_by: 'ai_contract_review_function'
  };

  if (aiResult.ai_response_tokens) {
    reviewData.ai_response_tokens = aiResult.ai_response_tokens;
  }

  // 插入审查结果
  const { data: review, error: reviewInsertError } = await supabase
    .from('contract_reviews')
    .insert(reviewData)
    .select('*')
    .single();

  if (reviewInsertError) {
    throw new Error(`Failed to insert review: ${reviewInsertError.message}`);
  }

  // 更新合同的 latest_review_id
  await supabase
    .from('contracts')
    .update({ latest_review_id: review.id })
    .eq('id', request.contract_id);

  // 创建审计日志
  await createAuditLog(
    supabase,
    'contract',
    request.contract_id,
    'REVIEWED',
    'ai_contract_review_function',
    {
      risk_level: aiResult.risk_level,
      risk_score: aiResult.risk_score,
      review_type: request.review_type || 'AUTO_AI',
      used_mock_data: aiResult.is_mock_data
    }
  );

  return successResponse({
    review_id: review.id,
    contract_id: request.contract_id,
    risk_level: aiResult.risk_level,
    risk_score: aiResult.risk_score,
    key_findings: aiResult.key_findings,
    executive_summary: aiResult.executive_summary,
    used_mock_data: aiResult.is_mock_data
  });
}

// ============================================================================
// HTTP Handler
// ============================================================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new ValidationError('Only POST method allowed');
    }

    const body: ReviewRequest = await req.json();
    return await reviewContract(body);

  } catch (error) {
    return errorResponse(error);
  }
});
