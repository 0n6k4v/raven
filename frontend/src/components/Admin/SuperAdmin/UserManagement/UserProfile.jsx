import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// ==================== UTILS ====================
const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Fetch error: ${res.status} ${res.statusText} ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

// ==================== CUSTOM HOOKS ====================
function useUser(id) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJson(`${BASE_URL}/users/${id}`);
        if (!cancelled) setUser(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  return { user, loading, error };
}

// ==================== PRESENTATIONAL / PERFORMANCE ====================
const Avatar = React.memo(function Avatar({ src, alt, size = 64, onClick, label }) {
  const classes = `rounded-full object-cover border cursor-pointer ${onClick ? 'focus:outline-none focus:ring-2 focus:ring-offset-2' : ''}`;
  const style = { width: size, height: size };
  return (
    <div role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} aria-label={label} onClick={onClick} onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}>
      {src ? <img src={src} alt={alt} style={style} className={classes} /> : <div style={style} className="rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 border border-gray-300">{(alt && alt[0]) || ''}</div>}
    </div>
  );
});

const FullscreenModal = React.memo(function FullscreenModal({ open, onClose, children, labelledBy }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
      <button
        ref={closeRef}
        type="button"
        aria-label="ปิด"
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gray-800 text-white text-xl leading-none rounded-full"
        onClick={onClose}
      >
        <FiX className="w-5 h-5" aria-hidden="true" focusable="false" />
      </button>
      <div className="max-w-full max-h-[80vh]">
        {children}
      </div>
    </div>
  );
});

// ==================== LAYOUT COMPONENTS ====================
const DesktopLayout = React.memo(function DesktopLayout({ user }) {
  const navigate = useNavigate();
  const [fullScreen, setFullScreen] = useState(false);

  const initial = useMemo(() => (user?.firstname ? user.firstname[0].toUpperCase() : ''), [user]);
  const hasProfileImage = Boolean(user?.profile_image_url);

  const onBack = useCallback(() => navigate(-1), [navigate]);
  const onToggleFull = useCallback(() => setFullScreen(v => !v), []);

  return (
    <>
      <div className="h-full flex flex-col" aria-label="User profile desktop">
        <div className="px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center mb-4">
            <div className="bg-gray-100 p-2 rounded-md mr-2" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-base font-medium text-gray-800">โปรไฟล์</h1>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-4xl w-full bg-white rounded-lg shadow p-6 mb-24">
            <div className="p-4">
              <div className="flex items-center pb-4 border-b border-gray-200 mb-4">
                <div className="mr-4 relative">
                  <Avatar src={user?.profile_image_url} alt={user?.firstname || 'User'} size={64} onClick={onToggleFull} label="ดูรูปโปรไฟล์เต็ม"/>
                </div>
                <div>
                  <h2 className="text-base font-medium text-gray-800">{user?.title} {user?.firstname} {user?.lastname}</h2>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                </div>
              </div>

              <section aria-labelledby="profile-info" >
                <h2 id="profile-info" className="text-base font-medium text-gray-700 mb-4">ข้อมูล</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">คำนำหน้าชื่อ</label>
                      <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none" value={user?.title || ''} readOnly aria-readonly="true" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ชื่อจริง</label>
                      <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none" value={user?.firstname || ''} readOnly />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">นามสกุล</label>
                      <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none" value={user?.lastname || ''} readOnly />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">อีเมล์</label>
                      <input type="email" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none" value={user?.email || ''} readOnly />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">รหัสผ่าน</label>
                      <input type="password" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none" value="********" readOnly aria-hidden="true" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ระดับผู้ใช้</label>
                      <div className="relative">
                        <select className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white focus:outline-none" value={user?.role?.role_name || ''} disabled aria-disabled="true">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">แผนก</label>
                      <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none" value={user?.department || ''} readOnly />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <button onClick={onBack} className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg transition z-50" aria-label="ย้อนกลับ">
          ย้อนกลับ
        </button>
      </div>

      <FullscreenModal open={fullScreen} onClose={onToggleFull} labelledBy="profile-info">
        {user?.profile_image_url ? <img src={user.profile_image_url} alt={`${user.firstname} full`} className="max-w-full max-h-[80vh] object-contain" /> : <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-7xl font-bold text-gray-600">{initial}</div>}
      </FullscreenModal>
    </>
  );
});

const MobileLayout = React.memo(function MobileLayout({ user }) {
  const navigate = useNavigate();
  const [fullScreen, setFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const initial = useMemo(() => (user?.firstname ? user.firstname[0].toUpperCase() : ''), [user]);
  const hasProfileImage = Boolean(user?.profile_image_url);

  const onBack = useCallback(() => navigate(-1), [navigate]);
  const onToggleFull = useCallback(() => setFullScreen(v => !v), []);
  const onCopyEmail = useCallback(async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  }, [user?.email]);

  return (
    <div className="bg-gray-50 min-h-screen pb-20 text-sm text-gray-700">
      <header className="bg-white px-4 py-3 flex items-center shadow-sm">
        <button onClick={onBack} className="p-2 rounded-md text-gray-700 hover:bg-gray-100" aria-label="ย้อนกลับ">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="flex-1 text-center font-semibold">โปรไฟล์</h1>
        <div className="w-8" aria-hidden="true" />
      </header>

      <main className="px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-6 flex flex-col items-center">
            <button onClick={onToggleFull} aria-label="ดูรูปโปรไฟล์เต็ม" className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full">
              {hasProfileImage
                ? <img src={user.profile_image_url} alt={`${user.firstname || 'User'} profile`} className="w-28 h-28 rounded-full object-cover border border-gray-100" />
                : <div className="w-28 h-28 rounded-full bg-blue-50 flex items-center justify-center text-3xl font-bold text-blue-600 border border-gray-100">{initial}</div>
              }
            </button>

            <div className="mt-4 text-center">
              <h2 className="text-lg font-semibold text-gray-800">{user?.title} {user?.firstname} {user?.lastname}</h2>
              <p className="text-xs text-gray-500 mt-1 break-words">{user?.department || '—'}</p>
            </div>
          </div>

          <div className="border-t border-gray-100">
            <dl className="divide-y divide-gray-100">
              <div className="flex justify-between items-center px-4 py-4">
                <dt className="text-xs text-gray-500">อีเมล์</dt>
                <dd className="flex items-center gap-3">
                  <span className="text-sm text-gray-800 break-words max-w-[60vw]">{user?.email || '—'}</span>
                  <button onClick={onCopyEmail} aria-label="คัดลอกอีเมล์" className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </dd>
              </div>

              <div className="flex justify-between items-center px-4 py-4">
                <dt className="text-xs text-gray-500">ระดับผู้ใช้</dt>
                <dd>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-800">
                    {user?.role?.role_name || '—'}
                  </span>
                </dd>
              </div>

              <div className="flex justify-between items-center px-4 py-4">
                <dt className="text-xs text-gray-500">คำนำหน้าชื่อ</dt>
                <dd className="text-sm text-gray-800">{user?.title || '—'}</dd>
              </div>

              <div className="flex justify-between items-center px-4 py-4">
                <dt className="text-xs text-gray-500">ชื่อจริง</dt>
                <dd className="text-sm text-gray-800">{user?.firstname || '—'}</dd>
              </div>

              <div className="flex justify-between items-center px-4 py-4">
                <dt className="text-xs text-gray-500">นามสกุล</dt>
                <dd className="text-sm text-gray-800">{user?.lastname || '—'}</dd>
              </div>

              <div className="flex justify-between items-center px-4 py-4">
                <dt className="text-xs text-gray-500">แผนก</dt>
                <dd className="text-sm text-gray-800">{user?.department || '—'}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-3 text-center" aria-live="polite">
          {copied && <span className="text-xs text-green-600">คัดลอกอีเมล์แล้ว</span>}
        </div>
      </main>

      <FullscreenModal open={fullScreen} onClose={onToggleFull} labelledBy="profile-info">
        {user?.profile_image_url
          ? <img src={user.profile_image_url} alt="Profile full" className="max-w-full max-h-full object-contain" />
          : <div className="w-64 h-64 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-6xl font-bold text-blue-500">{initial}</span></div>
        }
      </FullscreenModal>
    </div>
  );
});

// ==================== MAIN COMPONENT ====================
const UserProfile = () => {
  const { id } = useParams();
  const { user, loading, error } = useUser(id);

  if (loading) return <div className="p-8 text-center" role="status" aria-live="polite">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="p-8 text-center text-red-500" role="alert">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>;
  if (!user) return <div className="p-8 text-center text-gray-500">ไม่พบข้อมูลผู้ใช้</div>;

  return (
    <div className="flex-1 overflow-auto h-full w-full relative">
      <div className="h-full w-full bg-gray-50 flex flex-col">
        <div className="hidden md:flex h-full flex-col">
          <DesktopLayout user={user} />
        </div>
        <div className="md:hidden h-full">
          <MobileLayout user={user} />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;