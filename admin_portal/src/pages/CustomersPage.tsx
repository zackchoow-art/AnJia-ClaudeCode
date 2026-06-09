import React, { useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Divider,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { Customer } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

// 客户状态配置
const customerStatusConfig: Record<string, { color: string; text: string }> = {
  POTENTIAL: { color: '#6b7280', text: '潜客' },
  INTERESTED: { color: '#3b82f6', text: '意向' },
  NEGOTIATING: { color: '#f59e0b', text: '谈判中' },
  SIGNED: { color: '#10b981', text: '已签约' },
  CANCELLED: { color: '#ef4444', text: '已取消' },
};

// 模拟数据
const mockCustomers: Customer[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `CUST${1000 + i}`,
  project_id: 'PRJ001',
  customer_name: ['张三', '李四', '王五', '赵六', '孙七'][i % 5] + (i > 4 ? i : ''),
  customer_phone: `138${Math.random().toString(11).slice(2, 11)}`,
  customer_id_number: `11010119900101${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}${
    i % 2 === 0 ? 'X' : Math.floor(Math.random() * 9)
  }`,
  customer_type: ['INDIVIDUAL', 'COMPANY'][i % 2] as any,
  sales_agent_id: `AGENT${Math.floor(i / 5) + 100}`,
  sales_agent_name: `销售${['A', 'B', 'C', 'D', 'E'][Math.floor(i / 5)]}`,
  customer_status: ([
    'POTENTIAL',
    'INTERESTED',
    'NEGOTIATING',
    'SIGNED',
    'CANCELLED',
  ][i % 5] as any),
  interested_property_type: ['住宅', '商铺', '公寓'][i % 3],
  budget_range_min: 200000 + i * 10000,
  budget_range_max: 500000 + i * 10000,
  notes: `客户备注${i}`,
  commitments_made: [
    {
      date: '2025-06-01',
      content: '承诺学区房',
      made_by: '销售A',
      recorded_by: '系统',
    },
  ],
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

const CustomersPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const columns: ColumnsType<Customer> = [
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Badge
            dot
            color={record.customer_status === 'SIGNED' ? '#10b981' : record.customer_status === 'NEGOTIATING' ? '#f59e0b' : '#3b82f6'}
          >
            <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>{text}</strong>
          </Badge>
        </div>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
    },
    {
      title: '类型',
      dataIndex: 'customer_type',
      key: 'customer_type',
      render: (type) => (
        <Tag
          color="default"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            borderColor: type === 'COMPANY' ? '#3b82f633' : '#10b98133',
          }}
        >
          <span style={{ color: type === 'COMPANY' ? '#3b82f6' : '#10b981' }}>
            {type === 'COMPANY' ? '企业' : '个人'}
          </span>
        </Tag>
      ),
    },
    {
      title: '意向物业',
      dataIndex: 'interested_property_type',
      key: 'interested_property_type',
    },
    {
      title: '预算区间',
      key: 'budget_range',
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: '#fff' }}>
          ¥{(record.budget_range_min / 10000).toFixed(1)}-
          {(record.budget_range_max / 10000).toFixed(1)}万
        </span>
      ),
    },
    {
      title: '客户状态',
      dataIndex: 'customer_status',
      key: 'customer_status',
      render: (status) => {
        const cfg = customerStatusConfig[status];
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
      },
    },
    {
      title: '所属销售',
      dataIndex: 'sales_agent_name',
      key: 'sales_agent_name',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
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
              onClick={() => {
                setEditingCustomer(record);
                setIsModalOpen(true);
              }}
              style={{ color: '#3b82f6' }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm title="确定删除此客户？" onConfirm={() => console.log('删除', record.id)}>
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredCustomers = mockCustomers.filter((c) => {
    const matchesSearch =
      c.customer_name.includes(searchText) ||
      c.customer_phone.includes(searchText);
    const matchesStatus =
      filterStatus === '' || c.customer_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 统计卡片
  const StatsRow = () => (
    <div style={{ marginBottom: 24 }}>
      <Space size="middle" style={{ flexWrap: 'wrap' }}>
        {[
          { label: '客户总数', value: mockCustomers.length, color: '#6366f1' },
          { label: '潜客', value: mockCustomers.filter(c => c.customer_status === 'POTENTIAL').length, color: '#6b7280' },
          { label: '意向客户', value: mockCustomers.filter(c => c.customer_status === 'INTERESTED').length, color: '#3b82f6' },
          { label: '已签约', value: mockCustomers.filter(c => c.customer_status === 'SIGNED').length, color: '#10b981' },
        ].map((stat, idx) => (
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
                fontSize: 28,
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
            客户管理
          </Text>
          <Title level={2} style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>
            所有客户
          </Title>
        </Space>
      </div>

      {/* Stats Row */}
      <StatsRow />

      {/* Filters Card - Glassmorphism Style */}
      <Card
        className="glass-panel"
        style={{
          marginBottom: 24,
          background:
            'linear-gradient(135deg, rgba(14,165,233,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        }}
      >
        <Space style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            style={{
              background:
                'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
              borderRadius: 12,
            }}
          >
            添加客户
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
              placeholder="搜索客户姓名或电话..."
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
            style={{ width: 150 }}
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '', label: '全部状态' },
              ...Object.entries(customerStatusConfig).map(([value, cfg]) => ({ value, label: cfg.text })),
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
            显示 {filteredCustomers.length} 位客户
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={filteredCustomers}
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

      <CustomerFormModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        customer={editingCustomer || undefined}
      />
    </div>
  );
};

const CustomerFormModal: React.FC<{
  open: boolean;
  onCancel: () => void;
  customer?: Customer;
}> = ({ open, onCancel, customer }) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title={
        <Space size="middle">
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 14 }}>AJ</span>
          </div>
          <span>{customer ? '编辑客户' : '添加新客户'}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={680}
      styles={{
        content: {
          borderRadius: 20,
          padding: '32px',
        },
      }}
    >
      <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

      <Form form={form} layout="vertical" initialValues={customer}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>客户姓名</span>
              }
              name="customer_name"
              rules={[{ required: true, message: '请输入客户姓名' }]}
            >
              <Input placeholder="请输入客户姓名" className="glass-input" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>联系电话</span>
              }
              name="customer_phone"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1\d{10}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input placeholder="请输入联系电话" className="glass-input" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>客户类型</span>
              }
              name="customer_type"
              rules={[{ required: true, message: '请选择客户类型' }]}
            >
              <Select placeholder="请选择客户类型" className="glass-select">
                <Option value="INDIVIDUAL">个人</Option>
                <Option value="COMPANY">企业</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>意向物业</span>
              }
              name="interested_property_type"
              rules={[{ required: true, message: '请选择意向物业' }]}
            >
              <Select placeholder="请选择意向物业" className="glass-select">
                <Option value="住宅">住宅</Option>
                <Option value="商铺">商铺</Option>
                <Option value="公寓">公寓</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>预算区间（万）</span>
              }
              tooltip="预期购房总预算"
            >
              <Space className="glass-input" style={{ width: '100%' }}>
                <Input placeholder="最小" type="number" />
                <span>-</span>
                <Input placeholder="最大" type="number" />
              </Space>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>客户状态</span>
              }
              name="customer_status"
            >
              <Select placeholder="请选择客户状态" className="glass-select">
                {Object.keys(customerStatusConfig).map((s) => (
                  <Option key={s} value={s}>
                    {customerStatusConfig[s].text}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>备注</span>
          }
          name="notes"
        >
          <Input.TextArea rows={3} placeholder="请输入客户备注信息..." className="glass-input" />
        </Form.Item>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Button onClick={onCancel} className="glass-btn">
            取消
          </Button>
          <Button type="primary" htmlType="submit" style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
          }}>
            {customer ? '保存修改' : '添加客户'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CustomersPage;
