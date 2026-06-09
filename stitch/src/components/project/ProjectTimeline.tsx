import { useState } from 'react';
import type { Project } from '../../types/database';

interface Props {
  initialData?: Project;
  onChange: (data: Partial<Project>) => void;
}

// 时间节点定义
const TIMELINE_EVENTS = [
  {
    key: 'land_acquisition_date',
    label: '拿地时间',
    labelEn: 'Land Acquisition',
    icon: '_land',
  },
  {
    key: 'commencement_date',
    label: '动工时间',
    labelEn: 'Commencement',
    icon: 'construction',
  },
  {
    key: 'pre_sale_date',
    label: '预售时间',
    labelEn: 'Pre-Sale',
    icon: 'document',
  },
  {
    key: 'main_capping_date',
    label: '主体封顶',
    labelEn: 'Main Capping',
    icon: 'building',
  },
  {
    key: 'main_acceptance_date',
    label: '主体验收',
    labelEn: 'Acceptance',
    icon: 'check-circle',
  },
  {
    key: 'delivery_date',
    label: '交房时间',
    labelEn: 'Delivery',
    icon: 'key',
  },
];

export default function ProjectTimeline({ initialData, onChange }: Props) {
  const [timeline] = useState(TIMELINE_EVENTS);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    return dateString.substring(0, 10);
  };

  const handleChange = (field: keyof Project, value: string | null) => {
    onChange({ [field]: value });
  };

  // 计算甘特图样式（简单实现）
  const getTimelineStyle = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return { width: '100%', opacity: 0.3 };

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();

    // 简单的进度计算
    if (now < start) return { width: '0%' };
    if (now >= end) return { width: '100%' };

    const total = end - start;
    const elapsed = now - start;
    const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));

    return { width: `${percentage}%` };
  };

  return (
    <div className="space-y-6">
      {/* 时间节点列表 */}
      <div className="space-y-4">
        {timeline.map((event, index) => {
          const dateValue = formatDate((initialData?.[event.key as keyof Project] || null) as string);

          return (
            <div
              key={event.key}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-surface/50 rounded-lg border border-outline-variant/20 hover:border-primary/30 transition-colors"
            >
              {/* 序号圆圈 */}
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {index + 1}
              </div>

              {/* 标签 */}
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-on-surface mb-1">
                  {event.label} <span className="text-xs font-normal text-on-surface-variant">({event.labelEn})</span>
                </label>
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => handleChange(event.key as keyof Project, e.target.value || null)}
                  className="w-full sm:w-auto px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 时间轴可视化（简化版甘特图） */}
      <div className="p-5 bg-surface/50 rounded-lg border border-outline-variant/20">
        <h4 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          项目时间轴
        </h4>

        {initialData?.land_acquisition_date && initialData?.delivery_date ? (
          <div className="space-y-3">
            {/* 基础时间线 */}
            <div className="relative h-8 bg-surface-container rounded-full overflow-hidden">
              {/* 时间进度条 */}
              <div
                className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary/20 to-primary/60 transition-all duration-500 ${
                  new Date() > new Date(initialData.delivery_date!)
                    ? 'bg-green-500/30'
                    : ''
                }`}
                style={{
                  left: '5%',
                  right: '5%',
                }}
              ></div>
            </div>

            {/* 时间点标记 */}
            <div className="flex justify-between px-2 text-xs text-on-surface-variant">
              <span>拿地</span>
              <span>动工</span>
              <span>预售</span>
              <span>封顶</span>
              <span>验收</span>
              <span>交房</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-on-surface-variant/50">
            添加时间节点后将在此显示项目时间轴
          </div>
        )}
      </div>

      {/* 注意事项 */}
      <div className="p-4 border-l-4 border-secondary-container bg-secondary-container/10 rounded-r-lg">
        <h4 className="text-sm font-bold text-secondary mb-2">时间计划说明</h4>
        <ul className="list-disc list-inside space-y-1 text-xs text-on-surface-variant">
          <li>请按实际项目规划填写各时间节点</li>
          <li>建议预留一定的缓冲时间以应对不可预见的情况</li>
          <li>时间轴会根据实际日期自动计算工期</li>
        </ul>
      </div>
    </div>
  );
}
