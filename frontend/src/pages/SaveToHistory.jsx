import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useLocation } from "react-router-dom";
import RecordTabBar from "../components/SaveToHistory/RecordTabBar";
import RecordBottomBar from "../components/SaveToHistory/RecordBottomBar";
import SearchableDropdown from "../components/common/SearchableDropdown";
import RecordMap from "../components/SaveToHistory/RecordMap";
import { IoMapOutline } from "react-icons/io5";
import { useGeoGraphy } from "../hooks/useGeoGraphy";

/* ========================= CONSTANTS ========================= */
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
  EVIDENCE_DATA: "currentEvidenceData",
  ANALYSIS_IMAGE: "analysisImage",
  ANALYSIS_RESULT: "analysisResult",
};

/* ========================= UTILS (pure functions) ========================= */

const toOption = (value, id) => ({ value, label: value, id });

const findByNameLoose = (list = [], nameKey, targetName = "") =>
  list.find((item) => {
    const value = item?.[nameKey] || "";
    if (!value || !targetName) return false;
    return (
      value === targetName ||
      value.includes(targetName) ||
      targetName.includes(value)
    );
  });

const coordinatesEqual = (coord1, coord2, epsilon = 1e-6) => {
  if (!coord1 || !coord2) return false;
  return (
    Math.abs(coord1.lat - coord2.lat) < epsilon &&
    Math.abs(coord1.lng - coord2.lng) < epsilon
  );
};

/* ========================= CUSTOM HOOKS ========================= */

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

  useEffect(() => {
    setProvincesRaw(hookProvinces || []);
    setProvinceOptions((hookProvinces || []).map((p) => toOption(p.province_name, p.id)));
  }, [hookProvinces]);

  useEffect(() => {
    setDistrictsRaw(hookDistricts || []);
  }, [hookDistricts]);

  useEffect(() => {
    setSubdistrictsRaw(hookSubdistricts || []);
  }, [hookSubdistricts]);

  useEffect(() => {
    const anyLoading = Boolean(hookLoading?.provinces || hookLoading?.districts || hookLoading?.subdistricts);
    setLoading(anyLoading);
  }, [hookLoading]);

  const buildDistrictOptionsForProvince = useCallback((provinceObj) => {
    if (!provinceObj) {
      setDistrictOptions([]);
      return;
    }
    const matches = districtsRaw.filter((d) => d.province_id === provinceObj.id);
    setDistrictOptions(matches.map((d) => toOption(d.district_name || d.amphoe_t, d.id)));
  }, [districtsRaw]);

  const buildSubdistrictOptionsForDistrict = useCallback((districtObj) => {
    if (!districtObj) {
      setSubdistrictOptions([]);
      return;
    }
    const matches = subdistrictsRaw.filter((sd) => sd.district_id === districtObj.id);
    setSubdistrictOptions(matches.map((sd) => ({
      value: sd.subdistrict_name || sd.tambon_t,
      label: sd.subdistrict_name || sd.tambon_t,
      id: sd.id,
      zip_code: sd.zip_code,
    })));
  }, [subdistrictsRaw]);

  const findAndAutoFillFromCoords = useCallback(async (lat, lng, updateLocationCallback) => {
    if (!lat || !lng) return;
    setApiBusy(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = await res.json().catch(() => null);
      if (!json || !json.ok) throw new Error(json?.message || "No address returned");
      const data = json.data || {};
      const hasParts = data?.province && data?.district && data?.subdistrict;
      if (!hasParts) return;
      const provinceName = String(data.province).replace("จ.", "").trim();
      const districtName = String(data.district).replace(/^(เขต|อำเภอ|อ\.)\s*/i, "").trim();
      const subdistrictName = String(data.subdistrict).replace(/^(แขวง|ตำบล|ต\.)\s*/i, "").trim();

      updateLocationCallback({
        placeName: data.aoi || "",
        road: data.road || "",
        provinceName,
        districtName,
        subdistrictName,
      });
    } catch (err) {
      console.error("[useGeographyData] geocode error:", err);
    } finally {
      setApiBusy(false);
    }
  }, []);

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

const useCurrentLocation = () => {
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    if (!navigator?.geolocation) {
      console.warn("[useCurrentLocation] geolocation not supported");
      return;
    }
    const onSuccess = (pos) => {
      setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    };
    const onError = (err) => {
      console.warn("[useCurrentLocation] error", err);
    };
    navigator.geolocation.getCurrentPosition(onSuccess, onError, GEOLOCATION_CONFIG);
  }, []);

  return coordinates;
};

/* ========================= PRESENTATIONAL COMPONENTS ========================= */

const LocationFormFields = memo(function LocationFormFields(props) {
  const {
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
  } = props;

  return (
    <>
      <div className="mb-5 relative">
        <label className="block text-sm font-medium text-gray-800 mb-2">จังหวัด</label>
        <SearchableDropdown
          options={provinces}
          value={selectedProvince}
          onChange={onProvinceChange}
          placeholder="กรอกหรือเลือกจังหวัด"
          disabled={apiLoading}
        />
        {apiLoading && <span className="absolute right-10 top-10 text-xs text-indigo-600">กำลังอัพเดต...</span>}
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-800 mb-2">เขต/อำเภอ</label>
        <SearchableDropdown
          options={districts}
          value={selectedDistrict}
          onChange={onDistrictChange}
          placeholder="กรอกหรือเลือกอำเภอ"
          disabled={!selectedProvince || apiLoading}
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-800 mb-2">แขวง/ตำบล</label>
        <SearchableDropdown
          options={subdistricts}
          value={selectedSubdistrict}
          onChange={onSubdistrictChange}
          placeholder="กรอกหรือเลือกตำบล"
          disabled={!selectedDistrict || apiLoading}
        />
      </div>

      <hr className="border-t border-gray-100 my-4" />

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-800 mb-2">สถานที่</label>
        <input
          type="text"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="เช่น วัด โรงเรียน ร้านค้า ฯลฯ"
          aria-label="สถานที่"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">จำนวน</label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="จำนวน"
            aria-label="จำนวน"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">บ้านเลขที่</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder="บ้านเลขที่"
            aria-label="บ้านเลขที่"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">หมู่</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="หมู่ที่"
            aria-label="หมู่"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">ซอย</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            value={soi}
            onChange={(e) => setSoi(e.target.value)}
            placeholder="ซอย"
            aria-label="ซอย"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">ถนน</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
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

/* MapModal component (mobile) */
const MapModal = memo(function MapModal({ isOpen, onClose, coordinates, onCoordinatesChange, onConfirm, geocodePreview }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40">
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onClose}
          aria-label="ปิดแผนที่"
          className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow"
        >
          ×
        </button>
      </div>

      <div className="flex-1">
        <RecordMap setCoordinates={onCoordinatesChange} coordinates={coordinates} />
      </div>

      <div className="bg-white p-4 shadow-lg rounded-t-xl">
        <div className="mb-3">
          <h3 className="text-lg font-semibold">เลือกตำแหน่ง</h3>
          <p className="text-sm text-gray-600">
            {geocodePreview ? (
              <>
                {geocodePreview.placeName && <span className="font-medium">{geocodePreview.placeName}</span>}
                {geocodePreview.road && <span>, {geocodePreview.road}</span>}
                {geocodePreview.subdistrictName && <span> ต.{geocodePreview.subdistrictName}</span>}
                {geocodePreview.districtName && <span> อ.{geocodePreview.districtName}</span>}
                {geocodePreview.provinceName && <span> จ.{geocodePreview.provinceName}</span>}
              </>
            ) : coordinates ? (
              <span className="text-sm text-gray-500">กำลังเรียกข้อมูลสถานที่...</span>
            ) : (
              "กรุณาเลือกตำแหน่งบนแผนที่"
            )}
          </p>
        </div>

        <button
          onClick={onConfirm}
          className="w-full py-3 bg-[#990000] hover:bg-[#7a0000] text-white rounded-md text-lg font-medium"
          aria-label="ยืนยันตำแหน่ง"
        >
          ยืนยันตำแหน่ง
        </button>
      </div>
    </div>
  );
});

/* ========================= Layout components ========================= */

const DesktopLayout = memo(function DesktopLayout({
  commonFormProps,
  evidenceData,
  analysisResult,
  imageUrl,
  selectedProvinceObj,
  selectedDistrictObj,
  selectedSubdistrictObj,
  coordinates,
  setCoordinates,
  date,
  time,
  quantity,
  houseNumber,
  village,
  soi,
  road,
  placeName,
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <RecordTabBar />

      <div className="flex flex-1 overflow-hidden justify-center items-stretch bg-gray-50">
        <div className="flex w-full mx-auto bg-white flex-1" style={{ minHeight: 400 }}>
          <div className="w-1/2 p-8 flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">ระบุตำแหน่ง</h2>
            <div className="flex-1 overflow-auto">
              <LocationFormFields {...commonFormProps} />
            </div>
          </div>

          <div className="w-1/2 p-8 hidden md:flex">
            <div className="w-full h-full">
              <RecordMap setCoordinates={setCoordinates} coordinates={coordinates} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0" style={{ height: LAYOUT_CONFIG.BOTTOM_BAR_HEIGHT }}>
        <RecordBottomBar
          evidenceData={evidenceData}
          analysisResult={analysisResult}
          imageUrl={imageUrl}
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
});

const MobileLayout = memo(function MobileLayout({
  commonFormProps,
  evidenceData,
  analysisResult,
  imageUrl,
  selectedProvinceObj,
  selectedDistrictObj,
  selectedSubdistrictObj,
  coordinates,
  setCoordinates,
  date,
  time,
  quantity,
  houseNumber,
  village,
  soi,
  road,
  placeName,
  rawProvinceList,
  rawDistrictList,
  rawSubdistrictList,
  buildDistrictOptionsForProvince,
  buildSubdistrictOptionsForDistrict,
  setZipcodeOptions,
  setCoordinatesIfChanged,
  findAndAutoFillFromCoords,
}) {
  const [showMapModal, setShowMapModal] = useState(false);
  const [modalCoords, setModalCoords] = useState(null);
  const [modalPreview, setModalPreview] = useState(null);

  useEffect(() => {
    if (showMapModal) {
      setModalCoords(coordinates || null);
      setModalPreview(null);
    }
  }, [showMapModal, coordinates]);

  useEffect(() => {
    let active = true;
    setModalPreview(null);
    if (!modalCoords) return;
    (async () => {
      try {
        await findAndAutoFillFromCoords(modalCoords.lat, modalCoords.lng, (data) => {
          if (!active) return;
          setModalPreview(data);
        });
      } catch (err) {
        console.warn("[MobileLayout] geocode preview failed:", err);
      }
    })();
    return () => { active = false; };
  }, [modalCoords, findAndAutoFillFromCoords]);

  const handleMapConfirm = useCallback(() => {
    if (!modalCoords) {
      setShowMapModal(false);
      return;
    }

    if (modalPreview) {
      const provObj = findByNameLoose(rawProvinceList, "province_name", modalPreview.provinceName);
      if (provObj) {
        buildDistrictOptionsForProvince(provObj);
        const distObj =
          findByNameLoose(rawDistrictList, "district_name", modalPreview.districtName) ||
          findByNameLoose(rawDistrictList, "amphoe_t", modalPreview.districtName);
        if (distObj) {
          buildSubdistrictOptionsForDistrict(distObj);
          const subObj =
            findByNameLoose(rawSubdistrictList, "subdistrict_name", modalPreview.subdistrictName) ||
            findByNameLoose(rawSubdistrictList, "tambon_t", modalPreview.subdistrictName);
          if (subObj) {
            setZipcodeOptions(subObj.zip_code ? [{ value: subObj.zip_code, label: subObj.zip_code }] : []);
          }
        }
      }
    }

    setCoordinatesIfChanged(modalCoords);
    setShowMapModal(false);
  }, [modalCoords, modalPreview, rawProvinceList, rawDistrictList, rawSubdistrictList, buildDistrictOptionsForProvince, buildSubdistrictOptionsForDistrict, setZipcodeOptions, setCoordinatesIfChanged]);

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      <div className="fixed top-0 left-0 w-full z-20" style={{ height: LAYOUT_CONFIG.TAB_BAR_HEIGHT }}>
        <RecordTabBar />
      </div>

      <div className="flex-1 overflow-auto bg-white px-4 py-6" style={{ paddingTop: LAYOUT_CONFIG.TAB_BAR_HEIGHT + 8, paddingBottom: LAYOUT_CONFIG.BOTTOM_BAR_HEIGHT + 8 }}>
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setShowMapModal(true)}
            aria-label="เปิดเลือกตำแหน่งจากแผนที่"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-sm font-medium text-gray-700 ring-1 ring-gray-200 hover:shadow-sm transition-shadow"
          >
            <IoMapOutline size={16} className="text-[#990000]" />
            <span>เลือกจากแผนที่</span>
          </button>
        </div>

        <LocationFormFields {...commonFormProps} />
      </div>

      <div className="fixed bottom-0 left-0 w-full z-20 bg-white ring-1 ring-gray-50 shadow-sm" style={{ height: LAYOUT_CONFIG.BOTTOM_BAR_HEIGHT }}>
        <RecordBottomBar
          evidenceData={evidenceData}
          analysisResult={analysisResult}
          imageUrl={imageUrl}
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

      <MapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} coordinates={modalCoords} onCoordinatesChange={setModalCoords} onConfirm={handleMapConfirm} geocodePreview={modalPreview} />
    </div>
  );
});

/* ========================= MAIN COMPONENT ========================= */

function SaveToHistory() {
  const location = useLocation();

  const [evidenceData, setEvidenceData] = useState(location.state?.evidence ?? null);
  const [analysisResult, setAnalysisResult] = useState(location.state?.analysisResult ?? null);

  const [imageUrl, setImageUrl] = useState(() => (location.state?.imageUrl ?? null));

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [coordinates, setCoordinates] = useState(null);
  const coordinatesDebounceTimerRef = useRef(null);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubdistrict, setSelectedSubdistrict] = useState("");
  const [selectedZipcode, setSelectedZipcode] = useState("");

  const [placeName, setPlaceName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [village, setVillage] = useState("");
  const [soi, setSoi] = useState("");
  const [road, setRoad] = useState("");
  const [quantity, setQuantity] = useState("");

  const geo = useGeographyData();
  const currentLocation = useCurrentLocation();

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

  const setCoordinatesIfChanged = useCallback((newCoords) => {
    if (!newCoords) {
      setCoordinates(null);
      return;
    }
    setCoordinates((prev) => (coordinatesEqual(prev, newCoords) ? prev : newCoords));
  }, []);

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    setTime(now.toTimeString().slice(0, 5));
    if (currentLocation) setCoordinatesIfChanged(currentLocation);
  }, [currentLocation, setCoordinatesIfChanged]);

  useEffect(() => {
    if (location.state?.evidence) {
      setEvidenceData(location.state.evidence);
      try {
        const minimal = {
          type: location.state.evidence.type,
          id: location.state.evidence.id ?? null,
          exhibit_id: location.state.evidence.exhibit_id ?? null,
          result: location.state.evidence.result ? {
            brandName: location.state.evidence.result.brandName,
            modelName: location.state.evidence.result.modelName,
            confidence: location.state.evidence.result.confidence,
            prediction: location.state.evidence.result.prediction,
          } : null,
        };
        localStorage.setItem(STORAGE_KEYS.EVIDENCE_DATA, JSON.stringify(minimal));
        const img = location.state.image_url || location.state.imageUrl;
        if (img) {
          localStorage.setItem(STORAGE_KEYS.ANALYSIS_IMAGE, img);
          setImageUrl(img);
        }
      } catch (err) {
        console.warn("[SaveToHistory] persist evidence failed:", err);
      }
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVIDENCE_DATA);
      if (saved) {
        const parsed = JSON.parse(saved);
        const img = localStorage.getItem(STORAGE_KEYS.ANALYSIS_IMAGE);
        if (img) {
          parsed.imageUrl = img;
          parsed.image_url = img;
          setImageUrl(img);
        }
        setEvidenceData(parsed);
      }
    } catch (err) {
      console.error("[SaveToHistory] read evidence failed:", err);
    }
  }, [location.state]);

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
        console.warn("[SaveToHistory] persist analysis result failed:", err);
      }
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANALYSIS_RESULT);
      if (saved) setAnalysisResult(JSON.parse(saved));
    } catch (err) {
      console.error("[SaveToHistory] read analysis result failed:", err);
    }
  }, [location.state]);

  useEffect(() => {
    if (!coordinates) return;
    if (coordinatesDebounceTimerRef.current) clearTimeout(coordinatesDebounceTimerRef.current);

    coordinatesDebounceTimerRef.current = setTimeout(() => {
      findAndAutoFillFromCoords(coordinates.lat, coordinates.lng, ({ placeName: p, road: r, provinceName, districtName, subdistrictName }) => {
        setPlaceName(p || "");
        setRoad(r || "");

        const provObj = findByNameLoose(rawProvinceList, "province_name", provinceName);
        if (!provObj) return;
        setSelectedProvince(provObj.province_name);
        buildDistrictOptionsForProvince(provObj);

        const distObj = findByNameLoose(rawDistrictList, "district_name", districtName) || findByNameLoose(rawDistrictList, "amphoe_t", districtName);
        if (!distObj) return;
        setSelectedDistrict(distObj.district_name || distObj.amphoe_t);
        buildSubdistrictOptionsForDistrict(distObj);

        const subObj = findByNameLoose(rawSubdistrictList, "subdistrict_name", subdistrictName) || findByNameLoose(rawSubdistrictList, "tambon_t", subdistrictName);
        if (!subObj) return;
        setSelectedSubdistrict(subObj.subdistrict_name || subObj.tambon_t);
        const zip = subObj.zip_code;
        if (zip) {
          setSelectedZipcode(zip);
          setZipcodeOptions([{ value: zip, label: zip }]);
        }
      });
    }, DEBOUNCE_DELAY.GEOCODE);

    return () => {
      if (coordinatesDebounceTimerRef.current) clearTimeout(coordinatesDebounceTimerRef.current);
    };
  }, [coordinates, findAndAutoFillFromCoords, rawProvinceList, rawDistrictList, rawSubdistrictList, buildDistrictOptionsForProvince, buildSubdistrictOptionsForDistrict, setZipcodeOptions]);

  const handleProvinceChange = useCallback((e) => {
    const value = e?.target?.value ?? "";
    setSelectedProvince(value);
    setSelectedDistrict("");
    setSelectedSubdistrict("");
    setSelectedZipcode("");
    setGeoSubdistrictOptions([]);
    setZipcodeOptions([]);
    const provObj = rawProvinceList.find((p) => p.province_name === value);
    if (provObj) buildDistrictOptionsForProvince(provObj);
  }, [rawProvinceList, buildDistrictOptionsForProvince, setGeoSubdistrictOptions, setZipcodeOptions]);

  const handleDistrictChange = useCallback((e) => {
    const value = e?.target?.value ?? "";
    setSelectedDistrict(value);
    setSelectedSubdistrict("");
    setSelectedZipcode("");
    setZipcodeOptions([]);
    const distObj = rawDistrictList.find((d) => (d.district_name || d.amphoe_t) === value);
    if (distObj) buildSubdistrictOptionsForDistrict(distObj);
  }, [rawDistrictList, buildSubdistrictOptionsForDistrict, setZipcodeOptions]);

  const handleSubdistrictChange = useCallback((e) => {
    const value = e?.target?.value ?? "";
    setSelectedSubdistrict(value);
    setSelectedZipcode("");
    const subObj = rawSubdistrictList.find((sd) => (sd.subdistrict_name || sd.tambon_t) === value);
    if (subObj) {
      const zip = subObj.zip_code;
      setZipcodeOptions(zip ? [{ value: zip, label: zip }] : []);
      if (zip) setSelectedZipcode(zip);
    }
  }, [rawSubdistrictList, setZipcodeOptions]);

  useEffect(() => () => {
    if (coordinatesDebounceTimerRef.current) clearTimeout(coordinatesDebounceTimerRef.current);
  }, []);

  const selectedProvinceObj = useMemo(() => rawProvinceList.find((p) => p.province_name === selectedProvince), [rawProvinceList, selectedProvince]);
  const selectedDistrictObj = useMemo(() => rawDistrictList.find((d) => (d.district_name || d.amphoe_t) === selectedDistrict), [rawDistrictList, selectedDistrict]);
  const selectedSubdistrictObj = useMemo(() => rawSubdistrictList.find((sd) => (sd.subdistrict_name || sd.tambon_t) === selectedSubdistrict), [rawSubdistrictList, selectedSubdistrict]);

  const commonFormProps = useMemo(() => ({
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
    apiLoading: geo.apiBusy,
  }), [geo.loading, geo.apiBusy, geo.provinceOptions, geo.districtOptions, geo.subdistrictOptions, selectedProvince, selectedDistrict, selectedSubdistrict, handleProvinceChange, handleDistrictChange, handleSubdistrictChange, placeName, houseNumber, village, soi, road, quantity, coordinates, setCoordinatesIfChanged]);

  return (
    <div className="flex-1 h-full w-full overflow-auto">
      <div className="hidden md:flex h-full flex-col">
        <DesktopLayout
          commonFormProps={commonFormProps}
          evidenceData={evidenceData}
          analysisResult={analysisResult}
          imageUrl={imageUrl}
          selectedProvinceObj={selectedProvinceObj}
          selectedDistrictObj={selectedDistrictObj}
          selectedSubdistrictObj={selectedSubdistrictObj}
          coordinates={coordinates}
          setCoordinates={setCoordinatesIfChanged}
          date={date}
          time={time}
          quantity={quantity}
          houseNumber={houseNumber}
          village={village}
          soi={soi}
          road={road}
          placeName={placeName}
        />
      </div>

      <div className="md:hidden h-full">
        <MobileLayout
          commonFormProps={commonFormProps}
          evidenceData={evidenceData}
          analysisResult={analysisResult}
          imageUrl={imageUrl}
          selectedProvinceObj={selectedProvinceObj}
          selectedDistrictObj={selectedDistrictObj}
          selectedSubdistrictObj={selectedSubdistrictObj}
          coordinates={coordinates}
          setCoordinates={setCoordinatesIfChanged}
          date={date}
          time={time}
          quantity={quantity}
          houseNumber={houseNumber}
          village={village}
          soi={soi}
          road={road}
          placeName={placeName}
          rawProvinceList={rawProvinceList}
          rawDistrictList={rawDistrictList}
          rawSubdistrictList={rawSubdistrictList}
          buildDistrictOptionsForProvince={buildDistrictOptionsForProvince}
          buildSubdistrictOptionsForDistrict={buildSubdistrictOptionsForDistrict}
          setZipcodeOptions={setZipcodeOptions}
          setCoordinatesIfChanged={setCoordinatesIfChanged}
          findAndAutoFillFromCoords={findAndAutoFillFromCoords}
        />
      </div>
    </div>
  );
}

export default SaveToHistory;