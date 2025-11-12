import React, { useEffect, useState, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ========================= CONSTANTS ========================= */
const DEFAULT_CENTER = [13.7563, 100.5018];
const DEFAULT_ZOOM = 5;
const USER_ZOOM = 15;
const AUTO_SCROLL_EDGE_PX = 50;
const AUTO_SCROLL_STEP_PX = 10;
const AUTO_SCROLL_INTERVAL_MS = 50;

/* ========================= UTILS ========================= */
const safeParseJson = async (res) => {
  try { return await res.json(); } catch { return null; }
};

const fetchAddress = async ({ lat, lng, signal }) => {
  if (!lat || !lng) return null;
  const url = `${import.meta.env.VITE_API_URL}/api/geocode/reverse?lat=${lat}&lng=${lng}`;
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      const text = await response.text();
      const errMsg = text || response.statusText || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }
    const json = await safeParseJson(response);
    if (!json) return null;
    if (json.ok) return json.data || null;
    throw new Error(json.message || 'geocode error');
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.error('fetchAddress error', err);
    return null;
  }
};

/* ========================= CUSTOM HOOKS ========================= */
function useLeafletMap({ mapContainerRef, onCoordinatesChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const autoScrollTimerRef = useRef(null);
  const fetchAbortRef = useRef(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // helper: start auto-scroll interval for marker
  const startAutoScroll = useCallback(() => {
    if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    autoScrollTimerRef.current = setInterval(() => {
      const map = mapRef.current;
      const marker = markerRef.current;
      if (!map || !marker) return;
      const point = map.latLngToContainerPoint(marker.getLatLng());
      const size = map.getSize();
      let dx = 0, dy = 0;
      if (point.x < AUTO_SCROLL_EDGE_PX) dx = -AUTO_SCROLL_STEP_PX;
      if (point.x > size.x - AUTO_SCROLL_EDGE_PX) dx = AUTO_SCROLL_STEP_PX;
      if (point.y < AUTO_SCROLL_EDGE_PX) dy = -AUTO_SCROLL_STEP_PX;
      if (point.y > size.y - AUTO_SCROLL_EDGE_PX) dy = AUTO_SCROLL_STEP_PX;
      if (dx === 0 && dy === 0) return;
      const centerPoint = size.divideBy(2).add(new L.Point(dx, dy));
      const targetLatLng = map.containerPointToLatLng(centerPoint);
      map.panTo(targetLatLng, { animate: false, duration: 0.05 });
    }, AUTO_SCROLL_INTERVAL_MS);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  }, []);

  // initialize map once container is ready
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;
    console.debug('[RecordMap] init start', { container });

    try {
      mapRef.current = L.map(container).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      tileLayer.on('load', () => console.debug('[RecordMap] tilelayer loaded'));
      tileLayer.on('tileerror', (err) => console.warn('[RecordMap] tile error', err));

      // Mark map ready immediately when map object is created
      // Don't wait for all tiles to load - they load asynchronously in background
      console.debug('[RecordMap] map initialized -> ready');
      setIsInitializing(false);

      // geolocation
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.debug('[RecordMap] geolocation success', pos.coords);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (!mapRef.current) return;
          mapRef.current.setView([lat, lng], USER_ZOOM);
          // create marker only after we have coords
          if (!markerRef.current) {
            markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
            onCoordinatesChange?.({ lat, lng });
            markerRef.current.on('dragstart', () => startAutoScroll());
            markerRef.current.on('dragend', async () => {
              stopAutoScroll();
              const newPos = markerRef.current.getLatLng();
              onCoordinatesChange?.({ lat: newPos.lat, lng: newPos.lng });
              mapRef.current?.panTo(newPos);
            });
          }
        },
        (err) => {
          console.warn('[RecordMap] geolocation failed', err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );

      // click to add/change marker (unchanged)
      mapRef.current.on('click', async (e) => {
        if (!mapRef.current) return;
        if (markerRef.current) {
          mapRef.current.removeLayer(markerRef.current);
          markerRef.current = null;
        }
        markerRef.current = L.marker(e.latlng, { draggable: true }).addTo(mapRef.current);
        onCoordinatesChange?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        markerRef.current.on('dragstart', () => startAutoScroll());
        markerRef.current.on('dragend', async () => {
          stopAutoScroll();
          const newPos = markerRef.current.getLatLng();
          onCoordinatesChange?.({ lat: newPos.lat, lng: newPos.lng });
          mapRef.current?.panTo(newPos);
        });
        mapRef.current.panTo(e.latlng);
      });
    } catch (err) {
      console.error('[RecordMap] Leaflet init error', err);
      setIsInitializing(false);
    }

    return () => {
      console.debug('[RecordMap] cleanup - removing map');
      stopAutoScroll();
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
        fetchAbortRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [mapContainerRef, onCoordinatesChange, startAutoScroll, stopAutoScroll]);

  // ensure map invalidates size when container becomes visible
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [mapContainerRef.current]);

  return { isInitializing, mapRef, markerRef };
}

/* ========================= MAIN COMPONENT ========================= */
const RecordMap = ({ setCoordinates }) => {
  const mapContainerRef = useRef(null);
  const { isInitializing } = useLeafletMap({ mapContainerRef, onCoordinatesChange: setCoordinates });
  return (
    <div className="w-full h-full flex flex-col">
      {isInitializing && (
        <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
          <span className="text-gray-600">กำลังโหลดแผนที่...</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};

export default React.memo(RecordMap);