import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaImage, FaTrash, FaUpload } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';
import Dropdown from '../../../components/common/Dropdown';
import ProfileCamera from '../../../components/Admin/SuperAdmin/UserProfile.jsx/ProfileCamera';

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const DEFAULT_FORM = {
  idNumber: '',
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  position: '',
  roleId: '',
};
const TITLE_OPTIONS = [
  { value: 'นาย', label: 'นาย' },
  { value: 'นาง', label: 'นาง' },
  { value: 'นางสาว', label: 'นางสาว' },
];

const POSITION_OPTIONS = [
  { value: 'เจ้าหน้าที่หน้างาน', label: 'เจ้าหน้าที่หน้างาน' },
  { value: 'กลุ่มงานอาวุธปืน', label: 'กลุ่มงานอาวุธปืน' },
  { value: 'กลุ่มงานยาเสพัด', label: 'กลุ่มงานยาเสพัด' },
];

const POSITION_OPTIONS_MOBILE = POSITION_OPTIONS.map(o => ({ ...o }));

// ==================== UTILS ====================
const buildUserFormData = (form, profileImage) => {
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
};

const parseJsonSafe = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

// ==================== CUSTOM HOOKS ====================
const useRoles = (baseUrl) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    const fetchRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL}/roles`, { signal: ac.signal });
        if (!res.ok) {
          const payload = await parseJsonSafe(res);
          throw new Error(payload?.detail || payload?.message || 'Failed to load roles');
        }
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };
    fetchRoles();
    return () => ac.abort();
  }, [baseUrl]);

  return { roles, loading, error };
};

const useFormState = (initial = DEFAULT_FORM) => {
  const [formData, setFormData] = useState(initial);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const reset = useCallback(() => setFormData(initial), [initial]);

  return { formData, setFormData, handleChange, reset };
};

// ==================== PRESENTATIONAL / PERFORMANCE ====================
const ImageMenu = React.memo(({ onUpload, onOpenCamera, onRemove, hasPreview }) => {
  return (
    <div className="absolute top-10 right-0 bg-white shadow-lg rounded-md py-1 z-10 w-36" role="menu" aria-label="Image menu">
      <label className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" role="menuitem">
        <div className="flex items-center">
          <FaUpload className="mr-2" size={14} />
          <span>อัปโหลดรูป</span>
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
      </label>

      <button
        type="button"
        onClick={onOpenCamera}
        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
        role="menuitem"
      >
        <div className="flex items-center">
          <FaCamera className="mr-2" size={14} />
          <span>ถ่ายรูป</span>
        </div>
      </button>

      {hasPreview && (
        <button type="button" onClick={onRemove} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-left" role="menuitem">
          <div className="flex items-center">
            <FaTrash className="mr-2" size={14} />
            <span>ลบรูปโปรไฟล์</span>
          </div>
        </button>
      )}
    </div>
  );
});

const DesktopLayout = React.memo(({
  formData, handleChange, handleSubmit, handleCancel, roles, loading, handleImageChange, handleRemoveImage, profilePreview,
  onOpenCamera
}) => {
  const [showImageMenu, setShowImageMenu] = useState(false);
  const imageMenuRef = useRef(null);

  useEffect(() => {
    if (!showImageMenu) return;
    const onPointer = (e) => {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target)) {
        setShowImageMenu(false);
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') setShowImageMenu(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [showImageMenu]);

  return (
    <div className="h-full flex flex-col" aria-label="create-user-desktop">
      <div className="px-6 py-4 flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-bold">เพิ่มผู้ใช้ใหม่</h1>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow p-6 mb-16">
          <h2 className="text-lg font-medium mb-6">กรอกข้อมูล</h2>

          <div className="flex justify-center mb-6">
            <div className="relative" ref={imageMenuRef}>
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300" aria-hidden={!profilePreview}>
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <FaImage className="text-gray-400 text-3xl" aria-hidden />
                )}
              </div>
              <div className="absolute bottom-0 right-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowImageMenu((s) => !s)}
                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white"
                    aria-expanded={showImageMenu}
                    aria-haspopup="menu"
                  >
                    <FiPlus className="text-lg" />
                  </button>
                  {showImageMenu && (
                    <ImageMenu
                      onUpload={(e) => { handleImageChange(e); setShowImageMenu(false); }}
                      onOpenCamera={() => { setShowImageMenu(false); onOpenCamera && onOpenCamera(); }}
                      onRemove={() => { handleRemoveImage(); setShowImageMenu(false); }}
                      hasPreview={!!profilePreview}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-label="create-user-form-desktop"
            autoComplete="off"
          >
            <input type="text" name="fake-username" autoComplete="username" style={{ display: 'none' }} />
            <input type="password" name="fake-password" autoComplete="new-password" style={{ display: 'none' }} />

            <div className="flex items-center">
              <label htmlFor="title" className="w-32 text-sm">คำนำหน้าชื่อ:</label>
              <div className="w-72 relative">
                <Dropdown
                  id="title"
                  placeholder="เลือกคำนำหน้าชื่อ"
                  options={TITLE_OPTIONS}
                  value={formData.title}
                  onChange={(val) => handleChange({ target: { name: 'title', value: val } })}
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/2 flex items-center">
                <label htmlFor="firstName" className="w-32 text-sm">ชื่อจริง:</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="ระบุชื่อจริง"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 placeholder-gray-400 text-gray-700 bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="w-1/2 flex items-center">
                <label htmlFor="lastName" className="w-32 text-sm">นามสกุล:</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="ระบุนามสกุล"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 placeholder-gray-400 text-gray-700 bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/2 flex items-center">
                <label htmlFor="email" className="w-32 text-sm">อีเมล:</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="ระบุอีเมล"
                  autoComplete="off"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 placeholder-gray-400 text-gray-700 bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="w-1/2 flex items-center">
                <label htmlFor="password" className="w-32 text-sm">รหัสผ่าน:</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="ระบุรหัสผ่าน"
                  autoComplete="new-password"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 placeholder-gray-400 text-gray-700 bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/2 flex items-center">
                <label htmlFor="roleId" className="w-32 text-sm">ตำแหน่ง:</label>
                <div className="flex-1 relative">
                  <Dropdown
                    id="roleId"
                    placeholder="ตำแหน่ง"
                    options={roles.map(r => ({ value: String(r.id), label: r.role_name }))}
                    value={formData.roleId}
                    onChange={(val) => handleChange({ target: { name: 'roleId', value: val } })}
                    disabled={loading}
                    className="text-black border-gray-300"
                  />
                </div>
              </div>

              <div className="w-1/2 flex items-center">
                <label htmlFor="position" className="w-32 text-sm">ประเภทผู้ใช้:</label>
                <div className="flex-1 relative">
                  <Dropdown
                    id="position"
                    placeholder="เลือกประเภท"
                    options={POSITION_OPTIONS}
                    value={formData.position}
                    onChange={(val) => handleChange({ target: { name: 'position', value: val } })}
                    className="border-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" className="px-6 py-2 border border-red-500 text-red-500 rounded" onClick={handleCancel}>ยกเลิก</button>
              <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded">ยืนยัน</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

const MobileLayout = React.memo(({
  formData, handleChange, handleSubmit, handleCancel, roles, loading, handleImageChange, handleRemoveImage, profilePreview,
  onOpenCamera
}) => {
   const [showImageMenu, setShowImageMenu] = useState(false);
   const imageMenuRef = useRef(null);

   useEffect(() => {
     if (!showImageMenu) return;
     const onPointer = (e) => {
       if (imageMenuRef.current && !imageMenuRef.current.contains(e.target)) {
         setShowImageMenu(false);
       }
     };
     const onKey = (e) => { if (e.key === 'Escape') setShowImageMenu(false); };
     document.addEventListener('pointerdown', onPointer);
     document.addEventListener('keydown', onKey);
     return () => {
       document.removeEventListener('pointerdown', onPointer);
       document.removeEventListener('keydown', onKey);
     };
   }, [showImageMenu]);

   return (
     <div className="h-full flex flex-col" aria-label="create-user-mobile">
       <div className="flex justify-between items-center flex-shrink-0 px-6 py-3 border-b-2 border-gray-200 bg-white">
         <h1 className="text-lg font-bold">เพิ่มผู้ใช้ใหม่</h1>
       </div>
       <div className="flex-1 flex flex-col items-center justify-center bg-white">
         <div className="w-full py-4 flex justify-center">
           <div className="relative" ref={imageMenuRef}>
             <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
               {profilePreview ? <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" /> : <FaImage className="text-gray-400 text-3xl" />}
             </div>
             <div className="absolute bottom-0 right-0">
               <div className="relative">
                 <button type="button" onClick={() => setShowImageMenu((s) => !s)} className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white" aria-expanded={showImageMenu} aria-haspopup="menu">
                   <FiPlus className="text-lg" />
                 </button>
                 {showImageMenu && (
                   <ImageMenu
                     onUpload={(e) => { handleImageChange(e); setShowImageMenu(false); }}
                     onOpenCamera={() => { setShowImageMenu(false); onOpenCamera && onOpenCamera(); }}
                     onRemove={() => { handleRemoveImage(); setShowImageMenu(false); }}
                     hasPreview={!!profilePreview}
                   />
                 )}
               </div>
             </div>
           </div>
         </div>

         <form onSubmit={handleSubmit} className="w-full h-full max-w-md p-4 space-y-4" aria-label="create-user-form-mobile" autoComplete="off">
           <input type="text" name="fake-username-mobile" autoComplete="username" style={{ display: 'none' }} />
           <input type="password" name="fake-password-mobile" autoComplete="new-password" style={{ display: 'none' }} />

           <div>
             <label className="block text-sm mb-1" htmlFor="title-mobile">คำนำหน้าชื่อ</label>
             <Dropdown
               id="title-mobile"
               placeholder="เลือกคำนำหน้าชื่อ"
               options={TITLE_OPTIONS}
               value={formData.title}
               onChange={(val) => handleChange({ target: { name: 'title', value: val } })}
               className="border-gray-300"
             />
           </div>
           <div>
             <label className="block text-sm mb-1" htmlFor="firstName-mobile">ชื่อจริง</label>
             <input
               id="firstName-mobile"
               type="text"
               name="firstName"
               placeholder="ระบุชื่อจริง"
               className="w-full border border-gray-300 rounded px-3 py-2 placeholder-gray-400 text-gray-700 bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
               value={formData.firstName}
               onChange={handleChange}
             />
           </div>
           <div>
             <label className="block text-sm mb-1" htmlFor="lastName-mobile">นามสกุล</label>
             <input
               id="lastName-mobile"
               type="text"
               name="lastName"
               placeholder="ระบุนามสกุล"
               className="w-full border border-gray-300 rounded px-3 py-2 placeholder-gray-400 text-gray-700 bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
               value={formData.lastName}
               onChange={handleChange}
             />
           </div>
           <div>
             <label className="block text-sm mb-1" htmlFor="email-mobile">อีเมล</label>
             <input
               id="email-mobile"
               type="email"
               name="email"
               placeholder="ระบุอีเมล"
               autoComplete="off"
               className="w-full border border-gray-300 rounded px-3 py-2 placeholder-gray-400 text-gray-700 bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
               value={formData.email}
               onChange={handleChange}
             />
           </div>
           <div>
             <label className="block text-sm mb-1" htmlFor="password-mobile">รหัสผ่าน</label>
             <input
               id="password-mobile"
               type="password"
               name="password"
               placeholder="ระบุรหัสผ่าน"
               autoComplete="new-password"
               className="w-full border border-gray-300 rounded px-3 py-2 placeholder-gray-400 text-gray-700 bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
               value={formData.password}
               onChange={handleChange}
             />
           </div>
           <div>
             <label className="block text-sm mb-1" htmlFor="role-mobile">ตำแหน่ง</label>
             <Dropdown
               id="role-mobile"
               placeholder="ตำแหน่ง"
               options={roles.map(r => ({ value: String(r.id), label: r.role_name }))}
               value={formData.roleId}
               onChange={(val) => handleChange({ target: { name: 'roleId', value: val } })}
               disabled={loading}
               className="border-gray-300"
             />
           </div>
           <div>
             <label className="block text-sm mb-1" htmlFor="position-mobile">ประเภทผู้ใช้</label>
             <Dropdown
               id="position-mobile"
               placeholder="เลือกประเภทผู้ใช้"
               options={POSITION_OPTIONS_MOBILE}
               value={formData.position}
               onChange={(val) => handleChange({ target: { name: 'position', value: val } })}
               className="border-gray-300"
             />
           </div>
           <div className="flex justify-end space-x-2 pt-2">
             <button type="button" className="px-4 py-2 border border-red-500 text-red-500 rounded text-sm" onClick={handleCancel}>ยกเลิก</button>
             <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded text-sm">ยืนยัน</button>
           </div>
         </form>
       </div>
     </div>
   );
});

// ==================== MAIN COMPONENT ====================
const CreateUser = () => {
  const { formData, setFormData, handleChange, reset } = useFormState(DEFAULT_FORM);
  const { roles, loading: rolesLoading, error: rolesError } = useRoles(BASE_URL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (rolesError) setError(rolesError);
  }, [rolesError]);

  const handleImageChange = useCallback((e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setProfileImage(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // helper: convert dataURL -> File
  const dataURLtoFile = useCallback((dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }, []);

  const handleCameraCapture = useCallback((imageData) => {
    // imageData is base64 data URL
    const file = dataURLtoFile(imageData, 'profile.jpg');
    setProfileImage(file);
    setProfilePreview(imageData);
    setShowCamera(false);
  }, [dataURLtoFile]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const fd = buildUserFormData(formData, profileImage);
      const res = await fetch(`${BASE_URL}/users/create`, {
        method: 'POST',
        body: fd,
      });
      const payload = await parseJsonSafe(res);
      if (!res.ok) throw new Error(payload?.detail || payload?.message || 'เกิดข้อผิดพลาด');
      setSuccess('สร้างผู้ใช้สำเร็จ');
      reset();
      handleRemoveImage();
      setTimeout(() => navigate('/userManagementTable'), 1200);
    } catch (err) {
      setError(err?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [formData, profileImage, navigate, reset, handleRemoveImage]);

  const handleCancel = useCallback(() => navigate(-1), [navigate]);

  const layoutProps = useMemo(() => ({
    formData,
    handleChange,
    handleSubmit,
    handleCancel,
    roles,
    loading: rolesLoading || loading,
    handleImageChange,
    handleRemoveImage,
    profilePreview,
    onOpenCamera: () => setShowCamera(true),
  }), [formData, handleChange, handleSubmit, handleCancel, roles, rolesLoading, loading, handleImageChange, handleRemoveImage, profilePreview]);

  return (
    <div className="flex-1 overflow-auto h-full w-full">
      <div className="h-full w-full bg-gray-50 flex flex-col">
        <div className="hidden md:flex h-full flex-col">
          <DesktopLayout {...layoutProps} />
        </div>
        <div className="block md:hidden w-full h-full">
          <MobileLayout {...layoutProps} />
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" aria-hidden />

        {error && <div className="text-red-500 p-2 text-center" role="alert">{error}</div>}
        {success && <div className="text-green-500 p-2 text-center" role="status">{success}</div>}
      </div>

      {showCamera && (
        <ProfileCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default CreateUser;