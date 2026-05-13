import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, LatLngBounds } from 'leaflet';
import { useUser } from '../../../auth';
import { useHistoryData } from '../../../history/hooks';
import { HistoryAccessPolicy } from '../../../history/utils';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class CoordinateVO {
  constructor(lat, lng) {
    this.lat = parseFloat(lat);
    this.lng = parseFloat(lng);
  }

  isValid() {
    const THAILAND_BOUNDS = { minLat: 5.6, maxLat: 20.5, minLng: 97.3, maxLng: 105.6 };
    if (Number.isNaN(this.lat) || Number.isNaN(this.lng)) return false;
    return this.lat >= THAILAND_BOUNDS.minLat && this.lat <= THAILAND_BOUNDS.maxLat &&
           this.lng >= THAILAND_BOUNDS.minLng && this.lng <= THAILAND_BOUNDS.maxLng;
  }

  toArray() {
    return [this.lat, this.lng];
  }
}

class MapBusinessService {
  static getOffsetPosition(lat, lng, index) {
    const offset = index * 0.00008;
    return [
      lat + (offset * Math.cos(index * 0.5)),
      lng + (offset * Math.sin(index * 0.5))
    ];
  }

  static getEvidenceIconConfig(evidence) {
    const isDrug = evidence?.category === "ยาเสพติด" || evidence?.exhibit?.category === "ยาเสพติด";
    return {
      url: isDrug ? '/drugpoint.png' : '/gunpoint.png',
      size: isDrug ? 30 : 50
    };
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useUserLocation() {
  const [location, setLocation] = useState([13.7563, 100.5018]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation([pos.coords.latitude, pos.coords.longitude]); setLoading(false); },
      () => { setLoading(false); },
      { maximumAge: 60_000, timeout: 5000 }
    );
  }, []);

  return { location, loading };
}

function useMapHistory(evidence, user) {
  const historyHook = useHistoryData(user, evidence);
  
  useEffect(() => {
    const params = HistoryAccessPolicy.getFetchParams(user, evidence);
    if (params?.exhibitId) {
      historyHook.fetchHistoryData(params);
    }
    return () => historyHook.abortFetch && historyHook.abortFetch();
  }, [evidence, user, historyHook.fetchHistoryData]);

  const itemsWithCoordinates = useMemo(() => {
    return (historyHook.data || [])
      .map(item => {
        const raw = item.originalData || {};
        const coord = new CoordinateVO(
          raw.latitude ?? raw.lat,
          raw.longitude ?? raw.lng
        );
        if (!coord.isValid()) return null;
        return { ...item, validatedCoord: coord };
      })
      .filter(Boolean);
  }, [historyHook.data]);

  return { ...historyHook, itemsWithCoordinates };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const MapBoundsAdjuster = React.memo(({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (!markers?.length) return;
    const bounds = new LatLngBounds();
    markers.forEach(m => bounds.extend(m.validatedCoord.toArray()));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
  }, [markers, map]);
  return null;
});

const StatusOverlay = React.memo(({ top, children }) => (
  <div 
    className="absolute left-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow z-[400] transition-all duration-300" 
    style={{ top }}
  >
    <div className="text-sm text-gray-600 font-medium">{children}</div>
  </div>
));

const HistoryMarker = React.memo(({ history, icon, position }) => (
  <Marker position={position} icon={icon}>
    <Popup>
      <div className="history-popup min-w-[200px] text-slate-800">
        <h3 className="font-bold border-b border-slate-200 pb-1 mb-1">{history.name}</h3>
        <p className="text-xs"><b>หมวดหมู่:</b> {history.category}</p>
        <p className="text-xs"><b>วันที่พบ:</b> {history.date} {history.time}</p>
        <p className="text-xs"><b>สถานที่:</b> {history.location}</p>
        <p className="text-xs text-gray-500 mt-1 italic">พิกัด: {position[0].toFixed(5)}, {position[1].toFixed(5)}</p>
        {history.image && (
          <img 
            src={history.image} 
            alt={history.name} 
            className="mt-2 w-full max-h-32 object-contain rounded border border-slate-100" 
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
      </div>
    </Popup>
  </Marker>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const Map = ({ evidence }) => {
  const { user } = useUser();
  const { location: currentPos, loading: locLoading } = useUserLocation();
  const { itemsWithCoordinates: items, isLoading: dataLoading, error } = useMapHistory(evidence, user);
  
  const [overlayTop, setOverlayTop] = useState(16);

  useEffect(() => {
    const syncHeight = () => {
      const nav = document.querySelector('nav[aria-label="Evidence profile tabs"]');
      setOverlayTop(nav ? nav.getBoundingClientRect().height + 8 : 16);
    };
    syncHeight();
    window.addEventListener('resize', syncHeight);
    return () => window.removeEventListener('resize', syncHeight);
  }, []);

  const iconFactory = (url, size) => new Icon({
    iconUrl: url,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });

  const evidenceIcon = useMemo(() => {
    const config = MapBusinessService.getEvidenceIconConfig(evidence);
    return iconFactory(config.url, config.size);
  }, [evidence]);

  if (!user) return null;

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="map-container w-full flex-1 min-h-0 rounded-lg overflow-hidden border border-gray-300">
        {locLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <p className="text-gray-400 animate-pulse text-sm">กำลังระบุตำแหน่งของคุณ...</p>
          </div>
        ) : (
          <MapContainer
            center={currentPos}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            maxBounds={[[5.6, 97.3], [20.5, 105.6]]}
            minZoom={5}
            zoomControl={false}
          >
            <ZoomControl position="bottomright" />
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution='&copy; OpenStreetMap contributors' 
            />

            <Marker position={currentPos} icon={iconFactory('/userpoint.png', 40)}>
              <Popup>ตำแหน่งปัจจุบันของคุณ</Popup>
            </Marker>

            {items.map((history, idx) => (
              <HistoryMarker 
                key={`marker-${history.id}`}
                history={history}
                icon={evidenceIcon}
                position={MapBusinessService.getOffsetPosition(
                  history.validatedCoord.lat, 
                  history.validatedCoord.lng, 
                  idx
                )}
              />
            ))}

            <MapBoundsAdjuster markers={items} />
          </MapContainer>
        )}

        {dataLoading && <StatusOverlay top={overlayTop}>กำลังโหลดประวัติ...</StatusOverlay>}
        {!dataLoading && items.length > 0 && (
          <StatusOverlay top={overlayTop}>พบประวัติ {items.length} รายการ (มีพิกัด)</StatusOverlay>
        )}
        {!dataLoading && items.length === 0 && !error && (
          <StatusOverlay top={overlayTop}>ไม่พบรายการที่มีพิกัด</StatusOverlay>
        )}
      </div>
    </div>
  );
};

export default React.memo(Map);