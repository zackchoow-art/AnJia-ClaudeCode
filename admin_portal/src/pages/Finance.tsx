import { useEffect, useState } from 'react';
import {
  Download,
  Plus,
  Landmark,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  PieChart,
  MoreHorizontal,
  Table as TableIcon,
  Calendar,
  CheckSquare,
  Info,
  XCircle,
  Check,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import {
  getPaymentSummary,
  getContractStats,
} from '../services/api';
import type { Payment, CostBudget, CostLedger, Contract } from '../types/database';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export default function Finance() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [budgets, setBudgets] = useState<CostBudget[]>([]);
  const [ledgers, setLedgers] = useState<CostLedger[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: paymentsData } = await supabase.from<Payment>('payments').select('*');
      setPayments(paymentsData || []);

      const { data: budgetsData } = await supabase.from<CostBudget>('cost_budget').select('*');
      setBudgets(budgetsData || []);

      const { data: ledgersData } = await supabase.from<CostLedger>('cost_ledger').select('*');
      setLedgers(ledgersData || []);

      const { data: contractsData } = await supabase.from<Contract>('contracts').select('*');
      setContracts(contractsData || []);

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

  // Calculate totals
  const totalBudget = budgets.reduce((acc, b) => acc + (b.budgeted_amount || 0), 0);
  const totalSpent = ledgers.reduce((acc, l) => acc + (l.cost_amount || 0), 0);
  const pendingAmount = payments
    .filter((p) => p.payment_status === 'PENDING')
    .reduce((acc, p) => acc + (p.payment_amount || 0), 0);

  // Get cost breakdown by category
  const getCostBy类别 = (category: string) => {
    return budgets
      .filter((b) => b.cost_category === category)
      .reduce((acc, b) => acc + b.budgeted_amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-8 flex-1 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight mb-1">财务与成本管理</h2>
          <p className="text-sm text-on-surface-variant">
            Real-time budget tracking, cost control, and payment processing.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={loadData}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-colors uppercase tracking-wider"
          >
            <Download className="w-4 h-4" /> 刷新数据
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-tr from-primary to-[#00556B] text-on-primary text-xs font-bold rounded-lg hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] transition-all uppercase tracking-wider">
            <Plus className="w-4 h-4" /> 新付款
          </button>
        </div>
      </div>

      {/* Top Value KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-on-surface-variant flex items-center gap-2 uppercase tracking-widest"><Landmark className="w-4 h-4" /> 总预算</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold tracking-wider">FY 2024</span>
          </div>
          <h3 className="text-4xl font-bold text-on-surface mb-1 tracking-tight">{formatCurrency(totalBudget)}</h3>
          <p className="text-xs text-on-surface-variant font-mono">批准的资金已分配</p>
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-on-surface-variant flex items-center gap-2 uppercase tracking-widest"><ShoppingCart className="w-4 h-4" /> 总支出</span>
          </div>
          <h3 className="text-4xl font-bold text-on-surface mb-1 tracking-tight">{formatCurrency(totalSpent)}</h3>
          <p className="text-xs text-secondary font-mono flex items-center gap-1">
            {totalBudget > 0 && ((totalSpent / totalBudget) * 100).toFixed(1)}% of total budget
          </p>
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between border-tertiary/20 bg-tertiary/5">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-tertiary flex items-center gap-2 uppercase tracking-widest"><AlertCircle className="w-4 h-4" /> 待审批</span>
          </div>
          <h3 className="text-4xl font-bold text-tertiary mb-1 tracking-tight">{formatCurrency(pendingAmount)}</h3>
          <p className="text-xs text-tertiary/80 font-mono">
            {payments.filter((p) => p.payment_status === 'PENDING').length} open requests
          </p>
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between bg-gradient-to-br from-surface to-surface-container relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-sm font-bold text-on-surface-variant flex items-center gap-2 uppercase tracking-widest"><TrendingUp className="w-4 h-4" /> 预测 (EAC)</span>
          </div>
          <h3 className="text-4xl font-bold text-primary mb-1 tracking-tight relative z-10">
            {formatCurrency(totalSpent * 1.1)} {/* Simple forecast */}
          </h3>
          <p className="text-xs text-primary/80 font-mono flex items-center gap-1 relative z-10">
            Under budget by {(totalBudget - totalSpent * 1.1).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Middle Section: Cost Breakdown & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        {/* Chart Placeholder */}
        <section className="lg:col-span-4 glass-panel rounded-xl p-6 flex flex-col items-center justify-center">
          <div className="w-full flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2"><PieChart className="w-4 h-4 text-primary" /> 成本结构</h3>
            <button className="text-on-surface-variant hover:text-primary"><MoreHorizontal className="w-4 h-4" /></button>
          </div>

          {/* CSS Faux Chart */}
          <div className="relative w-48 h-48 rounded-full border-8 border-surface-container flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-primary border-r-primary rotate-[15deg] opacity-80"></div>
            <div className="absolute inset-0 rounded-full border-8 border-transparent border-b-secondary rotate-[45deg] opacity-80"></div>
            <div className="absolute inset-0 rounded-full border-8 border-transparent border-l-tertiary -rotate-[15deg] opacity-60"></div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-on-surface">{budgets.length}</span>
              <span className="block text-[10px] font-mono text-on-surface-variant uppercase">成本中心</span>
            </div>
          </div>

          <div className="w-full space-y-3 px-4">
            {['LAND', 'CONSTRUCTION', 'SALES', 'TAX', 'OVERHEAD'].map((cat) => {
              const amount = getCostBy类别(cat);
              const percentage = totalBudget > 0 ? ((amount / totalBudget) * 100).toFixed(0) : '0';
              const colors: any = { LAND: 'primary', CONSTRUCTION: 'secondary', SALES: 'tertiary', TAX: 'outline', OVERHEAD: 'on-surface-variant' };
              return (
                <div key={cat} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm bg-${colors[cat]}`}></div>
                    <span className="text-on-surface capitalize">{cat.replace('_', ' ')}</span>
                  </div>
                  <span className="font-mono text-on-surface-variant">{amount.toLocaleString()} ({percentage}%)</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 预算与实际 Table */}
        <section className="lg:col-span-8 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-surface-variant bg-surface/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2"><TableIcon className="w-4 h-4 text-primary" /> 预算与实际</h3>
            <div className="flex items-center gap-2 bg-surface-container/50 px-3 py-1 rounded text-xs font-mono text-on-surface-variant border border-outline-variant/30">
              <span>View: Project Level</span>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-surface-variant bg-surface/30">
                  <th className="text-[10px] text-on-surface-variant uppercase tracking-widest py-3 px-6 font-bold">类别</th>
                  <th className="text-[10px] text-on-surface-variant uppercase tracking-widest py-3 px-6 font-bold">原始预算</th>
                  <th className="text-[10px] text-on-surface-variant uppercase tracking-widest py-3 px-6 font-bold">实际支出</th>
                  <th className="text-[10px] text-on-surface-variant uppercase tracking-widest py-3 px-6 font-bold">差异</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono">
                {budgets.map((budget, i) => {
                  const spent = ledgers
                    .filter((l) => l.cost_budget_id === budget.id)
                    .reduce((acc, l) => acc + (l.cost_amount || 0), 0);
                  const variance = ((spent - budget.budgeted_amount) / budget.budgeted_amount) * 100;

                  return (
                    <tr key={budget.id} className="border-b border-surface-variant/50 hover:bg-surface/50 transition-colors group">
                      <td className="py-4 px-6 font-sans font-medium text-on-surface">{budget.cost_category}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{formatCurrency(budget.budgeted_amount)}</td>
                      <td className="py-4 px-6 text-on-surface">{formatCurrency(spent)}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            variance > 10
                              ? 'bg-error/10 text-error border border-error/20'
                              : variance > 0
                              ? 'bg-secondary/10 text-secondary border border-secondary/20'
                              : 'bg-success/10 text-success border border-success/20'
                          }`}
                        >
                          {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Bottom Section: Actionable Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 pb-6">
        {/* Payment Schedule */}
        <section className="glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-surface-variant bg-surface/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2"><Calendar className="w-4 h-4 text-secondary" /> 待付款项</h3>
            <button
              onClick={loadData}
              className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
            >
              查看日历
            </button>
          </div>
          <div className="p-4 space-y-3">
            {payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg border border-outline-variant/30 bg-surface/60 hover:bg-surface transition-colors cursor-pointer">
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded bg-surface-container border border-outline-variant/30">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{new Date(payment.payment_date).toLocaleString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-on-surface leading-none">{new Date(payment.payment_date).getDate()}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface truncate max-w-[200px]">{payment.contract_id ? `Contract Payment #${payment.id.substring(0, 8)}` : 'Payment'}</h4>
                    <p className="text-[10px] font-mono text-on-surface-variant mt-1">
                      Amount: {formatCurrency(payment.payment_amount)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                      payment.payment_status === 'PENDING'
                        ? 'bg-warning/10 text-warning border border-warning/20'
                        : payment.payment_status === 'APPROVED'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-outline-variant/20 text-on-surface-variant'
                    }`}
                  >
                    {payment.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Ledgers */}
        <section className="glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-surface-variant bg-surface/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" /> 最近支出</h3>
            <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold border border-secondary/20">
              {ledgers.length} entries
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {ledgers.slice(0, 10).map((ledger) => (
              <div key={ledger.id} className="p-4 hover:bg-surface/40 transition-colors border-b border-outline-variant/20 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-on-surface">{ledger.cost_description}</h4>
                  <span className="font-mono text-primary">{formatCurrency(ledger.cost_amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-on-surface-variant">{new Date(ledger.cost_date).toLocaleDateString()}</p>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-widest ${
                      ledger.verification_status === 'VERIFIED'
                        ? 'bg-success/10 text-success border border-success/20'
                        : 'bg-warning/10 text-warning border border-warning/20'
                    }`}
                  >
                    {ledger.verification_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
