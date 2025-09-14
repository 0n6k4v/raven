import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, LatLngBounds } from 'leaflet';
import { useUser } from '../../hooks/useUser';
// useExhibitHistoryData ยังไม่ได้ใช้งาน / service ยังไม่พร้อม — คอมเมนต์การ import เพื่อป้องกัน error
// import useExhibitHistoryData from "../../hooks/useExhibitHistoryData";

// ==================== CONSTANTS ====================
const DEFAULT_CENTER = [13.7563, 100.5018];
const THAILAND_BOUNDS = { minLat: 5.6, maxLat: 20.5, minLng: 97.3, maxLng: 105.6 };
const DEFAULT_GUN_ICON = '/gunpoint.png';
const DEFAULT_DRUG_ICON = '/drugpoint.png';

// ==================== UTILS ====================
const inThailandBounds = (lat, lng) => {
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  return lat >= THAILAND_BOUNDS.minLat && lat <= THAILAND_BOUNDS.maxLat &&
         lng >= THAILAND_BOUNDS.minLng && lng <= THAILAND_BOUNDS.maxLng;
};

const parseCoordinate = (value) => {
  const v = parseFloat(value);
  return Number.isNaN(v) ? null : v;
};

const validateCoordinates = (lat, lng) => {
  const latitude = parseCoordinate(lat);
  const longitude = parseCoordinate(lng);
  if (latitude === null || longitude === null) return null;
  if (!inThailandBounds(latitude, longitude)) return null;
  return [latitude, longitude];
};

const chooseIconUrl = (evidence) => {
  if (!evidence) return DEFAULT_GUN_ICON;
  const isDrug = evidence.category === "ยาเสพติด" || evidence?.exhibit?.category === "ยาเสพติด";
  return isDrug ? DEFAULT_DRUG_ICON : DEFAULT_GUN_ICON;
};

const createIcon = (imageUrl, size = 50) =>
  new Icon({
    iconUrl: imageUrl,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });

const offsetPosition = (lat, lng, index) => {
  const offset = index * 0.00008;
  return [
    lat + (offset * Math.cos(index * 0.5)),
    lng + (offset * Math.sin(index * 0.5))
  ];
};

const buildItemsWithCoordinates = (historyData = []) => {
  return historyData
    .map(item => {
      const lat = item?.originalData?.latitude ?? item?.originalData?.lat;
      const lng = item?.originalData?.longitude ?? item?.originalData?.lng;
      const valid = validateCoordinates(lat, lng);
      if (!valid) return null;
      return {
        ...item,
        originalData: {
          ...item.originalData,
          latitude: valid[0],
          longitude: valid[1]
        }
      };
    })
    .filter(Boolean);
};

// ==================== CUSTOM HOOKS ====================
function useMapLogic(evidence) {
  const [user] = useUser();
  // เมื่อ hook ไม่ถูกใช้งาน ให้ใช้ fallback ค่าเริ่มต้น (no-op) เพื่อไม่ให้เกิด ReferenceError
  // หากต้องการเปิดการใช้งาน ให้ยกเลิก comment ด้านล่างและนำการ import กลับมา
  // const { data: historyData = [], isLoading: historyLoading = false, error: historyError = null, fetchExhibitHistoryData } = useExhibitHistoryData();
  const historyData = [];
  const historyLoading = false;
  const historyError = null;
  const fetchExhibitHistoryData = async () => {
    // no-op fallback while hook is disabled
    return;
  };
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_CENTER);
  const [isLocLoading, setIsLocLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) { setIsLocLoading(false); return; }
    let mounted = true;
    navigator.geolocation.getCurrentPosition(
      pos => { if (!mounted) return; setCurrentLocation([pos.coords.latitude, pos.coords.longitude]); setIsLocLoading(false); },
      () => { if (!mounted) return; setCurrentLocation(DEFAULT_CENTER); setIsLocLoading(false); },
      { maximumAge: 60_000, timeout: 5000 }
    );
    return () => { mounted = false; };
  }, []);

  // useEffect ที่เรียก fetchExhibitHistoryData ถูกคอมเมนต์ไว้ชั่วคราว
  // เมื่อต้องการเปิดการใช้งาน ให้ยกเลิก comment และนำ hook กลับมา import
  /*
  useEffect(() => {
    if (!evidence?.exhibit_id || !user) return;
    const userId = user?.user_id || user?.id;
    const evidenceCategory = evidence?.category || evidence?.exhibit?.category;

    if (user?.role?.id === 1) {
      fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id });
      return;
    }

    if (user?.role?.id === 2) {
      if (user?.department === "กลุ่มงานอาวุธปืน") {
        if (evidenceCategory === "ปืน" || evidenceCategory === "อาวุธปืน") {
          fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id });
        } else {
          fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id, userId });
        }
        return;
      }
      if (user?.department === "กลุ่มงานยาเสพติด") {
        if (evidenceCategory === "ยาเสพติด") {
          fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id });
        } else {
          fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id, userId });
        }
        return;
      }
    }

    if (userId) fetchExhibitHistoryData({ exhibitId: evidence.exhibit_id, userId });
  }, [evidence, user, fetchExhibitHistoryData]);
  */

  const itemsWithCoordinates = useMemo(() => buildItemsWithCoordinates(historyData), [historyData]);

  return {
    user,
    historyData,
    itemsWithCoordinates,
    historyLoading,
    historyError,
    currentLocation,
    isLocLoading
  };
}

// ==================== PRESENTATIONAL ====================
const MapBoundsAdjuster = React.memo(function MapBoundsAdjuster({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    try {
      const bounds = new LatLngBounds();
      markers.forEach(m => {
        const lat = m.originalData?.latitude;
        const lng = m.originalData?.longitude;
        if (lat !== undefined && lng !== undefined) bounds.extend([lat, lng]);
      });
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    } catch (err) {
    }
  }, [markers, map]);
  return null;
});

const LoadingBox = React.memo(({ message = 'กำลังโหลดแผนที่...' }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="text-gray-500">{message}</div>
  </div>
));

const NoPermissionBox = React.memo(({ message }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="text-center text-gray-500 p-4">{message}</div>
  </div>
));

// ==================== MAIN COMPONENT ====================
const Map = ({ evidence, isMobile = false }) => {
  const { user, itemsWithCoordinates, historyLoading, historyError, currentLocation, isLocLoading } = useMapLogic(evidence);

  const hasPermission = useCallback(() => {
    if (!user) return false;
    if (user?.role?.id === 1) return true;
    if (user?.role?.id === 2 || user?.role?.id === 3) return true;
    return false;
  }, [user]);

  const evidenceIcon = useMemo(() => {
    const url = chooseIconUrl(evidence);
    const size = (evidence && (evidence.category === "ยาเสพติด" || evidence?.exhibit?.category === "ยาเสพติด")) ? 30 : 50;
    return createIcon(url, size);
  }, [evidence]);

  if (!evidence || !hasPermission()) {
    const message = !user ? "กำลังโหลดข้อมูลผู้ใช้..." :
      (user?.role?.id === 2 && user?.department === "กลุ่มงานยาเสพติด" && evidence && !(evidence.category === "ยาเสพติด" || evidence?.exhibit?.category === "ยาเสพติด"))
        ? "คุณไม่มีสิทธิ์ดูประวัติของหลักฐานประเภทนี้"
        : "ไม่มีข้อมูลประวัติที่สามารถแสดงบนแผนที่ได้";

    return (
      <div className="w-full h-full">
        <div className="map-container w-full h-full rounded-lg overflow-hidden border border-gray-300">
          {(isLocLoading) ? <LoadingBox /> : <NoPermissionBox message={message} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="map-container w-full flex-grow rounded-lg overflow-hidden border border-gray-300">
        {(isLocLoading) ? (
          <LoadingBox />
        ) : (
          <MapContainer
            center={currentLocation}
            zoom={13}
            style={{ height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 140px)', width: '100%' }}
            maxBounds={[[THAILAND_BOUNDS.minLat, THAILAND_BOUNDS.minLng], [THAILAND_BOUNDS.maxLat, THAILAND_BOUNDS.maxLng]]}
            minZoom={5}
            zoomControl={false}
            className="relative w-full h-full"
          >
            <ZoomControl position="bottomright" />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />

            <Marker position={currentLocation} icon={createIcon('/userpoint.png', 40)}>
              <Popup>ตำแหน่งปัจจุบันของคุณ</Popup>
            </Marker>

            {itemsWithCoordinates.map((history, idx) => {
              const lat = history.originalData.latitude;
              const lng = history.originalData.longitude;
              const position = offsetPosition(lat, lng, idx);
              return (
                <Marker key={`marker-${history.id}`} position={position} icon={evidenceIcon}>
                  <Popup>
                    <div className="history-popup">
                      <h3 className="font-semibold">{history.name}</h3>
                      <p>หมวดหมู่: {history.category}</p>
                      <p>วันที่พบ: {history.date} {history.time}</p>
                      <p>สถานที่: {history.location}</p>
                      <p>บันทึกโดย: {history.discoverer_name}</p>
                      <p className="text-xs text-gray-500">พิกัด: {position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
                      {history.image && <img src={history.image} alt={history.name} className="mt-2 w-full max-h-32 object-contain rounded" onError={(e) => { e.target.style.display = 'none'; }} />}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            <MapBoundsAdjuster markers={itemsWithCoordinates} />
          </MapContainer>
        )}

        {historyLoading && (
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow">
            <div className="text-sm text-gray-600">กำลังโหลดประวัติ...</div>
          </div>
        )}

        {!historyLoading && itemsWithCoordinates.length > 0 && (
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow">
            <div className="text-sm text-gray-600">พบประวัติ {itemsWithCoordinates.length} รายการ (มีพิกัด)</div>
          </div>
        )}

        {!historyLoading && historyError === "empty" && (
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow">
            <div className="text-sm text-gray-600">ไม่พบประวัติของวัตถุพยานนี้</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;