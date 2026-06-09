import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

import {
  Download,
  TrendingUp,
  Presentation,
  AlertCircle,
  Terminal,
  Building2,
  CheckSquare,
  Globe,
  Activity,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import {
  getCustomerStats,
  getPaymentSummary,
  getContractStats,
  getRecentActivityLogs,
  getUserProjects,
} from '../services/api';
import type { AuditLog, Project } from '../types/database';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPI State
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [activeProjects, set生效中Projects] = useState<number>(0);
  const [salesConversion, setSalesConversion] = useState<number>(0);
  const [avgOccupancy, setAvgOccupancy] = useState<number>(0);

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load KPIs
      const [customerStats, paymentSummary, contractStats, projects] = await Promise.all([
        getCustomerStats(),
        getPaymentSummary(),
        getContractStats(),
        getUserProjects('current_user_id'),
      ]);

      if (projects) {
        set生效中Projects(projects.length);
      }

      setTotalRevenue(paymentSummary.pendingAmount + paymentSummary.approvedAmount);
      setSalesConversion(customerStats.signedCount > 0 ? (customerStats.signedCount / customerStats.totalCustomers) * 100 : 0);

      // Calculate occupancy from properties
      const { data: properties } = await supabase.from('properties').select('property_status');
      if (properties) {
        const sold = properties.filter((p: any) => p.property_status === 'SOLD' || p.property_status === 'OWNER_OCCUPIED').length;
        setAvgOccupancy(properties.length > 0 ? Math.round((sold / properties.length) * 100) : 0);
      }

      // Load activity logs
      const logs = await getRecentActivityLogs(10);
      setActivityLogs(logs);

    } catch (err: any) {
      console.error('Err或 loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-mono">正在加载系统数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <AlertCircle className="w-12 h-12 text-err或 mb-4" />
        <h3 className="text-xl font-bold text-on-surface mb-2">仪表盘加载失败</h3>
        <p className="text-on-surface-variant mb-6">{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-dark transition-colors"
        >
          重试加载
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-4xl font-bold text-on-surface mb-1 tracking-tight">实时运营监控</h2>
          <p className="text-on-surface-variant">全球资产网络与系统性能监控。</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-lowest/50 border border-outline-variant/30 rounded-full px-4 py-1.5 text-sm text-secondary shadow-sm">
             <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
             系统状态: 正常
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors text-sm font-medium shadow-sm"
          >
            <Activity className="w-4 h-4" /> 刷新数据
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: '总收入 (年初至今)', value: `$${(totalRevenue / 1000000).toFixed(1)}M`, trend: `+${((Math.random() * 5) + 8).toFixed(1)}% vs last Q`, icon: Presentation, color: 'text-primary' },
          { label: '活跃项目', value: activeProjects.toString(), trend: '+48 new nodes', icon: Building2, color: 'text-secondary' },
          { label: '销售转化率', value: `${salesConversion.toFixed(1)}%`, trend: '-2.1% (Sect或 4)', icon: TrendingUp, color: 'text-tertiary' },
          { label: '平均入住率', value: `${avgOccupancy}%`, trend: 'Steady', icon: CheckSquare, color: 'text-primary' },
        ].map((kpi, i) => (
          <div key={i} className="glass-panel p-5 rounded-xl flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-[100px] pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color} opacity-70`} />
            </div>
            <div className="text-4xl font-bold text-on-surface mb-2 relative z-10">{kpi.value}</div>
            <div className="flex items-center gap-2 text-xs font-mono text-outline">
              <TrendingUp className={`w-3 h-3 ${parseFloat(kpi.trend) >= 0 ? 'text-secondary' : 'text-error'}`} /> {kpi.trend}
            </div>
            {/* Fake Sparkline */}
            <div className={`absolute bottom-0 left-0 w-full h-1 ${kpi.col或 === 'text-primary' ? 'bg-primary' : 'bg-secondary'} opacity-20 group-hover:opacity-100 transition-opacity`}></div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization placeholder */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden shadow-sm h-[400px] flex flex-col relative group">
          <div className="p-5 border-b border-white/40 bg-surface-container-lowest/50 backdrop-blur-md flex justify-between items-center z-10">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> 全球分布矩阵
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs rounded bg-white shadow-sm border border-outline-variant/30 text-primary">全局视图</button>
              <button className="px-3 py-1 text-xs rounded text-on-surface-variant hover:text-primary transition-colors">区域隔离</button>
            </div>
          </div>
          <div className="flex-1 bg-surface-container/30 relative overflow-hidden">
             <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop"
              alt="Holographic Map"
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:scale-105 transition-transform duration-1000"
            />
            {/* Overlay UI */}
             <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md border border-outline-variant/30 rounded-lg p-4 w-64 shadow-lg">
                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2 font-mono">关注区域: 亚太</div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-on-surface">活跃节点</span>
                    <span className="text-primary font-mono font-bold">{activeProjects + 350}</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className="w-[70%] bg-primary h-full rounded-full"></div>
                </div>
             </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="glass-panel rounded-xl p-5 flex flex-col shadow-sm h-[400px]">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5" /> 最近活动
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar text-xs font-mono">
            {activityLogs.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant/50">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>暂无近期活动</p>
              </div>
            ) : (
              activityLogs.map((log, i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-outline-variant/20 hover:bg-white/5 rounded-lg px-2 transition-colors">
                  <span className="text-secondary opacity-70 whitespace-nowrap font-mono text-xs pt-1">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <div className="flex-1 min-w-0">
                    <p className={`truncate ${log.action === 'REJECTED' || log.entity_type === 'payment' && log.action === 'CREATED' ? 'text-err或 font-medium' : 'text-on-surface'}`}>
                      {log.action} {log.entity_type.toUpperCase()}: {log.entity_id.substring(0, 8)}...
                    </p>
                    <p className="truncate text-on-surface-variant/70">
                      作者：{log.actor_name}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {/* Contract Status */}
        <section className="glass-panel rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-widest flex items-center gap-2">
            <Building2 className="w-4 h-4" /> 合同概览
          </h3>
          <div className="space-y-3">
            {[
              { label: '草稿', value: 0, color: 'text-on-surface-variant' },
              { label: '待签署', value: 2, color: 'text-secondary' },
              { label: '生效中', value: 15, color: 'text-primary' },
              { label: '已完成', value: 48, color: 'text-success' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                <span className="font-mono text-base">{item.value} 个合同</span>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Status */}
        <section className="glass-panel rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> 支付概览
          </h3>
          <div className="space-y-3">
            {[
              { label: '待审批', value: '$12.8M', trend: '+2 new', color: 'text-warning' },
              { label: 'Approved', value: '$45.2M', trend: '+8 completed', color: 'text-primary' },
              { label: 'Scheduled', value: '$28.5M', trend: 'Next week', color: 'text-secondary' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">{item.label}</span>
                <div className="text-right">
                  <span className="font-mono text-base text-primary">{item.value}</span>
                  <span className="block text-xs text-on-surface-variant">{item.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 客户漏斗 */}
        <section className="glass-panel rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-4 h-4" /> 客户漏斗
          </h3>
          <div className="space-y-3">
            {[
              { label: '新线索', value: 45, color: 'text-on-surface-variant' },
              { label: '合格', value: 28, color: 'text-secondary' },
              { label: '谈判中', value: 12, color: 'text-primary' },
              { label: '已成交', value: 8, color: 'text-success' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">{item.label}</span>
                <div className="text-right">
                  <span className="font-mono text-base">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
