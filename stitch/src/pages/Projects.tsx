import { useEffect, useState } from 'react';
import {
  Filter,
  Plus,
  Building2,
  PencilRuler,
  CheckCircle2,
  ArrowRight,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { Project, Contract } from '../types/database';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export default function Projects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, set合同] = useState<Contract[]>([]);

  // 获取 setActivePage 函数（从 window 全局事件总线）
  const handleCreateProject = () => {
    // 触发自定义事件通知 App.tsx 切换到项目表单页面
    const event = new CustomEvent('navigateTo', { detail: { page: 'ProjectsForm' } });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: projData, error: projError } = await supabase
        .from<Project>('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projError) {
        console.error('Error loading projects:', projError);
      } else {
        setProjects(projData || []);
      }

      // Load related contracts
      const { data: contractData } = await supabase.from<Contract>('contracts').select('*');
      set合同(contractData || []);

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

  const getProject合同 = (projectId: string) => {
    return contracts.filter((c) => c.project_id === projectId);
  };

  const getProject状态Color = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'text-on-surface-variant';
      case 'IN_PROGRESS':
        return 'text-primary';
      case 'COMPLETED':
        return 'text-success';
      default:
        return 'text-on-surface-variant';
    }
  };

  const getProject状态Label = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return '规划中';
      case 'IN_PROGRESS':
        return '施工中';
      case 'COMPLETED':
        return '已完成';
      default:
        return status;
    }
  };

  return (
    <div className="p-4 md:p-8 flex-1 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <div>
          <h2 className="text-3xl lg:text-5xl font-bold text-on-surface mb-1 tracking-tight">活跃项目</h2>
          <p className="text-sm text-on-surface-variant">
            管理和监控进行中的开发生命周期。 总计：{projects.length} 个项目
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-colors uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={handleCreateProject}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors uppercase tracking-wider shadow-[0_4px_14px_0_rgba(0,209,255,0.39)]"
          >
            <Plus className="w-4 h-4" />
            新项目
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '总预算', value: `$${projects.reduce((acc, p) => acc + (p.total_budget || 0), 0) / 1000000}M`, icon: Building2 },
          { label: '进行中', value: projects.filter((p) => p.project_status === 'IN_PROGRESS').length.toString(), icon: PencilRuler },
          { label: '规划中', value: projects.filter((p) => p.project_status === 'PLANNING').length.toString(), icon: FileText },
          { label: 'Completed', value: projects.filter((p) => p.project_status === 'COMPLETED').length.toString(), icon: CheckCircle2 },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-on-surface mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="glass-panel rounded-xl p-6 hover:border-primary/40 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-outline-variant/30 group-hover:border-primary group-hover:text-primary transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface leading-tight">{project.project_name}</h3>
                  <p className="font-mono text-xs text-on-surface-variant mt-1">ID: {project.id.substring(0, 8)}...</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  project.project_status === 'IN_PROGRESS'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : project.project_status === 'PLANNING'
                    ? 'bg-secondary-container text-secondary border border-secondary/20'
                    : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                }`}
              >
                {getProject状态Label(project.project_status)}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              {/* 位置 */}
              <div className="flex items-start gap-2 text-sm text-on-surface-variant">
                <PencilRuler className="w-4 h-4 mt-0.5" />
                <span className="line-clamp-1">{project.location}</span>
              </div>

              {/* Progress Bar */}
              {project.project_status === 'IN_PROGRESS' && (
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-on-surface-variant">施工进度</span>
                    <span className="text-primary font-bold">{Math.floor(Math.random() * 30 + 50)}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative"
                      style={{ width: `${Math.floor(Math.random() * 30 + 50)}%` }}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/40 to-transparent"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 预算信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">总预算</p>
                  <p className="font-mono font-semibold text-sm">${(project.total_budget || 0).toLocaleString()}</p>
                </div>
                <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">合同</p>
                  <p className="font-mono font-semibold text-sm">{getProject合同(project.id).length}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
              <div className="text-xs text-on-surface-variant flex gap-3">
                <span>开始日期: {new Date(project.start_date).toLocaleDateString()}</span>
                <span>完成日期: {new Date(project.expected_completion).toLocaleDateString()}</span>
              </div>
              <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                查看详情 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects Table */}
      {projects.length > 0 && (
        <section className="glass-panel rounded-xl overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface/50">
            <h3 className="text-lg font-semibold text-on-surface">所有项目</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container/50">
              <tr className="text-xs text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4">项目名称</th>
                <th className="px-6 py-4">位置</th>
                <th className="px-6 py-4">状态</th>
                <th className="px-6 py-4 text-right">预算</th>
                <th className="px-6 py-4 text-center">合同</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/20">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 font-medium text-on-surface">{project.project_name}</td>
                  <td className="px-6 py-4 text-on-surface-variant truncate max-w-[200px]">{project.location}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        project.project_status === 'IN_PROGRESS'
                          ? 'bg-primary/5 text-primary border-primary/20'
                          : project.project_status === 'PLANNING'
                          ? 'bg-secondary-container/5 text-secondary border-secondary/20'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                      }`}
                    >
                      {getProject状态Label(project.project_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-primary">${(project.total_budget || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-surface-container px-2.5 py-1 rounded text-sm border border-outline-variant/30">
                      {getProject合同(project.id).length}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
