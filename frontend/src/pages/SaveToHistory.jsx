/**
 * SaveToHistory Page Component - Optimized for React 19 + Vite + Leaflet
 * 
 * Best Practices References:
 * - React 19: https://react.dev/blog/2024/12/05/react-19
 * - Component Composition: https://medium.com/@karnikagupta1830/mastering-component-composition-in-react-a-comprehensive-guide-eb1ef8a740a3
 * - Custom Hooks: https://blog.logrocket.com/react-hooks-cheat-sheet-solutions-common-problems/
 * - React Best Practices 2025: https://www.devacetech.com/insights/react-best-practices
 * - State Management: https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices
 * - Performance Optimization: https://www.telerik.com/blogs/react-design-patterns-best-practices
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useLocation } from 'react-router-dom';
import RecordTabBar from '../components/SaveToHistory/RecordTabBar';
import RecordBottomBar from '../components/SaveToHistory/RecordBottomBar';
import SearchableDropdown from '../components/common/SearchableDropdown';
import RecordMap from '../components/SaveToHistory/RecordMap';
import { IoMapOutline } from 'react-icons/io5';
import { useGeoGraphy } from '../hooks/useGeoGraphy';

/* ========================= CONSTANTS ========================= */
// Best Practice: Centralize constants for easy maintenance
// Reference: https://www.devacetech.com/insights/react-best-practices
const LAYOUT_CONFIG = {
  TAB_BAR_HEIGHT: 56,
  BOTTOM_BAR_HEIGHT: 72,
};

const GEOLOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 60000,
};

const DEBOUNCE_DELAY = {
  GEOCODE: 500,
};

const STORAGE_KEYS = {
  EVIDENCE_DATA: 'currentEvidenceData',
  ANALYSIS_IMAGE: 'analysisImage',
  ANALYSIS_RESULT: 'analysisResult',
};

/* ========================= UTILITY FUNCTIONS ========================= */
// Best Practice: Pure functions for testability and reusability
// Reference: https://www.telerik.com/blogs/react-design-patterns-best-practices

/**
 * Convert value to dropdown option format
 * @param {string} value - Option value
 * @param {number} id - Option ID
 * @returns {Object} Formatted option
 */
const toOption = (value, id) => ({ value, label: value, id });

/**
 * Find item in list by name with loose matching
 * Handles variations in naming (includes, partial match)
 * @param {Array} list - List to search
 * @param {string} nameKey - Property name to check
 * @param {string} targetName - Name to find
 * @returns {Object|undefined} Found item or undefined
 */
const findByNameLoose = (list = [], nameKey, targetName = '') =>
  list.find((item) => {
    const value = item[nameKey] || '';
    return (
      value === targetName ||
      value.includes(targetName) ||
      targetName.includes(value)
    );
  });

/**
 * Check if two coordinates are equal within epsilon
 * @param {Object} coord1 - First coordinate {lat, lng}
 * @param {Object} coord2 - Second coordinate {lat, lng}
 * @param {number} epsilon - Tolerance for floating point comparison
 * @returns {boolean} True if coordinates are equal
 */
const coordinatesEqual = (coord1, coord2, epsilon = 1e-6) => {
  if (!coord1 || !coord2) return false;
  return (
    Math.abs(coord1.lat - coord2.lat) < epsilon &&
    Math.abs(coord1.lng - coord2.lng) < epsilon
  );
};

/* ========================= CUSTOM HOOKS ========================= */
// Best Practice: Extract reusable logic into custom hooks
// Reference: https://blog.logrocket.com/react-hooks-cheat-sheet-solutions-common-problems/

/**
 * Custom hook for managing geography data (provinces, districts, subdistricts)
 * Best Practice: Separate data fetching and state management logic
 * Reference: https://www.angularminds.com/blog/advanced-react-hooks-patterns-and-best-practices
 * 
 * @returns {Object} Geography state and handlers
 */
const useGeographyData = () => {
  const {
    provinces: hookProvinces = [],
    districts: hookDistricts = [],
    subdistricts: hookSubdistricts = [],
    loading: hookLoading = {},
  } = useGeoGraphy();

  const [loading, setLoading] = useState(false);
  const [apiBusy, setApiBusy] = useState(false);

  const [provincesRaw, setProvincesRaw] = useState([]);
  const [districtsRaw, setDistrictsRaw] = useState([]);
  const [subdistrictsRaw, setSubdistrictsRaw] = useState([]);

  const [provinceOptions, setProvinceOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState([]);
  const [zipcodeOptions, setZipcodeOptions] = useState([]);

  // Sync provinces from hook
  useEffect(() => {
    const provinces = hookProvinces || [];
    setProvincesRaw(provinces);
    setProvinceOptions(
      provinces.map((p) => toOption(p.province_name, p.id))
    );
  }, [hookProvinces]);

  // Sync districts from hook
  useEffect(() => {
    setDistrictsRaw(hookDistricts || []);
  }, [hookDistricts]);

  // Sync subdistricts from hook
  useEffect(() => {
    setSubdistrictsRaw(hookSubdistricts || []);
  }, [hookSubdistricts]);

  // Track loading state
  useEffect(() => {
    const anyLoading = Boolean(
      hookLoading?.provinces ||
      hookLoading?.districts ||
      hookLoading?.subdistricts
    );
    setLoading(anyLoading);
  }, [hookLoading]);

  /**
   * Build district options for selected province
   * Best Practice: Use useCallback for functions passed as dependencies
   * Reference: https://www.devacetech.com/insights/react-best-practices
   */
  const buildDistrictOptionsForProvince = useCallback(
    (provinceObj) => {
      if (!provinceObj) {
        setDistrictOptions([]);
        return;
      }
      const matches = districtsRaw.filter(
        (d) => d.province_id === provinceObj.id
      );
      setDistrictOptions(
        matches.map((d) => toOption(d.district_name || d.amphoe_t, d.id))
      );
    },
    [districtsRaw]
  );

  /**
   * Build subdistrict options for selected district
   */
  const buildSubdistrictOptionsForDistrict = useCallback(
    (districtObj) => {
      if (!districtObj) {
        setSubdistrictOptions([]);
        return;
      }
      const matches = subdistrictsRaw.filter(
        (sd) => sd.district_id === districtObj.id
      );
      setSubdistrictOptions(
        matches.map((sd) => ({
          value: sd.subdistrict_name || sd.tambon_t,
          label: sd.subdistrict_name || sd.tambon_t,
          id: sd.id,
          zip_code: sd.zip_code,
        }))
      );
    },
    [subdistrictsRaw]
  );

  /**
   * Fetch address from coordinates using reverse geocoding
   * Best Practice: Handle async operations with proper error handling
   * Reference: https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/
   */
  const findAndAutoFillFromCoords = useCallback(
    async (lat, lng, updateLocationCallback) => {
      if (!lat || !lng) return;
      
      setApiBusy(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/geocode/reverse?lat=${lat}&lng=${lng}`
        );
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }
        
        const json = await response.json();
        
        if (!json.ok) {
          throw new Error(json.message || 'No address returned');
        }
        
        const data = json.data || {};
        const hasParts = data?.province && data?.district && data?.subdistrict;
        
        if (!hasParts) return;

        // Clean up prefecture names
        const provinceName = String(data.province).replace('จ.', '').trim();
        const districtName = String(data.district)
          .replace(/^(เขต|อำเภอ|อ\.)\s*/i, '')
          .trim();
        const subdistrictName = String(data.subdistrict)
          .replace(/^(แขวง|ตำบล|ต\.)\s*/i, '')
          .trim();

        updateLocationCallback({
          placeName: data.aoi || '',
          road: data.road || '',
          provinceName,
          districtName,
          subdistrictName,
        });
      } catch (err) {
        console.error('[useGeographyData] Geocode error:', err);
      } finally {
        setApiBusy(false);
      }
    },
    []
  );

  return {
    loading,
    apiBusy,
    provinceOptions,
    districtOptions,
    subdistrictOptions,
    zipcodeOptions,
    rawProvinceList: provincesRaw,
    rawDistrictList: districtsRaw,
    rawSubdistrictList: subdistrictsRaw,
    setProvinceOptions,
    setDistrictOptions,
    setSubdistrictOptions,
    setZipcodeOptions,
    buildDistrictOptionsForProvince,
    buildSubdistrictOptionsForDistrict,
    findAndAutoFillFromCoords,
  };
};

/**
 * Custom hook for managing user's current location
 * Best Practice: Encapsulate geolocation logic
 * Reference: https://javascript.plainenglish.io/react-hooks-best-practices-write-cleaner-faster-and-smarter-components-e694495ff308
 */
const useCurrentLocation = () => {
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('[useCurrentLocation] Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('[useCurrentLocation] Geolocation error:', error);
      },
      GEOLOCATION_CONFIG
    );
  }, []);

  return coordinates;
};

/**
 * Custom hook for managing localStorage with error handling
 * Best Practice: Centralize storage operations
 * Reference: https://www.angularminds.com/blog/advanced-react-hooks-patterns-and-best-practices
 */
const useLocalStorage = (key, initialValue = null) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to read ${key}:`, err);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        setStoredValue(value);
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (err) {
        console.error(`[useLocalStorage] Failed to write ${key}:`, err);
      }
    },
    [key]
  );

  return [storedValue, setValue];
};

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
// Best Practice: Separate presentational components for better organization
// Reference: https://medium.com/@karnikagupta1830/mastering-component-composition-in-react-a-comprehensive-guide-eb1ef8a740a3

/**
 * LocationFormFields Component
 * Displays all location-related form inputs
 * 
 * Best Practice: Break components down by responsibility (max 150-200 lines)
 * Reference: https://medium.com/@connect2saurav/top-react-best-practices-in-2025-mastering-modern-frontend-development-e72bfc4f0cc1
 */
const LocationFormFields = memo(function LocationFormFields({
  provinces,
  districts,
  subdistricts,
  selectedProvince,
  selectedDistrict,
  selectedSubdistrict,
  onProvinceChange,
  onDistrictChange,
  onSubdistrictChange,
  placeName,
  setPlaceName,
  houseNumber,
  setHouseNumber,
  village,
  setVillage,
  soi,
  setSoi,
  road,
  setRoad,
  quantity,
  setQuantity,
  apiLoading,
}) {
  return (
    <>
      {/* Province Dropdown */}
      <div className="mb-5 relative">
        <label className="block text-sm font-medium text-gray-800 mb-2">
          จังหวัด
        </label>
        <SearchableDropdown
          options={provinces}
          value={selectedProvince}
          onChange={onProvinceChange}
          placeholder="กรอกหรือเลือกจังหวัด"
          disabled={apiLoading}
        />
        {apiLoading && (
          <span className="absolute right-10 top-10 text-xs text-indigo-600">
            กำลังอัพเดต...
          </span>
        )}
      </div>

      {/* District Dropdown */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-800 mb-2">
          เขต/อำเภอ
        </label>
        <SearchableDropdown
          options={districts}
          value={selectedDistrict}
          onChange={onDistrictChange}
          placeholder="กรอกหรือเลือกอำเภอ"
          disabled={!selectedProvince || apiLoading}
        />
      </div>

      {/* Subdistrict Dropdown */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-800 mb-2">
          แขวง/ตำบล
        </label>
        <SearchableDropdown
          options={subdistricts}
          value={selectedSubdistrict}
          onChange={onSubdistrictChange}
          placeholder="กรอกหรือเลือกตำบล"
          disabled={!selectedDistrict || apiLoading}
        />
      </div>

      <hr className="border-t border-gray-100 my-4" />

      {/* Place Name */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-800 mb-2">
          สถานที่
        </label>
        <input
          type="text"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="เช่น วัด โรงเรียน ร้านค้า ฯลฯ"
          aria-label="สถานที่"
        />
      </div>

      {/* Quantity and House Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            จำนวน
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="จำนวน"
            aria-label="จำนวน"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            บ้านเลขที่
          </label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder="บ้านเลขที่"
            aria-label="บ้านเลขที่"
          />
        </div>
      </div>

      {/* Village, Soi, Road */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            หมู่
          </label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="หมู่ที่"
            aria-label="หมู่"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            ซอย
          </label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={soi}
            onChange={(e) => setSoi(e.target.value)}
            placeholder="ซอย"
            aria-label="ซอย"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            ถนน
          </label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={road}
            onChange={(e) => setRoad(e.target.value)}
            placeholder="ถนน"
            aria-label="ถนน"
          />
        </div>
      </div>
    </>
  );
});

/**
 * MapModal Component for Mobile
 * Best Practice: Extract modal logic into separate component
 * Reference: https://www.brilworks.com/blog/react-components/
 */
const MapModal = memo(function MapModal({
  isOpen,
  onClose,
  coordinates,
  onCoordinatesChange,
  onConfirm,
  geocodePreview,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Close Button */}
      <div className="flex justify-end p-4 absolute top-0 right-0 z-10">
        <button
          className="text-2xl text-black bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
          onClick={onClose}
          aria-label="ปิดแผนที่"
        >
          ×
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-full">
        <RecordMap
          setCoordinates={onCoordinatesChange}
          coordinates={coordinates}
        />
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-5 shadow-lg border-t border-gray-100">
        <h2 className="text-lg font-semibold mb-2 text-gray-900">
          เลือกตำแหน่ง
        </h2>
        
        {/* Address Preview */}
        <div className="text-gray-800 mb-4 text-base">
          <p className="mb-2 border-b border-gray-100 pb-2">
            {geocodePreview ? (
              <>
                {geocodePreview.placeName && (
                  <span className="font-medium">{geocodePreview.placeName}</span>
                )}
                {geocodePreview.road && (
                  <span className="font-medium">
                    {geocodePreview.placeName ? ', ' : ''}
                    {geocodePreview.road}
                  </span>
                )}
                {geocodePreview.subdistrictName && (
                  <span className="font-medium">
                    {' '}
                    ต. {geocodePreview.subdistrictName}
                  </span>
                )}
                {geocodePreview.districtName && (
                  <span className="font-medium">
                    {' '}
                    อ. {geocodePreview.districtName}
                  </span>
                )}
                {geocodePreview.provinceName && (
                  <span className="font-medium">
                    {' '}
                    จ. {geocodePreview.provinceName}
                  </span>
                )}
              </>
            ) : coordinates ? (
              <span className="text-sm text-gray-500">
                กำลังเรียกข้อมูลสถานที่...
              </span>
            ) : (
              'กรุณาเลือกตำแหน่งบนแผนที่'
            )}
          </p>
        </div>

        {/* Confirm Button */}
        <div className="py-4">
          <button
            type="button"
            onClick={onConfirm}
            aria-label="ยืนยันตำแหน่ง"
            className="w-full py-3 bg-[#990000] hover:bg-[#7a0000] text-white rounded-md text-lg font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#990000]/40"
          >
            ยืนยันตำแหน่ง
          </button>
        </div>
      </div>
    </div>
  );
});

/* ========================= MAIN COMPONENT ========================= */
/**
 * SaveToHistory Page Component
 * 
 * Main page for recording evidence location and details
 * 
 * Best Practices Applied:
 * 1. Component composition for better maintainability
 * 2. Custom hooks for reusable logic
 * 3. Memoization for performance
 * 4. Responsive design (desktop/mobile layouts)
 * 5. Proper error handling
 * 
 * References:
 * - https://react.dev/blog/2024/12/05/react-19
 * - https://www.devacetech.com/insights/react-best-practices
 * - https://www.telerik.com/blogs/react-design-patterns-best-practices
 */
function SaveToHistory() {
  const location = useLocation();

  // Evidence data from navigation state or localStorage
  const [evidenceData, setEvidenceData] = useState(
    location.state?.evidence || null
  );
  const [analysisResult, setAnalysisResult] = useState(
    location.state?.analysisResult || null
  );

  // Date and time
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Coordinates with debouncing
  const [coordinates, setCoordinates] = useState(null);
  const coordinatesDebounceTimerRef = useRef(null);

  // Location selection state
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('');
  const [selectedZipcode, setSelectedZipcode] = useState('');

  // Address details
  const [placeName, setPlaceName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [village, setVillage] = useState('');
  const [soi, setSoi] = useState('');
  const [road, setRoad] = useState('');
  const [quantity, setQuantity] = useState('');

  // Geography data
  const geo = useGeographyData();
  const currentLocation = useCurrentLocation();

  // Destructure geography helpers
  const {
    findAndAutoFillFromCoords,
    rawProvinceList,
    rawDistrictList,
    rawSubdistrictList,
    buildDistrictOptionsForProvince,
    buildSubdistrictOptionsForDistrict,
    setZipcodeOptions,
    setSubdistrictOptions: setGeoSubdistrictOptions,
  } = geo;

  /**
   * Set coordinates only if changed (prevents unnecessary updates)
   * Best Practice: Avoid unnecessary state updates
   * Reference: https://www.devacetech.com/insights/react-best-practices
   */
  const setCoordinatesIfChanged = useCallback((newCoords) => {
    if (!newCoords) {
      setCoordinates(null);
      return;
    }
    
    setCoordinates((prev) => {
      if (coordinatesEqual(prev, newCoords)) return prev;
      return newCoords;
    });
  }, []);

  // Initialize date, time, and geolocation
  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    setTime(now.toTimeString().slice(0, 5));

    // Set initial coordinates from geolocation
    if (currentLocation) {
      setCoordinatesIfChanged(currentLocation);
    }
  }, [currentLocation, setCoordinatesIfChanged]);

  // Load evidence data from navigation state or localStorage
  useEffect(() => {
    if (location.state?.evidence) {
      setEvidenceData(location.state.evidence);
      
      try {
        // Store minimal evidence data
        const minimal = {
          type: location.state.evidence.type,
          id: location.state.evidence.id ?? null,
          exhibit_id: location.state.evidence.exhibit_id ?? null,
          result: location.state.evidence.result
            ? {
                brandName: location.state.evidence.result.brandName,
                modelName: location.state.evidence.result.modelName,
                confidence: location.state.evidence.result.confidence,
                confidence_score: location.state.evidence.result.confidence_score,
                brandConfidence: location.state.evidence.result.brandConfidence,
                prediction: location.state.evidence.result.prediction,
              }
            : null,
        };
        localStorage.setItem(STORAGE_KEYS.EVIDENCE_DATA, JSON.stringify(minimal));

        // Store image
        const img =
          location.state.evidence.imageUrl ||
          location.state.evidence.image_url ||
          location.state.image;
        if (img) localStorage.setItem(STORAGE_KEYS.ANALYSIS_IMAGE, img);
      } catch (err) {
        console.warn('[SaveToHistory] Failed to save evidence to localStorage:', err);
      }
    } else {
      // Try to restore from localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.EVIDENCE_DATA);
        if (saved) {
          const parsed = JSON.parse(saved);
          const img = localStorage.getItem(STORAGE_KEYS.ANALYSIS_IMAGE);
          if (img) {
            parsed.imageUrl = img;
            parsed.image_url = img;
          }
          setEvidenceData(parsed);
        }
      } catch (err) {
        console.error('[SaveToHistory] Failed to read evidence from localStorage:', err);
      }
    }
  }, [location.state]);

  // Load analysis result from navigation state or localStorage
  useEffect(() => {
    if (location.state?.analysisResult) {
      setAnalysisResult(location.state.analysisResult);
      
      try {
        const minimal = {
          id: location.state.analysisResult.id,
          brand: location.state.analysisResult.brand,
          model: location.state.analysisResult.model,
          series: location.state.analysisResult.series,
          mechanism: location.state.analysisResult.mechanism,
          exhibit_id: location.state.analysisResult.exhibit_id,
        };
        localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULT, JSON.stringify(minimal));
      } catch (err) {
        console.warn('[SaveToHistory] Failed to save analysis result:', err);
      }
    } else {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.ANALYSIS_RESULT);
        if (saved) setAnalysisResult(JSON.parse(saved));
      } catch (err) {
        console.error('[SaveToHistory] Failed to read analysis result:', err);
      }
    }
  }, [location.state]);

  /**
   * Auto-fill form from coordinates with debouncing
   * Best Practice: Debounce API calls to prevent excessive requests
   * Reference: https://blog.logrocket.com/react-hooks-cheat-sheet-solutions-common-problems/
   */
  useEffect(() => {
    if (!coordinates) return;

    // Clear existing timer
    if (coordinatesDebounceTimerRef.current) {
      clearTimeout(coordinatesDebounceTimerRef.current);
    }

    // Set new debounced timer
    coordinatesDebounceTimerRef.current = setTimeout(() => {
      findAndAutoFillFromCoords(
        coordinates.lat,
        coordinates.lng,
        ({ placeName: p, road: r, provinceName, districtName, subdistrictName }) => {
          // Update place name and road
          setPlaceName(p || '');
          setRoad(r || '');

          // Auto-select province
          const provObj = findByNameLoose(rawProvinceList, 'province_name', provinceName);
          if (!provObj) return;
          
          setSelectedProvince(provObj.province_name);
          buildDistrictOptionsForProvince(provObj);

          // Auto-select district
          const distObj =
            findByNameLoose(rawDistrictList, 'district_name', districtName) ||
            findByNameLoose(rawDistrictList, 'amphoe_t', districtName);
          if (!distObj) return;
          
          setSelectedDistrict(distObj.district_name || distObj.amphoe_t);
          buildSubdistrictOptionsForDistrict(distObj);

          // Auto-select subdistrict
          const subObj =
            findByNameLoose(rawSubdistrictList, 'subdistrict_name', subdistrictName) ||
            findByNameLoose(rawSubdistrictList, 'tambon_t', subdistrictName);
          if (!subObj) return;
          
          setSelectedSubdistrict(subObj.subdistrict_name || subObj.tambon_t);

          // Auto-fill zipcode
          const zip = subObj.zip_code;
          if (zip) {
            setSelectedZipcode(zip);
            setZipcodeOptions([{ value: zip, label: zip }]);
          }
        }
      );
    }, DEBOUNCE_DELAY.GEOCODE);

    // Cleanup timer on unmount or coordinates change
    return () => {
      if (coordinatesDebounceTimerRef.current) {
        clearTimeout(coordinatesDebounceTimerRef.current);
      }
    };
  }, [
    coordinates,
    findAndAutoFillFromCoords,
    rawProvinceList,
    rawDistrictList,
    rawSubdistrictList,
    buildDistrictOptionsForProvince,
    buildSubdistrictOptionsForDistrict,
    setZipcodeOptions,
  ]);

  /**
   * Handle province change
   * Best Practice: Use useCallback for event handlers
   */
  const handleProvinceChange = useCallback(
    (e) => {
      const value = e?.target?.value ?? '';
      setSelectedProvince(value);
      setSelectedDistrict('');
      setSelectedSubdistrict('');
      setSelectedZipcode('');
      setGeoSubdistrictOptions([]);
      setZipcodeOptions([]);

      const provObj = rawProvinceList.find((p) => p.province_name === value);
      if (provObj) buildDistrictOptionsForProvince(provObj);
    },
    [rawProvinceList, buildDistrictOptionsForProvince, setGeoSubdistrictOptions, setZipcodeOptions]
  );

  /**
   * Handle district change
   */
  const handleDistrictChange = useCallback(
    (e) => {
      const value = e?.target?.value ?? '';
      setSelectedDistrict(value);
      setSelectedSubdistrict('');
      setSelectedZipcode('');
      setZipcodeOptions([]);

      const distObj = rawDistrictList.find(
        (d) => (d.district_name || d.amphoe_t) === value
      );
      if (distObj) buildSubdistrictOptionsForDistrict(distObj);
    },
    [rawDistrictList, buildSubdistrictOptionsForDistrict, setZipcodeOptions]
  );

  /**
   * Handle subdistrict change
   */
  const handleSubdistrictChange = useCallback(
    (e) => {
      const value = e?.target?.value ?? '';
      setSelectedSubdistrict(value);
      setSelectedZipcode('');

      const subObj = rawSubdistrictList.find(
        (sd) => (sd.subdistrict_name || sd.tambon_t) === value
      );
      
      if (subObj) {
        const zip = subObj.zip_code;
        setZipcodeOptions(zip ? [{ value: zip, label: zip }] : []);
        if (zip) setSelectedZipcode(zip);
      }
    },
    [rawSubdistrictList, setZipcodeOptions]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (coordinatesDebounceTimerRef.current) {
        clearTimeout(coordinatesDebounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Memoized selected objects
   * Best Practice: Use useMemo for expensive calculations
   * Reference: https://react.dev/blog/2024/12/05/react-19
   */
  const selectedProvinceObj = useMemo(
    () => rawProvinceList.find((p) => p.province_name === selectedProvince),
    [rawProvinceList, selectedProvince]
  );

  const selectedDistrictObj = useMemo(
    () =>
      rawDistrictList.find(
        (d) => (d.district_name || d.amphoe_t) === selectedDistrict
      ),
    [rawDistrictList, selectedDistrict]
  );

  const selectedSubdistrictObj = useMemo(
    () =>
      rawSubdistrictList.find(
        (sd) => (sd.subdistrict_name || sd.tambon_t) === selectedSubdistrict
      ),
    [rawSubdistrictList, selectedSubdistrict]
  );

  /**
   * Common props for both layouts
   * Best Practice: DRY - Don't Repeat Yourself
   */
  const commonFormProps = useMemo(
    () => ({
      loading: geo.loading,
      apiLoading: geo.apiBusy,
      provinces: geo.provinceOptions,
      districts: geo.districtOptions,
      subdistricts: geo.subdistrictOptions,
      zipcodes: [],
      selectedProvince,
      selectedDistrict,
      selectedSubdistrict,
      onProvinceChange: handleProvinceChange,
      onDistrictChange: handleDistrictChange,
      onSubdistrictChange: handleSubdistrictChange,
      placeName,
      setPlaceName,
      houseNumber,
      setHouseNumber,
      village,
      setVillage,
      soi,
      setSoi,
      road,
      setRoad,
      quantity,
      setQuantity,
      coordinates,
      setCoordinates: setCoordinatesIfChanged,
    }),
    [
      geo.loading,
      geo.apiBusy,
      geo.provinceOptions,
      geo.districtOptions,
      geo.subdistrictOptions,
      selectedProvince,
      selectedDistrict,
      selectedSubdistrict,
      handleProvinceChange,
      handleDistrictChange,
      handleSubdistrictChange,
      placeName,
      houseNumber,
      village,
      soi,
      road,
      quantity,
      coordinates,
      setCoordinatesIfChanged,
    ]
  );

  /**
   * Desktop Layout Component
   * Best Practice: Separate layout logic for responsive design
   * Reference: https://www.brilworks.com/blog/react-components/
   */
  const DesktopLayout = useMemo(
    () =>
      function DesktopLayoutComponent(props) {
        return (
          <div className="flex-1 flex flex-col overflow-hidden">
            <RecordTabBar />

            <div className="flex flex-1 overflow-hidden justify-center items-stretch bg-gray-50">
              <div
                className="flex w-full mx-auto bg-white flex-1"
                style={{ minHeight: 400 }}
              >
                {/* Left: Form Inputs */}
                <div className="w-1/2 p-8 flex flex-col">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    ระบุตำแหน่ง
                  </h2>
                  <div className="flex-1 overflow-auto">
                    <LocationFormFields {...props} />
                  </div>
                </div>

                {/* Right: Map */}
                <div className="w-1/2 p-8 hidden md:flex">
                  <div className="w-full h-full">
                    <RecordMap
                      setCoordinates={props.setCoordinates}
                      coordinates={props.coordinates}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div
              className="flex-shrink-0"
              style={{ height: LAYOUT_CONFIG.BOTTOM_BAR_HEIGHT }}
            >
              <RecordBottomBar
                evidenceData={evidenceData}
                analysisResult={analysisResult}
                province={selectedProvinceObj}
                district={selectedDistrictObj}
                subdistrict={selectedSubdistrictObj}
                houseNumber={houseNumber}
                village={village}
                soi={soi}
                road={road}
                placeName={placeName}
                coordinates={coordinates}
                date={date}
                time={time}
                quantity={quantity}
              />
            </div>
          </div>
        );
      },
    [
      evidenceData,
      analysisResult,
      selectedProvinceObj,
      selectedDistrictObj,
      selectedSubdistrictObj,
      houseNumber,
      village,
      soi,
      road,
      placeName,
      coordinates,
      date,
      time,
      quantity,
    ]
  );

  /**
   * Mobile Layout Component with Map Modal
   * Best Practice: Component composition for complex UIs
   * Reference: https://medium.com/@karnikagupta1830/mastering-component-composition-in-react-a-comprehensive-guide-eb1ef8a740a3
   */
  const MobileLayout = useMemo(
    () =>
      function MobileLayoutComponent(props) {
        const [showMapModal, setShowMapModal] = useState(false);
        const [modalCoords, setModalCoords] = useState(null);
        const [modalPreview, setModalPreview] = useState(null);

        // Initialize modal with current coordinates
        useEffect(() => {
          if (showMapModal) {
            setModalCoords(props.coordinates || null);
            setModalPreview(null);
          }
        }, [showMapModal, props.coordinates]);

        // Fetch geocode preview for modal
        useEffect(() => {
          let active = true;
          setModalPreview(null);
          
          if (!modalCoords) return;

          const { lat, lng } = modalCoords;
          
          (async () => {
            try {
              await findAndAutoFillFromCoords(lat, lng, (data) => {
                if (!active) return;
                setModalPreview(data);
              });
            } catch (err) {
              console.warn('[MobileLayout] Geocode preview failed:', err);
            }
          })();

          return () => {
            active = false;
          };
        }, [modalCoords]);

        /**
         * Handle map modal confirmation
         * Apply preview data to form fields
         */
        const handleMapConfirm = useCallback(() => {
          if (!modalCoords) {
            setShowMapModal(false);
            return;
          }

          // Apply geocode preview to form
          if (modalPreview) {
            setPlaceName(modalPreview.placeName || '');
            setRoad(modalPreview.road || '');

            // Auto-select province
            const provObj = findByNameLoose(
              rawProvinceList,
              'province_name',
              modalPreview.provinceName
            );
            
            if (provObj) {
              setSelectedProvince(provObj.province_name);
              buildDistrictOptionsForProvince(provObj);

              // Auto-select district
              const distObj =
                findByNameLoose(rawDistrictList, 'district_name', modalPreview.districtName) ||
                findByNameLoose(rawDistrictList, 'amphoe_t', modalPreview.districtName);
              
              if (distObj) {
                setSelectedDistrict(distObj.district_name || distObj.amphoe_t);
                buildSubdistrictOptionsForDistrict(distObj);

                // Auto-select subdistrict
                const subObj =
                  findByNameLoose(
                    rawSubdistrictList,
                    'subdistrict_name',
                    modalPreview.subdistrictName
                  ) ||
                  findByNameLoose(rawSubdistrictList, 'tambon_t', modalPreview.subdistrictName);
                
                if (subObj) {
                  setSelectedSubdistrict(subObj.subdistrict_name || subObj.tambon_t);
                  const zip = subObj.zip_code;
                  
                  if (zip) {
                    setSelectedZipcode(zip);
                    setZipcodeOptions([{ value: zip, label: zip }]);
                  }
                }
              }
            }
          }

          // Set coordinates and close modal
          setCoordinatesIfChanged(modalCoords);
          setShowMapModal(false);
        }, [modalCoords, modalPreview]);

        return (
          <div className="flex flex-col min-h-screen bg-white relative">
            {/* Fixed Tab Bar */}
            <div
              className="fixed top-0 left-0 w-full z-20"
              style={{ height: LAYOUT_CONFIG.TAB_BAR_HEIGHT }}
            >
              <RecordTabBar />
            </div>

            {/* Scrollable Form Content */}
            <div
              className="flex-1 overflow-auto bg-white px-4 py-6"
              style={{
                paddingTop: LAYOUT_CONFIG.TAB_BAR_HEIGHT + 8,
                paddingBottom: LAYOUT_CONFIG.BOTTOM_BAR_HEIGHT + 8,
              }}
            >
              {/* Map Button */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  aria-label="เปิดเลือกตำแหน่งจากแผนที่"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-sm font-medium text-gray-700 ring-1 ring-gray-200 hover:shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <IoMapOutline size={16} className="text-[#990000]" />
                  <span>เลือกจากแผนที่</span>
                </button>
              </div>

              <LocationFormFields {...props} />
            </div>

            {/* Fixed Bottom Bar */}
            <div
              className="fixed bottom-0 left-0 w-full z-20 bg-white ring-1 ring-gray-50 shadow-sm"
              style={{ height: LAYOUT_CONFIG.BOTTOM_BAR_HEIGHT }}
            >
              <RecordBottomBar
                evidenceData={evidenceData}
                analysisResult={analysisResult}
                province={selectedProvinceObj}
                district={selectedDistrictObj}
                subdistrict={selectedSubdistrictObj}
                houseNumber={houseNumber}
                village={village}
                soi={soi}
                road={road}
                placeName={placeName}
                coordinates={coordinates}
                date={date}
                time={time}
                quantity={quantity}
              />
            </div>

            {/* Map Modal */}
            <MapModal
              isOpen={showMapModal}
              onClose={() => setShowMapModal(false)}
              coordinates={modalCoords}
              onCoordinatesChange={setModalCoords}
              onConfirm={handleMapConfirm}
              geocodePreview={modalPreview}
            />
          </div>
        );
      },
    [
      evidenceData,
      analysisResult,
      selectedProvinceObj,
      selectedDistrictObj,
      selectedSubdistrictObj,
      houseNumber,
      village,
      soi,
      road,
      placeName,
      coordinates,
      date,
      time,
      quantity,
      findAndAutoFillFromCoords,
      rawProvinceList,
      rawDistrictList,
      rawSubdistrictList,
      buildDistrictOptionsForProvince,
      buildSubdistrictOptionsForDistrict,
      setZipcodeOptions,
      setCoordinatesIfChanged,
    ]
  );

  return (
    <div className="flex-1 h-full w-full overflow-auto">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full flex-col">
        <DesktopLayout {...commonFormProps} />
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-full">
        <MobileLayout {...commonFormProps} />
      </div>
    </div>
  );
}

export default SaveToHistory;