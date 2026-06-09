import { Customer, Project, Contract, Payment, CostBudget, AuditLog } from '../types';

// Mock Data Generators
const generateId = (prefix: string) => `ID${Math.random().toString(36).substr(2, 9)}`;

// Mock Customers
export const mockCustomers: Customer[] = Array.from({ length: 25 }).map((_, i) => ({
  id: generateId('CUST'),
  project_id: 'PRJ001',
  customer_name: ['张三', '李四', '王五', '赵六', '孙七'][i % 5] + (i > 4 ? i : ''),
  customer_phone: `138${Math.random().toString(11).slice(2, 11)}`,
  customer_id_number: `11010119900101${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}${i % 2 === 0 ? 'X' : Math.floor(Math.random() * 9)}`,
  customer_type: ['INDIVIDUAL', 'COMPANY'][i % 2] as any,
  sales_agent_id: `AGENT${Math.floor(i / 5) + 100}`,
  sales_agent_name: `销售${['A', 'B', 'C', 'D', 'E'][Math.floor(i / 5)]}`,
  customer_status: (['POTENTIAL', 'INTERESTED', 'NEGOTIATING', 'SIGNED', 'CANCELLED'][i % 5] as any),
  interested_property_type: ['住宅', '商铺', '公寓'][i % 3],
  budget_range_min: 200000 + i * 10000,
  budget_range_max: 500000 + i * 10000,
  notes: `客户备注${i}`,
  commitments_made: [
    {
      date: '2025-06-01',
      content: '承诺学区房',
      made_by: '销售A',
      recorded_by: '系统',
    },
  ],
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

// Mock Projects
export const mockProjects: Project[] = Array.from({ length: 15 }).map((_, i) => ({
  id: generateId('PRJ'),
  project_name: ['A地块住宅项目', 'B地块商业配套', 'C地块景观工程', 'D地块办公大楼'][i % 4],
  location: [
    '北京市朝阳区建国路88号',
    '上海市浦东新区世纪大道100号',
    '深圳市南山区科技园科苑路1号',
    '广州市天河区珠江新城华强路2号',
  ][i % 4],
  developer_name: ['万科地产', '碧桂园', '恒大集团', '融创中国'][i % 4],
  project_status: (['PLANNING', 'IN_PROGRESS', 'COMPLETED'][i % 3] as any),
  start_date: `202${2 + Math.floor(i / 5)}-01-15`,
  expected_completion: `202${4 + Math.floor(i / 5)}-12-31`,
  total_land_area: 50000 + i * 10000,
  total_built_area: 120000 + i * 20000,
  total_budget: 100000000 + i * 50000000,
  tax_planning_baseline: 8000000 + i * 4000000,
  actual_tax_amount: 7500000 + i * 3500000,
  created_at: new Date(Date.now() - i * 86400000 * 15).toISOString(),
}));

// Mock Contracts
export const mockContracts: Contract[] = Array.from({ length: 20 }).map((_, i) => ({
  id: generateId('CTR'),
  project_id: 'PRJ001',
  customer_id: `CUST${100 + (i % 5)}`,
  contract_code: `HT202506${(i % 30).toString().padStart(2, '0')}-${(i % 7) + 1}`,
  contract_name: ['幕墙分包合同', '景观设计合同', '机电安装合同', '精装修施工合同', '消防工程合同'][i % 5],
  contract_type: (['SUPPLIER', 'CONTRACTOR', 'SALES', 'CONSULTANT'][i % 4] as any),
  counterparty_name: ['XX建设工程公司', 'XX设计院', 'XX建材供应商', 'XX装饰工程公司', 'XX消防科技公司'][i % 5],
  counterparty_id: generateId('ENT'),
  contract_status: (['DRAFT', 'PENDING_SIGN', 'SIGNED', 'ACTIVATED', 'COMPLETED', 'TERMINATED'][i % 6] as any),
  draft_date: `2025-05-${(i % 28) + 1}`,
  signed_date: i > 3 ? `2025-06-${((i - 3) % 28) + 1}` : undefined,
  activated_date: i > 5 ? `2025-06-${((i - 5) % 28) + 1}` : undefined,
  completion_date: i > 10 ? `2025-12-${((i - 10) % 28) + 1}` : undefined,
  total_amount: [8500000, 1200000, 3500000, 4200000, 2800000][i % 5],
  currency: 'CNY',
  payment_milestones: [
    { name: '预付款', percentage: 10, due_date: '2025-06-30' },
    { name: '进度款', percentage: 40, due_date: '2025-09-30' },
    { name: '竣工款', percentage: 40, due_date: '2025-12-31' },
    { name: '质保金', percentage: 10, due_date: '2026-06-30' },
  ],
  key_terms_json: {
    payment_method: '银行转账',
    tax_rate: 0.09,
    penalty_rate: 0.0005,
  },
  signatory_list: {
    party_a: '张三',
    party_b: `合作方${i % 5 + 1}`,
  },
  all_signatures_complete: i % 3 !== 0,
  sales_agent_id: undefined,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

// Mock Payments
export const mockPayments: Payment[] = Array.from({ length: 30 }).map((_, i) => ({
  id: generateId('PAY'),
  project_id: 'PRJ001',
  contract_id: `CTR${100 + (i % 10)}`,
  payment_code: `PY202506${(i % 30).toString().padStart(2, '0')}-${(i % 5) + 1}`,
  payment_amount: [2500000, 1800000, 950000, 3200000, 1500000][i % 5],
  payment_currency: 'CNY',
  payment_date: `2025-06-${(i % 28) + 1}`,
  payment_status: (['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED'][i % 5] as any),
  approval_checklist: {
    contract_signed: i % 3 !== 0,
    documents_received: i % 4 !== 0,
    tax_completed: i % 2 === 0,
    milestone_achieved: i % 6 !== 0,
    no_blockers: true,
  },
  approval_checklist_completed_at: i % 5 === 0 ? `2025-06-${(i % 28) + 1}T14:30:00` : undefined,
  reviewed_by: i > 5 ? `USER${Math.floor(i / 3) + 100}` : undefined,
  reviewed_at: i > 5 && i % 5 !== 0 ? `2025-06-${(i % 28) + 1}T16:30:00` : undefined,
  approval_notes: i % 7 === 0 ? '请财务复核金额是否正确' : undefined,
  rejection_reason: i % 9 === 0 ? '缺少发票复印件' : undefined,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

// Mock Budgets
export const mockBudgets: CostBudget[] = [
  {
    id: generateId('BGT'),
    project_id: 'PRJ001',
    cost_category: 'LAND' as any,
    subcategory: '土地出让金',
    budgeted_amount: 500000000,
    spent_amount: 480000000,
    budget_status: 'APPROVED' as any,
    created_at: '2025-01-01',
  },
  {
    id: generateId('BGT'),
    project_id: 'PRJ001',
    cost_category: 'CONSTRUCTION' as any,
    subcategory: '土建工程',
    budgeted_amount: 800000000,
    spent_amount: 650000000,
    budget_status: 'APPROVED' as any,
    created_at: '2025-01-01',
  },
  {
    id: generateId('BGT'),
    project_id: 'PRJ001',
    cost_category: 'SALES' as any,
    subcategory: '营销费用',
    budgeted_amount: 150000000,
    spent_amount: 98000000,
    budget_status: 'APPROVED' as any,
    created_at: '2025-01-01',
  },
  {
    id: generateId('BGT'),
    project_id: 'PRJ001',
    cost_category: 'TAX' as any,
    subcategory: '税费支出',
    budgeted_amount: 200000000,
    spent_amount: 150000000,
    budget_status: 'APPROVED' as any,
    created_at: '2025-01-01',
  },
  {
    id: generateId('BGT'),
    project_id: 'PRJ001',
    cost_category: 'OVERHEAD' as any,
    subcategory: '管理费用',
    budgeted_amount: 80000000,
    spent_amount: 65000000,
    budget_status: 'PENDING' as any,
    created_at: '2025-01-01',
  },
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = Array.from({ length: 50 }).map((_, i) => ({
  id: generateId('LOG'),
  entity_type: (['payment', 'contract', 'customer', 'project', 'cost_budget'][i % 5] as any),
  entity_id: `ID${1000 + (i % 100)}`,
  action: (['CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'SIGNED', 'EXECUTED', 'DELETED'][i % 7] as any),
  actor_type: (['USER', 'AGENT', 'SYSTEM'][i % 3] as any),
  actor_id: i > 5 ? `USR${Math.floor(i / 3) + 100}` : undefined,
  actor_name: ['张三', '李四', '王五', '系统自动处理'][i % 4],
  reason: i % 7 === 0 ? '符合审批流程要求' : undefined,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
}));

// Helper functions
export const formatCurrency = (amount: number, currency: string = 'CNY'): string => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN');
};
