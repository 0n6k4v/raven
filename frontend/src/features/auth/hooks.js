import { useState, useEffect, useCallback } from "react";
import { AuthenticationService } from "./services";
import { AuthPolicy } from "./utils";

export function useUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async (signal = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const userEntity = await AuthenticationService.fetchCurrentUser(signal);
      setUser(userEntity);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthenticationService.logout();
    } finally {
      setUser(null);
      AuthenticationService.redirectToLogin();
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchUser(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    refetch: () => fetchUser(), 
    logout,
    isAuthenticated: AuthPolicy.isAuthenticated(user),
  };
}