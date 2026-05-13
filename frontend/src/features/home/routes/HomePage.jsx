import React, { memo, useMemo } from 'react';
import { useUser } from '../../auth';
import UserHome from '../components/UserHome';
import SuperAdminHome from '../components/SuperAdminHome';
import NarcoticsAdminHome from '../components/NarcoticsAdminHome';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const CONSTANTS = {
  DEPARTMENT: {
    NARCOTICS: 'กลุ่มงานยาเสพติด',
  },
  VIEW_TYPE: {
    SUPERADMIN: 'SUPERADMIN',
    NARCOTIC_ADMIN: 'NARCOTIC_ADMIN',
    GENERAL_USER: 'GENERAL_USER',
    FORBIDDEN: 'FORBIDDEN',
  },
};

class HomeAccessPolicy {
  static determineViewType(user) {
    if (!user || !user.isLoggedIn) return CONSTANTS.VIEW_TYPE.FORBIDDEN;

    if (user.isSuperAdmin) {
      return CONSTANTS.VIEW_TYPE.SUPERADMIN;
    }

    if (
      user.isAdmin &&
      user.department === CONSTANTS.DEPARTMENT.NARCOTICS
    ) {
      return CONSTANTS.VIEW_TYPE.NARCOTIC_ADMIN;
    }

    if (user.isUser || user.isAdmin) {
      return CONSTANTS.VIEW_TYPE.GENERAL_USER;
    }

    return CONSTANTS.VIEW_TYPE.FORBIDDEN;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useHomeView() {
  const { user, isLoading } = useUser();

  const viewType = useMemo(() => {
    if (isLoading || !user) return null;

    return HomeAccessPolicy.determineViewType(user);
  }, [user, isLoading]);

  return { viewType, isLoading };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const LoadingState = memo(() => (
  <div role="status" aria-live="polite" className="flex justify-center items-center h-screen bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      <span className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูล...</span>
    </div>
  </div>
));

const ForbiddenAccess = memo(() => (
  <div role="alert" aria-live="assertive" className="flex flex-col items-center justify-center h-screen p-4 bg-gray-50">
    <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg p-8 text-center">
      <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-red-100">
        <span className="text-3xl" role="img" aria-label="forbidden">🚫</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
      <p className="text-sm text-gray-500 leading-relaxed">
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หรือบทบาทของคุณไม่ถูกต้อง<br/>
        กรุณาติดต่อผู้ดูแลระบบ
      </p>
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const HomePage = () => {
  const { viewType, isLoading } = useHomeView();

  if (isLoading) {
    return <LoadingState />;
  }

  switch (viewType) {
    case CONSTANTS.VIEW_TYPE.SUPERADMIN:
      return <SuperAdminHome />;

    case CONSTANTS.VIEW_TYPE.NARCOTIC_ADMIN:
      return <NarcoticsAdminHome />;

    case CONSTANTS.VIEW_TYPE.GENERAL_USER:
      return <UserHome />;

    case CONSTANTS.VIEW_TYPE.FORBIDDEN:
    default:
      return <ForbiddenAccess />;
  }
};

export default memo(HomePage);