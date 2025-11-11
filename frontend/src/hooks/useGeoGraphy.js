import { useState, useEffect, useCallback } from 'react';

export function useGeoGraphy() {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [subdistricts, setSubdistricts] = useState([]);
    const [loading, setLoading] = useState({ provinces: false, districts: false, subdistricts: false });

    const fetchData = useCallback(async (endpoint, setter, loadingKey, mapFn) => {
        console.debug(`[useGeoGraphy] fetch ${endpoint} start`);
        setLoading(prev => ({ ...prev, [loadingKey]: true }));
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, { credentials: 'include' });
            const text = await res.clone().text().catch(() => null);
            console.debug(`[useGeoGraphy] ${endpoint} response status=${res.status} bodyPreview=`, text ? text.slice(0,200) : null);
            if (res.ok) {
                const data = await res.json();
                setter(mapFn ? data.map(mapFn) : data);
            } else {
                console.warn(`[useGeoGraphy] ${endpoint} non-ok`, res.status);
            }
        } catch (error) {
            console.error(`[useGeoGraphy] fetch ${endpoint} error`, error);
        } finally {
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
            console.debug(`[useGeoGraphy] fetch ${endpoint} finished`);
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
