import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { Icon } from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.heat';
import { useGeoGraphy } from '../../hooks/useGeoGraphy';

/* ========================= CONSTANTS ========================= */
const methIcon = new Icon({
  iconUrl: 'https://static.wikia.nocookie.net/vietnamwar/images/4/40/Colt_Model_of_1911_U.S._Army_b.png/revision/latest/scale-to-width-down/300?cb=20120505065010',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});
const heroinIcon = new Icon({
  iconUrl: './Img/icon/siam.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});
const cannabisIcon = new Icon({
  iconUrl: './Img/icon/CR.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});
const cocaineIcon = new Icon({
  iconUrl: './Img/icon/comol.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});
const ketamineIcon = new Icon({
  iconUrl: './Img/icon/V.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});
const gunIcon = new Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/M1911A1.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ========================= UTILS ========================= */
function getDrugIcon(type) {
  switch (type) {
    case 'meth': return methIcon;
    case 'heroin': return heroinIcon;
    case 'cannabis': return cannabisIcon;
    case 'cocaine': return cocaineIcon;
    case 'ketamine': return ketamineIcon;
    case 'gun': return gunIcon;
    default: return L.Icon.Default();
  }
}

function getColorByAmount(amount) {
  if (typeof amount !== 'number' || amount < 0) return '#e2e8f0';
  if (amount <= 99) return '#e6f7ff';
  if (amount <= 999) return '#b3e0ff';
  if (amount <= 9999) return '#ccffcc';
  if (amount <= 99999) return '#8cd68c';
  if (amount <= 999999) return '#fff2b2';
  if (amount <= 9999999) return '#ffcc99';
  if (amount <= 99999999) return '#ff9999';
  if (amount >= 100000000) return '#ff3333';
  return '#e2e8f0';
}

function groupPoiByProvince(data) {
  if (!data || data.length === 0) return {};
  return data.reduce((acc, poi) => {
    const province = poi.province || 'UnknownProvince';
    if (!acc[province]) acc[province] = [];
    acc[province].push(poi);
    return acc;
  }, {});
}

function calculateAggregatedAmounts(
  geoJsonData,
  poiData,
  activeFilters,
  level,
  namePropertyInGeoJson,
  idPropertyInGeoJson,
  parentGeoJsonData = null,
  provinceNameToIdMap = null
) {
  if (!geoJsonData || !geoJsonData.features || !poiData || !activeFilters) return {};

  const filteredPoi = poiData.filter(p => {
    let effectiveType;
    if (p.category === 'อาวุธปืน') {
      effectiveType = 'gun';
    } else if (p.category === 'ยาเสพติด' && p.drug_type) {
      effectiveType = p.drug_type;
    } else {
      return false;
    }
    return activeFilters[effectiveType] && typeof p.amount === 'number';
  });

  const amounts = {};

  geoJsonData.features.forEach(feature => {
    const featureId = feature.properties[idPropertyInGeoJson];
    const featureName = feature.properties[namePropertyInGeoJson];
    let totalAmount = 0;

    if (level === 'province') {
      totalAmount = filteredPoi
        .filter(poi => poi.province === featureName)
        .reduce((sum, poi) => sum + poi.amount, 0);
    } else if (level === 'district') {
      const provinceIdOfCurrentDistrict = feature.properties.province_id;
      totalAmount = filteredPoi
        .filter(poi => {
          const poiProvId = provinceNameToIdMap ? provinceNameToIdMap[poi.province] : null;
          return poi.amphoe === featureName && poiProvId === provinceIdOfCurrentDistrict;
        })
        .reduce((sum, poi) => sum + poi.amount, 0);
    } else if (level === 'subdistrict') {
      const districtIdOfCurrentSubdistrict = feature.properties.district_id;
      const parentDistrictFeature = parentGeoJsonData?.features.find(
        d => d.properties.id === districtIdOfCurrentSubdistrict
      );
      if (parentDistrictFeature) {
        const parentDistrictName = parentDistrictFeature.properties.name;
        const provinceIdOfParentDistrict = parentDistrictFeature.properties.province_id;
        totalAmount = filteredPoi
          .filter(poi => {
            const poiProvId = provinceNameToIdMap ? provinceNameToIdMap[poi.province] : null;
            return (
              poi.tambon === featureName &&
              poi.amphoe === parentDistrictName &&
              poiProvId === provinceIdOfParentDistrict
            );
          })
          .reduce((sum, poi) => sum + poi.amount, 0);
      }
    }
    amounts[featureId] = totalAmount;
  });
  return amounts;
}

function isLightColor(hexColor) {
  if (!hexColor || hexColor.length < 7) return true;
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp > 127.5;
}

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const MapController = memo(function MapController({ selectedAreas, visibleLevels }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !map._loaded) return;

    const fitBoundsToSelection = () => {
      try {
        const { provinces, districts, subdistricts } = selectedAreas;
        const noSelection =
          (!provinces || provinces.length === 0) &&
          (!districts || districts.length === 0) &&
          (!subdistricts || subdistricts.length === 0);

        if (noSelection) {
          map.setView([13.7563, 100.5018], 6, { animate: false, duration: 0 });
          return;
        }

        let bounds = null;
        let targetAreas = [];

        if (subdistricts && subdistricts.length > 0 && visibleLevels.subdistrict) {
          targetAreas = subdistricts;
        } else if (districts && districts.length > 0 && visibleLevels.district) {
          targetAreas = districts;
        } else if (provinces && provinces.length > 0) {
          targetAreas = provinces;
        }

        if (targetAreas.length > 0) {
          const latLngs = [];
          targetAreas.forEach(area => {
            if (area.geometry && area.geometry.coordinates) {
              const processCoordinates = (coords, type) => {
                if (type === 'Polygon') {
                  coords.forEach(ring => {
                    ring.forEach(point => {
                      latLngs.push(L.latLng(point[1], point[0]));
                    });
                  });
                } else if (type === 'MultiPolygon') {
                  coords.forEach(polygon => {
                    polygon.forEach(ring => {
                      ring.forEach(point => {
                        latLngs.push(L.latLng(point[1], point[0]));
                      });
                    });
                  });
                }
              };
              const geometryType = area.geometry.type;
              processCoordinates(area.geometry.coordinates, geometryType);
            }
          });
          if (latLngs.length > 0) {
            bounds = L.latLngBounds(latLngs);
            if (bounds.isValid()) {
              map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 13,
                animate: false,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in MapController:', error);
      }
    };

    const timer = setTimeout(() => {
      fitBoundsToSelection();
    }, 100);

    return () => clearTimeout(timer);
  }, [map, selectedAreas, visibleLevels]);

  return null;
});

const HeatmapLayer = memo(function HeatmapLayer({ points, options }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !map._container) return;
    const canvasElements = map._container.querySelectorAll('canvas');
    canvasElements.forEach(canvas => {
      try {
        canvas.getContext('2d', { willReadFrequently: true });
      } catch (e) {}
    });
  }, [map]);

  const removeHeatLayer = useCallback(() => {
    if (heatLayerRef.current && map) {
      try {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      } catch (error) {}
    }
  }, [map]);

  useEffect(() => {
    if (!map || !map._loaded || !map.getSize().x || !map.getSize().y) return;
    removeHeatLayer();
    if (!points || !Array.isArray(points) || points.length === 0) return;

    const validPoints = points.filter(point =>
      Array.isArray(point) &&
      point.length >= 2 &&
      typeof point[0] === 'number' &&
      typeof point[1] === 'number' &&
      !isNaN(point[0]) && !isNaN(point[1])
    );
    if (validPoints.length === 0) return;

    const timer = setTimeout(() => {
      try {
        const heatLayer = L.heatLayer(validPoints, { ...options });
        map.addLayer(heatLayer);
        heatLayerRef.current = heatLayer;
      } catch (error) {}
    }, 300);

    return () => {
      clearTimeout(timer);
      removeHeatLayer();
    };
  }, [map, points, options, removeHeatLayer]);

  return null;
});

/* ========================= MAIN COMPONENT ========================= */
const LeafletMap = ({
  selectedProvinces = [],
  selectedDistricts = [],
  selectedSubdistricts = [],
  visibleLevels = { province: true, district: false, subdistrict: false },
  onProvinceClick = () => {},
  onDistrictSelect = () => {},
  onSubdistrictSelect = () => {},
  filters,
  showElements = {
    routes: true,
    distribution: true,
    hotspots: true,
  },
  viewMode = 'markers',
  evidenceData = null,
  poiData = [],
}) => {
  // --- Geography data ---
  const { provinces, districts, subdistricts, loading } = useGeoGraphy();

  // --- GeoJSON Memoization ---
  const thailandGeoJson = useMemo(() => {
    if (!provinces || provinces.length === 0) return null;
    return {
      type: 'FeatureCollection',
      features: provinces.map(p => ({
        type: 'Feature',
        properties: { id: p.id, province_name: p.province_name },
        geometry: p.geometry,
      })),
    };
  }, [provinces]);

  const districtsGeoJson = useMemo(() => {
    if (!districts || districts.length === 0 || !visibleLevels.district) return null;
    const filteredDistricts = selectedProvinces.length > 0
      ? districts.filter(d => selectedProvinces.some(p => p.id === d.province_id))
      : districts;
    return {
      type: 'FeatureCollection',
      features: filteredDistricts.map(district => ({
        type: 'Feature',
        properties: {
          id: district.id,
          name: district.district_name || district.amphoe_t || `District ${district.id}`,
          province_id: district.province_id,
          district_id: district.id,
        },
        geometry: district.geometry,
      })),
    };
  }, [districts, selectedProvinces, visibleLevels.district]);

  const subdistrictsGeoJson = useMemo(() => {
    if (!subdistricts || subdistricts.length === 0 || !visibleLevels.subdistrict) return null;
    const filteredSubdistricts = selectedDistricts.length > 0
      ? subdistricts.filter(sd => selectedDistricts.some(d => d.id === sd.district_id))
      : subdistricts;
    return {
      type: 'FeatureCollection',
      features: filteredSubdistricts.map(subdistrict => ({
        type: 'Feature',
        properties: {
          id: subdistrict.id,
          name: subdistrict.subdistrict_name || subdistrict.tambon_t || `Subdistrict ${subdistrict.id}`,
          district_id: subdistrict.district_id,
        },
        geometry: subdistrict.geometry,
      })),
    };
  }, [subdistricts, selectedDistricts, visibleLevels.subdistrict]);

  // --- Loading state ---
  if (loading.provinces || loading.districts || loading.subdistricts) {
    return <div className="flex items-center justify-center h-full text-xl">กำลังโหลดข้อมูลแผนที่...</div>;
  }

  // --- Province name to ID map ---
  const provinceNameToIdMap = useMemo(() => {
    if (!thailandGeoJson) return {};
    return thailandGeoJson.features.reduce((acc, feature) => {
      acc[feature.properties.province_name] = feature.properties.id;
      return acc;
    }, {});
  }, [thailandGeoJson]);

  // --- Aggregated amounts for choropleth ---
  const provinceAmounts = useMemo(() => {
    if (!thailandGeoJson || !filters) return {};
    return calculateAggregatedAmounts(
      thailandGeoJson, poiData, filters, 'province', 'province_name', 'id',
      null, null
    );
  }, [thailandGeoJson, poiData, filters]);

  const districtAmounts = useMemo(() => {
    if (!visibleLevels.district || !districtsGeoJson || !filters) return {};
    return calculateAggregatedAmounts(
      districtsGeoJson, poiData, filters, 'district', 'name', 'id',
      null, provinceNameToIdMap
    );
  }, [districtsGeoJson, poiData, filters, visibleLevels.district, provinceNameToIdMap]);

  const subdistrictAmounts = useMemo(() => {
    if (!visibleLevels.subdistrict || !subdistrictsGeoJson || !filters) return {};
    return calculateAggregatedAmounts(
      subdistrictsGeoJson, poiData, filters, 'subdistrict', 'name', 'id',
      districtsGeoJson, provinceNameToIdMap
    );
  }, [subdistrictsGeoJson, poiData, filters, visibleLevels.subdistrict, districtsGeoJson, provinceNameToIdMap]);

  // --- Style functions for GeoJSON layers ---
  const provinceStyle = useCallback((feature) => {
    const isSelected = selectedProvinces.some(p => p.id === feature.properties.id);
    const amount = provinceAmounts[feature.properties.id] || 0;
    const fillColor = getColorByAmount(amount);
    return {
      weight: isSelected ? 2.5 : 1,
      opacity: 1,
      color: isSelected ? '#2563eb' : '#555',
      dashArray: isSelected ? '' : '',
      fillOpacity: isSelected ? 0.65 : 0.45,
      fillColor,
    };
  }, [selectedProvinces, provinceAmounts]);

  const districtStyle = useCallback((feature) => {
    const districtId = feature.properties.id || feature.properties.district_id;
    const isSelected = selectedDistricts.some(d => d.id === districtId);
    const amount = districtAmounts[districtId] || 0;
    const fillColor = getColorByAmount(amount);
    return {
      weight: isSelected ? 2.5 : 1.5,
      opacity: 1,
      color: isSelected ? '#dd6b20' : '#888',
      dashArray: isSelected ? '' : '3',
      fillOpacity: isSelected ? 0.7 : 0.55,
      fillColor,
    };
  }, [selectedDistricts, districtAmounts]);

  const subdistrictStyle = useCallback((feature) => {
    const subdistrictId = feature.properties.id;
    const isSelected = selectedSubdistricts.some(sd => sd.id === subdistrictId);
    const amount = subdistrictAmounts[subdistrictId] || 0;
    const fillColor = getColorByAmount(amount);
    return {
      weight: isSelected ? 2.5 : 1,
      opacity: 1,
      color: isSelected ? '#38a169' : '#aaa',
      dashArray: isSelected ? '' : '3',
      fillOpacity: isSelected ? 0.7 : 0.55,
      fillColor,
    };
  }, [selectedSubdistricts, subdistrictAmounts]);

  // --- GeoJSON event handlers ---
  const onEachProvince = useCallback((feature, layer) => {
    const provinceName = feature.properties.province_name;
    const provinceId = feature.properties.id;
    layer.on({
      click: () => onProvinceClick({ id: provinceId, province_name: provinceName, geometry: feature.geometry }, true),
      mouseover: (e) => { e.target.setStyle({ weight: 2, color: '#2563eb', dashArray: '', fillOpacity: 0.7 }); e.target.bringToFront(); },
      mouseout: (e) => { e.target.setStyle(provinceStyle(feature)); },
    });
    layer.bindTooltip(provinceName);
  }, [onProvinceClick, provinceStyle]);

  const onEachDistrict = useCallback((feature, layer) => {
    const districtName = feature.properties.name || feature.properties.amphoe_t;
    const districtId = feature.properties.id;
    const provinceId = feature.properties.province_id || feature.properties.prov_id;
    layer.on({
      click: () => onDistrictSelect({ id: districtId, district_name: districtName, province_id: provinceId, geometry: feature.geometry }, false, true),
      mouseover: (e) => { e.target.setStyle({ weight: 2, color: '#dd6b20', dashArray: '', fillOpacity: 0.7 }); e.target.bringToFront(); },
      mouseout: (e) => { e.target.setStyle(districtStyle(feature)); },
    });
    layer.bindTooltip(districtName);
  }, [onDistrictSelect, districtStyle]);

  const onEachSubdistrict = useCallback((feature, layer) => {
    const subdistrictName = feature.properties.name || feature.properties.tambon_t;
    const subdistrictId = feature.properties.id;
    const districtId = feature.properties.district_id;
    layer.on({
      click: () => onSubdistrictSelect({ id: subdistrictId, subdistrict_name: subdistrictName, district_id: districtId, geometry: feature.geometry }, false, true),
      mouseover: (e) => { e.target.setStyle({ weight: 2, color: '#38a169', dashArray: '', fillOpacity: 0.7 }); e.target.bringToFront(); },
      mouseout: (e) => { e.target.setStyle(subdistrictStyle(feature)); },
    });
    layer.bindTooltip(subdistrictName);
  }, [onSubdistrictSelect, subdistrictStyle]);

  // --- GeoJSON filters ---
  const filterDistricts = useCallback((feature) => {
    if (!visibleLevels.district) return false;
    return selectedProvinces.some(province =>
      feature.properties.province_id === province.id ||
      feature.properties.prov_id === province.id
    );
  }, [visibleLevels.district, selectedProvinces]);

  const filterSubdistricts = useCallback((feature) => {
    if (!visibleLevels.subdistrict) return false;
    return selectedDistricts.some(district =>
      feature.properties.district_id === district.id
    );
  }, [visibleLevels.subdistrict, selectedDistricts]);

  // --- Cluster icon for MarkerClusterGroup ---
  const createClusterCustomIcon = useCallback((cluster) => {
    const childMarkers = cluster.getAllChildMarkers();
    let totalAmount = 0;
    childMarkers.forEach(marker => {
      if (marker.options.amount && typeof marker.options.amount === 'number') {
        totalAmount += marker.options.amount;
      }
    });
    const count = cluster.getChildCount();
    const clusterColor = getColorByAmount(totalAmount);
    const textColor = isLightColor(clusterColor) ? '#333333' : '#FFFFFF';
    let diameter = 30;
    if (count >= 10 && count < 100) diameter = 40;
    else if (count >= 100) diameter = 50;
    const iconHtml = `<div style="background-color: ${clusterColor}; width: ${diameter}px; height: ${diameter}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${textColor}; font-size: ${diameter / 2.8}px; border: 2px solid rgba(255,255,255,0.6); box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><span>${count}</span></div>`;
    return L.divIcon({ html: iconHtml, className: 'my-custom-cluster-icon', iconSize: L.point(diameter, diameter) });
  }, []);

  // --- Heatmap points ---
  const heatMapPoints = useMemo(() => {
    if (!filters) return [];
    return poiData
      .filter(poi => {
        let effectiveType;
        if (poi.category === 'อาวุธปืน') {
          effectiveType = 'gun';
        } else if (poi.category === 'ยาเสพติด' && poi.drug_type) {
          effectiveType = poi.drug_type;
        } else {
          return false;
        }
        return filters[effectiveType];
      })
      .map(poi => {
        const intensity = poi.amount ? Math.min(Math.log10(poi.amount + 1) / 3, 1) * 0.8 : 0.1;
        return [poi.lat, poi.lng, intensity];
      });
  }, [poiData, filters]);

  const heatMapOptions = useMemo(() => ({
    radius: 25,
    blur: 15,
    maxZoom: 15,
    minOpacity: 0.4,
    gradient: {
      0.0: '#00FFFF', 0.2: '#00FF00', 0.4: '#FFFF00',
      0.6: '#FFA500', 0.8: '#FF0000', 1.0: '#800080',
    },
  }), []);

  // --- Grouped POI data for clustering ---
  const groupedPoiData = useMemo(() => groupPoiByProvince(poiData), [poiData]);

  // --- Map ref for imperative actions (if needed) ---
  const mapRef = useRef();

  // --- Selected areas for MapController ---
  const selectedAreasForController = useMemo(() => ({
    provinces: selectedProvinces,
    districts: selectedDistricts,
    subdistricts: selectedSubdistricts,
  }), [selectedProvinces, selectedDistricts, selectedSubdistricts]);

  // --- Map style ---
  const mapStyle = { height: '100%', width: '100%', border: '1px solid #ddd' };

  return (
    <div className="map-container h-full w-auto relative">
      <MapContainer
        center={[13.7563, 100.5018]}
        zoom={6}
        style={mapStyle}
        maxBounds={[[5.6, 97.3], [20.5, 105.6]]}
        minZoom={5}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController
          selectedAreas={selectedAreasForController}
          visibleLevels={visibleLevels}
        />

        {thailandGeoJson && visibleLevels.province && (
          <GeoJSON
            data={thailandGeoJson}
            onEachFeature={onEachProvince}
            style={provinceStyle}
            key={`provinces-${selectedProvinces.map(p => p.id).join(',')}-${JSON.stringify(filters)}`}
          />
        )}

        {districtsGeoJson && visibleLevels.district && (
          <GeoJSON
            data={districtsGeoJson}
            onEachFeature={onEachDistrict}
            style={districtStyle}
            filter={filterDistricts}
            key={`districts-${selectedProvinces.map(p => p.id).join(',')}-${selectedDistricts.map(d => d.id).join(',')}-${visibleLevels.district}-${JSON.stringify(filters)}`}
          />
        )}

        {subdistrictsGeoJson && visibleLevels.subdistrict && (
          <GeoJSON
            data={subdistrictsGeoJson}
            onEachFeature={onEachSubdistrict}
            style={subdistrictStyle}
            filter={filterSubdistricts}
            key={`subdistricts-${selectedDistricts.map(d => d.id).join(',')}-${selectedSubdistricts.map(sd => sd.id).join(',')}-${visibleLevels.subdistrict}-${JSON.stringify(filters)}`}
          />
        )}

        {viewMode === 'heatmap' && filters && (
          <HeatmapLayer points={heatMapPoints} options={heatMapOptions} />
        )}

        {viewMode === 'markers' && filters && Object.entries(groupedPoiData).map(([provinceName, provincePois]) => (
          <MarkerClusterGroup
            key={provinceName}
            spiderfyOnMaxZoom={true}
            disableClusteringAtZoom={12}
            iconCreateFunction={createClusterCustomIcon}
          >
            {provincePois.map((poi) => {
              let effectiveType;
              let mainTitle;

              if (poi.category === 'อาวุธปืน') {
                effectiveType = 'gun';
                mainTitle = poi.subcategory || 'อาวุธปืน';
              } else if (poi.category === 'ยาเสพติด' && poi.drug_type) {
                effectiveType = poi.drug_type;
                mainTitle = poi.subcategory || poi.drug_type.toUpperCase();
                if (poi.stamp) { mainTitle += ` (ตรา: ${poi.stamp})`; }
              } else {
                return null;
              }

              const shouldDisplay = filters[effectiveType];

              if (shouldDisplay && typeof poi.lat === 'number' && typeof poi.lng === 'number') {
                let unitForAmount = 'หน่วย';
                if (poi.category === 'อาวุธปืน') {
                  unitForAmount = 'กระบอก';
                } else if (poi.category === 'ยาเสพติด') {
                  if (effectiveType === 'meth' && (poi.subcategory === 'เม็ด' || poi.subcategory === 'ยาบ้า')) unitForAmount = 'เม็ด';
                }

                return (
                  <Marker
                    key={`${poi.id}-${effectiveType}-${poi.lat}-${poi.lng}`}
                    position={[poi.lat, poi.lng]}
                    icon={getDrugIcon(effectiveType)}
                    amount={poi.amount}
                  >
                    <Popup>
                      <b>{mainTitle}</b><br />
                      {poi.category === 'อาวุธปืน' && (
                        <>
                          ยี่ห้อ: {poi.brand || 'N/A'}<br />
                          รุ่น: {poi.model || 'N/A'}<br />
                          กลไก: {poi.mechanic || 'N/A'}<br />
                          จำนวน: {poi.amount ? poi.amount.toLocaleString() : 'N/A'} {unitForAmount}<br />
                        </>
                      )}
                      {poi.category === 'ยาเสพติด' && (
                        <>
                          ประเภทสาร: {poi.drug_type} (หมวด: {poi.drug_category || 'N/A'})<br />
                          จำนวน ({unitForAmount}): {poi.amount ? poi.amount.toLocaleString() : 'N/A'}<br />
                          น้ำหนัก: {poi.berat || 'N/A'}<br />
                        </>
                      )}
                      ตำบล: {poi.tambon || 'N/A'}<br />
                      อำเภอ: {poi.amphoe || 'N/A'}<br />
                      จังหวัด: {poi.province || 'N/A'}<br />
                      {poi.date && <>วันที่: {poi.date}<br /></>}
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MarkerClusterGroup>
        ))}
      </MapContainer>
    </div>
  );
};

export default memo(LeafletMap);