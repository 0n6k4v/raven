import React, { lazy, Suspense, memo } from 'react'
import { Route, Routes } from 'react-router-dom'

/* ========================= MAIN COMPONENT ========================= */

const Layout = lazy(() => import('./components/layout/Layout'))
const ProtectedRoute = lazy(() => import('./components/common/ProtectedRoute'))
const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const UserManagement = lazy(() => import('./pages/Admin/SuperAdmin/UserManagement'))
const UserProfile = lazy(() => import('./components/Admin/SuperAdmin/UserManagement/UserProfile'))
const Map = lazy(() => import('./pages/Map'))
const Camera = lazy(() => import('./pages/Camera'))

const App = memo(function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Public routes */}
        <Route path='/login' element={<Login />} />
        <Route path='/camera' element={<Camera />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path='/home' element={<Home />} />
          <Route path='/userManagement' element={<UserManagement />} />
          <Route path='/user-profile/:id' element={<UserProfile />} />
          <Route path='/map' element={<Map />} />
        </Route>

        {/* Fallback route for unmatched paths */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Suspense>
  );
});

export default App;