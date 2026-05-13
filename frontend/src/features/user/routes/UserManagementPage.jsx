import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser } from "react-icons/fa";
import { FiFilter, FiPlus, FiEye, FiEdit, FiTrash, FiChevronDown, FiChevronUp, FiX, FiSearch } from 'react-icons/fi';
import { UserManagementService } from '../../auth/services';
import Pagination from '../../../components/ui/Pagination';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const CONSTANTS = {
  ROLE_OPTIONS: [
    { value: 'admin', label: 'แอดมิน' },
    { value: 'user', label: 'ผู้ใช้ทั่วไป' },
    { value: 'manager', label: 'ผู้จัดการ' },
    { value: 'officer', label: 'เจ้าหน้าที่' },
    { value: 'supervisor', label: 'ผู้ดูแล' },
  ],
  DEPARTMENT_OPTIONS: [
    { value: 'สืบสวน', label: 'สืบสวน' },
    { value: 'ปราบปราม', label: 'ปราบปราม' },
    { value: 'ป้องกัน', label: 'ป้องกัน' },
    { value: 'จราจร', label: 'จราจร' },
    { value: 'บริหาร', label: 'บริหาร' },
    { value: 'อำนวยการ', label: 'อำนวยการ' },
  ],
  ROLE_MAPPING: {
    'admin': 'แอดมิน', 'user': 'ผู้ใช้ทั่วไป', 'manager': 'ผู้จัดการ', 'officer': 'เจ้าหน้าที่', 'supervisor': 'ผู้ดูแล', 'superadmin': 'ผู้ดูแลระบบสูงสุด'
  }
};

class UserFilterEngine {
  static filter(users, searchTerm, filters) {
    let result = users;
    const term = (searchTerm || '').trim().toLowerCase();

    if (term) {
      result = result.filter(user =>
        user.fullName.toLowerCase().includes(term) ||
        user.userId.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    if (filters.role?.length) {
      result = result.filter(user => filters.role.some(r => user.role.toLowerCase() === r.toLowerCase()));
    }

    if (filters.department?.length) {
      result = result.filter(user => 
        user.department && filters.department.some(d => user.department.toLowerCase() === d.toLowerCase())
      );
    }

    return result;
  }

  static getActiveLabels(filters) {
    const labels = [];
    (filters.role || []).forEach(role => {
      labels.push({ type: 'role', value: role, label: `ตำแหน่ง: ${CONSTANTS.ROLE_MAPPING[role] || role}` });
    });
    (filters.department || []).forEach(dept => {
      labels.push({ type: 'department', value: dept, label: `ประเภท: ${dept}` });
    });
    return labels;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useUsersData() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    try {
      const entities = await UserManagementService.fetchAll(controller.signal);
      setUsers(entities);
    } catch (err) {
      if (err.name !== 'AbortError') setUsers([]);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const removeUserLocally = useCallback((id) => {
    setUsers(prev => prev.filter(u => u.userId !== id && u.id !== id));
  }, []);

  return { users, loading, removeUserLocally, refresh: fetchUsers };
}

function useUserFiltering(users) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ role: [], department: [] });

  const filteredUsers = useMemo(() => {
    return UserFilterEngine.filter(users, searchTerm, filters);
  }, [users, searchTerm, filters]);

  const activeFilterLabels = useMemo(() => {
    return UserFilterEngine.getActiveLabels(filters);
  }, [filters]);

  const handleRemoveFilter = useCallback((type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== value)
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ role: [], department: [] });
  }, []);

  return {
    searchTerm, setSearchTerm, filters, setFilters,
    filteredUsers, activeFilterLabels, handleRemoveFilter, handleClearFilters
  };
}

function usePagination(items, rowsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => setCurrentPage(1), [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = useMemo(() => items.slice(indexOfFirstItem, indexOfLastItem), [items, indexOfFirstItem, indexOfLastItem]);

  return { currentPage, setCurrentPage, totalPages, currentItems };
}

function useFeedbackPopup() {
  const [popup, setPopup] = useState({ open: false, type: '', message: '', data: null });
  
  const showSuccess = useCallback((message) => setPopup({ open: true, type: 'success', message, data: null }), []);
  const showError = useCallback((message) => setPopup({ open: true, type: 'fail', message, data: null }), []);
  const showConfirm = useCallback((message, data) => setPopup({ open: true, type: 'confirm', message, data }), []);
  const closePopup = useCallback(() => setPopup(prev => ({ ...prev, open: false })), []);

  return { popup, showSuccess, showError, showConfirm, closePopup };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const ActionButton = memo(({ icon: Icon, onClick, colorClass, label }) => (
  <button 
    onClick={onClick} 
    className={`${colorClass} p-2 rounded-full hover:bg-gray-100 transition-colors`} 
    aria-label={label} 
    title={label}
  >
    <Icon size={18} />
  </button>
));

const Badge = memo(({ children, className = "bg-gray-100 text-gray-700 border border-gray-200" }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
));

const Avatar = memo(({ src, alt, fallback }) => (
  <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center text-gray-400 border border-gray-200 overflow-hidden shadow-sm">
    {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : fallback}
  </div>
));

const SearchInput = memo(({ value, onChange }) => (
  <div className="relative flex-grow max-w-md group">
    <input
      type="text"
      placeholder="ค้นหาโดยชื่อผู้ใช้..."
      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 hover:border-gray-400 transition-all"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-500 transition-colors" size={18} />
  </div>
));

const FilterChip = memo(({ label, onRemove }) => (
  <div className="flex items-center bg-white border border-gray-200 rounded-full px-3 py-1 text-sm shadow-sm">
    <span className="text-gray-700">{label}</span>
    <button onClick={onRemove} className="ml-2 text-gray-400 hover:text-red-500 transition-colors">
      <FiX size={14} />
    </button>
  </div>
));

const FilterSection = memo(({ title, options, selectedValues, onChange, isOpen, onToggle }) => (
  <div className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
    <button onClick={onToggle} className="flex justify-between items-center w-full font-semibold text-gray-700 mb-3 text-left py-2 hover:text-gray-900 transition-colors">
      {title}
      {isOpen ? <FiChevronUp size={20} className="text-gray-500" /> : <FiChevronDown size={20} className="text-gray-500" />}
    </button>
    {isOpen && (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fadeIn">
        {options.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-[#b30000] focus:ring-[#b30000] transition-colors"
              checked={selectedValues.includes(opt.value)}
              onChange={e => onChange(opt.value, e.target.checked)}
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt.label}</span>
          </label>
        ))}
      </div>
    )}
  </div>
));

const ConfirmDialog = memo(({ open, type, message, onConfirm, onClose }) => {
  if (!open) return null;
  const isConfirm = type === 'confirm';
  const IconComponent = isConfirm ? FiTrash : (type === 'success' ? FiPlus : FiX); 
  const color = isConfirm ? 'text-red-600' : (type === 'success' ? 'text-green-600' : 'text-red-600');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center border border-gray-100 transform transition-all scale-100 shadow-xl">
        <div className={`mb-4 p-3 rounded-full bg-gray-50 ${color}`}><IconComponent size={32} /></div>
        <h3 className={`text-lg font-semibold text-center mb-6 text-gray-800`}>{message}</h3>
        
        {isConfirm ? (
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors">ยกเลิก</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-700 text-white rounded-lg hover:bg-red-800 font-medium shadow-md shadow-red-200 transition-all active:scale-95">ยืนยัน</button>
          </div>
        ) : (
           <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 underline">ปิด</button>
        )}
      </div>
    </div>
  );
});

const UserTable = memo(({ users, loading, onView, onEdit, onDelete }) => {
  if (loading) return <div className="p-10 text-center text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">กำลังโหลดข้อมูล...</div>;
  if (!users.length) return <div className="p-10 text-center text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">ไม่พบข้อมูลตามตัวกรอง</div>;

  return (
    <div className="overflow-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {['รหัส', 'ตำแหน่ง', 'ชื่อ-สกุล', 'แผนก', 'จัดการ'].map(h => (
              <th key={h} className="p-4 font-semibold text-sm text-gray-700 border-b border-gray-200 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.userId || user.id} className="hover:bg-red-50/30 transition-colors group">
              <td className="p-4 text-sm font-mono text-gray-500">{user.userId || user.id}</td>
              <td className="p-4"><Badge>{CONSTANTS.ROLE_MAPPING[user.role] || user.role}</Badge></td>
              <td className="p-4 font-medium text-gray-900">{user.fullName}</td>
              <td className="p-4 text-sm text-gray-600">{user.department || '-'}</td>
              <td className="p-4 flex gap-1">
                <ActionButton icon={FiEye} onClick={() => onView(user)} colorClass="text-blue-600 hover:bg-blue-50" label="ดูรายละเอียด" />
                <ActionButton icon={FiEdit} onClick={() => onEdit(user)} colorClass="text-yellow-600 hover:bg-yellow-50" label="แก้ไข" />
                <ActionButton icon={FiTrash} onClick={() => onDelete(user)} colorClass="text-red-600 hover:bg-red-50" label="ลบ" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const UserListMobile = memo(({ users, loading, onView, onEdit, onDelete }) => {
  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">กำลังโหลด...</div>;
  if (!users.length) return <div className="p-8 text-center text-gray-500">ไม่พบข้อมูล</div>;

  return (
    <div className="space-y-3">
      {users.map(user => (
        <div key={user.userId || user.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4 active:bg-gray-50 transition-all shadow-sm">
          <Avatar 
            src={user.avatarUrl} 
            fallback={<span className="font-bold text-[#990000]">{user.initials || '?'}</span>} 
          />
          <div className="flex-grow min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{user.fullName}</h4>
            <p className="text-xs text-gray-500 mt-1">{CONSTANTS.ROLE_MAPPING[user.role] || user.role} • {user.department}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onView(user)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"><FiEye size={18} /></button>
            <button onClick={() => onEdit(user)} className="p-2 bg-yellow-50 text-yellow-600 rounded-full hover:bg-yellow-100 transition-colors"><FiEdit size={18} /></button>
            <button onClick={() => onDelete(user)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"><FiTrash size={18} /></button>
          </div>
        </div>
      ))}
    </div>
  );
});

const FilterModal = memo(({ isOpen, onClose, filters, onApply, onClear }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [sections, setSections] = useState({ role: true, dept: true });

  useEffect(() => { if (isOpen) setLocalFilters(filters); }, [isOpen, filters]);

  const handleChange = (type, value, checked) => {
    setLocalFilters(prev => ({
      ...prev,
      [type]: checked ? [...prev[type], value] : prev[type].filter(i => i !== value)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200 overflow-hidden transform transition-all">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FiFilter /> ตัวกรอง</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><FiX size={24} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-6">
          <FilterSection 
            title="ตำแหน่ง" 
            options={CONSTANTS.ROLE_OPTIONS} 
            selectedValues={localFilters.role} 
            isOpen={sections.role} 
            onToggle={() => setSections(p => ({...p, role: !p.role}))}
            onChange={(val, checked) => handleChange('role', val, checked)}
          />
          <FilterSection 
            title="แผนก" 
            options={CONSTANTS.DEPARTMENT_OPTIONS} 
            selectedValues={localFilters.department} 
            isOpen={sections.dept} 
            onToggle={() => setSections(p => ({...p, dept: !p.dept}))}
            onChange={(val, checked) => handleChange('department', val, checked)}
          />
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-3 bg-gray-50">
          <button onClick={() => { onClear(); onClose(); }} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors">ล้างค่า</button>
          <button onClick={() => { onApply(localFilters); onClose(); }} className="flex-1 py-2.5 bg-red-700 text-white rounded-lg hover:bg-red-800 font-medium shadow-md shadow-red-200 transition-all active:scale-95">ดูผลลัพธ์</button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const UserManagement = () => {
  const navigate = useNavigate();
  const { users, loading, removeUserLocally } = useUsersData();
  const { 
    searchTerm, setSearchTerm, filters, setFilters, 
    filteredUsers, activeFilterLabels, 
    handleRemoveFilter, handleClearFilters 
  } = useUserFiltering(users);
  
  const { currentItems: paginatedUsers, currentPage, setCurrentPage, totalPages } = usePagination(filteredUsers, 10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { popup, showSuccess, showError, showConfirm, closePopup } = useFeedbackPopup();

  const handleView = useCallback((user) => navigate(`/user-profile/${user.userId || user.id}`), [navigate]);
  const handleEdit = useCallback((user) => navigate(`/edit-user/${user.userId || user.id}`), [navigate]);
  const handleDeleteRequest = useCallback((user) => { showConfirm(`ยืนยันการลบผู้ใช้ ${user.fullName}?`, user); }, [showConfirm]);
  
  const handleConfirmDelete = useCallback(async () => {
    const user = popup.data;
    if (!user) return closePopup();
    closePopup();
    try {
      const idToDelete = user.userId || user.id;
      await UserManagementService.deleteUser(idToDelete);
      removeUserLocally(idToDelete);
      showSuccess('ลบผู้ใช้สำเร็จ');
    } catch (error) { showError(error.message); }
  }, [popup.data, closePopup, removeUserLocally, showSuccess, showError]);

  useEffect(() => { 
    if ((popup.type === 'success' || popup.type === 'fail') && popup.open) { 
      const timer = setTimeout(closePopup, 3000); 
      return () => clearTimeout(timer); 
    } 
  }, [popup, closePopup]);

  return (
    <div className="h-full flex flex-col bg-gray-50 md:bg-white">
      <div className="px-6 py-5 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white border-b border-gray-200 shadow-sm md:shadow-none">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2.5 rounded-full text-red-700 border border-red-100"><FaUser size={20} /></div>
          <h1 className="text-xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <SearchInput value={searchTerm} onChange={setSearchTerm} />
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 flex items-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <FiFilter className="text-gray-500" /> <span className="hidden sm:inline">ตัวกรอง</span>
          </button>
          
          <button 
            onClick={() => navigate('/createUser')}
            className="px-4 py-2 bg-[#b30000] text-white rounded-lg font-medium shadow-md shadow-red-200 hover:bg-[#990000] hover:shadow-lg flex items-center gap-2 whitespace-nowrap transition-all active:scale-95"
          >
            <FiPlus /> เพิ่มผู้ใช้
          </button>
        </div>
      </div>

      {activeFilterLabels.length > 0 && (
        <div className="px-6 py-3 flex flex-wrap gap-2 bg-gray-50 border-b border-gray-200 animate-slideDown">
          {activeFilterLabels.map((tag, idx) => (
            <FilterChip 
              key={`${tag.type}-${idx}`} 
              label={tag.label} 
              onRemove={() => handleRemoveFilter(tag.type, tag.value)} 
            />
          ))}
          <button onClick={handleClearFilters} className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline transition-colors px-2">ล้างทั้งหมด</button>
        </div>
      )}

      <div className="flex-grow overflow-hidden px-4 md:px-6 py-4 flex flex-col bg-gray-50/50 scrollbar-hide">
        <div className="hidden md:block flex-grow overflow-hidden flex flex-col">
          <UserTable 
            users={paginatedUsers} 
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        </div>

        <div className="md:hidden flex-grow overflow-y-auto pb-safe-area">
          <UserListMobile 
             users={paginatedUsers}
             loading={loading}
             onView={handleView}
             onEdit={handleEdit}
             onDelete={handleDeleteRequest}
          />
        </div>

        {filteredUsers.length > 0 && (
          <div className="mt-4 flex-shrink-0 bg-white md:bg-transparent p-2 rounded-lg shadow-sm md:shadow-none">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}
      </div>

      <FilterModal 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
        onClear={handleClearFilters}
      />
      
      <ConfirmDialog 
        open={popup.open} 
        type={popup.type} 
        message={popup.message} 
        onConfirm={handleConfirmDelete} 
        onClose={closePopup}
      />
    </div>
  );
};

export default memo(UserManagement);