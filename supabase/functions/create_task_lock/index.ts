// ============================================================================
// create_task_lock Edge Function
// 为Agent创建表级锁定,防止并发冲突
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { ValidationError, errorResponse, successResponse } from "../_shared/errors.ts";
import type { TaskLock } from "../_shared/types.ts";

/**
 * 创建任务锁
 * 
 * 操作流程:
 * 1. 验证request参数
 * 2. 检查是否有冲突的锁(同样的表被其他active task锁定)
 * 3. 清理过期的锁
 * 4. 创建新锁
 * 5. 返回锁信息
 */
async function createTaskLock(request: TaskLock): Promise<{
  lock_id: string;
  status: 'CREATED' | 'CONFLICT' | 'WAITING';
  conflicts?: Array<{ agent_id: string; locked_until: string; tables: string[] }>;
}> {
  const supabase = getSupabaseClient();
  
  // 1. 验证参数
  if (!request.task_id || !request.agent_id || !request.table_names || request.table_names.length === 0) {
    throw new ValidationError('task_id, agent_id, and table_names are required');
  }
  
  if (!request.locked_until) {
    throw new ValidationError('locked_until is required');
  }
  
  // 2. 清理过期的锁
  await supabase
    .from('task_locks')
    .update({ lock_status: 'EXPIRED' })
    .lt('locked_until', new Date().toISOString())
    .eq('lock_status', 'ACTIVE');
  
  // 3. 检查冲突
  const { data: existingLocks } = await supabase
    .from('task_locks')
    .select('*')
    .eq('lock_status', 'ACTIVE')
    .gt('locked_until', new Date().toISOString())
    .overlaps('table_names', request.table_names);
  
  if (existingLocks && existingLocks.length > 0) {
    return {
      lock_id: 'CONFLICT',
      status: 'CONFLICT',
      conflicts: existingLocks.map(l => ({
        agent_id: l.agent_id,
        locked_until: l.locked_until,
        tables: l.table_names
      }))
    };
  }
  
  // 4. 创建锁
  const { data: newLock, error } = await supabase
    .from('task_locks')
    .insert({
      task_id: request.task_id,
      agent_id: request.agent_id,
      table_names: request.table_names,
      locked_until: request.locked_until,
      lock_reason: request.lock_reason || `Task ${request.task_id} locked by ${request.agent_id}`,
      lock_status: 'ACTIVE'
    })
    .select('id')
    .single();
  
  if (error || !newLock) {
    throw new Error(`Failed to create task lock: ${error?.message}`);
  }
  
  return {
    lock_id: newLock.id,
    status: 'CREATED'
  };
}

/**
 * 释放任务锁
 */
async function releaseTaskLock(taskId: string): Promise<{ released: boolean }> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('task_locks')
    .update({ lock_status: 'RELEASED' })
    .eq('task_id', taskId)
    .eq('lock_status', 'ACTIVE');
  
  if (error) {
    throw new Error(`Failed to release lock: ${error.message}`);
  }
  
  return { released: true };
}

// Edge Function HTTP Handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';
    
    if (req.method === 'POST' && action === 'create') {
      const body: TaskLock = await req.json();
      const result = await createTaskLock(body);
      return successResponse(result);
    }
    
    if (req.method === 'DELETE' || (req.method === 'POST' && action === 'release')) {
      const body = await req.json();
      if (!body.task_id) {
        throw new ValidationError('task_id is required for release');
      }
      const result = await releaseTaskLock(body.task_id);
      return successResponse(result);
    }
    
    throw new ValidationError(`Unsupported method or action: ${req.method} ${action}`);
    
  } catch (error) {
    return errorResponse(error);
  }
});
