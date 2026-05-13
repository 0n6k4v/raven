import React, { useEffect, useCallback, useMemo, useState, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiArrowLeft, FiChevronLeft, FiChevronRight, FiPlus, FiCamera, FiUpload } from "react-icons/fi";
import FilterPopup from '../../../components/ui/FilterPopup';
import FilterTags from '../../../components/ui/FilterTags';
import Popup from '../../../components/ui/Popup';
import Loading from '../../../components/ui/Loading';
import ErrorDisplay from '../../../components/ui/ErrorDisplay';
import Pagination from '../../../components/ui/Pagination';
import HistoryCard from './HistoryCard';
import HistoryTableRow from './HistoryTableRow';
import { useHistoryData } from '../hooks';
import { useUser } from '../../auth';
import { HistoryService } from '../services';

// ============================================================================
// DOMAIN LAYER - Services & Logic
// ============================================================================

class FileService {
  static openSelector(callback) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => callback(event.target.result);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useUserHistoryViewModel() {
  const navigate = useNavigate();
  const { user } = useUser();

  const { filter, ...history } = useHistoryData(user);
  
  const [tempFilters, setTempFilters] = useState(history.filters ?? {});

  useEffect(() => {
    setTempFilters(history.filters ?? {});
  }, [history.filters]);

  useEffect(() => {
    if (user && user.userId && history.fetchHistoryData) {
      history.fetchHistoryData({ userId: user.userId });
    }
  }, [user, history.fetchHistoryData]);

  const handleViewDetail = useCallback((item) => {
    navigate('/history/detail', { state: { item } });
  }, [navigate]);

  const handleCamera = useCallback(() => {
    navigate("/camera");
  }, [navigate]);

  const handleUpload = useCallback(() => {
    FileService.openSelector((imageData) => {
      navigate("/imagePreview", {
        state: { 
          imageData, 
          sourcePath: "/history",
          fromCamera: false, 
          uploadFromCameraPage: false 
        },
      });
    });
  }, [navigate]);

  const onApplyFilters = useCallback(() => {
    filter.apply(tempFilters);
    filter.setIsOpen(false); 
  }, [filter, tempFilters]);

  const onClearFilters = useCallback(() => {
    filter.clear();
    setTempFilters({});
  }, [filter]);

  const onRemoveFilter = useCallback((filterObj) => {
    if (filterObj?.type && filterObj?.value !== undefined) {
      filter.remove(filterObj.type, filterObj.value);
    }
  }, [filter]);

  const onPopupClose = useCallback(() => {
    history.setPopup(prev => ({ ...prev, open: false }));
  }, [history.setPopup]);

  return {
    ...history,
    setIsFilterOpen: filter.setIsOpen, 
    isFilterOpen: filter.isOpen,       
    getFilterLabels: () => filter.labels, 
    tempFilters,
    handlers: {
      handleViewDetail,
      handleCamera,
      handleUpload,
      onFilterChange: setTempFilters,
      onApplyFilters,
      onClearFilters,
      onRemoveFilter,
      onPopupClose,
      navigateBack: () => navigate(-1)
    }
  };
}

// ============================================================================
// PRESENTATION LAYER - Components
// ============================================================================

const NoDataView = memo(() => (
  <div className="text-center text-gray-500 py-10 col-span-1 border border-dashed border-gray-300 rounded-lg bg-gray-50">
    ไม่พบข้อมูลตามตัวกรอง
  </div>
));

const MobileHeader = memo(({ onBack, title = "ประวัติการพบวัตถุพยาน" }) => (
  <div className="px-4 py-3 flex items-center justify-center relative border-b border-gray-200 bg-white sticky top-0 z-20">
    <button className="absolute left-4 p-1 rounded-full hover:bg-gray-100" onClick={onBack}>
      <FiArrowLeft size={24} className="text-gray-600" />
    </button>
    <h1 className="text-lg font-bold text-center flex-1 text-gray-800">{title}</h1>
  </div>
));

const FilterButton = memo(({ onClick }) => (
  <button 
    onClick={onClick} 
    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
  >
    <FiFilter size={16} /> ตัวกรอง
  </button>
));

const AddActionButton = memo(({ onCamera, onUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-800 text-white hover:bg-red-900 transition-colors shadow-sm"
      >
        <FiPlus size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
          <button 
            onClick={() => { onCamera(); setIsOpen(false); }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 border-b border-gray-50"
          >
            <FiCamera className="text-red-800" /> ถ่ายภาพ
          </button>
          <button 
            onClick={() => { onUpload(); setIsOpen(false); }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
          >
            <FiUpload className="text-red-800" /> อัปโหลดภาพ
          </button>
        </div>
      )}
    </div>
  );
});

const PaginationControls = memo(({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center gap-1 sm:gap-2">
    <button 
      onClick={() => onPageChange(currentPage - 1)} 
      disabled={currentPage === 1} 
      className={`p-1.5 rounded-md ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"}`}
    >
      <FiChevronLeft size={18} />
    </button>
    <span className="font-medium text-xs sm:text-sm text-gray-700 min-w-[3rem] text-center">
      {currentPage} / {totalPages}
    </span>
    <button 
      onClick={() => onPageChange(currentPage + 1)} 
      disabled={currentPage === totalPages} 
      className={`p-1.5 rounded-md ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"}`}
    >
      <FiChevronRight size={18} />
    </button>
  </div>
));

// ============================================================================
// PRESENTATION LAYER - Organisms
// ============================================================================

const MobileView = memo(({ vm, paginationText }) => {
  const { handlers } = vm;
  const p = vm.pagination || {}; 
  
  return (
    <div className="md:hidden flex flex-col h-full bg-gray-50">
      <MobileHeader onBack={handlers.navigateBack} />
      
      <div className="px-4 pt-4 flex justify-between items-center mb-2">
        <FilterButton onClick={() => vm.setIsFilterOpen(true)} />
        <AddActionButton onCamera={handlers.handleCamera} onUpload={handlers.handleUpload} />
      </div>

      <div className="px-4 mb-2">
        <FilterTags labels={vm.getFilterLabels()} onRemove={handlers.onRemoveFilter} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {vm.isLoading ? (
          <div className="py-10"><Loading /></div>
        ) : vm.error ? (
          <ErrorDisplay message={vm.error} onRetry={() => vm.fetchHistoryData()} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {vm.currentItems && vm.currentItems.length > 0 ? (
              vm.currentItems.map((item) => (
                <HistoryCard
                  key={item.key}
                  item={item}
                  onViewDetail={handlers.handleViewDetail}
                  isAdmin={false}
                  showDiscoverer={true}
                  showModifier={true}
                />
              ))
            ) : <NoDataView />}
          </div>
        )}
      </div>

      {!vm.isLoading && !vm.error && vm.filteredData?.length > 0 && (
        <div className="bg-white p-3 border-t border-gray-200 z-10">
          <div className="flex justify-between items-center mx-auto">
            <div className="text-gray-500 text-xs w-1/3 truncate">{paginationText}</div>
            <div className="flex justify-center w-1/3">
              <select 
                value={p.rowsPerPage} 
                onChange={p.handleRowsPerPageChange}
                className="text-xs border-gray-300 rounded-md py-1 pl-2 pr-6 focus:ring-red-800 focus:border-red-800 bg-white"
              >
                {[10, 20, 50, 100].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end w-1/3">
              <PaginationControls 
                currentPage={p.currentPage} 
                totalPages={p.totalPages} 
                onPageChange={p.handlePageChange} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const DesktopView = memo(({ vm }) => {
  const { handlers } = vm;

  return (
    <div className="hidden md:flex flex-col h-full bg-gray-50">
      <div className="px-8 py-6 border-b border-gray-200 bg-white flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">ประวัติการพบวัตถุพยาน</h1>
      </div>

      <div className="px-8 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <FilterButton onClick={() => vm.setIsFilterOpen(true)} />
           </div>
           <AddActionButton onCamera={handlers.handleCamera} onUpload={handlers.handleUpload} />
        </div>
        <FilterTags labels={vm.getFilterLabels()} onRemove={handlers.onRemoveFilter} />
      </div>

      <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-auto custom-scrollbar">
            {vm.isLoading ? (
              <div className="h-full flex items-center justify-center"><Loading message="กำลังจัดเตรียมข้อมูล..." /></div>
            ) : vm.error ? (
              <div className="h-full flex items-center justify-center"><ErrorDisplay message={vm.error} onRetry={() => vm.fetchHistoryData()} /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                  <tr className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="p-4 w-[15%]">วัน/เดือน/ปี</th>
                    <th className="p-4 w-[12%]">หมวดหมู่</th>
                    <th className="p-4 w-[10%]">รูปภาพ</th>
                    <th className="p-4 w-[20%]">ชื่อวัตถุพยาน</th>
                    <th className="p-4 w-[28%]">สถานที่พบบริเวณ</th>
                    <th className="p-4 w-[15%] text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {vm.currentItems && vm.currentItems.length > 0 ? (
                    vm.currentItems.map((item) => (
                      <HistoryTableRow
                        key={item.key}
                        item={item}
                        onViewDetail={handlers.handleViewDetail}
                        showActionColumn={true}
                        showRecorderInfo={false}
                        isAdmin={false}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-32 text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                           <FiFilter size={48} className="opacity-10" />
                           <p className="text-lg font-medium">ไม่พบรายการที่สอดคล้องกับการค้นหา</p>
                           <button onClick={handlers.onClearFilters} className="text-red-800 underline text-sm hover:text-red-900">ล้างตัวกรองทั้งหมด</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!vm.isLoading && !vm.error && vm.filteredData?.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/50">
              <Pagination
                currentPage={vm.pagination?.currentPage}
                totalPages={vm.pagination?.totalPages}
                onPageChange={vm.pagination?.handlePageChange}
                rowsPerPage={vm.pagination?.rowsPerPage}
                onRowsPerPageChange={vm.pagination?.handleRowsPerPageChange}
                totalItems={vm.filteredData.length}
                indexOfFirstItem={vm.pagination?.indexOfFirstItem}
                indexOfLastItem={vm.pagination?.indexOfLastItem}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const UserHistory = () => {
  const vm = useUserHistoryViewModel();
  const { handlers } = vm;

  const paginationText = useMemo(() => 
    HistoryService.formatPaginationInfo(
      vm.pagination?.indexOfFirstItem, 
      vm.pagination?.indexOfLastItem, 
      vm.filteredData?.length || 0
    ),
    [vm.pagination?.indexOfFirstItem, vm.pagination?.indexOfLastItem, vm.filteredData]
  );

  return (
    <div className="w-full h-full relative">
      <Popup
        open={vm.popup.open}
        type={vm.popup.type}
        message={vm.popup.message}
        countdown={vm.popup.countdown}
        onClose={handlers.onPopupClose}
      />

      <FilterPopup
        isOpen={vm.isFilterOpen}
        onClose={() => vm.setIsFilterOpen(false)}
        filters={vm.tempFilters}
        onFilterChange={handlers.onFilterChange}
        onApplyFilters={handlers.onApplyFilters}
        onClearFilters={handlers.onClearFilters}
      />

      <MobileView vm={vm} paginationText={paginationText} />
      <DesktopView vm={vm} />
    </div>
  );
};

export default UserHistory;