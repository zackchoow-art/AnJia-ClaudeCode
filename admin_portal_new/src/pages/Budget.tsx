import { useState } from 'react';
import {
  Plus,
  Landmark,
  TrendingUp,
  PieChart,
  Search,
  Filter,
  MoreHorizontal,
} from 'lucide-react';
import { mockBudgets, formatCurrency } from '../utils/api';

export default function Budget() {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState('所有类别');

  const categoryConfig: Record<string, { color: string; text: string }> = {
    LAND: { color: 'text-primary bg-primary/10 border-primary/20', text: '土地成本' },
    CONSTRUCTION: { color: 'text-secondary bg-secondary/10 border-secondary/20', text: '建安成本' },
    SALES: { color: 'text-warning bg-warning/10 border-warning/20', text: '营销费用' },
    TAX: { color: 'text-error bg-error/10 border-error/20', text: '税费' },
    OVERHEAD: { color: 'text-success bg-success/10 border-success/20', text: '管理费用' },
  };

  const statusConfig: Record<string, { color: string; text: string }> = {
    APPROVED: { color: 'bg-success/10 border-success/20 text-success', text: '已审批' },
    PENDING: { color: 'bg-warning/10 border-warning/20 text-warning', text: '待审批' },
    REVISED: { color: 'bg-primary/10 border-primary/20 text-primary', text: '已调整' },
  };

  const filteredBudgets = mockBudgets.filter((b) => {
    const matchesSearch =
      b.subcategory.includes(searchText);
    const matchesStatus =
      filterStatus === '' || b.budget_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalBudgeted = mockBudgets.reduce((sum, b) => sum + b.budgeted_amount, 0);
  const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const remaining = totalBudgeted - totalSpent;

  // Stats
  const stats = [
    { label: '预算总额', value: formatCurrency(totalBudgeted), trend: '本年度分配' },
    { label: '已支出', value: formatCurrency(totalSpent), trend: `${((totalSpent / totalBudgeted) * 100).toFixed(1)}% 使用率` },
    { label: '剩余预算', value: formatCurrency(remaining), trend: '可用于后续审批' },
    { label: '执行差异', value: `-${formatCurrency(totalSpent - totalBudgeted * 0.8)}`, trend: '需关注成本超支', isAlert: true },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'LAND': return { color: '#3b82f6', bg: 'blue' };
      case 'CONSTRUCTION': return { color: '#a855f7', bg: 'purple' };
      case 'SALES': return { color: '#f59e0b', bg: 'yellow' };
      case 'TAX': return { color: '#ef4444', bg: 'red' };
      default: return { color: '#10b981', bg: 'green' };
    }
  };

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">预算成本管理</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight">预算列表</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 text-on-surface rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建预算
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`glass-panel rounded-xl p-5 hover:border-primary/30 transition-all relative overflow-hidden group ${stat.isAlert ? 'border-l-4 border-error' : 'border-l-4 border-primary'}`}>
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</p>
              {index === 0 && <Landmark className="w-5 h-5 text-primary opacity-20" />}
            </div>
            <h3 className={`text-3xl font-bold mt-3 ${stat.isAlert ? 'text-error' : 'text-on-surface'} tracking-tighter`}>{stat.value}</h3>
            <p className="text-sm text-on-surface-variant mt-2">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="glass-panel rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            成本结构分析
          </h3>
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider">2024年度</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Donut Chart Simulation */}
          <div className="relative w-64 h-64 mx-auto md:mx-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background Circle */}
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="4" opacity="0.1"></circle>
              {/* Segments */}
              <circle
                cx="18" cy="18" r="15.9155"
                fill="none" stroke="#3b82f6" strokeWidth="4"
                strokeDasharray={`${((mockBudgets.filter(b => b.cost_category === 'LAND').reduce((sum, b) => sum + b.budgeted_amount, 0)) / totalBudgeted) * 100}, 100`}
              ></circle>
              <circle
                cx="18" cy="18" r="15.9155"
                fill="none" stroke="#a855f7" strokeWidth="4"
                strokeDasharray={`${((mockBudgets.filter(b => b.cost_category === 'CONSTRUCTION').reduce((sum, b) => sum + b.budgeted_amount, 0)) / totalBudgeted) * 100}, 100`}
                transform="rotate(25)"
              ></circle>
              <circle
                cx="18" cy="18" r="15.9155"
                fill="none" stroke="#f59e0b" strokeWidth="4"
                strokeDasharray={`${((mockBudgets.filter(b => b.cost_category === 'SALES').reduce((sum, b) => sum + b.budgeted_amount, 0)) / totalBudgeted) * 100}, 100`}
                transform="rotate(65)"
              ></circle>
              <circle
                cx="18" cy="18" r="15.9155"
                fill="none" stroke="#ef4444" strokeWidth="4"
                strokeDasharray={`${((mockBudgets.filter(b => b.cost_category === 'TAX').reduce((sum, b) => sum + b.budgeted_amount, 0)) / totalBudgeted) * 100}, 100`}
                transform="rotate(95)"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="block text-3xl font-bold text-on-surface">5</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider">Cost Centers</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-4">
            {['LAND', 'CONSTRUCTION', 'SALES', 'TAX', 'OVERHEAD'].map((cat) => {
              const budget = mockBudgets.filter(b => b.cost_category === cat).reduce((sum, b) => sum + b.budgeted_amount, 0);
              const percentage = ((budget / totalBudgeted) * 100).toFixed(1);
              return (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${cat === 'LAND' ? 'bg-blue-500' : cat === 'CONSTRUCTION' ? 'bg-purple-500' : cat === 'SALES' ? 'bg-yellow-500' : cat === 'TAX' ? 'bg-red-500' : 'bg-green-500'}`}
                    ></div>
                    <span className="text-sm text-on-surface capitalize">{cat.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-medium text-on-surface block">{percentage}%</span>
                    <span className="text-[10px] text-on-surface-variant">{formatCurrency(budget)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="flex flex-col justify-center">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
              <p className="text-sm text-on-surface-variant">总预算执行情况</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-primary font-bold">已用资金</span>
                  <span className="font-mono">{((totalSpent / totalBudgeted) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-success transition-all duration-1000"
                    style={{ width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                当前预算使用率正常，剩余资金可用于 Q3-Q4 支出。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Table */}
      <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
        <Landmark className="w-5 h-5 text-primary" />
        预算详情
      </h3>
      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        {/* Filters */}
        <div className="p-4 border-b border-white/10 bg-surface-container/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="搜索子分类..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-on-surface focus:outline-none focus:border-primary min-w-[160px]"
          >
            <option value="">全部状态</option>
            {Object.entries(statusConfig).map(([value, cfg]) => (
              <option key={value} value={value}>{cfg.text}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">成本类别</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">子分类</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">预算金额</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">已支出</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">执行率</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredBudgets.map((budget) => {
              const catConfig = getCategoryColor(budget.cost_category);
              const usage = (budget.spent_amount / budget.budgeted_amount) * 100;
              let progressColor = 'bg-success';
              if (usage > 80) progressColor = 'bg-warning';
              if (usage > 95) progressColor = 'bg-error';

              return (
                <tr key={budget.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded border ${categoryConfig[budget.cost_category] || 'bg-outline/10 text-on-surface'}`}>
                      {budget.cost_category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-on-surface">{budget.subcategory}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">ID: {budget.id}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-on-surface">{formatCurrency(budget.budgeted_amount)}</td>
                  <td className="px-6 py-4 font-mono text-sm">
                    <span className={usage > 90 ? 'text-error' : 'text-on-surface'}>{formatCurrency(budget.spent_amount)}</span>
                  </td>
                  <td className="px-6 py-4 w-32">
                    <div className="space-y-1.5">
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${progressColor} transition-all duration-500`}
                          style={{ width: `${Math.min(usage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-mono">{usage.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const cfg = statusConfig[budget.budget_status];
                      return cfg ? <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${cfg.color}`}>{cfg.text}</span> : null;
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/10 bg-surface-container/50 flex justify-between items-center">
          <p className="text-xs text-on-surface-variant">显示 {filteredBudgets.length} 条预算记录</p>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 rounded-lg text-sm text-on-surface-variant opacity-50 cursor-not-allowed">上一页</button>
            <span className="text-xs font-bold text-primary">1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
