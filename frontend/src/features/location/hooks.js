import { useState, useEffect, useRef, useCallback  } from 'react';
import { LocationApiService } from './services';

export const useLocationOptions = () => {
  const [state, setState] = useState({
    provinces: [],
    districts: [],
    subdistricts: [],
    raw: {},
    isLoading: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    setState(prev => ({ ...prev, isLoading: true }));

    LocationApiService.fetchAllMasterData()
      .then(res => {
        if (isMounted) setState({ ...res, isLoading: false, error: null });
      })
      .catch(err => {
        if (isMounted) setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      });

    return () => { isMounted = false; };
  }, []);

  return state;
};

export const useGeoGraphy = () => {
  const isMounted = useRef(true);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  
  const [loading, setLoading] = useState({ 
    provinces: false, 
    districts: false, 
    subdistricts: false 
  });

  const fetchData = useCallback(async (key, serviceFn, setter) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const data = await serviceFn();
      if (isMounted.current) setter(data);
    } catch (error) {
      console.error(`[useGeoGraphy] fetch ${key} error`, error);
    } finally {
      if (isMounted.current) {
        setLoading(prev => ({ ...prev, [key]: false }));
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    fetchData('provinces', LocationApiService.getProvinces, setProvinces);
    fetchData('districts', LocationApiService.getDistricts, setDistricts);
    fetchData('subdistricts', LocationApiService.getSubdistricts, setSubdistricts);

    return () => { isMounted.current = false; };
  }, [fetchData]);

  return { provinces, districts, subdistricts, loading };
};