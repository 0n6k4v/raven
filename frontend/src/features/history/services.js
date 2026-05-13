import { 
  HISTORY_CONSTANTS, 
  HistoryAccessPolicy, 
  HistoryFilterService, 
  HistoryFormatter 
} from './utils';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  
  if (!response.ok) {
    const error = new Error(data?.detail || data?.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const HistoryApiService = {
  getHistories: async (options = {}, signal) => {
    const { userId, exhibitId, category, isNarcoticAdmin } = options;

    if (isNarcoticAdmin) {
      const url = `${API_BASE_URL}/history/narcotics`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
        signal
      });
      return handleResponse(response);
    }

    let url = `${API_BASE_URL}/history`;

    if (exhibitId) {
      url = userId 
        ? `${API_BASE_URL}/history/exhibit/${exhibitId}/user/${userId}` 
        : `${API_BASE_URL}/history/exhibit/${exhibitId}`;
    } else {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (category) params.append('category', category);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
      signal
    });
    return handleResponse(response);
  },

  deleteHistory: async (id) => {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

export const HistoryService = {
  ...HISTORY_CONSTANTS,

  fetchAll: HistoryApiService.getHistories,
  delete: HistoryApiService.deleteHistory,
  determineViewType: HistoryAccessPolicy.determineViewType,
  getFetchParams: HistoryAccessPolicy.getFetchParams,
  hasLabelPermission: HistoryAccessPolicy.hasLabelPermission,
  canPerformAction: HistoryAccessPolicy.canPerformAction,
  canShowAdminMenu: HistoryAccessPolicy.canShowAdminMenu,
  filterData: HistoryFilterService.applyFilters,
  getFilterLabels: HistoryFilterService.generateLabels,
  formatPaginationInfo: HistoryFormatter.formatPaginationInfo,
};