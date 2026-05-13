import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/index.jsx';
import { AuthProvider } from './features/auth/context';

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-screen"></div>
);

const App = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </Suspense>
  );
};

export default App;