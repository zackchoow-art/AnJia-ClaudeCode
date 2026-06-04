// ============================================================================
// Shared types for all Edge Functions
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface Payment {
  id: string;
  project_id: string;
  contract_id: string;
  payment_code: string;
  payment_amount: number;
  payment_currency: string;
  payment_date: string;
  payment_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED';
  approval_checklist: Record<string, boolean>;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_notes?: string;
  rejection_reason?: string;
}

export interface Contract {
  id: string;
  project_id: string;
  contract_code: string;
  contract_name: string;
  contract_type: 'SUPPLIER' | 'CONTRACTOR' | 'SALES' | 'CONSULTANT';
  counterparty_name: string;
  contract_status: 'DRAFT' | 'PENDING_SIGN' | 'SIGNED' | 'ACTIVATED' | 'COMPLETED' | 'TERMINATED';
  signed_date?: string;
  total_amount: number;
  payment_milestones: Array<{
    name: string;
    percentage: number;
    due_date: string;
  }>;
  all_signatures_complete: boolean;
}

export interface ValidationChecklist {
  contract_signed: boolean;
  documents_received: boolean;
  tax_completed: boolean;
  milestone_achieved: boolean;
  no_blockers: boolean;
}

export interface ValidationResult {
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  checks: ValidationChecklist;
  rejection_reasons: string[];
  validation_timestamp: string;
}

export interface ApprovalRequest {
  payment_id: string;
  reviewer_id: string;
  approval_notes?: string;
}

export interface ApprovalResult {
  success: boolean;
  payment_id: string;
  new_status: string;
  audit_log_id: string;
  timestamp: string;
}

export interface AuditLogEntry {
  entity_type: string;
  entity_id: string;
  action: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'DELETED' | 'SIGNED' | 'EXECUTED';
  actor_type: 'USER' | 'AGENT' | 'SYSTEM';
  actor_id: string;
  actor_name?: string;
  change_details?: Record<string, unknown>;
  reason?: string;
}

export interface TaskLock {
  task_id: string;
  agent_id: string;
  table_names: string[];
  locked_until: string;
  lock_reason?: string;
}
