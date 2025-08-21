import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { FaUser } from "react-icons/fa";
import { FiFilter, FiPlus, FiEye, FiEdit, FiTrash, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../../components/common/Pagination';

/* CONSTANTS */
const initialFilters = { role: [], department: [] };
const roleOptions = [
  { value: 'admin', label: 'แอดมิน' },
  { value: 'user', label: 'ผู้ใช้ทั่วไป' },
  { value: 'manager', label: 'ผู้จัดการ' },
  { value: 'officer', label: 'เจ้าหน้าที่' },
  { value: 'supervisor', label: 'ผู้ดูแล' },
];
const departmentOptions = [
  { value: 'สืบสวน', label: 'สืบสวน' },
  { value: 'ปราบปราม', label: 'ปราบปราม' },
  { value: 'ป้องกัน', label: 'ป้องกัน' },
  { value: 'จราจร', label: 'จราจร' },
  { value: 'บริหาร', label: 'บริหาร' },
  { value: 'อำนวยการ', label: 'อำนวยการ' },
];
const roleMapping = {
  'admin': 'แอดมิน',
  'user': 'ผู้ใช้ทั่วไป',
  'manager': 'ผู้จัดการ',
  'officer': 'เจ้าหน้าที่',
  'supervisor': 'ผู้ดูแล',
};

/* HELPERS */
function getUserId(user) {
  return user?.user_id ?? null;
}

/* UTILS */
function filterUsers(users, searchTerm, appliedFilters) {
  let filtered = users;
  const term = (searchTerm || '').trim().toLowerCase();
  if (term) {
    filtered = filtered.filter(user =>
      (user.firstname && user.firstname.toLowerCase().includes(term)) ||
      (user.lastname && user.lastname.toLowerCase().includes(term)) ||
      (user.title && user.title.toLowerCase().includes(term)) ||
      ((user.firstname && user.lastname) && `${user.firstname} ${user.lastname}`.toLowerCase().includes(term))
    );
  }
  if (appliedFilters.role && appliedFilters.role.length) {
    filtered = filtered.filter(user =>
      (user.role && (user.role.role_name || user.role).toString().toLowerCase()) &&
      appliedFilters.role.some(role =>
        (user.role.role_name ?? user.role).toString().toLowerCase() === role.toLowerCase()
      )
    );
  }
  if (appliedFilters.department && appliedFilters.department.length) {
    filtered = filtered.filter(user =>
      user.department && appliedFilters.department.some(dept =>
        user.department.toString().toLowerCase() === dept.toLowerCase()
      )
    );
  }
  return filtered;
}

function getFilterLabels(appliedFilters) {
  const labels = [];
  (appliedFilters.role || []).forEach(role => {
    labels.push({ type: 'role', value: role, label: `ตำแหน่ง: ${roleMapping[role] || role}` });
  });
  (appliedFilters.department || []).forEach(dept => {
    labels.push({ type: 'department', value: dept, label: `ประเภทการใช้งาน: ${dept}` });
  });
  return labels;
}

/* CUSTOM HOOKS */
function useUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [popup, setPopup] = useState({ open: false, type: '', message: '', user: null });
  const [popupCountdown, setPopupCountdown] = useState(5);
  const [filters, setFilters] = useState(() => ({ ...initialFilters }));
  const [appliedFilters, setAppliedFilters] = useState(() => ({ ...initialFilters }));
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigate = useNavigate();

  // Fetch users on mount with AbortController
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchUsers() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/list`, { signal });
        if (!res.ok) throw new Error('Network response was not ok ' + res.statusText);
        const data = await res.json();
        const userData = Array.isArray(data) ? data : (data.users || []);
        setUsers(userData);
        setFilteredUsers(userData);
        setLoading(false);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
      }
    }

    fetchUsers();
    return () => controller.abort();
  }, []);

  // Filter users when search/filter changes
  useEffect(() => {
    setFilteredUsers(filterUsers(users, searchTerm, appliedFilters));
    setCurrentPage(1);
  }, [appliedFilters, users, searchTerm]);

  // Popup countdown for auto-close
  useEffect(() => {
    let timer;
    if ((popup.type === 'success' || popup.type === 'fail') && popup.open) {
      if (popupCountdown > 0) {
        timer = setTimeout(() => setPopupCountdown(c => c - 1), 1000);
      } else {
        setPopup(prev => ({ ...prev, open: false }));
      }
    }
    return () => clearTimeout(timer);
  }, [popup, popupCountdown]);

  useEffect(() => {
    if ((popup.type === 'success' || popup.type === 'fail') && popup.open) {
      setPopupCountdown(5);
    }
  }, [popup.type, popup.open]);

  // Handlers
  const handleSearch = useCallback(e => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleViewDetail = useCallback(user => {
    const id = getUserId(user);
    if (!id) return;
    navigate(`/user-profile/${id}`);
  }, [navigate]);

  const handleEdit = useCallback(user => {
    const id = getUserId(user);
    if (!id) return;
    navigate(`/edit-user/${id}`);
  }, [navigate]);

  const handleDeleteClick = useCallback(user => {
    setPopup({ open: true, type: 'confirm', message: `ยืนยันการลบผู้ใช้ ${user.firstname || ''} ${user.lastname || ''} ?`, user });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const user = popup.user;
    if (!user) {
      setPopup(prev => ({ ...prev, open: false }));
      return;
    }
    const id = getUserId(user);
    setPopup(prev => ({ ...prev, open: false }));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPopupCountdown(5);
        setPopup({ open: true, type: 'fail', message: 'กรุณาเข้าสู่ระบบเพื่อทำรายการนี้', user: null });
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => getUserId(u) !== id));
        setFilteredUsers(prev => prev.filter(u => getUserId(u) !== id));
        setPopupCountdown(5);
        setPopup({ open: true, type: 'success', message: 'ลบผู้ใช้สำเร็จ', user: null });
      } else {
        const errorData = await res.json().catch(() => ({}));
        setPopupCountdown(5);
        setPopup({ open: true, type: 'fail', message: errorData.detail || 'ลบผู้ใช้ไม่สำเร็จ', user: null });
      }
    } catch (error) {
      setPopupCountdown(5);
      setPopup({ open: true, type: 'fail', message: 'ลบผู้ใช้ไม่สำเร็จ: ' + (error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'), user: null });
    }
  }, [popup]);

  const handleApplyFilters = useCallback(newFilters => {
    setAppliedFilters({ ...(newFilters || {}) });
    setFilters({ ...(newFilters || {}) });
  }, []);

  const handleClearFilters = useCallback(() => {
    setAppliedFilters({ ...initialFilters });
    setFilters({ ...initialFilters });
    setIsFilterOpen(false);
  }, []);

  const removeFilter = useCallback((type, value) => {
    setAppliedFilters(prev => {
      const updated = { ...prev, [type]: (prev[type] || []).filter(item => item !== value) };
      return updated;
    });
    setFilters(prev => {
      const updated = { ...prev, [type]: (prev[type] || []).filter(item => item !== value) };
      return updated;
    });
  }, []);

  const handlePageChange = useCallback(pageNumber => {
    if (pageNumber < 1 || pageNumber > Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage))) return;
    setCurrentPage(pageNumber);
  }, [filteredUsers.length, rowsPerPage]);

  const handleRowsPerPageChange = useCallback(e => {
    setRowsPerPage(parseInt(e.target.value, 10) || 10);
    setCurrentPage(1);
  }, []);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentUsers = useMemo(
    () => filteredUsers.slice(indexOfFirstItem, indexOfLastItem),
    [filteredUsers, indexOfFirstItem, indexOfLastItem]
  );

  // Memoized filter labels
  const filterLabels = useMemo(() => getFilterLabels(appliedFilters), [appliedFilters]);

  return {
    users,
    loading,
    isFilterOpen,
    setIsFilterOpen,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    searchTerm,
    setSearchTerm,
    popup,
    setPopup,
    popupCountdown,
    setPopupCountdown,
    filters,
    setFilters,
    appliedFilters,
    setAppliedFilters,
    filteredUsers,
    setFilteredUsers,
    handleSearch,
    handleViewDetail,
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleApplyFilters,
    handleClearFilters,
    removeFilter,
    handlePageChange,
    handleRowsPerPageChange,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    currentUsers,
    filterLabels,
  };
}

/* PRESENTATIONAL COMPONENTS */
const FilterPopup = memo(function FilterPopup({
  isOpen,
  onClose,
  filters,
  onClearFilters,
  onApplyFilters,
}) {
  const [localFilters, setLocalFilters] = useState(() => ({ ...filters }));
  const [sectionsOpen, setSectionsOpen] = useState({ role: true, department: true });

  useEffect(() => {
    if (isOpen) {
      setLocalFilters({ ...(filters || {}) });
      setSectionsOpen({ role: true, department: true });
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const toggleSection = useCallback(sectionName => {
    setSectionsOpen(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  }, []);

  const handleCheckboxChange = useCallback((type, value, checked) => {
    setLocalFilters(prev => ({
      ...prev,
      [type]: checked
        ? [...(prev[type] || []), value]
        : (prev[type] || []).filter(item => item !== value)
    }));
  }, []);

  const handleApply = useCallback(() => {
    onApplyFilters(localFilters);
    onClose();
  }, [localFilters, onApplyFilters, onClose]);

  const handleClose = useCallback(() => {
    setLocalFilters({ ...(filters || {}) });
    onClose();
  }, [filters, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4" role="dialog" aria-modal="true" aria-label="ตัวกรองผู้ใช้งาน">
      <div className="bg-white w-full h-full md:w-full md:h-[70vh] md:max-w-[650px] md:max-h-[90vh] md:rounded-lg shadow-lg border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h2 className="text-xl md:text-2xl font-semibold">เลือกตัวกรองผลลัพธ์</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700" aria-label="ปิดตัวกรอง">
            <FiX size={24} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="border-b pb-4">
            <button
              onClick={() => toggleSection('role')}
              className="flex justify-between items-center w-full font-semibold mb-3 text-left"
              aria-expanded={sectionsOpen.role}
            >
              ตำแหน่ง
              {sectionsOpen.role ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </button>
            {sectionsOpen.role && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                  {roleOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#b30000]"
                        value={option.value}
                        checked={(localFilters.role || []).includes(option.value)}
                        onChange={e => handleCheckboxChange('role', option.value, e.target.checked)}
                        aria-label={`ตำแหน่ง ${option.label}`}
                      /> {option.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="pb-4">
            <button
              onClick={() => toggleSection('department')}
              className="flex justify-between items-center w-full font-semibold mb-3 text-left"
              aria-expanded={sectionsOpen.department}
            >
              ประเภทการใช้งาน
              {sectionsOpen.department ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </button>
            {sectionsOpen.department && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                  {departmentOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#b30000]"
                        value={option.value}
                        checked={(localFilters.department || []).includes(option.value)}
                        onChange={e => handleCheckboxChange('department', option.value, e.target.checked)}
                        aria-label={`ประเภทการใช้งาน ${option.label}`}
                      /> {option.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between p-4 border-t gap-3 flex-shrink-0 bg-white">
          <button
            onClick={onClearFilters}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg text-[#b30000] border-red-600 hover:bg-red-50/30 order-2 sm:order-1"
            aria-label="ล้างการคัดกรองทั้งหมด"
          >
            ล้างการคัดกรองทั้งหมด
          </button>
          <button
            onClick={handleApply}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#b30000] text-white hover:bg-[#990000] order-1 sm:order-2"
            aria-label="คัดกรองผลลัพธ์"
          >
            คัดกรองผลลัพธ์
          </button>
        </div>
      </div>
    </div>
  );
});

const Popup = memo(function Popup({
  open,
  type,
  message,
  onConfirm,
  onCancel,
  countdown,
  onClose,
}) {
  if (!open) return null;
  let icon, color;
  if (type === 'confirm') {
    icon = <FiTrash size={32} className="text-red-600 mb-2" />;
    color = 'text-red-600';
  } else if (type === 'success') {
    icon = <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
    color = 'text-green-600';
  } else {
    icon = <svg className="w-8 h-8 text-red-600 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
    color = 'text-red-600';
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" role="dialog" aria-modal="true" aria-label="แจ้งเตือน">
      <div className="bg-white rounded-lg shadow-lg flex flex-col items-center justify-center w-80 h-64 relative border border-gray-200">
         {(type === 'success' || type === 'fail') && (
           <button
             onClick={onClose}
             className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
             aria-label="ปิดแจ้งเตือน"
           >
             <FiX size={22} />
           </button>
         )}
        {icon}
        <div className={`font-semibold text-lg mb-4 mt-2 text-center ${color}`}>{message}</div>
        {type === 'confirm' && (
          <div className="flex gap-4 mt-2">
            <button onClick={onCancel} className="px-4 py-2 rounded border" aria-label="ยกเลิก">ยกเลิก</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white" aria-label="ยืนยันลบ">ยืนยัน</button>
          </div>
        )}
        {(type === 'success' || type === 'fail') && (
          <div className="mt-4 text-gray-500 text-sm">
            ปิดอัตโนมัติใน {countdown} วินาที
          </div>
        )}
      </div>
    </div>
  );
});

const SearchBox = memo(function SearchBox({ searchTerm, onSearchChange }) {
  return (
    <div className="relative flex-grow max-w-md">
      <input
        type="text"
        placeholder="ค้นหาโดยชื่อผู้ใช้..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-100"
        value={searchTerm}
        onChange={onSearchChange}
        aria-label="ค้นหาโดยชื่อผู้ใช้"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-400" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a.007.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
      </div>
    </div>
  );
});

const FilterTags = memo(function FilterTags({ labels, onRemove }) {
  if (!labels || !labels.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="ตัวกรองที่เลือก">
      {labels.map((item, index) => (
        <div key={`${item.type}-${item.value}-${index}`} className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-sm" role="listitem">
          <span>{item.label}</span>
          <button onClick={() => onRemove(item.type, item.value)} className="ml-2 text-gray-500 hover:text-red-500" aria-label={`ลบตัวกรอง ${item.label}`}>
            <FiX size={16} />
          </button>
        </div>
      ))}
    </div>
  );
});

const DesktopLayout = memo(function DesktopLayout(props) {
  const navigate = useNavigate();
  const {
    searchTerm, handleSearch, isFilterOpen, setIsFilterOpen, filterLabels, removeFilter,
    loading, currentUsers, handleViewDetail, handleDeleteClick, handleEdit,
    filteredUsers, indexOfFirstItem, indexOfLastItem, rowsPerPage, handleRowsPerPageChange,
    currentPage, totalPages, handlePageChange
  } = props;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <FaUser className="text-2xl" />
          <h1 className="text-xl font-bold">ผู้ใช้งาน</h1>
        </div>
      </div>
      <div className="px-6 flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SearchBox searchTerm={searchTerm} onSearchChange={handleSearch} />
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-100 whitespace-nowrap"
            aria-label="เปิดตัวกรอง"
            type="button"
          >
            <FiFilter size={18} /> ตัวกรกร
          </button>
        </div>
        <button
          onClick={() => navigate('/createUser')}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#b30000] text-white hover:bg-[#990000]"
          aria-label="เพิ่มผู้ใช้"
        >
          <FiPlus size={18} />
          <b>เพิ่มผู้ใช้</b>
        </button>
      </div>
      <div className="px-6">
        <FilterTags labels={filterLabels} onRemove={removeFilter} />
      </div>
      <div className="px-6 pb-6 flex flex-col flex-grow overflow-hidden">
        <div className="bg-white rounded shadow-md border border-gray-200 flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-auto">
            <table className="w-full table-fixed border-collapse" role="table" aria-label="ตารางผู้ใช้งาน">
              <thead>
                <tr className="bg-gray-200 sticky top-0 z-[5]">
                  <th className="p-3 text-left font-semibold w-[20%]">รหัสประจำตัวผู้ใช้:</th>
                  <th className="p-3 text-left font-semibold w-[20%]">ตำแหน่ง:</th>
                  <th className="p-3 text-left font-semibold w-[20%]">ชื่อ-สกุล:</th>
                  <th className="p-3 text-left font-semibold w-[20%]">ประเภทการใช้งาน</th>
                  <th className="p-3 text-center font-semibold w-[20%]">การจัดการ</th>
                </tr>
              </thead>
              {loading ? (
                <tbody>
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-10">
                      กำลังโหลด...
                    </td>
                  </tr>
                </tbody>
              ) : currentUsers.length > 0 ? (
                <tbody>
                  {currentUsers.map((user, index) => {
                    const key = getUserId(user) ?? user.user_code ?? index;
                    return (
                      <tr key={key} className="border-t border-gray-200 hover:bg-red-50 transition-colors">
                        <td className="p-3">{getUserId(user) ?? '-'}</td>
                        <td className="p-3">{user.role?.role_name ?? (user.role || '-')}</td>
                        <td className="p-3">{`${user.title || ''} ${user.firstname || ''} ${user.lastname || ''}`.trim() || '-'}</td>
                        <td className="p-3">{user.department || '-'}</td>
                        <td className="p-3">
                          <div className="flex justify-center gap-4">
                            <button title="ดูรายละเอียด" onClick={() => handleViewDetail(user)} className="text-blue-600 hover:text-blue-800" aria-label="ดูรายละเอียดผู้ใช้">
                              <FiEye size={18} />
                            </button>
                            <button title="แก้ไข" className="text-yellow-600 hover:text-yellow-800" onClick={() => handleEdit(user)} aria-label="แก้ไขผู้ใช้">
                              <FiEdit size={18} />
                            </button>
                            <button title="ลบ" className="text-red-600 hover:text-red-800" onClick={() => handleDeleteClick(user)} aria-label="ลบผู้ใช้">
                              <FiTrash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-10">
                      ไม่พบข้อมูลตามตัวกรอง
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          {filteredUsers.length > 0 && (
            <Pagination
              totalItems={filteredUsers.length}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              indexOfFirstItem={indexOfFirstItem}
              indexOfLastItem={indexOfLastItem}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
});

const MobileLayout = memo(function MobileLayout(props) {
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();
  const {
    searchTerm, handleSearch, isFilterOpen, setIsFilterOpen, filterLabels, removeFilter,
    loading, currentUsers, handleViewDetail, handleDeleteClick, handleEdit,
    filteredUsers, indexOfFirstItem, indexOfLastItem, rowsPerPage, handleRowsPerPageChange,
    currentPage, totalPages, handlePageChange
  } = props;

  const toggleActionMenu = useCallback(userId => {
    setActiveMenu(prev => (prev === userId ? null : userId));
  }, []);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <FaUser className="text-xl" />
        <h1 className="text-xl font-bold">ผู้ใช้งาน</h1>
      </div>
        <div className="flex flex-col gap-2 mb-4">
        <SearchBox searchTerm={searchTerm} onSearchChange={handleSearch} />
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-100"
            aria-label="เปิดตัวกรอง"
            type="button"
          >
            <FiFilter size={16} /> ตัวกรอง
          </button>
          <button
            onClick={() => navigate('/createUser')}
            className="flex items-center gap-2 px-3 py-1 rounded bg-[#b30000] text-white hover:bg-[#990000] focus:outline-none focus:ring-2 focus:ring-red-100"
            aria-label="เพิ่มผู้ใช้"
            type="button"
          >
            <FiPlus size={16} />
            <b>เพิ่มผู้ใช้</b>
          </button>
        </div>
      </div>
      <FilterTags labels={filterLabels} onRemove={removeFilter} />
      <div className="bg-white rounded-t shadow overflow-auto border border-gray-200 flex-grow">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            กำลังโหลด...
          </div>
        ) : currentUsers.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {currentUsers.map((user, index) => {
              const id = getUserId(user);
              const key = id ?? user.user_code ?? index;
              return (
                <div key={key} className="p-3 flex items-center relative">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 overflow-hidden">
                    {user.profile_image_url ? (
                      <img
                        src={user.profile_image_url}
                        alt="profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      user.firstname ? user.firstname.charAt(0).toUpperCase() : '?'
                    )}
                  </div>
                  <div className="ml-3 flex-grow">
                    <div className="font-semibold">{`${user.title || ''} ${user.firstname || ''} ${user.lastname || ''}`.trim() || '-'}</div>
                    <div className="text-xs text-gray-500">รหัส: {id ?? user.user_code ?? '-'}</div>
                    <div className="text-xs text-gray-500">
                      {user.role?.role_name ?? (user.role || '-')} · {user.department || '-'}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      className="p-2"
                      onClick={() => toggleActionMenu(id)}
                      aria-haspopup="true"
                      aria-expanded={activeMenu === id}
                      aria-label="เมนูการกระทำ"
                      tabIndex={0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                      </svg>
                    </button>
                    {activeMenu === id && (
                      <div className="absolute right-0 z-10 w-36 bg-white rounded shadow-lg border border-gray-200" role="menu">
                        <button
                          onClick={() => {
                            handleViewDetail(user);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                          role="menuitem"
                        >
                          <FiEye size={16} className="text-blue-600" />
                          <span>ดูรายละเอียด</span>
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            handleEdit(user);
                            setActiveMenu(null);
                          }}
                          role="menuitem"
                        >
                          <FiEdit size={16} className="text-yellow-600" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            handleDeleteClick(user);
                            setActiveMenu(null);
                          }}
                          role="menuitem"
                        >
                          <FiTrash size={16} className="text-red-600" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            ไม่พบข้อมูลตามตัวกรอง
          </div>
        )}
      </div>
      {filteredUsers.length > 0 && (
        <Pagination
          totalItems={filteredUsers.length}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={indexOfLastItem}
          totalPages={totalPages}
        />
      )}
    </div>
  );
});

/* MAIN COMPONENT */
const UserManagement = () => {
  const {
    loading,
    isFilterOpen,
    setIsFilterOpen,
    filters,
    handleClearFilters,
    handleApplyFilters,
    popup,
    handleConfirmDelete,
    setPopup,
    popupCountdown,
    filterLabels,
    removeFilter,
    currentUsers,
    handleViewDetail,
    handleDeleteClick,
    handleEdit,
    filteredUsers,
    indexOfFirstItem,
    indexOfLastItem,
    rowsPerPage,
    handleRowsPerPageChange,
    currentPage,
    totalPages,
    handlePageChange,
    searchTerm,
    handleSearch,
  } = useUserManagement();

  const layoutProps = useMemo(() => ({
    searchTerm,
    handleSearch,
    isFilterOpen,
    setIsFilterOpen,
    filterLabels,
    removeFilter,
    loading,
    currentUsers,
    handleViewDetail,
    handleDeleteClick,
    handleEdit,
    filteredUsers,
    indexOfFirstItem,
    indexOfLastItem,
    rowsPerPage,
    handleRowsPerPageChange,
    currentPage,
    totalPages,
    handlePageChange,
  }), [
    searchTerm, handleSearch, isFilterOpen, setIsFilterOpen,
    filterLabels, removeFilter, loading, currentUsers,
    handleViewDetail, handleDeleteClick, handleEdit, filteredUsers, indexOfFirstItem,
    indexOfLastItem, rowsPerPage, handleRowsPerPageChange,
    currentPage, totalPages, handlePageChange
  ]);

  return (
    <div className="w-full h-full">
      <FilterPopup
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />
      <Popup
        open={popup.open}
        type={popup.type}
        message={popup.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPopup(prev => ({ ...prev, open: false }))}
        countdown={popupCountdown}
        onClose={() => setPopup(prev => ({ ...prev, open: false }))}
      />
      <div className="hidden md:block h-full">
        <DesktopLayout {...layoutProps} />
      </div>
      <div className="md:hidden h-full">
        <MobileLayout {...layoutProps} />
      </div>
    </div>
  );
};

export default UserManagement;