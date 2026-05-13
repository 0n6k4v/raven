import React, { useState, useMemo, memo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { getProvinceStatistics } from '../../../mockUp/data';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const CHART_COLORS = {
  firearms: ['#e53e3e', '#c53030', '#9b2c2c', '#822727', '#681e1e'],
  drugs: ['#805ad5', '#6b46c1', '#553c9a', '#44337a', '#322659'],
  general: ['#3182ce', '#2b6cb0', '#2c5282', '#2a4365', '#1A365D']
};

class ColorThemeService {
  static getColor(type, index = 0) {
    const palette = CHART_COLORS[type] || CHART_COLORS.general;
    return palette[index % palette.length];
  }
}

class StatCalculationService {
  static formatNumber(num) {
    return new Intl.NumberFormat('th-TH').format(num);
  }

  static filterProvinces(statsData, selectedProvinces, filterType) {
    let result = selectedProvinces.length > 0
      ? statsData.provinceStats.filter(p => selectedProvinces.some(sp => sp.province_name === p.province))
      : statsData.provinceStats;

    if (filterType === 'firearms') return result.filter(p => p.firearms > 0);
    if (filterType === 'drugs') return result.filter(p => p.drugs > 0);
    return result;
  }

  static getTopProvinces(provinces, filterType, limit = 5) {
    return [...provinces].sort((a, b) => {
      if (filterType === 'firearms') return b.firearms - a.firearms;
      if (filterType === 'drugs') return b.drugs - a.drugs;
      return b.cases - a.cases;
    }).slice(0, limit);
  }

  static calculateTotals(provinces, filterType, statsData) {
    if (filterType === 'firearms') return provinces.reduce((s, p) => s + p.firearms, 0);
    if (filterType === 'drugs') return provinces.reduce((s, p) => s + p.drugs, 0);
    return provinces.reduce((s, p) => s + p.cases, 0); // fallback or general total logic
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useDashboardInteractions = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [timeRange, setTimeRange] = useState('6months');
  const [highlightedProvince, setHighlightedProvince] = useState(null);
  const [compareMode, setCompareMode] = useState(false);

  return {
    activeTab, setActiveTab,
    timeRange, setTimeRange,
    highlightedProvince, setHighlightedProvince,
    compareMode, setCompareMode
  };
};

const useDashboardStatistics = (statsData, selectedAreas, evidenceTypeFilter) => {
  const selectedProvinces = useMemo(() => selectedAreas.provinces || [], [selectedAreas]);
  
  // 1. Core Stats
  const coreStats = useMemo(() => {
    const filteredProvinces = StatCalculationService.filterProvinces(statsData, selectedProvinces, evidenceTypeFilter);
    const top5Provinces = StatCalculationService.getTopProvinces(filteredProvinces, evidenceTypeFilter);
    
    // Total Cases Logic (Preserving complex condition from original code)
    let totalCases = statsData.totalCases || 0;
    if (evidenceTypeFilter === 'firearms') totalCases = statsData.categoryStats['อาวุธปืน'];
    else if (evidenceTypeFilter === 'drugs') totalCases = statsData.categoryStats['ยาเสพติด'];
    else if (selectedProvinces.length > 0) totalCases = filteredProvinces.reduce((s, p) => s + p.cases, 0);

    // Percentages
    let categoryPercentages = selectedProvinces.length > 0 
        ? statsData.getAreaSpecificStats(selectedProvinces).categoryPercentages 
        : statsData.categoryPercentages;
        
    const total = categoryPercentages.firearms + categoryPercentages.drugs;
    const adjustedPercentages = total === 0 ? { firearms: 50, drugs: 50 } : {
        firearms: (categoryPercentages.firearms / total) * 100,
        drugs: (categoryPercentages.drugs / total) * 100
    };

    return { filteredProvinces, top5Provinces, totalCases, adjustedPercentages };
  }, [statsData, selectedProvinces, evidenceTypeFilter]);

  // 2. Distributions
  const distributions = useMemo(() => {
    if (selectedProvinces.length > 0) return statsData.getAreaSpecificStats(selectedProvinces);
    return { firearmDistribution: statsData.firearmDistribution, drugDistribution: statsData.drugDistribution };
  }, [selectedProvinces, statsData]);

  // 3. District Stats (Mock logic maintained)
  const districtStats = useMemo(() => {
    if (selectedProvinces.length !== 1) return [];
    const provinceName = selectedProvinces[0].province_name;
    return Array.from({ length: 7 }, (_, i) => ({
      district: `อำเภอที่ ${i + 1} ของ${provinceName}`,
      cases: 18 + Math.floor(Math.random() * 50),
      firearms: 10 + Math.floor(Math.random() * 30),
      drugs: 8 + Math.floor(Math.random() * 25)
    })).sort((a, b) => b.cases - a.cases);
  }, [selectedProvinces]);

  return { ...coreStats, ...distributions, districtStats };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const CustomTooltip = memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-xs">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
        ))}
      </div>
    );
  }
  return null;
});

const StatCard = memo(({ title, value, colorClass, borderClass, subText }) => (
  <div className={`bg-${colorClass}-50 border border-${borderClass}-200 rounded-lg p-3 transition-all hover:shadow-md`}>
    <p className={`text-xs text-${colorClass}-800 font-medium mb-1`}>{title}</p>
    <p className={`text-xl font-bold text-${colorClass}-800`}>{value}</p>
    {subText && <p className={`text-xs text-${colorClass}-700 mt-1`}>{subText}</p>}
  </div>
));

const DistributionChart = memo(({ title, data, type, selectedProvinces, nameKey }) => (
  <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex justify-between items-center">
      <span>{title}</span>
      {selectedProvinces.length > 0 && <span className="text-xs font-normal text-gray-500">(เฉพาะในพื้นที่ที่เลือก)</span>}
    </h3>
    <div className="h-32 mb-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} nameKey={nameKey} dataKey="percentage" cx="50%" cy="50%" outerRadius={50}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || ColorThemeService.getColor(type, index)} />)}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    {data.map((item, index) => (
      <div key={index} className="mb-2">
        <div className="flex justify-between items-center text-xs mb-1">
          <span>{item[nameKey]}</span><span>{item.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${item.percentage}%`, backgroundColor: item.color || ColorThemeService.getColor(type, index) }}></div>
        </div>
      </div>
    ))}
  </div>
));

const DistrictBarChart = memo(({ data }) => (
  <div className="h-52 space-y-2">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.slice(0, 5)}
        layout="vertical"
        barGap={0}
        barCategoryGap="15%"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="district"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="firearms" stackId="a" fill="#e53e3e" name="อาวุธปืน" radius={[0, 4, 4, 0]} />
        <Bar dataKey="drugs" stackId="a" fill="#805ad5" name="ยาเสพติด" radius={[0, 4, 4, 0]} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </BarChart>
    </ResponsiveContainer>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const StatisticsPanel = ({ selectedAreas = {}, isMobile = false, evidenceTypeFilter = 'all' }) => {
  const statsData = useMemo(() => getProvinceStatistics(), []);
  const normalizedFilter = evidenceTypeFilter === 'guns' ? 'firearms' : evidenceTypeFilter;
  
  const interactions = useDashboardInteractions();
  const stats = useDashboardStatistics(statsData, selectedAreas, normalizedFilter);
  const selectedProvinces = selectedAreas.provinces || [];

  const filteredTrend = useMemo(() => {
    const trends = statsData.monthlyTrend;
    if (interactions.timeRange === '3months') return trends.slice(-3);
    if (interactions.timeRange === '12months') return [...trends, ...trends].slice(0, 12);
    return trends;
  }, [statsData, interactions.timeRange]);

  return (
    <div className={`h-full flex flex-col ${isMobile ? 'pb-4' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-lg">
        <h2 className="text-lg font-bold mb-1 flex items-center justify-between">
          <span>สถิติการพบวัตถุพยาน</span>
          {normalizedFilter !== 'all' && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${normalizedFilter === 'firearms' ? 'bg-red-500' : 'bg-purple-600'}`}>
              {normalizedFilter === 'firearms' ? 'เฉพาะอาวุธปืน' : 'เฉพาะยาเสพติด'}
            </span>
          )}
        </h2>
        <p className="text-sm opacity-90">
          {selectedProvinces.length > 0 ? selectedProvinces.map(p => p.province_name).join(', ') : 'ทั่วประเทศ'}
          {(selectedAreas.districts?.length > 0) && <span className="ml-1 text-xs opacity-75">({selectedAreas.districts.length} อำเภอ)</span>}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 flex border-b border-gray-300" role="tablist">
        {['summary', 'detail', 'trends'].map(tab => (
          <button
            key={tab}
            onClick={() => interactions.setActiveTab(tab)}
            className={`flex-1 py-2.5 px-3 text-sm font-medium ${interactions.activeTab === tab ? 'bg-white border-b-2 border-blue-600 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
            role="tab" aria-selected={interactions.activeTab === tab}
          >
            {tab === 'summary' ? 'สรุป' : tab === 'detail' ? 'รายละเอียด' : 'แนวโน้ม'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {interactions.activeTab === 'summary' && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <StatCard title="วัตถุพยานทั้งหมด" value={StatCalculationService.formatNumber(stats.totalCases)} colorClass="blue" borderClass="blue" />
              <StatCard title="พื้นที่ที่เลือก" value={selectedProvinces.length ? `${selectedProvinces.length} จังหวัด` : 'ทั่วประเทศ'} 
                        subText={[selectedAreas.districts?.length && `${selectedAreas.districts.length} อำเภอ`].filter(Boolean).join(', ')} colorClass="green" borderClass="green" />
            </div>

            {/* Evidence Category Pie */}
            <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex justify-between items-center">
                <span>สัดส่วนประเภทวัตถุพยาน</span>
                {selectedProvinces.length > 0 && <span className="text-xs font-normal text-gray-500">(เฉพาะในพื้นที่ที่เลือก)</span>}
              </h3>
              <div className="h-36 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: 'อาวุธปืน', value: stats.adjustedPercentages.firearms }, { name: 'ยาเสพติด', value: stats.adjustedPercentages.drugs }]}
                         cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={5} dataKey="value">
                      <Cell fill="#e53e3e" /><Cell fill="#805ad5" />
                    </Pie>
                    <Tooltip formatter={(value) => `${Math.round(value)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-around">
                <div className="flex items-center"><div className="w-3 h-3 bg-red-500 mr-1 rounded"></div><span className="text-xs">อาวุธปืน ({Math.round(stats.adjustedPercentages.firearms)}%)</span></div>
                <div className="flex items-center"><div className="w-3 h-3 bg-purple-500 mr-1 rounded"></div><span className="text-xs">ยาเสพติด ({Math.round(stats.adjustedPercentages.drugs)}%)</span></div>
              </div>
            </div>

            {/* Top List / District Bar Chart */}
            <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {selectedProvinces.length === 1 ? `อำเภอที่พบวัตถุพยานมากสุดใน${selectedProvinces[0].province_name}` : "จังหวัดที่พบวัตถุพยานมากสุด 5 อันดับ"}
                </h3>
                {selectedProvinces.length === 1 && stats.districtStats.length > 0 ? (
                    <DistrictBarChart data={stats.districtStats} />
                ) : stats.top5Provinces.length > 0 ? (
                    <div className="space-y-2">
                        {stats.top5Provinces.map((item, index) => (
                            <div key={index} className="flex items-center">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{index + 1}</span>
                                <span className="ml-2 flex-1 text-sm">{item.province}</span>
                                <span className="text-sm font-semibold">{StatCalculationService.formatNumber(item.cases)}</span>
                            </div>
                        ))}
                    </div>
                ) : <div className="text-center p-3 text-gray-500">ไม่พบข้อมูล</div>}
            </div>

            {/* Distributions */}
            {normalizedFilter !== 'drugs' && <DistributionChart title="สัดส่วนประเภทอาวุธปืน" data={stats.firearmDistribution} type="firearms" selectedProvinces={selectedProvinces} nameKey="type" />}
            {normalizedFilter !== 'firearms' && <DistributionChart title="สัดส่วนประเภทยาเสพติด" data={stats.drugDistribution} type="drugs" selectedProvinces={selectedProvinces} nameKey="drug" />}
          </div>
        )}

        {interactions.activeTab === 'trends' && (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">แนวโน้มตามช่วงเวลา</h3>
                    <div className="flex border border-gray-300 rounded overflow-hidden">
                        {['3months', '6months', '12months'].map(r => (
                            <button key={r} onClick={() => interactions.setTimeRange(r)} className={`text-xs px-2 py-1 ${interactions.timeRange === r ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                                {r.replace('months', ' เดือน')}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-60 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="firearms" stroke="#e53e3e" strokeWidth={2} name="อาวุธปืน" />
                            <Line type="monotone" dataKey="drugs" stroke="#805ad5" strokeWidth={2} name="ยาเสพติด" />
                            <Line type="monotone" dataKey="cases" stroke="#3182ce" strokeDasharray="5 5" strokeWidth={2} name="รวม" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}
        
        {interactions.activeTab === 'detail' && (
            <div className="text-center p-10 text-gray-500">ส่วนรายละเอียด (Refactored logic applied to summary first)</div>
        )}
      </div>
    </div>
  );
};

export default memo(StatisticsPanel);