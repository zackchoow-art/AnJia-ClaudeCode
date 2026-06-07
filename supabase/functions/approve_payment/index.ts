// ============================================================================
// approve_payment Edge Function
// 执行支付批准操作
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { ValidationError, AuthorizationError, NotFoundError, errorResponse, successResponse } from "../_shared/errors.ts";
import type { ApprovalRequest, ApprovalResult, Payment } from "../_shared/types.ts";

const VALIDATE_PAYMENT_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/validate_payment`;

/**
 * 执行支付批准
 * 
 * 流程:
 * 1. 调用validate_payment验证前置条件
 * 2. 如果验证通过,更新payment状态为APPROVED
 * 3. 记录详细的审计日志
 * 4. 返回结果
 */
async function approvePayment(request: ApprovalRequest): Promise<ApprovalResult> {
  const supabase = getSupabaseClient();
  
  // 1. 验证reviewer权限
  if (!request.reviewer_id) {
    throw new ValidationError('reviewer_id is required');
  }
  
  // 2. 获取payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', request.payment_id)
    .single<Payment>();
  
  if (paymentError || !payment) {
    throw new NotFoundError('Payment', request.payment_id);
  }
  
  // 3. 幂等性检查
  if (payment.payment_status === 'APPROVED') {
    return {
      success: true,
      payment_id: payment.id,
      new_status: 'APPROVED',
      audit_log_id: 'already_approved',
      timestamp: new Date().toISOString()
    };
  }
  
  if (payment.payment_status === 'REJECTED' || payment.payment_status === 'CANCELLED') {
    throw new ValidationError(`Cannot approve payment in ${payment.payment_status} status`);
  }
  
  // 4. 先调用validate_payment进行最终验证
  const validateResponse = await fetch(VALIDATE_PAYMENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    },
    body: JSON.stringify({ payment_id: request.payment_id })
  });
  
  if (!validateResponse.ok) {
    throw new Error('Validation service unavailable');
  }
  
  const validateResult = await validateResponse.json();
  
  if (!validateResult.success || validateResult.data.status !== 'APPROVED') {
    throw new ValidationError(
      'Payment failed validation',
      { 
        validation_result: validateResult.data,
        rejection_reasons: validateResult.data?.rejection_reasons 
      }
    );
  }
  
  // 5. 更新payment状态
  const { data: updatedPayment, error: updateError } = await supabase
    .from('payments')
    .update({
      payment_status: 'APPROVED',
      reviewed_by: request.reviewer_id,
      reviewed_at: new Date().toISOString(),
      approval_notes: request.approval_notes || 'Approved via approve_payment function'
    })
    .eq('id', request.payment_id)
    .select()
    .single();
  
  if (updateError || !updatedPayment) {
    throw new Error('Failed to update payment status');
  }
  
  // 6. 记录详细的审计日志
  const { data: auditEntry, error: auditError } = await supabase
    .from('audit_log')
    .insert({
      entity_type: 'payment',
      entity_id: request.payment_id,
      action: 'APPROVED',
      actor_type: 'USER',
      actor_id: request.reviewer_id,
      change_details: {
        previous_status: payment.payment_status,
        new_status: 'APPROVED',
        amount: payment.payment_amount,
        approval_notes: request.approval_notes,
        validation_checks: validateResult.data.checks
      },
      reason: request.approval_notes || 'Standard approval'
    })
    .select('id')
    .single();
  
  if (auditError) {
    // 记录结构化日志到审计表
    await supabase
      .from('audit_log')
      .insert({
        entity_type: 'system',
        entity_id: request.payment_id,
        action: 'WARNING',
        actor_type: 'SYSTEM',
        actor_id: 'approve_payment_function',
        change_details: {
          warning: 'Failed to write audit log entry',
          error_message: auditError.message,
          timestamp: new Date().toISOString()
        }
      })
      .select('id')
      .single()
      .catch(() => {
        // 如果审计日志插入也失败，记录到标准错误（仅此场景）
        // eslint-disable-next-line no-console
        console.error(JSON.stringify({
          error: 'audit_log_insert_failed',
          payment_id: request.payment_id,
          message: auditError.message,
          timestamp: new Date().toISOString()
        }));
      });
  }
  
  return {
    success: true,
    payment_id: request.payment_id,
    new_status: 'APPROVED',
    audit_log_id: auditEntry?.id || 'unknown',
    timestamp: new Date().toISOString()
  };
}

// Edge Function HTTP Handler
serve(async (req: Request) => {
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
    
    const body: ApprovalRequest = await req.json();
    
    if (!body.payment_id) {
      throw new ValidationError('payment_id is required');
    }
    
    const result = await approvePayment(body);
    return successResponse(result);
    
  } catch (error) {
    return errorResponse(error);
  }
});
