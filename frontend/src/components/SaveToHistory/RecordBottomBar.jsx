/**
 * RecordBottomBar Component - Optimized for React 19 + Vite
 * 
 * Best Practices References:
 * - React 19: https://react.dev/blog/2024/12/05/react-19
 * - React Forms Best Practices: https://www.telerik.com/blogs/react-design-patterns-best-practices
 * - Error Handling: https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/
 * - Form Validation: https://medium.com/@farzanekazemi8517/best-practices-for-handling-forms-in-react-2025-edition-62572b14452f
 * - React Performance: https://vite.dev/guide/performance
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

/* ========================= CONSTANTS ========================= */
// Best Practice: Centralize configuration for easy maintenance
// Reference: https://www.devacetech.com/insights/react-best-practices
const API_CONFIG = {
  BASE_URL: `${import.meta.env.VITE_API_URL}/api`,
  ENDPOINTS: {
    HISTORY: '/history',
  },
  DEFAULT_USER_ID: 1, // TODO: Replace with actual auth user ID
};

const DEBUG = import.meta.env.DEV;

const UNKNOWN_EXHIBIT_IDS = {
  UNKNOWN_GUN: 93,
  UNKNOWN_DRUG: 94,
  UNKNOWN_OBJECT: null,
};

// Error messages - centralized for i18n support
const ERROR_MESSAGES = {
  MISSING_SUBDISTRICT: 'กรุณาเลือกตำบล/แขวง',
  MISSING_COORDINATES: 'ไม่พบข้อมูลพิกัด กรุณาเลือกตำแหน่งบนแผนที่',
  SAVE_FAILED: 'ไม่สามารถบันทึกประวัติได้ โปรดลองอีกครั้ง',
  NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดลองอีกครั้ง',
};

const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'บันทึกประวัติสำเร็จ',
};

/* ========================= UTILITY FUNCTIONS ========================= */
// Best Practice: Pure functions for testability and reusability
// Reference: https://www.telerik.com/blogs/react-design-patterns-best-practices

/**
 * Extract exhibit ID from evidence data or analysis result
 * @param {Object} evidenceData - Evidence data
 * @param {Object} analysisResult - Analysis result
 * @returns {number|null} Exhibit ID
 */
const getExhibitId = (evidenceData, analysisResult) =>
  evidenceData?.result?.exhibit_id ?? analysisResult?.exhibit_id ?? null;

/**
 * Validate required form fields
 * Best Practice: Early validation prevents unnecessary API calls
 * Reference: https://medium.com/@farzanekazemi8517/best-practices-for-handling-forms-in-react-2025-edition-62572b14452f
 * 
 * @param {Object} fields - Fields to validate
 * @param {Object} fields.subdistrict - Subdistrict data
 * @param {Object} fields.coordinates - Coordinates data
 * @returns {string|null} Error message or null if valid
 */
const validateRequiredFields = ({ subdistrict, coordinates }) => {
  if (!subdistrict?.id) {
    return ERROR_MESSAGES.MISSING_SUBDISTRICT;
  }
  if (!coordinates?.lat || !coordinates?.lng) {
    return ERROR_MESSAGES.MISSING_COORDINATES;
  }
  return null;
};

/**
 * Convert data URL to File object
 * Performance: Optimized string parsing and error handling
 * 
 * @param {string} dataUrl - Base64 data URL
 * @param {string} filename - Output filename
 * @returns {File|null} File object or null on error
 */
const dataURLtoFile = (dataUrl, filename) => {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  
  try {
    const [header, base64] = dataUrl.split(',');
    const mime = (header.match(/:(.*?);/) || [])[1] || 'image/jpeg';
    const binary = atob(base64 || '');
    const length = binary.length;
    const array = new Uint8Array(length);
    
    for (let i = 0; i < length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    
    return new File([array], filename, { type: mime });
  } catch (err) {
    console.error('[RecordBottomBar] dataURLtoFile error:', err);
    return null;
  }
};

/**
 * Build FormData for API submission
 * Best Practice: Centralized data transformation for consistency
 * 
 * @param {Object} params - Form parameters
 * @returns {FormData} Constructed FormData object
 */
const buildFormData = ({
  exhibitId,
  userId,
  imageBase64,
  subdistrict,
  date,
  time,
  quantity,
  coordinates,
  placeName,
  houseNumber,
  village,
  soi,
  road,
  aiConfidence,
}) => {
  const formData = new FormData();
  
  // Only append fields with valid values
  if (exhibitId) formData.append('exhibit_id', exhibitId);
  formData.append('user_id', userId);
  
  // Handle image file
  if (imageBase64) {
    const file = dataURLtoFile(imageBase64, 'evidence.jpg');
    if (file) formData.append('image', file);
  }
  
  // Required fields
  if (subdistrict?.id) formData.append('subdistrict_id', subdistrict.id);
  if (coordinates?.lat != null) formData.append('latitude', coordinates.lat);
  if (coordinates?.lng != null) formData.append('longitude', coordinates.lng);
  
  // Optional fields
  if (date) formData.append('discovery_date', date);
  if (time) formData.append('discovery_time', time);
  if (quantity !== undefined && quantity !== '') formData.append('quantity', quantity);
  if (placeName) formData.append('place_name', placeName);
  if (houseNumber) formData.append('house_number', houseNumber);
  if (village) formData.append('village', village);
  if (soi) formData.append('soi', soi);
  if (road) formData.append('road', road);
  if (aiConfidence !== undefined) formData.append('ai_confidence', aiConfidence);
  
  return formData;
};

/**
 * Extract user-friendly error message from various error formats
 * Best Practice: Consistent error handling across the app
 * Reference: https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/
 * 
 * @param {Error|Object|string} errOrMsg - Error object or message
 * @returns {string} User-friendly error message
 */
const extractErrorMessage = (errOrMsg) => {
  if (!errOrMsg) return ERROR_MESSAGES.SAVE_FAILED;
  if (typeof errOrMsg === 'string') return errOrMsg;
  
  // Check various error formats
  if (errOrMsg?.message) return errOrMsg.message;
  if (errOrMsg?.detail) return errOrMsg.detail;
  if (errOrMsg?.error) return errOrMsg.error;
  if (errOrMsg?.data?.message) return errOrMsg.data.message;
  
  return ERROR_MESSAGES.SAVE_FAILED;
};

/* ========================= CUSTOM HOOKS ========================= */
// Best Practice: Extract reusable logic into custom hooks
// Reference: https://www.devacetech.com/insights/react-best-practices

/**
 * Custom hook to load base64 image from localStorage
 * Performance: Lazy loading with error handling
 * 
 * @param {string} key - localStorage key
 * @returns {string|null} Base64 image string or null
 */
const useLocalBase64Image = (key = 'analysisImage') => {
  const [base64Image, setBase64Image] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved || null;
    } catch (err) {
      console.warn('[RecordBottomBar] Failed to read from localStorage:', err);
      return null;
    }
  });
  
  return base64Image;
};

/**
 * Custom hook for form submission logic
 * Best Practice: Separate business logic from UI components
 * Reference: https://medium.com/@farzanekazemi8517/best-practices-for-handling-forms-in-react-2025-edition-62572b14452f
 * 
 * @param {Object} formData - Form data for submission
 * @returns {Object} Submission state and handlers
 */
const useFormSubmission = (formData) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  /**
   * Submit form data to API
   * Best Practice: Async error handling with try-catch
   * Reference: https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/
   */
  const handleSubmit = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    const {
      evidenceData,
      analysisResult,
      subdistrict,
      coordinates,
      date,
      time,
      quantity,
      base64Image,
      placeName,
      houseNumber,
      village,
      soi,
      road,
    } = formData;

    // Extract exhibit ID
    const exhibitId = getExhibitId(evidenceData, analysisResult);
    
    if (DEBUG) {
      console.debug('[RecordBottomBar] Submitting with exhibit_id:', exhibitId);
      console.debug('[RecordBottomBar] Evidence type:', evidenceData?.type);
    }

    // Validate required fields before API call
    const validationError = validateRequiredFields({ subdistrict, coordinates });
    if (validationError) {
      setSaveError(validationError);
      setIsSaving(false);
      return;
    }

    // Build form data
    const apiFormData = buildFormData({
      exhibitId,
      userId: API_CONFIG.DEFAULT_USER_ID,
      imageBase64: base64Image,
      subdistrict,
      date,
      time,
      quantity,
      coordinates,
      placeName,
      houseNumber,
      village,
      soi,
      road,
      aiConfidence: analysisResult?.confidence,
    });

    if (DEBUG) {
      console.debug('[RecordBottomBar] FormData keys:');
      for (const key of apiFormData.keys()) {
        console.debug(`  - ${key}`);
      }
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HISTORY}`, {
        method: 'POST',
        credentials: 'include',
        body: apiFormData,
      });

      // Best Practice: Handle both JSON and non-JSON responses
      let responseBody = null;
      try {
        responseBody = await response.clone().json();
      } catch (_) {
        // Response is not JSON, that's ok
      }

      // Check response status
      if (!response.ok) {
        const serverMessage =
          responseBody?.detail ||
          responseBody?.error ||
          responseBody?.message ||
          response.statusText ||
          `HTTP ${response.status}`;
        throw new Error(serverMessage);
      }

      if (DEBUG) {
        console.debug('[RecordBottomBar] History saved successfully:', responseBody);
      }

      // Navigate to history page with success message
      navigate('/history', {
        state: {
          popup: {
            open: true,
            type: 'success',
            message: SUCCESS_MESSAGES.SAVE_SUCCESS,
          },
        },
      });
    } catch (err) {
      // Best Practice: Differentiate between network and server errors
      // Reference: https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/
      const isNetworkError = err.name === 'TypeError' || !navigator.onLine;
      const errorMessage = isNetworkError
        ? ERROR_MESSAGES.NETWORK_ERROR
        : extractErrorMessage(err);
      
      console.error('[RecordBottomBar] Save history error:', errorMessage, err);
      setSaveError(errorMessage);
      
      // TODO: Send error to monitoring service (e.g., Sentry)
      // Sentry.captureException(err);
    } finally {
      setIsSaving(false);
    }
  }, [formData, navigate]);

  return { isSaving, saveError, handleSubmit };
};

/* ========================= MAIN COMPONENT ========================= */
/**
 * RecordBottomBar Component
 * 
 * Displays action buttons and error messages for record form submission
 * 
 * Best Practices Applied:
 * 1. Separation of concerns (UI vs logic)
 * 2. Custom hooks for reusable logic
 * 3. Memoization for performance
 * 4. Comprehensive error handling
 * 5. Accessibility considerations
 * 
 * References:
 * - https://react.dev/blog/2024/12/05/react-19
 * - https://www.telerik.com/blogs/react-design-patterns-best-practices
 * - https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/
 * 
 * @param {Object} props - Component props
 * @param {Object} props.evidenceData - Evidence data from analysis
 * @param {Object} props.analysisResult - AI analysis result
 * @param {Object} props.province - Province data
 * @param {Object} props.district - District data
 * @param {Object} props.subdistrict - Subdistrict data
 * @param {string} props.houseNumber - House number
 * @param {string} props.village - Village name
 * @param {string} props.soi - Soi/Lane
 * @param {string} props.road - Road name
 * @param {string} props.placeName - Place name
 * @param {Object} props.coordinates - Location coordinates {lat, lng}
 * @param {string} props.date - Discovery date
 * @param {string} props.time - Discovery time
 * @param {number|string} props.quantity - Evidence quantity
 * @returns {JSX.Element} Bottom bar component
 */
const RecordBottomBar = ({
  evidenceData,
  analysisResult,
  province,
  district,
  subdistrict,
  houseNumber,
  village,
  soi,
  road,
  placeName,
  coordinates,
  date,
  time,
  quantity,
}) => {
  const navigate = useNavigate();
  const base64Image = useLocalBase64Image('analysisImage');

  // Best Practice: Memoize form data to prevent unnecessary recalculations
  // Reference: https://react.dev/blog/2024/12/05/react-19
  const formData = useMemo(
    () => ({
      evidenceData,
      analysisResult,
      subdistrict,
      coordinates,
      date,
      time,
      quantity,
      base64Image,
      placeName,
      houseNumber,
      village,
      soi,
      road,
    }),
    [
      evidenceData,
      analysisResult,
      subdistrict,
      coordinates,
      date,
      time,
      quantity,
      base64Image,
      placeName,
      houseNumber,
      village,
      soi,
      road,
    ]
  );

  // Use custom hook for form submission
  const { isSaving, saveError, handleSubmit } = useFormSubmission(formData);

  /**
   * Handle back navigation
   * Best Practice: Preserve navigation state for better UX
   */
  const handleBack = useCallback(() => {
    navigate(-1);
    
    // Preserve evidence data in history state for back navigation
    setTimeout(() => {
      window.history.replaceState(
        {
          fromRecord: true,
          type: evidenceData?.type ?? 'Gun',
          result: evidenceData?.result ?? evidenceData,
        },
        ''
      );
    }, 100);
  }, [navigate, evidenceData]);

  return (
    <div 
      className="w-full h-full px-4 flex items-center justify-between gap-4 sm:justify-end sm:space-x-4 bg-white ring-1 ring-gray-50 shadow-sm rounded-t-lg sm:border-t sm:border-gray-200"
      role="toolbar"
      aria-label="Form actions"
    >
      {/* Error Message Display */}
      {/* Best Practice: Show validation errors inline near affected controls */}
      {/* Reference: https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation */}
      {saveError && (
        <div 
          className="mr-4 self-center" 
          role="alert" 
          aria-live="polite"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-700 text-sm font-medium">
            {/* Accessible error icon */}
            <svg 
              className="w-4 h-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              aria-hidden="true"
            >
              <path 
                d="M12 9v4" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M12 17h.01" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span>{saveError}</span>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        type="button"
        onClick={handleBack}
        disabled={isSaving}
        aria-disabled={isSaving}
        aria-label="ย้อนกลับไปหน้าก่อนหน้า"
        className="px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        ย้อนกลับ
      </button>

      {/* Submit Button */}
      {/* Best Practice: Clear visual feedback for loading states */}
      {/* Reference: https://www.telerik.com/blogs/react-design-patterns-best-practices */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSaving}
        aria-disabled={isSaving}
        aria-label={isSaving ? 'กำลังบันทึกข้อมูล' : 'บันทึกข้อมูล'}
        className={`
          px-6 py-2 rounded-md text-white font-semibold shadow-sm 
          transition-all duration-200 focus:outline-none
          ${
            isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#990000] hover:bg-[#7a0000] focus:ring-2 focus:ring-[#990000]/40 active:scale-95'
          }
        `}
      >
        {isSaving ? (
          <span className="inline-flex items-center gap-2">
            {/* Loading spinner */}
            <svg 
              className="animate-spin h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            กำลังบันทึก...
          </span>
        ) : (
          'บันทึก'
        )}
      </button>
    </div>
  );
};

export default RecordBottomBar;