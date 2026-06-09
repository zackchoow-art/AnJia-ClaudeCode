import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Calendar,
  ChevronRight,
  Eye,
  Edit,
  MoreHorizontal,
} from 'lucide-react';
import { mockProjects, formatCurrency } from '../utils/api';

export default function Projects() {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const projectStatusConfig: Record<string, { color: string; text: string }> = {
    PLANNING: { color: 'text-warning bg-warning/10 border-warning/20', text: '规划中' },
    IN_PROGRESS: { color: 'text-primary bg-primary/10 border-primary/20', text: '建设中' },
    COMPLETED: { color: 'text-success bg-success/10 border-success/20', text: '已竣工' },
  };

  const filteredProjects = mockProjects.filter((p) => {
    const matchesSearch =
      p.project_name.includes(searchText) ||
      p.location.includes(searchText);
    const matchesStatus =
      filterStatus === '' || p.project_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: '项目总数', value: mockProjects.length, color: 'text-primary' },
    { label: '规划中', value: mockProjects.filter((p) => p.project_status === 'PLANNING').length, color: 'text-warning' },
    { label: '建设中', value: mockProjects.filter((p) => p.project_status === 'IN_PROGRESS').length, color: 'text-primary' },
    { label: '已竣工', value: mockProjects.filter((p) => p.project_status === 'COMPLETED').length, color: 'text-success' },
  ];

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">项目管理</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight">所有项目</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            高级筛选
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            添加项目
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
              placeholder="搜索项目名称或位置..."
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
            {Object.entries(projectStatusConfig).map(([value, cfg]) => (
              <option key={value} value={value}>{cfg.text}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => {
          const statusConfig = projectStatusConfig[project.project_status];
          return (
            <div key={project.id} className="glass-panel rounded-2xl p-6 hover:border-primary/30 transition-all group cursor-pointer relative overflow-hidden">
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-surface-container to-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{project.project_name}</h3>
                    <p className="text-xs font-mono text-on-surface-variant">ID: {project.id} • {project.developer_name}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusConfig.color}`}>
                  {statusConfig.text}
                </span>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">位置</p>
                  <p className="text-sm font-medium text-on-surface flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {project.location}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">总建筑面积</p>
                  <p className="text-sm font-medium text-on-surface">{(project.total_built_area / 10000).toFixed(2)} 万㎡</p>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">项目预算</p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(project.total_budget)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">开始日期</p>
                  <p className="text-sm font-medium text-on-surface">{project.start_date}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">预计完工</p>
                  <p className="text-sm font-medium text-on-surface">{project.expected_completion}</p>
                </div>
              </div>

              <div className="relative z-10 flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-xs text-on-surface-variant font-mono flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  创建于 {new Date(project.created_at).toLocaleDateString('zh-CN')}
                </span>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-primary transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-primary transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-20 glass-panel rounded-2xl border-dashed border-2 border-white/10">
          <Building2 className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-on-surface">暂无项目</p>
          <p className="text-sm text-on-surface-variant mt-1">尝试修改筛选条件或添加新项目</p>
        </div>
      )}
    </div>
  );
}
