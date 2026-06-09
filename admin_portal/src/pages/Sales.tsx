import { useEffect, useState } from 'react';
import {
  Download,
  Plus,
  Megaphone,
  MoreHorizontal,
  TrendingUp,
  PieChart,
  Building,
  Search,
  Filter,
  MapPin,
  ArrowRight,
  Eye,
  Users,
  Edit3,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import {
  getCustomerStats,
  getPropertyInventory,
  getTodayFollowups,
  createPropertyReservation,
  updatePropertyStatus,
} from '../services/api';
import type { Property, Customer } from '../types/database';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export default function Sales() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load properties based on filter
      let query = supabase.from<Property>('properties').select('*');
      if (filter !== 'all') {
        query = query.eq('property_status', filter);
      }
      const { data: props, error } = await query;

      if (error) {
        console.error('Error loading properties:', error);
      } else {
        setProperties(props || []);
      }

      // Load customers
      const { data: custs } = await supabase.from<Customer>('customers').select('*');
      setCustomers(custs || []);

    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const getPropertyCountByStatus = (status: string) => {
    return properties.filter((p) => p.property_status === status).length;
  };

  return (
    <div className="p-4 md:p-8 flex-1 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight mb-1">销售与物业管理</h2>
          <p className="text-sm text-on-surface-variant">
            实时掌控您的物业组合与销售渠道。当前在线: {properties.length} 套房源
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-colors uppercase tracking-wider">
            <Download className="w-4 h-4" />
            导出报表
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-surface-tint text-on-primary text-xs font-bold rounded-lg hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] transition-all uppercase tracking-wider">
            <Plus className="w-4 h-4" />
            添加物业
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Marketing Campaigns */}
        <section className="col-span-1 md:col-span-4 glass-panel rounded-xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-on-surface/10">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              营销活动
            </h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Q3 核心区商业推广', status: '进行中', conversion: 12.4, roi: '¥125K' },
              { name: '海外投资者私享会', status: '筹备中', conversion: 0, roi: '--' },
            ].map((campaign, i) => (
              <div
                key={i}
                className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-on-surface/5 transition-colors cursor-pointer border border-transparent hover:border-on-surface/5"
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm text-on-surface font-semibold group-hover:text-primary transition-colors">{campaign.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      campaign.status === '进行中'
                        ? 'bg-secondary-container/50 text-secondary border-secondary/20'
                        : 'bg-tertiary-container/50 text-tertiary border-tertiary/20'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-1 w-1/2">
                    <span className="font-mono text-xs text-on-surface-variant">转化率: {campaign.conversion}%</span>
                    <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          campaign.status === '进行中' ? 'bg-secondary' : 'bg-tertiary'
                        }`}
                        style={{ width: `${campaign.conversion * 2}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-on-surface">{campaign.roi} <span className="text-xs font-normal text-on-surface-variant">投资回报率</span></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Customer Insights */}
        <section className="col-span-1 md:col-span-8 glass-panel rounded-xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-on-surface/10">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              客户洞察与漏斗
            </h3>
            <span className="text-[12px] text-on-surface-variant bg-surface-variant px-2 py-1 rounded font-bold uppercase">This Month</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 h-full">
            <div className="col-span-1 flex flex-col gap-4">
              {[
                { label: '总线索', value: customers.length, trend: '+8.2% 比上月', color: 'text-on-surface' },
                { label: '意向客户', value: customers.filter((c) => c.customer_status === 'INTERESTED').length, trend: '转化率: 34.1%', color: 'text-secondary' },
                { label: '已成交', value: customers.filter((c) => c.customer_status === 'SIGNED').length, trend: '+12% 比上月', color: 'text-primary' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-lg bg-surface/50 border border-on-surface/5 flex flex-col gap-1 relative overflow-hidden">
                  <div className={`absolute right-0 top-0 w-16 h-16 ${stat.color.replace('text-', 'bg-')} opacity-20 rounded-bl-full blur-[10px]`}></div>
                  <span className="text-sm text-on-surface-variant font-medium">{stat.label}</span>
                  <span className={`text-3xl font-bold tracking-tight ${stat.color}`}>{stat.value}</span>
                  <span className="font-mono text-xs text-secondary flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {stat.trend}
                  </span>
                </div>
              ))}
            </div>

            {/* Chart Placeholder */}
            <div className="col-span-1 md:col-span-2 relative h-full min-h-[200px] flex items-center justify-center border border-dashed border-on-surface/20 rounded-lg bg-surface-container/50">
              <div className="text-center flex flex-col items-center gap-2">
                <PieChart className="w-12 h-12 text-primary/50" />
                <p className="text-sm text-on-surface-variant">线索来源分布图表</p>
                <p className="font-mono text-[10px] text-outline uppercase">DataViz Component Area</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 物业库存网格 */}
      <section className="flex flex-col gap-4 mt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            物业库存 ({properties.length})
          </h3>
          <div className="flex gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="搜索物业..."
                className="bg-surface border-b border-on-surface/20 border-t-0 border-x-0 focus:ring-0 focus:border-primary text-on-surface text-sm pl-10 py-1.5 w-[200px] placeholder:text-on-surface-variant/50 transition-colors"
                onChange={(e) => {
                  // Implement search logic
                }}
              />
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 glass-panel rounded-md hover:bg-on-surface/5 transition-colors border-on-surface/10 text-xs font-bold uppercase">
              <Filter className="w-4 h-4" /> 筛选
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-surface/50 rounded-xl border-2 border-dashed border-outline-variant/30">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-on-surface-variant">暂无物业数据</p>
            </div>
          ) : (
            properties.map((property) => (
              <PropertyCard key={property.id} property={property} onStatusChange={loadData} />
            ))
          )}
        </div>
      </section>

      {/* Customer List Table */}
      <section className="glass-panel rounded-xl overflow-hidden flex flex-col border border-on-surface/10 mt-4">
        <div className="flex justify-between items-center p-6 border-b border-on-surface/10 bg-surface/50">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            高净值客户名单 ({customers.length})
          </h3>
          <button className="text-primary text-xs hover:underline font-bold tracking-wider uppercase">查看全部</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-on-surface/10">
                <th className="text-xs text-on-surface-variant uppercase tracking-wider py-4 px-6 font-medium">客户名称</th>
                <th className="text-xs text-on-surface-variant uppercase tracking-wider py-4 px-6 font-medium">状态</th>
                <th className="text-xs text-on-surface-variant uppercase tracking-wider py-4 px-6 font-medium">意向物业类型</th>
                <th className="text-xs text-on-surface-variant uppercase tracking-wider py-4 px-6 font-medium">预算评估</th>
                <th className="text-xs text-on-surface-variant uppercase tracking-wider py-4 px-6 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-on-surface/5 hover:bg-primary/5 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary font-bold">
                        {customer.customer_name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-on-surface font-medium">{customer.customer_name}</p>
                        <p className="font-mono text-[10px] text-on-surface-variant">ID: {customer.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          customer.customer_status === 'SIGNED'
                            ? 'bg-primary shadow-[0_0_8px_rgba(0,103,127,0.5)]'
                            : customer.customer_status === 'INTERESTED'
                            ? 'bg-secondary shadow-[0_0_8px_rgba(80,95,118,0.5)]'
                            : customer.customer_status === 'NEGOTIATING'
                            ? 'bg-tertiary shadow-[0_0_8px_rgba(87,96,101,0.5)]'
                            : 'bg-outline'
                        }`}
                      ></div>
                      <span className="text-on-surface capitalize">
                        {customer.customer_status === 'POTENTIAL' && '潜在'}
                        {customer.customer_status === 'INTERESTED' && '积极跟进'}
                        {customer.customer_status === 'NEGOTIATING' && '谈判中'}
                        {customer.customer_status === 'SIGNED' && '已签约'}
                        {customer.customer_status === 'CANCELLED' && '已取消'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant">{customer.interested_property_type || '未指定'}</td>
                  <td className="py-4 px-6 font-mono text-primary font-medium">
                        ¥{customer.budget_range_min}M - ¥{customer.budget_range_max}M
                    </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// Property Card Component
function PropertyCard({
  property,
  onStatusChange,
}: {
  property: Property;
  onStatusChange: () => void;
}) {
  const statusConfig = {
    AVAILABLE: { color: 'bg-secondary', label: '可售' },
    RESERVED: { color: 'bg-tertiary', label: '预留' },
    UNDER_CONTRACT: { color: 'bg-warning', label: '签约中' },
    SOLD: { color: 'bg-outline', label: '已售出' },
    OWNER_OCCUPIED: { color: 'bg-primary', label: '自持' },
    UNAVAILABLE: { color: 'bg-error', label: '暂不出售' },
  };

  const config = statusConfig[property.property_status as keyof typeof statusConfig] || {
    color: 'bg-outline',
    label: property.property_status,
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,209,255,0.15)] transition-all duration-300 group relative">
      <div className="h-[140px] relative bg-surface-container overflow-hidden">
        <img
          src={`https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2669&auto=format&fit=crop`}
          alt="Property"
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply group-hover:mix-blend-normal group-hover:opacity-100 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded backdrop-blur-md bg-opacity-80 border flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${config.color}`}></div>
          <span className="font-mono text-[10px] font-bold text-on-surface uppercase min-w-max">{config.label}</span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3 relative z-10">
        <div>
          <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest mb-1">{property.property_code}</p>
          <h4 className="font-semibold text-base text-on-surface leading-tight truncate">
            {property.building_number}栋 {property.unit_number}单元 {property.room_number}室
          </h4>
          <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> 建筑面积: {property.floor_area} 平方米
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-on-surface/10">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-on-surface-variant">单价</span>
            <span className="text-sm font-medium">
              ¥{(property.price_per_sqm || 0).toLocaleString()} /平方米
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-on-surface-variant">估值</span>
            <span className="text-sm font-medium">
              ¥{(property.list_price || 0).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          {property.property_status === 'AVAILABLE' ? (
            <button
              onClick={() => {
                // Reserve property logic
              }}
              className="w-8 h-8 rounded-full border border-on-surface/20 flex items-center justify-center hover:bg-primary/20 hover:border-primary transition-colors text-on-surface hover:text-primary"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                // View details logic
              }}
              className="w-8 h-8 rounded-full border border-on-surface/20 flex items-center justify-center hover:bg-primary/20 hover:border-primary transition-colors text-on-surface hover:text-primary"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
