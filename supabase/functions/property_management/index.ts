// ============================================================================
// property_management Edge Function (T01 - Phase 2)
// Property Inventory Management with State Machine
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

export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'UNDER_CONTRACT' | 'SOLD' | 'OWNER_OCCUPIED' | 'UNAVAILABLE';
export type ReservationStatus = 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';

export interface Property {
  id: string;
  project_id: string;
  building_number: string;
  floor_number: number;
  unit_number: string;
  room_number: string;
  property_code: string;
  property_type: Record<string, string>;
  floor_area: number;
  usable_area?: number;
  orientation?: string;
  list_price?: number;
  final_price?: number;
  price_per_sqm?: number;
  property_status: PropertyStatus;
  customer_id?: string | null;
  contract_id?: string | null;
  features: Array<string | Record<string, string>>;
  created_by?: string;
  created_at: string;
  updated_by?: string;
  updated_at: string;
}

export interface PropertyCreateInput {
  project_id: string;
  building_number: string;
  floor_number: number;
  unit_number: string;
  room_number: string;
  property_code: string;
  property_type: Record<string, string>;
  floor_area: number;
  usable_area?: number;
  orientation?: string;
  list_price?: number;
  features?: Array<string | Record<string, string>>;
}

export interface PropertyUpdateInput {
  id: string;
  building_number?: string;
  floor_number?: number;
  unit_number?: string;
  room_number?: string;
  property_type?: Record<string, string>;
  floor_area?: number;
  usable_area?: number;
  orientation?: string;
  list_price?: number;
  final_price?: number;
  price_per_sqm?: number;
  property_status?: PropertyStatus;
  customer_id?: string | null;
  contract_id?: string | null;
  features?: Array<string | Record<string, string>>;
}

export interface ReserveRequest {
  property_id: string;
  customer_id: string;
  sales_agent_id: string;
  reservation_amount?: number;
  expires_at?: string;
  notes?: string;
}

export interface ConvertToContractRequest {
  property_id: string;
  contract_id: string;
  sales_agent_id: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

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
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_type: 'SYSTEM',
    actor_id: actorId,
    change_details: changeDetails
  });
}

/**
 * 检查用户是否有权限操作
 */
function checkUserAccess(supabase: any, actorId: string, actorType: string): boolean {
  // project_manager 可以访问所有资源
  if (actorType === 'project_manager') {
    return true;
  }
  // sales_team 只能通过 RLS 进行数据隔离
  if (actorType === 'sales_team') {
    return true;
  }
  return false;
}

/**
 * 获取当前用户的信息和类型
 */
async function getCurrentUserInfo(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthorizationError('User not authenticated');
  }

  // 从 JWT claims 中获取用户类型和ID
  const role = user.app_metadata?.role || 'sales_team';
  const userId = user.id;

  return { userId, role };
}

/**
 * 获取单个房源详情（包含客户信息）
 */
async function getPropertyDetail(supabase: any, propertyId: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      project_id,
      building_number,
      floor_number,
      unit_number,
      room_number,
      property_code,
      property_type,
      floor_area,
      usable_area,
      orientation,
      list_price,
      final_price,
      price_per_sqm,
      property_status,
      customer_id,
      contract_id,
      features,
      created_by,
      created_at,
      updated_by,
      updated_at
    `)
    .eq('id', propertyId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Property;
}

/**
 * 列出项目的所有房源（支持筛选）
 */
async function listProperties(
  supabase: any,
  projectId: string,
  status?: PropertyStatus,
  floorNumber?: number
): Promise<Property[]> {
  let query = supabase
    .from('properties')
    .select(`
      id,
      project_id,
      building_number,
      floor_number,
      unit_number,
      room_number,
      property_code,
      property_type,
      floor_area,
      usable_area,
      orientation,
      list_price,
      final_price,
      price_per_sqm,
      property_status,
      customer_id,
      contract_id,
      features,
      created_by,
      created_at,
      updated_by,
      updated_at
    `)
    .eq('project_id', projectId);

  if (status) {
    query = query.eq('property_status', status);
  }

  if (floorNumber !== undefined) {
    query = query.eq('floor_number', floorNumber);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as Property[];
}

/**
 * 创建新房源
 */
async function createProperty(
  supabase: any,
  input: PropertyCreateInput,
  actorId: string
): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...input,
      created_by: actorId,
      updated_by: actorId
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to create property: ${error.message}`);
  }

  // 记录审计日志
  await createAuditLog(
    supabase,
    'properties',
    data.id,
    'CREATED',
    actorId,
    { property_code: data.property_code }
  );

  return data as Property;
}

/**
 * 更新房源信息（只能更新非状态字段，状态通过专用函数变更）
 */
async function updatePropertyBasicInfo(
  supabase: any,
  input: PropertyUpdateInput,
  actorId: string
): Promise<Property> {
  // 移除不允许直接更新的字段
  const { property_status, customer_id, contract_id, ...updatableFields } = input;

  if (Object.keys(updatableFields).length === 0) {
    throw new ValidationError('No fields to update');
  }

  const { data, error } = await supabase
    .from('properties')
    .update({
      ...updatableFields,
      updated_by: actorId
    })
    .eq('id', input.id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to update property: ${error.message}`);
  }

  return data as Property;
}

/**
 * 认购房源：AVAILABLE -> RESERVED
 */
async function reserveProperty(
  supabase: any,
  request: ReserveRequest,
  actorId: string,
  actorType: string
): Promise<Property> {
  // 验证销售权限
  if (actorType === 'sales_team' && request.sales_agent_id !== actorId) {
    throw new AuthorizationError('Can only reserve properties for yourself');
  }

  // 获取房源信息
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, property_status, project_id')
    .eq('id', request.property_id)
    .single();

  if (propError || !property) {
    throw new NotFoundError('Property', request.property_id);
  }

  // 验证状态转换
  if (property.property_status !== 'AVAILABLE') {
    throw new ValidationError(
      `Cannot reserve property with status: ${property.property_status}`
    );
  }

  // 开始事务
  const { error: updateError } = await supabase
    .from('properties')
    .update({
      property_status: 'RESERVED',
      customer_id: request.customer_id,
      updated_by: actorId
    })
    .eq('id', request.property_id);

  if (updateError) {
    throw new DatabaseError(`Failed to reserve property: ${updateError.message}`);
  }

  // 创建认购记录
  const { data: reservation, error: resError } = await supabase
    .from('property_reservations')
    .insert({
      property_id: request.property_id,
      customer_id: request.customer_id,
      sales_agent_id: request.sales_agent_id,
      reservation_amount: request.reservation_amount,
      expires_at: request.expires_at,
      notes: request.notes,
      reservation_status: 'ACTIVE'
    })
    .select()
    .single();

  if (resError) {
    // 回滚状态
    await supabase
      .from('properties')
      .update({ property_status: 'AVAILABLE', updated_by: actorId })
      .eq('id', request.property_id);
    throw new DatabaseError(`Failed to create reservation: ${resError.message}`);
  }

  // 记录审计日志
  await createAuditLog(
    supabase,
    'properties',
    request.property_id,
    'RESERVED',
    actorId,
    { customer_id: request.customer_id, reservation_id: reservation.id }
  );

  return getPropertyDetail(supabase, request.property_id);
}

/**
 * 转换认购为合同：RESERVED -> UNDER_CONTRACT
 */
async function convertToContract(
  supabase: any,
  request: ConvertToContractRequest,
  actorId: string
): Promise<Property> {
  // 获取房源信息
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, property_status, customer_id')
    .eq('id', request.property_id)
    .single();

  if (propError || !property) {
    throw new NotFoundError('Property', request.property_id);
  }

  // 验证状态转换
  if (property.property_status !== 'RESERVED') {
    throw new ValidationError(
      `Cannot convert to contract. Property status is: ${property.property_status}`
    );
  }

  // 更新房源状态
  const { error: updateError } = await supabase
    .from('properties')
    .update({
      property_status: 'UNDER_CONTRACT',
      contract_id: request.contract_id,
      updated_by: actorId
    })
    .eq('id', request.property_id);

  if (updateError) {
    throw new DatabaseError(`Failed to convert to contract: ${updateError.message}`);
  }

  // 更新认购记录状态
  await supabase
    .from('property_reservations')
    .update({ reservation_status: 'CONVERTED' })
    .eq('property_id', request.property_id)
    .eq('reservation_status', 'ACTIVE');

  // 记录审计日志
  await createAuditLog(
    supabase,
    'properties',
    request.property_id,
    'UNDER_CONTRACT',
    actorId,
    { contract_id: request.contract_id }
  );

  return getPropertyDetail(supabase, request.property_id);
}

/**
 * 标记售出：UNDER_CONTRACT -> SOLD
 */
async function markSold(
  supabase: any,
  propertyId: string,
  finalPrice: number,
  actorId: string
): Promise<Property> {
  // 获取房源信息
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, property_status')
    .eq('id', propertyId)
    .single();

  if (propError || !property) {
    throw new NotFoundError('Property', propertyId);
  }

  // 验证状态转换
  if (property.property_status !== 'UNDER_CONTRACT') {
    throw new ValidationError(
      `Cannot mark sold. Property status is: ${property.property_status}`
    );
  }

  // 更新房源状态和成交价
  const { error: updateError } = await supabase
    .from('properties')
    .update({
      property_status: 'SOLD',
      final_price: finalPrice,
      updated_by: actorId
    })
    .eq('id', propertyId);

  if (updateError) {
    throw new DatabaseError(`Failed to mark as sold: ${updateError.message}`);
  }

  // 记录审计日志
  await createAuditLog(
    supabase,
    'properties',
    propertyId,
    'SOLD',
    actorId,
    { final_price: finalPrice }
  );

  return getPropertyDetail(supabase, propertyId);
}

/**
 * 释放认购：RESERVED -> AVAILABLE (取消认购)
 */
async function releaseReservation(
  supabase: any,
  propertyId: string,
  actorId: string
): Promise<Property> {
  // 获取房源信息
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, property_status, customer_id, contract_id')
    .eq('id', propertyId)
    .single();

  if (propError || !property) {
    throw new NotFoundError('Property', propertyId);
  }

  // 验证状态转换
  if (property.property_status !== 'RESERVED') {
    throw new ValidationError(
      `Cannot release. Property status is: ${property.property_status}`
    );
  }

  // 更新房源状态
  const { error: updateError } = await supabase
    .from('properties')
    .update({
      property_status: 'AVAILABLE',
      customer_id: null,
      contract_id: null,
      updated_by: actorId
    })
    .eq('id', propertyId);

  if (updateError) {
    throw new DatabaseError(`Failed to release reservation: ${updateError.message}`);
  }

  // 更新认购记录状态
  await supabase
    .from('property_reservations')
    .update({ reservation_status: 'CANCELLED' })
    .eq('property_id', propertyId)
    .eq('reservation_status', 'ACTIVE');

  // 记录审计日志
  await createAuditLog(
    supabase,
    'properties',
    propertyId,
    'RESERVATION_RELEASED',
    actorId,
    {}
  );

  return getPropertyDetail(supabase, propertyId);
}

/**
 * 更新定价（仅 project_manager）
 */
async function updatePrice(
  supabase: any,
  propertyId: string,
  listPrice?: number,
  pricePerSqm?: number,
  actorId: string = 'system'
): Promise<Property> {
  // 获取房源信息
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, property_status, list_price')
    .eq('id', propertyId)
    .single();

  if (propError || !property) {
    throw new NotFoundError('Property', propertyId);
  }

  // 更新定价字段
  const updateFields: any = { updated_by: actorId };
  if (listPrice !== undefined) updateFields.list_price = listPrice;
  if (pricePerSqm !== undefined) updateFields.price_per_sqm = pricePerSqm;

  const { error: updateError } = await supabase
    .from('properties')
    .update(updateFields)
    .eq('id', propertyId);

  if (updateError) {
    throw new DatabaseError(`Failed to update price: ${updateError.message}`);
  }

  // 记录审计日志
  await createAuditLog(
    supabase,
    'properties',
    propertyId,
    'PRICE_UPDATED',
    actorId,
    { list_price: listPrice, price_per_sqm: pricePerSqm }
  );

  return getPropertyDetail(supabase, propertyId);
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

    // 根据 action 路由到对应处理函数
    switch (action) {
      case 'list':
        if (!body.project_id) {
          throw new ValidationError('project_id is required for list action');
        }
        const properties = await listProperties(
          supabase,
          body.project_id,
          body.status as PropertyStatus,
          body.floor_number
        );
        return successResponse(properties);

      case 'get':
        if (!body.property_id) {
          throw new ValidationError('property_id is required for get action');
        }
        const property = await getPropertyDetail(supabase, body.property_id);
        if (!property) {
          throw new NotFoundError('Property', body.property_id);
        }
        return successResponse(property);

      case 'create':
        if (!body.project_id || !body.building_number || !body.room_number) {
          throw new ValidationError('Missing required fields for create');
        }
        const { userId, role } = await getCurrentUserInfo(supabase);
        const newProperty = await createProperty(supabase, body as PropertyCreateInput, userId);
        return successResponse(newProperty);

      case 'update':
        if (!body.id) {
          throw new ValidationError('property id is required for update');
        }
        const updatedProp = await updatePropertyBasicInfo(
          supabase,
          body as PropertyUpdateInput,
          body.updated_by || 'system'
        );
        return successResponse(updatedProp);

      case 'reserve':
        if (!body.property_id || !body.customer_id || !body.sales_agent_id) {
          throw new ValidationError('Missing required fields: property_id, customer_id, sales_agent_id');
        }
        const reserved = await reserveProperty(
          supabase,
          body as ReserveRequest,
          body.actor_id || 'system',
          role
        );
        return successResponse(reserved);

      case 'convert_to_contract':
        if (!body.property_id || !body.contract_id) {
          throw new ValidationError('Missing required fields: property_id, contract_id');
        }
        const converted = await convertToContract(
          supabase,
          body as ConvertToContractRequest,
          body.actor_id || 'system'
        );
        return successResponse(converted);

      case 'mark_sold':
        if (!body.property_id || body.final_price === undefined) {
          throw new ValidationError('Missing required fields: property_id, final_price');
        }
        const sold = await markSold(
          supabase,
          body.property_id,
          body.final_price,
          body.actor_id || 'system'
        );
        return successResponse(sold);

      case 'release':
        if (!body.property_id) {
          throw new ValidationError('property_id is required for release action');
        }
        const released = await releaseReservation(
          supabase,
          body.property_id,
          body.actor_id || 'system'
        );
        return successResponse(released);

      case 'update_price':
        if (!body.property_id) {
          throw new ValidationError('property_id is required for update_price action');
        }
        const priceUpdated = await updatePrice(
          supabase,
          body.property_id,
          body.list_price,
          body.price_per_sqm,
          body.actor_id || 'system'
        );
        return successResponse(priceUpdated);

      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});
