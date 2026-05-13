import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiX, FiCopy, FiCheck, FiUser, FiArrowLeft } from 'react-icons/fi';
import { UserManagementService } from '../../auth/services';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class ClipboardService {
  static async copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useFetchUser(id) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setUser(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    UserManagementService.fetchById(id, controller.signal)
      .then(setUser)
      .catch(err => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  return { user, loading, error };
}

function useProfileActions() {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const goBack = useCallback(() => navigate(-1), [navigate]);
  const toggleFullScreen = useCallback(() => setIsFullScreen(v => !v), []);

  const copyEmail = useCallback(async (email) => {
    const success = await ClipboardService.copyText(email);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, []);

  return { goBack, isCopied, copyEmail, isFullScreen, toggleFullScreen };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const BackButton = memo(({ onClick }) => (
  <button 
    onClick={onClick} 
    className="hidden md:block fixed bottom-8 right-8 bg-[#b30000] hover:bg-[#990000] text-white px-6 py-3 rounded-full shadow-lg transition-transform hover:scale-105 z-40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b30000]"
  >
    ย้อนกลับ
  </button>
));

const MobileHeader = memo(({ onClick, title }) => (
  <header className="bg-white px-4 py-3 flex items-center md:hidden sticky top-0 z-10 border-b border-gray-200">
    <button 
      onClick={onClick} 
      className="p-2 -ml-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
      aria-label="ย้อนกลับ"
    >
      <FiArrowLeft size={24} />
    </button>
    <h1 className="flex-1 text-center font-semibold text-gray-800 text-lg">{title}</h1>
    <div className="w-10" />
  </header>
));

const Avatar = memo(({ src, alt, initial, sizeClass = "w-28 h-28", onClick }) => {
  const commonClass = `${sizeClass} rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity`;
  
  if (src) {
    return <img src={src} alt={alt} className={`${commonClass} object-cover bg-gray-100`} onClick={onClick} />;
  }
  return (
    <div className={`${commonClass} bg-gray-100 text-gray-500`} onClick={onClick}>
      {initial}
    </div>
  );
});

const InfoItem = memo(({ label, value, action }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-gray-100 last:border-0">
    <dt className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">{label}</dt>
    <dd className="text-sm sm:text-base font-medium text-gray-900 flex items-center gap-2">
      <span className="break-all">{value || '—'}</span>
      {action}
    </dd>
  </div>
));

const ReadOnlyInput = memo(({ label, value }) => (
  <div className="w-full">
    <label className="block text-sm text-gray-600 mb-1">{label}</label>
    <div className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm">
      {value || '-'}
    </div>
  </div>
));

const FullscreenImageModal = memo(({ isOpen, onClose, src, alt, initial }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white p-2 bg-white/10 rounded-full">
        <FiX size={24} />
      </button>
      <div className="p-4 w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
         {src ? (
           <img src={src} alt={alt} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
         ) : (
           <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gray-800 flex items-center justify-center text-6xl sm:text-8xl font-bold text-gray-400 border-4 border-gray-700">
             {initial}
           </div>
         )}
      </div>
    </div>
  );
});

const ProfileHeader = memo(({ user, onAvatarClick }) => {
  return (
    <div className="flex flex-col items-center pb-6 border-b border-gray-100">
      <div className="relative mb-4">
        <Avatar 
          src={user.avatarUrl} 
          alt={user.fullName} 
          initial={user.initials} 
          onClick={onAvatarClick}
        />
        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
      </div>
      
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">{user.displayTitleName}</h2>
      <p className="text-sm text-gray-500 mt-1">{user.department || 'No Department'}</p>
      <div className="mt-3">
        <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-100">
          {user.role}
        </span>
      </div>
    </div>
  );
});

const ProfileDetailsGrid = memo(({ user }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
    <ReadOnlyInput label="คำนำหน้าชื่อ" value={user.title} />
    <ReadOnlyInput label="ชื่อจริง" value={user.firstName} />
    <ReadOnlyInput label="นามสกุล" value={user.lastName} />
    <ReadOnlyInput label="อีเมล" value={user.email} />
    <ReadOnlyInput label="ระดับผู้ใช้" value={user.role} />
    <ReadOnlyInput label="แผนก" value={user.department} />
  </div>
));

const ProfileDetailsList = memo(({ user, isCopied, onCopyEmail }) => (
  <dl className="mt-4 px-2">
    <InfoItem 
      label="อีเมล" 
      value={user.email} 
      action={user.email && (
        <button 
          onClick={() => onCopyEmail(user.email)}
          className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
          title="คัดลอกอีเมล"
        >
          {isCopied ? <FiCheck size={16} className="text-green-500" /> : <FiCopy size={16} />}
        </button>
      )}
    />
    <InfoItem label="ระดับผู้ใช้" value={user.role} />
    <InfoItem label="คำนำหน้าชื่อ" value={user.title} />
    <InfoItem label="ชื่อจริง" value={user.firstName} />
    <InfoItem label="นามสกุล" value={user.lastName} />
    <InfoItem label="แผนก" value={user.department} />
  </dl>
));

const ProfileLayout = memo(({ user, actions }) => (
  <div className="h-full w-full bg-white md:bg-gray-50 flex flex-col overflow-hidden">
    
    <MobileHeader onClick={actions.goBack} title="โปรไฟล์" />

    <div className="hidden md:flex flex-shrink-0 px-6 py-4 items-center gap-3 bg-white border-b border-gray-200 shadow-sm md:bg-transparent md:border-0 md:shadow-none">
       <div className="p-2 bg-white rounded-full shadow-sm text-gray-600 md:hidden lg:block"><FiUser size={24} /></div>
       <h1 className="text-xl font-bold text-gray-800">โปรไฟล์ผู้ใช้งาน</h1>
    </div>

    <main className="flex-1 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto md:p-6">
        
        <div className="bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 overflow-hidden min-h-full md:min-h-0">
          <div className="p-4 md:p-8">
            <ProfileHeader user={user} onAvatarClick={actions.toggleFullScreen} />
            
            <div className="hidden md:block">
              <ProfileDetailsGrid user={user} />
            </div>

            <div className="md:hidden">
              <ProfileDetailsList 
                user={user} 
                isCopied={actions.isCopied} 
                onCopyEmail={actions.copyEmail} 
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <BackButton onClick={actions.goBack} />

    <FullscreenImageModal 
      isOpen={actions.isFullScreen} 
      onClose={actions.toggleFullScreen}
      src={user.avatarUrl}
      alt={user.fullName}
      initial={user.initials}
    />
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const UserProfile = () => {
  const { id } = useParams();
  const { user, loading, error } = useFetchUser(id);
  const actions = useProfileActions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-gray-500 animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-red-700 rounded-full animate-spin mb-4"></div>
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 gap-4">
        <div className="text-red-500 text-lg font-medium">ไม่พบข้อมูลผู้ใช้ หรือเกิดข้อผิดพลาด</div>
        <button onClick={actions.goBack} className="text-blue-600 hover:underline">ย้อนกลับ</button>
      </div>
    );
  }

  return <ProfileLayout user={user} actions={actions} />;
};

export default UserProfile;