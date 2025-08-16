import { useCallback } from "react";

export function useLogout(setUser) {
    return useCallback(async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch {}
        setUser(null);
        window.location.href = "/login";
    }, [setUser]);
}