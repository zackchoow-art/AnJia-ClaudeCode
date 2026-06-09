import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Tags,
  HardHat,
  FileSignature,
  CheckSquare,
  Wallet,
  Settings,
  History
} from 'lucide-react';
import { PageView } from '../App';

interface SidebarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
}

export default function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const navItems = [
    { name: '仪表盘', icon: LayoutDashboard },
    { name: '项目', icon: FolderKanban },
    { name: '组织', icon: Building2 },
    { name: '销售', icon: Tags },
    { name: '工程', icon: HardHat },
    { name: '合同', icon: FileSignature },
    { name: '审批', icon: CheckSquare },
    { name: '财务', icon: Wallet },
  ];

  const bottomItems = [
    { name: '设置', icon: Settings },
    { name: '审计日志', icon: History },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-[240px] border-r border-white/40 bg-surface/80 backdrop-blur-xl z-50 flex flex-col py-6 shadow-[0_0_15px_rgba(0,209,255,0.05)]">
      <div className="px-6 mb-8 flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('仪表盘')}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-primary tracking-tighter leading-tight">安家地产</h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-mono">管理系统 v2.0</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActivePage(item.name as PageView)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              activePage === item.name
                ? 'bg-primary/10 text-primary font-medium shadow-[inset_4px_0_0_0_#00d1ff] bg-gradient-to-r from-primary/10 to-transparent'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low hover:translate-x-1'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activePage === item.name ? 'text-primary' : 'text-on-surface-variant opacity-70'}`} strokeWidth={activePage === item.name ? 2 : 1.5} />
            <span className="text-sm">{item.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto px-2 space-y-1 pt-4 border-t border-surface-variant">
        {bottomItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActivePage(item.name as PageView)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              activePage === item.name
                ? 'bg-primary/10 text-primary font-medium shadow-[inset_4px_0_0_0_#00d1ff]'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low hover:translate-x-1'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activePage === item.name ? 'text-primary' : 'text-on-surface-variant opacity-70'}`} strokeWidth={activePage === item.name ? 2 : 1.5} />
            <span className="text-sm">{item.name}</span>
          </button>
        ))}
        
        <div className="mt-4 px-4 py-3 flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/50">
           <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="User" 
            className="w-8 h-8 rounded-full border border-primary/20"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">张三</p>
            <p className="text-[10px] font-mono text-on-surface-variant truncate">工号: AE-8492</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
