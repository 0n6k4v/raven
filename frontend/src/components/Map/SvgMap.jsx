import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from 'react';
import { useGeoGraphy } from '../../hooks/useGeoGraphy';
import Loading from '../common/Loading';

/* ========================= CONSTANTS ========================= */
const DEFAULT_BOUNDS = { minX: 97, minY: -21, maxX: 106, maxY: -5 };
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 10;
const ZOOM_STEP = 1.2;

/* ========================= UTILS ========================= */
function createSVGPath(coordinates) {
  if (!coordinates?.length) return '';
  return coordinates
    .map(polygon =>
      polygon
        .map(ring =>
          ring
            .map(([lng, lat], i) => `${i === 0 ? 'M' : 'L'} ${lng} ${-lat}`)
            .join(' ') + (ring.length ? ' Z ' : '')
        )
        .join(' ')
    )
    .join(' ');
}

function calculateBounds(items) {
  if (!items?.length) return DEFAULT_BOUNDS;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasValidCoords = false;
  items.forEach(item => {
    const geometry = item.geometry || item.geom;
    const coords = geometry?.coordinates;
    if (coords) {
      coords.forEach(polygon => {
        polygon.forEach(ring => {
          ring.forEach(point => {
            if (Array.isArray(point) && point.length >= 2 && typeof point[0] === 'number' && typeof point[1] === 'number') {
              const [lng, lat] = point;
              minX = Math.min(minX, lng);
              minY = Math.min(minY, -lat);
              maxX = Math.max(maxX, lng);
              maxY = Math.max(maxY, -lat);
              hasValidCoords = true;
            }
          });
        });
      });
    }
  });
  return hasValidCoords ? { minX, minY, maxX, maxY } : DEFAULT_BOUNDS;
}

/* ========================= CUSTOM HOOKS ========================= */
function useSvgZoomPan(svgRef, zoomLevel, setZoomLevel, setViewBoxOffset) {
  const isDragging = useRef(false);
  const lastDragPosition = useRef(null);
  const zoomLevelRef = useRef(zoomLevel);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    e => {
      e.preventDefault();
      let zoomDelta = -e.deltaY;
      const normalizedDelta = Math.sign(zoomDelta) * Math.min(Math.abs(zoomDelta) * 0.01, 0.1);
      setZoomLevel(prevZoomLevel => {
        const newZoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prevZoomLevel * (1 + normalizedDelta)));
        if (newZoomLevel !== prevZoomLevel && svgRef.current) {
          const svgElement = svgRef.current;
          const rect = svgElement.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const viewBox = svgElement.viewBox.baseVal;
          const viewBoxWidth = viewBox.width;
          const viewBoxHeight = viewBox.height;
          const relativeX = mouseX / rect.width;
          const relativeY = mouseY / rect.height;
          const localZoomFactor = newZoomLevel / prevZoomLevel;
          const dx = viewBoxWidth * (1 - 1 / localZoomFactor) * relativeX;
          const dy = viewBoxHeight * (1 - 1 / localZoomFactor) * relativeY;
          setViewBoxOffset(prev => ({
            x: prev.x + dx * 0.5,
            y: prev.y + dy * 0.5,
          }));
        }
        return newZoomLevel;
      });
    },
    [setZoomLevel, setViewBoxOffset, svgRef]
  );

  // Mouse drag pan
  const handleMouseDown = useCallback(e => {
    if (e.button !== 0) return;
    isDragging.current = true;
    lastDragPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    e => {
      if (!isDragging.current || !lastDragPosition.current) return;
      const dx = (e.clientX - lastDragPosition.current.x) / zoomLevel;
      const dy = (e.clientY - lastDragPosition.current.y) / zoomLevel;
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const viewBox = svgEl.viewBox.baseVal;
      const viewBoxWidth = viewBox.width;
      const viewBoxHeight = viewBox.height;
      const scaleFactor = 0.005;
      setViewBoxOffset(prev => ({
        x: prev.x - dx * scaleFactor * viewBoxWidth,
        y: prev.y - dy * scaleFactor * viewBoxHeight,
      }));
      lastDragPosition.current = { x: e.clientX, y: e.clientY };
    },
    [setViewBoxOffset, zoomLevel, svgRef]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    lastDragPosition.current = null;
  }, []);

  // Touch zoom
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const wheelHandler = e => handleWheel(e);
    svgElement.addEventListener('wheel', wheelHandler, { passive: false });
    let lastTouchDistance = 0;
    const touchStartHandler = e => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const touchMoveHandler = e => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        if (lastTouchDistance > 0) {
          const touchZoomFactor = newDistance / lastTouchDistance;
          const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomLevelRef.current * touchZoomFactor));
          const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const relativeX = (centerX - rect.left) / rect.width;
            const relativeY = (centerY - rect.top) / rect.height;
            const viewBox = svgRef.current.viewBox.baseVal;
            const viewBoxWidth = viewBox.width;
            const viewBoxHeight = viewBox.height;
            const dx = viewBoxWidth * (1 - touchZoomFactor) * relativeX;
            const dy = viewBoxHeight * (1 - touchZoomFactor) * relativeY;
            setZoomLevel(newZoom);
            setViewBoxOffset(prev => ({
              x: prev.x + dx * 0.5,
              y: prev.y + dy * 0.5,
            }));
          } else {
            setZoomLevel(newZoom);
          }
        }
        lastTouchDistance = newDistance;
      }
    };
    svgElement.addEventListener('touchstart', touchStartHandler);
    svgElement.addEventListener('touchmove', touchMoveHandler, { passive: false });
    return () => {
      svgElement.removeEventListener('wheel', wheelHandler);
      svgElement.removeEventListener('touchstart', touchStartHandler);
      svgElement.removeEventListener('touchmove', touchMoveHandler);
    };
  }, [handleWheel, setZoomLevel, setViewBoxOffset, svgRef]);
  return { handleMouseDown, handleMouseMove, handleMouseUp };
}

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const ZoomControls = memo(function ZoomControls({ onZoomIn, onZoomOut, onFit, onReset }) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
      <button
        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
        onClick={onZoomIn}
        title="ซูมเข้า"
        aria-label="ซูมเข้า"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      <button
        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
        onClick={onZoomOut}
        title="ซูมออก"
        aria-label="ซูมออก"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      </button>
      <button
        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
        onClick={onFit}
        title="พอดีกับหน้าจอ"
        aria-label="พอดีกับหน้าจอ"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
        </svg>
      </button>
      <button
        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
        onClick={onReset}
        title="รีเซ็ตการซูม"
        aria-label="รีเซ็ตการซูม"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
});

/* ========================= MAIN COMPONENT ========================= */
const SvgMap = ({
  selectedProvinces = [],
  selectedDistricts = [],
  selectedSubdistricts = [],
  visibleLevels = { province: true, district: false, subdistrict: false },
  onProvinceClick = () => {},
  onDistrictSelect = () => {},
  onSubdistrictSelect = () => {},
  onSelectionChange = () => {},
}) => {
  // --- State ---
  const { provinces, districts, subdistricts, loading } = useGeoGraphy();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewBoxOffset, setViewBoxOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Zoom & Pan handlers
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useSvgZoomPan(
    svgRef,
    zoomLevel,
    setZoomLevel,
    setViewBoxOffset
  );

  // --- Selection helpers ---
  const isProvinceSelected = useCallback(
    province => selectedProvinces.some(p => p.id === province.id),
    [selectedProvinces]
  );
  const isDistrictSelected = useCallback(
    district => selectedDistricts.some(d => d.id === district.id),
    [selectedDistricts]
  );
  const isSubdistrictSelected = useCallback(
    subdistrict => selectedSubdistricts.some(sd => sd.id === subdistrict.id),
    [selectedSubdistricts]
  );

  // --- ViewBox calculation ---
  const getViewBox = useMemo(() => {
    let bounds, dataSet, padding;
    if (selectedSubdistricts.length > 0) {
      dataSet = selectedSubdistricts;
      bounds = calculateBounds(dataSet);
      padding = 0.02;
    } else if (selectedDistricts.length > 0) {
      dataSet = selectedDistricts;
      bounds = calculateBounds(dataSet);
      padding = 0.05;
    } else if (selectedProvinces.length > 0) {
      dataSet = selectedProvinces;
      bounds = calculateBounds(dataSet);
      padding = 0.1;
    } else {
      dataSet = provinces;
      bounds = calculateBounds(dataSet);
      padding = 0.5;
    }
    const viewBoxWidth = bounds.maxX - bounds.minX + padding * 2;
    const viewBoxHeight = bounds.maxY - bounds.minY + padding * 2;
    const finalWidth = Math.max(viewBoxWidth, 0.1) / zoomLevel;
    const finalHeight = Math.max(viewBoxHeight, 0.1) / zoomLevel;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const zoomedMinX = centerX - finalWidth / 2 + viewBoxOffset.x;
    const zoomedMinY = centerY - finalHeight / 2 + viewBoxOffset.y;
    return `${zoomedMinX} ${zoomedMinY} ${finalWidth} ${finalHeight}`;
  }, [
    selectedProvinces,
    selectedDistricts,
    selectedSubdistricts,
    provinces,
    zoomLevel,
    viewBoxOffset,
  ]);

  // --- Zoom controls handlers ---
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * ZOOM_STEP, ZOOM_MAX));
  }, []);
  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / ZOOM_STEP, ZOOM_MIN));
  }, []);
  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setViewBoxOffset({ x: 0, y: 0 });
  }, []);
  const handleFitToView = useCallback(() => {
    setZoomLevel(1);
    setViewBoxOffset({ x: 0, y: 0 });
  }, []);

  // --- Loading State ---
  if (loading.provinces || loading.districts || loading.subdistricts) {
    return <Loading />;
  }

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      {/* Map SVG */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={getViewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          backgroundColor: '#f0f4f8',
          cursor: 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        tabIndex={0}
        aria-label="แผนที่ประเทศไทย"
        role="img"
      >
        {/* Province Boundaries */}
        {visibleLevels.province &&
          provinces.map(province => {
            if (!province.geometry?.coordinates) return null;
            const isSelected = isProvinceSelected(province);
            const provincePath = createSVGPath(province.geometry.coordinates);
            if (!provincePath) return null;
            return (
              <path
                key={`province-${province.id}`}
                d={provincePath}
                fill={isSelected ? '#63b3ed' : '#e2e8f0'}
                stroke="#4a5568"
                strokeWidth={0.005}
                onClick={() => onProvinceClick(province, true)}
                className="transition-colors duration-200 cursor-pointer hover:fill-blue-300"
                data-province-name={province.province_name}
                tabIndex={0}
                aria-label={province.province_name}
              />
            );
          })}

        {/* District Boundaries */}
        {visibleLevels.district &&
          districts.map(district => {
            const coordinates = district.geometry?.coordinates || district.geom?.coordinates;
            if (!coordinates) return null;
            const isSelected = isDistrictSelected(district);
            const districtPath = createSVGPath(coordinates);
            if (!districtPath) return null;
            return (
              <path
                key={`district-${district.id}`}
                d={districtPath}
                fill={isSelected ? 'rgba(237, 137, 54, 0.6)' : 'none'}
                stroke={isSelected ? '#dd6b20' : '#a0aec0'}
                strokeWidth={isSelected ? 0.004 : 0.002}
                strokeDasharray={isSelected ? 'none' : '0.004 0.004'}
                onClick={() => onDistrictSelect(district, false, true)}
                className="transition-all duration-200 cursor-pointer"
                data-district-name={district.district_name || district.amphoe_t}
                tabIndex={0}
                aria-label={district.district_name || district.amphoe_t}
              />
            );
          })}

        {/* Subdistrict Boundaries */}
        {visibleLevels.subdistrict &&
          subdistricts.map(subdistrict => {
            const coordinates = subdistrict.geometry?.coordinates || subdistrict.geom?.coordinates;
            if (!coordinates) return null;
            const isSelected = isSubdistrictSelected(subdistrict);
            const subdistrictPath = createSVGPath(coordinates);
            if (!subdistrictPath) return null;
            return (
              <path
                key={`subdistrict-${subdistrict.id}`}
                d={subdistrictPath}
                fill={isSelected ? 'rgba(94, 179, 148, 0.6)' : 'none'}
                stroke={isSelected ? '#38a169' : '#cbd5e0'}
                strokeWidth={isSelected ? 0.004 : 0.002}
                strokeDasharray={isSelected ? 'none' : '0.004 0.004'}
                onClick={() => onSubdistrictSelect(subdistrict, false, true)}
                className="transition-all duration-200 cursor-pointer"
                data-subdistrict-name={subdistrict.subdistrict_name || subdistrict.tambon_t}
                tabIndex={0}
                aria-label={subdistrict.subdistrict_name || subdistrict.tambon_t}
              />
            );
          })}
      </svg>

      {/* Zoom Controls */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFitToView}
        onReset={handleResetZoom}
      />

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-75 px-2 py-1 rounded-md shadow-md z-20 text-xs">
        ซูม: {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
};

export default SvgMap;