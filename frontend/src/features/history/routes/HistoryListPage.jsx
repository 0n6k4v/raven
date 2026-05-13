import React from 'react';
import { useUser } from '../../auth';
import UserHistory from '../components/UserHistory';
import AdminNarcoticHistory from '../components/AdminNarcoticHistory';
import { HistoryAccessPolicy, HISTORY_CONSTANTS } from '../utils';

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useHistoryView() {
  const { user, isLoading } = useUser();
  
  const viewType = React.useMemo(() => {
    if (isLoading || !user) return null;
    return HistoryAccessPolicy.determineViewType(user);
  }, [user, isLoading]);

  return { viewType, isLoading };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const LoadingState = React.memo(() => (
  <div role="status" aria-live="polite" className="flex justify-center items-center h-full min-h-[300px] bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      <span className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูล...</span>
    </div>
  </div>
));

const ForbiddenAccess = React.memo(() => (
  <div role="alert" aria-live="assertive" className="flex flex-col items-center justify-center h-full w-full p-4 bg-gray-50">
    <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg p-8 text-center">
      <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-red-100">
        <span className="text-3xl" role="img" aria-label="forbidden">🚫</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
      <p className="text-sm text-gray-500 leading-relaxed">
        บัญชีผู้ใช้ของคุณไม่ได้รับอนุญาตให้เข้าถึงประวัติส่วนนี้<br/>
        กรุณาติดต่อผู้ดูแลระบบหากมีข้อสงสัย
      </p>
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const HistoryListPage = () => {
  const { viewType, isLoading } = useHistoryView();

  if (isLoading) {
    return <LoadingState />;
  }

  switch (viewType) {
    case HISTORY_CONSTANTS.VIEW_TYPE.NARCOTIC_ADMIN:
      return <AdminNarcoticHistory />;
      
    case HISTORY_CONSTANTS.VIEW_TYPE.GENERAL_USER:
      return <UserHistory />;
      
    case HISTORY_CONSTANTS.VIEW_TYPE.FORBIDDEN:
    default:
      return <ForbiddenAccess />;
  }
};

export default React.memo(HistoryListPage);