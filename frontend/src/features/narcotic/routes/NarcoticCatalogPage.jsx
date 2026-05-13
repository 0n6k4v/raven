import React, { useState, useEffect, useCallback, useMemo, useReducer, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { FiPlus, FiArrowLeft, FiChevronLeft, FiChevronRight, FiMoreVertical } from 'react-icons/fi';
import { PiImageBroken } from "react-icons/pi";
import Pagination from '../../../components/ui/Pagination';
import Loading from '../../../components/ui/Loading';
import { NarcoticService } from '../services';
import { NarcoticMapper } from '../utils';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class NarcoticDeleteRequest {
  constructor(id) {
    this.id = id;
  }
  toParams() {
    return this.id;
  }
}

class PaginationCalculator {
  static calculateText(first, last, total) {
    const safeTotal = total || 0;
    const safeFirst = safeTotal === 0 ? 0 : first + 1;
    return `${safeFirst}-${Math.min(last, safeTotal)} จาก ${safeTotal}`;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useNarcoticCollection = () => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });

  const fetchData = useCallback(async () => {
    setStatus({ loading: true, error: null });
    const controller = new AbortController();
    try {
      const result = await NarcoticService.fetchAll(controller.signal);
      setData(Array.isArray(result) ? result : []);
      setStatus({ loading: false, error: null });
    } catch (err) {
      if (err.name !== 'AbortError') setStatus({ loading: false, error: err.message });
    }
    return () => controller.abort();
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const removeLocally = useCallback((id) => {
    setData(prev => prev.filter(item => item.id !== id));
  }, []);

  return { narcotics: data, ...status, refetch: fetchData, removeLocally };
};

const usePagination = (items, initialPerPage = 10) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);

  const totalItems = items?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  
  useEffect(() => { 
    if (page > totalPages && totalPages > 0) setPage(totalPages); 
  }, [totalItems, perPage, page, totalPages]);

  const currentItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    const start = (page - 1) * perPage;
    return safeItems.slice(start, start + perPage);
  }, [items, page, perPage]);

  const indexOfFirstItem = (page - 1) * perPage;
  const indexOfLastItem = page * perPage;

  const goToPage = useCallback((p) => { 
    setPage(p); 
    window.scrollTo(0, 0); 
  }, []);

  const changePerPage = useCallback((e) => { 
    setPerPage(Number(e.target.value)); 
    setPage(1); 
  }, []);

  return { page, perPage, totalPages, currentItems, indexOfFirstItem, indexOfLastItem, goToPage, changePerPage };
};

const useDeleteWorkflow = (onSuccess) => {
  const [state, dispatch] = useReducer((s, a) => {
    switch (a.type) {
      case 'CONFIRM_OPEN': return { ...s, confirm: { isOpen: true, id: a.id, loading: false } };
      case 'CONFIRM_CLOSE': return { ...s, confirm: { ...s.confirm, isOpen: false, id: null } };
      case 'CONFIRM_LOADING': return { ...s, confirm: { ...s.confirm, loading: a.loading } };
      case 'NOTIFY_OPEN': return { ...s, notification: { isOpen: true, ...a.payload } };
      case 'NOTIFY_CLOSE': return { ...s, notification: { ...s.notification, isOpen: false } };
      default: return s;
    }
  }, {
    confirm: { isOpen: false, id: null, loading: false },
    notification: { isOpen: false, type: 'success', title: '', message: '' }
  });

  const requestDelete = useCallback((id) => dispatch({ type: 'CONFIRM_OPEN', id }), []);
  
  const executeDelete = useCallback(async () => {
    const id = state.confirm.id;
    if (!id) return;
    const request = new NarcoticDeleteRequest(id);
    dispatch({ type: 'CONFIRM_LOADING', loading: true });
    try {
      await NarcoticService.delete(request.toParams());
      onSuccess(id);
      dispatch({ type: 'CONFIRM_CLOSE' });
      dispatch({ type: 'NOTIFY_OPEN', payload: { type: 'success', title: 'ลบสำเร็จ!', message: 'รายการถูกลบแล้ว' } });
    } catch (err) {
      dispatch({ type: 'CONFIRM_CLOSE' });
      dispatch({ type: 'NOTIFY_OPEN', payload: { type: 'error', title: 'ผิดพลาด!', message: err.message } });
    }
  }, [state.confirm.id, onSuccess]);

  return { state, requestDelete, executeDelete, 
           closeConfirm: () => dispatch({ type: 'CONFIRM_CLOSE' }), 
           closeNotify: () => dispatch({ type: 'NOTIFY_CLOSE' }) };
};

const useDropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const toggle = useCallback((e) => { e.stopPropagation(); setIsOpen(prev => !prev); }, []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) close();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  return { isOpen, toggle, close, menuRef };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const ImageThumbnail = memo(({ src, alt, small }) => {
  const [err, setErr] = useState(false);
  const sizeClass = small ? 'w-16 h-12' : 'w-24 h-24';
  
  if (!src || err) return (
    <div className={`${sizeClass} flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-slate-200`}>
      <PiImageBroken className={`text-gray-400 ${small ? 'text-lg' : 'text-2xl'}`} />
    </div>
  );

  return (
    <div className={`${sizeClass} bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner`}>
      <img src={src} alt={alt} className="w-full h-full object-contain" onError={() => setErr(true)} />
    </div>
  );
});

const IconButton = memo(({ onClick, icon: Icon, colorClass, label }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }} 
    className={`p-1.5 rounded transition-colors ${colorClass}`} 
    aria-label={label} 
    title={label}
  >
    <Icon size={18} />
  </button>
));

const WorkflowModal = memo(({ isOpen, onClose, title, message, type, confirmText, onConfirm, loading }) => {
  if (!isOpen) return null;
  const isDanger = type === 'danger';
  const Icon = isDanger || type === 'error' ? AlertTriangle : CheckCircle;
  const colorClass = isDanger || type === 'error' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-sm overflow-hidden transform animate-in zoom-in duration-200">
        <div className="p-6">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${colorClass} mb-4`}>
            <Icon size={24} />
          </div>
          <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-center text-gray-500">{message}</p>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            {onConfirm ? 'ยกเลิก' : 'ตกลง'}
          </button>
          {onConfirm && (
            <button 
              onClick={onConfirm} 
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

const NoDataView = memo(() => (
  <div className="flex flex-col items-center gap-3 py-20">
    <PiImageBroken size={48} className="opacity-10" />
    <p className="text-lg text-gray-500">ยังไม่มีข้อมูลยาเสพติดในระบบ</p>
  </div>
));

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
// PRESENTATION LAYER - Molecular Components
// ============================================================================

const AdminActionMenu = memo(({ isOpen, onEdit, onDelete }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 border-b border-gray-50"
      >
        <Edit3 size={16} className="text-amber-600" /> แก้ไข
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600"
      >
        <Trash2 size={16} className="text-red-600" /> ลบ
      </button>
    </div>
  );
});

const NarcoticCatalogCard = memo(({ data, onEdit, onDelete }) => {
  const { isOpen, toggle, menuRef, close } = useDropdownMenu();

  return (
    <article className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-200">
      <div className="p-4">
        <header className="flex justify-between items-start mb-3">
          <h3 className="text-md font-bold text-red-900">{data.drug_form.name}</h3>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={toggle}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="ตัวเลือกเพิ่มเติม"
            >
              <FiMoreVertical size={20} />
            </button>
            <AdminActionMenu 
              isOpen={isOpen} 
              onEdit={() => { onEdit(data.id); close(); }} 
              onDelete={() => { onDelete(data.id); close(); }} 
            />
          </div>
        </header>

        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <ImageThumbnail src={data.imageUrl} alt={data.drug_type} />
          </div>

          <div className="flex flex-col justify-between flex-1 min-w-0">
            <div>
              <h4 className="font-bold text-sm mb-1 line-clamp-2 text-slate-800">{data.drug_type}</h4>
              <div className="space-y-1">
                <div className="flex items-start text-xs text-gray-500">
                  <span className="font-semibold min-w-[50px]">ลักษณะ:</span>
                  <span className="line-clamp-1">{data.characteristics}</span>
                </div>
                <div className="flex items-start text-xs text-gray-500">
                  <span className="font-semibold min-w-[50px]">วิธีเสพ:</span>
                  <span className="line-clamp-1">
                    {NarcoticMapper.mapConsumptionMethods(data.consumption_method)}
                  </span>
                </div>
                <div className="flex items-start text-xs text-gray-500">
                  <span className="font-semibold min-w-[50px]">น้ำหนัก:</span>
                  <span>{data.weight_grams ? `${data.weight_grams}g` : '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

// ============================================================================
// PRESENTATION LAYER - Layouts
// ============================================================================

const MobileViewLayout = memo(({ items, handlers, pagination, paginationText }) => (
  <div className="md:hidden flex flex-col h-full bg-gray-50">
    <div className="px-4 py-3 flex items-center justify-center relative border-b border-gray-200 bg-white sticky top-0 z-20">
      <button className="absolute left-4 p-1 rounded-full hover:bg-gray-100" onClick={handlers.onBack}>
        <FiArrowLeft size={24} className="text-gray-600" />
      </button>
      <h1 className="text-lg font-bold text-center flex-1 text-gray-800">จัดการบัญชียาเสพติด</h1>
    </div>

    <div className="px-4 pt-4 flex justify-end mb-3">
      <button 
        onClick={handlers.onCreate}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-800 text-white hover:bg-red-900 transition-colors shadow-sm active:scale-95"
      >
        <FiPlus size={20} />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {items.map(item => (
            <NarcoticCatalogCard 
              key={item.id} 
              data={item} 
              onEdit={handlers.onEdit} 
              onDelete={handlers.requestDelete} 
            />
          ))}
        </div>
      ) : <NoDataView />}
    </div>

    {items && items.length > 0 && (
      <div className="bg-white p-3 border-t border-gray-200 z-10 shadow-lg">
        <div className="flex justify-between items-center mx-auto">
          <div className="text-gray-500 text-xs w-1/3 truncate font-medium">{paginationText}</div>
          <div className="flex justify-center w-1/3">
            <select 
              value={pagination.perPage} 
              onChange={pagination.changePerPage}
              className="text-xs border-gray-300 rounded-md py-1 pl-2 pr-6 focus:ring-red-800 focus:border-red-800 bg-white"
            >
              {[10, 20, 50, 100].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end w-1/3 text-gray-600">
            <PaginationControls 
              currentPage={pagination.page} 
              totalPages={pagination.totalPages} 
              onPageChange={pagination.goToPage} 
            />
          </div>
        </div>
      </div>
    )}
  </div>
));

const DesktopViewLayout = memo(({ items, handlers, pagination, totalItems }) => (
  <div className="hidden md:flex flex-col h-full bg-slate-50">
    <div className="px-8 py-6 border-b border-gray-200 bg-white flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">จัดการบัญชียาเสพติด</h1>
    </div>

    <div className="px-8 py-4 flex justify-end">
      <button 
        onClick={handlers.onCreate}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#b30000] text-white hover:bg-[#8e0000] transition-all active:scale-95 font-bold shadow-sm"
      >
        <Plus size={20} />
        <span>เพิ่มรายการใหม่</span>
      </button>
    </div>

    <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-grow overflow-hidden">
        <div className="flex-grow overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 w-[15%]">ประเภทยา</th>
                <th className="p-4 w-[12%]">หมวดหมู่</th>
                <th className="p-4 w-[23%]">ลักษณะ</th>
                <th className="p-4 w-[10%] text-center">รูปภาพ</th>
                <th className="p-4 w-[15%]">วิธีเสพ</th>
                <th className="p-4 w-[10%] text-right">น้ำหนัก (g)</th>
                <th className="p-4 w-[15%] text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {items && items.length > 0 ? (
                items.map((data, idx) => (
                  <tr key={data.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-red-50/10 transition-colors`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{data.drug_type}</td>
                    <td className="px-4 py-3 text-gray-600">{data.drug_form.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={data.characteristics}>{data.characteristics}</td>
                    <td className="px-4 py-3 text-center flex justify-center"><ImageThumbnail src={data.imageUrl} alt={data.drug_type} small /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {NarcoticMapper.mapConsumptionMethods(data.consumption_method)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-right font-mono">{data.weight_grams}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <IconButton onClick={() => handlers.onEdit(data.id)} icon={Edit3} colorClass="text-gray-600 hover:bg-gray-100" label="Edit" />
                        <IconButton onClick={() => handlers.requestDelete(data.id)} icon={Trash2} colorClass="text-red-600 hover:bg-red-50" label="Delete" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-20 text-center"><NoDataView /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {items && items.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/50">
            <Pagination 
              currentPage={pagination.page} 
              totalPages={pagination.totalPages} 
              onPageChange={pagination.goToPage} 
              rowsPerPage={pagination.perPage} 
              onRowsPerPageChange={pagination.changePerPage} 
              totalItems={totalItems} 
              indexOfFirstItem={pagination.indexOfFirstItem} 
              indexOfLastItem={pagination.indexOfLastItem} 
            />
          </div>
        )}
      </div>
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const NarcoticCatalogPage = () => {
  const navigate = useNavigate();
  
  const { narcotics, loading, error, refetch, removeLocally } = useNarcoticCollection();

  const pagination = usePagination(narcotics, 10);
  const { state: modalState, requestDelete, executeDelete, closeConfirm, closeNotify } = useDeleteWorkflow(removeLocally);

  const handlers = useMemo(() => ({
    onEdit: (id) => navigate(`/admin/narcotics/edit-narcotic-profile/${id}`),
    onCreate: () => navigate('/admin/narcotics/create-narcotic'),
    onBack: () => navigate(-1),
    requestDelete
  }), [navigate, requestDelete]);

  const paginationText = useMemo(() => 
    PaginationCalculator.calculateText(pagination.indexOfFirstItem, pagination.indexOfLastItem, narcotics?.length || 0),
    [pagination.indexOfFirstItem, pagination.indexOfLastItem, narcotics]
  );

  if (loading && (!narcotics || !narcotics.length)) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loading /></div>;
  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <p className="text-red-600 font-medium text-center px-6">เกิดข้อผิดพลาด: {error}</p>
      <button onClick={refetch} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg active:scale-95 font-bold">ลองใหม่</button>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 overflow-hidden relative">
      <MobileViewLayout 
        items={pagination.currentItems} 
        handlers={handlers} 
        pagination={pagination} 
        totalItems={narcotics?.length || 0}
        paginationText={paginationText}
      />
      <DesktopViewLayout 
        items={pagination.currentItems} 
        handlers={handlers} 
        pagination={pagination} 
        totalItems={narcotics?.length || 0}
      />

      <WorkflowModal 
        isOpen={modalState.confirm.isOpen} 
        onClose={closeConfirm} 
        onConfirm={executeDelete} 
        title="ยืนยันการลบ" 
        message="คุณแน่ใจหรือไม่ว่าต้องการลบยาเสพติดนี้? การกระทำนี้ไม่สามารถยกเลิกได้" 
        type="danger" 
        confirmText={modalState.confirm.loading ? 'กำลังลบ...' : 'ลบรายการ'} 
        loading={modalState.confirm.loading} 
      />
      
      <WorkflowModal 
        isOpen={modalState.notification.isOpen} 
        onClose={closeNotify} 
        title={modalState.notification.title} 
        message={modalState.notification.message} 
        type={modalState.notification.type} 
      />
    </div>
  );
};

export default NarcoticCatalogPage;