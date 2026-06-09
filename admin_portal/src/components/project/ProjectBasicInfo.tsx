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

  // Handle planning metrics changes
  const handleMetricChange = (metric: string, value: number | null) => {
    const currentMetrics = initialData?.planning_metrics || {};
    const newMetrics = { ...currentMetrics, [metric]: value };

    // Remove metric if value is null/empty
    if (value === null || value === 0) {
      delete newMetrics[metric];
    }

    onChange({ planning_metrics: newMetrics });
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

      {/* 规划方案文件上传 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
          规划方案文档
          <span className="text-xs font-normal text-on-surface-variant">(Planning Scheme)</span>
        </label>
        <div className="p-4 bg-surface/50 rounded-lg border border-outline-variant/20">
          {/* File upload component would be here */}
          <p className="text-sm text-on-surface-variant mb-2">
            上传规划方案文档（PDF/PPTX），建议使用PPTX格式
          </p>
          <input
            type="file"
            accept=".pdf,.pptx,.ppt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // TODO: Implement upload logic
                console.log('Planning document selected:', file.name);
                handleChange('planning_scheme', `uploaded:${file.name}`);
              }
            }}
            className="block w-full text-sm text-on-surface-variant
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-primary/10 file:text-primary
              hover:file:bg-primary/20
              cursor-pointer"
          />
        </div>
      </div>

      {/* 设计方案文件上传 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
          设计方案文档
          <span className="text-xs font-normal text-on-surface-variant">(Design Scheme)</span>
        </label>
        <div className="p-4 bg-surface/50 rounded-lg border border-outline-variant/20">
          {/* File upload component would be here */}
          <p className="text-sm text-on-surface-variant mb-2">
            上传设计方案文档（PDF/PPTX），建议使用PPTX格式
          </p>
          <input
            type="file"
            accept=".pdf,.pptx,.ppt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // TODO: Implement upload logic
                console.log('Design document selected:', file.name);
                handleChange('design_scheme', `uploaded:${file.name}`);
              }
            }}
            className="block w-full text-sm text-on-surface-variant
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-primary/10 file:text-primary
              hover:file:bg-primary/20
              cursor-pointer"
          />
        </div>
      </div>

      {/* 规划指标 - 移动到此页面 */}
      <div className="border-t border-outline-variant/30 pt-6">
        <h4 className="text-sm font-medium text-on-surface mb-4">规划指标</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 绿化率 */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              绿化率 (%)
              <span className="ml-1 text-[10px] text-on-surface-variant">(Green Rate)</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="例如：30"
              value={initialData?.planning_metrics?.green_rate || ''}
              onChange={(e) => handleMetricChange('green_rate', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>

          {/* 容积率 */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              容积率
              <span className="ml-1 text-[10px] text-on-surface-variant">(Plot Ratio)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="例如：2.5"
              value={initialData?.planning_metrics?.plot_ratio || ''}
              onChange={(e) => handleMetricChange('plot_ratio', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>

          {/* 建筑密度 */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              建筑密度 (%)
              <span className="ml-1 text-[10px] text-on-surface-variant">(Building Density)</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="例如：25"
              value={initialData?.planning_metrics?.building_density || ''}
              onChange={(e) => handleMetricChange('building_density', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>

          {/* 地上建筑面积 */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              地上建筑面积 (㎡)
              <span className="ml-1 text-[10px] text-on-surface-variant">(Gross Area)</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="例如：50000"
              value={initialData?.planning_metrics?.built_up_area || ''}
              onChange={(e) => handleMetricChange('built_up_area', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
