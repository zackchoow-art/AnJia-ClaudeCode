import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Users,
  ChevronRight,
  Eye,
  Edit,
  Phone,
  UserCheck,
} from 'lucide-react';
import { mockCustomers, formatCurrency } from '../utils/api';

export default function Customers() {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const customerStatusConfig: Record<string, { color: string; text: string }> = {
    POTENTIAL: { color: 'text-outline bg-outline/10 border-outline/20', text: '潜客' },
    INTERESTED: { color: 'text-primary bg-primary/10 border-primary/20', text: '意向' },
    NEGOTIATING: { color: 'text-warning bg-warning/10 border-warning/20', text: '谈判中' },
    SIGNED: { color: 'text-success bg-success/10 border-success/20', text: '已签约' },
    CANCELLED: { color: 'text-error bg-error/10 border-error/20', text: '已取消' },
  };

  const filteredCustomers = mockCustomers.filter((c) => {
    const matchesSearch =
      c.customer_name.includes(searchText) ||
      c.customer_phone.includes(searchText);
    const matchesStatus =
      filterStatus === '' || c.customer_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: '客户总数', value: mockCustomers.length, color: 'text-primary' },
    { label: '潜客', value: mockCustomers.filter((c) => c.customer_status === 'POTENTIAL').length, color: 'text-outline' },
    { label: '意向客户', value: mockCustomers.filter((c) => c.customer_status === 'INTERESTED').length, color: 'text-primary' },
    { label: '已签约', value: mockCustomers.filter((c) => c.customer_status === 'SIGNED').length, color: 'text-success' },
  ];

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">客户管理</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight">所有客户</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 text-on-surface rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            添加客户
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-4 border-l-2" style={{ borderColor: stat.color.replace('text-', '#') }}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${stat.color}`}>{stat.label}</p>
            <p className="text-3xl font-bold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="搜索客户姓名或电话..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors min-w-[160px]"
          >
            <option value="">全部状态</option>
            {Object.entries(customerStatusConfig).map(([value, cfg]) => (
              <option key={value} value={value}>{cfg.text}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">客户</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">类型</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">意向物业</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">预算区间</th>
                <th className="px-px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">所属销售</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.map((customer) => {
                const statusConfig = customerStatusConfig[customer.customer_status];
                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-primary/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-container to-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-on-surface shrink-0">
                          {customer.customer_name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">{customer.customer_name}</p>
                          <p className="text-xs text-on-surface-variant font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {customer.customer_phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded border ${customer.customer_type === 'COMPANY' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-success/10 text-success border-success/20'}`}>
                        {customer.customer_type === 'COMPANY' ? '企业' : '个人'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">{customer.interested_property_type}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-on-surface">
                        ¥{(customer.budget_range_min / 10000).toFixed(0)} - {(customer.budget_range_max / 10000).toFixed(0)}万
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusConfig.color}`}>
                        {statusConfig.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">{customer.sales_agent_name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="px-6 py-4 border-t border-white/10 bg-surface-container/50 flex justify-between items-center">
            <p className="text-xs text-on-surface-variant">显示 {filteredCustomers.length} 位客户</p>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 rounded-lg text-sm text-on-surface-variant opacity-50 cursor-not-allowed">上一页</button>
              <span className="text-xs font-bold text-primary">1 / 2</span>
              <button className="px-3 py-1 rounded-lg text-sm text-on-surface-variant hover:bg-white/5 transition-colors">下一页</button>
            </div>
          </div>
        )}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-20 glass-panel rounded-2xl border-dashed border-2 border-white/10">
          <Users className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-on-surface">暂无客户</p>
          <p className="text-sm text-on-surface-variant mt-1">尝试修改筛选条件或添加新客户</p>
        </div>
      )}
    </div>
  );
}
