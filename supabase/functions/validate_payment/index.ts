// ============================================================================
// validate_payment Edge Function
// 验证支付申请是否满足所有前置条件
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { ValidationError, NotFoundError, errorResponse, successResponse } from "../_shared/errors.ts";
import type { Payment, Contract, ValidationResult, ValidationChecklist } from "../_shared/types.ts";

/**
 * 验证支付前置条件
 * 
 * 检查项目:
 * 1. 合同是否签署完整
 * 2. 所需文件是否齐全 (cost_ledger中的发票)
 * 3. 税金计划是否完成
 * 4. 工程里程碑是否达成
 * 5. 是否有其他blocker
 * 
 * @param paymentId - 支付ID
 * @returns ValidationResult
 */
async function validatePayment(paymentId: string): Promise<ValidationResult> {
  const supabase = getSupabaseClient();
  const checks: ValidationChecklist = {
    contract_signed: false,
    documents_received: false,
    tax_completed: false,
    milestone_achieved: false,
    no_blockers: false
  };
  const rejection_reasons: string[] = [];
  
  // 1. 获取payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single<Payment>();
  
  if (paymentError || !payment) {
    throw new NotFoundError('Payment', paymentId);
  }
  
  // 幂等性检查: 已经APPROVED的不需要再验证
  if (payment.payment_status === 'APPROVED') {
    return {
      status: 'APPROVED',
      checks: payment.approval_checklist as ValidationChecklist,
      rejection_reasons: [],
      validation_timestamp: new Date().toISOString()
    };
  }
  
  // 2. 检查合同签署状态
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', payment.contract_id)
    .single<Contract>();
  
  if (contractError || !contract) {
    rejection_reasons.push('合同未找到');
  } else {
    if (contract.contract_status === 'SIGNED' || contract.contract_status === 'ACTIVATED') {
      if (contract.all_signatures_complete) {
        checks.contract_signed = true;
      } else {
        rejection_reasons.push('合同签名不完整');
      }
    } else {
      rejection_reasons.push(`合同状态为${contract.contract_status},需要为SIGNED或ACTIVATED`);
    }
  }
  
  // 3. 检查文件是否齐全(查询cost_ledger是否有对应的invoice)
  const { data: ledgerEntries, error: ledgerError } = await supabase
    .from('cost_ledger')
    .select('*')
    .eq('project_id', payment.project_id)
    .gte('cost_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 最近90天
  
  if (!ledgerError && ledgerEntries) {
    const verifiedEntries = ledgerEntries.filter(e => e.verification_status === 'VERIFIED' && e.receipt_filename);
    if (verifiedEntries.length > 0) {
      checks.documents_received = true;
    } else {
      rejection_reasons.push('未找到已验证的发票/收据');
    }
  } else {
    rejection_reasons.push('文件检查失败');
  }
  
  // 4. 检查税金计划是否完成
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('tax_planning_completed_at, tax_planning_baseline')
    .eq('id', payment.project_id)
    .single();
  
  if (!projectError && project) {
    if (project.tax_planning_completed_at && project.tax_planning_baseline) {
      checks.tax_completed = true;
    } else {
      rejection_reasons.push('税金计划未完成');
    }
  } else {
    rejection_reasons.push('项目信息查询失败');
  }
  
  // 5. 检查milestone是否达成(通过payment_rules)
  const { data: rules, error: rulesError } = await supabase
    .from('payment_rules')
    .select('*')
    .eq('contract_id', payment.contract_id)
    .eq('rule_status', 'ACTIVE');
  
  if (!rulesError && rules && rules.length > 0) {
    // 简化逻辑: 至少有一条active规则即可
    // 实际中需要更复杂的逻辑判断当前支付对应哪个里程碑
    checks.milestone_achieved = true;
  } else {
    rejection_reasons.push('支付规则未配置或未激活');
  }
  
  // 6. 检查是否有blockers(其他pending的rejection等)
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('id, payment_status')
    .eq('contract_id', payment.contract_id)
    .eq('payment_status', 'REJECTED');
  
  if (!pendingPayments || pendingPayments.length === 0) {
    checks.no_blockers = true;
  } else {
    rejection_reasons.push(`合同存在${pendingPayments.length}个被拒绝的支付`);
  }
  
  // 综合判断
  const allChecksPassed = Object.values(checks).every(v => v === true);
  const status: 'APPROVED' | 'REJECTED' | 'PENDING' = 
    allChecksPassed ? 'APPROVED' : 
    rejection_reasons.length > 0 ? 'REJECTED' : 
    'PENDING';
  
  // 更新payment的approval_checklist
  await supabase
    .from('payments')
    .update({
      approval_checklist: checks,
      approval_checklist_completed_at: new Date().toISOString()
    })
    .eq('id', paymentId);
  
  // 记录审计日志
  await supabase
    .from('audit_log')
    .insert({
      entity_type: 'payment',
      entity_id: paymentId,
      action: status === 'APPROVED' ? 'APPROVED' : 'UPDATED',
      actor_type: 'SYSTEM',
      actor_id: 'validate_payment_function',
      change_details: { checks, rejection_reasons }
    });
  
  return {
    status,
    checks,
    rejection_reasons,
    validation_timestamp: new Date().toISOString()
  };
}

// Edge Function HTTP Handler
serve(async (req: Request) => {
  // CORS handling
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
    
    const body = await req.json();
    
    if (!body.payment_id) {
      throw new ValidationError('payment_id is required');
    }
    
    const result = await validatePayment(body.payment_id);
    return successResponse(result);
    
  } catch (error) {
    return errorResponse(error);
  }
});
