import React, { useCallback, useEffect, useState } from 'react';
import { FiX, FiChevronUp, FiChevronDown, FiMapPin } from "react-icons/fi";

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const FILTER_CONSTANTS = {
  CATEGORIES: ['อาวุธปืน', 'ยาเสพติด'],
  DATE_OPTIONS: [
    { value: 'today', label: 'วันนี้' },
    { value: 'last7days', label: '7 วันล่าสุด' },
    { value: 'last1month', label: '1 เดือนล่าสุด' },
    { value: 'last6months', label: '6 เดือนล่าสุด' },
    { value: 'last1year', label: '1 ปีล่าสุด' },
  ],
  DEFAULT_SECTIONS: { category: true, date: true, location: true },
  ACCENT_COLOR: '#b30000',
};

class FilterCriteria {
  constructor(raw = {}) {
    this.categories = Array.isArray(raw.categories) ? [...raw.categories] : [];
    this.dateRange = raw.dateRange ?? null;
    this.customDate = raw.customDate ?? '';
    this.province = raw.province ?? '';
    this.district = raw.district ?? '';
    this.subdistrict = raw.subdistrict ?? '';
  }

  static empty() {
    return new FilterCriteria();
  }

  toApiJson() {
    return { ...this };
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useFilterForm(initialFilters, onFilterChange) {
  const [localFilters, setLocalFilters] = useState(() => new FilterCriteria(initialFilters));

  const updateFilters = useCallback((updater) => {
    setLocalFilters((prev) => {
      const next = new FilterCriteria(typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });
      onFilterChange(next.toApiJson());
      return next;
    });
  }, [onFilterChange]);

  const toggleCategory = useCallback((value, checked) => {
    updateFilters((prev) => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, value] 
        : prev.categories.filter(c => c !== value)
    }));
  }, [updateFilters]);

  const setDateRange = useCallback((value, checked) => {
    updateFilters((prev) => ({
      ...prev,
      dateRange: checked ? value : (prev.dateRange === value ? null : prev.dateRange),
      customDate: checked ? '' : prev.customDate
    }));
  }, [updateFilters]);

  const setCustomDate = useCallback((value) => {
    updateFilters({ customDate: value, dateRange: null });
  }, [updateFilters]);

  const setLocation = useCallback((name, value) => {
    updateFilters({ [name]: value });
  }, [updateFilters]);

  const reset = useCallback(() => {
    const empty = FilterCriteria.empty();
    setLocalFilters(empty);
    onFilterChange(empty.toApiJson());
  }, [onFilterChange]);

  return { localFilters, setLocalFilters, toggleCategory, setDateRange, setCustomDate, setLocation, reset };
}

function useSectionToggle() {
  const [sectionsOpen, setSectionsOpen] = useState(FILTER_CONSTANTS.DEFAULT_SECTIONS);
  const toggle = useCallback((name) => {
    setSectionsOpen(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);
  const resetSections = useCallback(() => setSectionsOpen(FILTER_CONSTANTS.DEFAULT_SECTIONS), []);
  return { sectionsOpen, toggle, resetSections };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const SectionHeader = React.memo(({ title, open, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex justify-between items-center w-full font-semibold mb-3 text-left"
    aria-expanded={open}
  >
    {title}
    {open ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
  </button>
));

const FilterCheckbox = React.memo(({ checked, value, onChange, children }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      className="w-4 h-4 accent-[#b30000]"
      value={value}
      checked={checked}
      onChange={onChange}
    />
    <span className="text-sm sm:text-base">{children}</span>
  </label>
));

const LocationField = React.memo(({ label, name, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      className="p-2 border border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-red-100 focus:border-red-500"
    >
      <option value="">{placeholder}</option>
    </select>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const FilterPopup = ({ 
  isOpen, 
  onClose, 
  filters = {}, 
  onFilterChange = () => {}, 
  onClearFilters = () => {}, 
  onApplyFilters = () => {} 
}) => {
  const form = useFilterForm(filters, onFilterChange);
  const sections = useSectionToggle();

  useEffect(() => {
    if (isOpen) {
      form.setLocalFilters(new FilterCriteria(filters));
      sections.resetSections();
    }
  }, [isOpen, filters]);

  const handleApply = useCallback(() => {
    try {
      onApplyFilters(form.localFilters.toApiJson());
    } catch (_) {
      try { onApplyFilters(); } catch (__) {}
    }
    onClose();
  }, [form.localFilters, onApplyFilters, onClose]);

  const handleClear = useCallback(() => {
    try { onClearFilters(); } catch (_) {}
    form.reset();
  }, [form, onClearFilters]);

  const handleClose = useCallback(() => {
    form.setLocalFilters(new FilterCriteria(filters));
    onClose();
  }, [filters, form, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4" role="dialog" aria-modal="true" aria-labelledby="filter-popup-title">
      <div className="bg-white w-full h-full md:w-full md:h-[70vh] md:max-w-[650px] md:max-h-[90vh] md:rounded-lg shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
           <h2 id="filter-popup-title" className="text-xl md:text-2xl font-semibold">เลือกตัวกรองผลลัพธ์</h2>
           <button onClick={handleClose} className="text-gray-500 hover:text-gray-700" aria-label="ปิดตัวกรอง">
             <FiX size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Category Section */}
          <div className="border-b border-slate-200 pb-4">
            <SectionHeader title="หมวดหมู่" open={sections.sectionsOpen.category} onToggle={() => sections.toggle('category')} />
            {sections.sectionsOpen.category && (
              <div className="flex flex-wrap gap-4 sm:gap-6" role="group" aria-label="หมวดหมู่">
                {FILTER_CONSTANTS.CATEGORIES.map(cat => (
                  <FilterCheckbox 
                    key={cat} value={cat} 
                    checked={form.localFilters.categories.includes(cat)} 
                    onChange={(e) => form.toggleCategory(e.target.value, e.target.checked)}
                  >
                    {cat}
                  </FilterCheckbox>
                ))}
              </div>
            )}
          </div>

          {/* Date Section */}
          <div className="border-b border-slate-200 pb-4">
            <SectionHeader title="วัน/เดือน/ปี" open={sections.sectionsOpen.date} onToggle={() => sections.toggle('date')} />
            {sections.sectionsOpen.date && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full" role="group" aria-label="ช่วงเวลา">
                  {FILTER_CONSTANTS.DATE_OPTIONS.map(option => (
                    <FilterCheckbox 
                      key={option.value} value={option.value} 
                      checked={form.localFilters.dateRange === option.value}
                      onChange={(e) => form.setDateRange(e.target.value, e.target.checked)}
                    >
                      {option.label}
                    </FilterCheckbox>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <label className="font-normal w-full sm:w-auto mb-2 sm:mb-0 sm:mr-4 text-gray-700">กำหนดเอง</label>
                  <input
                    type="text"
                    placeholder="28 ธ.ค. 22 - 10 ม.ค. 23"
                    className="p-2 border border-slate-200 rounded-lg w-full sm:w-[60%] focus:ring-1 focus:ring-red-100 focus:border-red-500"
                    value={form.localFilters.customDate}
                    onChange={(e) => form.setCustomDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="pb-4">
            <SectionHeader title="จังหวัด/อำเภอ/ตำบล" open={sections.sectionsOpen.location} onToggle={() => sections.toggle('location')} />
            {sections.sectionsOpen.location && (
              <div className="space-y-4">
                <div className="flex justify-start items-center mb-2">
                  <button type="button" className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-gray-100 text-sm transition-colors">
                    <FiMapPin className="inline mr-1" /> เลือกจากแผนที่
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <LocationField label="จังหวัด" name="province" value={form.localFilters.province} onChange={(e) => form.setLocation(e.target.name, e.target.value)} placeholder="กรอกหรือเลือกจังหวัด" />
                  <LocationField label="อำเภอ" name="district" value={form.localFilters.district} onChange={(e) => form.setLocation(e.target.name, e.target.value)} placeholder="กรอกหรือเลือกอำเภอ" />
                  <LocationField label="ตำบล" name="subdistrict" value={form.localFilters.subdistrict} onChange={(e) => form.setLocation(e.target.name, e.target.value)} placeholder="กรอกหรือเลือกตำบล" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between p-4 border-t border-slate-200 gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={handleClear}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg text-[#b30000] border-red-600 hover:bg-red-50 order-2 sm:order-1 transition-colors font-medium"
          >
            ล้างการคัดกรองทั้งหมด
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#b30000] text-white hover:bg-[#990000] order-1 sm:order-2 transition-colors font-medium shadow-sm"
          >
            คัดกรองผลลัพธ์
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FilterPopup);