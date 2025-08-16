import { useState, useEffect } from "react";

export function useDropdown() {
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (!showDropdown) return;
        const handleDocumentClick = () => setShowDropdown(false);
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleDocumentClick, { once: true });
        }, 10);
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleDocumentClick, { once: true });
        };
    }, [showDropdown]);

    return [showDropdown, setShowDropdown];
}