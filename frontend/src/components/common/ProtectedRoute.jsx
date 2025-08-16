import React, { useEffect, useRef, useState, memo } from 'react';
import { Navigate } from 'react-router-dom';

/* ========================= UTILS ========================= */
async function fetchIsAuthenticated(signal) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
      credentials: 'include',
      signal,
    });
    if (!res.ok) return false;
    await res.json();
    return true;
  } catch {
    return false;
  }
}

/* ========================= CUSTOM HOOKS ========================= */
function useAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();

    fetchIsAuthenticated(controller.signal).then((result) => {
      if (mounted.current) setIsAuthenticated(result);
    });

    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, []);

  return isAuthenticated;
}

/* ========================= MAIN COMPONENT ========================= */
const ProtectedRoute = memo(function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthCheck();

  if (isAuthenticated === null) return null;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
});

export default ProtectedRoute;