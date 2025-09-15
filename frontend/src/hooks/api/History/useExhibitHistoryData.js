import { useState, useRef, useCallback, useEffect } from 'react';
import { formatDateToBE } from '../../../utils/dateUtils';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const parseJsonOrText = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return await response.json();
  return await response.text();
};

const mapHistoryItem = (item) => {
  const sourceDate = item.discovery_date || item.created_at;
  const formattedDate = formatDateToBE(sourceDate);

  let time = '';
  if (item.discovery_time) time = item.discovery_time.substring(0, 5);
  else if (item.created_at && !item.discovery_date) {
    try {
      const created = new Date(item.created_at);
      time = created.getHours().toString().padStart(2, '0') + ':' + created.getMinutes().toString().padStart(2, '0');
    } catch (e) { /* ignore invalid date */ }
  }

  const category = item.exhibit?.category || 'อาวุธปืน';

  let name = 'ไม่ระบุรุ่น';
  if (item.exhibit) {
    const firearms = item.exhibit.firearms;
    const firstFirearm = Array.isArray(firearms) ? firearms[0] : firearms;
    if (firstFirearm) {
      const parts = [firstFirearm.brand, firstFirearm.series, firstFirearm.model].filter(Boolean);
      name = parts.length ? parts.join(' ') : item.exhibit.subcategory || 'ไม่ระบุรุ่น';
    } else {
      name = item.exhibit.subcategory || item.exhibit.category || 'ไม่ระบุรุ่น';
    }
  }

  const placeSegments = [
    item.place_name,
    item.subdistrict_name && `ต.${item.subdistrict_name}`,
    item.district_name && `อ.${item.district_name}`,
    item.province_name && `จ.${item.province_name}`
  ].filter(Boolean);

  const addressSegments = [
    item.house_no && `บ้านเลขที่ ${item.house_no}`,
    item.village_no && `หมู่ ${item.village_no}`,
    item.alley && `ซอย${item.alley}`,
    item.road && `ถนน${item.road}`
  ].filter(Boolean);

  if (addressSegments.length) placeSegments.push(addressSegments.join(' '));
  const location = placeSegments.join(', ') || 'ไม่ระบุสถานที่';

  let image = item.photo_url || '';
  if (!image && item.exhibit?.images?.length) {
    const sorted = [...item.exhibit.images].sort((a, b) => (a.priority || 999) - (b.priority || 999));
    image = sorted[0]?.image_url || '';
  }

  let timestamp = 0;
  try { timestamp = sourceDate ? new Date(sourceDate).getTime() : 0; } catch (e) { /* ignore */ }

  return {
    id: item.id,
    date: formattedDate,
    time,
    category,
    image,
    name,
    place_name: item.place_name || 'ไม่ระบุชื่อสถานที่',
    location,
    discoverer_name: item.discoverer_name || 'ไม่ระบุ',
    modifier_name: item.modifier_name || '',
    created_at: item.created_at || '',
    updated_at: item.updated_at || '',
    created_by: item.created_by || null,
    discovered_by: item.discovered_by || 'ไม่ระบุ',
    timestamp,
    originalData: item
  };
};

const mapHttpStatusToMessage = (status, responseBody) => {
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  if (status === 403) return 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้';
  if (status === 404 && responseBody?.detail === 'No history records found for this exhibit') return 'empty';
  if (responseBody?.error) return responseBody.error;
  return 'ไม่สามารถโหลดข้อมูลประวัติได้ กรุณาลองใหม่อีกครั้ง';
};

const useExhibitHistoryData = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const ongoingRequestRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (ongoingRequestRef.current) ongoingRequestRef.current.abort();
    };
  }, []);

  const abortFetch = useCallback(() => {
    if (ongoingRequestRef.current) {
      ongoingRequestRef.current.abort();
      ongoingRequestRef.current = null;
    }
  }, []);

  const fetchExhibitHistoryData = useCallback(async (options = {}) => {
    const { exhibitId, userId } = options;
    if (!exhibitId) {
      setFetchError('ไม่พบรหัสวัตถุพยาน (Exhibit ID)');
      return { success: false, reason: 'no-id' };
    }

    abortFetch();
    const controller = new AbortController();
    ongoingRequestRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setFetchError(null);

    try {
      const url = userId
        ? `${BASE_URL}/history/exhibit/${exhibitId}/user/${userId}`
        : `${BASE_URL}/history/exhibit/${exhibitId}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal
      });

      if (signal.aborted) return { success: false, reason: 'aborted' };

      const body = await parseJsonOrText(response);

      if (!response.ok) {
        const mappedMessage = mapHttpStatusToMessage(response.status, body);
        if (mountedRef.current) {
          setItems([]);
          setFilteredItems([]);
          setFetchError(mappedMessage);
        }
        return response.status === 404 && mappedMessage === 'empty'
          ? { success: true, empty: true }
          : { success: false, reason: 'http-error', status: response.status };
      }

      if (!body) {
        if (mountedRef.current) {
          setItems([]);
          setFilteredItems([]);
          setFetchError('ไม่พบข้อมูลประวัติ');
        }
        return { success: false, reason: 'no-data' };
      }

      const rawList = Array.isArray(body) ? body : [body];
      const processed = rawList.map(mapHistoryItem).sort((a, b) => b.timestamp - a.timestamp);

      if (mountedRef.current) {
        setItems(processed);
        setFilteredItems(processed);
        setFetchError(null);
      }

      return { success: true, data: processed };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, reason: 'aborted' };
      console.error('fetchExhibitHistoryData error', err);
      if (mountedRef.current) {
        setItems([]);
        setFilteredItems([]);
        setFetchError('ไม่สามารถโหลดข้อมูลประวัติได้ กรุณาลองใหม่อีกครั้ง');
      }
      return { success: false, reason: 'exception', error: err };
    } finally {
      if (mountedRef.current) setLoading(false);
      ongoingRequestRef.current = null;
    }
  }, [abortFetch]);

  const handleDeleteHistory = useCallback(async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้?')) return { success: false, message: 'ยกเลิกการลบ' };

    try {
      const response = await fetch(`${BASE_URL}/history/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      const contentType = response.headers.get('content-type') || '';
      const body = contentType.includes('application/json') ? await response.json() : await response.text();

      if (response.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        setFilteredItems(prev => prev.filter(i => i.id !== id));
        return { success: true, message: 'ลบรายการสำเร็จ' };
      }

      const message = response.status === 401 || response.status === 403
        ? 'คุณไม่มีสิทธิ์ในการลบรายการนี้'
        : response.status === 404
        ? 'ไม่พบรายการที่ต้องการลบ'
        : (body?.detail || (typeof body === 'string' && body) || 'เกิดข้อผิดพลาดในการลบรายการ');

      return { success: false, message };
    } catch (err) {
      console.error('handleDeleteHistory error', err);
      return { success: false, message: 'เกิดข้อผิดพลาดในการลบรายการ' };
    }
  }, []);

  const goToPage = useCallback((pageNumber) => {
    const total = Math.ceil(filteredItems.length / rowsPerPage);
    if (pageNumber < 1 || pageNumber > total) return;
    setPage(pageNumber);
  }, [filteredItems.length, rowsPerPage]);

  const changeRowsPerPage = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  }, []);

  useEffect(() => { setPage(1); }, [filteredItems]);

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const lastIndex = page * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const currentPageItems = filteredItems.slice(firstIndex, lastIndex);

  return {
    // state
    data: items,
    filteredData: filteredItems,
    isLoading: loading,
    error: fetchError,
    currentPage: page,
    rowsPerPage,

    // pagination
    totalPages,
    indexOfFirstItem: firstIndex,
    indexOfLastItem: lastIndex,
    currentItems: currentPageItems,

    // actions
    fetchExhibitHistoryData,
    abortFetch,
    handleDeleteHistory,
    handlePageChange: goToPage,
    handleRowsPerPageChange: changeRowsPerPage,
    setFilteredData: setFilteredItems,

    // util
    setError: setFetchError
  };
};

export default useExhibitHistoryData;