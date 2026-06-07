// ============================================================================
// crm_management Edge Function (T03 - Phase 2)
// Customer Relationship Management Enhancement
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  errorResponse,
  successResponse
} from "../_shared/errors.ts";

// ============================================================================
// Types
// ============================================================================

export type FollowupType = 'CALL' | 'VISIT' | 'WECHAT' | 'EMAIL' | 'SITE_VISIT';
export type FunnelStage = 'INITIAL' | 'CONTACTED' | 'INTERESTED' | 'NEGOTIATING' | 'DECISION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type ScoredBy = 'SALES' | 'AI_SYSTEM';

export interface CustomerFollowup {
  id: string;
  customer_id: string;
  sales_agent_id: string;
  followup_type: FollowupType;
  followup_content: string;
  customer_response?: string;
  next_action?: string;
  next_followup_date?: string;
  intent_before?: string;
  intent_after?: string;
  created_at: string;
}

export interface CustomerScore {
  id: string;
  customer_id: string;
  sales_agent_id: string;
  intent_score: number;
  score_factors: Record<string, number>;
  scored_by: ScoredBy;
  scored_at: string;
}

export interface FollowupInput {
  customer_id: string;
  followup_type: FollowupType;
  followup_content: string;
  customer_response?: string;
  next_action?: string;
  next_followup_date?: string;
  intent_before?: string;
  intent_after?: string;
}

export interface FunnelStats {
  stage: FunnelStage;
  count: number;
  percentage: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 获取当前用户信息
 */
async function getCurrentUserInfo(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthorizationError('User not authenticated');
  }

  const role = user.app_metadata?.role || 'sales_team';
  const userId = user.id;

  return { userId, role };
}

/**
 * 获取客户跟进列表
 */
async function getCustomerFollowups(
  supabase: any,
  customerId: string,
  limit: number = 50
): Promise<CustomerFollowup[]> {
  const { data, error } = await supabase
    .from('customer_followups')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as CustomerFollowup[];
}

/**
 * 添加跟进记录
 */
async function addFollowup(
  supabase: any,
  input: FollowupInput,
  actorId: string
): Promise<CustomerFollowup> {
  // 获取客户信息以验证项目归属
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id, project_id, sales_agent_id')
    .eq('id', input.customer_id)
    .single();

  if (custError || !customer) {
    throw new NotFoundError('Customer', input.customer_id);
  }

  // 检查销售权限
  const { role } = await getCurrentUserInfo(supabase);
  if (role === 'sales_team' && customer.sales_agent_id !== actorId) {
    throw new AuthorizationError('Can only add followups for your own customers');
  }

  const { data, error } = await supabase
    .from('customer_followups')
    .insert({
      ...input,
      sales_agent_id: actorId
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to add followup: ${error.message}`);
  }

  return data as CustomerFollowup;
}

/**
 * 获取今天的待跟进客户列表
 */
async function getTodayTasks(
  supabase: any,
  actorId: string,
  actorType: string
): Promise<Array<{
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  latest_intent_score?: number;
  latest_followup_date?: string;
  next_followup_date?: string;
  followups: CustomerFollowup[];
}>> {
  let query = supabase
    .from('customers')
    .select(`
      id,
      customer_name,
      customer_phone,
      latest_intent_score,
      latest_followup_date,
      funnel_stage,
      customer_status
    `);

  if (actorType === 'sales_team') {
    // sales_team 只能看到自己的客户
    query = query.eq('sales_agent_id', actorId);
  }
  // project_manager 可以看到所有

  const { data: customers, error: custError } = await query;

  if (custError || !customers) {
    return [];
  }

  // 获取每个客户的今日待跟进任务
  const result = [];
  for (const customer of customers) {
    const { data: followups } = await supabase
      .from('customer_followups')
      .select('*')
      .eq('customer_id', customer.id)
      .gte('next_followup_date', new Date().toISOString().split('T')[0])
      .lte('next_followup_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (followups && followups.length > 0) {
      result.push({
        ...customer,
        next_followup_date: followups[0].next_followup_date,
        followups: followups as CustomerFollowup[]
      });
    }
  }

  return result;
}

/**
 * 更新销售漏斗阶段
 */
async function updateFunnelStage(
  supabase: any,
  customerId: string,
  newStage: FunnelStage,
  actorId: string
): Promise<void> {
  // 检查客户是否存在且属于当前销售
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id, sales_agent_id')
    .eq('id', customerId)
    .single();

  if (custError || !customer) {
    throw new NotFoundError('Customer', customerId);
  }

  // 权限检查
  const { role } = await getCurrentUserInfo(supabase);
  if (role === 'sales_team' && customer.sales_agent_id !== actorId) {
    throw new AuthorizationError('Can only update funnel stage for your own customers');
  }

  const { error } = await supabase
    .from('customers')
    .update({
      funnel_stage: newStage,
      updated_by: actorId
    })
    .eq('id', customerId);

  if (error) {
    throw new DatabaseError(`Failed to update funnel stage: ${error.message}`);
  }
}

/**
 * 录入客户意向评分
 */
async function scoreCustomer(
  supabase: any,
  customerId: string,
  intentScore: number,
  scoreFactors: Record<string, number>,
  scoredBy: ScoredBy,
  actorId: string
): Promise<CustomerScore> {
  // 检查分数范围
  if (intentScore < 1 || intentScore > 10) {
    throw new ValidationError('Intent score must be between 1 and 10');
  }

  // 获取客户信息
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id, sales_agent_id')
    .eq('id', customerId)
    .single();

  if (custError || !customer) {
    throw new NotFoundError('Customer', customerId);
  }

  // 权限检查
  const { role } = await getCurrentUserInfo(supabase);
  if (role === 'sales_team' && customer.sales_agent_id !== actorId) {
    throw new AuthorizationError('Can only score your own customers');
  }

  const { data, error } = await supabase
    .from('customer_scores')
    .insert({
      customer_id: customerId,
      sales_agent_id: actorId,
      intent_score: intentScore,
      score_factors: scoreFactors,
      scored_by: scoredBy
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to score customer: ${error.message}`);
  }

  // 更新 customers 表的 latest_intent_score
  await supabase
    .from('customers')
    .update({
      latest_intent_score: intentScore,
      updated_by: actorId
    })
    .eq('id', customerId);

  return data as CustomerScore;
}

/**
 * 获取销售漏斗统计
 */
async function getFunnelStats(
  supabase: any,
  projectId?: string
): Promise<FunnelStats[]> {
  let query = supabase
    .from('customers')
    .select('funnel_stage', { count: 'exact' })
    .is('funnel_stage', 'not.null');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  // 统计每个阶段的数量
  const stageCounts: Record<string, number> = {};
  let totalCount = 0;

  for (const row of data) {
    const stage = row.funnel_stage as FunnelStage;
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    totalCount++;
  }

  // 转换为结果数组
  const stages: FunnelStage[] = [
    'INITIAL', 'CONTACTED', 'INTERESTED', 'NEGOTIATING', 'DECISION',
    'CLOSED_WON', 'CLOSED_LOST'
  ];

  return stages.map(stage => ({
    stage,
    count: stageCounts[stage] || 0,
    percentage: totalCount > 0 ? parseFloat(((stageCounts[stage] || 0) / totalCount * 100).toFixed(2)) : 0
  }));
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

    const body = await req.json();
    const action = body.action;

    if (!action) {
      throw new ValidationError('action is required');
    }

    const supabase = getSupabaseClient();

    // 获取当前用户信息
    const { userId, role } = await getCurrentUserInfo(supabase);

    // 根据 action 路由到对应处理函数
    switch (action) {
      case 'add_followup':
        if (!body.customer_id || !body.followup_type || !body.followup_content) {
          throw new ValidationError('Missing required fields: customer_id, followup_type, followup_content');
        }
        const followup = await addFollowup(supabase, body as FollowupInput, userId);
        return successResponse(followup);

      case 'list_followups':
        if (!body.customer_id) {
          throw new ValidationError('customer_id is required for list_followups action');
        }
        const followups = await getCustomerFollowups(supabase, body.customer_id, body.limit || 50);
        return successResponse(followups);

      case 'get_today_tasks':
        // 仅 project_manager 可以获取所有人的任务，sales_team 只能看自己的
        const tasks = await getTodayTasks(supabase, userId, role);
        return successResponse(tasks);

      case 'update_funnel_stage':
        if (!body.customer_id || !body.funnel_stage) {
          throw new ValidationError('Missing required fields: customer_id, funnel_stage');
        }
        await updateFunnelStage(supabase, body.customer_id, body.funnel_stage, userId);
        return successResponse({ message: 'Funnel stage updated successfully' });

      case 'score_customer':
        if (!body.customer_id || body.intent_score === undefined) {
          throw new ValidationError('Missing required fields: customer_id, intent_score');
        }
        const score = await scoreCustomer(
          supabase,
          body.customer_id,
          body.intent_score,
          body.score_factors || {},
          (body.scored_by as ScoredBy) || 'SALES',
          userId
        );
        return successResponse(score);

      case 'get_funnel_stats':
        const stats = await getFunnelStats(supabase, body.project_id);
        return successResponse(stats);

      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});
