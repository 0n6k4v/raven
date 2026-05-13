import React, { memo } from 'react';
import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context';
import { AuthPolicy } from '../utils';

const ForbiddenView = memo(function ForbiddenView() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Lock size={40} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-gray-500 mb-8">
          บัญชีของคุณไม่ได้รับอนุญาตให้เข้าใช้งานในส่วนงานนี้ <br />
          กรุณาติดต่อผู้ดูแลระบบเพื่อขอรับสิทธิ์
        </p>
        <button
          onClick={() => navigate(-1)}
          className="w-full py-4 px-6 bg-gray-900 text-white font-semibold rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} /> ย้อนกลับ
        </button>
      </div>
    </div>
  );
});

const RoleGuard = memo(function RoleGuard({ requiredDepartment, allowedRoles }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let hasAccess = false;

  if (requiredDepartment) {
    hasAccess = AuthPolicy.isDepartmentAdmin(user, requiredDepartment);
  } 
  else if (allowedRoles && allowedRoles.length > 0) {
    if (allowedRoles.includes('SUPER_ADMIN')) {
      hasAccess = !!user?.isSuperAdmin;
    }
  }

  if (!hasAccess) {
    return <ForbiddenView />;
  }

  return <Outlet />;
});

export default RoleGuard;