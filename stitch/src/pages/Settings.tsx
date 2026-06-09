import { History, Search, Filter, Download, CheckCircle, XCircle, Settings2, Activity } from 'lucide-react';

export default function SettingsView() {
  return (
    <div className="h-[calc(100vh-64px)] grid grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto">
      
      {/* Left Pane: Config Form */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-xl flex flex-col h-full">
           <div className="mb-6 border-b border-surface-variant pb-4">
              <h2 className="text-2xl font-bold text-on-surface mb-1">系统设置</h2>
              <p className="text-sm text-on-surface-variant">管理和安全配置</p>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
              {/* 常规组 */}
              <div className="space-y-4">
                 <h4 className="text-xs font-bold tracking-widest uppercase text-primary">常规</h4>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">环境名称</label>
                    <input 
                      type="text" 
                      defaultValue="Aether Prod-East-01" 
                      className="w-full bg-surface-container/50 border border-outline-variant rounded-lg px-4 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">维护模式</label>
                    <div className="flex items-center justify-between p-3 border border-outline-variant bg-surface-container-lowest/50 rounded-lg">
                       <span className="text-sm text-on-surface-variant">限制非管理员访问</span>
                       {/* Toggle Switch */}
                       <button className="w-11 h-6 bg-surface-variant border border-outline-variant rounded-full relative transition-colors cursor-pointer">
                         <span className="absolute left-1 top-1 w-4 h-4 bg-outline rounded-full"></span>
                       </button>
                    </div>
                 </div>
              </div>

               {/* 安全组 */}
               <div className="space-y-4">
                 <h4 className="text-xs font-bold tracking-widest uppercase text-primary">Security</h4>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">会话超时</label>
                    <select className="w-full bg-surface-container/50 border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer">
                       <option>30 分钟</option>
                       <option>1 小时</option>
                       <option>4 小时</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">管理员需要多因素认证</label>
                    <div className="flex items-center justify-between p-3 border border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(0,209,255,0.05)] rounded-lg">
                       <span className="text-sm font-medium text-primary">全局强制执行</span>
                       {/* Active Toggle Switch */}
                       <button className="w-11 h-6 bg-primary rounded-full relative transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,209,255,0.3)] border border-primary-dark">
                         <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           <div className="pt-6 mt-4 border-t border-surface-variant flex gap-3 justify-end">
              <button className="px-4 py-2 border border-outline text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-variant transition-colors">取消</button>
              <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-md">保存更改</button>
           </div>
        </div>
      </div>

      {/* Right Pane: Audit Logs */}
      <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
         <div className="glass-panel rounded-xl flex flex-col h-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-surface-variant bg-white/40 flex justify-between items-center backdrop-blur-md z-10">
               <div className="flex items-center gap-2">
                 <History className="w-5 h-5 text-primary" />
                 <h2 className="text-xl font-bold text-on-surface">系统审计日志</h2>
                 <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-mono rounded-full ml-3 border border-secondary-container">实时</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input 
                      type="text" 
                      placeholder="搜索事件ID或用户..." 
                      className="pl-9 pr-4 py-1.5 bg-surface-container/50 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary transition-all w-[240px]"
                    />
                  </div>
                  <button className="p-1.5 border border-outline-variant rounded hover:text-primary hover:border-primary transition-colors text-on-surface-variant bg-white/50"><Filter className="w-4 h-4" /></button>
                  <button className="p-1.5 border border-outline-variant rounded hover:text-primary hover:border-primary transition-colors text-on-surface-variant bg-white/50"><Download className="w-4 h-4" /></button>
               </div>
            </div>

            <div className="flex-1 overflow-auto bg-surface-container-lowest/50">
               <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white/90 backdrop-blur-md shadow-sm z-10 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant">
                     <tr>
                        <th className="px-6 py-4 whitespace-nowrap">时间戳</th>
                        <th className="px-6 py-4 whitespace-nowrap">事件类型</th>
                        <th className="px-6 py-4 whitespace-nowrap">用户/操作人</th>
                        <th className="px-6 py-4 whitespace-nowrap">目标资源</th>
                        <th className="px-6 py-4 whitespace-nowrap text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant text-sm border-b border-surface-variant">
                     {/* Active Pulse Row */}
                     <tr className="hover:bg-primary/5 transition-colors group">
                        <td className="px-6 py-4 font-mono text-on-surface-variant text-xs flex items-center gap-2 whitespace-nowrap">
                           <span className="relative flex w-2 h-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                           </span>
                           2023-10-27 14:32:01
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="px-2 py-1 bg-surface-container text-on-surface rounded font-mono text-[10px] border border-outline-variant/30">CONFIG_UPDATE</span>
                        </td>
                        <td className="px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap">
                           <div className="w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-[10px] font-bold">ES</div>
                           Elena.S (Admin)
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">srv_env_prod_01</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                           <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold">
                              <CheckCircle className="w-4 h-4" /> Success
                           </span>
                        </td>
                     </tr>
                     {/* Normal Row */}
                     <tr className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-on-surface-variant text-xs pl-10 whitespace-nowrap">2023-10-27 14:15:22</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="px-2 py-1 bg-surface-container text-on-surface rounded font-mono text-[10px] border border-outline-variant/30">AUTH_LOGIN</span>
                        </td>
                        <td className="px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap">
                           <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold">MR</div>
                           Marcus.R
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">-</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                           <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold">
                              <CheckCircle className="w-4 h-4" /> Success
                           </span>
                        </td>
                     </tr>
                     {/* Error Row */}
                     <tr className="bg-error/5 hover:bg-error/10 transition-colors">
                        <td className="px-6 py-4 font-mono text-on-surface-variant text-xs pl-10 whitespace-nowrap">2023-10-27 13:42:09</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="px-2 py-1 bg-error-container text-on-error-container rounded font-mono text-[10px] border border-error/20">POLICY_DENY</span>
                        </td>
                        <td className="px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap">
                           <div className="w-6 h-6 rounded-full bg-surface-variant border border-outline flex items-center justify-center text-on-surface-variant">
                             <Settings2 className="w-3 h-3" />
                           </div>
                           Service Account
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">db_cluster_read</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                           <span className="inline-flex items-center gap-1 text-error text-xs font-semibold">
                              <XCircle className="w-4 h-4" /> Failed
                           </span>
                        </td>
                     </tr>
                     {/* Normal Row */}
                     <tr className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-on-surface-variant text-xs pl-10 whitespace-nowrap">2023-10-27 11:05:44</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="px-2 py-1 bg-surface-container text-on-surface rounded font-mono text-[10px] border border-outline-variant/30">DATA_EXPORT</span>
                        </td>
                        <td className="px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap">
                           <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold">JK</div>
                           Julia.K (Analyst)
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">q3_financial_rpt</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                           <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold">
                              <CheckCircle className="w-4 h-4" /> Success
                           </span>
                        </td>
                     </tr>
                     {/* System Row */}
                     <tr className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-on-surface-variant text-xs pl-10 whitespace-nowrap">2023-10-27 09:30:00</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="px-2 py-1 bg-surface-container text-on-surface rounded font-mono text-[10px] border border-outline-variant/30">SYSTEM_BACKUP</span>
                        </td>
                        <td className="px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap">
                           <div className="w-6 h-6 rounded-full bg-surface-variant border border-outline flex items-center justify-center text-on-surface-variant">
                             <Activity className="w-3 h-3" />
                           </div>
                           System Automator
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">vol_storage_a</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                           <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold">
                              <CheckCircle className="w-4 h-4" /> Success
                           </span>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="px-6 py-3 border-t border-surface-variant bg-white/40 flex justify-between items-center text-xs text-on-surface-variant font-medium z-10 backdrop-blur-md">
               <span>显示第 1-5 条，共 2,491 条事件</span>
               <div className="flex items-center gap-2 font-mono">
                  <button className="px-2 py-1 hover:text-primary disabled:opacity-50" disabled>&lt;</button>
                  <span>Page 1 / 499</span>
                  <button className="px-2 py-1 hover:text-primary">&gt;</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
