import React, { lazy, Suspense, memo } from 'react'
import { Route, Routes } from 'react-router-dom'

/* ========================= MAIN COMPONENT ========================= */

const Layout = lazy(() => import('./components/layout/Layout'))
const Layout2 = lazy(() => import('./components/layout/Layout2'))
const ProtectedRoute = lazy(() => import('./components/common/ProtectedRoute'))
const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const CreateUser = lazy(() => import('./pages/Admin/SuperAdmin/CreateUser'))
const UserManagement = lazy(() => import('./pages/Admin/SuperAdmin/UserManagement'))
const UserProfile = lazy(() => import('./pages/Admin/SuperAdmin/UserProfile'))
const AdminNarcoticCatalog = lazy(() => import('./pages/Admin/NarcoticAdmin/AdminNarcoticCatalog'))
const CreateNarcotic = lazy(() => import('./pages/Admin/NarcoticAdmin/CreateNarcotic'))
const Map = lazy(() => import('./pages/Map'))
const Camera = lazy(() => import('./pages/Camera'))
const ImagePreview = lazy(() => import('./pages/ImagePreview'))

const App = memo(function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Public routes */}
        <Route path='/login' element={<Login />} />
        <Route path='/camera' element={<Camera />} />
        <Route path='/imagePreview' element={<ImagePreview />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Common Pages */}
          <Route path='/home' element={<Home />} />
          <Route path='/map' element={<Map />} />

          {/* Super Admin Pages */}
          <Route path='/createUser' element={<CreateUser />} />
          <Route path='/userManagement' element={<UserManagement />} />
          <Route path='/user-profile/:id' element={<UserProfile />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <Layout2 />
            </ProtectedRoute>
          }
        >
          {/* Narcotics Admin */}
          <Route path='/admin/narcotics/catalog-management' element={<AdminNarcoticCatalog />} />
          <Route path='/admin/narcotics/create-narcotic' element={<CreateNarcotic />} />
        </Route>

        {/* Fallback route for unmatched paths */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Suspense>
  );
});

export default App;