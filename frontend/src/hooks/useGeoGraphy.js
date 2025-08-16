import { useState, useEffect, useCallback } from 'react';

export function useGeoGraphy() {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [subdistricts, setSubdistricts] = useState([]);
    const [loading, setLoading] = useState({ provinces: false, districts: false, subdistricts: false });

    const fetchData = useCallback(async (endpoint, setter, loadingKey, mapFn) => {
        setLoading(prev => ({ ...prev, [loadingKey]: true }));
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setter(mapFn ? data.map(mapFn) : data);
            }
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
        } finally {
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    }, []);

    useEffect(() => {
        fetchData('provinces', setProvinces, 'provinces');
    }, [fetchData]);

    useEffect(() => {
        fetchData('districts', setDistricts, 'districts', d => ({
            ...d,
            province_id: d.province_id ?? d.prov_id ?? null,
        }));
    }, [fetchData]);

    useEffect(() => {
        fetchData('subdistricts', setSubdistricts, 'subdistricts', sd => ({
            ...sd,
            district_id: sd.district_id ?? null,
        }));
    }, [fetchData]);

    return { provinces, districts, subdistricts, loading };
}
