import { useState, ChangeEvent } from 'react';
import type { Project } from '../../types/database';

type ChangeEventHandler = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;

interface Props {
  initialData?: Project;
  onChange: (data: Partial<Project>) => void;
}

export default function ProjectFinancials({ initialData, onChange }: Props) {
  const [taxEstimates, setTaxEstimates] = useState<string>(
    initialData?.tax_estimates ? JSON.stringify(initialData.tax_estimates, null, 2) : ''
  );

  const handleTaxEstimatesChange: ChangeEventHandler = (e) => {
    const value = e.target.value;
    setTaxEstimates(value);
    try {
      const parsed = JSON.parse(value);
      onChange({ tax_estimates: parsed });
    } catch {
      // Invalid JSON, won't update parent
    }
  };

  return (
    <div className="space-y-6">
      {/* 预估销售 */}
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

      {/* 规划指标 */}
      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">规划指标</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              绿化率 (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="例如：30"
              value={initialData?.planning_metrics?.green_rate || ''}
              onChange={(e) => {
                const metrics = { ...initialData?.planning_metrics };
                metrics.green_rate = Number(e.target.value);
                onChange({ planning_metrics: metrics });
              }}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              容积率
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="例如：2.5"
              value={initialData?.planning_metrics?.plot_ratio || ''}
              onChange={(e) => {
                const metrics = { ...initialData?.planning_metrics };
                metrics.plot_ratio = Number(e.target.value);
                onChange({ planning_metrics: metrics });
              }}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              建筑密度 (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="例如：25"
              value={initialData?.planning_metrics?.building_density || ''}
              onChange={(e) => {
                const metrics = { ...initialData?.planning_metrics };
                metrics.building_density = Number(e.target.value);
                onChange({ planning_metrics: metrics });
              }}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              地上建筑面积 (㎡)
            </label>
            <input
              type="number"
              min="0"
              placeholder="例如：50000"
              value={initialData?.planning_metrics?.built_up_area || ''}
              onChange={(e) => {
                const metrics = { ...initialData?.planning_metrics };
                metrics.built_up_area = Number(e.target.value);
                onChange({ planning_metrics: metrics });
              }}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* 税金明细 */}
      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">税金明细</h3>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
            税金明细（JSON 格式）
          </label>
          <textarea
            value={taxEstimates}
            onChange={handleTaxEstimatesChange}
            placeholder='{"vAT": 100000, "income_tax": 50000, "city_maintenance": 30000, "education_surcharge": 10000}'
            rows={6}
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-xs font-mono"
          />
        </div>
      </div>

      {/* 费用汇总 */}
      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">费用汇总</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: '管理费用', value: initialData?.management_fee || 0 },
            { label: '营销费用', value: initialData?.marketing_expense || 0 },
            { label: '销售佣金', value: initialData?.sales_commission || 0 },
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
                value={item.value}
                onChange={(e) => {
                  const field = item.label === '管理费用' ? 'management_fee' : item.label === '营销费用' ? 'marketing_expense' : 'sales_commission';
                  onChange({ [field]: Number(e.target.value) || null });
                }}
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm font-mono"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
