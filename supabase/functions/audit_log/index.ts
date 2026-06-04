// ============================================================================
// audit_log Edge Function
// 集中处理审计日志的记录
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { ValidationError, errorResponse, successResponse } from "../_shared/errors.ts";
import type { AuditLogEntry } from "../_shared/types.ts";

/**
 * 记录审计日志
 * 
 * @param entry - 审计日志条目
 * @returns 创建的日志ID
 */
async function recordAuditLog(entry: AuditLogEntry): Promise<{ id: string; timestamp: string }> {
  const supabase = getSupabaseClient();
  
  // 验证必需字段
  if (!entry.entity_type || !entry.entity_id || !entry.action || !entry.actor_id) {
    throw new ValidationError('Missing required fields: entity_type, entity_id, action, actor_id');
  }
  
  // 验证action的合法性
  const validActions = ['CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'DELETED', 'SIGNED', 'EXECUTED'];
  if (!validActions.includes(entry.action)) {
    throw new ValidationError(`Invalid action: ${entry.action}. Must be one of: ${validActions.join(', ')}`);
  }
  
  // 插入日志
  const { data, error } = await supabase
    .from('audit_log')
    .insert({
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      action: entry.action,
      actor_type: entry.actor_type || 'SYSTEM',
      actor_id: entry.actor_id,
      actor_name: entry.actor_name,
      change_details: entry.change_details || {},
      reason: entry.reason,
      timestamp: new Date().toISOString()
    })
    .select('id, timestamp')
    .single();
  
  if (error || !data) {
    throw new Error(`Failed to record audit log: ${error?.message}`);
  }
  
  return {
    id: data.id,
    timestamp: data.timestamp
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
    
    const body: AuditLogEntry = await req.json();
    const result = await recordAuditLog(body);
    
    return successResponse(result);
    
  } catch (error) {
    return errorResponse(error);
  }
});
