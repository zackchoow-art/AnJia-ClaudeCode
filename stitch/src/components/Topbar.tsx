import { Search, Bell, Settings as SettingsIcon, Grid } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-16 z-40 bg-surface/70 backdrop-blur-xl border-b border-white/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] flex justify-between items-center px-8 transition-colors">
      <div className="flex items-center w-96 relative">
        <Search className="absolute left-3 w-4 h-4 text-outline-variant" />
        <input
          type="text"
          placeholder="搜索项目、合同或数据..."
          className="w-full bg-white/50 backdrop-blur-md border border-white/60 text-on-surface text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-outline-variant"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/60 transition-colors relative">
          <Bell className="w-5 h-5" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface shadow-sm"></span>
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/60 transition-colors">
          <SettingsIcon className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/60 transition-colors">
          <Grid className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
