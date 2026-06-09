import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import {
  Project,
  Customer,
  Contract,
  Payment,
  CostBudget,
  CostLedger,
  ApprovalGate,
  PaymentRule,
  AuditLog,
  TaskLock,
  SchemaVersion,
  WorkLog,
  Property,
  PropertyReservation,
  PropertyRecommendation,
  CustomerFollowup,
  CustomerScore,
  PlanningDocument,
  DesignDocument,
  CustomTimelineEvent,
  CostCategory,
  TaxType,
  ExpenseItem,
} from '../types/database';

// Database URL and anonymous key should be in environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Supabase client instance
 */
export const supabase: SupabaseClient<{
  projects: Project;
  customers: Customer;
  contracts: Contract;
  payments: Payment;
  cost_budget: CostBudget;
  cost_ledger: CostLedger;
  approval_gates: ApprovalGate;
  payment_rules: PaymentRule;
  audit_log: AuditLog;
  task_locks: TaskLock;
  schema_version: SchemaVersion;
  work_logs: WorkLog;
  properties: Property;
  property_reservations: PropertyReservation;
  property_recommendations: PropertyRecommendation;
  customer_followups: CustomerFollowup;
  customer_scores: CustomerScore;
  planning_documents: PlanningDocument;
  design_documents: DesignDocument;
  custom_timeline_events: CustomTimelineEvent;
  cost_categories: CostCategory;
  tax_types: TaxType;
  expense_items: ExpenseItem;
}> = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Auth service wrapper
 */
export const authService = {
  /**
   * Get current session
   */
  getSession: async (): Promise<Session | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return data.session;
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string): Promise<{ error?: any; user?: any }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error };
    }
    return { user: data.user };
  },

  /**
   * Sign up with email and password
   */
  signUp: async (
    email: string,
    password: string,
    options?: { data?: Record<string, unknown> }
  ): Promise<{ error?: any; user?: any }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    if (error) {
      return { error };
    }
    return { user: data.user };
  },

  /**
   * Sign out current user
   */
  signOut: async (): Promise<{ error?: any }> => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  },
};

/**
 * Generic CRUD service for any table
 */
export class CrudService<T> {
  constructor(private tableName: string) {}

  /**
   * Get all records
   */
  async getAll(
    filters?: { column: string; operator: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte'; value: any }[],
    orderBy?: { column: string; ascending: boolean },
    limit?: number,
    offset?: number
  ): Promise<{ data: T[] | null; error: Error | null }> {
    let query = supabase.from<T>(this.tableName).select('*');

    if (filters) {
      filters.forEach((f) => {
        query = query.filter(f.column, f.operator as any, f.value);
      });
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 0) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Get one record by ID
   */
  async getById(id: string): Promise<{ data: T | null; error: Error | null }> {
    const { data, error } = await supabase.from<T>(this.tableName).select('*').eq('id', id).single();

    if (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Insert a new record
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: T | null; error: Error | null }> {
    const { data: result, error } = await supabase.from<T>(this.tableName).insert(data).select().single();

    if (error) {
      console.error(`Error inserting ${this.tableName}:`, error);
      return { data: null, error };
    }

    return { data: result, error: null };
  }

  /**
   * Update a record
   */
  async update(
    id: string,
    data: Partial<T>
  ): Promise<{ data: T | null; error: Error | null }> {
    const { data: result, error } = await supabase
      .from<T>(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return { data: null, error };
    }

    return { data: result, error: null };
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.from<T>(this.tableName).delete().eq('id', id);

    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return { error };
    }

    return { error: null };
  }
}

// Export CRUD services for each table
export const projectsService = new CrudService<Project>('projects');
export const customersService = new CrudService<Customer>('customers');
export const contractsService = new CrudService<Contract>('contracts');
export const paymentsService = new CrudService<Payment>('payments');
export const costBudgetService = new CrudService<CostBudget>('cost_budget');
export const costLedgerService = new CrudService<CostLedger>('cost_ledger');
export const approvalGatesService = new CrudService<ApprovalGate>('approval_gates');
export const paymentRulesService = new CrudService<PaymentRule>('payment_rules');
export const auditLogsService = new CrudService<AuditLog>('audit_log');
export const taskLocksService = new CrudService<TaskLock>('task_locks');
export const schemaVersionsService = new CrudService<SchemaVersion>('schema_version');
export const workLogsService = new CrudService<WorkLog>('work_logs');
export const propertiesService = new CrudService<Property>('properties');
export const propertyReservationsService = new CrudService<PropertyReservation>('property_reservations');
export const propertyRecommendationsService = new CrudService<PropertyRecommendation>('property_recommendations');
export const customerFollowupsService = new CrudService<CustomerFollowup>('customer_followups');
export const customerScoresService = new CrudService<CustomerScore>('customer_scores');

// Phase 3 Advanced services
export const planningDocumentsService = new CrudService<PlanningDocument>('planning_documents');
export const designDocumentsService = new CrudService<DesignDocument>('design_documents');
export const customTimelineEventsService = new CrudService<CustomTimelineEvent>('custom_timeline_events');
export const costCategoriesService = new CrudService<CostCategory>('cost_categories');
export const taxTypesService = new CrudService<TaxType>('tax_types');
export const expenseItemsService = new CrudService<ExpenseItem>('expense_items');
