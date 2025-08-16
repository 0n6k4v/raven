import React, { memo, useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import UserHome from '../components/Home/UserHome';
import SuperAdminHome from '../components/Home/SuperAdminHome';

/* UTILS */
function getHomeComponentType(roleId) {
  if (roleId === 1) return 'superadmin';
  if (roleId === 3) return 'user';
  return 'forbidden';
}

/* CUSTOM HOOKS */
function useHomeComponentType(user) {
  return useMemo(() => getHomeComponentType(user?.role?.id), [user]);
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
  if (homeType === 'user') return <UserHome />;
  return <ForbiddenAccess />;
});

export default Home;