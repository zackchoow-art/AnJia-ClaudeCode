import { useState } from 'react';
import type { Project } from '../../types/database';

interface Props {
  initialData?: Project;
  onChange: (data: Partial<Project>) => void;
}

export default function ProjectBasicInfo({ initialData, onChange }: Props) {
  const [formData, setFormData] = useState<Partial<Project>>({
    project_name: initialData?.project_name || '',
    location: initialData?.location || '',
    developer_name: initialData?.developer_name || '',
    planning_scheme: initialData?.planning_scheme || '',
    design_scheme: initialData?.design_scheme || '',
  });

  const handleChange = (field: keyof Project, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* 必填字段 */}
      <div className="p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">必填字段</h3>
        <p className="text-xs text-on-surface-variant mb-4">
          标有 * 的字段为必填项
        </p>
      </div>

      {/* 项目名称 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
            项目名称 *
          </label>
          <input
            type="text"
            value={formData.project_name}
            onChange={(e) => handleChange('project_name', e.target.value)}
            placeholder="例如：绿洲花园住宅小区"
            className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
          />
        </div>

        {/* 开发商名称 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
            开发商 *{' '}
            <span className="text-xs font-normal text-on-surface-variant">(Developer Name)</span>
          </label>
          <input
            type="text"
            value={formData.developer_name}
            onChange={(e) => handleChange('developer_name', e.target.value)}
            placeholder="例如：XX房地产开发有限公司"
            className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
          />
        </div>
      </div>

      {/* 项目地址 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
          项目地址 *
        </label>
        <textarea
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="请输入详细的项目地址"
          rows={3}
          className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none resize-none"
        />
      </div>

      {/* 选填字段分隔 */}
      <div className="border-t border-outline-variant/30 my-6"></div>
      <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">扩展信息（可选）</h3>

      {/* 规划方案 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
          规划方案
          <span className="text-xs font-normal text-on-surface-variant">(Planning Scheme)</span>
        </label>
        <textarea
          value={formData.planning_scheme}
          onChange={(e) => handleChange('planning_scheme', e.target.value)}
          placeholder="描述项目的总体规划理念、功能分区等"
          rows={3}
          className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none resize-none"
        />
      </div>

      {/* 设计方案 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
          设计方案
          <span className="text-xs font-normal text-on-surface-variant">(Design Scheme)</span>
        </label>
        <textarea
          value={formData.design_scheme}
          onChange={(e) => handleChange('design_scheme', e.target.value)}
          placeholder="描述建筑设计风格、外立面、户型设计等"
          rows={3}
          className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none resize-none"
        />
      </div>
    </div>
  );
}
