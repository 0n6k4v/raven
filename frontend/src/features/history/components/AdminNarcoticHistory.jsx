import React, { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiFilter, FiArrowLeft, FiChevronLeft, FiChevronRight, FiCamera, FiUpload } from 'react-icons/fi';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import FilterPopup from '../../../components/ui/FilterPopup';
import Loading from '../../../components/ui/Loading';
import ErrorDisplay from '../../../components/ui/ErrorDisplay';
import Pagination from '../../../components/ui/Pagination';
import HistoryCard from './HistoryCard';
import HistoryTableRow from './HistoryTableRow';
import FilterTags from '../../../components/ui/FilterTags';
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
// PRIVATE COMPONENTS - Modals
// ============================================================================

const ConfirmationModal = memo(({ isOpen, loading, title, message, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-2 mr-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
        </div>
        <div className="p-6 text-sm text-gray-500">{message}</div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md">ยกเลิก</button>
          <button 
            onClick={onConfirm} 
            disabled={loading} 
            className="px-4 py-2 text-sm font-medium text-white rounded-md bg-red-600 hover:bg-red-700 flex items-center min-w-[80px] justify-center"
          >
            {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : 'ลบ'}
          </button>
        </div>
      </div>
    </div>
  );
});

const StatusModal = memo(({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;
  const isError = type === 'error';
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${isError ? 'bg-red-100' : 'bg-green-100'} mb-4`}>
            {isError ? <AlertTriangle className="h-8 w-8 text-red-600" /> : <CheckCircle className="h-8 w-8 text-green-600" />}
          </div>
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <button onClick={onClose} className="w-full px-4 py-2 bg-[#b30000] text-white rounded-md">ตกลง</button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// PRESENTATION LAYER - Molecular Components
// ============================================================================

const NoDataView = memo(({ onClear }) => (
  <div className="flex flex-col items-center gap-3">
    <FiFilter size={48} className="opacity-10" />
    <p className="text-lg">ไม่พบรายการที่สอดคล้องกับการค้นหา</p>
    {onClear && <button onClick={onClear} className="text-[#b30000] underline text-sm">ล้างตัวกรองทั้งหมด</button>}
  </div>
));

const MobileHeader = memo(({ onBack, title }) => (
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

const AddActionButton = memo(({ onCamera, onUpload, onDirectAdd }) => {
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
            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 border-b border-gray-50"
          >
            <FiUpload className="text-red-800" /> อัปโหลดภาพ
          </button>
          {onDirectAdd && (
             <button 
                onClick={() => { onDirectAdd(); setIsOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
              >
                <FiPlus className="text-red-800" /> เพิ่มข้อมูลใหม่
              </button>
          )}
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
// PRESENTATION LAYER - Desktop Internal Components
// ============================================================================

const DesktopHeader = memo(({ title }) => (
  <div className="px-8 py-6 border-b border-gray-200 bg-white flex justify-between items-center">
    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
  </div>
));

const DesktopToolbar = memo(({ onFilterClick, filterLabels, onRemoveFilter, onAdd }) => (
  <div className="px-8 py-4 flex flex-col gap-4">
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FilterButton onClick={onFilterClick} />
        </div>
        <button 
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#b30000] text-white hover:bg-[#8e0000] transition-all active:scale-95 font-bold"
          onClick={onAdd}
        >
          <FiPlus size={20} />
          <span>เพิ่มประวัติใหม่</span>
        </button>
    </div>
    <FilterTags labels={filterLabels} onRemove={onRemoveFilter} />
  </div>
));

const DesktopTable = memo(({ isLoading, items, onView, onEdit, onDelete }) => (
  <div className="flex-grow overflow-auto custom-scrollbar">
    {isLoading ? (
      <div className="h-full flex items-center justify-center">
        <Loading message="กำลังจัดเตรียมข้อมูล..." />
      </div>
    ) : (
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 sticky top-0 z-10 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <th className="p-4 w-[12%] font-bold">วัน/เวลา</th>
            <th className="p-4 w-[10%] font-bold">หมวดหมู่</th>
            <th className="p-4 w-[10%] font-bold">รูปภาพ</th>
            <th className="p-4 w-[15%] font-bold">ชื่อวัตถุพยาน</th>
            <th className="p-4 w-[23%] font-bold">สถานที่</th>
            <th className="p-4 w-[15%] font-bold">ค้นพบโดย</th>
            <th className="p-4 w-[15%] text-center font-bold">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {items.length > 0 ? (
            items.map((item) => (
              <HistoryTableRow 
                key={item.key} 
                item={item} 
                onViewDetail={onView} 
                onEditItem={onEdit} 
                onDeleteItem={() => onDelete(item)} 
                showActionColumn={true}
                showRecorderInfo={true}
                isAdmin={true} 
              />
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-32 text-slate-400">
                <NoDataView onClear={null} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    )}
  </div>
));

// ============================================================================
// PRESENTATION LAYER - Organisms
// ============================================================================

const MobileView = memo(({ vm, handlers, paginationText }) => {
  const p = vm.pagination || {}; 
  
  return (
    <div className="md:hidden flex flex-col h-full bg-gray-50">
      <MobileHeader onBack={handlers.navigateBack} title="ประวัติยาเสพติด" />
      
      <div className="px-4 pt-4 flex justify-between items-center mb-2">
        <FilterButton onClick={() => vm.filter.setIsOpen(true)} />
        <AddActionButton 
          onCamera={handlers.handleCamera} 
          onUpload={handlers.handleUpload} 
          onDirectAdd={handlers.handleDirectAdd}
        />
      </div>

      <div className="px-4 mb-2">
        <FilterTags labels={vm.filter.labels} onRemove={(tag) => vm.filter.remove(tag.type, tag.value)} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {vm.isLoading ? (
          <div className="py-10"><Loading /></div>
        ) : vm.error ? (
          <ErrorDisplay message={vm.error} onRetry={() => vm.fetchHistoryData({ isNarcoticAdmin: true })} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {vm.currentItems && vm.currentItems.length > 0 ? (
              vm.currentItems.map((item) => (
                <HistoryCard
                  key={item.key}
                  item={item}
                  onViewDetail={handlers.handleViewDetail}
                  onEditItem={handlers.handleEditItem}
                  onDeleteItem={handlers.onDeleteRequest}
                  isAdmin={true}
                  showDiscoverer={true}
                  showModifier={true}
                />
              ))
            ) : <NoDataView onClear={vm.filter.clear} />}
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
            <div className="flex justify-end w-1/3 text-gray-600">
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

const DesktopView = memo(({ vm, handlers }) => (
  <div className="hidden md:flex flex-col h-full bg-slate-50">
    <DesktopHeader title="จัดการประวัติการพบวัตถุพยาน" />
    
    <DesktopToolbar 
      onFilterClick={() => vm.filter.setIsOpen(true)}
      filterLabels={vm.filter.labels}
      onRemoveFilter={(tag) => vm.filter.remove(tag.type, tag.value)}
      onAdd={handlers.handleDirectAdd} 
    />

    <div className="flex-1 px-8 pb-6 overflow-hidden flex flex-col">
      <div className="bg-white rounded-xl flex flex-col flex-grow overflow-hidden border border-slate-200">
        <DesktopTable 
          isLoading={vm.isLoading}
          items={vm.currentItems}
          onView={handlers.handleViewDetail}
          onEdit={handlers.handleEditItem}
          onDelete={handlers.onDeleteRequest}
        />
        
        {!vm.isLoading && vm.filteredData.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/50">
            <Pagination 
              {...vm.pagination}
              totalItems={vm.filteredData.length} 
            />
          </div>
        )}
      </div>
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminNarcoticHistory = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const h = useHistoryData(user);

  const [deleteState, setDeleteState] = useState({ isOpen: false, loading: false, item: null });
  const [statusState, setStatusState] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    if (h.fetchHistoryData) {
      h.fetchHistoryData({ isNarcoticAdmin: true });
    }
  }, [h.fetchHistoryData]);

  const handleViewDetail = useCallback((item) => {
    navigate('/history/detail', { state: { item } });
  }, [navigate]);

  const handleEditItem = useCallback((item) => {
    navigate(`/history/edit-narcotic/${item.id}`);
  }, [navigate]);

  const handleCamera = useCallback(() => navigate("/camera"), [navigate]);

  const handleUpload = useCallback(() => {
    FileService.openSelector((imageData) => {
      navigate("/imagePreview", {
        state: { imageData, sourcePath: "/history", fromCamera: false, uploadFromCameraPage: false },
      });
    });
  }, [navigate]);

  const handleDirectAdd = useCallback(() => navigate('/saveToHistory'), [navigate]);

  const onDeleteRequest = useCallback((item) => {
    setDeleteState({ isOpen: true, loading: false, item });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteState.item?.id) return;
    setDeleteState(prev => ({ ...prev, loading: true }));
    try {
      await HistoryService.delete(deleteState.item.id);

      if (h.fetchHistoryData) h.fetchHistoryData({ isNarcoticAdmin: true });
      
      setDeleteState({ isOpen: false, loading: false, item: null });
      setStatusState({ 
        isOpen: true, 
        type: 'success', 
        title: 'ลบสำเร็จ!', 
        message: 'ประวัติการค้นพบถูกลบเรียบร้อยแล้ว' 
      });
    } catch (err) {
      setDeleteState({ isOpen: false, loading: false, item: null });
      setStatusState({ 
        isOpen: true, 
        type: 'error', 
        title: 'เกิดข้อผิดพลาด', 
        message: err.message || 'ไม่สามารถลบข้อมูลได้ในขณะนี้' 
      });
    }
  }, [deleteState.item, h]);

  const paginationText = useMemo(() => 
    HistoryService.formatPaginationInfo(
      h.pagination?.indexOfFirstItem, 
      h.pagination?.indexOfLastItem, 
      h.filteredData?.length || 0
    ),
    [h.pagination?.indexOfFirstItem, h.pagination?.indexOfLastItem, h.filteredData]
  );

  const handlers = {
    handleViewDetail,
    handleEditItem,
    handleCamera,
    handleUpload,
    handleDirectAdd,
    onDeleteRequest,
    navigateBack: () => navigate(-1)
  };

  return (
    <div className="w-full h-full relative">
      <MobileView vm={h} handlers={handlers} paginationText={paginationText} />
      <DesktopView vm={h} handlers={handlers} />

      <FilterPopup 
        key={JSON.stringify(h.filter.current)}
        isOpen={h.filter.isOpen} 
        onClose={() => h.filter.setIsOpen(false)} 
        filters={h.filter.current} 
        onApplyFilters={h.filter.apply} 
        onClearFilters={h.filter.clear} 
      />

      <ConfirmationModal 
        isOpen={deleteState.isOpen}
        loading={deleteState.loading}
        title="ยืนยันการลบข้อมูล"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบประวัติ "${deleteState.item?.name || 'รายการนี้'}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        onClose={() => setDeleteState({ isOpen: false, loading: false, item: null })}
        onConfirm={confirmDelete}
      />
      
      <StatusModal 
        isOpen={statusState.isOpen}
        type={statusState.type}
        title={statusState.title}
        message={statusState.message}
        onClose={() => setStatusState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default memo(AdminNarcoticHistory);