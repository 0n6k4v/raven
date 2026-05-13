import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit, FiPlus, FiChevronLeft } from 'react-icons/fi';
import { FaCamera, FaTrash, FaUpload } from 'react-icons/fa';
import { UserManagementService } from '../../auth/services';
import ProfileCamera from '../components/ProfileCamera';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const CONSTANTS = {
  API_URL: `${import.meta.env.VITE_API_URL}/api`,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  TITLE_OPTIONS: ['นาย', 'นาง', 'นางสาว'],
  STATUS_OPTIONS: [
    { value: 'true', label: 'เปิดใช้งาน' },
    { value: 'false', label: 'ปิดใช้งาน' }
  ]
};

class UserValidator {
  static validate(data) {
    const errors = {};
    if (!data.title) errors.title = 'กรุณาเลือกคำนำหน้าชื่อ';
    if (!data.firstname) errors.firstname = 'กรุณากรอกชื่อจริง';
    if (!data.lastname) errors.lastname = 'กรุณากรอกนามสกุล';
    
    if (!data.email) {
      errors.email = 'กรุณากรอกอีเมล์';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'รูปแบบอีเมล์ไม่ถูกต้อง';
    }
    
    if (!data.role_id) errors.role_id = 'กรุณาเลือกประเภทผู้ใช้';
    
    if (data.password && data.password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    return errors;
  }

  static validateImage(file) {
    if (!file) return { valid: false, error: 'ไม่พบไฟล์' };
    if (!CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'รองรับเฉพาะไฟล์ JPG, PNG, และ WEBP เท่านั้น' };
    }
    if (file.size > CONSTANTS.MAX_FILE_SIZE) {
      return { valid: false, error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' };
    }
    return { valid: true };
  }
}

class UserUpdatePayload {
  static toFormData(data, profileImage, removeProfileImage) {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('firstname', data.firstname);
    fd.append('lastname', data.lastname);
    fd.append('email', data.email);
    if (data.password) fd.append('password', data.password);
    fd.append('department', data.department || '');
    fd.append('role_id', Number(data.role_id));
    fd.append('is_active', String(data.is_active)); 

    if (profileImage) {
      fd.append('profile_image', profileImage);
    } else if (removeProfileImage) {
      fd.append('remove_profile_image', 'true');
    }
    return fd;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useFetchData(id) {
  const [data, setData] = useState({ user: null, roles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        const [userEntity, rolesData] = await Promise.all([
          UserManagementService.fetchById(id, controller.signal),
          UserManagementService.fetchRoles(controller.signal)
        ]);
        setData({ user: userEntity, roles: rolesData });
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [id]);

  return { ...data, loading, error };
}

function useProfileImage() {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [shouldRemove, setShouldRemove] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileChange = useCallback((file) => {
    const validation = UserValidator.validateImage(file);
    if (!validation.valid) throw new Error(validation.error);

    setImageFile(file);
    setShouldRemove(false);
    
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const handleCameraCapture = useCallback((dataUrl) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const file = new File([u8arr], 'profile.jpg', { type: mime });

    setImageFile(file);
    setPreview(dataUrl);
    setShouldRemove(false);
    setShowCamera(false);
  }, []);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setPreview(null);
    setShouldRemove(true);
  }, []);

  return {
    imageFile, preview, setPreview, shouldRemove,
    showCamera, setShowCamera,
    handleFileChange, handleCameraCapture, removeImage
  };
}

function useUserForm(initialUser, id) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', firstname: '', lastname: '', email: '', password: '',
    department: '', role_id: '', is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (initialUser) {
      setFormData(prev => ({
        ...prev,
        title: initialUser.title || '',
        firstname: initialUser.firstName || '',
        lastname: initialUser.lastName || '',
        email: initialUser.email || '',
        department: initialUser.department || '',
        role_id: initialUser.roleId || '', 
        is_active: initialUser.isActive,
      }));
    }
  }, [initialUser]);

  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }, [errors]);

  const submit = useCallback(async (imageState) => {
    setErrors({});
    setStatus({ type: '', message: '' });

    const validationErrors = UserValidator.validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus({ type: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = UserUpdatePayload.toFormData(formData, imageState.imageFile, imageState.shouldRemove);
      await UserManagementService.updateUser(id, payload);
      setStatus({ type: 'success', message: 'บันทึกข้อมูลสำเร็จ' });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }, [formData, id, navigate]);

  return {
    formData, errors, submitting, status,
    handleChange, submit,
    cancel: () => navigate(-1)
  };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const InputField = memo(({ label, name, type = 'text', value, onChange, error, required, ...props }) => (
  <div className="space-y-1">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={name} name={name} type={type} value={value}
      onChange={e => onChange(name, e.target.value)}
      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] transition-all outline-none ${error ? 'border-red-500' : 'border-gray-300'}`}
      {...props}
    />
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
));

const SelectField = memo(({ label, name, value, onChange, options, error, required }) => (
  <div className="space-y-1">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={name} name={name} value={value}
      onChange={e => onChange(name, e.target.value)}
      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] bg-white outline-none ${error ? 'border-red-500' : 'border-gray-300'}`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
));

const ProfileAvatar = memo(({ src, initial, size = "md", onClick }) => {
  const sizeClass = size === 'sm' ? 'w-16 h-16 text-2xl' : 'w-24 h-24 text-4xl';
  return (
    <div 
      onClick={onClick}
      className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity`}
    >
      {src ? (
        <img src={src} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-[#990000]">{initial}</span>
      )}
    </div>
  );
});

const ImageUploader = memo(({ preview, initial, onUpload, onCamera, onRemove, hasImage }) => {
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFile = (e) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
    setShowMenu(false);
  };

  return (
    <div className="relative inline-block">
      <ProfileAvatar src={preview} initial={initial} onClick={() => {}} />
      <button 
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#990000] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#7a0000] transition-colors"
      >
        <FiPlus className="text-sm" />
      </button>

      {showMenu && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-lg py-1 z-20 w-40 border border-gray-100 animate-fadeIn">
          <label className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            <FaUpload className="mr-2" /> อัปโหลด
            <input 
              ref={fileInputRef} type="file" accept={CONSTANTS.ALLOWED_FILE_TYPES.join(',')} 
              className="hidden" onChange={handleFile} 
            />
          </label>
          <button onClick={() => { onCamera(); setShowMenu(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <FaCamera className="mr-2" /> ถ่ายรูป
          </button>
          {hasImage && (
            <button onClick={() => { onRemove(); setShowMenu(false); }} className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <FaTrash className="mr-2" /> ลบรูป
            </button>
          )}
        </div>
      )}
    </div>
  );
});

const ToastNotification = memo(({ type, message }) => {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${
      isSuccess ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
    }`}>
      <span>{message}</span>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const EditUserProfile = () => {
  const { id } = useParams();
  const { user, roles, loading, error: fetchError } = useFetchData(id);
  const { 
    formData, errors, submitting, status, 
    handleChange, submit, cancel 
  } = useUserForm(user, id);
  const imageState = useProfileImage();

  useEffect(() => {
    if (user?.avatarUrl && !imageState.preview && !imageState.shouldRemove) {
      imageState.setPreview(user.avatarUrl);
    }
  }, [user, imageState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    submit({ imageFile: imageState.imageFile, shouldRemove: imageState.shouldRemove });
  };

  if (loading) return <div className="flex items-center justify-center h-full bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#990000]"></div></div>;
  if (fetchError) return <div className="p-8 text-center text-red-500">Error: {fetchError}</div>;

  return (
    <>
      <form onSubmit={handleSubmit} className="h-full w-full bg-white md:bg-gray-50 flex flex-col overflow-hidden">
        <header className="bg-white px-4 py-4 flex items-center sticky top-0 z-10 border-b border-gray-200">
          <button type="button" onClick={cancel} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full md:hidden"><FiChevronLeft size={24} /></button>
          <div className="hidden md:block bg-red-50 p-2 rounded-lg mr-3"><FiEdit size={20} className="text-[#990000]" /></div>
          <h1 className="flex-1 text-center md:text-left text-lg font-semibold text-gray-900">แก้ไขโปรไฟล์</h1>
        </header>

        <main className="flex-1 overflow-y-auto md:p-8">
          <div className="w-full max-w-4xl mx-auto bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-200 p-6 md:p-8">
            <div className="space-y-6">
              <div className="flex flex-col items-center pb-6 border-b border-gray-200">
                <ImageUploader 
                  preview={imageState.preview}
                  initial={formData.firstname ? formData.firstname[0].toUpperCase() : ''}
                  onUpload={imageState.handleFileChange}
                  onCamera={() => imageState.setShowCamera(true)}
                  onRemove={imageState.removeImage}
                  hasImage={!!imageState.preview}
                />
                <div className="mt-3 text-center">
                  <h2 className="text-lg font-medium text-gray-900">{formData.title} {formData.firstname} {formData.lastname}</h2>
                  <p className="text-sm text-gray-500">{formData.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="คำนำหน้าชื่อ" name="title" value={formData.title} onChange={handleChange} required error={errors.title} options={[{value:'', label:'เลือกคำนำหน้า'}, ...CONSTANTS.TITLE_OPTIONS.map(t => ({value:t, label:t}))]} />
                <InputField label="อีเมล์" name="email" type="email" value={formData.email} onChange={handleChange} required error={errors.email} />
                <InputField label="ชื่อจริง" name="firstname" value={formData.firstname} onChange={handleChange} required error={errors.firstname} />
                <InputField label="นามสกุล" name="lastname" value={formData.lastname} onChange={handleChange} required error={errors.lastname} />
                <InputField label="รหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" error={errors.password} />
                <InputField label="แผนก" name="department" value={formData.department} onChange={handleChange} error={errors.department} />
                <SelectField label="ระดับผู้ใช้" name="role_id" value={formData.role_id} onChange={handleChange} required error={errors.role_id} options={[{value:'', label:'เลือกประเภทผู้ใช้'}, ...roles.map(r => ({value:r.id, label:r.role_name}))]} />
                <SelectField label="สถานะ" name="is_active" value={String(formData.is_active)} onChange={handleChange} required error={errors.is_active} options={CONSTANTS.STATUS_OPTIONS} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 mt-6 border-t border-gray-200">
              <button type="button" onClick={cancel} className="flex-1 md:flex-none px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">ยกเลิก</button>
              <button type="submit" disabled={submitting} className="flex-1 md:flex-none px-6 py-2.5 bg-[#990000] text-white rounded-lg hover:bg-[#7a0000] font-medium shadow-sm disabled:opacity-50">
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </main>
      </form>

      <ToastNotification type={status.type} message={status.message} />
      
      {imageState.showCamera && (
        <ProfileCamera
          onCapture={imageState.handleCameraCapture}
          onClose={() => imageState.setShowCamera(false)}
        />
      )}
    </>
  );
};

export default memo(EditUserProfile);