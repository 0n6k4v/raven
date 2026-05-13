import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.heat';
import { useGeoGraphy } from '../hooks';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class MapColorPalette {
  static getColor(amount) {
    if (typeof amount !== 'number' || amount < 0) return '#e2e8f0';
    if (amount <= 99) return '#e6f7ff';
    if (amount <= 999) return '#b3e0ff';
    if (amount <= 9999) return '#ccffcc';
    if (amount <= 99999) return '#8cd68c';
    if (amount <= 999999) return '#fff2b2';
    if (amount <= 9999999) return '#ffcc99';
    if (amount <= 99999999) return '#ff9999';
    return '#ff3333';
  }

  static isLight(hex) {
    if (!hex || hex.length < 7) return true;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp > 127.5;
  }
}

class MapIconService {
  static getIcon(type) {
    const iconConfig = {
      meth: 'https://static.wikia.nocookie.net/vietnamwar/images/4/40/Colt_Model_of_1911_U.S._Army_b.png/revision/latest/scale-to-width-down/300?cb=20120505065010',
      heroin: './Img/icon/siam.png',
      cannabis: './Img/icon/CR.png',
      cocaine: './Img/icon/comol.png',
      ketamine: './Img/icon/V.png',
      gun: 'https://upload.wikimedia.org/wikipedia/commons/2/26/M1911A1.png'
    };

    if (iconConfig[type]) {
      return new L.Icon({
        iconUrl: iconConfig[type],
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      });
    }
    return new L.Icon.Default();
  }
}

class MapAggregationService {
  static calculate(geoJson, poiData, filters, level, config) {
    if (!geoJson?.features || !poiData || !filters) return {};

    const filteredPoi = poiData.filter(p => {
      const type = p.category === 'อาวุธปืน' ? 'gun' : p.drug_type;
      return filters[type] && typeof p.amount === 'number';
    });

    const amounts = {};
    geoJson.features.forEach(feature => {
      const featureId = feature.properties[config.idProp];
      const featureName = feature.properties[config.nameProp];
      let total = 0;

      if (level === 'province') {
        total = filteredPoi.filter(p => p.province === featureName).reduce((s, p) => s + p.amount, 0);
      } else if (level === 'district') {
        const provId = feature.properties.province_id;
        total = filteredPoi.filter(p => {
          const poiProvId = config.provMap ? config.provMap[p.province] : null;
          return p.amphoe === featureName && poiProvId === provId;
        }).reduce((s, p) => s + p.amount, 0);
      } else if (level === 'subdistrict') {
        const distId = feature.properties.district_id;
        const parentDist = config.parentGeoJson?.features.find(d => d.properties.id === distId);
        if (parentDist) {
          const parentName = parentDist.properties.name;
          const parentProvId = parentDist.properties.province_id;
          total = filteredPoi.filter(p => {
            const poiProvId = config.provMap ? config.provMap[p.province] : null;
            return p.tambon === featureName && p.amphoe === parentName && poiProvId === parentProvId;
          }).reduce((s, p) => s + p.amount, 0);
        }
      }
      amounts[featureId] = total;
    });
    return amounts;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useMapGeographyProcessing = (provinces, districts, subdistricts, selectedProvinces, selectedDistricts, visibleLevels) => {
  const thailandGeoJson = useMemo(() => {
    if (!provinces?.length) return null;
    return {
      type: 'FeatureCollection',
      features: provinces.map(p => ({
        type: 'Feature', properties: { id: p.id, province_name: p.province_name }, geometry: p.geometry
      })),
    };
  }, [provinces]);

  const districtsGeoJson = useMemo(() => {
    if (!districts?.length || !visibleLevels.district) return null;
    const filtered = selectedProvinces.length > 0 
      ? districts.filter(d => selectedProvinces.some(p => p.id === d.province_id))
      : districts;
    return {
      type: 'FeatureCollection',
      features: filtered.map(d => ({
        type: 'Feature', 
        properties: { id: d.id, name: d.district_name || d.amphoe_t, province_id: d.province_id, district_id: d.id },
        geometry: d.geometry
      })),
    };
  }, [districts, selectedProvinces, visibleLevels.district]);

  const subdistrictsGeoJson = useMemo(() => {
    if (!subdistricts?.length || !visibleLevels.subdistrict) return null;
    const filtered = selectedDistricts.length > 0
      ? subdistricts.filter(sd => selectedDistricts.some(d => d.id === sd.district_id))
      : subdistricts;
    return {
      type: 'FeatureCollection',
      features: filtered.map(sd => ({
        type: 'Feature',
        properties: { id: sd.id, name: sd.subdistrict_name || sd.tambon_t, district_id: sd.district_id },
        geometry: sd.geometry
      })),
    };
  }, [subdistricts, selectedDistricts, visibleLevels.subdistrict]);

  return { thailandGeoJson, districtsGeoJson, subdistrictsGeoJson };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const MapController = memo(({ selectedAreas, visibleLevels }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !map._loaded) return;
    const fitBoundsToSelection = () => {
      const { provinces, districts, subdistricts } = selectedAreas;
      let target = subdistricts.length && visibleLevels.subdistrict ? subdistricts :
                   districts.length && visibleLevels.district ? districts : provinces;
      
      if (!target.length) {
        map.setView([13.7563, 100.5018], 6);
        return;
      }

      const latLngs = [];
      target.forEach(area => {
        if (!area.geometry) return;
        const coords = area.geometry.type === 'Polygon' ? [area.geometry.coordinates] : area.geometry.coordinates;
        coords.forEach(poly => poly.forEach(ring => ring.forEach(pt => latLngs.push(L.latLng(pt[1], pt[0])))));
      });

      if (latLngs.length) {
        const bounds = L.latLngBounds(latLngs);
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: false });
      }
    };
    const t = setTimeout(fitBoundsToSelection, 100);
    return () => clearTimeout(t);
  }, [map, selectedAreas, visibleLevels]);
  return null;
});

const HeatmapLayer = memo(({ points, options }) => {
  const map = useMap();
  const layerRef = useRef(null);

  const clear = useCallback(() => {
    if (layerRef.current && map) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
  }, [map]);

  useEffect(() => {
    if (!map?._loaded || !points?.length) return;
    clear();
    const t = setTimeout(() => {
      layerRef.current = L.heatLayer(points, options).addTo(map);
    }, 300);
    return () => { clearTimeout(t); clear(); };
  }, [map, points, options, clear]);
  return null;
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const LeafletMap = ({
  selectedProvinces = [], selectedDistricts = [], selectedSubdistricts = [],
  visibleLevels = { province: true, district: false, subdistrict: false },
  onProvinceClick = () => {}, onDistrictSelect = () => {}, onSubdistrictSelect = () => {},
  filters, poiData = [], viewMode = 'markers'
}) => {
  const { provinces, districts, subdistricts, loading } = useGeoGraphy();
  
  const { thailandGeoJson, districtsGeoJson, subdistrictsGeoJson } = useMapGeographyProcessing(
    provinces, districts, subdistricts, selectedProvinces, selectedDistricts, visibleLevels
  );

  const provMap = useMemo(() => thailandGeoJson?.features.reduce((acc, f) => {
    acc[f.properties.province_name] = f.properties.id; return acc;
  }, {}) || {}, [thailandGeoJson]);

  const stats = useMemo(() => ({
    province: MapAggregationService.calculate(thailandGeoJson, poiData, filters, 'province', { idProp: 'id', nameProp: 'province_name' }),
    district: MapAggregationService.calculate(districtsGeoJson, poiData, filters, 'district', { idProp: 'id', nameProp: 'name', provMap }),
    subdistrict: MapAggregationService.calculate(subdistrictsGeoJson, poiData, filters, 'subdistrict', { idProp: 'id', nameProp: 'name', provMap, parentGeoJson: districtsGeoJson })
  }), [thailandGeoJson, districtsGeoJson, subdistrictsGeoJson, poiData, filters, provMap]);

  const getRegionStyle = useCallback((level, selectedList, amountMap) => (feature) => {
    const id = feature.properties.id || feature.properties.district_id;
    const isSelected = selectedList.some(i => i.id === id);
    const colorMap = { province: '#2563eb', district: '#dd6b20', subdistrict: '#38a169' };
    return {
      weight: isSelected ? 2.5 : level === 'province' ? 1 : 1.5,
      opacity: 1,
      color: isSelected ? colorMap[level] : level === 'province' ? '#555' : '#888',
      fillOpacity: isSelected ? 0.65 : 0.45,
      fillColor: MapColorPalette.getColor(amountMap[id] || 0),
      dashArray: isSelected ? '' : level === 'province' ? '' : '3'
    };
  }, []);

  const createClusterIcon = useCallback((cluster) => {
    const totalAmount = cluster.getAllChildMarkers().reduce((sum, m) => sum + (m.options.amount || 0), 0);
    const count = cluster.getChildCount();
    const color = MapColorPalette.getColor(totalAmount);
    const diameter = count < 10 ? 30 : count < 100 ? 40 : 50;
    const html = `<div style="background-color: ${color}; width: ${diameter}px; height: ${diameter}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${MapColorPalette.isLight(color) ? '#333' : '#fff'}; border: 2px solid rgba(255,255,255,0.6); shadow: 0 2px 4px rgba(0,0,0,0.3);"><span>${count}</span></div>`;
    return L.divIcon({ html, className: 'custom-cluster', iconSize: L.point(diameter, diameter) });
  }, []);

  if (loading.provinces || loading.districts || loading.subdistricts) {
    return <div className="flex items-center justify-center h-full text-xl animate-pulse">กำลังโหลดข้อมูลแผนที่...</div>;
  }

  return (
    <div className="map-container h-full w-auto relative border border-gray-200">
      <MapContainer
        center={[13.7563, 100.5018]} zoom={6} minZoom={5} zoomControl={false}
        maxBounds={[[5.6, 97.3], [20.5, 105.6]]} style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        
        <MapController 
          selectedAreas={{ provinces: selectedProvinces, districts: selectedDistricts, subdistricts: selectedSubdistricts }} 
          visibleLevels={visibleLevels} 
        />

        {visibleLevels.province && thailandGeoJson && (
          <GeoJSON data={thailandGeoJson} style={getRegionStyle('province', selectedProvinces, stats.province)}
            onEachFeature={(f, l) => {
              l.on('click', () => onProvinceClick({ id: f.properties.id, province_name: f.properties.province_name, geometry: f.geometry }, true));
              l.bindTooltip(f.properties.province_name);
            }} 
          />
        )}

        {visibleLevels.district && districtsGeoJson && (
          <GeoJSON data={districtsGeoJson} style={getRegionStyle('district', selectedDistricts, stats.district)}
            onEachFeature={(f, l) => {
              l.on('click', () => onDistrictSelect({ id: f.properties.id, district_name: f.properties.name, province_id: f.properties.province_id, geometry: f.geometry }, false, true));
              l.bindTooltip(f.properties.name);
            }}
          />
        )}

        {visibleLevels.subdistrict && subdistrictsGeoJson && (
          <GeoJSON data={subdistrictsGeoJson} style={getRegionStyle('subdistrict', selectedSubdistricts, stats.subdistrict)}
            onEachFeature={(f, l) => {
              l.on('click', () => onSubdistrictSelect({ id: f.properties.id, subdistrict_name: f.properties.name, district_id: f.properties.district_id, geometry: f.geometry }, false, true));
              l.bindTooltip(f.properties.name);
            }}
          />
        )}

        {viewMode === 'heatmap' && (
          <HeatmapLayer 
            points={poiData.filter(p => filters[p.category === 'อาวุธปืน' ? 'gun' : p.drug_type]).map(p => [p.lat, p.lng, Math.min(Math.log10(p.amount + 1) / 3, 1) * 0.8])} 
            options={{ radius: 25, blur: 15, maxZoom: 15, minOpacity: 0.4 }} 
          />
        )}

        {viewMode === 'markers' && Object.entries(groupPoiByProvince(poiData)).map(([name, pois]) => (
          <MarkerClusterGroup key={name} iconCreateFunction={createClusterIcon} spiderfyOnMaxZoom disableClusteringAtZoom={12}>
            {pois.map(poi => {
              const type = poi.category === 'อาวุธปืน' ? 'gun' : poi.drug_type;
              if (!filters[type]) return null;
              return (
                <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={MapIconService.getIcon(type)} amount={poi.amount}>
                  <Popup>
                    <div className="text-sm font-sans">
                      <b className="text-blue-700">{poi.subcategory || type.toUpperCase()}</b><br/>
                      {poi.category === 'อาวุธปืน' ? (
                        <>ยี่ห้อ: {poi.brand || 'N/A'}<br/>จำนวน: {poi.amount?.toLocaleString()} กระบอก</>
                      ) : (
                        <>ประเภท: {poi.drug_type}<br/>จำนวน: {poi.amount?.toLocaleString()} {poi.subcategory === 'เม็ด' ? 'เม็ด' : 'หน่วย'}</>
                      )}
                      <hr className="my-1"/>
                      <span className="text-gray-500 text-xs">{poi.tambon}, {poi.amphoe}, {poi.province}</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        ))}
      </MapContainer>
    </div>
  );
};

function groupPoiByProvince(data) {
  return data?.reduce((acc, poi) => {
    const p = poi.province || 'Unknown';
    if (!acc[p]) acc[p] = [];
    acc[p].push(poi);
    return acc;
  }, {}) || {};
}

export default memo(LeafletMap);