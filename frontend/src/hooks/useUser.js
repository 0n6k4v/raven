import { useState, useEffect } from "react";

export function useUser() {
  const [user, setUser] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(`${import.meta.env.VITE_API_URL}/api/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!mounted) return;
        setUser(data ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const result = [user, setUser, isLoading];
  result.user = user;
  result.setUser = setUser;
  result.isLoading = isLoading;
  return result;
}