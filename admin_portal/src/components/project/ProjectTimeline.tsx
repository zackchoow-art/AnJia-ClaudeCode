import { useState } from 'react';
import type { Project } from '../../types/database';

interface Props {
  initialData?: Project;
  onChange: (data: Partial<Project>) => void;
}

// 默认时间节点定义
const DEFAULT_TIMELINE_EVENTS = [
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

// 自定义时间节点接口
interface CustomTimelineEvent {
  id: string;
  name_zh: string;
  name_en: string;
  event_date: string | null;
}

export default function ProjectTimeline({ initialData, onChange }: Props) {
  const [timeline] = useState(DEFAULT_TIMELINE_EVENTS);
  const [customEvents, setCustomEvents] = useState<CustomTimelineEvent[]>(() => {
    // TODO: Load from API when implemented
    return [];
  });

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    return dateString.substring(0, 10);
  };

  const handleChange = (field: keyof Project, value: string | null) => {
    onChange({ [field]: value });
  };

  // 自定义时间事件处理
  const addCustomEvent = () => {
    setCustomEvents([
      ...customEvents,
      { id: Date.now().toString(), name_zh: '', name_en: '', event_date: null },
    ]);
  };

  const updateCustomEvent = (id: string, field: keyof CustomTimelineEvent, value: any) => {
    setCustomEvents(
      customEvents.map((event) =>
        event.id === id ? { ...event, [field]: value } : event
      )
    );
  };

  const removeCustomEvent = (id: string) => {
    setCustomEvents(customEvents.filter((e) => e.id !== id));
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

  // 获取所有时间节点（默认 + 自定义）
  const getAllEvents = () => {
    const events = [...timeline];

    // 添加自定义事件到合适的位置（按日期排序）
    customEvents.forEach((event, index) => {
      events.push({
        key: `custom_${index}`,
        label: event.name_zh || '自定义节点',
        labelEn: event.name_en || 'Custom Event',
        icon: 'calendar',
        isCustom: true,
        customId: event.id,
        customEvent: event,
      });
    });

    // 按日期排序
    return events.sort((a, b) => {
      const getEventDate = (event: typeof events[0]) => {
        if (event.isCustom && event.customEvent?.event_date) {
          const date = new Date(event.customEvent.event_date);
          return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        // For default events, get from initialData
        const key = event.key as keyof Project;
        const val = initialData?.[key];
        if (typeof val === 'string' && val.length > 0) {
          const date = new Date(val);
          return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        return 0;
      };

      const dateA = getEventDate(a);
      const dateB = getEventDate(b);
      return dateA - dateB;
    });
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
                  {event.label}{' '}
                  <span className="text-xs font-normal text-on-surface-variant">({event.labelEn})</span>
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

        {/* 自定义时间节点 */}
        {customEvents.map((event, index) => (
          <div
            key={event.id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-surface/50 rounded-lg border border-primary/20 hover:border-primary/30 transition-colors"
          >
            {/* 自定义标签 */}
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              +
            </div>

            <div className="flex-1 min-w-0 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
              {/* 中文名称 */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="节点名称（中文）"
                  value={event.name_zh}
                  onChange={(e) => updateCustomEvent(event.id, 'name_zh', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 英文名称 */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Node Name (English)"
                  value={event.name_en}
                  onChange={(e) => updateCustomEvent(event.id, 'name_en', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 日期 */}
              <div className="flex-1">
                <input
                  type="date"
                  value={event.event_date || ''}
                  onChange={(e) => updateCustomEvent(event.id, 'event_date', e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                />
              </div>

              {/* 删除按钮 */}
              <button
                onClick={() => removeCustomEvent(event.id)}
                className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                title="删除节点"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 添加自定义节点按钮 */}
      <button
        onClick={addCustomEvent}
        className="w-full py-3 border-2 border-dashed border-outline-variant/30 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        添加自定义时间节点
      </button>

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
          <li>可添加任意数量的自定义时间节点</li>
          <li>时间轴会根据实际日期自动计算工期</li>
        </ul>
      </div>
    </div>
  );
}
