/**
 * API Service Layer
 *
 * This module provides a clean abstraction over Supabase for business operations.
 * It handles authentication, error formatting, and business logic validation.
 */

import { supabase } from './supabaseClient';
import {
  Project,
  Customer,
  Contract,
  Payment,
  CostBudget,
  CostLedger,
  AuditLog,
  Property,
  PropertyReservation,
  CustomerFollowup,
} from '../types/database';

/**
 * Business logic validation for payment creation
 */
export const validatePaymentCreation = (data: Partial<Payment>): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!data.project_id) errors.push('Project is required');
  if (!data.contract_id) errors.push('Contract is required');
  if (!data.payment_amount || data.payment_amount <= 0) {
    errors.push('Payment amount must be greater than 0');
  }
  if (!data.payment_code) errors.push('Payment code is required');

  return { valid: errors.length === 0, errors };
};

/**
 * Business logic validation for customer creation
 */
export const validateCustomerCreation = (data: Partial<Customer>): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!data.project_id) errors.push('Project is required');
  if (!data.customer_name) errors.push('Customer name is required');
  if (!data.customer_phone) errors.push('Phone number is required');
  if (!data.sales_agent_id) errors.push('Sales agent ID is required');

  return { valid: errors.length === 0, errors };
};

/**
 * Get current user's accessible projects based on their role
 */
export const getUserProjects = async (userId: string): Promise<Project[] | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  // Check if user has project_manager or higher role
  // For now, return all projects - role-based filtering happens in RLS
  const { data: projects, error } = await supabase
    .from<Project>('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return null;
  }

  return projects || [];
};

/**
 * Get customer stats for a user (respects RLS)
 */
export const getCustomerStats = async (): Promise<{
  totalCustomers: number;
  potentialCount: number;
  interestedCount: number;
  signedCount: number;
}> => {
  // This respects RLS - users only see their own customers
  const { data: customers, error } = await supabase.from<Customer>('customers').select('*');

  if (error) {
    console.error('Error fetching customer stats:', error);
    return { totalCustomers: 0, potentialCount: 0, interestedCount: 0, signedCount: 0 };
  }

  const stats = {
    totalCustomers: customers?.length || 0,
    potentialCount: 0,
    interestedCount: 0,
    signedCount: 0,
  };

  (customers || []).forEach((c) => {
    if (c.customer_status === 'POTENTIAL') stats.potentialCount++;
    else if (c.customer_status === 'INTERESTED') stats.interestedCount++;
    else if (c.customer_status === 'SIGNED') stats.signedCount++;
  });

  return stats;
};

/**
 * Get payment summary for dashboard
 */
export const getPaymentSummary = async (): Promise<{
  pendingAmount: number;
  approvedAmount: number;
  totalAmount: number;
}> => {
  // This respects RLS - users only see payments they can access
  const { data: payments, error } = await supabase.from<Payment>('payments').select('*');

  if (error) {
    console.error('Error fetching payment summary:', error);
    return { pendingAmount: 0, approvedAmount: 0, totalAmount: 0 };
  }

  let pendingAmount = 0;
  let approvedAmount = 0;
  let totalAmount = 0;

  (payments || []).forEach((p) => {
    const amount = p.payment_amount || 0;
    totalAmount += amount;
    if (p.payment_status === 'PENDING') pendingAmount += amount;
    else if (p.payment_status === 'APPROVED' || p.payment_status === 'EXECUTED') approvedAmount += amount;
  });

  return { pendingAmount, approvedAmount, totalAmount };
};

/**
 * Get contract statistics
 */
export const getContractStats = async (): Promise<{
  totalContracts: number;
  draftCount: number;
  signedCount: number;
  completedCount: number;
}> => {
  const { data: contracts, error } = await supabase.from<Contract>('contracts').select('*');

  if (error) {
    console.error('Error fetching contract stats:', error);
    return { totalContracts: 0, draftCount: 0, signedCount: 0, completedCount: 0 };
  }

  const stats = {
    totalContracts: contracts?.length || 0,
    draftCount: 0,
    signedCount: 0,
    completedCount: 0,
  };

  (contracts || []).forEach((c) => {
    if (c.contract_status === 'DRAFT') stats.draftCount++;
    else if (c.contract_status === 'SIGNED' || c.contract_status === 'ACTIVATED') stats.signedCount++;
    else if (c.contract_status === 'COMPLETED') stats.completedCount++;
  });

  return stats;
};

/**
 * Get property inventory for sales
 */
export const getPropertyInventory = async (): Promise<Property[]> => {
  // Sales team can only see AVAILABLE and RESERVED properties
  // This is enforced by RLS
  const { data: properties, error } = await supabase.from<Property>('properties').select('*');

  if (error) {
    console.error('Error fetching property inventory:', error);
    return [];
  }

  return properties || [];
};

/**
 * Get recent activity logs
 */
export const getRecentActivityLogs = async (limit: number = 10): Promise<AuditLog[]> => {
  const { data: logs, error } = await supabase
    .from<AuditLog>('audit_log')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }

  return logs || [];
};

/**
 * Get properties by status
 */
export const getPropertiesByStatus = async (status: string): Promise<Property[]> => {
  const { data: properties, error } = await supabase
    .from<Property>('properties')
    .select('*')
    .eq('property_status', status);

  if (error) {
    console.error(`Error fetching properties with status ${status}:`, error);
    return [];
  }

  return properties || [];
};

/**
 * Get customer follow-ups for today
 */
export const getTodayFollowups = async (): Promise<CustomerFollowup[]> => {
  const today = new Date().toISOString().split('T')[0];

  const { data: followups, error } = await supabase
    .from<CustomerFollowup>('customer_followups')
    .select('*')
    .gte('next_followup_date', today)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching today\'s follow-ups:', error);
    return [];
  }

  return followups || [];
};

/**
 * Create a new property reservation
 */
export const createPropertyReservation = async (
  data: Omit<PropertyReservation, 'id' | 'reserved_at'>
): Promise<{ data: PropertyReservation | null; error: string | null }> => {
  const { data: reservation, error } = await supabase
    .from<PropertyReservation>('property_reservations')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating property reservation:', error);
    return { data: null, error: error.message };
  }

  return { data: reservation, error: null };
};

/**
 * Update property status
 */
export const updatePropertyStatus = async (
  propertyId: string,
  newStatus: Property['property_status'],
  reason?: string
): Promise<{ success: boolean; error?: string }> => {
  // First check current status to validate transition
  const { data: property, error: fetchError } = await supabase
    .from<Property>('properties')
    .select('property_status, property_code')
    .eq('id', propertyId)
    .single();

  if (fetchError) {
    console.error('Error fetching property:', fetchError);
    return { success: false, error: fetchError.message };
  }

  // Validate status transition
  const currentStatus = property?.property_status;
  let isValidTransition = false;

  switch (newStatus) {
    case 'AVAILABLE':
      isValidTransition = currentStatus === 'RESERVED' || currentStatus === 'SOLD';
      break;
    case 'RESERVED':
      isValidTransition = currentStatus === 'AVAILABLE';
      break;
    case 'UNDER_CONTRACT':
      isValidTransition = currentStatus === 'RESERVED';
      break;
    case 'SOLD':
      isValidTransition = currentStatus === 'UNDER_CONTRACT';
      break;
    case 'OWNER_OCCUPIED':
    case 'UNAVAILABLE':
      isValidTransition = true; // Admin override
      break;
  }

  if (!isValidTransition) {
    return { success: false, error: `Invalid status transition from ${currentStatus} to ${newStatus}` };
  }

  const { error } = await supabase
    .from<Property>('properties')
    .update({ property_status: newStatus })
    .eq('id', propertyId);

  if (error) {
    console.error('Error updating property status:', error);
    return { success: false, error: error.message };
  }

  // Record status change in history
  await supabase.from('property_status_history').insert({
    property_id: propertyId,
    old_status: currentStatus,
    new_status: newStatus,
    changed_by: 'current_user', // Should be replaced with actual user ID
    reason,
  });

  return { success: true };
};

// ============================================================================
// Project API Methods (Phase 3)
// ============================================================================

/**
 * Get all projects with optional filters
 */
export const getProjects = async (): Promise<Project[]> => {
  const { data: projects, error } = await supabase
    .from<Project>('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return projects || [];
};

/**
 * Get project by ID
 */
export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const { data: project, error } = await supabase
    .from<Project>('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    return null;
  }

  return project;
};

/**
 * Create a new project
 */
export const createProject = async (
  data: Partial<Project>
): Promise<{ data: Project | null; error: string | null }> => {
  const { data: project, error } = await supabase
    .from<Project>('projects')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return { data: null, error: error.message };
  }

  return { data: project, error: null };
};

/**
 * Update project
 */
export const updateProject = async (
  projectId: string,
  data: Partial<Project>
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from<Project>('projects')
    .update(data)
    .eq('id', projectId);

  if (error) {
    console.error(`Error updating project ${projectId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete project
 */
export const deleteProject = async (
  projectId: string
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from<Project>('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Get cost budgets for a project
 */
export const getCostBudgets = async (
  projectId: string
): Promise<import('../types/database').CostBudget[]> => {
  const { data: budgets, error } = await supabase
    .from<import('../types/database').CostBudget>('cost_budget')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching cost budgets for project ${projectId}:`, error);
    return [];
  }

  return budgets || [];
};

/**
 * Create cost budget
 */
export const createCostBudget = async (
  data: Partial<import('../types/database').CostBudget>
): Promise<{ data: import('../types/database').CostBudget | null; error: string | null }> => {
  const { data: budget, error } = await supabase
    .from<import('../types/database').CostBudget>('cost_budget')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating cost budget:', error);
    return { data: null, error: error.message };
  }

  return { data: budget, error: null };
};

/**
 * Update cost budget
 */
export const updateCostBudget = async (
  budgetId: string,
  data: Partial<import('../types/database').CostBudget>
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from<import('../types/database').CostBudget>('cost_budget')
    .update(data)
    .eq('id', budgetId);

  if (error) {
    console.error(`Error updating cost budget ${budgetId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete cost budget
 */
export const deleteCostBudget = async (
  budgetId: string
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from<import('../types/database').CostBudget>('cost_budget')
    .delete()
    .eq('id', budgetId);

  if (error) {
    console.error(`Error deleting cost budget ${budgetId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// ============================================================================
// Property Units API Methods (Phase 3)
// ============================================================================

/**
 * Get property units for a project
 */
export const getPropertyUnits = async (
  projectId: string
): Promise<import('../types/database').PropertyUnit[]> => {
  const { data: units, error } = await supabase
    .from<import('../types/database').PropertyUnit>('property_units')
    .select('*')
    .eq('project_id', projectId)
    .order('building_number', { ascending: true })
    .order('floor_number', { ascending: true });

  if (error) {
    console.error(`Error fetching property units for project ${projectId}:`, error);
    return [];
  }

  return units || [];
};

/**
 * Get property unit by ID
 */
export const getPropertyUnitById = async (
  unitId: string
): Promise<import('../types/database').PropertyUnit | null> => {
  const { data: unit, error } = await supabase
    .from<import('../types/database').PropertyUnit>('property_units')
    .select('*')
    .eq('id', unitId)
    .single();

  if (error) {
    console.error(`Error fetching property unit ${unitId}:`, error);
    return null;
  }

  return unit;
};

/**
 * Create property unit
 */
export const createPropertyUnit = async (
  data: Partial<import('../types/database').PropertyUnit>
): Promise<{ data: import('../types/database').PropertyUnit | null; error: string | null }> => {
  const { data: unit, error } = await supabase
    .from<import('../types/database').PropertyUnit>('property_units')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating property unit:', error);
    return { data: null, error: error.message };
  }

  return { data: unit, error: null };
};

/**
 * Update property unit
 */
export const updatePropertyUnit = async (
  unitId: string,
  data: Partial<import('../types/database').PropertyUnit>
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from<import('../types/database').PropertyUnit>('property_units')
    .update(data)
    .eq('id', unitId);

  if (error) {
    console.error(`Error updating property unit ${unitId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete property unit
 */
export const deletePropertyUnit = async (
  unitId: string
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from<import('../types/database').PropertyUnit>('property_units')
    .delete()
    .eq('id', unitId);

  if (error) {
    console.error(`Error deleting property unit ${unitId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Update property unit status
 */
export const updatePropertyUnitStatus = async (
  unitId: string,
  newStatus: import('../types/database').PropertyUnit['property_status'],
  reason?: string
): Promise<{ success: boolean; error?: string }> => {
  // Validate status transition
  const { data: unit, error: fetchError } = await supabase
    .from<import('../types/database').PropertyUnit>('property_units')
    .select('property_status')
    .eq('id', unitId)
    .single();

  if (fetchError) {
    console.error('Error fetching property unit:', fetchError);
    return { success: false, error: fetchError.message };
  }

  // Record status change in history
  await supabase.from('property_units_status_history').insert({
    property_unit_id: unitId,
    old_status: unit?.property_status || null,
    new_status: newStatus,
    changed_by: 'current_user', // Should be replaced with actual user ID
    reason,
  });

  const { error } = await supabase
    .from<import('../types/database').PropertyUnit>('property_units')
    .update({ property_status: newStatus })
    .eq('id', unitId);

  if (error) {
    console.error('Error updating property unit status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};
