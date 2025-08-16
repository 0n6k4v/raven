import { useState, useEffect } from "react";

export function useUser() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/me`, { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) setUser(data);
            });
    }, []);

    return [user, setUser];
}