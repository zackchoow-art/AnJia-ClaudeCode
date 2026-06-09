import { useState } from 'react';
import type { Project } from '../../types/database';

interface Props {
  initialData?: Project;
  onChange: (data: Partial<Project>) => void;
}

export default function ProjectFinancials({ initialData, onChange }: Props) {
  // Tax types state (can be edited by user)
  const [taxTypes, setTaxTypes] = useState<{ id: string; name_zh: string; name_en: string; rate: number | null; amount: number; remark: string }[]>(() => {
    // Initialize from initialData.tax_estimates if exists
    if (initialData?.tax_estimates) {
      return Object.entries(initialData.tax_estimates).map(([key, value]) => ({
        id: key,
        name_zh: key, // Use key as name for now
        name_en: key,
        rate: null,
        amount: value,
        remark: '',
      }));
    }
    return [
      { id: 'vAT', name_zh: '增值税', name_en: 'VAT', rate: 9, amount: 0, remark: '' },
      { id: 'income_tax', name_zh: '所得税', name_en: 'Income Tax', rate: 25, amount: 0, remark: '' },
      { id: 'city_maintenance', name_zh: '城市维护建设税', name_en: 'City Maintenance', rate: 7, amount: 0, remark: '' },
      { id: 'education_surcharge', name_zh: '教育费附加', name_en: 'Education Surcharge', rate: 3, amount: 0, remark: '' },
    ];
  });

  // Expense items state (can be edited by user)
  const [expenseItems, setExpenseItems] = useState<{ id: string; name_zh: string; name_en: string; amount: number; remark: string }[]>(() => {
    return [
      { id: 'management_fee', name_zh: '管理费用', name_en: 'Management Fee', amount: initialData?.management_fee || 0, remark: '' },
      { id: 'marketing_expense', name_zh: '营销费用', name_en: 'Marketing Expense', amount: initialData?.marketing_expense || 0, remark: '' },
      { id: 'sales_commission', name_zh: '销售佣金', name_en: 'Sales Commission', amount: initialData?.sales_commission || 0, remark: '' },
    ];
  });

  // Tax types handling
  const addTaxType = () => {
    setTaxTypes([
      ...taxTypes,
      { id: Date.now().toString(), name_zh: '', name_en: '', rate: null, amount: 0, remark: '' },
    ]);
  };

  const updateTaxType = (id: string, field: keyof typeof taxTypes[0], value: any) => {
    setTaxTypes(
      taxTypes.map((tax) =>
        tax.id === id ? { ...tax, [field]: value } : tax
      )
    );
  };

  const removeTaxType = (id: string) => {
    setTaxTypes(taxTypes.filter((t) => t.id !== id));
  };

  // Calculate total tax
  const totalTax = taxTypes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Expense items handling
  const addExpenseItem = () => {
    setExpenseItems([
      ...expenseItems,
      { id: Date.now().toString(), name_zh: '', name_en: '', amount: 0, remark: '' },
    ]);
  };

  const updateExpenseItem = (id: string, field: keyof typeof expenseItems[0], value: any) => {
    setExpenseItems(
      expenseItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeExpenseItem = (id: string) => {
    setExpenseItems(expenseItems.filter((i) => i.id !== id));
  };

  // Calculate total expenses
  const totalExpenses = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Update parent when expense items change
  const updateParentExpense = () => {
    // Find and update management_fee, marketing_expense, sales_commission in parent
    const updatedData: Partial<Project> = {};

    expenseItems.forEach((item) => {
      if (item.id === 'management_fee') updatedData.management_fee = item.amount || 0;
      if (item.id === 'marketing_expense') updatedData.marketing_expense = item.amount || 0;
      if (item.id === 'sales_commission') updatedData.sales_commission = item.amount || 0;
    });

    if (Object.keys(updatedData).length > 0) {
      onChange(updatedData);
    }
  };

  // Update tax estimates in parent
  const updateTaxEstimates = () => {
    const taxEstimates: Record<string, number> = {};
    taxTypes.forEach((tax) => {
      if (tax.amount && tax.amount > 0) {
        taxEstimates[tax.id] = tax.amount;
      }
    });
    onChange({ tax_estimates: taxEstimates });
  };

  return (
    <div className="space-y-6">
      {/* 预估销售总额 */}
      <div className="p-5 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
        <label className="block text-sm font-bold text-on-surface mb-3">预估销售总额</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface/50 font-serif">¥</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="请输入预估销售总额（元）"
            value={initialData?.estimated_sales || ''}
            onChange={(e) => onChange({ estimated_sales: Number(e.target.value) || null })}
            className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-xl font-mono font-bold text-on-surface"
          />
        </div>
        <p className="text-xs text-on-surface-variant mt-3">
          * 此处填写项目的整体预估销售金额，可用于与成本预算对比计算预期利润率
        </p>
      </div>

      {/* 规划指标 - 已移动到基本信息页，这里仅显示摘要 */}
      {initialData?.planning_metrics && (
        <div className="border-t border-outline-variant/30 pt-6">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">规划指标</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {initialData.planning_metrics.green_rate && (
              <div className="p-3 bg-surface/50 rounded-lg border border-outline-variant/20">
                <span className="text-xs text-on-surface-variant block">绿化率</span>
                <span className="font-bold text-on-surface">{initialData.planning_metrics.green_rate}%</span>
              </div>
            )}
            {initialData.planning_metrics.plot_ratio && (
              <div className="p-3 bg-surface/50 rounded-lg border border-outline-variant/20">
                <span className="text-xs text-on-surface-variant block">容积率</span>
                <span className="font-bold text-on-surface">{initialData.planning_metrics.plot_ratio}</span>
              </div>
            )}
            {initialData.planning_metrics.building_density && (
              <div className="p-3 bg-surface/50 rounded-lg border border-outline-variant/20">
                <span className="text-xs text-on-surface-variant block">建筑密度</span>
                <span className="font-bold text-on-surface">{initialData.planning_metrics.building_density}%</span>
              </div>
            )}
            {initialData.planning_metrics.built_up_area && (
              <div className="p-3 bg-surface/50 rounded-lg border border-outline-variant/20">
                <span className="text-xs text-on-surface-variant block">建筑面积</span>
                <span className="font-bold text-on-surface">{initialData.planning_metrics.built_up_area} ㎡</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 税金明细 - 可维护的税种列表 */}
      <div className="border-t border-outline-variant/30 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">税金明细</h3>
          <button
            onClick={addTaxType}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            添加税种
          </button>
        </div>

        <div className="space-y-3">
          {taxTypes.map((tax, index) => (
            <div
              key={tax.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-surface/50 rounded-lg border border-outline-variant/20"
            >
              {/* 税种名称 */}
              <div className="md:col-span-3">
                <input
                  type="text"
                  placeholder="税种名称（中文）"
                  value={tax.name_zh}
                  onChange={(e) => updateTaxType(tax.id, 'name_zh', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 英文名称 */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Tax Name (EN)"
                  value={tax.name_en}
                  onChange={(e) => updateTaxType(tax.id, 'name_en', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 税率 */}
              <div className="md:col-span-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="税率 (%)"
                  value={tax.rate || ''}
                  onChange={(e) => updateTaxType(tax.id, 'rate', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 预估金额 */}
              <div className="md:col-span-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="预估金额（元）"
                  value={tax.amount || ''}
                  onChange={(e) => updateTaxType(tax.id, 'amount', Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm font-mono"
                />
              </div>

              {/* 备注 */}
              <div className="md:col-span-1">
                <input
                  type="text"
                  placeholder="备注"
                  value={tax.remark || ''}
                  onChange={(e) => updateTaxType(tax.id, 'remark', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 删除按钮 */}
              <div className="md:col-span-1 flex items-center justify-end">
                {taxTypes.length > 1 && (
                  <button
                    onClick={() => removeTaxType(tax.id)}
                    className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 税金总额 */}
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100 mt-4">
          <span className="text-sm font-medium text-on-surface">税金总额</span>
          <span className="text-xl font-bold text-red-600 font-mono">
            ¥{(totalTax || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 费用汇总 - 可维护的费用项列表 */}
      <div className="border-t border-outline-variant/30 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">费用汇总</h3>
          <button
            onClick={addExpenseItem}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            添加费用项
          </button>
        </div>

        <div className="space-y-3">
          {expenseItems.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-surface/50 rounded-lg border border-outline-variant/20"
            >
              {/* 费用名称 */}
              <div className="md:col-span-3">
                <input
                  type="text"
                  placeholder="费用名称（中文）"
                  value={item.name_zh}
                  onChange={(e) => updateExpenseItem(item.id, 'name_zh', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 英文名称 */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Expense Name (EN)"
                  value={item.name_en}
                  onChange={(e) => updateExpenseItem(item.id, 'name_en', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 金额 */}
              <div className="md:col-span-4">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="金额（元）"
                  value={item.amount || ''}
                  onChange={(e) => {
                    updateExpenseItem(item.id, 'amount', Number(e.target.value) || 0);
                    // Update parent when amount changes
                    if (item.id === 'management_fee') onChange({ management_fee: Number(e.target.value) || 0 });
                    if (item.id === 'marketing_expense') onChange({ marketing_expense: Number(e.target.value) || 0 });
                    if (item.id === 'sales_commission') onChange({ sales_commission: Number(e.target.value) || 0 });
                  }}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm font-mono"
                />
              </div>

              {/* 备注 */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="备注（可选）"
                  value={item.remark || ''}
                  onChange={(e) => updateExpenseItem(item.id, 'remark', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 删除按钮 */}
              <div className="md:col-span-1 flex items-center justify-end">
                {expenseItems.length > 1 && (
                  <button
                    onClick={() => removeExpenseItem(item.id)}
                    className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 费用总额 */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 mt-4">
          <span className="text-sm font-medium text-on-surface">费用总额</span>
          <span className="text-xl font-bold text-blue-600 font-mono">
            ¥{(totalExpenses || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
