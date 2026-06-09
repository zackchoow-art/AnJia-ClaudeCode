import { useState } from 'react';
import {
  Plus,
  TrendingUp,
  PieChart,
  Building,
  Search,
  Filter,
  ArrowRight,
  MoreHorizontal,
  Megaphone,
} from 'lucide-react';
import { mockCustomers } from '../utils/api';

export default function Sales() {
  const [timeRange, setTimeRange] = useState('本月');

  // Marketing Campaigns
  const campaigns = [
    { name: 'Q3 核心区商业推广', status: '进行中', conversionRate: 12.4, roi: '¥125K' },
    { name: '海外投资者私享会', status: '筹备中', conversionRate: 0, roi: '--' },
    { name: '线上直播系列', status: '待开始', conversionRate: 0, roi: '--' },
  ];

  // Customer Insights
  const customerInsights = [
    { label: '总线索 (Leads)', value: '2,480', growth: '+8.2%', color: 'text-primary' },
    { label: '意向客户 (Qualified)', value: '845', growth: '转化率 34.1%', color: 'text-secondary' },
    { label: '已成交 (Closed)', value: '112', growth: '+12% vs 上月', color: 'text-success' },
  ];

  // Recent Property Records
  const properties = [
    {
      code: 'AET-H1-092',
      name: 'Nebula Tower - 顶层办公区',
      location: '上海市浦东新区陆家嘴',
      area: '1,250 m²',
      pricePerSq: '¥120,000/m²',
      total: '¥150M',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2669&auto=format&fit=crop',
    },
    {
      code: 'AET-R3-104',
      name: 'Horizon Villas - A区独栋',
      location: '深圳市南山区深圳湾',
      area: '450 m²',
      pricePerSq: '¥85,000/m²',
      total: '¥85M',
      status: 'reserved',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop',
    },
    {
      code: 'AET-I2-005',
      name: 'Quantum Data Center',
      location: '贵安新区数字智谷',
      area: '3,000 m²',
      pricePerSq: '¥106,667/m²',
      total: '¥320M',
      status: 'sold',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2668&auto=format&fit=crop',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/10 border border-secondary/20 text-on-surface uppercase">AVAILABLE</span>;
      case 'reserved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary/10 border border-tertiary/20 text-on-surface uppercase">RESERVED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-outline/10 border border-outline/20 text-on-surface uppercase">SOLD</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '进行中':
        return 'bg-secondary-container/50 text-secondary';
      case '筹备中':
        return 'bg-tertiary-container/50 text-tertiary';
      default:
        return 'bg-outline/10 text-on-surface-variant';
    }
  };

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">销售与物业管理</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight">销售管理</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 text-on-surface rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            添加物业
          </button>
        </div>
      </div>

      {/* Marketing Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {campaigns.map((campaign, index) => (
          <div key={index} className="glass-panel rounded-xl p-5 hover:border-primary/30 transition-all group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{campaign.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-on-surface-variant">转化率</span>
                  <span className={`font-mono font-bold ${campaign.conversionRate > 0 ? 'text-secondary' : 'text-on-surface-variant'}`}>{campaign.conversionRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${campaign.conversionRate > 0 ? 'bg-secondary' : 'bg-on-surface-variant'}`}
                    style={{ width: campaign.conversionRate > 0 ? `${campaign.conversionRate * 3}%` : '0%' }}
                  ></div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">ROI</span>
                <span className="font-mono font-bold text-on-surface">{campaign.roi}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {customerInsights.map((insight, index) => (
          <div key={index} className="glass-panel rounded-xl p-5 hover:bg-white/5 transition-all group relative overflow-hidden">
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-gradient-to-br ${index === 0 ? 'from-primary/10' : index === 1 ? 'from-secondary/10' : 'from-success/10'} to-transparent rounded-bl-full blur-xl group-hover:scale-150 transition-transform duration-500`}></div>
            <p className="text-sm text-on-surface-variant font-medium mb-2">{insight.label}</p>
            <h3 className={`text-3xl font-bold ${index === 2 ? 'text-primary' : 'text-on-surface'} tracking-tight`}>{insight.value}</h3>
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingUp className={`w-4 h-4 ${insight.color}`} />
              <span className={`text-xs font-medium ${insight.color}`}>{insight.growth}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Property Inventory */}
      <h3 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
        <Building className="w-5 h-5 text-primary" />
        物业库存
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {properties.map((property, index) => (
          <div key={index} className="glass-panel rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative border border-white/10">
            <div className="h-40 relative overflow-hidden">
              <img
                src={property.image}
                alt={property.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute top-3 right-3">{getStatusBadge(property.status)}</div>
            </div>
            <div className="p-4">
              <div className="mb-2">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest mb-1 block">{property.code}</span>
                <h4 className="font-semibold text-sm text-on-surface leading-tight mb-1">{property.name}</h4>
                <p className="text-xs text-on-surface-variant flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {property.location}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/10">
                <div className="text-center">
                  <span className="text-[10px] text-on-surface-variant block">面积</span>
                  <span className="text-sm font-medium text-on-surface">{property.area}</span>
                </div>
                <div className="text-center border-l border-white/5">
                  <span className="text-[10px] text-on-surface-variant block">总价</span>
                  <span className="text-sm font-bold text-primary">{property.total}</span>
                </div>
              </div>
              <button className="w-full mt-2 py-2 rounded-lg bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-on-surface group-hover:text-primary">
                查看详情
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Customer List */}
      <h3 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        高净值客户名单
      </h3>
      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">客户名称</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">意向物业类型</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">预算评估</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mockCustomers.slice(0, 3).map((customer) => {
              const statusConfig = mockCustomers[0].customer_status === 'SIGNED' ? { color: 'text-success', bg: 'success' } : { color: 'text-primary', bg: 'primary' };
              return (
                <tr key={customer.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${statusConfig.color} bg-${statusConfig.bg}/10 border border-${statusConfig.bg}/20`}>
                        {customer.customer_name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">{customer.customer_name}</p>
                        <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">ID: {customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusConfig.color === 'text-success' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}></span>
                      <span className="text-on-surface">{statusConfig.color === 'text-success' ? '已签约' : '积极跟进'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{customer.interested_property_type}</td>
                  <td className="px-6 py-4 font-mono">
                    <span className={`font-bold ${statusConfig.color}`}>
                      ¥{(customer.budget_range_min / 10000).toFixed(0)} - {(customer.budget_range_max / 10000).toFixed(0)}万
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Users(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
