import { useState, useEffect } from 'react';
import * as React from 'react';
import {
  Building2,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import type { Project, PropertyUnit } from '../types/database';

// 子组件
import BasicInfo from '../components/project/ProjectBasicInfo';
import Timeline from '../components/project/ProjectTimeline';
import CostBudget from '../components/project/ProjectCostBudget';
import Sales from '../components/project/ProjectSales';
import Financials from '../components/project/ProjectFinancials';

// Tab 定义
interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: 'basic', label: '基本信息', icon: Building2 },
  { id: 'timeline', label: '时间计划', icon: Clock },
  { id: 'cost', label: '成本预算', icon: DollarSign },
  { id: 'sales', label: '销售规划', icon: FileText },
  { id: 'financials', label: '费用税金', icon: CheckCircle2 },
];

export default function ProjectForm() {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 表单数据状态
  const [formData, setFormData] = useState<Partial<Project>>({
    project_name: '',
    location: '',
    developer_name: '',
    planning_scheme: '',
    design_scheme: '',
    estimated_sales: null,
    tax_estimates: null,
    planning_metrics: null,
    management_fee: null,
    marketing_expense: null,
    sales_commission: null,
  });

  // Tab-specific state
  const [costBudgets, setCostBudgets] = useState<Partial<any>[]>([]);
  const [propertyUnits, setPropertyUnits] = useState<PropertyUnit[]>([]);

  useEffect(() => {
    const urlParts = window.location.pathname.split('/');
    const id = urlParts[urlParts.length - 1];
    if (id && id !== 'new') {
      loadProjectData(id);
    }
  }, []);

  const loadProjectData = async (id: string) => {
    try {
      setLoading(true);
      // TODO: 调用 API 获取项目数据
      console.log('Loading project:', id);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (data: Partial<Project>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSave = async () => {
    if (!formData.project_name || !formData.location) {
      alert('请填写必填字段：项目名称和地址');
      return;
    }

    setSaving(true);
    try {
      // TODO: 调用后端 API
      const response = await fetch('/api/projects', {
        method: formData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('项目保存成功');
        window.location.href = '/projects';
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/projects';
  };

  return (
    <div className="p-4 md:p-8 flex-1 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-sm font-medium text-on-surface hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface rounded-lg text-xs font-bold transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-[0_4px_14px_0_rgba(0,209,255,0.39)] disabled:opacity-50"
          >
            {saving ? '保存中...' : '创建项目'}
          </button>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-3xl lg:text-4xl font-bold text-on-surface mb-1">
          新建项目
        </h2>
        <p className="text-sm text-on-surface-variant">
          填写以下信息完成项目立项
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant/30">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'}
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[60vh] pb-8">
        {activeTab === 'basic' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-bold text-on-surface mb-4">基本信息</h3>
            <BasicInfo initialData={formData} onChange={handleFormChange} />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-bold text-on-surface mb-4">时间计划</h3>
            <Timeline initialData={formData} onChange={handleFormChange} />
          </div>
        )}

        {activeTab === 'cost' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-bold text-on-surface mb-4">成本预算</h3>
            <CostBudget initialData={formData} />
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-bold text-on-surface mb-4">销售规划</h3>
            <div className="p-8 border-2 border-dashed border-outline-variant/30 rounded-lg text-center">
              <Building2 className="w-12 h-12 mx-auto text-on-surface-variant mb-4" />
              <p className="text-sm text-on-surface-variant">
                请先保存项目以获取项目ID，然后管理房源数据
              </p>
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-bold text-on-surface mb-4">费用税金</h3>
            <Financials initialData={formData} onChange={handleFormChange} />
          </div>
        )}
      </div>
    </div>
  );
}
