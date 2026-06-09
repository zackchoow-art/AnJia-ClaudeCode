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
  Divider,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Upload,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  UploadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { Project } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

// 模拟数据
const mockProjects: Project[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `PRJ${1000 + i}`,
  project_name: ['A地块住宅项目', 'B地块商业配套', 'C地块景观工程', 'D地块办公大楼'][i % 4],
  location: [
    '北京市朝阳区建国路88号',
    '上海市浦东新区世纪大道100号',
    '深圳市南山区科技园科苑路1号',
    '广州市天河区珠江新城华强路2号',
  ][i % 4],
  developer_name: ['万科地产', '碧桂园', '恒大集团', '融创中国'][i % 4],
  project_status: (['PLANNING', 'IN_PROGRESS', 'COMPLETED'][i % 3] as any),
  start_date: `202${2 + Math.floor(i / 5)}-01-15`,
  expected_completion: `202${4 + Math.floor(i / 5)}-12-31`,
  total_land_area: 50000 + i * 10000,
  total_built_area: 120000 + i * 20000,
  total_budget: 100000000 + i * 50000000,
  tax_planning_baseline: 8000000 + i * 4000000,
  actual_tax_amount: 7500000 + i * 3500000,
  created_at: new Date(Date.now() - i * 86400000 * 15).toISOString(),
}));

const ProjectsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const projectStatusConfig: Record<string, { color: string; text: string }> = {
    PLANNING: { color: '#fbbf24', text: '规划中' },
    IN_PROGRESS: { color: '#3b82f6', text: '建设中' },
    COMPLETED: { color: '#10b981', text: '已竣工' },
  };

  const columns: ColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Badge
            dot
            color={record.project_status === 'IN_PROGRESS' ? '#3b82f6' : record.project_status === 'PLANNING' ? '#fbbf24' : '#10b981'}
          >
            <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>{text}</strong>
          </Badge>
        </div>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '开发商',
      dataIndex: 'developer_name',
      key: 'developer_name',
    },
    {
      title: '状态',
      dataIndex: 'project_status',
      key: 'project_status',
      render: (status) => {
        const cfg = projectStatusConfig[status];
        return (
          <Tag
            color="default"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              borderColor: (cfg?.color || '#94a3b8') + '33',
              borderWidth: 1,
            }}
          >
            <span style={{ color: cfg?.color || '#94a3b8' }}>{cfg?.text || status}</span>
          </Tag>
        );
      },
    },
    {
      title: '总建筑面积',
      key: 'total_built_area',
      render: (_, record) => (
        <span style={{ fontWeight: 500, color: '#cbd5e1' }}>
          {(record.total_built_area / 10000).toFixed(2)} 万㎡
        </span>
      ),
    },
    {
      title: '项目预算',
      key: 'total_budget',
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: '#fff' }}>
          ¥{(record.total_budget / 100000000).toFixed(2)} 亿
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
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
              onClick={() => {
                setEditingProject(record);
                setIsModalOpen(true);
              }}
              style={{ color: '#3b82f6' }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm title="确定删除此项目？" onConfirm={() => console.log('删除', record.id)}>
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredProjects = mockProjects.filter((p) => {
    const matchesSearch =
      p.project_name.includes(searchText) ||
      p.location.includes(searchText);
    const matchesStatus =
      filterStatus === '' || p.project_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 统计卡片
  const StatsRow = () => (
    <div style={{ marginBottom: 24 }}>
      <Space size="middle" style={{ flexWrap: 'wrap' }}>
        {[
          { label: '项目总数', value: mockProjects.length, color: '#6366f1' },
          { label: '规划中', value: mockProjects.filter(p => p.project_status === 'PLANNING').length, color: '#fbbf24' },
          { label: '建设中', value: mockProjects.filter(p => p.project_status === 'IN_PROGRESS').length, color: '#3b82f6' },
          { label: '已竣工', value: mockProjects.filter(p => p.project_status === 'COMPLETED').length, color: '#10b981' },
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
            项目管理
          </Text>
          <Title level={2} style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>
            所有项目
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
            'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        }}
      >
        <Space style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            style={{
              background:
                'linear-gradient(135deg, #6366f1 0%, #8b5cf7 100%)',
              borderRadius: 12,
            }}
          >
            添加项目
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
              placeholder="搜索项目名称或位置..."
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
              ...Object.entries(projectStatusConfig).map(([value, cfg]) => ({ value, label: cfg.text })),
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
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '20px 24px',
          },
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            显示 {filteredProjects.length} 个项目
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={filteredProjects}
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

      <ProjectFormModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        project={editingProject || undefined}
      />
    </div>
  );
};

const ProjectFormModal: React.FC<{
  open: boolean;
  onCancel: () => void;
  project?: Project;
}> = ({ open, onCancel, project }) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title={
        <Space size="middle">
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 14 }}>AJ</span>
          </div>
          <span>{project ? '编辑项目' : '添加新项目'}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={720}
      styles={{
        content: {
          borderRadius: 20,
          padding: '32px',
        },
      }}
    >
      <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

      <Form form={form} layout="vertical" initialValues={project}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>项目名称</span>
              }
              name="project_name"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="例如：A地块住宅项目" className="glass-input" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>项目位置</span>
              }
              name="location"
              rules={[{ required: true, message: '请输入项目地址' }]}
            >
              <Input placeholder="例如：北京市朝阳区建国路88号" className="glass-input" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>开发商</span>
              }
              name="developer_name"
              rules={[{ required: true, message: '请输入开发商名称' }]}
            >
              <Input placeholder="例如：万科地产" className="glass-input" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>项目状态</span>
              }
              name="project_status"
              rules={[{ required: true, message: '请选择项目状态' }]}
            >
              <Select placeholder="请选择项目状态" className="glass-select">
                {['PLANNING', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
                  <Option key={s} value={s}>
                    {['规划中', '建设中', '已竣工'][
                      ['PLANNING', 'IN_PROGRESS', 'COMPLETED'].indexOf(s)
                    ]}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>总土地面积</span>
              }
              tooltip="单位：平方米"
            >
              <Input type="number" placeholder="例如：50000" className="glass-input" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>总建筑面积</span>
              }
              tooltip="单位：平方米"
            >
              <Input type="number" placeholder="例如：120000" className="glass-input" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>项目预算</span>
              }
              tooltip="单位：元"
            >
              <Input type="number" placeholder="例如：100000000" className="glass-input" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>土增税基线</span>
              }
              tooltip="单位：元"
            >
              <Input type="number" placeholder="例如：8000000" className="glass-input" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label={
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>项目资料</span>
          }>
          <Upload.Dragger
            name="files"
            beforeUpload={() => false}
            multiple
            showUploadList={true}
            accept=".pdf,.doc,.docx,.jpg,.png"
            className="glass-upload"
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 32, color: '#6366f1' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持格式：PDF, Word, 图片 (JPG, PNG)
            </p>
          </Upload.Dragger>
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
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf7 100%)',
          }}>
            {project ? '保存修改' : '添加项目'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ProjectsPage;
