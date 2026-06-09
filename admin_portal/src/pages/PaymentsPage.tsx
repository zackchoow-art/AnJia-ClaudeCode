import React, { useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Modal,
  Tag,
  Divider,
  Tooltip,
  Row,
  Col,
  Alert,
  Descriptions,
  Select,
  Input,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// 模拟数据
interface PaymentRecord {
  id: string;
  project_id: string;
  contract_id: string;
  payment_code: string;
  payment_amount: number;
  payment_currency: string;
  payment_date: string;
  payment_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED';
  approval_checklist: {
    contract_signed: boolean;
    documents_received: boolean;
    tax_completed: boolean;
    milestone_achieved: boolean;
    no_blockers: boolean;
  };
  approval_checklist_completed_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_notes?: string;
  rejection_reason?: string;
  created_at: string;
}

const mockPayments: PaymentRecord[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `PAY${1000 + i}`,
  project_id: 'PRJ001',
  contract_id: `CTR${100 + (i % 10)}`,
  payment_code: `PY202506${(i % 30).toString().padStart(2, '0')}-${(i % 5) + 1}`,
  payment_amount: [2500000, 1800000, 950000, 3200000, 1500000][i % 5],
  payment_currency: 'CNY',
  payment_date: `2025-06-${(i % 28) + 1}`,
  payment_status: ([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXECUTED',
    'CANCELLED',
  ][i % 5] as any),
  approval_checklist: {
    contract_signed: i % 3 !== 0,
    documents_received: i % 4 !== 0,
    tax_completed: i % 2 === 0,
    milestone_achieved: i % 6 !== 0,
    no_blockers: true,
  },
  approval_checklist_completed_at:
    i % 5 === 0 ? `2025-06-${(i % 28) + 1}T14:30:00` : undefined,
  reviewed_by: i > 5 ? `USER${Math.floor(i / 3) + 100}` : undefined,
  reviewed_at:
    i > 5 && i % 5 !== 0
      ? `2025-06-${(i % 28) + 1}T16:30:00`
      : undefined,
  approval_notes:
    i % 7 === 0 ? '请财务复核金额是否正确' : undefined,
  rejection_reason: i % 9 === 0 ? '缺少发票复印件' : undefined,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

// 统计数据
const PaymentStats = () => {
  const stats = [
    { label: '待审批', value: mockPayments.filter(p => p.payment_status === 'PENDING').length, color: '#fbbf24' },
    { label: '已批准', value: mockPayments.filter(p => p.payment_status === 'APPROVED').length, color: '#10b981' },
    { label: '已执行', value: mockPayments.filter(p => p.payment_status === 'EXECUTED').length, color: '#3b82f6' },
    { label: '总金额', value: `¥${(mockPayments.reduce((sum, p) => sum + p.payment_amount, 0) / 10000000).toFixed(1)}亿`, color: '#8b5cf7' },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <Space size="middle" style={{ flexWrap: 'wrap' }}>
        {stats.map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: 16,
              padding: '16px 24px',
              minWidth: 140,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{stat.label}</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </Space>
    </div>
  );
};

const Checklist: React.FC<{ checklist: PaymentRecord['approval_checklist'] }> = ({
  checklist,
}) => {
  const items = [
    { key: 'contract_signed', label: '合同已签署', value: checklist.contract_signed },
    { key: 'documents_received', label: '资料齐全', value: checklist.documents_received },
    { key: 'tax_completed', label: '税费已缴清', value: checklist.tax_completed },
    { key: 'milestone_achieved', label: '里程碑达成', value: checklist.milestone_achieved },
    { key: 'no_blockers', label: '无阻碍事项', value: checklist.no_blockers },
  ];

  return (
    <Row gutter={8}>
      {items.map((item) => (
        <Col key={item.key} span={12}>
          <Tag
            color="default"
            style={{
              background: item.value ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              borderColor: item.value ? '#22c55e33' : '#ef444433',
            }}
          >
            <span style={{ color: item.value ? '#22c55e' : '#ef4444', fontSize: 12 }}>
              {item.label}
            </span>
          </Tag>
        </Col>
      ))}
    </Row>
  );
};

const PaymentsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const columns: ColumnsType<PaymentRecord> = [
    {
      title: '付款编号',
      dataIndex: 'payment_code',
      key: 'payment_code',
      width: 120,
      render: (text) => <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>{text}</strong>,
    },
    {
      title: '项目',
      key: 'project_id',
      render: (_, record) => (
        <span style={{ color: '#6366f1', fontWeight: 500 }}>PRJ{record.project_id.slice(-3)}</span>
      ),
    },
    {
      title: '合同',
      key: 'contract_id',
      render: (_, record) => (
        <span style={{ color: '#a855f7', fontWeight: 500 }}>CTR{record.contract_id.slice(-3)}</span>
      ),
    },
    {
      title: '金额',
      key: 'payment_amount',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 14, color: '#fff' }}>
            ¥{(record.payment_amount / 10000).toFixed(2)}万
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.payment_currency}</Text>
        </Space>
      ),
    },
    {
      title: '付款日期',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (status) => <PaymentStatusTag status={status} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedPayment(record);
                setIsViewModalOpen(true);
              }}
              style={{ color: '#8b5cf7' }}
            />
          </Tooltip>
          {record.payment_status === 'PENDING' && (
            <>
              <Tooltip title="批准">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => console.log('批准', record.id)}
                />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button
                  type="primary"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => console.log('拒绝', record.id)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const filteredPayments = mockPayments.filter((p) => {
    const matchesSearch =
      p.payment_code.includes(searchText) ||
      p.contract_id.includes(searchText);
    const matchesStatus =
      filterStatus === '' || p.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: 32 }}>
        <Space direction="vertical" size="small">
          <Text
            type="secondary"
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            支付审批管理
          </Text>
          <Title level={2} style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>
            付款申请列表
          </Title>
        </Space>
      </div>

      {/* Stats Row */}
      <PaymentStats />

      {/* Filters Card - Glassmorphism Style */}
      <Card
        className="glass-panel"
        style={{
          marginBottom: 24,
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        }}
      >
        <Space style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div
            className="glass-btn"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <SearchOutlined style={{ color: '#94a3b8', marginLeft: 12 }} />
            <Input.Search
              placeholder="搜索付款编号或合同编号..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250, background: 'transparent' }}
              allowClear
              className="glass-input"
            />
          </div>

          <Select
            showSearch
            placeholder="按状态筛选..."
            style={{ width: 160 }}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            options={[
              { value: '', label: '全部状态' },
              ...Object.entries({
                PENDING: '待审批',
                APPROVED: '已批准',
                REJECTED: '已拒绝',
                EXECUTED: '已执行',
                CANCELLED: '已取消',
              }).map(([value, label]) => ({ value, label })),
            ]}
            className="glass-select"
          />

          <Button
            icon={<FilterOutlined />}
            className="glass-btn"
            style={{
              borderRadius: 12,
            }}
          >
            高级筛选
          </Button>
        </Space>
      </Card>

      {/* Table Card */}
      <Card
        className="glass-panel"
        styles={{
          header: {
            borderBottom: 'rgba(255,255,255,0.08)',
                padding: '20px 24px',
          },
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            显示 {filteredPayments.length} 条付款申请
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={filteredPayments}
          rowKey="id"
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            size: 'small',
            style: { padding: '16px' },
          }}
          scroll={{ x: 1400 }}
          className="custom-scrollbar"
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>

      {/* 查看详情模态框 */}
      {selectedPayment && (
        <Modal
          title={
            <Space size="middle">
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <DollarOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <span>付款详情 - {selectedPayment.payment_code}</span>
            </Space>
          }
          open={isViewModalOpen}
          onCancel={() => setIsViewModalOpen(false)}
          width={780}
          footer={[
            <Button key="close" onClick={() => setIsViewModalOpen(false)} className="glass-btn">
              关闭
            </Button>,
            selectedPayment.payment_status === 'PENDING' && (
              <Button
                key="approve"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  console.log('批准付款');
                  setIsViewModalOpen(false);
                }}
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                }}
              >
                批准付款
              </Button>
            ),
            selectedPayment.payment_status === 'PENDING' && (
              <Button
                key="reject"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  console.log('拒绝付款');
                  setIsViewModalOpen(false);
                }}
              >
                拒绝付款
              </Button>
            ),
          ]}
          styles={{
            content: {
              borderRadius: 20,
              padding: '32px',
            },
          }}
        >
          <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

          <Descriptions
            layout="vertical"
            column={2}
            bordered
            size="small"
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="付款编号" span={2}>
              {selectedPayment.payment_code}
            </Descriptions.Item>
            <Descriptions.Item label="合同编号">
              {selectedPayment.contract_id}
            </Descriptions.Item>
            <Descriptions.Item label="项目编号">
              {selectedPayment.project_id}
            </Descriptions.Item>
            <Descriptions.Item label="付款金额" span={2}>
              <Text strong style={{ fontSize: 18, color: '#fff' }}>
                ¥{selectedPayment.payment_amount.toLocaleString()} CNY
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="付款日期">
              {selectedPayment.payment_date}
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              <PaymentStatusTag status={selectedPayment.payment_status} />
            </Descriptions.Item>
          </Descriptions>

          <Typography.Title level={5} style={{ color: '#e2e8f0', marginBottom: 12 }}>
            审批检查清单
          </Typography.Title>
          <Checklist checklist={selectedPayment.approval_checklist} />

          {selectedPayment.approval_notes && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <Alert
                message={
                  <Space>
                    <span style={{ color: '#3b82f6' }}>审批意见</span>
                    <Tag color="default" style={{
                      background: 'rgba(59,130,246,0.1)',
                      borderColor: 'rgba(59,130,246,0.3)',
                    }}>
                      {selectedPayment.reviewed_by} · {selectedPayment.approval_checklist_completed_at?.split('T')[0]}
                    </Tag>
                  </Space>
                }
                description={selectedPayment.approval_notes}
                type="info"
                style={{
                  background: 'rgba(59,130,246,0.08)',
                  borderColor: 'rgba(59,130,246,0.2)',
                }}
              />
            </>
          )}

          {selectedPayment.rejection_reason && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <Alert
                message={
                  <Space>
                    <span style={{ color: '#ef4444' }}>拒绝原因</span>
                    <Tag color="default" style={{
                      background: 'rgba(239,68,68,0.1)',
                      borderColor: 'rgba(239,68,68,0.3)',
                    }}>
                      {selectedPayment.reviewed_by} · {selectedPayment.approval_checklist_completed_at?.split('T')[0]}
                    </Tag>
                  </Space>
                }
                description={selectedPayment.rejection_reason}
                type="error"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                      borderColor: 'rgba(239,68,68,0.2)',
                }}
              />
            </>
          )}

          <Divider style={{ margin: '16px 0' }} />
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                创建时间： {selectedPayment.created_at.split('T')[0]}
              </Text>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                审批时间：{' '}
                {selectedPayment.approval_checklist_completed_at
                  ? selectedPayment.approval_checklist_completed_at.split('T')[0]
                  : '未审批'}
              </Text>
            </Col>
          </Row>
        </Modal>
      )}
    </div>
  );
};

// 状态标签组件
const PaymentStatusTag: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { color: string; icon?: React.ReactNode; text: string }> = {
    PENDING: { color: '#fbbf24', icon: <ClockCircleOutlined />, text: '待审批' },
    APPROVED: { color: '#22c55e', icon: <CheckCircleOutlined />, text: '已批准' },
    REJECTED: { color: '#ef4444', icon: <CloseCircleOutlined />, text: '已拒绝' },
    EXECUTED: { color: '#3b82f6', icon: <DollarOutlined />, text: '已执行' },
    CANCELLED: { color: '#6b7280', text: '已取消' },
  };
  const cfg = config[status as keyof typeof config];
  return (
    <Tag
      color="default"
      style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        borderColor: `${cfg.color}33`,
      }}
    >
      {cfg.icon && <span style={{ marginRight: 4 }}>{cfg.icon}</span>}
      <span style={{ color: cfg.color }}>{cfg.text}</span>
    </Tag>
  );
};

export default PaymentsPage;
