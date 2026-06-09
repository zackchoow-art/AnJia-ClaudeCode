import { useState } from 'react';
import {
  Check,
  Clock,
  AlertCircle,
  TrendingUp,
  Download,
  Plus,
} from 'lucide-react';
import { mockPayments, formatCurrency } from '../utils/api';

export default function Approvals() {
  const [filterType, setFilterType] = useState('全部待办');

  // Get pending payments
  const pendingPayments = mockPayments.filter(p => p.payment_status === 'PENDING');
  const recentPayments = mockPayments.slice(0, 8);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 border border-success/20 text-success uppercase">已批准</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 border border-error/20 text-error uppercase">已拒绝</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 border border-warning/20 text-warning uppercase animate-pulse">待审批</span>;
      case 'EXECUTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary uppercase">已执行</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-outline/10 text-on-surface-variant uppercase">{status}</span>;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-error shadow-[0_0_8px_rgba(239,68,68,0.5)]';
      case 'Medium':
        return 'text-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      default:
        return 'text-success shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    }
  };

  // Stats
  const stats = [
    { label: '待审批', value: pendingPayments.length.toString(), trend: '+3 今日新增' },
    { label: '已批准 (30天)', value: mockPayments.filter(p => p.payment_status === 'APPROVED').length.toString(), trend: '-12% 环比下降' },
    { label: '已拒绝', value: mockPayments.filter(p => p.payment_status === 'REJECTED').length.toString(), trend: '+1 需关注' },
    { label: '总金额', value: formatCurrency(mockPayments.reduce((sum, p) => sum + (p.payment_status === 'PENDING' ? 0 : p.payment_amount), 0)), trend: '流动资金' },
  ];

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">审批管理</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight">待办事项</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 text-on-surface rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建审批
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="glass-panel rounded-xl p-6 hover:border-primary/30 transition-all relative overflow-hidden group cursor-pointer">
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${index === 0 ? 'from-warning' : index === 1 ? 'from-success' : index === 2 ? 'from-error' : 'from-primary'} to-transparent rounded-full blur-3xl opacity-20 group-hover:scale-150 transition-transform duration-700`}></div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 relative z-10">{stat.label}</p>
            <div className="flex items-baseline gap-3 relative z-10">
              <h3 className={`text-5xl font-bold ${index === 2 ? 'text-error' : index === 1 ? 'text-success' : 'text-on-surface'} tracking-tighter`}>{stat.value}</h3>
            </div>
            <p className="text-sm text-on-surface-variant mt-2 relative z-10">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar w-full md:w-auto pb-2 md:pb-0">
          {['全部待办', '我的审批', '财务类', '合同类'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterType === tab
                  ? 'bg-gradient-to-r from-primary to-secondary text-on-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-white/5 hover:bg-white/10 text-on-surface-variant border border-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <select className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors">
          <option>排序：按优先级（高到低）</option>
          <option>排序：按时间（最新优先）</option>
          <option>排序：按金额（从大到小）</option>
        </select>
      </div>

      {/* Pending Approvals */}
      {filterType === '全部待办' && (
        <div className="space-y-4">
          {pendingPayments.map((payment) => (
            <div key={payment.id} className="glass-panel rounded-xl p-6 hover:border-primary/30 transition-all relative overflow-hidden group border-l-2" style={{ borderColor: payment.approval_notes ? '#fbbf24' : 'var(--color-primary)' }}>
              {/* Gradient Effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>

              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-xs px-2 py-1 rounded bg-white/5 border border-white/10">REQ-{payment.payment_code}</span>
                    <span className="text-[10px] font-bold text-warning border border-error/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      高优先级
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">资本支出审批：{payment.project_id === 'PRJ001' ? 'A地块住宅项目' : payment.contract_id} 进度款</h3>
                  <p className="text-sm text-on-surface-variant max-w-2xl">{payment.approval_notes || '等待财务部门最终复核，总金额已超出常规审批权限。'}</p>

                  {/* Workflow Tracker */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">审批流程</h4>
                    <div className="flex items-center gap-2 relative">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2"></div>
                      {['部门主管', '预算审批', '财务复核', '最终批准'].map((step, i) => {
                        const isCompleted = i < 2;
                        const isCurrent = i === 2;
                        return (
                          <div key={step} className={`relative z-10 flex flex-col items-center ${isCurrent ? '-translate-y-8' : ''}`}>
                            {isCompleted ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-success to-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-surface">
                                <Check className="w-4 h-4" />
                              </div>
                            ) : isCurrent ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-on-primary flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] border-2 border-surface animate-pulse">
                                <Clock className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/5 border-2 border-white/10"></div>
                            )}
                            <span className={`text-[10px] mt-2 font-medium ${isCompleted ? 'text-primary' : isCurrent ? 'text-primary' : 'text-on-surface-variant'}`}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-on-surface-variant mb-1">申请金额</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(payment.payment_amount)}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      提交于 {new Date(payment.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg border border-error/30 hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors text-xs font-bold uppercase tracking-wider">
                      拒绝
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-success text-on-primary shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
                      <Check className="w-4 h-4" /> 批准
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {filterType !== '全部待办' && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            最近活动
          </h3>
          <div className="space-y-4">
            {recentPayments.map((payment, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${payment.payment_status === 'APPROVED' ? 'bg-success/10 text-success' : payment.payment_status === 'REJECTED' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                  {payment.payment_status === 'APPROVED' && <Check className="w-5 h-5" />}
                  {payment.payment_status === 'REJECTED' && <AlertCircle className="w-5 h-5" />}
                  {payment.payment_status === 'PENDING' && <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-on-surface">{payment.payment_code} - {payment.contract_id}</h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {formatCurrency(payment.payment_amount)} | {new Date(payment.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div>{getStatusBadge(payment.payment_status)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
