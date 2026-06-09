// User Type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst';
  avatar?: string;
}

// Customer Types
export type CustomerStatus = 'POTENTIAL' | 'INTERESTED' | 'NEGOTIATING' | 'SIGNED' | 'CANCELLED';
export type CustomerType = 'INDIVIDUAL' | 'COMPANY';

export interface Commitment {
  date: string;
  content: string;
  made_by: string;
  recorded_by: string;
}

export interface Customer {
  id: string;
  project_id: string;
  customer_name: string;
  customer_phone: string;
  customer_id_number: string;
  customer_type: CustomerType;
  sales_agent_id: string;
  sales_agent_name: string;
  customer_status: CustomerStatus;
  interested_property_type: string;
  budget_range_min: number;
  budget_range_max: number;
  notes?: string;
  commitments_made: Commitment[];
  created_at: string;
}

// Project Types
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Project {
  id: string;
  project_name: string;
  location: string;
  developer_name: string;
  project_status: ProjectStatus;
  start_date: string;
  expected_completion: string;
  total_land_area: number;
  total_built_area: number;
  total_budget: number;
  tax_planning_baseline: number;
  actual_tax_amount: number;
  tax_planning_completed_at?: string;
  created_at: string;
}

// Contract Types
export type ContractType = 'SUPPLIER' | 'CONTRACTOR' | 'SALES' | 'CONSULTANT';
export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGN'
  | 'SIGNED'
  | 'ACTIVATED'
  | 'COMPLETED'
  | 'TERMINATED';

export interface PaymentMilestone {
  name: string;
  percentage: number;
  due_date: string;
}

export interface Contract {
  id: string;
  project_id: string;
  customer_id?: string;
  contract_code: string;
  contract_name: string;
  contract_type: ContractType;
  counterparty_name: string;
  counterparty_id: string;
  contract_status: ContractStatus;
  draft_date?: string;
  signed_date?: string;
  activated_date?: string;
  completion_date?: string;
  termination_date?: string;
  termination_reason?: string;
  total_amount: number;
  currency: string;
  payment_milestones: PaymentMilestone[];
  key_terms_json: Record<string, any>;
  signatory_list: Record<string, any>;
  all_signatures_complete: boolean;
  sales_agent_id?: string;
  created_at: string;
}

// Payment Types
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED';

export interface ApprovalChecklist {
  contract_signed: boolean;
  documents_received: boolean;
  tax_completed: boolean;
  milestone_achieved: boolean;
  no_blockers: boolean;
}

export interface Payment {
  id: string;
  project_id: string;
  contract_id: string;
  payment_code: string;
  payment_amount: number;
  payment_currency: string;
  payment_date: string;
  payment_status: PaymentStatus;
  approval_checklist: ApprovalChecklist;
  approval_checklist_completed_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_notes?: string;
  rejection_reason?: string;
  created_at: string;
}

// Budget Types
export type CostCategory =
  | 'LAND'
  | 'CONSTRUCTION'
  | 'SALES'
  | 'TAX'
  | 'OVERHEAD'
  | 'MARKETING'
  | 'ADMIN';

export type BudgetStatus = 'APPROVED' | 'PENDING' | 'REVISED';

export interface CostBudget {
  id: string;
  project_id: string;
  cost_category: CostCategory;
  subcategory: string;
  budgeted_amount: number;
  spent_amount: number;
  budget_status: BudgetStatus;
  budget_approved_date?: string;
  budget_approved_by?: string;
  created_at: string;
}

// Audit Log Types
export type EntityType = 'payment' | 'contract' | 'customer' | 'project' | 'cost_budget';
export type ActionType =
  | 'CREATED'
  | 'UPDATED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DELETED'
  | 'SIGNED'
  | 'EXECUTED';

export interface AuditLog {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  action: ActionType;
  actor_type: 'USER' | 'AGENT' | 'SYSTEM';
  actor_id?: string;
  actor_name?: string;
  change_details?: Record<string, any>;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}
