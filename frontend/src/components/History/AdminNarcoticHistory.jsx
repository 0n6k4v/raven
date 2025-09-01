import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiFilter, FiArrowLeft, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import FilterPopup from '../common/FilterPopup';
import FilterTags from '../common/FilterTags';
import Popup from '../common/Popup';
import Loading from '../common/Loading';
import ErrorDisplay from '../common/ErrorDisplay';
import Pagination from '../common/Pagination';
import HistoryCard from './common/HistoryCard';
import HistoryTableRow from './common/HistoryTableRow';
import useNarcoticHistory from '../../hooks/api/History/useNarcoticHistory';

/* ========================= CONSTANTS ========================= */
const ROW_OPTIONS = [5, 10, 20];
const DEFAULT_ROWS = 10;
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

/* ========================= UTILS ========================= */
const buildLocationString = (item) => {
  const parts = [];
  if (item.subdistrict_name) parts.push(item.subdistrict_name);
  if (item.district_name) parts.push(item.district_name);
  if (item.province_name) parts.push(item.province_name);
  return parts.filter(Boolean).join(' ');
};

const mapNarcoticItem = (item) => {
  const narcotic = item.exhibit?.narcotic ?? null;
  let displayName = 'ไม่ระบุชื่อ';

  if (narcotic) {
    if (narcotic.drug_type && narcotic.drug_type !== 'Unknown') displayName = narcotic.drug_type;
    else if (item.exhibit?.subcategory && item.exhibit.subcategory !== 'Unknown') displayName = item.exhibit.subcategory;
    else if (narcotic.drug_category && narcotic.drug_category !== 'Unknown') displayName = narcotic.drug_category;
    else displayName = 'ยาเสพติดไม่ทราบชนิด';
  } else if (item.exhibit?.subcategory) {
    displayName = item.exhibit.subcategory;
  }

  return {
    id: item.id,
    name: displayName,
    category: item.exhibit?.category || 'ยาเสพติด',
    subcategory: item.exhibit?.subcategory || '',
    date: item.discovery_date,
    time: item.discovery_time,
    location: buildLocationString(item),
    latitude: item.latitude,
    longitude: item.longitude,
    image: item.photo_url,
    discoverer: item.discoverer_name || 'ไม่ระบุ',
    quantity: item.quantity || 1,
    description: item.exhibit?.narcotic?.characteristics || '',
    exhibit_id: item.exhibit_id,
    exhibit: item.exhibit,
    created_at: item.created_at,
    modified_at: item.modified_at,
    ai_confidence: item.ai_confidence,
    drug_type: item.exhibit?.narcotic?.drug_type,
    drug_category: item.exhibit?.narcotic?.drug_category,
    weight_grams: item.exhibit?.narcotic?.weight_grams,
    consumption_method: item.exhibit?.narcotic?.consumption_method,
    effect: item.exhibit?.narcotic?.effect,
  };
};

/* ========================= CUSTOM HOOKS ========================= */
const usePagination = (data = [], initialRows = DEFAULT_ROWS) => {
  const [rowsPerPage, setRowsPerPage] = useState(initialRows);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, data]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.length || 0) / rowsPerPage)), [data, rowsPerPage]);
  const indexOfFirstItem = (currentPage - 1) * rowsPerPage;
  const indexOfLastItem = Math.min(indexOfFirstItem + rowsPerPage, data.length);
  const currentItems = useMemo(() => (data || []).slice(indexOfFirstItem, indexOfLastItem), [data, indexOfFirstItem, indexOfLastItem]);

  return {
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    currentItems,
  };
};

const useModalState = (initial = { isOpen: false }) => {
  const [state, setState] = useState(initial);
  const open = useCallback((payload = {}) => setState((s) => ({ ...s, isOpen: true, ...payload })), []);
  const close = useCallback(() => setState((s) => ({ ...s, isOpen: false, loading: false })), []);
  return [state, open, close, setState];
};

/* ========================= PRESENTATIONAL SUB-COMPONENTS ========================= */
const ConfirmationModal = React.memo(({ state, onClose, onConfirm }) => {
  if (!state.isOpen) return null;
  const { title, message, type = 'warning', loading } = state;

  const getIconAndColor = () => {
    switch (type) {
      case 'danger':
        return { icon: <AlertTriangle className="h-6 w-6 text-red-600" />, bgColor: 'bg-red-100', buttonColor: 'bg-red-600 hover:bg-red-700' };
      case 'success':
        return { icon: <CheckCircle className="h-6 w-6 text-green-600" />, bgColor: 'bg-green-100', buttonColor: 'bg-green-600 hover:bg-green-700' };
      default:
        return { icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />, bgColor: 'bg-yellow-100', buttonColor: 'bg-red-600 hover:bg-red-700' };
    }
  };

  const { icon, bgColor, buttonColor } = getIconAndColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${bgColor} rounded-full p-2 mr-3`}>{icon}</div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500">{message}</p>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#990000] disabled:opacity-50">
            ยกเลิก
          </button>
          <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 ${buttonColor} inline-flex items-center`}>
            {loading && <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
            {loading ? 'กำลังลบ...' : 'ลบ'}
          </button>
        </div>
      </div>
    </div>
  );
});

const NotificationModal = React.memo(({ state, onClose }) => {
  if (!state.isOpen) return null;
  const { title, message, type = 'success' } = state;

  const getIconAndColor = () => {
    if (type === 'error') return { icon: <AlertTriangle className="h-8 w-8 text-red-600" />, bgColor: 'bg-red-100', titleColor: 'text-red-900', buttonColor: 'bg-red-600 hover:bg-red-700' };
    return { icon: <CheckCircle className="h-8 w-8 text-green-600" />, bgColor: 'bg-green-100', titleColor: 'text-green-900', buttonColor: 'bg-green-600 hover:bg-green-700' };
  };

  const { icon, bgColor, titleColor, buttonColor } = getIconAndColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${bgColor} mb-4`}>{icon}</div>
          <h3 className={`text-lg font-medium ${titleColor} mb-2`}>{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <button onClick={onClose} className={`w-full px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonColor}`}>ตกลง</button>
        </div>
      </div>
    </div>
  );
});

/* ========================= MAIN COMPONENT ========================= */
const AdminNarcoticHistory = () => {
  const navigate = useNavigate();
  const { histories, loading: isLoading, error, fetchNarcoticHistories } = useNarcoticHistory();
  const mapped = histories;

  const {
    rowsPerPage, setRowsPerPage, currentPage, setCurrentPage,
    totalPages, indexOfFirstItem, indexOfLastItem, currentItems,
  } = usePagination(mapped, DEFAULT_ROWS);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [popup, setPopup] = useState({ open: false, type: 'success', message: '' });
  const [popupCountdown, setPopupCountdown] = useState(0);

  const [confirmModal, openConfirm, closeConfirm, setConfirmModal] = useModalState({ isOpen: false, loading: false, title: '', message: '', historyId: null, historyName: '' });
  const [notificationModal, openNotification, closeNotification, setNotification] = useModalState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchNarcoticHistories();
        console.debug('fetchNarcoticHistories -> returned', Array.isArray(data) ? data.length : data);
      } catch (e) {
        console.debug('fetchNarcoticHistories failed', e);
      }
    })();
  }, [fetchNarcoticHistories]);

  useEffect(() => {
    console.groupCollapsed('AdminNarcoticHistory — fetched items');
    console.log('histories (hook):', histories);
    console.log('mapped (for UI):', mapped);
    console.log('currentItems (page):', currentItems);
    if (Array.isArray(mapped) && mapped.length) console.table(mapped.slice(0, 20));
    console.groupEnd();
  }, [histories, mapped, currentItems]);
  
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [mapped.length, totalPages]);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setIsFilterOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleDeleteHistory = useCallback(async (historyId) => {
    setConfirmModal((s) => ({ ...s, loading: true }));
    try {
      const resp = await fetch(`${BASE_URL}/history/${historyId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (resp.ok) {
        await fetchNarcoticHistories();
        setConfirmModal({ isOpen: false, loading: false, historyId: null, historyName: '' });
        setNotification({ isOpen: true, type: 'success', title: 'ลบสำเร็จ!', message: 'ประวัติการค้นพบถูกลบเรียบร้อยแล้ว' });
      } else {
        let msg = `HTTP error! status: ${resp.status}`;
        try {
          const body = await resp.json();
          if (body?.detail) msg = body.detail;
          else if (body?.message) msg = body.message;
        } catch (e) { /* ignore json parse errors */ }
        throw new Error(msg);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setConfirmModal({ isOpen: false, loading: false, historyId: null, historyName: '' });
      setNotification({ isOpen: true, type: 'error', title: 'เกิดข้อผิดพลาด', message: `ไม่สามารถลบได้: ${err.message}` });
    }
  }, [fetchNarcoticHistories]);

  const handleViewDetail = useCallback((item) => navigate('/history/detail', { state: { item } }), [navigate]);
  const handleEditItem = useCallback((item) => navigate(`/history/edit-narcotic/${item.id}`), [navigate]);

  const openDeleteModal = useCallback((item) => openConfirm({ isOpen: true, historyId: item.id, historyName: item.name, title: 'ยืนยันการลบ', message: `คุณแน่ใจหรือไม่ว่าต้องการลบประวัติ "${item.name}"? การกระทำนี้ไม่สามารถยกเลิกได้`, type: 'danger', loading: false }), [openConfirm]);

  return (
    <div className="w-full h-full">
      <Popup open={popup.open} type={popup.type} message={popup.message} countdown={popupCountdown} onClose={() => setPopup({ ...popup, open: false })} />

      {/* Mobile header */}
      <div className="md:hidden">
        <div className="px-4 py-3 flex items-center justify-center relative shadow-[0_1.5px_4px_rgba(0,0,0,0.2)]">
          <button className="absolute left-4" onClick={() => navigate(-1)}><FiArrowLeft size={24} /></button>
          <h1 className="text-lg font-bold text-center flex-1">ประวัติการพบวัตถุพยาน - ยาเสพติด</h1>
        </div>

        <div className="px-4 sm:px-6 pt-4 flex justify-between items-center mb-4">
          <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded bg-white hover:bg-gray-100 text-sm"><FiFilter size={16} /> ตัวกรอง</button>
          <button className="flex items-center gap-1 px-2 py-2 rounded bg-[#b30000] text-white hover:bg-[#990000]" onClick={() => navigate('/saveToHistory')}><FiPlus size={16} /></button>
        </div>

        <FilterPopup isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} onFilterChange={() => {}} onApplyFilters={handleApplyFilters} onClearFilters={handleClearFilters} />
        <FilterTags labels={[]} onRemove={() => {}} />

        {isLoading ? <Loading /> : error ? <ErrorDisplay message={error} onRetry={fetchNarcoticHistories} /> : (
          <div className="pr-4 pb-32 pl-4 grid grid-cols-1 gap-4">
            {currentItems.length > 0 ? currentItems.map((item) => (
              <HistoryCard key={item.id || `${item.name}-${item.date}`} item={item} onViewDetail={handleViewDetail} onEditItem={handleEditItem} onDeleteItem={openDeleteModal} isAdmin />
            )) : <div className="text-center text-gray-500 py-10 col-span-1">ไม่พบข้อมูลยาเสพติด</div>}
          </div>
        )}

        {!isLoading && !error && mapped.length > 0 && (
          <div className="fixed bottom-16 left-0 right-0 bg-white shadow-md p-2 flex flex-col border-t border-gray-200">
            <div className="flex justify-between items-center pt-1">
              <div className="text-gray-600 text-xs sm:text-sm pl-2">{indexOfFirstItem + 1}-{indexOfLastItem} จาก {mapped.length}</div>
              <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                <span className="mr-1 sm:mr-2">แถว:</span>
                <select className="bg-transparent border border-gray-200 rounded px-1 sm:px-2 py-1 text-gray-600 text-xs sm:text-sm focus:outline-none cursor-pointer" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                  {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 pr-2">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}><FiChevronLeft size={18} /></button>
                <span className="font-medium text-xs sm:text-sm">{currentPage}/{totalPages}</span>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}><FiChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block h-full">
        <div className="h-full w-full flex flex-col overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center flex-shrink-0">
            <h1 className="text-xl font-bold">ประวัติการพบวัตถุพยาน - ยาเสพติด</h1>
          </div>

          <div className="px-6 flex justify-between items-center mb-4 flex-shrink-0">
            <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded bg-white hover:bg-gray-100"><FiFilter size={18} /> ตัวกรอง</button>
            <button className="flex items-center gap-2 px-4 py-2 rounded bg-[#b30000] text-white hover:bg-[#990000]" onClick={() => navigate('/saveToHistory')}><FiPlus size={18} /><b> เพิ่มประวัติการค้นพบ</b></button>
          </div>

          <FilterPopup isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} onFilterChange={() => {}} onApplyFilters={handleApplyFilters} onClearFilters={handleClearFilters} />
          <FilterTags labels={[]} onRemove={() => {}} />

          <div className="px-6 pb-6 flex flex-col flex-grow overflow-hidden">
            <div className="bg-white rounded shadow-md flex flex-col flex-grow overflow-hidden">
              <div className="flex-grow overflow-auto">
                {isLoading ? <Loading /> : error ? <ErrorDisplay message={error} onRetry={fetchNarcoticHistories} /> : (
                  <table className="w-full table-fixed border-collapse">
                    <thead>
                      <tr className="bg-gray-200 sticky top-0 z-10">
                        <th className="p-3 text-left w-[15%] font-semibold">วัน/เดือน/ปี</th>
                        <th className="p-3 text-left w-[15%] font-semibold">หมวดหมู่</th>
                        <th className="p-3 text-left w-[10%] font-semibold">รูปภาพ</th>
                        <th className="p-3 text-left w-[20%] font-semibold">ชื่อ</th>
                        <th className="p-3 text-left w-[25%] font-semibold">สถานที่พบ</th>
                        <th className="p-3 text-center w-[15%] font-semibold">การจัดการ</th>
                      </tr>
                    </thead>
                    {currentItems.length > 0 ? (
                      <tbody>
                        {currentItems.map((item) => (
                          <HistoryTableRow key={item.id || `${item.name}-${item.date}`} item={item} onViewDetail={handleViewDetail} onEditItem={handleEditItem} onDeleteItem={openDeleteModal} showActionColumn showRecorderInfo={false} isAdmin />
                        ))}
                      </tbody>
                    ) : (
                      <tbody>
                        <tr>
                          <td colSpan="6" className="text-center text-gray-500 py-10">ไม่พบข้อมูลยาเสพติด</td>
                        </tr>
                      </tbody>
                    )}
                  </table>
                )}
              </div>
            </div>

            {!isLoading && !error && mapped.length > 0 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => setRowsPerPage(Number(e.target.value))} totalItems={mapped.length} indexOfFirstItem={indexOfFirstItem} indexOfLastItem={indexOfLastItem} />
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal state={confirmModal} onClose={closeConfirm} onConfirm={() => handleDeleteHistory(confirmModal.historyId)} />
      <NotificationModal state={notificationModal} onClose={closeNotification} />
    </div>
  );
};

export default React.memo(AdminNarcoticHistory);