import { useState, useEffect, useCallback } from 'react';
import narcoticHistoryApiService from '../../../services/api/narcoticHistoryApiService';
import { formatDateToBE } from '../../../utils/dateUtils';

export const useNarcoticHistory = () => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ========================= MAPPING ========================= */
  const safeParseTimestamp = (dateStr) => {
    try {
      const d = dateStr ? new Date(dateStr) : null;
      return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
    } catch {
      return 0;
    }
  };

  const mapApiItem = (item) => {
    const dateToFormat = item.discovery_date || item.created_at || null;
    const date = formatDateToBE(dateToFormat);
    let time = '';
    if (item.discovery_time) {
      time = item.discovery_time.substring(0, 5);
    } else if (item.created_at && !item.discovery_date) {
      const cd = new Date(item.created_at);
      if (!Number.isNaN(cd.getTime())) {
        time = `${String(cd.getHours()).padStart(2, '0')}:${String(cd.getMinutes()).padStart(2, '0')}`;
      }
    }

    const { exhibit = {} } = item;
    const {
      narcotics: narcoticObjData = null,
      category: exhibitCategory,
      subcategory: exhibitSubcategory,
      images: exhibitImages = [],
    } = exhibit;

    const id = item.id || null;
    const category = exhibitCategory || 'ไม่ระบุหมวดหมู่';
    let exhibitName = 'ไม่ระบุชื่อ';
    const discovererName = item.discoverer_name || 'ไม่มีข้อมูล';
    const confidence = item.ai_confidence ?? null;
    const timestamp = safeParseTimestamp(dateToFormat);
    const province = item.province_name || 'ไม่ทราบจังหวัด';
    const district = item.district_name || 'ไม่ทราบอำเภอ/เขต';
    const subdistrict = item.subdistrict_name || 'ไม่ทราบตำบล/แขวง';

    // pick image
    let imageUrl = item.photo_url || '';
    if (!imageUrl && exhibitImages && Array.isArray(exhibitImages) && exhibitImages.length) {
      const sorted = [...exhibitImages].sort((a, b) => (a.priority || 999) - (b.priority || 999));
      imageUrl = sorted[0]?.image_url || imageUrl;
    }

    // derive exhibitName from narcotics if available
    if (narcoticObjData) {
      const narcotic = Array.isArray(narcoticObjData) ? narcoticObjData[0] : narcoticObjData;
      if (narcotic) {
        exhibitName = narcotic.characteristics || narcotic.drug_type || narcotic.drug_category || exhibitName;
      } else {
        exhibitName = exhibitSubcategory || exhibitCategory || exhibitName;
      }
    } else {
      exhibitName = exhibitSubcategory || exhibitCategory || exhibitName;
    }

    const locationParts = [];
    if (item.place_name) locationParts.push(item.place_name);
    if (item.subdistrict_name) locationParts.push(`ต.${item.subdistrict_name}`);
    if (item.district_name) locationParts.push(`อ.${item.district_name}`);
    if (item.province_name) locationParts.push(`จ.${item.province_name}`);

    const location = locationParts.join(', ');

    const addressParts = [];
    if (item.house_no) addressParts.push(`บ้านเลขที่ ${item.house_no}`);
    if (item.village_no) addressParts.push(`หมู่ ${item.village_no}`);
    if (item.alley) addressParts.push(`ซอย${item.alley}`);
    if (item.road) addressParts.push(`ถนน${item.road}`);
    if (addressParts.length) locationParts.push(addressParts.join(' '));

    const base = {
      id,
      date,
      time,
      category,
      image: imageUrl,
      name: exhibitName,
      location,
      discovererName,
      confidence,
      province,
      district,
      subdistrict,
      originalData: item,
      timestamp,
    };

    if (narcoticObjData) {
      const narcotic = Array.isArray(narcoticObjData) ? narcoticObjData[0] : narcoticObjData;
      const drugCategory = narcotic?.drug_category || 'ไม่มีข้อมูล';
      const drugType = narcotic?.drug_type || 'ไม่มีข้อมูล';
      return {
        ...base,
        drugCategory,
        drugType,
      };
    }

    return base;
  };

  // ดึงประวัติยาเสพติดทั้งหมด
  const fetchNarcoticHistories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await narcoticHistoryApiService.getAllNarcoticHistories();
      const payload = Array.isArray(raw) ? raw : [];
      const mapped = payload.map(mapApiItem).filter(Boolean).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setHistories(mapped);
      return mapped;
    } catch (err) {
      setError(err.message || 'Failed to fetch narcotic histories');
      console.error('Error in fetchNarcoticHistories:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ดึงประวัติยาเสพติดตาม ID
  const fetchNarcoticHistoryById = useCallback(async (historyId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await narcoticHistoryApiService.getNarcoticHistoryById(historyId);
      // map single item to same UI shape (return original if missing)
      return data ? mapApiItem(data) ?? data : null;
    } catch (err) {
      setError(err.message || 'Failed to fetch narcotic history');
      console.error('Error in fetchNarcoticHistoryById:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // สร้างประวัติยาเสพติดใหม่
  const createNarcoticHistory = useCallback(async (historyData) => {
    setLoading(true);
    setError(null);
    try {
      const newHistory = await narcoticHistoryApiService.createNarcoticHistory(historyData);
      setHistories(prev => [newHistory, ...prev]);
      return newHistory;
    } catch (err) {
      setError(err.message || 'Failed to create narcotic history');
      console.error('Error in createNarcoticHistory:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // อัพเดทประวัติยาเสพติด
  const updateNarcoticHistory = useCallback(async (historyId, historyData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedHistory = await narcoticHistoryApiService.updateNarcoticHistory(historyId, historyData);
      setHistories(prev => 
        prev.map(history => 
          history.id === historyId ? updatedHistory : history
        )
      );
      return updatedHistory;
    } catch (err) {
      setError(err.message || 'Failed to update narcotic history');
      console.error('Error in updateNarcoticHistory:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ลบประวัติยาเสพติด
  const deleteNarcoticHistory = useCallback(async (historyId) => {
    setLoading(true);
    setError(null);
    try {
      await narcoticHistoryApiService.deleteNarcoticHistory(historyId);
      setHistories(prev => prev.filter(history => history.id !== historyId));
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete narcotic history');
      console.error('Error in deleteNarcoticHistory:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ดึงประวัติยาเสพติดตาม exhibit ID
  const fetchNarcoticHistoriesByExhibit = useCallback(async (exhibitId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await narcoticHistoryApiService.getNarcoticHistoriesByExhibit(exhibitId);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch narcotic histories by exhibit');
      console.error('Error in fetchNarcoticHistoriesByExhibit:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ดึงประวัติยาเสพติดโดยผู้ใช้
  const fetchNarcoticHistoriesByUser = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await narcoticHistoryApiService.getNarcoticHistoriesByUser(userId);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch narcotic histories by user');
      console.error('Error in fetchNarcoticHistoriesByUser:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // รีเฟรชข้อมูล
  const refreshData = useCallback(() => {
    fetchNarcoticHistories();
  }, [fetchNarcoticHistories]);

  // กรองข้อมูลตามเงื่อนไข
  const filterHistories = useCallback((filterFn) => {
    return histories.filter(filterFn);
  }, [histories]);

  // ค้นหาประวัติ
  const searchHistories = useCallback((searchTerm) => {
    if (!searchTerm) return histories;
    
    return histories.filter(history => 
      history.exhibit?.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      history.subdistrict_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      history.district_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      history.province_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      history.discoverer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [histories]);

  // เรียงลำดับประวัติ
  const sortHistories = useCallback((sortBy = 'created_at', sortOrder = 'desc') => {
    return [...histories].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [histories]);

  // เคลียร์ error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    histories,
    loading,
    error,
    
    // Actions
    fetchNarcoticHistories,
    fetchNarcoticHistoryById,
    createNarcoticHistory,
    updateNarcoticHistory,
    deleteNarcoticHistory,
    fetchNarcoticHistoriesByExhibit,
    fetchNarcoticHistoriesByUser,
    refreshData,
    
    // Utilities
    filterHistories,
    searchHistories,
    sortHistories,
    clearError
  };
};

// Hook สำหรับดึงประวัติยาเสพติดเดียว
export const useNarcoticHistoryDetail = (historyId) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!historyId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await narcoticHistoryApiService.getNarcoticHistoryById(historyId);
      setHistory(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch narcotic history detail');
      console.error('Error in fetchHistory:', err);
    } finally {
      setLoading(false);
    }
  }, [historyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
    clearError: () => setError(null)
  };
};

export default useNarcoticHistory;