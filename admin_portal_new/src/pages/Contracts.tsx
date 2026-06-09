import { useState } from 'react';
import {
  Plus,
  FileSignature,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { mockContracts, formatCurrency } from '../utils/api';

export default function Contracts() {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const contractTypeConfig: Record<string, { color: string; text: string }> = {
    SUPPLIER: { color: 'bg-primary/10 border-primary/20 text-primary', text: '供应商' },
    CONTRACTOR: { color: 'bg-secondary/10 border-secondary/20 text-secondary', text: '承包商' },
    SALES: { color: 'bg-warning/10 border-warning/20 text-warning', text: '销售' },
    CONSULTANT: { color: 'bg-success/10 border-success/20 text-success', text: '顾问' },
  };

  const contractStatusConfig: Record<string, { color: string; text: string }> = {
    DRAFT: { color: 'text-outline bg-outline/10 border-outline/20', text: '草稿' },
    PENDING_SIGN: { color: 'text-warning bg-warning/10 border-warning/20', text: '待签署' },
    SIGNED: { color: 'text-success bg-success/10 border-success/20', text: '已签署' },
    ACTIVATED: { color: 'text-primary bg-primary/10 border-primary/20', text: '已生效' },
    COMPLETED: { color: 'text-secondary bg-secondary/10 border-secondary/20', text: '已完成' },
    TERMINATED: { color: 'text-error bg-error/10 border-error/20', text: '已终止' },
  };

  const filteredContracts = mockContracts.filter((c) => {
    const matchesSearch =
      c.contract_code.includes(searchText) ||
      c.contract_name.includes(searchText);
    const matchesStatus =
      filterStatus === '' || c.contract_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Recent Contracts List
  const recentContracts = filteredContracts.slice(0, 5);

  const getContractBadge = (status: string) => {
    const config = contractStatusConfig[status];
    if (!config) return null;
    return <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${config.color}`}>{config.text}</span>;
  };

  return (
    <div className="animate-fade-in-up max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">合同管理</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight">合同仓库</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 text-on-surface rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建合同
          </button>
        </div>
      </div>

      {/* Contract Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '合同总数', value: mockContracts.length, color: 'text-primary' },
          { label: '已签署', value: mockContracts.filter((c) => c.contract_status === 'SIGNED').length, color: 'text-success' },
          { label: '生效中', value: mockContracts.filter((c) => ['ACTIVATED', 'COMPLETED'].includes(c.contract_status)).length, color: 'text-secondary' },
          { label: '总金额', value: formatCurrency(mockContracts.reduce((sum, c) => sum + c.total_amount, 0)), color: 'text-tertiary' },
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
              placeholder="搜索合同编号或名称..."
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
            {Object.entries(contractStatusConfig).map(([value, cfg]) => (
              <option key={value} value={value}>{cfg.text}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recent Contracts */}
      <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
        <FileSignature className="w-5 h-5 text-primary" />
        最近合同
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {recentContracts.map((contract) => {
          const statusConfig = contractStatusConfig[contract.contract_status];
          return (
            <div
              key={contract.id}
              onClick={() => setSelectedContract(contract)}
              className="glass-panel rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden group"
            >
              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <FileSignature className="w-6 h-6" />
                  </div>
                  {getContractBadge(contract.contract_status)}
                </div>

                <h4 className="font-semibold text-on-surface mb-2">{contract.contract_name}</h4>
                <p className="text-xs text-on-surface-variant mb-4 font-mono">ID: {contract.contract_code}</p>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">合作方</span>
                    <span className="font-medium text-primary">{contract.counterparty_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">合同金额</span>
                    <span className="font-bold text-on-surface">{formatCurrency(contract.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">类型</span>
                    <span className={`px-2 py-0.5 rounded bg-white/10 text-xs font-medium`}>{contractTypeConfig[contract.contract_type].text}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Contract Table */}
      <h3 className="text-lg font-bold text-on-surface mb-4">全部合同列表</h3>
      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">编号</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">合同名称</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">合作方</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">类型</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">金额</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredContracts.map((contract) => (
              <tr
                key={contract.id}
                onClick={() => setSelectedContract(contract)}
                className="hover:bg-primary/5 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-mono text-sm text-on-surface">{contract.contract_code}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-on-surface group-hover:text-primary transition-colors">{contract.contract_name}</p>
                  <p className="text-xs text-on-surface-variant mt-1">ID: {contract.id}</p>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface">{contract.counterparty_name}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded bg-white/10 border border-white/5`}>{contractTypeConfig[contract.contract_type].text}</span>
                </td>
                <td className="px-6 py-4">
                  {getContractBadge(contract.contract_status)}
                </td>
                <td className="px-6 py-4 font-mono text-on-surface">{formatCurrency(contract.total_amount)}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-primary transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedContract(null)}></div>
          <div className="glass-panel rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl border-primary/30">
            <button
              onClick={() => setSelectedContract(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-on-surface">{selectedContract.contract_name}</h2>
                  <p className="text-sm text-on-surface-variant mt-1">ID: {selectedContract.contract_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <span className="text-xs text-on-surface-variant uppercase tracking-widest block mb-2">合同金额</span>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedContract.total_amount)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <span className="text-xs text-on-surface-variant uppercase tracking-widest block mb-2">状态</span>
                  {getContractBadge(selectedContract.contract_status)}
                </div>
              </div>

              <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider border-b border-white/10 pb-2">合同信息</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-on-surface-variant">合作方</span>
                  <span className="font-medium text-on-surface">{selectedContract.counterparty_name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-on-surface-variant">合同类型</span>
                  <span className={`font-medium px-2 py-0.5 rounded bg-white/10 text-on-surface`}>{contractTypeConfig[selectedContract.contract_type].text}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-on-surface-variant">创建日期</span>
                  <span className="font-mono text-sm text-on-surface">{new Date(selectedContract.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>

              {selectedContract.signed_date && (
                <>
                  <h3 className="text-sm font-bold text-on-surface mb-4 mt-8 uppercase tracking-wider border-b border-white/10 pb-2">签署信息</h3>
                  <div className="bg-success/5 rounded-lg p-4 border border-success/20 flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                    <div>
                      <p className="text-sm font-medium text-on-surface">合同已签署</p>
                      <p className="text-xs text-on-surface-variant mt-1">签署日期: {selectedContract.signed_date}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-surface-container/50 backdrop-blur-md flex justify-end gap-3">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 rounded-lg hover:bg-white/5 text-on-surface transition-colors"
              >
                关闭
              </button>
              <button className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-dark shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2 transition-all">
                <Download className="w-4 h-4" /> 下载合同
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
