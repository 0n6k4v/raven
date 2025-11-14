/**
 * RecordMap Component - Optimized for React 19 + Vite + Leaflet
 * 
 * Best Practices References:
 * - React 19: https://react.dev/blog/2024/12/05/react-19
 * - Leaflet.js: https://leafletjs.com/
 * - React-Leaflet: https://react-leaflet.js.org/docs/start-introduction/
 * - Vite Performance: https://vite.dev/guide/performance
 * - React Best Practices 2025: https://www.telerik.com/blogs/react-design-patterns-best-practices
 */

import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ========================= CONSTANTS ========================= */
// Documentation: Separate constants for maintainability and easy configuration
// Reference: https://www.devacetech.com/insights/react-best-practices
const MAP_CONFIG = {
  DEFAULT_CENTER: [13.7563, 100.5018],
  DEFAULT_ZOOM: 5,
  USER_ZOOM: 15,
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  TILE_ATTRIBUTION: '&copy; OpenStreetMap contributors',
};

const AUTO_SCROLL_CONFIG = {
  EDGE_PX: 50,
  STEP_PX: 10,
  INTERVAL_MS: 50,
};

const MARKER_CONFIG = {
  COLOR: '#990000',
  SIZE: [30, 42],
  ANCHOR: [15, 42],
};

/* ========================= UTILITY FUNCTIONS ========================= */
// Best Practice: Pure functions for reusability and testability
// Reference: https://www.telerik.com/blogs/react-design-patterns-best-practices

/**
 * Creates SVG marker icon to avoid external image dependencies
 * Performance: Reduces network requests by using inline SVG
 * @param {string} color - Marker color
 * @returns {L.DivIcon} Leaflet div icon
 */
const createMarkerIcon = (color = MARKER_CONFIG.COLOR) => {
  const svg = `
    <svg width="${MARKER_CONFIG.SIZE[0]}" height="${MARKER_CONFIG.SIZE[1]}" 
         viewBox="0 0 ${MARKER_CONFIG.SIZE[0]} ${MARKER_CONFIG.SIZE[1]}" 
         xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C9.477 0 5 4.477 5 10c0 7.5 10 22 10 22s10-14.5 10-22c0-5.523-4.477-10-10-10z" 
            fill="${color}"/>
      <circle cx="15" cy="11" r="4" fill="#fff" />
    </svg>`;
  
  return L.divIcon({
    className: 'raven-map-icon',
    html: svg,
    iconSize: MARKER_CONFIG.SIZE,
    iconAnchor: MARKER_CONFIG.ANCHOR,
  });
};

/* ========================= CUSTOM HOOKS ========================= */
// Best Practice: Extract complex logic into custom hooks for reusability
// Reference: https://www.devacetech.com/insights/react-best-practices

/**
 * Custom hook for managing auto-scroll functionality
 * Encapsulates auto-scroll logic for better separation of concerns
 * @param {React.RefObject} mapRef - Map reference
 * @param {React.RefObject} markerRef - Marker reference
 * @returns {Object} Auto-scroll control functions
 */
const useAutoScroll = (mapRef, markerRef) => {
  const timerRef = useRef(null);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      const map = mapRef.current;
      const marker = markerRef.current;
      if (!map || !marker) return;

      const point = map.latLngToContainerPoint(marker.getLatLng());
      const size = map.getSize();
      let dx = 0;
      let dy = 0;

      // Calculate scroll direction based on marker position
      if (point.x < AUTO_SCROLL_CONFIG.EDGE_PX) dx = -AUTO_SCROLL_CONFIG.STEP_PX;
      if (point.x > size.x - AUTO_SCROLL_CONFIG.EDGE_PX) dx = AUTO_SCROLL_CONFIG.STEP_PX;
      if (point.y < AUTO_SCROLL_CONFIG.EDGE_PX) dy = -AUTO_SCROLL_CONFIG.STEP_PX;
      if (point.y > size.y - AUTO_SCROLL_CONFIG.EDGE_PX) dy = AUTO_SCROLL_CONFIG.STEP_PX;

      if (dx === 0 && dy === 0) return;

      const centerPoint = size.divideBy(2).add(new L.Point(dx, dy));
      const targetLatLng = map.containerPointToLatLng(centerPoint);
      map.panTo(targetLatLng, { animate: false, duration: 0.05 });
    }, AUTO_SCROLL_CONFIG.INTERVAL_MS);
  }, [mapRef, markerRef]);

  const stopAutoScroll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { startAutoScroll, stopAutoScroll };
};

/**
 * Custom hook for managing marker operations
 * Separates marker logic from map initialization
 * @param {React.RefObject} mapRef - Map reference
 * @param {Function} onCoordinatesChange - Callback when coordinates change
 * @param {Object} scrollControls - Auto-scroll control functions
 * @returns {Object} Marker reference and control functions
 */
const useMarkerManager = (mapRef, onCoordinatesChange, { startAutoScroll, stopAutoScroll }) => {
  const markerRef = useRef(null);

  const createMarker = useCallback((latlng) => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    // Create new marker with drag functionality
    const icon = createMarkerIcon();
    markerRef.current = L.marker(latlng, { icon, draggable: true }).addTo(map);

    // Attach event handlers
    markerRef.current.on('dragstart', startAutoScroll);
    markerRef.current.on('dragend', () => {
      stopAutoScroll();
      if (markerRef.current) {
        const pos = markerRef.current.getLatLng();
        onCoordinatesChange({ lat: pos.lat, lng: pos.lng });
        map.panTo(pos);
      }
    });

    onCoordinatesChange({ lat: latlng.lat, lng: latlng.lng });
    map.panTo(latlng);
  }, [mapRef, onCoordinatesChange, startAutoScroll, stopAutoScroll]);

  const updateMarkerPosition = useCallback((lat, lng) => {
    const map = mapRef.current;
    if (!map) return;

    if (!markerRef.current) {
      const icon = createMarkerIcon();
      markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      
      markerRef.current.on('dragstart', startAutoScroll);
      markerRef.current.on('dragend', () => {
        stopAutoScroll();
        if (markerRef.current) {
          const pos = markerRef.current.getLatLng();
          onCoordinatesChange({ lat: pos.lat, lng: pos.lng });
          map.panTo(pos);
        }
      });
    } else {
      // Only update if position actually changed (avoid unnecessary updates)
      const current = markerRef.current.getLatLng();
      if (Math.abs(current.lat - lat) > 1e-6 || Math.abs(current.lng - lng) > 1e-6) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }

    // Center and zoom to user-level view
    try {
      map.setView([lat, lng], MAP_CONFIG.USER_ZOOM);
    } catch (err) {
      console.warn('[RecordMap] setView failed', err);
    }
  }, [mapRef, onCoordinatesChange, startAutoScroll, stopAutoScroll]);

  return { markerRef, createMarker, updateMarkerPosition };
};

/**
 * Main custom hook for Leaflet map initialization and management
 * Best Practice: Encapsulate complex side effects in custom hooks
 * Reference: https://react-leaflet.js.org/docs/start-introduction/
 * 
 * @param {Object} params - Hook parameters
 * @param {React.RefObject} params.mapContainerRef - Container element reference
 * @param {Function} params.onCoordinatesChange - Callback for coordinate updates
 * @param {Object|null} params.coordinates - Current coordinates {lat, lng}
 * @returns {Object} Map state and references
 */
const useLeafletMap = ({ mapContainerRef, onCoordinatesChange, coordinates }) => {
  const mapRef = useRef(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Use custom hooks for better code organization
  const markerRefForScroll = useRef(null);
  const { startAutoScroll, stopAutoScroll } = useAutoScroll(mapRef, markerRefForScroll);
  const { markerRef, createMarker, updateMarkerPosition } = useMarkerManager(
    mapRef, 
    onCoordinatesChange,
    { startAutoScroll, stopAutoScroll }
  );

  // Sync marker ref for auto-scroll hook
  useEffect(() => {
    markerRefForScroll.current = markerRef.current;
  }, [markerRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize map once
  // Best Practice: Separate initialization from updates
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    console.debug('[RecordMap] Initializing map');

    try {
      // Create map instance
      const map = L.map(container).setView(
        MAP_CONFIG.DEFAULT_CENTER, 
        MAP_CONFIG.DEFAULT_ZOOM
      );

      // Add tile layer
      const tileLayer = L.tileLayer(MAP_CONFIG.TILE_URL, {
        attribution: MAP_CONFIG.TILE_ATTRIBUTION,
      }).addTo(map);

      // Debug tile loading
      tileLayer.on('load', () => console.debug('[RecordMap] Tiles loaded'));
      tileLayer.on('tileerror', (err) => console.warn('[RecordMap] Tile error', err));

      // Performance: Mark ready immediately, tiles load asynchronously
      // Reference: https://vite.dev/guide/performance
      setIsInitializing(false);
      mapRef.current = map;

      // Attach click handler for marker creation
      map.on('click', (e) => {
        createMarker(e.latlng);
      });

    } catch (err) {
      console.error('[RecordMap] Initialization error', err);
      setIsInitializing(false);
    }

    // Cleanup function
    return () => {
      console.debug('[RecordMap] Cleaning up map');
      stopAutoScroll();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle coordinate updates from parent
  // Best Practice: Separate concerns - initialization vs updates
  useEffect(() => {
    if (!coordinates) return;
    updateMarkerPosition(coordinates.lat, coordinates.lng);
  }, [coordinates, updateMarkerPosition]);

  // Ensure map invalidates size when visible
  // Fixes common Leaflet rendering issues
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [mapContainerRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isInitializing, mapRef, markerRef };
};

/* ========================= MAIN COMPONENT ========================= */
/**
 * RecordMap Component
 * 
 * Best Practices Applied:
 * 1. Functional components (React 19 standard)
 * 2. Custom hooks for logic separation
 * 3. React.memo for performance optimization
 * 4. Proper cleanup in useEffect
 * 5. Immutable data patterns
 * 
 * References:
 * - https://react.dev/blog/2024/12/05/react-19
 * - https://www.telerik.com/blogs/react-design-patterns-best-practices
 * - https://leafletjs.com/
 * 
 * @param {Object} props - Component props
 * @param {Function} props.setCoordinates - Callback to update coordinates in parent
 * @param {Object|null} props.coordinates - Current coordinates {lat, lng}
 * @returns {JSX.Element} Map component
 */
const RecordMap = ({ setCoordinates, coordinates }) => {
  const mapContainerRef = useRef(null);
  
  const { isInitializing } = useLeafletMap({ 
    mapContainerRef, 
    onCoordinatesChange: setCoordinates, 
    coordinates 
  });

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Loading indicator - Better UX */}
      {isInitializing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="w-11/12 md:w-3/4 bg-white bg-opacity-90 rounded-lg p-4 shadow animate-pulse">
            <div className="h-5 bg-gray-200 rounded mb-3" />
            <div className="h-44 bg-gray-200 rounded mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      )}
      
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0"
        aria-label="Interactive map for location selection"
      />
    </div>
  );
};

/**
 * Performance Optimization: React.memo prevents unnecessary re-renders
 * Reference: https://react.dev/blog/2024/12/05/react-19
 * React 19: Auto-memoization with React Compiler (future enhancement)
 */
export default memo(RecordMap);