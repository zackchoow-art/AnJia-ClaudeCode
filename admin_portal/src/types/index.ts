// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst';
  avatar?: string;
}

// 客户类型
export interface Customer {
  id: string;
  project_id: string;
  customer_name: string;
  customer_phone: string;
  customer_id_number: string;
  customer_type: 'INDIVIDUAL' | 'COMPANY';
  sales_agent_id: string;
  sales_agent_name: string;
  customer_status: 'POTENTIAL' | 'INTERESTED' | 'NEGOTIATING' | 'SIGNED' | 'CANCELLED';
  interested_property_type: string;
  budget_range_min: number;
  budget_range_max: number;
  notes?: string;
  commitments_made: Array<{
    date: string;
    content: string;
    made_by: string;
    recorded_by: string;
  }>;
  created_at: string;
}

// 项目类型
export interface Project {
  id: string;
  project_name: string;
  location: string;
  developer_name: string;
  project_status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
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

// 合同类型
export interface Contract {
  id: string;
  project_id: string;
  customer_id?: string;
  contract_code: string;
  contract_name: string;
  contract_type: 'SUPPLIER' | 'CONTRACTOR' | 'SALES' | 'CONSULTANT';
  counterparty_name: string;
  counterparty_id: string;
  contract_status:
    | 'DRAFT'
    | 'PENDING_SIGN'
    | 'SIGNED'
    | 'ACTIVATED'
    | 'COMPLETED'
    | 'TERMINATED';
  draft_date?: string;
  signed_date?: string;
  activated_date?: string;
  completion_date?: string;
  termination_date?: string;
  termination_reason?: string;
  total_amount: number;
  currency: string;
  payment_milestones: Array<{
    name: string;
    percentage: number;
    due_date: string;
  }>;
  key_terms_json: Record<string, any>;
  signatory_list: Record<string, any>;
  all_signatures_complete: boolean;
  sales_agent_id?: string;
  created_at: string;
}

// 支付类型
export interface Payment {
  id: string;
  project_id: string;
  contract_id: string;
  payment_code: string;
  payment_amount: number;
  payment_currency: string;
  payment_date: string;
  payment_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED';
  approval_checklist: {
    contract_signed: boolean;
    documents_received: boolean;
    tax_completed: boolean;
    milestone_achieved: boolean;
    no_blockers: boolean;
  };
  approval_checklist_completed_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_notes?: string;
  rejection_reason?: string;
  created_at: string;
}

// 预算类型
export interface CostBudget {
  id: string;
  project_id: string;
  cost_category:
    | 'LAND'
    | 'CONSTRUCTION'
    | 'SALES'
    | 'TAX'
    | 'OVERHEAD'
    | 'MARKETING'
    | 'ADMIN';
  subcategory: string;
  budgeted_amount: number;
  spent_amount: number;
  budget_status: 'APPROVED' | 'PENDING' | 'REVISED';
  budget_approved_date?: string;
  budget_approved_by?: string;
  created_at: string;
}

// 成本账本
export interface CostLedger {
  id: string;
  project_id: string;
  cost_budget_id: string;
  cost_type: string;
  cost_description: string;
  cost_amount: number;
  cost_date: string;
  receipt_filename?: string;
  receipt_hash?: string;
  invoice_number?: string;
  invoice_date?: string;
  verified_by?: string;
  verification_date?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at: string;
}

// 审计日志
export interface AuditLog {
  id: string;
  entity_type:
    | 'payment'
    | 'contract'
    | 'customer'
    | 'project'
    | 'cost_budget'
    | 'cost_ledger';
  entity_id: string;
  action:
    | 'CREATED'
    | 'UPDATED'
    | 'APPROVED'
    | 'REJECTED'
    | 'DELETED'
    | 'SIGNED'
    | 'EXECUTED';
  actor_type: 'USER' | 'AGENT' | 'SYSTEM';
  actor_id?: string;
  actor_name?: string;
  change_details?: Record<string, any>;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}
