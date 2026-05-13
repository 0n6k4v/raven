import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

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

class MapMarkerService {
  static createIconHtml(color = '#990000') {
    return `
      <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C9.477 0 5 4.477 5 10c0 7.5 10 22 10 22s10-14.5 10-22c0-5.523-4.477-10-10-10z" fill="${color}"/>
        <circle cx="15" cy="11" r="4" fill="#fff" />
      </svg>`;
  }

  static getIcon(color) {
    return L.divIcon({
      className: 'raven-map-icon',
      html: this.createIconHtml(color),
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    });
  }
}

class MapMathService {
  static calculateScrollDelta(point, viewportSize, config) {
    let dx = 0;
    let dy = 0;
    if (point.x < config.EDGE_PX) dx = -config.STEP_PX;
    if (point.x > viewportSize.x - config.EDGE_PX) dx = config.STEP_PX;
    if (point.y < config.EDGE_PX) dy = -config.STEP_PX;
    if (point.y > viewportSize.y - config.EDGE_PX) dy = config.STEP_PX;
    return { dx, dy };
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useMapAutoScroll = (mapRef, markerRef) => {
  const timerRef = useRef(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    timerRef.current = setInterval(() => {
      const map = mapRef.current;
      const marker = markerRef.current;
      if (!map || !marker) return;

      const point = map.latLngToContainerPoint(marker.getLatLng());
      const size = map.getSize();
      const { dx, dy } = MapMathService.calculateScrollDelta(point, size, AUTO_SCROLL_CONFIG);

      if (dx === 0 && dy === 0) return;

      const centerPoint = size.divideBy(2).add(new L.Point(dx, dy));
      map.panTo(map.containerPointToLatLng(centerPoint), { animate: false, duration: 0.05 });
    }, AUTO_SCROLL_CONFIG.INTERVAL_MS);
  }, [mapRef, markerRef, stop]);

  useEffect(() => () => stop(), [stop]);

  return { startAutoScroll: start, stopAutoScroll: stop };
};

const useMarkerInteraction = (mapRef, onCoordinatesChange, { startAutoScroll, stopAutoScroll }) => {
  const markerRef = useRef(null);

  const setupMarker = useCallback((latlng) => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) map.removeLayer(markerRef.current);

    const marker = L.marker(latlng, { 
      icon: MapMarkerService.getIcon(), 
      draggable: true 
    }).addTo(map);

    marker.on('dragstart', startAutoScroll);
    marker.on('dragend', () => {
      stopAutoScroll();
      const pos = marker.getLatLng();
      onCoordinatesChange({ lat: pos.lat, lng: pos.lng });
      map.panTo(pos);
    });

    markerRef.current = marker;
    return marker;
  }, [mapRef, onCoordinatesChange, startAutoScroll, stopAutoScroll]);

  return { markerRef, setupMarker };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const MapLoadingSkeleton = memo(() => (
  <div className="absolute inset-0 z-10 flex items-center justify-center">
    <div className="w-11/12 md:w-3/4 bg-white bg-opacity-90 rounded-lg p-4 shadow animate-pulse">
      <div className="h-5 bg-gray-200 rounded mb-3" />
      <div className="h-44 bg-gray-200 rounded mb-3" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const RecordMap = ({ setCoordinates, coordinates }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const { startAutoScroll, stopAutoScroll } = useMapAutoScroll(mapRef, useRef(null));
  const { markerRef, setupMarker } = useMarkerInteraction(
    mapRef, 
    setCoordinates, 
    { startAutoScroll, stopAutoScroll }
  );

  const syncMarkerRef = useMapAutoScroll(mapRef, markerRef);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    try {
      const map = L.map(container).setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);
      L.tileLayer(MAP_CONFIG.TILE_URL, { attribution: MAP_CONFIG.TILE_ATTRIBUTION }).addTo(map);
      
      map.on('click', (e) => {
        setupMarker(e.latlng);
        setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRef.current = map;
      setIsInitializing(false);
    } catch (err) {
      console.error('[RecordMap] Init error', err);
      setIsInitializing(false);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [setupMarker, setCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!coordinates || !map) return;

    const { lat, lng } = coordinates;
    const currentMarker = markerRef.current;

    if (!currentMarker) {
      setupMarker([lat, lng]);
    } else {
      const currentPos = currentMarker.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 1e-6 || Math.abs(currentPos.lng - lng) > 1e-6) {
        currentMarker.setLatLng([lat, lng]);
      }
    }
    map.setView([lat, lng], MAP_CONFIG.USER_ZOOM);
  }, [coordinates, setupMarker]);

  useEffect(() => {
    const timer = setTimeout(() => mapRef.current?.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative">
      {isInitializing && <MapLoadingSkeleton />}
      
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0"
        aria-label="Interactive map for location selection"
      />
    </div>
  );
};

export default memo(RecordMap);