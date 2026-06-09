import { useState } from 'react';
import {
  History,
  User,
  FileText,
  FileCheck,
  Search,
} from 'lucide-react';
import { mockAuditLogs, formatDateTime } from '../utils/api';

export default function AuditLogs() {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const entityTypeConfig: Record<string, { color: string; text: string }> = {
    payment: { color: 'bg-primary/10 border-primary/20 text-primary', text: '付款' },
    contract: { color: 'bg-secondary/10 border-secondary/20 text-secondary', text: '合同' },
    customer: { color: 'bg-success/10 border-success/20 text-success', text: '客户' },
    project: { color: 'bg-warning/10 border-warning/20 text-warning', text: '项目' },
    cost_budget: { color: 'bg-tertiary/10 border-tertiary/20 text-tertiary', text: '预算' },
  };

  const actionConfig: Record<string, { color: string; icon: any }> = {
    CREATED: { color: 'text-primary', icon: FileText },
    UPDATED: { color: 'text-on-surface-variant', icon: FileText },
    APPROVED: { color: 'text-success', icon: FileCheck },
    REJECTED: { color: 'text-error', icon: FileCheck },
    SIGNED: { color: 'text-warning', icon: FileText },
    EXECUTED: { color: 'text-secondary', icon: FileCheck },
    DELETED: { color: 'text-error', icon: History },
  };

  const actorTypeConfig: Record<string, { color: string; text: string }> = {
    USER: { color: 'bg-primary/10 border-primary/20 text-primary', text: '用户' },
    AGENT: { color: 'bg-warning/10 border-warning/20 text-warning', text: 'AI代理' },
    SYSTEM: { color: 'bg-outline/10 border-outline/20 text-on-surface-variant', text: '系统' },
  };

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.actor_name?.includes(searchText) ||
      log.entity_id.includes(searchText);
    const matchesType =
      filterType === '' || log.entity_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">审计日志</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight">系统操作日志</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: '今日操作', value: mockAuditLogs.filter(l => new Date().toDateString() === new Date(l.timestamp).toDateString()).length, color: 'text-primary' },
          { label: '用户操作', value: mockAuditLogs.filter(l => l.actor_type === 'USER').length, color: 'text-success' },
          { label: '系统操作', value: mockAuditLogs.filter(l => l.actor_type === 'SYSTEM').length, color: 'text-secondary' },
        ].map((stat, idx) => (
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
              placeholder="搜索操作人或实体ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors min-w-[160px]"
          >
            <option value="">全部类型</option>
            {Object.keys(entityTypeConfig).map((type) => (
              <option key={type} value={type}>{entityTypeConfig[type].text}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">时间</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">操作人</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">实体类型</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">操作</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">实体ID</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">原因</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLogs.map((log, index) => {
              const entityConfig = entityTypeConfig[log.entity_type];
              const actionConfigItem = actionConfig[log.action];
              const actorConfig = actorTypeConfig[log.actor_type];

              return (
                <tr
                  key={index}
                  onClick={() => {
                    setSelectedLog(log);
                    setShowDetails(true);
                  }}
                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${actorConfig.color}`}>
                        {actorConfig.text}
                      </span>
                      <span className="font-medium text-on-surface">{log.actor_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${entityConfig.color}`}>
                      {entityConfig.text}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      {actionConfigItem?.icon && (
                        <actionConfigItem.icon className={`w-3.5 h-3.5 ${actionConfigItem.color}`} strokeWidth={2} />
                      )}
                      <span className={`font-medium ${actionConfigItem?.color || 'text-on-surface'}`}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-on-surface">{log.entity_id}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant truncate max-w-[200px]">
                    {log.reason || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/10 bg-surface-container/50 flex justify-between items-center">
          <p className="text-xs text-on-surface-variant">显示 {filteredLogs.length} 条审计日志</p>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 rounded-lg text-sm text-on-surface-variant opacity-50 cursor-not-allowed">上一页</button>
            <span className="text-xs font-bold text-primary">1 / 6</span>
            <button className="px-3 py-1 rounded-lg text-sm text-on-surface-variant hover:bg-white/5 transition-colors">下一页</button>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
          <div className="glass-panel rounded-2xl w-full max-w-lg relative z-10 shadow-2xl border-white/10 overflow-hidden">
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="p-6">
              <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                日志详情
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-on-surface-variant block mb-1">操作时间</span>
                    <p className="font-mono text-sm text-on-surface">{formatDateTime(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant block mb-1">操作人类型</span>
                    {(() => {
                      const config = actorTypeConfig[selectedLog.actor_type];
                      return config ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${config.color}`}>{config.text}</span>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <span className="text-xs text-on-surface-variant block mb-2">操作人</span>
                  <p className="font-medium text-on-surface">{selectedLog.actor_name}</p>
                  {selectedLog.actor_id && (
                    <p className="font-mono text-xs text-on-surface-variant mt-1">ID: {selectedLog.actor_id}</p>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <span className="text-xs text-on-surface-variant block mb-2">实体信息</span>
                  <div className="flex gap-2 mb-1">
                    {(() => {
                      const config = entityTypeConfig[selectedLog.entity_type];
                      return config ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${config.color}`}>{config.text}</span>
                      ) : null;
                    })()}
                  </div>
                  <p className="font-mono text-sm text-on-surface mt-1">ID: {selectedLog.entity_id}</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <span className="text-xs text-on-surface-variant block mb-2">操作类型</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const config = actionConfig[selectedLog.action];
                      return config ? (
                        <span className={`font-medium ${config.color}`}>{selectedLog.action}</span>
                      ) : null;
                    })()}
                  </div>
                </div>

                {selectedLog.reason && (
                  <div className="border-t border-white/10 pt-4 bg-primary/5 rounded-lg p-4">
                    <span className="text-xs text-on-surface-variant block mb-2">操作原因</span>
                    <p className="text-sm text-on-surface">{selectedLog.reason}</p>
                  </div>
                )}

                {selectedLog.change_details && (
                  <div className="border-t border-white/10 pt-4">
                    <span className="text-xs text-on-surface-variant block mb-2">变更详情</span>
                    <pre className="text-[10px] font-mono bg-black/30 p-3 rounded-lg overflow-x-auto border border-white/5 text-primary max-h-48 custom-scrollbar">
                      {JSON.stringify(selectedLog.change_details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-surface-container/50 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-dark transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
