const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const handleResponse = async (res) => {
  if (!res.ok) throw new Error(`Location API Error: ${res.status}`);
  return res.json();
};

export const LocationApiService = {
    getProvinces: async () => {
    const res = await fetch(`${API_BASE_URL}/provinces`, { credentials: 'include' });
    return handleResponse(res);
  },

  getDistricts: async () => {
    const res = await fetch(`${API_BASE_URL}/districts`, { credentials: 'include' });
    const data = await handleResponse(res);
    return data.map(d => ({
      ...d,
      province_id: d.province_id ?? d.prov_id ?? null,
    }));
  },

  getSubdistricts: async () => {
    const res = await fetch(`${API_BASE_URL}/subdistricts`, { credentials: 'include' });
    const data = await handleResponse(res);
    return data.map(sd => ({
      ...sd,
      district_id: sd.district_id ?? null,
    }));
  },

  fetchAllMasterData: async () => {
    const [provinces, districts, subdistricts] = await Promise.all([
      LocationApiService.getProvinces(),
      LocationApiService.getDistricts(),
      LocationApiService.getSubdistricts()
    ]);
    return { provinces, districts, subdistricts };
  }
};