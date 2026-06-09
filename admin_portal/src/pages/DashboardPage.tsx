import React from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Table,
  Button,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ApartmentOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// 模拟数据
interface RecentPayment {
  id: string;
  code: string;
  project: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

interface RecentContract {
  id: string;
  code: string;
  name: string;
  counterparty: string;
  amount: number;
  status: 'signed' | 'pending';
  date: string;
}

const recentPayments: RecentPayment[] = [
  {
    id: 'PAY001',
    code: 'PY202506001',
    project: 'A地块住宅项目',
    amount: 2500000,
    status: 'pending',
    date: '2025-06-05',
  },
  {
    id: 'PAY002',
    code: 'PY202506002',
    project: 'B地块商业配套',
    amount: 1800000,
    status: 'approved',
    date: '2025-06-04',
  },
  {
    id: 'PAY003',
    code: 'PY202506003',
    project: 'C地块景观工程',
    amount: 950000,
    status: 'rejected',
    date: '2025-06-03',
  },
];

const recentContracts: RecentContract[] = [
  {
    id: 'CTR001',
    code: 'HT202506001',
    name: '幕墙分包合同',
    counterparty: 'XX建设工程公司',
    amount: 8500000,
    status: 'signed',
    date: '2025-06-02',
  },
  {
    id: 'CTR002',
    code: 'HT202506002',
    name: '景观设计合同',
    counterparty: 'XX设计院',
    amount: 1200000,
    status: 'pending',
    date: '2025-06-01',
  },
];

// 状态配置
const paymentStatusConfig: Record<string, { color: string; icon?: React.ReactNode; text: string }> = {
  pending: { color: '#fbbf24', icon: <ClockCircleOutlined />, text: '待审批' },
  approved: { color: '#22c55e', icon: <CheckCircleOutlined />, text: '已批准' },
  rejected: { color: '#ef4444', icon: <CloseCircleOutlined />, text: '已拒绝' },
};

// 统计卡片组件 - Apple 风格
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
}> = ({ title, value, icon, trend, trendUp, gradient }) => (
  <div className="glass-panel grid-card hover-effect" style={{ height: '100%' }}>
    <div className="flex flex-col h-full">
      <div
        style={{
          background: gradient,
          width: 48,
          height: 48,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
        }}
      >
        <div style={{ color: '#fff', fontSize: 22 }}>{icon}</div>
      </div>
      <Text
        type="secondary"
        style={{
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 8,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          background: gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {trend && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {trendUp ? <ArrowUpOutlined style={{ color: '#22c55e' }} /> : <ArrowDownOutlined style={{ color: '#ef4444' }} />}
          <span style={{ color: trendUp ? '#22c55e' : '#ef4444' }}>{trend}</span>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
            vs 上月
          </Text>
        </div>
      )}
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // 统计数据
  interface StatItem {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    colorStops: [string, string];
  }

  const stats: StatItem[] = [
    {
      title: '项目总数',
      value: '12',
      icon: <ApartmentOutlined style={{ fontSize: 24 }} />,
      trend: '+2',
      colorStops: ['#6366f1', '#8b5cf7'],
    },
    {
      title: '客户总数',
      value: '258',
      icon: <CustomerServiceOutlined style={{ fontSize: 24 }} />,
      trend: '+15',
      colorStops: ['#0ea5e9', '#6366f1'],
    },
    {
      title: '待审批金额',
      value: '¥325万',
      icon: <DollarOutlined style={{ fontSize: 24 }} />,
      trend: '-12%',
      colorStops: ['#f59e0b', '#d97706'],
    },
    {
      title: '合同总数',
      value: '46',
      icon: <FileTextOutlined style={{ fontSize: 24 }} />,
      trend: '+8',
      colorStops: ['#10b981', '#059669'],
    },
  ];

  const paymentColumns: ColumnsType<RecentPayment> = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      render: (text) => (
        <Text style={{ fontWeight: 500, color: '#e2e8f0' }}>{text}</Text>
      ),
    },
    {
      title: '项目名称',
      dataIndex: 'project',
      key: 'project',
      render: (text) => <Text strong style={{ fontSize: 14, color: '#fff' }}>{text}</Text>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ fontSize: 14, fontWeight: 600 }}>
          ¥{amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const cfg = paymentStatusConfig[status];
        return (
          <Tag
            icon={cfg.icon}
            color="default"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              borderColor: `${cfg.color}33`,
              borderWidth: 1,
            }}
          >
            <span style={{ color: cfg.color }}>{cfg.text}</span>
          </Tag>
        );
      },
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  const contractColumns: ColumnsType<RecentContract> = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      render: (text) => (
        <Text style={{ fontWeight: 500, color: '#e2e8f0' }}>{text}</Text>
      ),
    },
    {
      title: '合同名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong style={{ fontSize: 14, color: '#fff' }}>{text}</Text>,
    },
    {
      title: '合作方',
      dataIndex: 'counterparty',
      key: 'counterparty',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ fontSize: 14, fontWeight: 600 }}>
          ¥{amount.toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero Section */}
      <div className="mb-8 animate-fade-in-up">
        <Space direction="vertical" size="small">
          <Text
            type="secondary"
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'block',
            }}
          >
            欢迎回来
          </Text>
          <Title
            level={1}
            style={{
              fontSize: 42,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.1,
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            控制面板
          </Title>
        </Space>
      </div>

      {/* Statistics Grid - Apple Style */}
      <Row gutter={[24, 24]} className="mb-8">
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              trendUp={stat.trend?.includes('+') || (stat.title === '客户总数' && stat.trend?.includes('+'))}
              gradient={`linear-gradient(135deg, ${stat.colorStops[0]} 0%, ${stat.colorStops[1]} 100%)`}
            />
          </Col>
        ))}
      </Row>

      <div className="section-divider"></div>

      {/* Main Content Grid */}
      <Row gutter={[24, 24]}>
        {/* Recent Payments - Wider Column */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space size="middle">
                <div style={{ background: '#6366f1', padding: '8px 10px', borderRadius: 10, boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
                  <DollarOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <Space direction="vertical" size={2}>
                  <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                    最近付款申请
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {recentPayments.length} 条记录 · 更新于 {new Date().toLocaleDateString('zh-CN')}
                  </Text>
                </Space>
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/payments')}
                style={{
                  color: '#8b5cf7',
                      fontWeight: 600,
                    fontSize: 14,
                  }}
              >
                查看全部
                <ArrowUpOutlined rotate={90} style={{ marginLeft: 4 }} />
              </Button>
            }
            className="glass-panel"
            styles={{
              header: {
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '20px 24px',
              },
            }}
          >
            <div className="custom-scrollbar" style={{ maxHeight: 350 }}>
              <Table
                columns={paymentColumns}
                dataSource={recentPayments}
                pagination={false}
                size="small"
                rowKey="id"
                showHeader={true}
                locale={{ emptyText: '暂无数据' }}
                scroll={{ y: 280 }}
              />
            </div>
          </Card>
        </Col>

        {/* Recent Contracts - Narrower Column */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space size="middle">
                <div style={{ background: '#a855f7', padding: '8px 10px', borderRadius: 10, boxShadow: '0 4px 15px rgba(168,85,247,0.3)' }}>
                  <FileTextOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <Space direction="vertical" size={2}>
                  <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                    最近签约
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {recentContracts.length} 条记录 · 本月新增
                  </Text>
                </Space>
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/contracts')}
                style={{
                  color: '#c084fc',
                      fontWeight: 600,
                    fontSize: 14,
                  }}
              >
                查看全部
                <ArrowUpOutlined rotate={90} style={{ marginLeft: 4 }} />
              </Button>
            }
            className="glass-panel"
            styles={{
              header: {
                borderBottom: 'rgba(255,255,255,0.08)',
                    padding: '20px 24px',
              },
            }}
          >
            <div className="custom-scrollbar" style={{ maxHeight: 350 }}>
              <Table
                columns={contractColumns}
                dataSource={recentContracts}
                pagination={false}
                size="small"
                rowKey="id"
                showHeader={true}
                locale={{ emptyText: '暂无数据' }}
                scroll={{ y: 280 }}
              />
            </div>
          </Card>

          {/* Quick Actions Card */}
          <div className="glass-panel grid-card" style={{ marginTop: 16 }}>
            <Title level={4} style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>
              快捷操作
            </Title>
            <Row gutter={[12, 12]}>
              {[
                { label: '新建项目', icon: '+', color: '#6366f1' },
                { label: '新增客户', icon: '+', color: '#0ea5e9' },
                { label: '创建合同', icon: '+', color: '#a855f7' },
                { label: '提交付款', icon: '+', color: '#f59e0b' },
              ].map((item, idx) => (
                <Col xs={12} key={idx}>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: '16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                      e.currentTarget.style.borderColor = `${item.color}40`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: `${item.color}20`,
                        borderRadius: 10,
                        margin: '0 auto 8px',
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}
                    >
                      {item.icon}
                    </div>
                    <Text style={{ fontSize: 13, color: '#e2e8f0' }}>{item.label}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Col>
      </Row>

      {/* Pending Tasks Section */}
      <Card
        title={
          <Space size="middle">
            <div style={{ background: '#f59e0b', padding: '8px 10px', borderRadius: 10, boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
              <ClockCircleOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <Space direction="vertical" size={2}>
              <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                待办事项
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {[
                  '高优先级', '中优先级', '低优先级'
                ].join(' · ')}
              </Text>
            </Space>
          </Space>
        }
        className="glass-panel"
        styles={{
          header: {
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '20px 24px',
          },
        }}
        style={{ marginTop: 16 }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {[
            {
              title: '审批：B地块商业配套 - 进度款',
              subtitle: '2,500,000 元 | 待财务复核',
              priority: 'high' as const,
              time: '需在今日 17:00 前回复',
            },
            {
              title: '合同签署：C地块景观工程分包合同',
              subtitle: '合作方已盖章，待我方签署',
              priority: 'medium' as const,
              time: '2 小时前',
            },
            {
              title: '客户跟进：A地块客户张三 - 首付分期方案',
              subtitle: '需在今日 17:00 前回复',
              priority: 'high' as const,
              time: '今天',
            },
            {
              title: '预算审批：Q3市场营销费用调整',
              subtitle: '超出原预算15%，等待最终批准',
              priority: 'low' as const,
              time: '昨天',
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '16px 20px',
                background: 'rgba(99, 102, 241, 0.03)',
                borderRadius: 12,
                transition: 'all 0.3s ease',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.03)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background:
                    item.priority === 'high'
                      ? '#ef4444'
                      : item.priority === 'medium'
                      ? '#f59e0b'
                      : '#22c55e',
                  marginTop: 6,
                  boxShadow: `0 0 10px ${item.priority === 'high' ? '#ef4444' : item.priority === 'medium' ? '#f59e0b' : '#22c55e'}60`,
                }}
              />
              <div style={{ flex: 1 }}>
                <Text
                  strong
                  style={{
                    color: '#fff',
                    marginRight: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {item.title}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {item.subtitle} · {item.time}
                </Text>
              </div>
              <Button
                type="text"
                icon={<ArrowUpOutlined rotate={90} />}
                style={{ color: '#94a3b8' }}
                onClick={() => console.log('View', index)}
              />
            </div>
          ))}
        </Space>
      </Card>
    </div>
  );
};

export default DashboardPage;
