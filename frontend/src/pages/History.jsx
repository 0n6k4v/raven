import React, { memo, useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import UserHistory from '../components/History/UserHistory';
import AdminNarcoticHistory from '../components/History/AdminNarcoticHistory';

/* ========================= CONSTANTS ========================= */
const ROLE_IDS = {
    SUPERADMIN: 1,
    ADMIN: 2,
    USER: 3,
};

const NARCOTICS_DEPARTMENT = 'กลุ่มงานยาเสพติด';

/* ========================= UTILS ========================= */
function getHistoryComponentType(roleId) {
  if (roleId === ROLE_IDS.SUPERADMIN) return 'superadmin';
  if (roleId === ROLE_IDS.ADMIN) return 'admin';
  if (roleId === ROLE_IDS.USER) return 'user';
  return 'forbidden';
}

/* ========================= PRESENTATIONAL COMPONENT ========================= */
const ForbiddenAccess = memo(function ForbiddenAccess() {
  return (
    <div role="alert" aria-live="polite" className="text-center text-red-600 font-semibold mt-10">
      ไม่มีสิทธิ์เข้าถึง
    </div>
  );
});

/* ========================= MAIN COMPONENT ========================= */
const History = memo(function History() {
    const { user, isLoading } = useUser();

    const historyType = useMemo(() => getHistoryComponentType(user?.role?.id), [user?.role?.id]);

   if (isLoading) {
     return <div className="text-center mt-10">กำลังโหลด...</div>;
   }

   if (historyType === 'admin') {
    const dept = (user?.department || '').trim();
    if (dept === NARCOTICS_DEPARTMENT) return <AdminNarcoticHistory />;
  }
   if (historyType === 'user') return <UserHistory />;

   return <ForbiddenAccess />;
});

export default History;