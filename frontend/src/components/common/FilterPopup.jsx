import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiX, FiChevronUp, FiChevronDown, FiMapPin } from "react-icons/fi";

/* ========================= CONSTANTS ========================= */
const CATEGORY_OPTIONS = [
  'อาวุธปืน',
  'ยาเสพติด',
];

const DATE_OPTIONS = [
  { value: 'today', label: 'วันนี้' },
  { value: 'last7days', label: '7 วันล่าสุด' },
  { value: 'last1month', label: '1 เดือนล่าสุด' },
  { value: 'last6months', label: '6 เดือนล่าสุด' },
  { value: 'last1year', label: '1 ปีล่าสุด' },
];

const DEFAULT_SECTIONS = {
  category: true,
  date: true,
  location: true,
};

/* ========================= UTILS ========================= */
const normalizeFilters = (filters) => ({
  categories: Array.isArray(filters?.categories) ? filters.categories : [],
  dateRange: filters?.dateRange ?? null,
  customDate: filters?.customDate ?? '',
  province: filters?.province ?? '',
  district: filters?.district ?? '',
  subdistrict: filters?.subdistrict ?? '',
});

/* ========================= PRESENTATIONAL SUB-COMPONENTS ========================= */
const SectionHeader = ({ title, open, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex justify-between items-center w-full font-semibold mb-3 text-left"
    aria-expanded={open}
  >
    {title}
    {open ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
  </button>
);

const Checkbox = ({ checked, value, onChange, children }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      className="w-4 h-4 accent-[#b30000]"
      value={value}
      checked={checked}
      onChange={onChange}
    />
    {children}
  </label>
);

/* ========================= MAIN COMPONENT ========================= */
const FilterPopup = ({ isOpen, onClose, filters = {}, onFilterChange = () => {}, onClearFilters = () => {}, onApplyFilters = () => {} }) => {
  const [localFilters, setLocalFilters] = useState(() => normalizeFilters(filters));
  const [sectionsOpen, setSectionsOpen] = useState(DEFAULT_SECTIONS);

  useEffect(() => {
    setLocalFilters(normalizeFilters(filters));
  }, [filters]);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(normalizeFilters(filters));
      setSectionsOpen(DEFAULT_SECTIONS);
    }
  }, [isOpen, filters]);

  const toggleSection = useCallback((name) => {
    setSectionsOpen(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const handleCategoryChange = useCallback((e) => {
    const { value, checked } = e.target;
    setLocalFilters(prev => {
      const current = prev.categories || [];
      const next = checked ? [...current, value] : current.filter(c => c !== value);
      const updated = { ...prev, categories: next };
      onFilterChange(updated);
      return updated;
    });
  }, [onFilterChange]);

  const handleDateRangeChange = useCallback((e) => {
    const { value, checked } = e.target;
    setLocalFilters(prev => {
      const updated = checked ? { ...prev, dateRange: value, customDate: '' } : (prev.dateRange === value ? { ...prev, dateRange: null } : prev);
      onFilterChange(updated);
      return updated;
    });
  }, [onFilterChange]);

  const handleCustomDateChange = useCallback((e) => {
    const value = e.target.value;
    setLocalFilters(prev => {
      const updated = { ...prev, customDate: value, dateRange: null };
      onFilterChange(updated);
      return updated;
    });
  }, [onFilterChange]);

  const handleLocationChange = useCallback((e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => {
      const updated = { ...prev, [name]: value };
      onFilterChange(updated);
      return updated;
    });
  }, [onFilterChange]);

  const handleApply = useCallback(() => {
    try {
      onApplyFilters(localFilters);
    } catch (_) {
      try { onApplyFilters(); } catch (_) {}
    }
    onClose();
  }, [localFilters, onApplyFilters, onClose]);

  const handleClear = useCallback(() => {
    try {
      onClearFilters();
    } catch (_) {}
    const empty = normalizeFilters({});
    setLocalFilters(empty);
    onFilterChange(empty);
  }, [onClearFilters, onFilterChange]);

  const handleClose = useCallback(() => {
    setLocalFilters(normalizeFilters(filters));
    onClose();
  }, [filters, onClose]);

  const categoryNodes = useMemo(() => (
    CATEGORY_OPTIONS.map(cat => (
      <Checkbox
        key={cat}
        value={cat}
        checked={localFilters.categories?.includes(cat) || false}
        onChange={handleCategoryChange}
      >
        {cat}
      </Checkbox>
    ))
  ), [localFilters.categories, handleCategoryChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4" role="dialog" aria-modal="true" aria-labelledby="filter-popup-title">
      <div className="bg-white w-full h-full md:w-full md:h-[70vh] md:max-w-[650px] md:max-h-[90vh] md:rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
           <h2 id="filter-popup-title" className="text-xl md:text-2xl font-semibold">เลือกตัวกรองผลลัพธ์</h2>
           <button
             onClick={handleClose}
             className="text-gray-500 hover:text-gray-700"
             aria-label="ปิดตัวกรอง"
           >
             <FiX size={24} />
           </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
              <div className="border-b border-slate-200 pb-4" aria-hidden={false}>
                 <SectionHeader title="หมวดหมู่" open={sectionsOpen.category} onToggle={() => toggleSection('category')} />
                    {sectionsOpen.category && (
                    <div className="flex flex-wrap gap-4 sm:gap-6" role="group" aria-label="หมวดหมู่">
                        {categoryNodes}
                    </div>
                    )}
              </div>

               <div className="border-b border-slate-200 pb-4">
                    <SectionHeader title="วัน/เดือน/ปี" open={sectionsOpen.date} onToggle={() => toggleSection('date')} />
                    {sectionsOpen.date && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full" role="group" aria-label="ช่วงเวลา">
                        {DATE_OPTIONS.map(option => (
                            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-[#b30000]"
                                value={option.value}
                                checked={localFilters.dateRange === option.value}
                                onChange={handleDateRangeChange}
                            /> {option.label}
                            </label>
                        ))}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center">
                        <label className="font-normal w-full sm:w-auto mb-2 sm:mb-0 sm:mr-4">กำหนดเอง</label>
                        <input
                            type="text"
                            placeholder="28 ธ.ค. 22 - 10 ม.ค. 23"
                            className="p-2 border border-slate-200 rounded-lg w-full sm:w-[60%] focus:ring-1 focus:ring-red-100 focus:border-red-500"
                            value={localFilters.customDate}
                            onChange={handleCustomDateChange}
                        />
                        </div>
                    </div>
                    )}
               </div>

               <div className="pb-4">
                    <SectionHeader title="จังหวัด/อำเภอ/ตำบล" open={sectionsOpen.location} onToggle={() => toggleSection('location')} />
                    {sectionsOpen.location && (
                    <div className="space-y-4">
                        <div className="flex justify-start items-center mb-2">
                        <button type="button" className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-gray-100 text-sm">
                            <FiMapPin className="inline mr-1" /> เลือกจากแผนที่
                        </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                            <select name="province" value={localFilters.province || ''} onChange={handleLocationChange} className="p-2 border border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-red-100 focus:border-red-500">
                                <option value="">กรอกหรือเลือกจังหวัด</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label>
                            <select name="district" value={localFilters.district || ''} onChange={handleLocationChange} className="p-2 border border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-red-100 focus:border-red-500">
                                <option value="">กรอกหรือเลือกอำเภอ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label>
                            <select name="subdistrict" value={localFilters.subdistrict || ''} onChange={handleLocationChange} className="p-2 border border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-red-100 focus:border-red-500">
                                <option value="">กรอกหรือเลือกตำบล</option>
                            </select>
                        </div>
                        </div>
                    </div>
                    )}
               </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between p-4 border-t border-slate-200 gap-3 flex-shrink-0 bg-white">
            <button
                type="button"
                onClick={handleClear}
                className="w-full sm:w-auto px-4 py-2 border rounded-lg text-[#b30000] border-red-600 hover:bg-red-50 order-2 sm:order-1"
            >
                ล้างการคัดกรองทั้งหมด
            </button>
            <button
                type="button"
                onClick={handleApply}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#b30000] text-white hover:bg-[#990000] order-1 sm:order-2"
            >
                คัดกรองผลลัพธ์
            </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPopup;