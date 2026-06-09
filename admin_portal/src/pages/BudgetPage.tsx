import React, { useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Progress,
  Input,
  Select,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FilterOutlined,
  BarChartOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// 模拟预算数据
interface BudgetRecord {
  id: string;
  project_id: string;
  project_name: string;
  cost_category: 'LAND' | 'CONSTRUCTION' | 'SALES' | 'TAX' | 'OVERHEAD';
  subcategory: string;
  budgeted_amount: number;
  spent_amount: number;
  budget_status: 'APPROVED' | 'PENDING' | 'REVISED';
  created_at: string;
}

const mockBudgets: BudgetRecord[] = [
  {
    id: 'BGT001',
    project_id: 'PRJ001',
    project_name: 'A地块住宅项目',
    cost_category: 'LAND',
    subcategory: '土地出让金',
    budgeted_amount: 500000000,
    spent_amount: 480000000,
    budget_status: 'APPROVED',
    created_at: '2025-01-01',
  },
  {
    id: 'BGT002',
    project_id: 'PRJ001',
    project_name: 'A地块住宅项目',
    cost_category: 'CONSTRUCTION',
    subcategory: '土建工程',
    budgeted_amount: 800000000,
    spent_amount: 650000000,
    budget_status: 'APPROVED',
    created_at: '2025-01-01',
  },
  {
    id: 'BGT003',
    project_id: 'PRJ001',
    project_name: 'A地块住宅项目',
    cost_category: 'SALES',
    subcategory: '营销费用',
    budgeted_amount: 150000000,
    spent_amount: 98000000,
    budget_status: 'APPROVED',
    created_at: '2025-01-01',
  },
  {
    id: 'BGT004',
    project_id: 'PRJ001',
    project_name: 'A地块住宅项目',
    cost_category: 'TAX',
    subcategory: '税费支出',
    budgeted_amount: 200000000,
    spent_amount: 150000000,
    budget_status: 'APPROVED',
    created_at: '2025-01-01',
  },
  {
    id: 'BGT005',
    project_id: 'PRJ001',
    project_name: 'A地块住宅项目',
    cost_category: 'OVERHEAD',
    subcategory: '管理费用',
    budgeted_amount: 80000000,
    spent_amount: 65000000,
    budget_status: 'PENDING',
    created_at: '2025-01-01',
  },
];

// 统计数据
const BudgetStats = () => {
  const totalBudgeted: number = mockBudgets.reduce((sum, b) => sum + (b.budgeted_amount as any), 0);
  const totalSpent: number = mockBudgets.reduce((sum, b) => sum + (b.spent_amount as any), 0);
  const remaining: number = totalBudgeted - totalSpent;
  const usageRate = totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : '0';

  return (
    <div style={{ marginBottom: 24 }}>
      <Space size="middle" style={{ flexWrap: 'wrap' }}>
        {[
          { label: '预算总额', value: `¥${(totalBudgeted / 100000000).toFixed(2)}亿`, color: '#8b5cf7' },
          { label: '已支出', value: `¥${(totalSpent / 100000000).toFixed(2)}亿`, color: '#ef4444' },
          { label: '剩余预算', value: `¥${(remaining / 100000000).toFixed(2)}亿`, color: '#10b981' },
          { label: '执行率', value: `${usageRate}%`, color: '#3b82f6' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: 16,
              padding: '16px 24px',
              minWidth: 160,
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

const BudgetStatusTag: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { color: string; text: string }> = {
    APPROVED: { color: '#22c55e', text: '已审批' },
    PENDING: { color: '#fbbf24', text: '待审批' },
    REVISED: { color: '#3b82f6', text: '已调整' },
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

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const config: Record<string, { color: string; text: string }> = {
    LAND: { color: '#6366f1', text: '土地成本' },
    CONSTRUCTION: { color: '#8b5cf7', text: '建安成本' },
    SALES: { color: '#f59e0b', text: '营销费用' },
    TAX: { color: '#ef4444', text: '税费支出' },
    OVERHEAD: { color: '#10b981', text: '管理费用' },
  };
  const cfg = config[category] || { color: '#6b7280', text: category };
  return (
    <Tag
      color="default"
      style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        borderColor: `${cfg.color}33`,
      }}
    >
      <span style={{ color: cfg.color }}>{cfg.text}</span>
    </Tag>
  );
};

const BudgetPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const columns: ColumnsType<BudgetRecord> = [
    {
      title: '成本类别',
      key: 'category',
      width: 120,
      render: (_, record) => <CategoryBadge category={record.cost_category} />,
    },
    {
      title: '子分类',
      dataIndex: 'subcategory',
      key: 'subcategory',
    },
    {
      title: '预算金额',
      key: 'budgeted_amount',
      width: 130,
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
          ¥{(record.budgeted_amount / 1000000).toFixed(2)}万
        </span>
      ),
    },
    {
      title: '已发生',
      key: 'spent_amount',
      width: 120,
      render: (_, record) => (
        <span style={{ color: '#ef4444', fontWeight: 500 }}>
          ¥{(record.spent_amount / 1000000).toFixed(2)}万
        </span>
      ),
    },
    {
      title: '执行率',
      key: 'usage',
      width: 180,
      render: (_, record) => {
        const usage = (Number(record.spent_amount) / Number(record.budgeted_amount)) * 100;
        return (
          <div style={{ width: 140 }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Progress
                percent={Math.min(usage, 100)}
                status={usage > 90 ? 'exception' : usage > 80 ? 'active' : undefined}
                strokeWidth={6}
                strokeColor={{
                  '0%': '#6366f1',
                  '100%': usage > 90 ? '#ef4444' : usage > 80 ? '#f59e0b' : '#22c55e',
                }}
              />
            </Space>
          </div>
        );
      },
    },
    {
      title: '预算状态',
      dataIndex: 'budget_status',
      key: 'budget_status',
      width: 100,
      render: (status) => <BudgetStatusTag status={status} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<BarChartOutlined />}
              onClick={() => console.log('编辑', record.id)}
              style={{ color: '#8b5cf7' }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm title="确定删除此预算？" onConfirm={() => console.log('删除', record.id)}>
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredBudgets = mockBudgets.filter((b) => {
    const matchesSearch =
      b.subcategory.includes(searchText) ||
      b.project_name.includes(searchText);
    const matchesStatus =
      filterStatus === '' || b.budget_status === filterStatus;
    const matchesCategory =
      selectedCategory === '' || b.cost_category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
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
            预算成本管理
          </Text>
          <Title level={2} style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>
            预算成本列表
          </Title>
        </Space>
      </div>

      {/* Stats Row */}
      <BudgetStats />

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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background:
                'linear-gradient(135deg, #6366f1 0%, #8b5cf7 100%)',
              borderRadius: 12,
            }}
          >
            新建预算
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
              placeholder="搜索预算子分类或项目..."
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
                APPROVED: '已审批',
                PENDING: '待审批',
                REVISED: '已调整',
              }).map(([value, label]) => ({ value, label })),
            ]}
            className="glass-select"
          />

          <Select
            showSearch
            placeholder="按类别筛选..."
            style={{ width: 160 }}
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: '', label: '全部类别' },
              ...Object.entries({
                LAND: '土地成本',
                CONSTRUCTION: '建安成本',
                SALES: '营销费用',
                TAX: '税费支出',
                OVERHEAD: '管理费用',
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
            显示 {filteredBudgets.length} 条预算记录
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={filteredBudgets}
          rowKey="id"
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            size: 'small',
            style: { padding: '16px' },
          }}
          scroll={{ x: 1200 }}
          className="custom-scrollbar"
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>
    </div>
  );
};

export default BudgetPage;
