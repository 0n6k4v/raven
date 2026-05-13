import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaImage, FaTrash, FaUpload } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';
import Dropdown from '../../../components/ui/Dropdown';
import ProfileCamera from '../components/ProfileCamera';
import { UserManagementService } from '../../auth/services';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class ImageProcessor {
  static dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  static async readPreview(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
}

class UserCreatePayload {
  static toFormData(form, profileImage) {
    const fd = new FormData();
    fd.append('title', form.title || '');
    fd.append('firstname', form.firstName || '');
    fd.append('lastname', form.lastName || '');
    fd.append('email', form.email || '');
    fd.append('password', form.password || '');
    fd.append('role_id', form.roleId || '');
    fd.append('department', form.position || '');
    if (profileImage) fd.append('profile_image', profileImage);
    return fd;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const DEFAULT_FORM = {
  title: '', firstName: '', lastName: '', email: '', password: '', position: '', roleId: '',
};

const useCreateUserLogic = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [roles, setRoles] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: null, success: null });
  
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    UserManagementService.fetchRoles(ctrl.signal)
      .then(data => setRoles(Array.isArray(data) ? data : []))
      .catch(err => err.name !== 'AbortError' && setStatus(s => ({...s, error: err.message})));
    return () => ctrl.abort();
  }, []);

  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    try {
      const payload = UserCreatePayload.toFormData(formData, imageFile);
      
      await UserManagementService.createUser(payload); 
      
      setStatus({ loading: false, error: null, success: 'สร้างผู้ใช้สำเร็จ' });
      setTimeout(() => navigate('/userManagement'), 1200);
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: null });
    }
  };

  return {
    formData, roles, status, imageFile, preview, showCamera, showFullScreen,
    setShowCamera, setShowFullScreen, handleChange, handleUpload: async (file) => {
        if (file) {
          setImageFile(file);
          const previewUrl = await ImageProcessor.readPreview(file);
          setPreview(previewUrl);
        }
    }, 
    handleCameraCapture: (base64Data) => {
        const file = ImageProcessor.dataURLtoFile(base64Data, 'profile.jpg');
        setImageFile(file);
        setPreview(base64Data);
        setShowCamera(false);
    }, 
    handleSubmit,
    handleCancel: () => navigate(-1),
    handleRemoveImage: () => { setImageFile(null); setPreview(null); }
  };
};

const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const FormRow = memo(({ label, children, error }) => (
  <div className="flex flex-col md:flex-row md:items-center w-full group">
    <label className="block text-sm mb-1 md:mb-0 md:w-32 flex-shrink-0 font-medium text-gray-700">
      {label}
    </label>
    <div className="flex-1 w-full">
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  </div>
));

const ImageContextMenu = memo(({ onUpload, onCamera, onRemove, hasImage, onClose }) => {
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  return (
    <div ref={ref} className="absolute top-10 right-0 bg-white shadow-lg rounded-md py-1 z-10 w-40 border border-gray-200 animate-fadeIn">
      <label className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
        <FaUpload className="mr-2" /> อัปโหลดรูป
        <input type="file" accept="image/*" className="hidden" onChange={e => onUpload(e.target.files[0])} />
      </label>
      <button type="button" onClick={onCamera} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        <FaCamera className="mr-2" /> ถ่ายรูป
      </button>
      {hasImage && (
        <button type="button" onClick={onRemove} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
          <FaTrash className="mr-2" /> ลบรูป
        </button>
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const CreateUser = () => {
  const logic = useCreateUserLogic();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden">
      <form onSubmit={logic.handleSubmit} className="h-full flex flex-col" autoComplete="off">
        
        <div className="flex-shrink-0 px-6 py-4 flex justify-between items-center bg-white border-b border-gray-200">
          <h1 className="text-lg md:text-xl font-bold text-gray-800">เพิ่มผู้ใช้ใหม่</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-0 md:p-6">
          <div className="w-full max-w-5xl mx-auto bg-white md:rounded-lg md:shadow-md p-4 md:p-8">
            
            <div className="flex justify-center mb-10">
              <div className="relative">
                <div 
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 cursor-pointer shadow-inner"
                  onClick={logic.preview ? () => logic.setShowFullScreen(true) : undefined}
                >
                  {logic.preview ? (
                    <img src={logic.preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <FaImage className="text-gray-300 text-3xl" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
                >
                  <FiPlus size={20} />
                </button>
                {showMenu && (
                  <ImageContextMenu 
                    onUpload={logic.handleUpload}
                    onCamera={() => logic.setShowCamera(true)}
                    onRemove={logic.handleRemoveImage}
                    hasImage={!!logic.preview}
                    onClose={() => setShowMenu(false)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-5">
              <FormRow label="คำนำหน้าชื่อ:">
                <Dropdown 
                  options={[{value:'นาย', label:'นาย'}, {value:'นาง', label:'นาง'}, {value:'นางสาว', label:'นางสาว'}]}
                  value={logic.formData.title}
                  onChange={(val) => logic.handleChange('title', val)}
                  placeholder="เลือกคำนำหน้า"
                  className="w-full border-gray-300"
                />
              </FormRow>

              <div className="flex flex-col md:flex-row gap-6">
                <FormRow label="ชื่อจริง:">
                  <input 
                    name="firstName" value={logic.formData.firstName}
                    onChange={(e) => logic.handleChange('firstName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="ระบุชื่อจริง"
                  />
                </FormRow>
                <FormRow label="นามสกุล:">
                  <input 
                    name="lastName" value={logic.formData.lastName}
                    onChange={(e) => logic.handleChange('lastName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="ระบุนามสกุล"
                  />
                </FormRow>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <FormRow label="อีเมล:">
                  <input 
                    name="email" type="email" value={logic.formData.email}
                    onChange={(e) => logic.handleChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="example@mail.com"
                  />
                </FormRow>
                <FormRow label="รหัสผ่าน:">
                  <input 
                    name="password" type="password" value={logic.formData.password}
                    onChange={(e) => logic.handleChange('password', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="ระบุรหัสผ่าน"
                    autoComplete="new-password"
                  />
                </FormRow>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <FormRow label="ตำแหน่ง:">
                  <Dropdown 
                    options={logic.roles.map(r => ({ value: String(r.id), label: r.role_name }))}
                    value={logic.formData.roleId}
                    onChange={(val) => logic.handleChange('roleId', val)}
                    placeholder="เลือกตำแหน่ง"
                    className="w-full border-gray-300"
                  />
                </FormRow>
                <FormRow label="ประเภทผู้ใช้:">
                  <Dropdown 
                    options={[{value:'สืบสวน', label:'สืบสวน'}, {value:'ปราบปราม', label:'ปราบปราม'}]}
                    value={logic.formData.position}
                    onChange={(val) => logic.handleChange('position', val)}
                    placeholder="เลือกประเภท"
                    className="w-full border-gray-300"
                  />
                </FormRow>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
              <button 
                type="button" 
                onClick={logic.handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                type="submit"
                disabled={logic.status.loading}
                className="px-8 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#b30000] shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {logic.status.loading ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </button>
            </div>

            {logic.status.error && <p className="text-red-500 text-center mt-4 text-sm">{logic.status.error}</p>}
            {logic.status.success && <p className="text-green-600 text-center mt-4 text-sm font-medium">{logic.status.success}</p>}
          </div>
        </div>
      </form>

      {logic.showFullScreen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => logic.setShowFullScreen(false)}>
          <img src={logic.preview} className="max-w-full max-h-full object-contain" alt="Full" />
        </div>
      )}

      {logic.showCamera && (
        <ProfileCamera
          onCapture={logic.handleCameraCapture}
          onClose={() => logic.setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default memo(CreateUser);