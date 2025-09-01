import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { parseDateBE, formatDateToBE } from '../../../utils/dateUtils';

/* ========================= CONSTANTS ========================= */
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const DEFAULT_POPUP_COUNT = 5;
const INITIAL_FILTERS = {
  categories: [],
  dateRange: null,
  customDate: '',
  province: '',
  district: '',
  subdistrict: '',
};

/* ========================= HELPERS ========================= */
const normalizeFilters = (f) => ({ ...INITIAL_FILTERS, ...(f || {}) });

const safeParseTimestamp = (dateStr) => {
  try {
    const d = dateStr ? new Date(dateStr) : null;
    return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
  } catch {
    return 0;
  }
};

const mapApiItem = (item) => {
  const dateToFormat = item.discovery_date || item.created_at || null;
  const date = formatDateToBE(dateToFormat);
  let time = '';
  if (item.discovery_time) {
    time = item.discovery_time.substring(0, 5);
  } else if (item.created_at && !item.discovery_date) {
    const cd = new Date(item.created_at);
    if (!Number.isNaN(cd.getTime())) {
      time = `${String(cd.getHours()).padStart(2, '0')}:${String(cd.getMinutes()).padStart(2, '0')}`;
    }
  }

  const { exhibit = {} } = item;
  const {
    narcotics: narcoticObjData = null,
    firearms: firearmObjData = null,
    category: exhibitCategory,
    subcategory: exhibitSubcategory,
    images: exhibitImages = [],
  } = exhibit;

  const id = item.id || null;
  const category = exhibitCategory || 'ไม่ระบุหมวดหมู่';
  let exhibitName = 'ไม่ระบุชื่อ';
  const discovererName = item.discoverer_name || 'ไม่มีข้อมูล';
  const confidence = item.ai_confidence ?? null;
  const timestamp = safeParseTimestamp(dateToFormat);
  const province = item.province_name || 'ไม่ทราบจังหวัด';
  const district = item.district_name || 'ไม่ทราบอำเภอ/เขต';
  const subdistrict = item.subdistrict_name || 'ไม่ทราบตำบล/แขวง';

  // pick image
  let imageUrl = item.photo_url || '';
  if (!imageUrl && exhibitImages && Array.isArray(exhibitImages) && exhibitImages.length) {
    const sorted = [...exhibitImages].sort((a, b) => (a.priority || 999) - (b.priority || 999));
    imageUrl = sorted[0]?.image_url || imageUrl;
  }

  // derive exhibitName from firearms/narcotics if available
  if (firearmObjData) {
    const firearm = Array.isArray(firearmObjData) ? firearmObjData[0] : firearmObjData;
    if (firearm) {
      const parts = [firearm.brand, firearm.model].filter(Boolean);
      exhibitName = parts.length ? parts.join(' ') : (firearm.brand || firearm.model || 'ไม่ระบุชื่อ');
    } else {
      exhibitName = exhibitSubcategory || exhibitCategory || 'ไม่ระบุชื่อ';
    }
  }

  if (narcoticObjData) {
    const narcotic = Array.isArray(narcoticObjData) ? narcoticObjData[0] : narcoticObjData;
    if (narcotic) {
      exhibitName = narcotic.characteristics || narcotic.drug_type || narcotic.drug_category || exhibitName;
    } else {
      exhibitName = exhibitSubcategory || exhibitCategory || exhibitName;
    }
  }

  const locationParts = [];
  if (item.place_name) locationParts.push(item.place_name);
  if (item.subdistrict_name) locationParts.push(`ต.${item.subdistrict_name}`);
  if (item.district_name) locationParts.push(`อ.${item.district_name}`);
  if (item.province_name) locationParts.push(`จ.${item.province_name}`);

  const location = locationParts.join(', ');

  const addressParts = [];
  if (item.house_no) addressParts.push(`บ้านเลขที่ ${item.house_no}`);
  if (item.village_no) addressParts.push(`หมู่ ${item.village_no}`);
  if (item.alley) addressParts.push(`ซอย${item.alley}`);
  if (item.road) addressParts.push(`ถนน${item.road}`);
  if (addressParts.length) locationParts.push(addressParts.join(' '));

  const base = {
    id,
    date,
    time,
    category,
    image: imageUrl,
    name: exhibitName,
    location,
    discovererName,
    confidence,
    province,
    district,
    subdistrict,
    originalData: item,
    timestamp,
  };

  if (narcoticObjData) {
    const narcotic = Array.isArray(narcoticObjData) ? narcoticObjData[0] : narcoticObjData;
    const drugCategory = narcotic?.drug_category || 'ไม่มีข้อมูล';
    const drugType = narcotic?.drug_type || 'ไม่มีข้อมูล';
    return {
      ...base,
      drugCategory,
      drugType,
    };
  }

  if (firearmObjData) {
    const firearm = Array.isArray(firearmObjData) ? firearmObjData[0] : firearmObjData;
    const firearmSubCategory = exhibitSubcategory || 'ไม่มีข้อมูล';
    const firearmMechanism = firearm?.mechanism || 'ไม่มีข้อมูล';
    const firearmBrand = firearm?.brand || 'ไม่มีข้อมูล';
    const firearmSeries = firearm?.series || 'ไม่มีข้อมูล';
    const firearmModel = firearm?.model || 'ไม่มีข้อมูล';
    return {
      ...base,
      firearmSubCategory,
      firearmMechanism,
      firearmBrand,
      firearmSeries,
      firearmModel,
    };
  }

  return null;
};

/* ========================= CUSTOM HOOK ========================= */
const useHistoryData = () => {
  const location = useLocation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [popup, setPopup] = useState({ open: false, type: '', message: '' });
  const [popupCountdown, setPopupCountdown] = useState(DEFAULT_POPUP_COUNT);

  /* ========================= API FETCH ========================= */
  const fetchHistoryData = useCallback(async (options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `${BASE_URL}/history`;
      if (options.userId) url += `?user_id=${encodeURIComponent(options.userId)}`;

      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Fetch failed: ${resp.status} ${text}`);
      }
      const respJson = await resp.json().catch(() => null);
      const payload = Array.isArray(respJson?.data) ? respJson.data : (Array.isArray(respJson) ? respJson : []);
      const mapped = (Array.isArray(payload) ? payload.map(mapApiItem).filter(Boolean) : [])
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      if (options.userId) {
        const uid = String(options.userId);
        const filteredByUser = mapped.filter(i => String(i.originalData?.discovered_by) === uid);
        setData(filteredByUser);
        setFilteredData(filteredByUser);
      } else {
        setData(mapped);
        setFilteredData(mapped);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('useHistoryData.fetchHistoryData error', err);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      setData([]);
      setFilteredData([]);
      setIsLoading(false);
    }
  }, []);

  /* ========================= FILTERING ========================= */
  useEffect(() => {
    setFilters((f) => normalizeFilters(f));
  }, []);

  useEffect(() => {
    let result = Array.isArray(data) ? [...data] : [];

    const cats = appliedFilters.categories || [];
    if (cats.length) result = result.filter((i) => cats.includes(i.category));

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (appliedFilters.dateRange) {
      let start = new Date(today);
      switch (appliedFilters.dateRange) {
        case 'today':
          break;
        case 'last7days':
          start.setUTCDate(today.getUTCDate() - 7);
          break;
        case 'last1month':
          start.setUTCMonth(today.getUTCMonth() - 1);
          break;
        case 'last6months':
          start.setUTCMonth(today.getUTCMonth() - 6);
          break;
        case 'last1year':
          start.setUTCFullYear(today.getUTCFullYear() - 1);
          break;
        default:
          start = null;
      }
      if (start) {
        result = result.filter((i) => {
          const d = parseDateBE(i.date);
          return d && d >= start && d <= today;
        });
      }
    } else if (appliedFilters.customDate) {
      try {
        const [year, month, day] = appliedFilters.customDate.split('-').map(Number);
        const customUTC = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
        if (!Number.isNaN(customUTC.getTime())) {
          result = result.filter((i) => {
            const d = parseDateBE(i.date);
            return d &&
              d.getUTCFullYear() === customUTC.getUTCFullYear() &&
              d.getUTCMonth() === customUTC.getUTCMonth() &&
              d.getUTCDate() === customUTC.getUTCDate();
          });
        }
      } catch (e) {
        console.error('customDate parse error', e);
      }
    }

    if (appliedFilters.province) {
      result = result.filter((i) => i.location?.toLowerCase().includes(appliedFilters.province.toLowerCase()));
    }
    if (appliedFilters.district) {
      result = result.filter((i) => i.location?.toLowerCase().includes(appliedFilters.district.toLowerCase()));
    }
    if (appliedFilters.subdistrict) {
      result = result.filter((i) => i.location?.toLowerCase().includes(appliedFilters.subdistrict.toLowerCase()));
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [appliedFilters, data]);

  /* ========================= POPUP COUNTDOWN ========================= */
  useEffect(() => {
    if (!popup?.open) return undefined;
    setPopupCountdown(DEFAULT_POPUP_COUNT);
    let id = null;
    const tick = () => {
      setPopupCountdown((c) => {
        if (c <= 1) {
          setPopup((p) => ({ ...p, open: false }));
          return 0;
        }
        return c - 1;
      });
    };
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [popup?.open, popup?.type]);

  useEffect(() => {
    if (location?.state?.popup) {
      setPopup(location.state.popup);
      setPopupCountdown(DEFAULT_POPUP_COUNT);
      try { window.history.replaceState({}, document.title); } catch {}
    }
  }, [location]);

  /* ========================= DERIVED / PAGINATION ========================= */
  const totalPages = useMemo(() => Math.max(1, Math.ceil((filteredData?.length || 0) / rowsPerPage)), [filteredData, rowsPerPage]);
  const indexOfLastItem = useMemo(() => currentPage * rowsPerPage, [currentPage, rowsPerPage]);
  const indexOfFirstItem = useMemo(() => indexOfLastItem - rowsPerPage, [indexOfLastItem, rowsPerPage]);
  const currentItems = useMemo(() => (Array.isArray(filteredData) ? filteredData.slice(indexOfFirstItem, indexOfLastItem) : []), [filteredData, indexOfFirstItem, indexOfLastItem]);

  /* ========================= ACTIONS (stable refs) ========================= */
  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  const handleRowsPerPageChange = useCallback((e) => {
    const v = Number(e?.target?.value ?? e);
    if (Number.isNaN(v) || v <= 0) return;
    setRowsPerPage(v);
    setCurrentPage(1);
  }, []);

  const handleApplyFilters = useCallback((newFilters) => {
    setAppliedFilters(normalizeFilters(newFilters));
    setFilters(normalizeFilters(newFilters));
  }, []);

  const handleClearFilters = useCallback(() => {
    setAppliedFilters(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
    setIsFilterOpen(false);
  }, []);

  const getFilterLabels = useCallback(() => {
    const labels = [];
    const f = appliedFilters || {};
    (f.categories || []).forEach((c) => labels.push({ type: 'category', value: c, label: c }));
    if (f.dateRange) {
      const map = { today: 'วันนี้', last7days: '7 วันล่าสุด', last1month: '1 เดือนล่าสุด', last6months: '6 เดือนล่าสุด', last1year: '1 ปีล่าสุด' };
      labels.push({ type: 'date', value: f.dateRange, label: map[f.dateRange] || f.dateRange });
    } else if (f.customDate) {
      labels.push({ type: 'date', value: 'custom', label: `วันที่: ${f.customDate}` });
    }
    if (f.province) labels.push({ type: 'location', value: 'province', label: `จังหวัด: ${f.province}` });
    if (f.district) labels.push({ type: 'location', value: 'district', label: `อำเภอ: ${f.district}` });
    if (f.subdistrict) labels.push({ type: 'location', value: 'subdistrict', label: `ตำบล: ${f.subdistrict}` });
    return labels;
  }, [appliedFilters]);

  const removeFilter = useCallback((type, value) => {
    const next = { ...(appliedFilters || {}) };
    if (type === 'category') next.categories = (next.categories || []).filter((c) => c !== value);
    else if (type === 'date') {
      if (value === 'custom') next.customDate = '';
      else next.dateRange = null;
    } else if (type === 'location') {
      next[value] = '';
    }
    setAppliedFilters(next);
    setFilters(next);
  }, [appliedFilters]);

  const handleDeleteHistory = useCallback(async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้?')) return;
    try {
      const res = await fetch(`${BASE_URL}/history/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setData((prev) => prev.filter((i) => i.id !== id));
        setFilteredData((prev) => prev.filter((i) => i.id !== id));
        setPopup({ open: true, type: 'success', message: 'ลบรายการสำเร็จ' });
      } else {
        let errJson = null;
        try { errJson = await res.json(); } catch (_) {}
        let message = 'เกิดข้อผิดพลาดในการลบรายการ';
        if (res.status === 401 || res.status === 403) message = 'คุณไม่มีสิทธิ์ในการลบรายการนี้';
        else if (res.status === 404) message = 'ไม่พบรายการที่ต้องการลบ';
        else if (errJson?.detail) message = errJson.detail;
        setPopup({ open: true, type: 'fail', message });
      }
    } catch (err) {
      console.error('delete history error', err);
      let message = 'เกิดข้อผิดพลาดในการลบรายการ';
      if (err?.status === 401 || err?.status === 403) message = 'คุณไม่มีสิทธิ์ในการลบรายการนี้';
      else if (err?.status === 404) message = 'ไม่พบรายการที่ต้องการลบ';
      else if (err?.detail) message = err.detail;
      setPopup({ open: true, type: 'fail', message });
    }
    setPopupCountdown(DEFAULT_POPUP_COUNT);
  }, []);

  return {
    isFilterOpen,
    setIsFilterOpen,
    filters,
    appliedFilters,
    data,
    filteredData,
    currentPage,
    rowsPerPage,
    isLoading,
    error,
    popup,
    setPopup,
    popupCountdown,

    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    currentItems,

    fetchHistoryData,
    handlePageChange,
    handleRowsPerPageChange,
    handleApplyFilters,
    handleClearFilters,
    getFilterLabels,
    removeFilter,
    handleDeleteHistory,

    setFilters,
  };
};

export default useHistoryData;