import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Filter, Building2 } from 'lucide-react';
import type { Project, PropertyUnit } from '../../types/database';

interface Props {
  projectId: string;
}

const STATUS_COLORS = {
  AVAILABLE: 'bg-green-100 text-green-700 border-green-200',
  RESERVED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  UNDER_CONTRACT: 'bg-blue-100 text-blue-700 border-blue-200',
  SOLD: 'bg-purple-100 text-purple-700 border-purple-200',
  OWNER_OCCUPIED: 'bg-gray-100 text-gray-700 border-gray-200',
  UNAVAILABLE: 'bg-red-100 text-red-700 border-red-200',
};

export default function ProjectSales({ projectId }: Props) {
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: 调用后端API获取数据
      // const response = await fetch(`/api/projects/${projectId}/units`);
      // const data = await response.json();
      // setUnits(data);

      // Mock data for now
      setUnits([
        {
          id: '1',
          project_id: projectId,
          building_number: 'A栋',
          floor_number: 1,
          unit_number: '1单元',
          room_number: '101',
          property_code: 'A-1-1-101',
          property_type: { zh: '三室两厅', ug: '3 ئۆي 2 مەيدان' },
          floor_area: 120.5,
          usable_area: 98.2,
          orientation: '南北通透',
          list_price: 1500000,
          final_price: null,
          price_per_sqm: 12448,
          property_status: 'AVAILABLE',
          features: ['学区房', '南北通透', '电梯房'],
          created_by: '',
          created_at: new Date().toISOString(),
          updated_by: null,
          updated_at: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.property_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.building_number.includes(searchQuery) ||
      `${unit.floor_number}${unit.unit_number}${unit.room_number}`.includes(searchQuery);

    const matchesFilter =
      filterStatus === 'all' || unit.property_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      AVAILABLE: '可售',
      RESERVED: '预留',
      UNDER_CONTRACT: '合同中',
      SOLD: '已售',
      OWNER_OCCUPIED: '自持',
      UNAVAILABLE: '不可售',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-on-surface">房源数据</h3>
          <p className="text-sm text-on-surface-variant">
            管理本项目的详细房源信息，包括可售、预留、已售等状态
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          添加房源
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="搜索房源编号、栋号或房号"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 outline-none text-sm"
        >
          <option value="all">全部状态</option>
          <option value="AVAILABLE">可售</option>
          <option value="RESERVED">预留</option>
          <option value="UNDER_CONTRACT">合同中</option>
          <option value="SOLD">已售</option>
        </select>
      </div>

      {/* 房源列表 */}
      <div className="bg-surface/50 rounded-lg border border-outline-variant/20 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container/50 text-xs text-on-surface-variant uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold">房源编号</th>
              <th className="px-4 py-3 font-semibold">位置</th>
              <th className="px-4 py-3 font-semibold">户型</th>
              <th className="px-4 py-3 font-semibold text-right">面积</th>
              <th className="px-4 py-3 font-semibold text-right">标牌价</th>
              <th className="px-4 py-3 font-semibold text-center">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filteredUnits.map((unit) => (
              <tr key={unit.id} className="hover:bg-primary/5 transition-colors group">
                <td className="px-4 py-3 font-mono text-sm">{unit.property_code}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-on-surface-variant" />
                    <span className="text-sm text-on-surface">
                      {unit.building_number} - {unit.floor_number}层 {unit.unit_number}单元 {unit.room_number}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{unit.property_type.zh}</td>
                <td className="px-4 py-3 text-right font-mono text-sm">
                  {unit.floor_area} ㎡
                </td>
                <td className="px-4 py-3 text-right font-mono text-primary">
                  ¥{(unit.list_price || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border ${STATUS_COLORS[unit.property_status as keyof typeof STATUS_COLORS] || ''}`}
                  >
                    {getStatusLabel(unit.property_status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 空状态 */}
        {filteredUnits.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-on-surface-variant/30 mb-4" />
            <h3 className="text-sm font-medium text-on-surface">暂无房源数据</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              点击"添加房源"按钮来创建房源记录
            </p>
          </div>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总房源', value: units.length },
          { label: '可售', value: units.filter((u) => u.property_status === 'AVAILABLE').length },
          { label: '预留', value: units.filter((u) => u.property_status === 'RESERVED').length },
          { label: '已售', value: units.filter((u) => u.property_status === 'SOLD').length },
        ].map((stat, index) => (
          <div key={index} className="bg-surface/50 rounded-lg p-4 border border-outline-variant/20">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
