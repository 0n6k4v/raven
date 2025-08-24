import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, ChevronLeft, X, AlertTriangle, CheckCircle, ArrowLeft, MoreVertical } from 'lucide-react';
import { PiImageBroken } from "react-icons/pi";
import Pagination from '../../../components/common/Pagination';

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// ==================== UTILS ====================
const mapNarcotic = (n) => {
    let imageUrl = '';
    if (n.example_images && Array.isArray(n.example_images) && n.example_images.length > 0) {
        imageUrl = n.example_images[0].image_url;
    }
    return {
        id: n.id,
        narcotic_id: n.id,
        drug_type: n.drug_type || '-',
        drug_category: n.drug_category || '-',
        imageUrl,
        characteristics: n.characteristics || '-',
        consumption_method: n.consumption_method || '-',
        effect: n.effect || '-',
        weight_grams: n.weight_grams || null,
    };
};

// ==================== CUSTOM HOOKS ====================
const useNarcotics = () => {
    const [narcotics, setNarcotics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);

    const fetchNarcotics = useCallback(async () => {
        setLoading(true);
        setError(null);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch(`${BASE_URL}/narcotics`, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            const mapped = (Array.isArray(data) ? data : []).map(mapNarcotic);
            setNarcotics(mapped);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
                console.error('Error fetching narcotics:', err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNarcotics();
        return () => abortRef.current?.abort();
    }, [fetchNarcotics]);

    const deleteNarcotic = useCallback(async (id) => {
        try {
            const res = await fetch(`${BASE_URL}/narcotics/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to delete narcotic: ${res.status} - ${errorText}`);
            }
            setNarcotics(prev => prev.filter(n => n.id !== id));
            return { success: true };
        } catch (err) {
            console.error('deleteNarcotic error:', err);
            return { success: false, message: err.message || 'Unknown error' };
        }
    }, []);

    return { narcotics, setNarcotics, loading, error, refetch: fetchNarcotics, deleteNarcotic };
};

// ==================== PRESENTATIONAL COMPONENTS ====================
const NoImageComponent = React.memo(({ small = false }) => (
    <div className={`flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200 ${small ? 'h-10 w-16' : 'h-12 w-20'}`}>
        <PiImageBroken className={`text-gray-400 ${small ? 'text-lg' : 'text-xl'}`} />
        <span className={`text-gray-400 ${small ? 'text-xs' : 'text-sm'} mt-1`}>No Image</span>
    </div>
));

const NarcoticCard = React.memo(({ narcotic, onEdit, onDelete, showMenu, setShowMenu }) => {
    const menuRef = useRef(null);

    const handleImageError = (e) => {
        e.target.style.display = 'none';
        const fallbackElement = e.target.nextElementSibling;
        if (fallbackElement) fallbackElement.style.display = 'flex';
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu, setShowMenu]);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-medium text-gray-900">{narcotic.drug_type}</h3>
                    <div className="relative" ref={menuRef}>
                        <button 
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded-full" 
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            aria-label="More options"
                        >
                            <MoreVertical size={18} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 z-10 mt-1 bg-white rounded shadow-lg border border-gray-300 w-36" role="menu">
                                <button 
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                    onClick={(e) => { e.stopPropagation(); onEdit(narcotic.narcotic_id || narcotic.id); setShowMenu(false); }}
                                >
                                    <Edit3 size={16} className="text-amber-600" />
                                    <span>แก้ไข</span>
                                </button>
                                <button 
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                    onClick={(e) => { e.stopPropagation(); onDelete(narcotic.id); setShowMenu(false); }}
                                >
                                    <Trash2 size={16} className="text-red-600" />
                                    <span>ลบ</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex">
                    <div className="flex-shrink-0 w-24 h-24 mr-3 flex items-center justify-center">
                        {narcotic.imageUrl ? (
                            <div className="relative w-24 h-24">
                                <img 
                                    src={narcotic.imageUrl} 
                                    alt={narcotic.drug_type} 
                                    className="w-24 h-24 object-contain rounded-md"
                                    onError={handleImageError}
                                />
                                <div className="hidden">
                                    <NoImageComponent />
                                </div>
                            </div>
                        ) : (
                            <NoImageComponent />
                        )}
                    </div>

                    <div className="flex flex-col justify-between flex-1">
                        <div>
                            <h4 className="font-medium text-sm mb-1">{narcotic.drug_category}</h4>
                            <div className="space-y-1">
                                <div className="flex">
                                    <span className="text-gray-500 text-xs w-16">ลักษณะ:</span>
                                    <span className="text-gray-700 text-xs">{narcotic.characteristics || '-'}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-500 text-xs w-16">วิธีเสพ:</span>
                                    <span className="text-gray-700 text-xs">{narcotic.consumption_method || '-'}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-500 text-xs w-16">น้ำหนัก:</span>
                                    <span className="text-gray-700 text-xs">{narcotic.weight_grams ? `${narcotic.weight_grams} g` : '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'warning', loading = false }) => {
    if (!isOpen) return null;
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className={`flex-shrink-0 ${bgColor} rounded-full p-2 mr-3`}>{icon}</div>
                        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    </div>
                    <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6"><p className="text-sm text-gray-500">{message}</p></div>
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">ยกเลิก</button>
                    <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${buttonColor} inline-flex items-center`}>
                        {loading && <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>}
                        {loading ? 'กำลังลบ...' : 'ลบ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const NotificationModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
    if (!isOpen) return null;
    const getIconAndColor = () => {
        if (type === 'error') return { icon: <AlertTriangle className="h-8 w-8 text-red-600" />, bgColor: 'bg-red-100', titleColor: 'text-red-900', buttonColor: 'bg-red-600 hover:bg-red-700' };
        return { icon: <CheckCircle className="h-8 w-8 text-green-600" />, bgColor: 'bg-green-100', titleColor: 'text-green-900', buttonColor: 'bg-green-600 hover:bg-green-700' };
    };
    const { icon, bgColor, titleColor, buttonColor } = getIconAndColor();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${bgColor} mb-4`}>{icon}</div>
                    <h3 className={`text-lg font-medium ${titleColor} mb-2`}>{title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{message}</p>
                    <button onClick={onClose} className={`w-full px-4 py-2 text-sm font-medium text-white rounded-md ${buttonColor}`}>ตกลง</button>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN CONTAINER COMPONENT ====================
const initialModalState = {
    confirm: { isOpen: false, id: null, loading: false },
    notification: { isOpen: false, type: 'success', title: '', message: '' }
};

function modalReducer(state, action) {
    switch (action.type) {
        case 'OPEN_CONFIRM': return { ...state, confirm: { isOpen: true, id: action.id, loading: false } };
        case 'CLOSE_CONFIRM': return { ...state, confirm: { isOpen: false, id: null, loading: false } };
        case 'SET_CONFIRM_LOADING': return { ...state, confirm: { ...state.confirm, loading: action.loading } };
        case 'OPEN_NOTIFICATION': return { ...state, notification: { isOpen: true, type: action.notification.type, title: action.notification.title, message: action.notification.message } };
        case 'CLOSE_NOTIFICATION': return { ...state, notification: { isOpen: false, type: 'success', title: '', message: '' } };
        default: return state;
    }
}

const AdminNarcoticCatalog = () => {
    const navigate = useNavigate();
    const { narcotics, setNarcotics, loading, error, refetch, deleteNarcotic } = useNarcotics();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showMenu, setShowMenu] = useState({});
    const [modalState, dispatch] = useReducer(modalReducer, initialModalState);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(narcotics.length / itemsPerPage)), [narcotics.length, itemsPerPage]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentNarcotics = useMemo(() => narcotics.slice(indexOfFirstItem, indexOfLastItem), [narcotics, indexOfFirstItem, indexOfLastItem]);

    const handleCreateNew = useCallback(() => navigate('/admin/narcotics/create-narcotic'), [navigate]);
    const handleEdit = useCallback((id) => navigate(`/admin/narcotics/edit-narcotic-profile/${id}`), [navigate]);
    const handleGoBack = useCallback(() => navigate(-1), [navigate]);

    const toggleMenuFor = useCallback((id, show) => {
        setShowMenu(prev => ({ ...prev, [id]: show }));
    }, []);

    const handleDelete = useCallback((id) => {
        dispatch({ type: 'OPEN_CONFIRM', id });
        setShowMenu({});
    }, []);

    const handleCloseConfirmModal = useCallback(() => {
        if (!modalState.confirm.loading) dispatch({ type: 'CLOSE_CONFIRM' });
    }, [modalState.confirm.loading]);

    const handleConfirmDelete = useCallback(async () => {
        const idToDelete = modalState.confirm.id;
        if (!idToDelete) return;
        dispatch({ type: 'SET_CONFIRM_LOADING', loading: true });

        const result = await deleteNarcotic(idToDelete);

        dispatch({ type: 'SET_CONFIRM_LOADING', loading: false });

        if (result.success) {
            const newTotalItems = Math.max(0, narcotics.length - 1);
            const newTotalPages = Math.ceil(newTotalItems / itemsPerPage) || 1;
            if (currentPage > newTotalPages) setCurrentPage(newTotalPages);

            dispatch({ type: 'CLOSE_CONFIRM' });
            dispatch({ type: 'OPEN_NOTIFICATION', notification: { type: 'success', title: 'ลบสำเร็จ!', message: 'ยาเสพติดถูกลบออกจากระบบเรียบร้อยแล้ว' } });
        } else {
            dispatch({ type: 'CLOSE_CONFIRM' });
            dispatch({ type: 'OPEN_NOTIFICATION', notification: { type: 'error', title: 'เกิดข้อผิดพลาด!', message: `ไม่สามารถลบยาเสพติดได้: ${result.message}` } });
        }
    }, [modalState.confirm.id, deleteNarcotic, narcotics.length, itemsPerPage, currentPage]);

    const handleCloseNotificationModal = useCallback(() => dispatch({ type: 'CLOSE_NOTIFICATION' }), []);

    const handlePageChange = useCallback((pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    }, []);

    const handleItemsPerPageChange = useCallback((event) => {
        const rows = Number(event.target.value);
        setItemsPerPage(rows);
        setCurrentPage(1);
    }, []);

    if (loading && narcotics.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-[#990000]"></div>
                <p className="ml-3 text-gray-600">Loading narcotic catalog...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <p className="text-red-600 text-xl mb-4">Error loading narcotic catalog: {error}</p>
                <button onClick={() => refetch()} className="px-4 py-2 bg-[#990000] text-white rounded hover:bg-[#7a0000]">Retry</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full bg-gray-100">
            {/* Mobile View */}
            <div className="md:hidden">
                {/* Mobile Header */}
                <div className="px-4 py-3 flex items-center justify-center relative shadow-[0_1.5px_4px_rgba(0,0,0,0.35)] bg-white">
                    <button className="absolute left-4 text-gray-900" onClick={handleGoBack} aria-label="Go back">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-center flex-1 text-gray-900">จัดการบัญชียาเสพติด</h1>
                </div>
                
                {/* Mobile Add Button */}
                <div className="px-4 pt-4 flex justify-end mb-4">
                    <button className="flex items-center gap-1 px-2 py-2 rounded bg-[#990000] text-white hover:bg-[#7a0000]" onClick={handleCreateNew}>
                        <Plus size={16} />
                    </button>
                </div>

                {/* Mobile Cards */}
                {loading && narcotics.length > 0 && (
                    <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-30 flex justify-center items-center z-50">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-white"></div>
                    </div>
                )}

                <div className="pr-4 pb-32 pl-4 grid grid-cols-1 gap-4">
                    {currentNarcotics.length > 0 ? (
                        currentNarcotics.map((n) => (
                            <NarcoticCard
                                key={n.id}
                                narcotic={n}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                showMenu={showMenu[n.id] || false}
                                setShowMenu={(show) => toggleMenuFor(n.id, show)}
                            />
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-10 col-span-1">ไม่พบข้อมูลยาเสพติด</div>
                    )}
                </div>

                {/* Mobile Pagination - Fixed Bottom */}
                {!loading && narcotics.length > 0 && (
                    <div className="fixed bottom-16 left-0 right-0 bg-white shadow-md p-2 flex flex-col border-t border-gray-200">
                        <div className="flex justify-between items-center pt-1">
                            <div className="text-gray-700 text-xs sm:text-sm pl-2">
                                {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, narcotics.length)} จาก {narcotics.length}
                            </div>
                            <div className="flex items-center text-gray-700 text-xs sm:text-sm">
                                <span className="mr-1 sm:mr-2">แถว:</span>
                                <select
                                    className="bg-transparent border border-gray-300 rounded px-1 sm:px-2 py-1 text-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#990000] focus:border-[#990000] cursor-pointer"
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                >
                                     <option value="5">5</option>
                                     <option value="10">10</option>
                                     <option value="20">20</option>
                                 </select>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 pr-2">
                                <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`} aria-label="Previous page">
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="font-medium text-xs sm:text-sm text-gray-700">{currentPage}/{totalPages}</span>
                                <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className={`p-1 rounded ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`} aria-label="Next page">
                                    <ChevronLeft size={18} className="rotate-180" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block p-4 md:p-4">
                {/* Desktop Header */}
                <div className="flex items-center w-full">
                    <button onClick={handleGoBack} className="flex items-center text-[#990000] font-medium hover:text-[#7a0000]">
                        <ChevronLeft className="h-5 w-5" /> ย้อนกลับ
                    </button>
                </div>

                <div className="flex items-center justify-between w-full py-3 mb-4 border-b border-gray-300">
                    <div><h2 className="text-xl font-semibold text-gray-800">จัดการบัญชียาเสพติด</h2></div>
                    <button onClick={handleCreateNew} className="flex items-center bg-[#990000] hover:bg-[#7a0000] text-white font-semibold py-2 px-4 rounded-lg shadow">
                        <Plus size={20} className="mr-2" /> เพิ่มข้อมูลยาเสพติด
                    </button>
                </div>  

                {loading && narcotics.length > 0 && (
                    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-20 flex justify-center items-center z-50">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-white"></div>
                    </div>
                )}
                
                {narcotics.length === 0 && !loading ? (
                    <div className="text-center py-10">
                        <div>
                            <p className="text-gray-500 text-lg">No narcotics found in the catalog.</p>
                            <p className="text-gray-400 text-sm mt-1">You can add a new narcotic using the button above.</p>
                        </div>
                    </div>
                ) : !loading && !error && narcotics.length > 0 ? (
                    <div className="flex flex-col h-[calc(100vh-225px)]">
                        {/* Table Container */}
                        <div className="bg-white shadow-md rounded-t-lg overflow-hidden flex-grow flex flex-col">
                            <div className="flex-grow overflow-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">ประเภทยา</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">หมวดหมู่</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">ลักษณะ</th>
                                            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider">รูปภาพ</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">วิธีเสพ</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">น้ำหนัก (g)</th>
                                            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentNarcotics.map((n, idx) => (
                                            <tr key={n.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{n.drug_type}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{n.drug_category}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{n.characteristics}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                                                    {n.imageUrl ? (
                                                        <div className="relative h-10 w-20 mx-auto flex items-center justify-center">
                                                            <img src={n.imageUrl} alt={n.drug_type} className="h-10 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; const fb = e.target.nextElementSibling; if (fb) fb.style.display = 'flex'; }} />
                                                            <div className="hidden absolute inset-0 flex items-center justify-center"><NoImageComponent small={true} /></div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-10 w-20 mx-auto flex items-center justify-center"><NoImageComponent small={true} /></div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{n.consumption_method}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{n.weight_grams || '-'}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-medium">
                                                    <button onClick={() => handleEdit(n.narcotic_id || n.id)} className="text-indigo-600 hover:text-indigo-900 transition-colors mr-3 p-1 rounded hover:bg-indigo-100" title="Edit Narcotic">
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(n.id)} className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-100" title="Delete Narcotic">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* Pagination */}
                        <div className="flex-shrink-0 bg-white shadow-md rounded-b-lg border-t border-gray-200">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                rowsPerPage={itemsPerPage}
                                onRowsPerPageChange={handleItemsPerPageChange}
                                totalItems={narcotics.length}
                                indexOfFirstItem={indexOfFirstItem}
                                indexOfLastItem={indexOfLastItem}
                            />
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={modalState.confirm.isOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmDelete}
                title="ยืนยันการลบ"
                message="คุณแน่ใจหรือไม่ว่าต้องการลบยาเสพติดนี้? การกระทำนี้ไม่สามารถยกเลิกได้"
                type="danger"
                loading={modalState.confirm.loading}
            />
            <NotificationModal
                isOpen={modalState.notification.isOpen}
                onClose={handleCloseNotificationModal}
                title={modalState.notification.title}
                message={modalState.notification.message}
                type={modalState.notification.type}
            />
        </div>
    );
};

export default AdminNarcoticCatalog;