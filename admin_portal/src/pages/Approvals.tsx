import { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Download,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { Payment, Customer } from '../types/database';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export default function Approvals() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get pending payments for approval
      const { data: paymentData } = await supabase
        .from<Payment>('payments')
        .select('*')
        .in('payment_status', ['PENDING', 'APPROVED'])
        .order('created_at', { ascending: false });

      if (paymentData) {
        setPayments(paymentData);
      }

      const { data: customersData } = await supabase.from<Customer>('customers').select('*');
      setCustomers(customersData || []);

    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return 'N/A';
    const customer = customers.find((c) => c.id === customerId);
    return customer?.customer_name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingCount = payments.filter((p) => p.payment_status === 'PENDING').length;
  const inReviewCount = payments.filter((p) => p.payment_status === 'APPROVED' && !p.reviewed_by).length;
  const approved30dCount = payments.filter((p) => {
    const date = new Date(p.created_at);
    const now = new Date();
    return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 30 && p.payment_status === 'APPROVED';
  }).length;
  const rejectedCount = payments.filter((p) => p.payment_status === 'REJECTED').length;

  return (
    <div className="p-4 md:p-8 flex-1 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
        <div>
          <h2 className="text-3xl lg:text-5xl font-bold text-on-surface tracking-tight mb-2">审批队列</h2>
          <p className="text-base text-on-surface-variant max-w-2xl">
            管理和跟踪跨部门的高优先级工作流。
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={loadData}
            className="flex-1 md:flex-none px-5 py-2.5 border border-outline/30 bg-surface/50 backdrop-blur-md rounded-lg font-bold text-xs text-on-surface hover:border-primary hover:text-primary transition-all shadow-sm uppercase tracking-wider"
          >
            刷新数据
          </button>
          <button className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-on-primary rounded-lg font-bold text-xs hover:bg-primary-dark transition-all shadow-[0_0_15px_rgba(0,209,255,0.3)] uppercase tracking-wider">
            新建请求
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '待处理操作', value: pendingCount, trend: '今日 +3', color: 'text-warning' },
          { label: '审核中', value: inReviewCount, trend: '平均：2.5天', color: 'text-secondary' },
          { label: '(30天内)已批准', value: approved30dCount, trend: '94% 审批率', color: 'text-success' },
          { label: '已拒绝', value: rejectedCount, trend: '需要审核', color: 'text-error' },
        ].map((stat, i) => (
          <div
            key={i}
            className={`glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer ${
              stat.label === '已拒绝' ? 'border-error/20 bg-error/5' : ''
            }`}
          >
            <div
              className={`absolute -right-8 -top-8 w-32 h-32 ${
                stat.color === 'text-warning'
                  ? 'bg-warning/10'
                  : stat.color === 'text-secondary'
                  ? 'bg-secondary/10'
                  : stat.color === 'text-success'
                  ? 'bg-success/10'
                  : 'bg-error/10'
              } rounded-full blur-2xl group-hover:scale-150 transition-all`}></div>
            <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest relative z-10">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-3 relative z-10">
              <h3
                className={`text-5xl font-bold tracking-tighter ${
                  stat.color === 'text-warning' ? 'text-warning' : stat.color === 'text-error' ? 'text-error' : 'text-on-surface'
                }`}
              >
                {stat.value}
              </h3>
              <span className="text-sm font-mono text-secondary font-semibold">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 border-b border-surface-variant pb-4 gap-4">
        <div className="flex flex-wrap gap-2">
          {['全部待处理', '需要我审批', '仅财务'].map((filter, i) => (
            <button
              key={i}
              className={`px-5 py-2 rounded-full font-mono text-xs font-medium uppercase tracking-wider transition-colors ${
                i === 0
                  ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,209,255,0.3)]'
                  : 'bg-surface-container text-on-surface-variant hover:bg-outline-variant/30'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-surface-container/50 px-4 py-2 rounded-lg border border-outline-variant/30 cursor-pointer">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">排序方式:</span>
          <span className="text-sm font-medium text-on-surface">紧急程度（从高到低）</span>
          <ChevronDown className="w-4 h-4 text-on-surface-variant" />
        </div>
      </div>

      {/* Approval List */}
      <div className="flex flex-col gap-6 mt-2">
        {payments.map((payment) => (
          <PaymentApprovalCard
            key={payment.id}
            payment={payment}
            customerName={getCustomerName(payment.contract_id)}
            onApprove={() => loadData()}
            onReject={() => loadData()}
          />
        ))}
      </div>
    </div>
  );
}

// Payment Approval Card Component
function PaymentApprovalCard({
  payment,
  customerName,
  onApprove,
  onReject,
}: {
  payment: Payment;
  customerName: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isHighPriority =
    (payment.approval_checklist?.tax_completed === false ||
      payment.approval_checklist?.milestone_achieved === false) &&
    payment.payment_amount > 100000;

  return (
    <div
      className={`bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg rounded-xl p-6 transition-all hover:shadow-[0_15px_35px_rgba(0,209,255,0.08)] relative overflow-hidden group ${
        isHighPriority ? 'border-error/20 bg-error/5' : ''
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isHighPriority ? 'bg-error' : 'bg-primary'}`}></div>
      <div className="flex flex-col lg:flex-row justify-between lg:items-start mb-8 pl-3 gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span
              className={`font-mono px-2 py-0.5 rounded text-xs font-bold ${
                payment.payment_status === 'PENDING'
                  ? 'bg-secondary-container/60 text-secondary border border-secondary/20'
                  : 'bg-error-container/60 text-error border border-error/20'
              }`}
            >
              {payment.payment_code}
            </span>
            {isHighPriority && (
              <span className="text-[10px] text-error font-bold border border-error/50 px-2.5 py-0.5 rounded-full bg-error/10 uppercase tracking-widest">
                高优先级
              </span>
            )}
          </div>
          <h3 className={`text-2xl font-bold leading-tight mb-2 ${
            isHighPriority ? 'text-error' : 'text-on-surface'
          }`}>
            资本支出：{customerName} - 付款 #{payment.id.substring(0, 8)}
          </h3>
          <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed">
            请求付款授权。 总金额：${payment.payment_amount.toLocaleString()}.
            合同：{payment.contract_id?.substring(0, 8)}...
          </p>
        </div>
        <div className="lg:text-right lg:min-w-max">
          <p className="font-mono text-xs text-on-surface-variant mb-1">提交时间：{new Date(payment.created_at).toLocaleString()}</p>
          <p className={`text-base font-semibold ${
            payment.payment_status === 'PENDING' ? 'text-on-surface' : payment.payment_status === 'APPROVED' ? 'text-primary' : 'text-error'
          }`}>
            <span className="text-on-surface-variant font-normal">Value:</span>{' '}
            ${payment.payment_amount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Workflow Tracker */}
      {payment.approval_checklist && (
        <div className="bg-surface-container-lowest/80 rounded-xl p-6 border border-outline-variant/30 mb-8 pl-3 md:pl-6 shadow-inner mx-3 overflow-hidden">
          <h4 className="text-[10px] font-bold text-on-surface-variant mb-8 uppercase tracking-widest">审批流程</h4>
          <div className="relative flex justify-between items-center max-w-4xl mx-auto px-4 sm:px-10 overflow-x-auto pb-4">
            <div
              className={`absolute top-4 left-10 right-10 h-0.5 ${
                payment.payment_status === 'PENDING' ? 'bg-outline-variant/40' : 'bg-primary'
              } -z-10`}></div>
            {payment.payment_status !== 'PENDING' && (
              <div className="absolute top-4 left-10 w-[75%] h-0.5 bg-primary shadow-[0_0_8px_rgba(0,209,255,0.6)] -z-10"></div>
            )}

            {['部门主管', '预算批准', '财务副总裁', '最终发布'].map((step, i) => {
              const isCompleted = ['部门主管', '预算批准'].includes(step);
              const isCurrent = payment.payment_status === 'PENDING' && step === '财务副总裁';
              const isPending = payment.payment_status === 'APPROVED' && step === '最终发布';

              return (
                <div key={step} className="flex flex-col items-center z-10 w-24 relative min-w-[96px]">
                  <div
                    className={`w-8 h-8 rounded-full ${
                      isCompleted
                        ? 'bg-primary text-white shadow-md'
                        : isCurrent
                        ? 'bg-white border-[3px] border-primary shadow-[0_0_15px_rgba(0,209,255,0.3)]'
                        : 'bg-surface border-2 border-outline-variant'
                    } flex items-center justify-center mb-3`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : isCurrent ? (
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-ping absolute"></div>
                    ) : null}
                  </div>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      isCompleted || isCurrent ? 'text-on-surface' : 'text-on-surface-variant'
                    } text-center leading-tight`}
                  >
                    {step}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider mt-1">
                    {isCompleted
                      ? payment.approval_checklist_completed_at
                        ? '已批准'
                        : ''
                      : isCurrent
                      ? '等待审核'
                      : '等待中'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center pl-3 gap-4 border-t border-surface-variant pt-6 mx-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full bg-${
              isHighPriority ? 'error-container' : 'surface-container-high'
            } text-on-${isHighPriority ? 'error-container' : 'surface'} shadow-sm border border-outline-variant/50 flex items-center justify-center text-xs font-bold font-mono`}
          >
            {payment.created_by?.substring(0, 2).toUpperCase() || 'PM'}
          </div>
          <div>
            <p className="text-sm text-on-surface leading-tight">
              {payment.created_by ? `由 ${payment.created_by} 提交` : '未知'}
            </p>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">工程运维</p>
          </div>
        </div>
        {payment.payment_status === 'PENDING' && (
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onReject}
              className="flex-1 sm:flex-none px-6 py-2.5 border-2 border-outline/30 text-on-surface-variant hover:bg-error/5 hover:text-error hover:border-error/40 transition-colors rounded-lg text-xs font-bold uppercase tracking-widest"
            >
              拒绝
            </button>
            <button
              onClick={onApprove}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-dark transition-all shadow-[0_0_15px_rgba(0,209,255,0.4)] rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> 授权
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
