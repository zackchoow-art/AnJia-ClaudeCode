import { useState } from 'react';
import {
  Plus,
  TrendingUp,
  PieChart,
  Calendar,
  CheckSquare,
  Download,
} from 'lucide-react';
import { mockBudgets, formatCurrency } from '../utils/api';

export default function Finance() {
  const [timeRange, setTimeRange] = useState('This Month');

  // Payment Schedule
  const upcomingPayments = [
    {
      date: 'Oct 28',
      payee: 'General Contractor Progress Payment #14',
      vendor: 'Apex Builders Group',
      amount: 4250000,
      status: 'Scheduled',
      badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    },
    {
      date: 'Nov 05',
      payee: 'Elevator Procurement Advance',
      vendor: 'Otis Elevators',
      amount: 1800000,
      status: 'Action Required',
      badgeColor: 'bg-error/10 text-error border-error/20',
    },
    {
      date: 'Nov 12',
      payee: 'Landscape Design Retainer',
      vendor: 'GreenScape Studios',
      amount: 150000,
      status: 'Draft',
      badgeColor: 'bg-outline/10 text-on-surface-variant border-outline/20',
    },
  ];

  // Pending Approvals
  const pendingApprovals = [
    {
      code: 'EXP-992-B',
      title: 'Marketing Launch Event',
      amount: 85000,
      requester: 'Li Ming (Marketing)',
    },
    {
      code: 'EXP-994-A',
      title: 'Additional Earthwork Eq.',
      amount: 210000,
      requester: 'Zhang (Construction)',
    },
  ];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  };

  // Category breakdown
  const categoryData = [
    { name: 'Construction', value: 45, color: '#3b82f6' },
    { name: 'Land Acquisition', value: 25, color: '#a855f7' },
    { name: 'Soft Costs / Design', value: 15, color: '#06b6d4' },
    { name: 'Contingency', value: 15, color: '#64748b' },
  ];

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">财务与成本管理</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight">财务管理</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 text-on-surface rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建订单
          </button>
        </div>
      </div>

      {/* Value KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: '总预算', value: formatCurrency(5300000000), subValue: '批准资本分配' },
          { label: '已支出', value: formatCurrency(totalSpent), subValue: '67.9% of total budget' },
          { label: '待审批', value: formatCurrency(12800000), subValue: '14 open requests' },
          { label: '预测 (EAC)', value: formatCurrency(45200000), subValue: 'Under budget by 3.5%', highlight: true },
        ].map((kpi, i) => (
          <div key={i} className={`glass-panel rounded-xl p-6 hover:border-primary/30 transition-all relative overflow-hidden group ${i === 3 ? 'border-l-2 border-primary' : ''}`}>
            {/* Gradient Effect */}
            {i === 3 && <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>}

            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                {i === 0 && <TrendingUp className="w-4 h-4" />}
                {kpi.label}
              </span>
            </div>
            <h3 className={`text-3xl font-bold tracking-tight ${i === 3 ? 'text-primary' : 'text-on-surface'} mb-1`}>{kpi.value}</h3>
            <p className="text-xs text-on-surface-variant font-mono">{kpi.subValue}</p>
          </div>
        ))}
      </div>

      {/* Cost Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chart Section */}
        <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-30 pointer-events-none"></div>

          <h3 className="text-lg font-bold text-on-surface mb-6 self-start">成本结构</h3>

          {/* Donut Chart */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {categoryData.map((cat, i) => {
                const offset = categoryData.slice(0, i).reduce((acc, c) => acc + c.value, 0);
                return (
                  <circle
                    key={cat.name}
                    cx="18" cy="18" r="14"
                    fill="none"
                    stroke={cat.color}
                    strokeWidth="6"
                    strokeDasharray={`${cat.value}, 100`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="block text-3xl font-bold text-on-surface">5</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider">Cost Centers</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 w-full mt-8">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${cat.color === '#3b82f6' ? 'bg-blue-500' : cat.color === '#a855f7' ? 'bg-purple-500' : cat.color === '#06b6d4' ? 'bg-cyan-500' : 'bg-slate-500'}`}></span>
                  <span className="text-on-surface">{cat.name}</span>
                </div>
                <span className="font-mono text-on-surface-variant">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget vs Actual */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 bg-surface-container/50 backdrop-blur-md flex justify-between items-center">
            <h3 className="text-lg font-bold text-on-surface">预算 vs 实际</h3>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">Project Level</span>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Budget</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actual</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'Pre-construction', budget: 25000000, actual: 25350000, variance: -0.5 },
                { name: 'Main Building', budget: 450000000, actual: 310200000, variance: +3.2 },
                { name: 'Landscaping', budget: 18000000, actual: 4500000, variance: 0 },
              ].map((item, i) => {
                const isOverBudget = item.variance > 0;
                return (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant font-mono">{formatCurrency(item.budget)}</td>
                    <td className={`px-6 py-4 text-sm font-bold font-mono ${isOverBudget ? 'text-error' : 'text-success'}`}>
                      {formatCurrency(item.actual)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        isOverBudget
                          ? 'bg-error/10 border border-error/20 text-error'
                          : 'bg-success/10 border border-success/20 text-success'
                      }`}>
                        {isOverBudget ? '+' : ''}{item.variance}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Schedule */}
      <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-secondary" />
        待付款项
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {upcomingPayments.map((payment, index) => (
          <div key={index} className="glass-panel rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden">
            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{payment.date}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${payment.badgeColor}`}>
                {payment.status}
              </span>
            </div>

            <h4 className="text-sm font-semibold text-on-surface mb-1 group-hover:text-primary transition-colors">{payment.payee}</h4>
            <p className="text-xs text-on-surface-variant mb-4">{payment.vendor}</p>

            <div className="flex items-center justify-between relative z-10 pt-4 border-t border-white/10">
              <span className="text-xs font-mono text-on-surface-variant">Amount</span>
              <span className="font-bold text-xl text-on-surface">{formatCurrency(payment.amount)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-warning" />
        支出待审批
      </h3>
      <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
        {pendingApprovals.map((approval, index) => (
          <div key={index} className="flex flex-col md:flex-row justify-between items-center p-5 hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5 last:border-0">
            <div className="w-full md:w-auto flex-1 mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono">{approval.code}</span>
                <h4 className="font-semibold text-on-surface group-hover:text-primary transition-colors">{approval.title}</h4>
              </div>
              <p className="text-xs text-on-surface-variant">Request by: {approval.requester}</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <span className="font-bold text-xl text-primary font-mono">{formatCurrency(approval.amount)}</span>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-error/30 hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors text-xs font-bold uppercase tracking-wider">
                  拒绝
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-success text-on-primary shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center gap-2 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all text-xs font-bold uppercase tracking-wider">
                  <CheckSquare className="w-3 h-3" /> 批准
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Calculate total spent from mockBudgets
const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent_amount, 0);
