import React, { lazy } from 'react';
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';
import RoleGuard from '../features/auth/routes/RoleGuard';
import { AUTH_DEPARTMENTS } from '../features/auth/utils';
const Layout = lazy(() => import('../components/layout/Layout'));
const Layout2 = lazy(() => import('../components/layout/Layout2'));
const Layout3 = lazy(() => import('../components/layout/Layout3'));
const ProtectedRoute = lazy(() => import('../features/auth/routes/ProtectedRoute'));
const LoginPage = lazy(() => import('../features/auth/routes/LoginPage'));
const HomePage = lazy(() => import('../features/home/routes/HomePage'));
const Map = lazy(() => import('../features/operation/routes/MapPage'));
const Camera = lazy(() => import('../features/operation/routes/CameraPage'));
const ImagePreview = lazy(() => import('../features/operation/routes/ImagePreviewPage'));
const CandidateShowPage = lazy(() => import('../features/evidence/routes/CandidateShowPage'));
const CreateUserPage = lazy(() => import('../features/user/routes/CreateUserPage'));
const UserManagementPage = lazy(() => import('../features/user/routes/UserManagementPage'));
const UserProfilePage = lazy(() => import('../features/user/routes/UserProfilePage'));
const EditUserPage = lazy(() => import('../features/user/routes/EditUserPage'));
const NarcoticCatalogPage = lazy(() => import('../features/narcotic/routes/NarcoticCatalogPage'));
const CreateNarcoticPage = lazy(() => import('../features/narcotic/routes/CreateNarcoticPage'));
const HistoryListPage = lazy(() => import('../features/history/routes/HistoryListPage'));
const EvidenceHistoryPage = lazy(() => import('../features/evidence/routes/EvidenceHistoryPage'));
const EvidenceProfilePage = lazy(() => import('../features/evidence/routes/EvidenceProfilePage'));
const SaveToHistoryPage = lazy(() => import('../features/evidence/routes/SaveToHistoryPage'));

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* ---------------- Public Routes ---------------- */}
      <Route path="/login" element={<LoginPage />} />

      {/* ---------------- Protected Standalone Routes ---------------- */}
      <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
        <Route path="/camera" element={<Camera />} />
        <Route path="/imagePreview" element={<ImagePreview />} />
        <Route path="/candidateShow" element={<CandidateShowPage />} />
      </Route>

      {/* ---------------- Layout 1 ---------------- */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Common */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/map" element={<Map />} />

        {/* Super Admin */}
        <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/userManagement" element={<UserManagementPage />} />
        </Route>
      </Route>

      {/* ---------------- Layout 2 ---------------- */}
      <Route
        element={
          <ProtectedRoute>
            <Layout2 />
          </ProtectedRoute>
        }
      >
      </Route>

      {/* ---------------- Layout 3 ---------------- */}
      <Route
        element={
          <ProtectedRoute>
            <Layout3 />
          </ProtectedRoute>
        }
      >
        {/* Super Admin */}
        <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/createUser" element={<CreateUserPage />} />
          <Route path="/user-profile/:id" element={<UserProfilePage />} />
          <Route path="/edit-user/:id" element={<EditUserPage />} />
        </Route>

        {/* Evidence Profile Sub-routes */}
        <Route path="/evidenceProfile" element={<EvidenceProfilePage />} />
        <Route path="/evidenceProfile/gallery" element={<EvidenceProfilePage />} />
        <Route path="/evidenceProfile/history" element={<EvidenceProfilePage />} />
        <Route path="/evidenceProfile/map" element={<EvidenceProfilePage />} />
        <Route path="/evidenceProfile/save-to-record" element={<SaveToHistoryPage />} />
        
        {/* Admin Narcotic Only */}
        <Route element={<RoleGuard requiredDepartment={AUTH_DEPARTMENTS.NARCOTICS} />}>
          <Route path="/admin/narcotics/create-narcotic" element={<CreateNarcoticPage />} />
          <Route path="/admin/narcotics/catalog-management" element={<NarcoticCatalogPage />} />
        </Route>

        {/* History */}
        <Route path="/history" element={<HistoryListPage />} />
        <Route path="/history/detail" element={<EvidenceHistoryPage />} />
      </Route>

      {/* ---------------- Fallback ---------------- */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;