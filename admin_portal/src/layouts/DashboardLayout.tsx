import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  BarChartOutlined,
  AuditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme, Button, Avatar, Dropdown, Space, Typography } from 'antd';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    label: (
      <Link to="/dashboard" className="menu-item">
        <Space>
          <DashboardOutlined />
          <span>仪表盘</span>
        </Space>
      </Link>
    ),
  },
  {
    key: '/dashboard/projects',
    label: (
      <Link to="/dashboard/projects" className="menu-item">
        <Space>
          <AppstoreOutlined />
          <span>项目管理</span>
        </Space>
      </Link>
    ),
  },
  {
    key: '/dashboard/customers',
    label: (
      <Link to="/dashboard/customers" className="menu-item">
        <Space>
          <UserOutlined />
          <span>客户管理</span>
        </Space>
      </Link>
    ),
  },
  {
    key: '/dashboard/contracts',
    label: (
      <Link to="/dashboard/contracts" className="menu-item">
        <Space>
          <FileTextOutlined />
          <span>合同管理</span>
        </Space>
      </Link>
    ),
  },
  {
    key: '/dashboard/payments',
    label: (
      <Link to="/dashboard/payments" className="menu-item">
        <Space>
          <DollarOutlined />
          <span>支付审批</span>
        </Space>
      </Link>
    ),
  },
  {
    key: '/dashboard/budget',
    label: (
      <Link to="/dashboard/budget" className="menu-item">
        <Space>
          <BarChartOutlined />
          <span>预算成本</span>
        </Space>
      </Link>
    ),
  },
  {
    key: '/dashboard/audit',
    label: (
      <Link to="/dashboard/audit" className="menu-item">
        <Space>
          <AuditOutlined />
          <span>审计日志</span>
        </Space>
      </Link>
    ),
  },
];

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: token.colorBgBase,
      }}
    >
      {/* Sidebar with Apple-inspired gradient */}
      <Sider
        theme="dark"
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={280}
        style={{
          height: '100vh',
          zIndex: 100,
          position: 'fixed',
          background:
            'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0.95) 100%)',
        }}
      >
        {/* Logo Area */}
        <div
          style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: `0 ${collapsed ? 0 : 24}px`,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(99,102,241,0.05)',
          }}
        >
          {!collapsed && (
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background:
                    'linear-gradient(135deg, #6366f1 0%, #8b5cf7 50%, #d946ef 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                }}
              >
                <span style={{ color: '#fff', fontSize: 18 }}>AJ</span>
              </div>
              <span>AJ SYSTEM</span>
            </div>
          )}
          {collapsed && (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background:
                  'linear-gradient(135deg, #6366f1 0%, #8b5cf7 50%, #d946ef 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
              }}
            >
              <span style={{ color: '#fff', fontSize: 16 }}>AJ</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '16px 0',
          }}
        />
      </Sider>

      {/* Main Content Area */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 280,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 99,
            width: '100%',
            padding: '0 32px',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid rgba(255,255,255,0.08)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            icon={
              collapsed ? (
                <MenuUnfoldOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
              ) : (
                <MenuFoldOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
              )
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{
              marginRight: 16,
              color: token.colorText,
              borderRadius: 10,
              transition: 'all 0.3s ease',
            }}
            className="glass-btn"
          />

          <Space size="large">
            {/* Search Bar */}
            <div
              style={{
                position: 'relative',
              }}
            >
              <input
                type="text"
                placeholder="搜索..."
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  padding: '8px 36px 8px 40px',
                  color: '#fff',
                  width: 200,
                  transition: 'all 0.3s ease',
                  fontSize: 13,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                  e.currentTarget.style.borderColor = '#8b5cf7';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              >
                🔍
              </span>
            </div>

            {/* Notifications */}
            <Button
              type="text"
              style={{
                position: 'relative',
                borderRadius: 10,
              }}
              className="glass-btn"
              onClick={() => console.log('Notifications')}
            >
              <Space>
                <span style={{ fontSize: 18 }}>🔔</span>
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 8,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 10px #ef4444',
                  }}
                />
              </Space>
            </Button>

            {/* User Profile */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    label: (
                      <Link to="/profile" className="menu-item">
                        个人中心
                      </Link>
                    ),
                  },
                  {
                    key: 'settings',
                    label: (
                      <Link to="/settings" className="menu-item">
                        系统设置
                      </Link>
                    ),
                  },
                  {
                    key: 'logout',
                    label: '退出登录',
                  },
                ],
              }}
              trigger={['click']}
            >
              <a onClick={(e) => e.preventDefault()} className="glass-btn">
                <Space size={10}>
                  <Avatar
                    size={36}
                    style={{
                      background:
                        'linear-gradient(135deg, #6366f1 0%, #8b5cf7 100%)',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    管
                  </Avatar>
                  <Space direction="vertical" size={0} style={{ display: 'flex' }}>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                      管理员
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      admin@ajsystem.com
                    </Text>
                  </Space>
                </Space>
              </a>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            margin: '48px 32px 0',
            minHeight: 'calc(100vh - 64px)',
            padding: '24px',
            background: 'rgba(99, 102, 241, 0.02)',
            borderRadius: 20,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
