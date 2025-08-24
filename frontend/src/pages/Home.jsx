import React, { memo, useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import UserHome from '../components/Home/UserHome';
import SuperAdminHome from '../components/Home/SuperAdminHome';
import NarcoticsAdminHome from '../components/Home/NarcoticsAdminHome';

/* CONSTANTS */
const ROLE_IDS = {
    SUPERADMIN: 1,
    ADMIN: 2,
    USER: 3,
};

const NARCOTICS_DEPARTMENT = 'กลุ่มงานยาเสพติด';

/* UTILS */
function getHomeComponentType(roleId) {
  if (roleId === ROLE_IDS.SUPERADMIN) return 'superadmin';
  if (roleId === ROLE_IDS.ADMIN) return 'admin';
  if (roleId === ROLE_IDS.USER) return 'user';
  return 'forbidden';
}

/* CUSTOM HOOKS */
function useHomeComponentType(user) {
  return useMemo(() => getHomeComponentType(user?.role?.id), [user?.role?.id]);
}

/* PRESENTATIONAL COMPONENTS */
const ForbiddenAccess = memo(function ForbiddenAccess() {
  return (
    <div role="alert" aria-live="polite" className="text-center text-red-600 font-semibold mt-10">
      ไม่มีสิทธิ์เข้าถึง
    </div>
  );
});

/* MAIN COMPONENT */
const Home = memo(function Home() {
  const [user] = useUser();
  const homeType = useHomeComponentType(user);

  if (homeType === 'superadmin') return <SuperAdminHome />;

  if (homeType === 'admin') {
    const dept = (user?.department || '').trim();
    if (dept === NARCOTICS_DEPARTMENT) return <NarcoticsAdminHome />;
    return <ForbiddenAccess />;
  }

  if (homeType === 'user') return <UserHome />;

  return <ForbiddenAccess />;
});

export default Home;