import React, { useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Tag,
  Tooltip,
  Input,
  Select,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// 模拟数据
interface ContractRecord {
  id: string;
  project_id: string;
  customer_id?: string;
  contract_code: string;
  contract_name: string;
  contract_type: 'SUPPLIER' | 'CONTRACTOR' | 'SALES' | 'CONSULTANT';
  counterparty_name: string;
  counterparty_id: string;
  contract_status:
    | 'DRAFT'
    | 'PENDING_SIGN'
    | 'SIGNED'
    | 'ACTIVATED'
    | 'COMPLETED'
    | 'TERMINATED';
  draft_date?: string;
  signed_date?: string;
  activated_date?: string;
  completion_date?: string;
  termination_date?: string;
  termination_reason?: string;
  total_amount: number;
  currency: string;
  payment_milestones: Array<{
    name: string;
    percentage: number;
    due_date: string;
  }>;
  key_terms_json: Record<string, any>;
  signatory_list: Record<string, any>;
  all_signatures_complete: boolean;
  sales_agent_id?: string;
  created_at: string;
}

const mockContracts: ContractRecord[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `CTR${1000 + i}`,
  project_id: 'PRJ001',
  customer_id: `CUST${100 + (i % 5)}`,
  contract_code: `HT202506${(i % 30).toString().padStart(2, '0')}-${(i % 7) + 1}`,
  contract_name: [
    '幕墙分包合同',
    '景观设计合同',
    '机电安装合同',
    '精装修施工合同',
    '消防工程合同',
  ][i % 5],
  contract_type: (['SUPPLIER', 'CONTRACTOR', 'SALES', 'CONSULTANT'][
    i % 4
  ] as any),
  counterparty_name: [
    'XX建设工程公司',
    'XX设计院',
    'XX建材供应商',
    'XX装饰工程公司',
    'XX消防科技公司',
  ][i % 5],
  counterparty_id: `ENT${100 + (i % 5)}`,
  contract_status: ([
    'DRAFT',
    'PENDING_SIGN',
    'SIGNED',
    'ACTIVATED',
    'COMPLETED',
    'TERMINATED',
  ][i % 6] as any),
  draft_date: `2025-05-${(i % 28) + 1}`,
  signed_date: i > 3 ? `2025-06-${((i - 3) % 28) + 1}` : undefined,
  activated_date: i > 5 ? `2025-06-${((i - 5) % 28) + 1}` : undefined,
  completion_date: i > 10 ? `2025-12-${((i - 10) % 28) + 1}` : undefined,
  total_amount: [8500000, 1200000, 3500000, 4200000, 2800000][i % 5],
  currency: 'CNY',
  payment_milestones: [
    { name: '预付款', percentage: 10, due_date: '2025-06-30' },
    { name: '进度款', percentage: 40, due_date: '2025-09-30' },
    { name: '竣工款', percentage: 40, due_date: '2025-12-31' },
    { name: '质保金', percentage: 10, due_date: '2026-06-30' },
  ],
  key_terms_json: {
    payment_method: '银行转账',
    tax_rate: 0.09,
    penalty_rate: 0.0005,
  },
  signatory_list: {
    party_a: '张三',
    party_b: '李四',
  },
  all_signatures_complete: i % 3 !== 0,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

// 统计数据
const ContractStats = () => {
  const stats = [
    { label: '合同总数', value: mockContracts.length, color: '#8b5cf7' },
    { label: '已签署', value: mockContracts.filter(c => c.contract_status === 'SIGNED').length, color: '#22c55e' },
    { label: '生效中', value: mockContracts.filter(c => c.contract_status === 'ACTIVATED').length, color: '#3b82f6' },
    { label: '总金额', value: `¥${(mockContracts.reduce((sum, c) => sum + c.total_amount, 0) / 100000000).toFixed(2)}亿`, color: '#f59e0b' },
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

const ContractStatusTag: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { color: string; text: string }> = {
    DRAFT: { color: '#6b7280', text: '草稿' },
    PENDING_SIGN: { color: '#fbbf24', text: '待签署' },
    SIGNED: { color: '#10b981', text: '已签署' },
    ACTIVATED: { color: '#3b82f6', text: '已生效' },
    COMPLETED: { color: '#22c55e', text: '已完成' },
    TERMINATED: { color: '#ef4444', text: '已终止' },
  };
  return (
    <Tag
      color="default"
      style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        borderColor: `${config[status]?.color}33`,
      }}
    >
      <span style={{ color: config[status]?.color }}>{config[status]?.text}</span>
    </Tag>
  );
};

const ContractTypeTag: React.FC<{ type: string }> = ({ type }) => {
  const config: Record<string, { color: string; text: string }> = {
    SUPPLIER: { color: '#a855f7', text: '供应商' },
    CONTRACTOR: { color: '#06b6d4', text: '承包商' },
    SALES: { color: '#f59e0b', text: '销售' },
    CONSULTANT: { color: '#ec4899', text: '顾问' },
  };
  return (
    <Tag
      color="default"
      style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        borderColor: `${config[type]?.color}33`,
      }}
    >
      <span style={{ color: config[type]?.color }}>{config[type]?.text}</span>
    </Tag>
  );
};

const ContractsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const columns: ColumnsType<ContractRecord> = [
    {
      title: '合同编号',
      dataIndex: 'contract_code',
      key: 'contract_code',
      width: 140,
      render: (text) => (
        <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>{text}</strong>
      ),
    },
    {
      title: '合同名称',
      dataIndex: 'contract_name',
      key: 'contract_name',
      width: 220,
    },
    {
      title: '合作方',
      dataIndex: 'counterparty_name',
      key: 'counterparty_name',
      width: 160,
    },
    {
      title: '类型',
      dataIndex: 'contract_type',
      key: 'contract_type',
      width: 100,
      render: (type) => <ContractTypeTag type={type} />,
    },
    {
      title: '状态',
      dataIndex: 'contract_status',
      key: 'contract_status',
      width: 100,
      render: (status) => <ContractStatusTag status={status} />,
    },
    {
      title: '金额',
      key: 'total_amount',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 14, color: '#fff' }}>
            ¥{(record.total_amount / 1000000).toFixed(2)}万
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.currency}</Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => console.log('查看', record.id)}
              style={{ color: '#8b5cf7' }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => console.log('编辑', record.id)}
              style={{ color: '#3b82f6' }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm title="确定删除此合同？" onConfirm={() => console.log('删除', record.id)}>
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredContracts = mockContracts.filter((c) => {
    const matchesSearch =
      c.contract_code.includes(searchText) ||
      c.contract_name.includes(searchText);
    const matchesStatus =
      filterStatus === '' || c.contract_status === filterStatus;
    const matchesType =
      filterType === '' || c.contract_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
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
            合同管理
          </Text>
          <Title level={2} style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>
            所有合同
          </Title>
        </Space>
      </div>

      {/* Stats Row */}
      <ContractStats />

      {/* Filters Card - Glassmorphism Style */}
      <Card
        className="glass-panel"
        style={{
          marginBottom: 24,
          background:
            'linear-gradient(135deg, rgba(168,85,247,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        }}
      >
        <Space style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background:
                'linear-gradient(135deg, #8b5cf7 0%, #a855f7 100%)',
              borderRadius: 12,
            }}
          >
            新建合同
          </Button>

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
              placeholder="搜索合同编号或名称..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220, background: 'transparent' }}
              allowClear
              className="glass-input"
            />
          </div>

          <Select
            showSearch
            placeholder="按状态筛选..."
            style={{ width: 160 }}
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '', label: '全部状态' },
              ...Object.entries({
                DRAFT: '草稿',
                PENDING_SIGN: '待签署',
                SIGNED: '已签署',
                ACTIVATED: '已生效',
                COMPLETED: '已完成',
                TERMINATED: '已终止',
              }).map(([value, label]) => ({ value, label })),
            ]}
            className="glass-select"
          />

          <Select
            showSearch
            placeholder="按类型筛选..."
            style={{ width: 160 }}
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: '', label: '全部类型' },
              ...Object.entries({
                SUPPLIER: '供应商',
                CONTRACTOR: '承包商',
                SALES: '销售',
                CONSULTANT: '顾问',
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
            显示 {filteredContracts.length} 份合同
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={filteredContracts}
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
    </div>
  );
};

export default ContractsPage;
