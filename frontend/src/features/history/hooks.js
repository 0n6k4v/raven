import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { HistoryApiService } from './services';
import { 
  HistoryFilterService, 
  HistoryAccessPolicy, 
  HISTORY_CONSTANTS 
} from './utils';
import { HistoryItemEntity } from './entities';

export const useHistoryData = (user, evidence = null) => {
  const routerLocation = useLocation();

  const ongoingRequestRef = useRef(null);
  const isMounted = useRef(true);

  const [rawData, setRawData] = useState([]);
  const [filters, setFilters] = useState({ 
    categories: [], 
    dateRange: null, 
    customDate: '', 
    province: '', 
    district: '', 
    subdistrict: '' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(HISTORY_CONSTANTS.ROW_OPTIONS[1] || 10);
  const [popup, setPopup] = useState({ open: false, type: '', message: '' });
  const [popupCountdown, setPopupCountdown] = useState(5);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (ongoingRequestRef.current) ongoingRequestRef.current.abort();
    };
  }, []);

  const abortFetch = useCallback(() => {
    if (ongoingRequestRef.current) {
      ongoingRequestRef.current.abort();
      ongoingRequestRef.current = null;
    }
  }, []);

  const fetchHistoryData = useCallback(async (customOptions = {}) => {
    const policyParams = HistoryAccessPolicy.getFetchParams(user, evidence);

    if (!policyParams && !customOptions.isNarcoticAdmin) {
      return; 
    }

    const fetchParams = { ...policyParams, ...customOptions };

    abortFetch();
    const controller = new AbortController();
    ongoingRequestRef.current = controller;

    setIsLoading(true);
    setError(null);
    
    try {
      const resp = await HistoryApiService.getHistories(fetchParams, controller.signal);

      const historyEntities = (Array.isArray(resp) ? resp : [resp])
        .map(HistoryItemEntity.fromApi)
        .sort((a, b) => {
          const dateA = a.exhibit.discovery_date;
          const dateB = b.exhibit.discovery_date;
          
          const timeA = dateA ? new Date(dateA).getTime() : 0;
          const timeB = dateB ? new Date(dateB).getTime() : 0;
          
          return timeB - timeA;
        });
      
      if (isMounted.current) {
        setRawData(historyEntities);
      }
      return { success: true, data: historyEntities };

    } catch (err) {
      if (err.name === 'AbortError') return { success: false, reason: 'aborted' };
      
      const errorMessage = err.status === 404 
        ? 'ไม่พบข้อมูลประวัติ' 
        : (err.message || 'ไม่สามารถโหลดข้อมูลได้');
      
      if (isMounted.current) {
        setError(errorMessage);
        setRawData([]);
      }
      return { success: false, error: err };

    } finally {
      if (isMounted.current) setIsLoading(false);
      ongoingRequestRef.current = null;
    }
  }, [user, evidence, abortFetch]);

  const handleDeleteHistory = useCallback(async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้?')) return;
    
    try {
      await HistoryApiService.deleteHistory(id);
      if (isMounted.current) {
        setRawData(prev => prev.filter(item => item.id !== id));
        setPopup({ open: true, type: 'success', message: 'ลบรายการสำเร็จ' });
        setPopupCountdown(5);
      }
    } catch (err) {
      if (isMounted.current) {
        setPopup({ open: true, type: 'fail', message: err.message });
        setPopupCountdown(5);
      }
    }
  }, []);

  const filteredData = useMemo(() => {
    return HistoryFilterService.applyFilters(rawData, filters);
  }, [rawData, filters]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  }, [filteredData.length, rowsPerPage]);

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  
  const currentItems = useMemo(() => {
    return filteredData.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredData, indexOfFirstItem, indexOfLastItem]);

  const filterLabels = useMemo(() => {
    return HistoryFilterService.generateLabels(filters);
  }, [filters]);

  useEffect(() => {
    if (routerLocation?.state?.popup) {
      setPopup(routerLocation.state.popup);
      setPopupCountdown(5);
      try { window.history.replaceState({}, document.title); } catch {}
    }
  }, [routerLocation]);

  useEffect(() => {
    if (!popup.open) return;
    const timer = setInterval(() => {
      setPopupCountdown(prev => {
        if (prev <= 1) {
          setPopup(p => ({ ...p, open: false }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [popup.open]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, rowsPerPage]);

  return {
    data: rawData,
    filteredData,
    currentItems,
    isLoading,
    error,

    pagination: {
      currentPage,
      totalPages,
      rowsPerPage,
      indexOfFirstItem,
      indexOfLastItem,
      handlePageChange: setCurrentPage,
      handleRowsPerPageChange: (e) => setRowsPerPage(Number(e.target.value))
    },

    filter: {
      isOpen: isFilterOpen,
      setIsOpen: setIsFilterOpen,
      current: filters,
      apply: setFilters,
      clear: () => setFilters({ 
        categories: [], 
        dateRange: null, 
        customDate: '', 
        province: '', 
        district: '', 
        subdistrict: '' 
      }),
      remove: (type, value) => {
        const next = { ...filters };
        if (type === 'category') {
          next.categories = next.categories.filter(c => c !== value);
        } else if (type === 'date') {
          next.dateRange = null; 
          next.customDate = '';
        } else if (type === 'location') {
          next[value] = '';
        }
        setFilters(next);
      },
      labels: filterLabels
    },

    popup: { 
      ...popup, 
      countdown: popupCountdown 
    },

    fetchHistoryData,
    abortFetch,
    handleDeleteHistory,
    setPopup,
    setError
  };
};