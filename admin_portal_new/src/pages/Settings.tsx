import { useState } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Settings as SettingsIcon,
} from 'lucide-react';

export default function Settings() {
  const [environmentName, setEnvironmentName] = useState('Aether Prod-East-01');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30 Minutes');
  const [mfaEnabled, setMfaEnabled] = useState(true);

  // System Audit Logs
  const auditLogs = [
    { timestamp: '2025-06-07 14:32:01', event: 'CONFIG_UPDATE', user: 'E. Vance (Admin)', resource: 'srv_env_prod_01', status: 'success' },
    { timestamp: '2025-06-07 14:15:22', event: 'AUTH_LOGIN', user: 'M. Robinson', resource: '-', status: 'success' },
    { timestamp: '2025-06-07 13:42:09', event: 'POLICY_DENY', user: 'Service Account', resource: 'db_cluster_read', status: 'failed' },
    { timestamp: '2025-06-07 11:05:44', event: 'DATA_EXPORT', user: 'J. Kelly (Analyst)', resource: 'q3_financial_rpt', status: 'success' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <span className="text-xs font-bold text-success border border-success/20 px-2 py-0.5 rounded-full flex items-center gap-1 bg-success/10">Success</span>;
    }
    return <span className="text-xs font-bold text-error border border-error/20 px-2 py-0.5 rounded-full flex items-center gap-1 bg-error/10">Failed</span>;
  };

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">系统设置</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight">System Preferences</h1>
        </div>
      </div>

      {/* Config Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Settings Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-xl p-6 h-full border border-white/10 sticky top-24">
            <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              Configuration
            </h2>

            {/* General Settings */}
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">General</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Environment Name</label>
                    <input
                      type="text"
                      value={environmentName}
                      onChange={(e) => setEnvironmentName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm font-medium text-on-surface">Maintenance Mode</span>
                    <button
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${maintenanceMode ? 'bg-primary' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="pt-4 border-t border-white/5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">Security</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Session Timeout</label>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                    >
                      <option>30 Minutes</option>
                      <option>1 Hour</option>
                      <option>4 Hours</option>
                      <option>8 Hours</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="text-sm font-medium text-on-surface">Require MFA for Admins</span>
                    <button
                      onClick={() => setMfaEnabled(!mfaEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${mfaEnabled ? 'bg-primary shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${mfaEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/5 flex gap-3">
                <button
                  onClick={() => {
                    setEnvironmentName('Aether Prod-East-01');
                    setMaintenanceMode(false);
                    setSessionTimeout('30 Minutes');
                    setMfaEnabled(true);
                  }}
                  className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg hover:bg-white/5 text-sm font-semibold transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => alert('Settings saved!')}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Audit Logs */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-xl flex flex-col h-[600px] overflow-hidden border border-white/10 shadow-xl">
            <div className="px-6 py-4 border-b border-white/10 bg-surface-container/50 backdrop-blur-md flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-on-surface">System Audit Trail</h2>
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-mono rounded-full border border-secondary/30 animate-pulse">LIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-on-surface-variant">
                  <History className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-on-surface-variant">
                  <div className="w-4 h-4 border border-current rounded-[2px]"></div>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-surface-container-lowest/30 custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-white/5 backdrop-blur-md border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Event Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">User / Actor</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Target Resource</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant flex items-center gap-2 whitespace-nowrap">
                        <span className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-primary animate-pulse' : 'bg-white/20'}`}></span>
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 font-mono text-on-surface">{log.event}</span>
                      </td>
                      <td className="px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap">
                        {log.user.includes('Admin') ? (
                          <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">AE</div>
                        ) : log.user.includes('Service Account') ? (
                          <div className="w-6 h-6 rounded bg-surface-container-high border border-white/5 flex items-center justify-center text-[9px] font-mono text-on-surface-variant shrink-0">SA</div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-secondary/10 border border-secondary/20 flex items-center justify-center text-[9px] font-bold text-secondary shrink-0">{log.user.charAt(0)}</div>
                        )}
                        {log.user}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">{log.resource}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-white/10 bg-surface-container/50 backdrop-blur-md flex justify-between items-center text-xs text-on-surface-variant z-10">
              <span>Showing 1-4 of 2,491 events</span>
              <div className="flex items-center gap-2 font-mono">
                <button className="px-3 py-1 rounded hover:bg-white/5 disabled:opacity-50" disabled>&lt;</button>
                <span className="text-primary font-bold">Page 1 / 623</span>
                <button className="px-3 py-1 rounded hover:bg-white/5">&gt;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
