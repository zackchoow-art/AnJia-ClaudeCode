import { Search, Bell, Settings as SettingsIcon } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] h-16 z-40 bg-surface/70 backdrop-blur-xl border-b border-white/10 shadow-lg flex justify-between items-center px-8 transition-all duration-300">
      {/* Search Bar */}
      <div className="flex items-center w-full max-w-xl relative">
        <Search className="absolute left-4 w-5 h-5 text-on-surface-variant/60" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="搜索项目、客户或合同..."
          className="w-full bg-white/5 backdrop-blur-md border border-white/20 text-on-surface text-sm rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 shadow-inner transition-all placeholder:text-on-surface-variant/50"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications */}
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/10 transition-colors relative group">
          <Bell className="w-5 h-5" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface shadow-sm animate-pulse"></span>
        </button>

        {/* Settings */}
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/10 transition-colors">
          <SettingsIcon className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 hover:bg-white/5 px-2 py-1 rounded-lg transition-colors cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="User"
            className="w-9 h-9 rounded-full border border-white/20 shadow-sm"
          />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-on-surface leading-none">Admin</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5 leading-none">super admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
