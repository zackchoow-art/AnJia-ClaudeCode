import { useState } from 'react';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import type { Project, CostBudget } from '../../types/database';

interface Props {
  initialData?: Project;
  projectId?: string;
}

const COST_CATEGORIES = [
  { value: 'LAND', label: '土地成本', labelEn: 'Land Cost' },
  { value: 'CONSTRUCTION', label: '建安成本', labelEn: 'Construction' },
  { value: 'SALES', label: '销售费用', labelEn: 'Sales' },
  { value: 'TAX', label: '税金支出', labelEn: 'Tax' },
  { value: 'OVERHEAD', label: '管理费用', labelEn: 'Overhead' },
  { value: 'MARKETING', label: '营销费用', labelEn: 'Marketing' },
  { value: 'FINANCING', label: '融资成本', labelEn: 'Financing' },
];

export default function ProjectCostBudget({ initialData, projectId }: Props) {
  const [costs, setCosts] = useState<Partial<CostBudget>[]>(() => {
    // 初始化一些默认数据
    return COST_CATEGORIES.map((cat) => ({
      cost_category: cat.value,
      subcategory: '',
      budgeted_amount: 0,
    }));
  });

  const totalBudgeted = costs.reduce((sum, c) => sum + (Number(c.budgeted_amount) || 0), 0);

  const handleCategoryChange = (index: number, category: string) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], cost_category: category };
    setCosts(newCosts);
  };

  const handleSubcategoryChange = (index: number, value: string) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], subcategory: value };
    setCosts(newCosts);
  };

  const handleAmountChange = (index: number, value: string) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], budgeted_amount: Number(value) || 0 };
    setCosts(newCosts);
  };

  const addCostItem = () => {
    setCosts([...costs, { cost_category: 'OVERHEAD', subcategory: '', budgeted_amount: 0 }]);
  };

  const removeCostItem = (index: number) => {
    if (costs.length <= 1) return;
    const newCosts = [...costs];
    newCosts.splice(index, 1);
    setCosts(newCosts);
  };

  // 计算费用分类汇总
  const getExpenseSummary = () => {
    const managementFee = initialData?.management_fee || 0;
    const marketingExpense = initialData?.marketing_expense || 0;
    const salesCommission = initialData?.sales_commission || 0;

    return [
      { label: '管理费用', value: managementFee, color: 'bg-blue-500/20 text-blue-600' },
      { label: '营销费用', value: marketingExpense, color: 'bg-green-500/20 text-green-600' },
      { label: '销售佣金', value: salesCommission, color: 'bg-purple-500/20 text-purple-600' },
    ];
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
                  {COST_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 子分类输入 */}
              <div className="md:col-span-4">
                <input
                  type="text"
                  placeholder="子分类名称（例如：结构工程、二次结构等）"
                  value={cost.subcategory || ''}
                  onChange={(e) => handleSubcategoryChange(index, e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 预算金额 */}
              <div className="md:col-span-4">
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

      {/* 三项费用 */}
      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">预计费用</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: '管理费用',
              value: initialData?.management_fee || 0,
              desc: '项目管理相关支出',
            },
            {
              label: '营销费用',
              value: initialData?.marketing_expense || 0,
              desc: '广告宣传、展示中心等',
            },
            {
              label: '销售佣金',
              value: initialData?.sales_commission || 0,
              desc: '销售渠道佣金支出',
            },
          ].map((item, index) => (
            <div key={index} className="p-4 bg-surface/50 rounded-lg border border-outline-variant/20">
              <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wide">
                {item.label}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={initialData?.[Object.keys(initialData || {}).find((k) => item.label.includes(k)) as keyof Project] || ''}
                onChange={(e) =>
                  console.log('Change handled in parent component')
                }
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm font-mono"
              />
              <p className="text-xs text-on-surface-variant mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 预估税金 */}
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
            onChange={(e) => console.log('Tax estimates change handled in parent')}
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
