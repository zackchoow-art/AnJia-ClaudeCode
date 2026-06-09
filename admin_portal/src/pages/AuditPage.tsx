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
  Input,
  Select,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FilterOutlined,
  AuditOutlined,
  UserOutlined,
  FileTextOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// 模拟审计日志数据
interface AuditLogRecord {
  id: string;
  entity_type:
    | 'payment'
    | 'contract'
    | 'customer'
    | 'project'
    | 'cost_budget';
  entity_id: string;
  action:
    | 'CREATED'
    | 'UPDATED'
    | 'APPROVED'
    | 'REJECTED'
    | 'SIGNED'
    | 'EXECUTED'
    | 'DELETED';
  actor_type: 'USER' | 'AGENT' | 'SYSTEM';
  actor_id?: string;
  actor_name: string;
  reason?: string;
  timestamp: string;
}

const mockAuditLogs: AuditLogRecord[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `LOG${1000 + i}`,
  entity_type: (['payment', 'contract', 'customer', 'project', 'cost_budget'][
    i % 5
  ] as any),
  entity_id: `ID${1000 + (i % 100)}`,
  action: ([
    'CREATED',
    'UPDATED',
    'APPROVED',
    'REJECTED',
    'SIGNED',
    'EXECUTED',
    'DELETED',
  ][i % 7] as any),
  actor_type: (['USER', 'AGENT', 'SYSTEM'][i % 3] as any),
  actor_id: i > 5 ? `USR${Math.floor(i / 3) + 100}` : undefined,
  actor_name: ['张三', '李四', '王五', '系统自动处理'][i % 4],
  reason: i % 7 === 0 ? '符合审批流程要求' : undefined,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
}));

// 统计数据
const AuditStats = () => {
  const stats = [
    { label: '今日操作', value: mockAuditLogs.filter(l => new Date().toDateString() === new Date(l.timestamp).toDateString()).length, color: '#3b82f6' },
    { label: '用户操作', value: mockAuditLogs.filter(l => l.actor_type === 'USER').length, color: '#10b981' },
    { label: '系统操作', value: mockAuditLogs.filter(l => l.actor_type === 'SYSTEM').length, color: '#a855f7' },
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

const EntityTypeTag: React.FC<{ type: string }> = ({ type }) => {
  const config: Record<string, { color: string; text: string }> = {
    payment: { color: '#3b82f6', text: '付款' },
    contract: { color: '#a855f7', text: '合同' },
    customer: { color: '#10b981', text: '客户' },
    project: { color: '#f59e0b', text: '项目' },
    cost_budget: { color: '#06b6d4', text: '预算' },
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

const ActionTag: React.FC<{ action: string }> = ({ action }) => {
  const config: Record<string, { color: string; icon?: React.ReactNode; text: string }> = {
    CREATED: { color: '#3b82f6', icon: <FileTextOutlined />, text: '创建' },
    UPDATED: { color: '#94a3b8', icon: <FileTextOutlined />, text: '更新' },
    APPROVED: { color: '#22c55e', icon: <AuditOutlined />, text: '批准' },
    REJECTED: { color: '#ef4444', icon: <AuditOutlined />, text: '拒绝' },
    SIGNED: { color: '#f59e0b', icon: <FileTextOutlined />, text: '签署' },
    EXECUTED: { color: '#10b981', icon: <AuditOutlined />, text: '执行' },
    DELETED: { color: '#ef4444', icon: <AuditOutlined />, text: '删除' },
  };
  return (
    <Tag
      color="default"
      style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        borderColor: `${config[action]?.color}33`,
      }}
    >
      {config[action]?.icon && <span style={{ marginRight: 4 }}>{config[action]?.icon}</span>}
      <span style={{ color: config[action]?.color }}>{config[action]?.text || action}</span>
    </Tag>
  );
};

const ActorTypeTag: React.FC<{ type: string }> = ({ type }) => {
  const config: Record<string, { color: string; icon?: React.ReactNode; text: string }> = {
    USER: { color: '#3b82f6', icon: <UserOutlined />, text: '用户' },
    AGENT: { color: '#f59e0b', icon: <AuditOutlined />, text: 'AI代理' },
    SYSTEM: { color: '#6b7280', text: '系统' },
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
      {config[type]?.icon && <span style={{ marginRight: 4 }}>{config[type]?.icon}</span>}
      <span style={{ color: config[type]?.color }}>{config[type]?.text || type}</span>
    </Tag>
  );
};

const AuditPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const columns: ColumnsType<AuditLogRecord> = [
    {
      title: '操作时间',
      key: 'timestamp',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontWeight: 500, color: '#e2e8f0' }}>
            {new Date(record.timestamp).toLocaleString('zh-CN')}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.actor_id}
          </Text>
        </Space>
      ),
    },
    {
      title: '操作人',
      key: 'actor',
      width: 100,
      render: (_, record) => (
        <Space size={8}>
          <ActorTypeTag type={record.actor_type} />
          <span style={{ color: '#e2e8f0' }}>{record.actor_name}</span>
        </Space>
      ),
    },
    {
      title: '实体类型',
      key: 'entity_type',
      width: 100,
      render: (_, record) => <EntityTypeTag type={record.entity_type} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => <ActionTag action={record.action} />,
    },
    {
      title: '实体ID',
      dataIndex: 'entity_id',
      key: 'entity_id',
      width: 120,
    },
    {
      title: '原因',
      key: 'reason',
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.reason || '-'}
        </Text>
      ),
    },
    {
      title: '详情',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="查看详情">
          <Button
            type="text"
            icon={<AuditOutlined />}
            onClick={() => {
              setSelectedLog(record);
              setShowDetails(true);
            }}
            style={{ color: '#8b5cf7' }}
          />
        </Tooltip>
      ),
    },
  ];

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.actor_name.includes(searchText) ||
      log.entity_id.includes(searchText);
    const matchesType =
      filterType === '' || log.entity_type === filterType;
    const matchesAction =
      filterAction === '' || log.action === filterAction;
    return matchesSearch && matchesType && matchesAction;
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
            审计日志
          </Text>
          <Title level={2} style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>
            系统操作日志
          </Title>
        </Space>
      </div>

      {/* Stats Row */}
      <AuditStats />

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
              placeholder="搜索操作人或实体ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220, background: 'transparent' }}
              allowClear
              className="glass-input"
            />
          </div>

          <Select
            showSearch
            placeholder="按实体类型筛选..."
            style={{ width: 160 }}
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: '', label: '全部' },
              ...Object.entries({
                payment: '付款',
                contract: '合同',
                customer: '客户',
                project: '项目',
                cost_budget: '预算',
              }).map(([value, label]) => ({ value, label })),
            ]}
            className="glass-select"
          />

          <Select
            showSearch
            placeholder="按操作类型筛选..."
            style={{ width: 160 }}
            value={filterAction}
            onChange={setFilterAction}
            options={[
              { value: '', label: '全部' },
              ...Object.entries({
                CREATED: '创建',
                UPDATED: '更新',
                APPROVED: '批准',
                REJECTED: '拒绝',
                SIGNED: '签署',
                EXECUTED: '执行',
                DELETED: '删除',
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
            显示 {filteredLogs.length} 条审计日志
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={filteredLogs}
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

      {/* 日志详情模态框 */}
      <Modal
        title={
          <Space size="middle">
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AuditOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <span>审计日志详情</span>
          </Space>
        }
        open={showDetails}
        onCancel={() => setShowDetails(false)}
        width={720}
        footer={[
          <Button key="close" onClick={() => setShowDetails(false)} className="glass-btn">
            关闭
          </Button>,
        ]}
        styles={{
          content: {
            borderRadius: 20,
            padding: '32px',
          },
        }}
      >
        {selectedLog && (
          <>
            <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>操作时间</Typography.Text>
                <div>
                  {new Date(selectedLog.timestamp).toLocaleString('zh-CN')}
                </div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>操作人</Typography.Text>
                <div>{selectedLog.actor_name}</div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>操作人类型</Typography.Text>
                <div>
                  <ActorTypeTag type={selectedLog.actor_type} />
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.08)' }} />

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>实体类型</Typography.Text>
                <div>
                  <EntityTypeTag type={selectedLog.entity_type} />
                </div>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>实体ID</Typography.Text>
                <div>{selectedLog.entity_id}</div>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.08)' }} />

            <Row style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>操作类型</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <ActionTag action={selectedLog.action} />
                </div>
              </Col>
            </Row>

            {selectedLog.reason && (
              <>
                <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.08)' }} />

                <Row style={{ marginBottom: 24 }}>
                  <Col span={24}>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>原因</Typography.Text>
                    <div style={{ marginTop: 8, padding: 12, background: 'rgba(99,102,241,0.05)', borderRadius: 8 }}>
                      {selectedLog.reason}
                    </div>
                  </Col>
                </Row>
              </>
            )}

            <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.08)' }} />

            <Row>
              <Col span={24}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>完整数据</Typography.Text>
                <div
                  style={{
                    marginTop: 8,
                    background: 'rgba(15,23,42,0.8)',
                    backdropFilter: 'blur(8px)',
                    padding: 16,
                    borderRadius: 12,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 200,
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}
                >
                  <pre style={{ color: '#a5b4fc' }}>
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </Col>
            </Row>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AuditPage;
