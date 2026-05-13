import React, { useEffect, useCallback, memo } from "react";
import { FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { TbHistory } from "react-icons/tb";
import { PiImageBroken } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../auth";
import { useHistoryData } from "../hooks";
import { useLocationOptions } from "../../location/hooks";
import FilterPopup from "../../../components/ui/FilterPopup";
import FilterTags from "../../../components/ui/FilterTags";
import Loading from "../../../components/ui/Loading";
import ErrorDisplay from "../../../components/ui/ErrorDisplay";
import Pagination from "../../../components/ui/Pagination";
import HistoryCard from "./HistoryCard";
import HistoryTableRow from './HistoryTableRow';

// ============================================================================
// PRESENTATION LAYER - Atoms & Molecules
// ============================================================================

const NoImageDisplay = memo(() => (
  <div className="w-12 h-12 bg-gray-100 rounded flex flex-col items-center justify-center text-gray-400 border border-gray-200">
    <PiImageBroken size={20} />
    <span className="text-[8px] mt-0.5">ไม่มีรูป</span>
  </div>
));

const EmptyHistoryView = memo(({ user, evidence }) => {
  const category = evidence?.category || evidence?.exhibit?.category;
  let title = "ยังไม่มีการบันทึกประวัติของวัตถุพยานนี้";
  let description = "ยังไม่มีใครบันทึกประวัติการพบเห็นวัตถุพยานชิ้นนี้ในระบบ";

  if (user?.roleId === 2 && user?.department === "กลุ่มงานอาวุธปืน") {
    if (category === "ปืน" || category === "อาวุธปืน") title = "ยังไม่มีการบันทึกประวัติของปืนนี้";
    else description = "คุณยังไม่เคยบันทึกประวัติการพบเห็นวัตถุพยานชิ้นนี้ในระบบ";
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-gray-50 p-8 rounded-xl border border-gray-300 max-w-md flex flex-col items-center">
        <TbHistory className="text-gray-500 text-6xl mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
      </div>
    </div>
  );
});

// ============================================================================
// PRESENTATION LAYER - Organisms
// ============================================================================

const MobileHistoryView = memo(({ vm, locationOptions, onViewDetail }) => (
  <div className="md:hidden">
    <div className="px-4 pt-4 flex justify-between items-center mb-4">
      <button 
        onClick={() => vm.filter.setIsOpen(true)} 
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white text-sm hover:bg-gray-50"
      >
        <FiFilter size={16} /> ตัวกรอง
      </button>
    </div>

    <FilterPopup 
      isOpen={vm.filter.isOpen} 
      onClose={() => vm.filter.setIsOpen(false)} 
      filters={vm.filter.current} 
      onApplyFilters={vm.filter.apply} 
      onClearFilters={vm.filter.clear}
      preloadedData={locationOptions}
    />

    <FilterTags 
      labels={vm.filter.labels} 
      onRemove={(key) => vm.filter.remove(key === 'dateRange' ? 'date' : 'location', key)} 
    />

    <div className="px-4 pb-32 grid grid-cols-1 gap-4">
      {vm.currentItems.length > 0 ? (
        vm.currentItems.map((item) => (
          <HistoryCard 
            key={item.key} 
            item={item} 
            onViewDetail={() => onViewDetail(item)} 
            showDiscoverer 
            showModifier 
          />
        ))
      ) : <div className="text-center text-gray-600 py-10">ไม่พบข้อมูล</div>}
    </div>

    {vm.filteredData.length > 0 && (
      <div className="fixed bottom-[74px] left-0 right-0 bg-white p-2 flex flex-col border-t border-b border-gray-300 z-20">
        <div className="flex justify-between items-center px-2">
          <div className="text-gray-900 text-xs">
            {vm.pagination.indexOfFirstItem + 1}-{Math.min(vm.pagination.indexOfLastItem, vm.filteredData.length)} จาก {vm.filteredData.length}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => vm.pagination.handlePageChange(vm.pagination.currentPage - 1)} 
              disabled={vm.pagination.currentPage === 1} 
              className="p-1 disabled:text-gray-300"
            >
              <FiChevronLeft size={18} />
            </button>
            <span className="text-xs font-medium">{vm.pagination.currentPage}/{vm.pagination.totalPages}</span>
            <button 
              onClick={() => vm.pagination.handlePageChange(vm.pagination.currentPage + 1)} 
              disabled={vm.pagination.currentPage === vm.pagination.totalPages} 
              className="p-1 disabled:text-gray-300"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
));

const DesktopHistoryView = memo(({ vm, onViewDetail }) => (
  <div className="hidden md:block h-full">
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="px-6 pt-4 mb-4">
        <button 
          onClick={() => vm.filter.setIsOpen(true)} 
          className="flex items-center gap-2 px-4 py-2 border rounded bg-white hover:bg-gray-100 transition-colors"
        >
          <FiFilter size={18} /> ตัวกรอง
        </button>
      </div>

      <FilterTags 
        labels={vm.filter.labels} 
        onRemove={(key) => vm.filter.remove(key === 'dateRange' ? 'date' : 'location', key)} 
      />

      <div className="px-6 pb-6 h-[65vh] flex flex-col flex-grow overflow-hidden">
        <div className="bg-white rounded shadow-md flex flex-col flex-grow overflow-hidden border border-gray-200">
          <div className="flex-grow overflow-auto">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-left w-[12%] font-semibold text-gray-700">วัน/เดือน/ปี</th>
                  <th className="p-3 text-left w-[10%] font-semibold text-gray-700">หมวดหมู่</th>
                  <th className="p-3 text-left w-[8%] font-semibold text-gray-700">รูปภาพ</th>
                  <th className="p-3 text-left w-[15%] font-semibold text-gray-700">ชื่อ</th>
                  <th className="p-3 text-left w-[20%] font-semibold text-gray-700">สถานที่พบ</th>
                  <th className="p-3 text-left w-[15%] font-semibold text-gray-700">ผู้บันทึก/แก้ไข</th>
                  <th className="p-3 text-left w-[10%] font-semibold text-gray-700">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vm.currentItems.length > 0 ? (
                  vm.currentItems.map((item) => (
                    <HistoryTableRow 
                      key={item.key} 
                      item={item} 
                      onViewDetail={() => onViewDetail(item)} 
                      showActionColumn 
                      showRecorderInfo 
                      NoImageComponent={NoImageDisplay} 
                    />
                  ))
                ) : (
                  <tr><td colSpan="7" className="text-center text-gray-500 py-12">ไม่พบข้อมูลตามเงื่อนไขที่กำหนด</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {vm.filteredData.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Pagination 
                {...vm.pagination}
                totalItems={vm.filteredData.length} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const History = ({ evidence, currentUser: propCurrentUser }) => {
  const navigate = useNavigate();
  const { user } = useUser();

  const vm = useHistoryData(user, evidence);
  const locationOptions = useLocationOptions();

  useEffect(() => {
    vm.fetchHistoryData();
    return () => vm.abortFetch();
  }, [vm.fetchHistoryData, vm.abortFetch]);

  const handleViewDetail = useCallback((item) => {
    navigate('/history/detail', { 
      state: { item: item } 
    });
  }, [navigate]);

  if (vm.isLoading) return <Loading message="กำลังโหลดประวัติ..." />;
  if (vm.error === "empty") return <EmptyHistoryView user={user} evidence={evidence} />;
  if (vm.error) return <ErrorDisplay message={vm.error} onRetry={vm.fetchHistoryData} />;

  return (
    <div className='flex-1 overflow-auto bg-white'>
      <MobileHistoryView 
        vm={vm} 
        locationOptions={locationOptions} 
        onViewDetail={handleViewDetail} 
      />
      <DesktopHistoryView 
        vm={vm} 
        onViewDetail={handleViewDetail} 
      />
    </div>
  );
};

export default memo(History);