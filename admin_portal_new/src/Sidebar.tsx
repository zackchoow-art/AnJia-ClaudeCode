import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Megaphone,
  FileSignature,
  CheckSquare,
  Landmark,
  Wallet,
  Settings,
  History,
} from 'lucide-react';

interface SidebarProps {}

export default function Sidebar() {
  const location = useLocation();

  const navItems: { name: string; path: string; icon: any }[] = [
    { name: '仪表盘', path: '/dashboard', icon: LayoutDashboard },
    { name: '项目管理', path: '/projects', icon: FolderKanban },
    { name: '客户管理', path: '/customers', icon: Users },
    { name: '销售管理', path: '/sales', icon: Megaphone },
    { name: '合同管理', path: '/contracts', icon: FileSignature },
    { name: '付款审批', path: '/approvals', icon: CheckSquare },
    { name: '预算成本', path: '/budget', icon: Landmark },
    { name: '财务管理', path: '/finance', icon: Wallet },
  ];

  const bottomItems = [
    { name: '系统设置', path: '/settings', icon: Settings },
    { name: '审计日志', path: '/audit-logs', icon: History },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] border-r border-white/10 bg-surface-container-high/80 backdrop-blur-xl z-50 flex flex-col py-6 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
      {/* Logo */}
      <div
        className="px-6 mb-8 flex items-center gap-3 cursor-pointer transition-colors hover:bg-primary/10 rounded-xl mx-2"
        onClick={() => (window.location.href = '/dashboard')}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-bold text-lg">AJ</span>
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-on-surface tracking-tight">AETHER ADMIN</h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Management Portal v2.0</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              location.pathname === item.path || (location.pathname.includes(item.path.split('/')[1]) && item.path !== '/')
                ? 'bg-gradient-to-r from-primary/15 to-transparent text-primary font-medium shadow-[inset_4px_0_0_0_#3b82f6]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <item.icon
              className={`w-5 h-5 transition-colors ${
                location.pathname === item.path ? 'text-primary' : 'group-hover:text-on-surface opacity-70'
              }`}
            />
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
      </div>

      {/* Bottom Items */}
      <div className="mt-auto px-3 space-y-0.5 pt-4 border-t border-white/5">
        {bottomItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              location.pathname === item.path
                ? 'bg-gradient-to-r from-primary/15 to-transparent text-primary font-medium'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <item.icon
              className={`w-5 h-5 transition-colors ${
                location.pathname === item.path ? 'text-primary' : 'group-hover:text-on-surface opacity-70'
              }`}
            />
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}

        {/* User Profile */}
        <div className="mt-6 px-4 py-3 flex items-center gap-3 rounded-xl border border-white/10 bg-surface-container-lowest/50 hover:bg-surface-container-low transition-colors cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="User"
            className="w-9 h-9 rounded-full border-2 border-primary/30"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">Admin User</p>
            <p className="text-[10px] font-mono text-on-surface-variant truncate">ID: AE-ADMIN-001</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
