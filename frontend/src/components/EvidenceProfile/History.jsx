import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { PiImageBroken } from "react-icons/pi";
import { TbHistory } from "react-icons/tb";
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { parseDateBE, formatDateToBE } from '../../utils/dateUtils';

import FilterPopup from "../common/FilterPopup";
import FilterTags from "../common/FilterTags";
import Loading from "../common/Loading";
import ErrorDisplay from "../common/ErrorDisplay";
import Pagination from "../common/Pagination";
import HistoryCard from '../History/common/HistoryCard';
import HistoryTableRow from '../History/common/HistoryTableRow';

// import useExhibitHistoryData from "../../hooks/useExhibitHistoryData";

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// ==================== UTILS ====================
const applyFilters = (data = [], filters = {}) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.filter(item => {
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      if (start && end) {
        const itemDate = parseDateBE(item.date) || (item.date ? new Date(item.date) : null);
        if (!itemDate) return false;
        if (itemDate < start || itemDate > end) return false;
      }
    }
    if (filters.province && item.originalData?.province_name !== filters.province) return false;
    if (filters.district && item.originalData?.district_name !== filters.district) return false;
    if (filters.subdistrict && item.originalData?.subdistrict_name !== filters.subdistrict) return false;
    return true;
  });
};

const getFilterLabelsFromApplied = (applied) => {
  const labels = [];
  if (!applied) return labels;
  if (applied.dateRange) {
    const [start, end] = applied.dateRange;
    const startStr = start.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const endStr = end.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    labels.push({ key: 'dateRange', label: `วันที่: ${startStr} - ${endStr}` });
  }
  if (applied.province) labels.push({ key: 'province', label: `จังหวัด: ${applied.province}` });
  if (applied.district) labels.push({ key: 'district', label: `อำเภอ: ${applied.district}` });
  if (applied.subdistrict) labels.push({ key: 'subdistrict', label: `ตำบล: ${applied.subdistrict}` });
  return labels;
};

// ==================== CUSTOM HOOK ====================
function useHistoryLogic({ evidence, propCurrentUser }) {
  const [user] = useUser();
  const currentUser = user ?? propCurrentUser;
  const navigate = useNavigate();

  // const {
  //   data: historyData,
  //   isLoading,
  //   error: hookError,
  //   currentPage,
  //   rowsPerPage,
  //   totalPages,
  //   indexOfFirstItem,
  //   indexOfLastItem,
  //   currentItems,
  //   fetchExhibitHistoryData,
  //   handlePageChange,
  //   handleRowsPerPageChange
  // } = useExhibitHistoryData();

  // useExhibitHistoryData ยังไม่ได้ใช้ — ใส่ fallback ค่าเริ่มต้นเพื่อไม่ให้เกิด ReferenceError
  const historyData = [];
  const isLoading = false;
  const hookError = null;
  const currentPage = 1;
  const rowsPerPage = 10;
  const totalPages = 1;
  const indexOfFirstItem = 0;
  const indexOfLastItem = 0;
  const currentItems = [];
  const fetchExhibitHistoryData = async () => { /* no-op fallback while hook is disabled */ };
  const handlePageChange = () => {};
  const handleRowsPerPageChange = () => {};

  const [filters, setFilters] = useState({
    dateRange: null,
    customDate: '',
    customDateRange: null,
    province: '',
    district: '',
    subdistrict: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [provinceList, setProvinceList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [subdistrictList, setSubdistrictList] = useState([]);
  const [provincesOptions, setProvincesOptions] = useState([]);
  const [districtsOptions, setDistrictsOptions] = useState([]);
  const [subdistrictsOptions, setSubdistrictsOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  // fetch location data once
  useEffect(() => {
    let mounted = true;
    const fetchLocationData = async () => {
      try {
        setLocationLoading(true);

        const [provRes, distRes, subRes] = await Promise.all([
          fetch(`${BASE_URL}/provinces`),
          fetch(`${BASE_URL}/districts`),
          fetch(`${BASE_URL}/subdistricts`)
        ]);

        if (!provRes.ok || !distRes.ok || !subRes.ok) {
          throw new Error('Failed to fetch location data');
        }

        const provData = await provRes.json();
        const distData = await distRes.json();
        const subData = await subRes.json();

        if (!mounted) return;

        setProvinceList(provData || []);
        setDistrictList(distData || []);
        setSubdistrictList(subData || []);

        setProvincesOptions((provData || []).map(p => ({ value: p.province_name, label: p.province_name, id: p.id })));
        setDistrictsOptions((distData || []).map(d => ({ value: d.district_name, label: d.district_name, id: d.id })));
        setSubdistrictsOptions((subData || []).map(s => ({ value: s.subdistrict_name, label: s.subdistrict_name, id: s.id })));
      } catch (err) {
        console.error('Failed to load location data', err);
      } finally {
        if (mounted) setLocationLoading(false);
      }
    };
    fetchLocationData();
    return () => { mounted = false; };
  }, []);

  // -----------------------------------------
  // NOTE: The following effect used to call fetchExhibitHistoryData based on role & evidence.
  // Because useExhibitHistoryData is currently disabled, this effect is commented out to
  // prevent runtime calls to an unavailable API. Re-enable and restore the real hook when ready.
  // -----------------------------------------
  /*
  useEffect(() => {
    if (!evidence?.exhibit_id || !currentUser) return;

    const userId = currentUser?.user_id || currentUser?.id;
    const evidenceCategory = evidence?.category || evidence?.exhibit?.category;

    if (currentUser?.role?.id === 1) {
      // admin - all
      fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id });
    } else if (currentUser?.role?.id === 2) {
      // department admin
      if (currentUser?.department === "กลุ่มงานอาวุธปืน") {
        if (evidenceCategory === "ปืน" || evidenceCategory === "อาวุธปืน") {
          fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id });
        } else {
          fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id, userId });
        }
      } else if (currentUser?.department === "กลุ่มงานยาเสพติด") {
        if (evidenceCategory === "ยาเสพติด") {
          fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id });
        } else {
          fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id, userId });
        }
      }
    } else if (userId) {
      fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id, userId });
    }
  }, [evidence, currentUser, fetchExhibitHistoryData]);
  */
  
  // compute filteredData locally (pure)
  const filteredData = useMemo(() => applyFilters(historyData || [], appliedFilters), [historyData, appliedFilters]);

  const handleApplyFilters = useCallback((newFilters) => {
    const applied = {};
    if (newFilters.customDateRange) applied.dateRange = newFilters.customDateRange;
    else if (newFilters.dateRange) applied.dateRange = newFilters.dateRange;

    if (newFilters.province) applied.province = newFilters.province;
    if (newFilters.district) applied.district = newFilters.district;
    if (newFilters.subdistrict) applied.subdistrict = newFilters.subdistrict;

    setFilters(newFilters);
    setAppliedFilters(applied);
    setIsFilterOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      dateRange: null,
      customDate: '',
      customDateRange: null,
      province: '',
      district: '',
      subdistrict: '',
    });
    setAppliedFilters({});
  }, []);

  const removeFilter = useCallback((key) => {
    const nextApplied = { ...appliedFilters };
    const nextFilters = { ...filters };
    delete nextApplied[key];
    if (key === 'dateRange') {
      nextFilters.dateRange = null; nextFilters.customDateRange = null;
    } else {
      nextFilters[key] = '';
    }
    setAppliedFilters(nextApplied);
    setFilters(nextFilters);
  }, [appliedFilters, filters]);

  const getFilterLabels = useCallback(() => getFilterLabelsFromApplied(appliedFilters), [appliedFilters]);

  const handleViewDetail = useCallback((item) => {
    navigate('/history/detail', { state: { item: { ...item, originalData: item.originalData || {} } } });
  }, [navigate]);

  const handleRetry = useCallback(() => {
    if (!evidence?.exhibit_id || !currentUser) return;
    const userId = currentUser?.user_id || currentUser?.id;
    const evidenceCategory = evidence?.category || evidence?.exhibit?.category;
    if (currentUser?.role?.id === 1) {
      fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id });
    } else if (currentUser?.role?.id === 2) {
      if (currentUser?.department === "กลุ่มงานอาวุธปืน") {
        if (evidenceCategory === "ปืน" || evidenceCategory === "อาวุธปืน") fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id });
        else fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id, userId });
      } else if (currentUser?.department === "กลุ่มงานยาเสพติด") {
        if (evidenceCategory === "ยาเสพติด") fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id });
        else fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id, userId });
      }
    } else if (userId) {
      fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id, userId });
    }
  }, [evidence, currentUser, fetchExhibitHistoryData]);

  return {
    currentUser,
    historyData,
    filteredData,
    isLoading,
    error: hookError,
    currentPage,
    rowsPerPage,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    currentItems,
    fetchExhibitHistoryData,
    handlePageChange,
    handleRowsPerPageChange,
    filters,
    setFilters,
    appliedFilters,
    isFilterOpen,
    setIsFilterOpen,
    provinceList,
    districtList,
    subdistrictList,
    provincesOptions,
    districtsOptions,
    subdistrictsOptions,
    locationLoading,
    handleApplyFilters,
    handleClearFilters,
    removeFilter,
    getFilterLabels,
    handleViewDetail,
    handleRetry
  };
}

// ==================== PRESENTATIONAL SMALL COMPONENTS ====================
const NoImageDisplay = React.memo(({ message = "ไม่พบรูปภาพ", subMessage = "", small = false }) => (
  <div className={`flex flex-col items-center justify-center ${small ? 'p-1' : 'p-3'} bg-gray-50 rounded-lg border border-gray-300 ${small ? 'h-12 w-12' : 'h-32 w-full'}`}>
    <PiImageBroken className={`text-gray-500 ${small ? 'text-lg mb-0' : 'text-3xl mb-2'}`} />
    {!small && (
      <>
        <p className="text-gray-600 text-xs text-center">{message}</p>
        {subMessage && <p className="text-gray-500 text-xs text-center mt-1">{subMessage}</p>}
      </>
    )}
  </div>
));

// ==================== MAIN COMPONENT ====================
const History = ({ evidence, currentUser: propCurrentUser }) => {
  const logic = useHistoryLogic({ evidence, propCurrentUser });

  const {
    currentUser,
    filteredData,
    isLoading,
    error,
    currentItems,
    currentPage,
    totalPages,
    rowsPerPage,
    indexOfFirstItem,
    indexOfLastItem,
    handlePageChange,
    handleRowsPerPageChange,
    isFilterOpen,
    setIsFilterOpen,
    filters,
    handleApplyFilters,
    handleClearFilters,
    removeFilter,
    getFilterLabels,
    provinceList,
    districtList,
    subdistrictList,
    provincesOptions,
    districtsOptions,
    subdistrictsOptions,
    locationLoading,
    handleViewDetail,
    handleRetry
  } = logic;

  if (isLoading) return <Loading message="กำลังโหลดประวัติ..." />;

  if (error === "empty") {
    const getEmptyStateMessage = () => {
      if (!currentUser) return { title: "กำลังโหลดข้อมูลผู้ใช้...", description: "" };
      const evidenceCategory = evidence?.category || evidence?.exhibit?.category;
      if (currentUser?.role?.id === 1) return { title: "ยังไม่มีการบันทึกประวัติของวัตถุพยานนี้", description: "ยังไม่มีใครบันทึกประวัติการพบเห็นวัตถุพยานชิ้นนี้ในระบบ" };
      if (currentUser?.role?.id === 2 && currentUser?.department === "กลุ่มงานอาวุธปืน") {
        if (evidenceCategory === "ปืน" || evidenceCategory === "อาวุธปืน") return { title: "ยังไม่มีการบันทึกประวัติของปืนนี้", description: "ยังไม่มีใครบันทึกประวัติการพบเห็นปืนชิ้นนี้ในระบบ" };
        return { title: "ยังไม่มีการบันทึกประวัติของวัตถุพยานนี้", description: "คุณยังไม่เคยบันทึกประวัติการพบเห็นวัตถุพยานชิ้นนี้ในระบบ" };
      }
      if (currentUser?.role?.id === 2 && currentUser?.department === "กลุ่มงานยาเสพติด") {
        if (evidenceCategory === "ยาเสพติด") return { title: "ยังไม่มีการบันทึกประวัติของยาเสพติดนี้", description: "ยังไม่มีใครบันทึกประวัติการพบเห็นยาเสพติดชิ้นนี้ในระบบ" };
        return { title: "ยังไม่มีการบันทึกประวัติของวัตถุพยานนี้", description: "คุณยังไม่เคยบันทึกประวัติการพบเห็นวัตถุพยานชิ้นนี้ในระบบ" };
      }
      return { title: "ยังไม่มีการบันทึกประวัติของวัตถุพยานนี้", description: "คุณยังไม่เคยบันทึกประวัติการพบเห็นวัตถุพยานชิ้นนี้ในระบบ" };
    };

    const emptyMessage = getEmptyStateMessage();
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-gray-50 p-8 rounded-xl border border-gray-300 max-w-md flex flex-col items-center">
          <TbHistory className="text-gray-500 text-6xl mb-4" />
          <h2 className="text-xl font-medium text-gray-800 mb-2">{emptyMessage.title}</h2>
          <p className="text-gray-600 mb-6">{emptyMessage.description}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} subMessage={!evidence?.exhibit_id ? "ไม่พบรหัสวัตถุพยาน (Exhibit ID)" : null} onRetry={handleRetry} />;
  }

  return (
    <div className='flex-1 overflow-auto bg-white'>
      <div className="md:hidden">
        <div className="px-4 sm:px-6 pt-4 flex justify-between items-center mb-4">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 text-sm text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#990000]/20"
            aria-haspopup="dialog"
          >
            <FiFilter size={16} /> ตัวกรอง
          </button>
        </div>

        <FilterPopup
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onFilterChange={(newFilters) => {/* controlled by hook */}}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          preloadedData={{
            provinceList, districtList, subdistrictList, provinces: provincesOptions, districts: districtsOptions, subdistricts: subdistrictsOptions, loading: locationLoading
          }}
        />

        <FilterTags labels={getFilterLabels()} onRemove={removeFilter} />

        <div className="pr-4 pb-32 pl-4 grid grid-cols-1 gap-4">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <HistoryCard key={item.id} item={item} onViewDetail={handleViewDetail} showDiscoverer showModifier />
            ))
          ) : (
            <div className="text-center text-gray-600 py-10 col-span-1">ไม่พบข้อมูล</div>
          )}
        </div>

        {filteredData.length > 0 && (
          <div className="fixed bottom-[74px] left-0 right-0 bg-white p-2 flex flex-col border-t border-b z-20">
            <div className="flex justify-between items-center pt-1">
              <div className="text-gray-700 text-xs sm:text-sm pl-2">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} จาก {filteredData.length}</div>
              <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                <span className="mr-1 sm:mr-2">แถว:</span>
                <select value={rowsPerPage} onChange={(e) => handleRowsPerPageChange(Number(e.target.value))} className="bg-transparent border rounded px-1 sm:px-2 py-1 text-gray-600 text-xs sm:text-sm focus:outline-none cursor-pointer" aria-label="Rows per page">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 pr-2">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`} aria-label="Previous page"><FiChevronLeft size={18} /></button>
                <span className="font-medium text-xs sm:text-sm text-gray-700">{currentPage}/{totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`p-1 rounded ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`} aria-label="Next page"><FiChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block h-full">
        <div className="h-full w-full flex flex-col overflow-hidden">
          <div className="px-6 pt-4 flex justify-between items-center mb-4 flex-shrink-0">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#990000]/20"
              aria-haspopup="dialog"
            >
              <FiFilter size={18} /> ตัวกรอง
            </button>
          </div>

          <FilterPopup
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={filters}
            onFilterChange={(newFilters) => {/* controlled by hook */}}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            preloadedData={{
              provinceList, districtList, subdistrictList, provinces: provincesOptions, districts: districtsOptions, subdistricts: subdistrictsOptions, loading: locationLoading
            }}
          />

          <FilterTags labels={getFilterLabels()} onRemove={removeFilter} />

          <div className="px-6 pb-6 h-[65vh] flex flex-col flex-grow overflow-hidden">
            <div className="bg-white rounded shadow-md flex flex-col flex-grow overflow-hidden">
              <div className="flex-grow overflow-auto">
                <table className="w-full table-fixed border-collapse" role="table" aria-label="History table">
                  <thead>
                    <tr className="bg-gray-100 sticky top-0 z-10">
                      <th className="p-3 text-left w-[12%] font-semibold text-gray-700">วัน/เดือน/ปี</th>
                      <th className="p-3 text-left w-[10%] font-semibold text-gray-700">หมวดหมู่</th>
                      <th className="p-3 text-left w-[8%] font-semibold text-gray-700">รูปภาพ</th>
                      <th className="p-3 text-left w-[15%] font-semibold text-gray-700">ชื่อ</th>
                      <th className="p-3 text-left w-[20%] font-semibold text-gray-700">สถานที่พบ</th>
                      <th className="p-3 text-left w-[15%] font-semibold text-gray-700">ผู้บันทึก/แก้ไข</th>
                      <th className="p-3 text-left w-[10%] font-semibold text-gray-700">การจัดการ</th>
                    </tr>
                  </thead>

                  {currentItems.length > 0 ? (
                    <tbody>
                      {currentItems.map((item) => (
                        <HistoryTableRow key={item.id} item={item} onViewDetail={handleViewDetail} showActionColumn showRecorderInfo NoImageComponent={NoImageDisplay} />
                      ))}
                    </tbody>
                  ) : (
                    <tbody>
                      <tr><td colSpan="7" className="text-center text-gray-500 py-10">ไม่พบข้อมูล</td></tr>
                    </tbody>
                  )}
                </table>
              </div>

              {filteredData.length > 0 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleRowsPerPageChange} totalItems={filteredData.length} indexOfFirstItem={indexOfFirstItem} indexOfLastItem={indexOfLastItem} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;