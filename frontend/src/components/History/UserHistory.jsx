import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import FilterPopup from '../common/FilterPopup';
import FilterTags from '../common/FilterTags';
import Popup from '../common/Popup';
import Loading from '../common/Loading';
import ErrorDisplay from '../common/ErrorDisplay';
import Pagination from '../common/Pagination';
import HistoryCard from './common/HistoryCard';
import HistoryTableRow from './common/HistoryTableRow';
import useHistoryData from '../../hooks/api/useHistoryData';
import { useUser } from '../../hooks/useUser';

/* ========================= CONSTANTS ========================= */
const ROW_OPTIONS = [5, 10, 20];

/* ========================= UTILS ========================= */
const getItemKey = (item) => item?.id ?? `${item?.name ?? 'item'}-${item?.date ?? ''}`;

/* ========================= MAIN COMPONENT ========================= */
const UserHistory = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const {
    isFilterOpen,
    setIsFilterOpen,
    filters,
    data,
    isLoading,
    error,
    popup,
    setPopup,
    popupCountdown,
    currentPage,
    rowsPerPage,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    currentItems,
    filteredData,

    fetchHistoryData,
    handlePageChange,
    handleRowsPerPageChange,
    handleApplyFilters,
    handleClearFilters,
    getFilterLabels,
    removeFilter,
    setFilters = () => {},
  } = useHistoryData();

  const [tempFilters, setTempFilters] = useState(filters ?? {});

  useEffect(() => {
    setTempFilters(filters ?? {});
  }, [filters]);

  useEffect(() => {
    if (user && fetchHistoryData) {
      fetchHistoryData({ userId: user.user_id });
    }
  }, [user, fetchHistoryData]);

  // handlers
  const handleViewDetail = useCallback((item) => {
    navigate('/history/detail', { state: { item } });
  }, [navigate]);

  const onPopupClose = useCallback(() => {
    setPopup({ ...popup, open: false });
  }, [popup, setPopup]);

  const onFilterChange = useCallback((newFilters) => {
    try {
      setFilters(newFilters);
    } catch {
      // fallback to local tempFilters if hook doesn't support setFilters
    }
    setTempFilters(newFilters);
  }, [setFilters]);

  const onApplyFilters = useCallback(() => {
    try {
      handleApplyFilters(tempFilters);
    } catch {
      handleApplyFilters();
    }
    setIsFilterOpen(false);
  }, [handleApplyFilters, tempFilters, setIsFilterOpen]);

  const onClearFilters = useCallback(() => {
    handleClearFilters();
    setTempFilters({});
  }, [handleClearFilters]);

  const adaptedRemoveFilter = useCallback((filterObj) => {
    if (filterObj && filterObj.type && (filterObj.value !== undefined)) {
      removeFilter(filterObj.type, filterObj.value);
    }
  }, [removeFilter]);

  const hasItems = useMemo(() => (currentItems && currentItems.length > 0), [currentItems]);
  const hasFilteredData = useMemo(() => (filteredData && filteredData.length > 0), [filteredData]);

  return (
    <div className="w-full h-full">
      <Popup
        open={popup.open}
        type={popup.type}
        message={popup.message}
        countdown={popupCountdown}
        onClose={onPopupClose}
      />

      {/* Mobile view */}
      <div className="md:hidden">
        <div className="px-4 py-3 flex items-center justify-center relative shadow-[0_1.5px_4px_rgba(0,0,0,0.2)] border-b border-gray-100">
          <button className="absolute left-4" onClick={() => navigate(-1)}>
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-center flex-1">ประวัติการพบวัตถุพยาน</h1>
        </div>
        <div className="px-4 sm:px-6 pt-4 flex justify-between items-center mb-4">
          <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded bg-white hover:bg-gray-50 text-sm">
            <FiFilter size={16} /> ตัวกรอง
          </button>
        </div>

        <FilterPopup
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={tempFilters}
          onFilterChange={onFilterChange}
          onApplyFilters={onApplyFilters}
          onClearFilters={onClearFilters}
        />
        <FilterTags labels={getFilterLabels()} onRemove={adaptedRemoveFilter} />

        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorDisplay message={error} onRetry={() => fetchHistoryData()} />
        ) : (
          <div className="pr-4 pb-32 pl-4 grid grid-cols-1 gap-4">
            {hasItems ? (
              currentItems.map((item) => (
                <HistoryCard
                  key={getItemKey(item)}
                  item={item}
                  onViewDetail={handleViewDetail}
                  isAdmin={false}
                  showDiscoverer={true}
                  showModifier={true}
                />
              ))
            ) : (
              <div className="text-center text-gray-500 py-10 col-span-1">ไม่พบข้อมูลตามตัวกรอง</div>
            )}
          </div>
        )}

        {!isLoading && !error && hasFilteredData && (
          <div className="fixed bottom-16 left-0 right-0 bg-white shadow-md p-2 flex flex-col border-t border-t-gray-100">
            <div className="flex justify-between items-center pt-1">
              <div className="text-gray-600 text-xs sm:text-sm pl-2">
                {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} จาก {filteredData.length}
              </div>
              <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                <span className="mr-1 sm:mr-2">แถว:</span>
                <select
                  className="bg-transparent border border-gray-200 rounded px-1 sm:px-2 py-1 text-gray-600 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                >
                  {ROW_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 pr-2">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}>
                  <FiChevronLeft size={18} />
                </button>
                <span className="font-medium text-xs sm:text-sm">{currentPage}/{totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`p-1 rounded ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}>
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block h-full">
        <div className="h-full w-full flex flex-col overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center flex-shrink-0 border-b border-gray-100">
            <h1 className="text-xl font-bold">ประวัติการพบวัตถุพยาน</h1>
          </div>
          <div className="px-6 flex justify-between items-center mb-4 md:mt-4 flex-shrink-0">
            <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded bg-white hover:bg-gray-50">
              <FiFilter size={18} /> ตัวกรอง
            </button>
          </div>

          <FilterPopup
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={tempFilters}
            onFilterChange={onFilterChange}
            onApplyFilters={onApplyFilters}
            onClearFilters={onClearFilters}
          />
          <FilterTags labels={getFilterLabels()} onRemove={adaptedRemoveFilter} />

          <div className="px-6 pb-6 flex flex-col flex-grow overflow-hidden">
            <div className="bg-white rounded shadow-md flex flex-col flex-grow overflow-hidden border border-gray-50">
              <div className="flex-grow overflow-auto">
                {isLoading ? (
                  <Loading />
                ) : error ? (
                  <ErrorDisplay message={error} onRetry={() => fetchHistoryData()} />
                ) : (
                  <table className="w-full table-fixed border-collapse divide-y divide-gray-100">
                    <thead>
                      <tr className="bg-gray-200 sticky top-0 z-[5]">
                        <th className="p-3 text-left w-[15%] font-semibold">วัน/เดือน/ปี</th>
                        <th className="p-3 text-left w-[15%] font-semibold">หมวดหมู่</th>
                        <th className="p-3 text-left w-[10%] font-semibold">รูปภาพ</th>
                        <th className="p-3 text-left w-[25%] font-semibold">ชื่อ</th>
                        <th className="p-3 text-left w-[25%] font-semibold">สถานที่พบ</th>
                        <th className="p-3 text-center w-[10%] font-semibold">ดูรายละเอียด</th>
                      </tr>
                    </thead>
                    {hasItems ? (
                      <tbody>
                        {currentItems.map((item) => (
                          <HistoryTableRow
                            key={getItemKey(item)}
                            item={item}
                            onViewDetail={handleViewDetail}
                            showActionColumn={true}
                            showRecorderInfo={false}
                            isAdmin={false}
                          />
                        ))}
                      </tbody>
                    ) : (
                      <tbody>
                        <tr>
                          <td colSpan="6" className="text-center text-gray-500 py-10">
                            ไม่พบข้อมูลตามตัวกรอง
                          </td>
                        </tr>
                      </tbody>
                    )}
                  </table>
                )}
              </div>
            </div>

            {!isLoading && !error && hasFilteredData && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                totalItems={filteredData.length}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHistory;