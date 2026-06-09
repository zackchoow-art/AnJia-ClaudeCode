// Database models matching Supabase schema

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
  tax_planning_completed_at: string | null;

  // Phase 3 新增字段 - 基础信息
  planning_scheme: string | null;        // 规划方案（文本）
  design_scheme: string | null;          // 设计方案（文本）
  estimated_sales: number | null;        // 预估销售总额

  // Phase 3 新增字段 - 时间节点
  land_acquisition_date: string | null;      // 拿地时间
  commencement_date: string | null;          // 动工时间
  pre_sale_date: string | null;              // 预售时间
  main_capping_date: string | null;          // 主体封顶时间
  main_acceptance_date: string | null;       // 主体验收时间
  delivery_date: string | null;              // 交房时间

  // Phase 3 新增字段 - 费用类
  management_fee: number | null;             // 管理费用
  marketing_expense: number | null;          // 营销费用
  sales_commission: number | null;           // 销售佣金

  // Phase 3 新增字段 - 税金和指标 (JSONB)
  tax_estimates: Record<string, number> | null;    // 各税种明细 {vAT: 100000, income_tax: 50000}
  planning_metrics: Record<string, unknown> | null; // 各类规划指标 {green_rate: 30, plot_ratio: 2.5}

  // Phase 3 Advanced - 备注
  remarks: string | null;

  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

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
  notes: string | null;
  commitments_made: Array<{
    date: string;
    content: string;
    made_by: string;
    recorded_by: string;
  }> | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface Contract {
  id: string;
  project_id: string;
  customer_id: string | null;
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
  draft_date: string | null;
  signed_date: string | null;
  activated_date: string | null;
  completion_date: string | null;
  termination_date: string | null;
  termination_reason: string | null;
  total_amount: number;
  currency: string;
  payment_milestones: Array<{
    name: string;
    percentage: number;
    due_date: string;
  }>;
  key_terms_json: Record<string, unknown>;
  signatory_list: Array<{ name: string; role: string; signed: boolean }>;
  all_signatures_complete: boolean;
  sales_agent_id: string | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
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
  approval_checklist: {
    contract_signed: boolean;
    documents_received: boolean;
    tax_completed: boolean;
    milestone_achieved: boolean;
    no_blockers: boolean;
  };
  approval_checklist_completed_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approval_notes: string | null;
  rejection_reason: string | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

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
    | 'FINANCING';
  subcategory: string;
  budgeted_amount: number;
  spent_amount: number;
  budget_status: 'APPROVED' | 'PENDING' | 'REVISED';
  budget_approved_date: string | null;
  budget_approved_by: string | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

// CostBudgetWithTotal extends CostBudget with calculated total
export interface CostBudgetWithTotal extends CostBudget {
  total_amount: number; // budgeted + spent for display purposes
}

export interface CostLedger {
  id: string;
  project_id: string;
  cost_budget_id: string | null;
  cost_type: string;
  cost_description: string;
  cost_amount: number;
  cost_date: string;
  receipt_filename: string | null;
  receipt_hash: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  verified_by: string | null;
  verification_date: string | null;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface ApprovalGate {
  id: string;
  project_id: string;
  gate_name: string;
  gate_description: string;
  required_conditions: Record<string, unknown>;
  override_allowed: boolean;
  override_requires_approvals: string[];
  gate_status: string;
  created_by: string;
  created_at: string;
}

export interface PaymentRule {
  id: string;
  contract_id: string;
  milestone_name: string;
  milestone_description: string;
  trigger_condition_json: Record<string, unknown>;
  payment_percentage: number;
  required_documents: string[];
  min_progress_percentage: number;
  rule_status: string;
  created_by: string;
  created_at: string;
}

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
  actor_id: string;
  actor_name: string;
  change_details: Record<string, unknown>;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

export interface TaskLock {
  id: string;
  task_id: string;
  agent_id: string;
  table_names: string[];
  locked_at: string;
  locked_until: string;
  lock_reason: string;
  lock_status: 'ACTIVE' | 'RELEASED' | 'EXPIRED';
}

export interface SchemaVersion {
  id: number;
  version_number: string;
  migration_name: string;
  migration_file: string;
  executed_at: string;
  rollback_strategy: string;
  status: 'SUCCESS' | 'FAILED';
  error_message: string | null;
}

export interface WorkLog {
  id: string;
  task_id: string;
  agent_id: string;
  log_type: 'schema_change' | 'code_change' | 'review' | 'test';
  log_content: Record<string, unknown>;
  git_commit_hash: string;
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  reviewed_by: string | null;
  reviewed_at: string | null;
  committed_at: string;
}

// Phase 2新增表
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
  usable_area: number | null;
  orientation: string | null;
  list_price: number | null;
  final_price: number | null;
  price_per_sqm: number | null;
  property_status:
    | 'AVAILABLE'
    | 'RESERVED'
    | 'UNDER_CONTRACT'
    | 'SOLD'
    | 'OWNER_OCCUPIED'
    | 'UNAVAILABLE';
  customer_id: string | null;
  contract_id: string | null;
  features: string[];
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface PropertyStatusHistory {
  id: string;
  property_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changed_at: string;
  reason: string | null;
}

export interface PropertyReservation {
  id: string;
  property_id: string;
  customer_id: string;
  sales_agent_id: string;
  reservation_amount: number | null;
  reserved_at: string;
  expires_at: string | null;
  reservation_status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';
  notes: string | null;
}

export interface PropertyRecommendation {
  id: string;
  customer_id: string;
  sales_agent_id: string;
  customer_budget_min: number | null;
  customer_budget_max: number | null;
  recommended_property_ids: string[];
  recommendation_scores: Array<{
    property_id: string;
    score: number;
    reasons: string[];
  }>;
  ai_model: string | null;
  created_at: string;
}

export interface CustomerFollowup {
  id: string;
  customer_id: string;
  sales_agent_id: string;
  followup_type:
    | 'CALL'
    | 'VISIT'
    | 'WECHAT'
    | 'EMAIL'
    | 'SITE_VISIT';
  followup_content: string;
  customer_response: string | null;
  next_action: string | null;
  next_followup_date: string | null;
  intent_before: string | null;
  intent_after: string | null;
  created_at: string;
}

export interface CustomerScore {
  id: string;
  customer_id: string;
  sales_agent_id: string;
  intent_score: number; // 1-10
  score_factors: Record<string, number>;
  scored_by: 'SALES' | 'AI_SYSTEM';
  scored_at: string;
}

// ============================================================================
// Phase 3: Property Units (详细房源明细)
// ============================================================================

export interface PropertyUnit {
  id: string;
  project_id: string;

  // 唯一标识
  building_number: string;   // 栋号: "A栋"
  floor_number: number;      // 楼层
  unit_number: string;       // 单元号: "1单元"
  room_number: string;       // 户号: "101"
  property_code: string;     // 系统编号: "A-1-1-101"

  // 基本信息
  property_type: Record<string, string>;  // {"zh": "三室两厅", "ug": "3 ئۆي 2 مەيدان"}
  floor_area: number;         // 建筑面积(㎡)
  usable_area: number | null; // 套内面积(㎡)
  orientation: string | null; // 朝向

  // 定价
  list_price: number | null;
  final_price: number | null;
  price_per_sqm: number | null;

  // 状态
  property_status: 'AVAILABLE' | 'RESERVED' | 'UNDER_CONTRACT' | 'SOLD' | 'OWNER_OCCUPIED' | 'UNAVAILABLE';

  // 特征标签
  features: string[];

  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface PropertyUnitStatusHistory {
  id: string;
  property_unit_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changed_at: string;
  reason: string | null;
}

// ============================================================================
// Phase 3 Advanced: Project Documents and Custom Configurations
// ============================================================================

export interface PlanningDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DesignDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CustomTimelineEvent {
  id: string;
  project_id: string;
  name_zh: string;
  name_en: string;
  event_date: string;
  sort_order: number;
  remark: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CostCategory {
  id: string;
  project_id: string | null;
  parent_id: string | null;
  code: string;
  name_zh: string;
  name_en: string;
  is_system: boolean;
  remark: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface TaxType {
  id: string;
  project_id: string | null;
  name_zh: string;
  name_en: string;
  rate: number | null;
  amount: number;
  remark: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ExpenseItem {
  id: string;
  project_id: string | null;
  name_zh: string;
  name_en: string;
  amount: number;
  remark: string | null;
  created_at: string;
  updated_at: string | null;
}
