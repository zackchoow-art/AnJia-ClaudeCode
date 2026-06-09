import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import type { Project, CostBudget, CostCategory } from '../../types/database';

interface Props {
  initialData?: Project;
  projectId?: string;
  onChange: (data: Partial<Project>) => void;
}

// 默认成本分类
const DEFAULT_COST_CATEGORIES = [
  { code: 'LAND', name_zh: '土地成本', name_en: 'Land Cost' },
  { code: 'CONSTRUCTION', name_zh: '建安成本', name_en: 'Construction' },
  { code: 'SALES', name_zh: '销售费用', name_en: 'Sales' },
  { code: 'TAX', name_zh: '税金支出', name_en: 'Tax' },
  { code: 'OVERHEAD', name_zh: '管理费用', name_en: 'Overhead' },
  { code: 'MARKETING', name_zh: '营销费用', name_en: 'Marketing' },
  { code: 'FINANCING', name_zh: '融资成本', name_en: 'Financing' },
];

export default function ProjectCostBudget({ initialData, projectId, onChange }: Props) {
  const [costs, setCosts] = useState<Partial<CostBudget>[]>(() => {
    return DEFAULT_COST_CATEGORIES.map((cat) => ({
      cost_category: cat.code,
      subcategory: '',
      budgeted_amount: 0,
      remark: '',
    }));
  });

  // Cost categories state (for custom categories)
  const [costCategories, setCostCategories] = useState<Partial<CostCategory>[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Load cost categories on mount
  useEffect(() => {
    if (projectId) {
      loadCostCategories();
    }
  }, [projectId]);

  const loadCostCategories = async () => {
    try {
      // TODO: Fetch from API
      // const { data } = await supabase
      //   .from('cost_categories')
      //   .select('*')
      //   .eq('project_id', projectId);
      // setCostCategories(data || []);
    } catch (error) {
      console.error('Error loading cost categories:', error);
    }
  };

  const totalBudgeted = costs.reduce((sum, c) => sum + (Number(c.budgeted_amount) || 0), 0);

  // 处理分类变更
  const handleCategoryChange = (index: number, category: string) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], cost_category: category };
    setCosts(newCosts);
  };

  // 处理子分类变更
  const handleSubcategoryChange = (index: number, value: string) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], subcategory: value };
    setCosts(newCosts);
  };

  // 处理金额变更
  const handleAmountChange = (index: number, value: string) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], budgeted_amount: Number(value) || 0 };
    setCosts(newCosts);
  };

  // 处理备注变更
  const handleRemarkChange = (index: number, value: string) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], remark: value };
    setCosts(newCosts);
  };

  // 添加成本项
  const addCostItem = () => {
    setCosts([...costs, { cost_category: 'OVERHEAD', subcategory: '', budgeted_amount: 0, remark: '' }]);
  };

  // 删除成本项（至少保留一项）
  const removeCostItem = (index: number) => {
    if (costs.length <= 1) return;
    const newCosts = [...costs];
    newCosts.splice(index, 1);
    setCosts(newCosts);
  };

  // 预计费用处理
  const handleExpenseChange = (field: keyof Project, value: number | null) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* 成本预算明细 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">成本预算明细</h3>
          <button
            onClick={addCostItem}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加成本项
          </button>
        </div>

        <div className="space-y-3">
          {costs.map((cost, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-surface/50 rounded-lg border border-outline-variant/20"
            >
              {/* 分类选择 */}
              <div className="md:col-span-3">
                <select
                  value={cost.cost_category || ''}
                  onChange={(e) => handleCategoryChange(index, e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                >
                  {DEFAULT_COST_CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.name_zh}
                    </option>
                  ))}
                </select>
              </div>

              {/* 子分类输入 */}
              <div className="md:col-span-3">
                <input
                  type="text"
                  placeholder="子分类名称（例如：结构工程、二次结构等）"
                  value={cost.subcategory || ''}
                  onChange={(e) => handleSubcategoryChange(index, e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 预算金额 */}
              <div className="md:col-span-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="预算金额（元）"
                  value={cost.budgeted_amount || ''}
                  onChange={(e) => handleAmountChange(index, e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm font-mono"
                />
              </div>

              {/* 备注 */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="备注（可选）"
                  value={cost.remark || ''}
                  onChange={(e) => handleRemarkChange(index, e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 删除按钮 */}
              <div className="md:col-span-1 flex items-center justify-end">
                {costs.length > 1 && (
                  <button
                    onClick={() => removeCostItem(index)}
                    className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除该项"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 预算总计 */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10 mt-4">
          <span className="text-sm font-medium text-on-surface">预算总额</span>
          <span className="text-xl font-bold text-primary font-mono">
            ¥{(totalBudgeted || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 预计费用 */}
      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">预计费用</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: '管理费用',
              value: initialData?.management_fee || 0,
              field: 'management_fee' as keyof Project,
              desc: '项目管理相关支出',
            },
            {
              label: '营销费用',
              value: initialData?.marketing_expense || 0,
              field: 'marketing_expense' as keyof Project,
              desc: '广告宣传、展示中心等',
            },
            {
              label: '销售佣金',
              value: initialData?.sales_commission || 0,
              field: 'sales_commission' as keyof Project,
              desc: '销售渠道佣金支出',
            },
          ].map((item, index) => (
            <div key={index} className="p-4 bg-surface/50 rounded-lg border border-outline-variant/20 space-y-3">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide">
                  {item.label}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={initialData?.[item.field] || ''}
                  onChange={(e) => handleExpenseChange(item.field, Number(e.target.value) || null)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm font-mono"
                />
              </div>
              <p className="text-xs text-on-surface-variant">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 成本分类管理 */}
      <div className="border-t border-outline-variant/30 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">成本分类管理</h3>
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            {showCategoryManager ? '收起分类管理' : '管理成本分类'}
          </button>
        </div>

        {showCategoryManager && (
          <div className="p-4 bg-surface/50 rounded-lg border border-outline-variant/20">
            <p className="text-sm text-on-surface-variant mb-3">
              管理成本分类模板。系统预设分类不可删除，但可以修改名称和备注。
            </p>
            <div className="space-y-2">
              {/* TODO: Implement category management UI */}
              <div className="text-center py-8 text-on-surface-variant/50">
                分类管理功能开发中...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 预估税金（保留但简化） */}
      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">预估税金</h3>
        <div className="p-4 bg-surface/50 rounded-lg border border-outline-variant/20">
          <label className="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wide">
            税金明细（JSON格式）
          </label>
          <textarea
            placeholder='{"vAT": 100000, "income_tax": 50000, "city_maintenance": 30000}'
            rows={4}
            defaultValue={
              initialData?.tax_estimates ? JSON.stringify(initialData.tax_estimates, null, 2) : ''
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange({ tax_estimates: parsed });
              } catch {
                // Invalid JSON
              }
            }}
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-xs font-mono"
          />
          <p className="text-xs text-on-surface-variant mt-2">
            请输入税金明细的 JSON 格式数据，例如：{"{"}"vAT": 100000, "income_tax": 50000{"}"}
          </p>
        </div>
      </div>
    </div>
  );
}
