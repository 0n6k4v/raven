import React, { useState, useMemo, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { getProvinceStatistics } from '../../mockUp/data';

/* =========================
   CONSTANTS
   ========================= */
const COLORS = {
  firearms: ['#e53e3e', '#c53030', '#9b2c2c', '#822727', '#681e1e'],
  drugs: ['#805ad5', '#6b46c1', '#553c9a', '#44337a', '#322659'],
  general: ['#3182ce', '#2b6cb0', '#2c5282', '#2a4365', '#1A365D']
};

/* =========================
   UTILS
   ========================= */
// Format number with Thai locale
const formatNumber = (num) => new Intl.NumberFormat('th-TH').format(num);

// Get color for chart elements
const getColor = (type, index = 0) => {
  if (type === 'firearms') return COLORS.firearms[index % COLORS.firearms.length];
  if (type === 'drugs') return COLORS.drugs[index % COLORS.drugs.length];
  return COLORS.general[index % COLORS.general.length];
};

/* =========================
   CUSTOM HOOKS
   ========================= */
// Hook: useFilteredStats
function useFilteredStats({ statsData, selectedProvinces, evidenceTypeFilter }) {
  return useMemo(() => {
    const totalCases = statsData.totalCases || 0;
    let filteredProvinces = [];
    let top5Provinces = [];
    let categoryPercentages = { firearms: 50, drugs: 50 };

    if (selectedProvinces.length > 0) {
      const areaSpecificStats = statsData.getAreaSpecificStats(selectedProvinces);
      const matchedProvinces = statsData.provinceStats.filter(p =>
        selectedProvinces.some(sp => sp.province_name === p.province)
      );
      filteredProvinces = matchedProvinces;
      categoryPercentages = areaSpecificStats.categoryPercentages;
      top5Provinces = [...matchedProvinces].sort((a, b) => b.cases - a.cases).slice(0, 5);

      if (evidenceTypeFilter === 'firearms') {
        filteredProvinces = filteredProvinces.filter(p => p.firearms > 0);
        top5Provinces = [...filteredProvinces].sort((a, b) => b.firearms - a.firearms).slice(0, 5);
      } else if (evidenceTypeFilter === 'drugs') {
        filteredProvinces = filteredProvinces.filter(p => p.drugs > 0);
        top5Provinces = [...filteredProvinces].sort((a, b) => b.drugs - a.drugs).slice(0, 5);
      }
    } else {
      categoryPercentages = statsData.categoryPercentages;
      filteredProvinces = statsData.provinceStats;
      if (evidenceTypeFilter === 'firearms') {
        top5Provinces = [...statsData.provinceStats].sort((a, b) => b.firearms - a.firearms).slice(0, 5);
      } else if (evidenceTypeFilter === 'drugs') {
        top5Provinces = [...statsData.provinceStats].sort((a, b) => b.drugs - a.drugs).slice(0, 5);
      } else {
        top5Provinces = [...statsData.provinceStats].sort((a, b) => b.cases - a.cases).slice(0, 5);
      }
    }

    return {
      totalCases: evidenceTypeFilter === 'firearms' ? statsData.categoryStats['อาวุธปืน'] :
        evidenceTypeFilter === 'drugs' ? statsData.categoryStats['ยาเสพติด'] :
          totalCases,
      filteredProvinces,
      top5Provinces,
      categoryPercentages
    };
  }, [selectedProvinces, statsData, evidenceTypeFilter]);
}

// Hook: useDistrictStats
function useDistrictStats(selectedProvinces) {
  return useMemo(() => {
    if (selectedProvinces.length === 1) {
      const provinceName = selectedProvinces[0].province_name;
      const districtCount = 5 + Math.floor(Math.random() * 5);
      return Array.from({ length: districtCount }, (_, i) => {
        const firearms = 10 + Math.floor(Math.random() * 30);
        const drugs = 8 + Math.floor(Math.random() * 25);
        return {
          district: `อำเภอที่ ${i + 1} ของ${provinceName}`,
          cases: firearms + drugs,
          firearms,
          drugs
        };
      }).sort((a, b) => b.cases - a.cases);
    }
    return [];
  }, [selectedProvinces]);
}

// Hook: useDistributions
function useDistributions({ statsData, selectedProvinces }) {
  return useMemo(() => {
    if (selectedProvinces.length > 0) {
      return statsData.getAreaSpecificStats(selectedProvinces);
    }
    return {
      firearmDistribution: statsData.firearmDistribution,
      drugDistribution: statsData.drugDistribution
    };
  }, [selectedProvinces, statsData]);
}

// Hook: useAdjustedCategoryPercentages
function useAdjustedCategoryPercentages(categoryPercentages) {
  return useMemo(() => {
    const { firearms, drugs } = categoryPercentages;
    const total = firearms + drugs;
    if (total === 0) return { firearms: 50, drugs: 50 };
    return {
      firearms: (firearms / total) * 100,
      drugs: (drugs / total) * 100
    };
  }, [categoryPercentages]);
}

// Hook: useFilteredMonthlyTrend
function useFilteredMonthlyTrend({ statsData, timeRange }) {
  return useMemo(() => {
    const trends = statsData.monthlyTrend;
    switch (timeRange) {
      case '3months':
        return trends.slice(trends.length - 3);
      case '12months':
        return [...trends, ...trends].slice(0, 12);
      default:
        return trends;
    }
  }, [timeRange, statsData.monthlyTrend]);
}

// Hook: useAreaStats
function useAreaStats(selectedProvinces, selectedAreas) {
  return useMemo(() => {
    const provincesCount = selectedProvinces.length;
    if (provincesCount === 0) {
      return {
        provinces: 'ทั่วประเทศ',
        districts: '',
        subdistricts: ''
      };
    }
    return {
      provinces: `${provincesCount} จังหวัด`,
      districts: selectedAreas.districts?.length ? `${selectedAreas.districts.length} อำเภอ` : '',
      subdistricts: selectedAreas.subdistricts?.length ? `${selectedAreas.subdistricts.length} ตำบล` : ''
    };
  }, [selectedProvinces, selectedAreas]);
}

/* =========================
   PRESENTATIONAL COMPONENTS
   ========================= */

// Pie chart for evidence category
const EvidenceCategoryPie = React.memo(({ adjustedCategoryPercentages }) => (
  <div className="h-36 mb-3" aria-label="สัดส่วนประเภทวัตถุพยาน">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={[
            { name: 'อาวุธปืน', value: adjustedCategoryPercentages.firearms },
            { name: 'ยาเสพติด', value: adjustedCategoryPercentages.drugs },
          ]}
          cx="50%"
          cy="50%"
          innerRadius={35}
          outerRadius={60}
          paddingAngle={5}
          dataKey="value"
          labelLine={false}
        >
          <Cell fill="#e53e3e" />
          <Cell fill="#805ad5" />
        </Pie>
        <Tooltip formatter={(value) => `${Math.round(value)}%`} />
      </PieChart>
    </ResponsiveContainer>
  </div>
));

// Progressive bar for evidence category
const EvidenceCategoryBar = React.memo(({ adjustedCategoryPercentages }) => (
  <div className="flex items-center mt-3" aria-label="แถบแสดงสัดส่วนประเภทวัตถุพยาน">
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <div className="flex h-full">
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${adjustedCategoryPercentages.firearms}%` }}
          title="อาวุธปืน"
        ></div>
        <div
          className="bg-purple-500 transition-all duration-500"
          style={{ width: `${adjustedCategoryPercentages.drugs}%` }}
          title="ยาเสพติด"
        ></div>
      </div>
    </div>
  </div>
));

// Custom tooltip for charts
const CustomTooltip = React.memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-xs">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
});

// Top Provinces/Districts List
const TopList = React.memo(({ items, isDistrict, selectedProvinces }) => (
  <div className="space-y-2">
    {items.map((item, index) => (
      <div key={index} className="flex items-center">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
          ${index === 0 ? 'bg-yellow-500 text-white' :
            index === 1 ? 'bg-gray-300 text-gray-800' :
              index === 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
          {index + 1}
        </span>
        <span className="ml-2 flex-1 text-sm">{isDistrict ? item.district : item.province}</span>
        <span className="text-sm font-semibold">{item.cases}</span>
      </div>
    ))}
  </div>
));

// Distribution Pie and Bar
const DistributionSection = React.memo(({ title, distribution, type, selectedProvinces, nameKey }) => (
  <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex justify-between items-center">
      <span>{title}</span>
      {selectedProvinces.length > 0 && (
        <span className="text-xs font-normal text-gray-500">
          (เฉพาะในพื้นที่ที่เลือก)
        </span>
      )}
    </h3>
    <div className="space-y-3">
      <div className="h-32 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distribution}
              nameKey={nameKey}
              dataKey="percentage"
              cx="50%"
              cy="50%"
              outerRadius={50}
              fill={type === 'firearms' ? "#e53e3e" : "#805ad5"}
            >
              {distribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || getColor(type, index)} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {distribution.map((item, index) => (
        <div key={index} className="mb-2">
          <div className="flex justify-between items-center text-xs mb-1">
            <span>{item[nameKey]}</span>
            <span>{item.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${item.percentage}%`, backgroundColor: item.color || getColor(type, index) }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

/* =========================
   MAIN COMPONENT
   ========================= */
const StatisticsPanel = ({
  selectedAreas = {},
  isMobile = false,
  evidenceTypeFilter = 'all'
}) => {
  // State
  const [activeTab, setActiveTab] = useState('summary');
  const [timeRange, setTimeRange] = useState('6months');
  const [highlightedProvince, setHighlightedProvince] = useState(null);
  const [compareMode, setCompareMode] = useState(false);

  // Normalize evidenceTypeFilter coming from Map (Map uses 'guns')
  const normalizedEvidenceTypeFilter = useMemo(
    () => (evidenceTypeFilter === 'guns' ? 'firearms' : evidenceTypeFilter),
    [evidenceTypeFilter]
  );

  const selectedProvinces = useMemo(() => selectedAreas.provinces || [], [selectedAreas.provinces]);

  const statsData = useMemo(() => getProvinceStatistics(), []);
  const categoryStats = statsData.categoryStats || {};

  const filteredStats = useMemo(() => {
    if (!selectedProvinces.length) {
      return {
        filteredProvinces: statsData.provinceStats || [],
        top5Provinces: (statsData.provinceStats || [])
          .sort((a, b) => {
            if (normalizedEvidenceTypeFilter === 'firearms') return b.firearms - a.firearms;
            if (normalizedEvidenceTypeFilter === 'drugs') return b.drugs - a.drugs;
            return b.cases - a.cases;
          })
          .slice(0, 5),
        totalCases:
          normalizedEvidenceTypeFilter === 'firearms'
            ? categoryStats['อาวุธปืน']
            : normalizedEvidenceTypeFilter === 'drugs'
              ? categoryStats['ยาเสพติด']
              : statsData.totalCases || 0,
        categoryPercentages: statsData.categoryPercentages || { firearms: 0, drugs: 0 }
      };
    }

    const filteredProvinces = statsData.provinceStats.filter(p =>
      selectedProvinces.some(sp => sp.province_name === p.province)
    );

    const firearmsTotal = filteredProvinces.reduce((s, p) => s + p.firearms, 0);
    const drugsTotal = filteredProvinces.reduce((s, p) => s + p.drugs, 0);

    const top5Provinces = [...filteredProvinces]
      .sort((a, b) => {
        if (normalizedEvidenceTypeFilter === 'firearms') return b.firearms - a.firearms;
        if (normalizedEvidenceTypeFilter === 'drugs') return b.drugs - a.drugs;
        return b.cases - a.cases;
      })
      .slice(0, 5);

    return {
      filteredProvinces,
      top5Provinces,
      totalCases:
        normalizedEvidenceTypeFilter === 'firearms'
          ? firearmsTotal
          : normalizedEvidenceTypeFilter === 'drugs'
            ? drugsTotal
            : filteredProvinces.reduce((s, p) => s + p.cases, 0),
      categoryPercentages: { firearms: firearmsTotal, drugs: drugsTotal }
    };
  }, [selectedProvinces, statsData, normalizedEvidenceTypeFilter, categoryStats]);

  const districtStats = useMemo(() => {
    if (selectedProvinces.length !== 1) return [];
    const provinceName = selectedProvinces[0]?.province_name;
    return Array.from({ length: 7 }, (_, i) => {
      const firearms = 10 + Math.floor(Math.random() * 30);
      const drugs = 8 + Math.floor(Math.random() * 25);
      return {
        district: `อำเภอที่ ${i + 1} ของ${provinceName}`,
        cases: firearms + drugs,
        firearms,
        drugs
      };
    }).sort((a, b) => b.cases - a.cases);
  }, [selectedProvinces]);

  // Province-aware distributions
  const { firearmDistribution, drugDistribution } = useMemo(() => {
    if (selectedProvinces.length > 0 && statsData.getAreaSpecificStats) {
      const area = statsData.getAreaSpecificStats(selectedProvinces);
      return {
        firearmDistribution: area.firearmDistribution || [],
        drugDistribution: area.drugDistribution || []
      };
    }
    return {
      firearmDistribution: statsData.firearmDistribution || [],
      drugDistribution: statsData.drugDistribution || []
    };
  }, [selectedProvinces, statsData]);

  const filteredMonthlyTrend = useFilteredMonthlyTrend({
    statsData,
    timeRange
  });

  const handleProvinceHighlight = useCallback((province) => {
    setHighlightedProvince(province);
  }, []);

  const yearOverYearData = useMemo(
    () => ({
      percentage: 8.2,
      direction: 'up',
      description: 'เพิ่มขึ้นจากปีก่อน'
    }),
    []
  );

  const areaStats = useAreaStats(selectedProvinces, selectedAreas);
  const adjustedCategoryPercentages = useAdjustedCategoryPercentages(filteredStats.categoryPercentages);

  return (
    <div className={`h-full flex flex-col ${isMobile ? 'pb-4' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-lg">
        <h2 className="text-lg font-bold mb-1 flex items-center justify-between">
          <span>สถิติการพบวัตถุพยาน</span>
          {normalizedEvidenceTypeFilter !== 'all' && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              normalizedEvidenceTypeFilter === 'firearms' ? 'bg-red-500' : 'bg-purple-600'
            }`}>
              {normalizedEvidenceTypeFilter === 'firearms' ? 'เฉพาะอาวุธปืน' : 'เฉพาะยาเสพติด'}
            </span>
          )}
        </h2>
        <p className="text-sm opacity-90">
          {selectedProvinces.length > 0
            ? `${selectedProvinces.map(p => p.province_name).join(', ')}`
            : 'ทั่วประเทศ'
          }
          {selectedAreas.districts?.length > 0 && (
            <span className="ml-1 text-xs opacity-75">
              ({selectedAreas.districts.length} อำเภอ{selectedAreas.subdistricts?.length > 0 ? `, ${selectedAreas.subdistricts.length} ตำบล` : ''})
            </span>
          )}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-100 flex border-b border-gray-300" role="tablist">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2.5 px-3 text-sm font-medium ${
            activeTab === 'summary'
              ? 'bg-white border-b-2 border-blue-600 text-blue-700'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          role="tab"
          aria-selected={activeTab === 'summary'}
        >
          สรุป
        </button>
        <button
          onClick={() => setActiveTab('detail')}
          className={`flex-1 py-2.5 px-3 text-sm font-medium ${
            activeTab === 'detail'
              ? 'bg-white border-b-2 border-blue-600 text-blue-700'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          role="tab"
          aria-selected={activeTab === 'detail'}
        >
          รายละเอียด
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex-1 py-2.5 px-3 text-sm font-medium ${
            activeTab === 'trends'
              ? 'bg-white border-b-2 border-blue-600 text-blue-700'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          role="tab"
          aria-selected={activeTab === 'trends'}
        >
          แนวโน้ม
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div>
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 transition-all hover:shadow-md">
                <p className="text-xs text-blue-800 font-medium mb-1">วัตถุพยานทั้งหมด</p>
                <p className="text-xl font-bold text-blue-800">{formatNumber(filteredStats.totalCases)}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 transition-all hover:shadow-md">
                <p className="text-xs text-green-800 font-medium mb-1">พื้นที่ที่เลือก</p>
                <p className="text-xl font-bold text-green-800">{areaStats.provinces || 'ทั่วประเทศ'}</p>
                {(areaStats.districts || areaStats.subdistricts) && (
                  <p className="text-xs text-green-700 mt-1">
                    {[areaStats.districts, areaStats.subdistricts].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Evidence Category Distribution */}
            <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex justify-between items-center">
                <span>สัดส่วนประเภทวัตถุพยาน</span>
                {selectedProvinces.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">
                    (เฉพาะในพื้นที่ที่เลือก)
                  </span>
                )}
              </h3>
              <EvidenceCategoryPie adjustedCategoryPercentages={adjustedCategoryPercentages} />
              <div className="flex justify-around">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 mr-1 rounded"></div>
                  <span className="text-xs">อาวุธปืน ({Math.round(adjustedCategoryPercentages.firearms)}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 mr-1 rounded"></div>
                  <span className="text-xs">ยาเสพติด ({Math.round(adjustedCategoryPercentages.drugs)}%)</span>
                </div>
              </div>
              <EvidenceCategoryBar adjustedCategoryPercentages={adjustedCategoryPercentages} />
            </div>

            {/* Top Provinces/Districts */}
            <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {selectedProvinces.length === 1
                  ? `อำเภอที่พบวัตถุพยานมากสุดใน${selectedProvinces[0].province_name}`
                  : "จังหวัดที่พบวัตถุพยานมากสุด 5 อันดับ"
                }
              </h3>
              {selectedProvinces.length === 1 && districtStats.length > 0 ? (
                <div className="h-52 space-y-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={districtStats.slice(0, 5)}
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
                      <Bar dataKey="firearms" stackId="a" fill="#e53e3e" name="อาวุธปืน" />
                      <Bar dataKey="drugs" stackId="a" fill="#805ad5" name="ยาเสพติด" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : filteredStats.top5Provinces.length > 0 ? (
                <TopList items={filteredStats.top5Provinces} isDistrict={false} selectedProvinces={selectedProvinces} />
              ) : (
                <div className="text-center p-3 text-gray-500 bg-gray-50 rounded-md">
                  ไม่พบข้อมูล
                </div>
              )}
            </div>

            {/* Firearm Distribution */}
            {normalizedEvidenceTypeFilter !== 'drugs' && (
              <DistributionSection
                title="สัดส่วนประเภทอาวุธปืน"
                distribution={firearmDistribution}
                type="firearms"
                selectedProvinces={selectedProvinces}
                nameKey="type"
              />
            )}

            {/* Drug Distribution */}
            {normalizedEvidenceTypeFilter !== 'firearms' && (
              <DistributionSection
                title="สัดส่วนประเภทยาเสพติด"
                distribution={drugDistribution}
                type="drugs"
                selectedProvinces={selectedProvinces}
                nameKey="drug"
              />
            )}
          </div>
        )}

        {/* Detail Tab */}
        {activeTab === 'detail' && (
          <div>
            {/* Time Period Filter */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">รายละเอียดเชิงเปรียบเทียบ</h3>
              <div className="flex items-center">
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`text-xs px-2 py-1 rounded ${
                    compareMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                  aria-pressed={compareMode}
                >
                  {compareMode ? 'ยกเลิกเปรียบเทียบ' : 'เปรียบเทียบ'}
                </button>
              </div>
            </div>

            {/* District Stats */}
            {selectedProvinces.length === 1 && districtStats.length > 0 && (
              <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex justify-between items-center">
                  <span>สถิติระดับอำเภอของ {selectedProvinces[0].province_name}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {districtStats.length} อำเภอ
                  </span>
                </h3>
                <div className="max-h-64 overflow-y-auto border rounded" tabIndex={0}>
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">อำเภอ</th>
                        <th className="p-2 text-center">คดี</th>
                        <th className="p-2 text-center">อาวุธปืน</th>
                        <th className="p-2 text-center">ยาเสพติด</th>
                        {compareMode && <th className="p-2 text-center">เทียบปีก่อน</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {districtStats.map((item, index) => (
                        <tr
                          key={index}
                          className={`${index % 2 === 0 ? '' : 'bg-gray-50'} ${
                            highlightedProvince === item.district ? 'bg-blue-50' : ''
                          } hover:bg-blue-50 transition-colors`}
                          onMouseEnter={() => handleProvinceHighlight(item.district)}
                          onMouseLeave={() => handleProvinceHighlight(null)}
                        >
                          <td className="p-2">{item.district}</td>
                          <td className="p-2 text-center font-medium">{item.cases}</td>
                          <td className="p-2 text-center text-red-700">{item.firearms}</td>
                          <td className="p-2 text-center text-purple-700">{item.drugs}</td>
                          {compareMode && (
                            <td className="p-2 text-center">
                              <span className={Math.random() > 0.5 ? 'text-red-600' : 'text-green-600'}>
                                {Math.random() > 0.5 ? '+' : '-'}{Math.floor(Math.random() * 20)}%
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Evidence Categories */}
            <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex justify-between items-center">
                <span>สถิติตามประเภทวัตถุพยาน</span>
                {selectedProvinces.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">
                    (เฉพาะในพื้นที่ที่เลือก)
                  </span>
                )}
              </h3>
              <div className="space-y-3">
                <div className="bg-red-50 p-3 rounded-lg border border-red-200 transition-all hover:shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-red-800">อาวุธปืน</span>
                    <span className="text-sm font-bold text-red-800">
                      {selectedProvinces.length === 0
                        ? categoryStats['อาวุธปืน']
                        : filteredStats.filteredProvinces.reduce((sum, p) => sum + p.firearms, 0)
                      } รายการ
                    </span>
                  </div>
                  <div className="text-xs text-red-700 mt-1">
                    {selectedProvinces.length === 0
                      ? 'ส่วนใหญ่เป็น Glock 19 พบมากในกรุงเทพมหานคร'
                      : `ส่วนใหญ่เป็น${firearmDistribution[0]?.type || 'ปืนพก'} พบมากใน${filteredStats.top5Provinces[0]?.province || 'พื้นที่ที่เลือก'}`}
                  </div>
                  {compareMode && (
                    <div className="flex items-center justify-end mt-2">
                      <span className="text-xs font-medium mr-2">เทียบปีก่อน:</span>
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        +12.4%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 transition-all hover:shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-purple-800">ยาเสพติด</span>
                    <span className="text-sm font-bold text-purple-800">
                      {selectedProvinces.length === 0
                        ? categoryStats['ยาเสพติด']
                        : filteredStats.filteredProvinces.reduce((sum, p) => sum + p.drugs, 0)
                      } รายการ
                    </span>
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    {selectedProvinces.length === 0
                      ? 'ส่วนใหญ่เป็นยาบ้า (WY) พบมากในพื้นที่ภาคเหนือและตะวันออกเฉียงเหนือ'
                      : `ส่วนใหญ่เป็น${drugDistribution[0]?.drug || 'ยาบ้า'} พบมากใน${filteredStats.top5Provinces[0]?.province || 'พื้นที่ที่เลือก'}`}
                  </div>
                  {compareMode && (
                    <div className="flex items-center justify-end mt-2">
                      <span className="text-xs font-medium mr-2">เทียบปีก่อน:</span>
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        -5.7%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Province Comparison */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex justify-between items-center">
                <span>รายละเอียดแยกตามจังหวัด</span>
                {selectedProvinces.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">
                    (เฉพาะในพื้นที่ที่เลือก)
                  </span>
                )}
              </h3>
              <div className="max-h-64 overflow-y-auto border rounded" tabIndex={0}>
                {filteredStats.filteredProvinces.length > 0 ? (
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">จังหวัด</th>
                        <th className="p-2 text-center">ปืน</th>
                        <th className="p-2 text-center">ยาเสพติด</th>
                        <th className="p-2 text-center">รวม</th>
                        {compareMode && <th className="p-2 text-center">เทียบปีก่อน</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStats.filteredProvinces.map((item, index) => (
                        <tr
                          key={index}
                          className={`${index % 2 === 0 ? '' : 'bg-gray-50'} ${
                            highlightedProvince === item.province ? 'bg-blue-50' : ''
                          } hover:bg-blue-50 transition-colors`}
                          onMouseEnter={() => handleProvinceHighlight(item.province)}
                          onMouseLeave={() => handleProvinceHighlight(null)}
                        >
                          <td className="p-2">{item.province}</td>
                          <td className="p-2 text-center text-red-700">{item.firearms}</td>
                          <td className="p-2 text-center text-purple-700">{item.drugs}</td>
                          <td className="p-2 text-center font-medium">{item.cases}</td>
                          {compareMode && (
                            <td className="p-2 text-center">
                              <span className={Math.random() > 0.5 ? 'text-red-600' : 'text-green-600'}>
                                {Math.random() > 0.5 ? '+' : '-'}{Math.floor(Math.random() * 20)}%
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    ไม่พบข้อมูล
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div>
            {/* Time Range Filter */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">แนวโน้มตามช่วงเวลา</h3>
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  onClick={() => setTimeRange('3months')}
                  className={`text-xs px-2 py-1 ${
                    timeRange === '3months'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-pressed={timeRange === '3months'}
                >
                  3 เดือน
                </button>
                <button
                  onClick={() => setTimeRange('6months')}
                  className={`text-xs px-2 py-1 ${
                    timeRange === '6months'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-pressed={timeRange === '6months'}
                >
                  6 เดือน
                </button>
                <button
                  onClick={() => setTimeRange('12months')}
                  className={`text-xs px-2 py-1 ${
                    timeRange === '12months'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-pressed={timeRange === '12months'}
                >
                  12 เดือน
                </button>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex justify-between">
                <span>
                  แนวโน้มรายเดือน ({timeRange === '3months' ? '3 เดือนล่าสุด' :
                    timeRange === '12months' ? '12 เดือนล่าสุด' :
                      '6 เดือนล่าสุด'})
                </span>
                {selectedProvinces.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">
                    (เฉพาะในพื้นที่ที่เลือก)
                  </span>
                )}
              </h3>
              <div className="h-60 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredMonthlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="firearms"
                      name="อาวุธปืน"
                      stroke="#e53e3e"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="drugs"
                      name="ยาเสพติด"
                      stroke="#805ad5"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="cases"
                      name="รวม"
                      stroke="#3182ce"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Year over Year Comparison */}
            <div className="mb-5 bg-amber-50 p-4 rounded-lg border border-amber-200 shadow-sm">
              <h3 className="text-sm font-semibold text-amber-800 mb-2 flex justify-between">
                <span>เปรียบเทียบกับช่วงเวลาเดียวกันปีก่อน</span>
                {selectedProvinces.length > 0 && (
                  <span className="text-xs font-normal text-amber-700">
                    (เฉพาะในพื้นที่ที่เลือก)
                  </span>
                )}
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-amber-800 flex items-center">
                    {yearOverYearData.percentage}%
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 ml-1 ${yearOverYearData.direction === 'up' ? 'text-red-600' : 'text-green-600'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={yearOverYearData.direction === 'up' ?
                          "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" :
                          "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
                    />
                    </svg>
                  </div>
                  <span className="ml-1 text-xs text-amber-700">{yearOverYearData.description}</span>
                </div>
                <div className="flex space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-bold text-red-700">
                      +10.3%
                    </div>
                    <div className="text-xs text-amber-700">
                      อาวุธปืน
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-700">
                      -2.7%
                    </div>
                    <div className="text-xs text-amber-700">
                      ยาเสพติด
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Observations & Analysis */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex justify-between">
                <span>ข้อสังเกต</span>
                {selectedProvinces.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">
                    (เฉพาะในพื้นที่ที่เลือก)
                  </span>
                )}
              </h3>
              <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1.5">
                {selectedProvinces.length === 0 ? (
                  <>
                    <li>พบแนวโน้มการครอบครองอาวุธปืนเพิ่มขึ้นในพื้นที่กรุงเทพมหานครและปริมณฑล</li>
                    <li>พบยาบ้า (WY) เป็นยาเสพติดที่มีการจับกุมมากที่สุด โดยเฉพาะในพื้นที่ชายแดนภาคเหนือ</li>
                    <li>มีการตรวจพบเส้นทางลำเลียงยาเสพติดใหม่ในพื้นที่ภาคตะวันออกเฉียงเหนือ</li>
                    <li className="font-medium text-blue-700">แนวโน้มการเพิ่มขึ้นของคดีอาวุธปืนใน 3 เดือนล่าสุดมีความน่ากังวล</li>
                    <li>พบความเชื่อมโยงระหว่างการค้าอาวุธและยาเสพติดในบางพื้นที่</li>
                    <li>หลังจากมาตรการเข้มงวดในพื้นที่ชายแดนภาคเหนือ มีการกระจายเส้นทางการลำเลียงยาเสพติดมากขึ้น</li>
                  </>
                ) : (
                  <>
                    <li>พบประเภทอาวุธปืนที่พบมากสุดคือ {firearmDistribution[0]?.type || 'ปืนพก'} คิดเป็น {firearmDistribution[0]?.percentage || '0'}%</li>
                    <li>ชนิดยาเสพติดที่พบมากสุดคือ {drugDistribution[0]?.drug || 'ยาบ้า'} คิดเป็น {drugDistribution[0]?.percentage || '0'}%</li>
                    <li className="font-medium text-blue-700">แนวโน้มการพบวัตถุพยานในพื้นที่เพิ่มขึ้น {yearOverYearData.percentage}% เมื่อเทียบกับปีก่อน</li>
                    <li>พบความสัมพันธ์ระหว่างการค้าอาวุธและยาเสพติดในพื้นที่ที่เลือก</li>
                    {selectedProvinces.length === 1 && (
                      <li>อำเภอ{districtStats[0]?.district.replace('อำเภอที่ 1 ของ', '') || ''} เป็นพื้นที่ที่มีการพบวัตถุพยานมากที่สุดในจังหวัด</li>
                    )}
                    {timeRange === '3months' && (
                      <li>ในช่วง 3 เดือนล่าสุด พบการเพิ่มขึ้นของคดีอย่างมีนัยสำคัญในพื้นที่</li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-2 bg-gray-50 text-xs text-gray-500 mt-auto">
        <div className="flex justify-between items-center">
          <span>ข้อมูล ณ วันที่ 26 เม.ย. 2568</span>
          <button className="text-blue-600 hover:underline flex items-center group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ดาวน์โหลดรายงาน
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;