import { useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  FileSignature,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function Dashboard() {
  const [timeRange] = useState('This Month');

  // Stats Data
  const stats = [
    { label: '项目总数', value: '12', trend: '+2 这周' as string, icon: Building2 },
    { label: '客户总数', value: '258', trend: '+15 这月' as string, icon: Users },
    { label: '待审批金额', value: '¥325万', trend: '-12% 环比下降' as string, icon: DollarSign },
    { label: '合同总数', value: '46', trend: '+8 本月新增' as string, icon: FileSignature },
  ];

  // Recent Payments
  const recentPayments = [
    { id: 'PY202506001', project: 'A地块住宅项目', amount: 2500000, status: 'pending', date: '2025-06-05' },
    { id: 'PY202506002', project: 'B地块商业配套', amount: 1800000, status: 'approved', date: '2025-06-04' },
    { id: 'PY202506003', project: 'C地块景观工程', amount: 950000, status: 'rejected', date: '2025-06-03' },
    { id: 'PY202506004', project: 'A地块住宅项目', amount: 3200000, status: 'pending', date: '2025-06-02' },
  ];

  // Recent Contracts
  const recentContracts = [
    { id: 'HT202506001', name: '幕墙分包合同', counterparty: 'XX建设工程公司', amount: 8500000, date: '2025-06-02' },
    { id: 'HT202506002', name: '景观设计合同', counterparty: 'XX设计院', amount: 1200000, date: '2025-06-01' },
  ];

  // Pending Tasks
  const pendingTasks = [
    { title: '审批：B地块商业配套 - 进度款', subtitle: '2,500,000 元 | 待财务复核', priority: 'high', time: '需在今日 17:00 前回复' },
    { title: '合同签署：C地块景观工程分包合同', subtitle: '合作方已盖章，待我方签署', priority: 'medium', time: '2 小时前' },
    { title: '客户跟进：A地块客户张三 - 首付分期方案', subtitle: '需在今日 17:00 前回复', priority: 'high', time: '今天' },
    { title: '预算审批：Q3市场营销费用调整', subtitle: '超出原预算15%，等待最终批准', priority: 'low', time: '昨天' },
  ];

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">欢迎回来</p>
        <h1 className="text-4xl lg:text-5xl font-bold text-on-surface mb-2 tracking-tight">
          控制面板
        </h1>
        <p className="text-on-surface-variant">实时掌控您的项目组合与审批流程。</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="glass-panel rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-300 group relative overflow-hidden">
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${index === 0 ? 'from-primary/5 to-transparent' : index === 1 ? 'from-secondary/5 to-transparent' : index === 2 ? 'from-warning/5 to-transparent' : 'from-success/5 to-transparent'} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${index === 0 ? 'bg-primary/10' : index === 1 ? 'bg-secondary/10' : index === 2 ? 'bg-warning/10' : 'bg-success/10'} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${index === 0 ? 'text-primary' : index === 1 ? 'text-secondary' : index === 2 ? 'text-warning' : 'text-success'}`} />
              </div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{stat.label}</p>
              <h3 className="text-4xl font-bold text-on-surface mb-1 tracking-tight">{stat.value}</h3>
              <p className={`text-sm font-medium ${index === 2 ? 'text-warning' : index === 0 || index === 1 ? 'text-primary' : 'text-success'}`}>
                {stat.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Payments */}
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-white/10 bg-surface-container/50 backdrop-blur-md flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                最近付款申请
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">显示最近的付款审批请求</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {recentPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant shrink-0 border border-white/10 ${payment.status === 'approved' ? 'bg-success/20' : payment.status === 'rejected' ? 'bg-error/20' : 'bg-warning/20'}`}>
                    {payment.status === 'approved' ? <CheckCircle className="w-5 h-5 text-success" /> : payment.status === 'rejected' ? <AlertCircle className="w-5 h-5 text-error" /> : <Clock className="w-5 h-5 text-warning" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{payment.project}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">ID: {payment.id} • {payment.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono font-medium text-on-surface">¥{payment.amount.toLocaleString()}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${payment.status === 'approved' ? 'bg-success/20 border-success/30 text-success' : payment.status === 'rejected' ? 'bg-error/20 border-error/30 text-error' : 'bg-warning/20 border-warning/30 text-warning'}`}>
                    {payment.status === 'approved' ? '已批准' : payment.status === 'rejected' ? '已拒绝' : '待审批'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col shrink-0 mb-6">
            <div className="px-6 py-5 border-b border-white/10 bg-surface-container/50 backdrop-blur-md">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-secondary" />
                最近签约
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">本月新增合同 {recentContracts.length} 份</p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {recentContracts.map((contract, index) => (
                <div key={index} className="p-4 rounded-xl bg-surface-container/50 border border-white/10 hover:border-primary/30 transition-colors cursor-pointer">
                  <h4 className="text-sm font-semibold text-on-surface mb-2">{contract.name}</h4>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-on-surface-variant">{contract.counterparty}</p>
                    <span className="font-medium text-primary font-mono">¥{contract.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-panel rounded-2xl p-6 flex-1">
            <h3 className="text-lg font-bold text-on-surface mb-4">快捷操作</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '新建项目', icon: '+' },
                { label: '新增客户', icon: '+' },
                { label: '创建合同', icon: '+' },
                { label: '提交付款', icon: '+' },
              ].map((action, index) => (
                <button key={index} className="p-4 rounded-xl bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 transition-all group flex flex-col items-center justify-center gap-2 min-h-[90px]">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">{action.icon}</div>
                  <span className="text-xs font-semibold text-on-surface">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 bg-surface-container/50 backdrop-blur-md flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            待办事项
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {pendingTasks.map((task, index) => (
            <div key={index} className="flex items-start gap-4 p-5 rounded-xl bg-white/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group cursor-pointer">
              <div className={`w-3 h-3 mt-2.5 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-error shadow-[0_0_8px_rgba(239,68,68,0.5)]' : task.priority === 'medium' ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-on-surface mb-2 flex items-center justify-between">
                  {task.title}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${task.priority === 'high' ? 'text-error bg-error/10' : task.priority === 'medium' ? 'text-warning bg-warning/10' : 'text-success bg-success/10'}`}>
                    {task.priority === 'high' ? 'High Priority' : task.priority === 'medium' ? 'Medium' : 'Low'}
                  </span>
                </h4>
                <p className="text-xs text-on-surface-variant mb-2">{task.subtitle}</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
