import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import RecordTabBar from '../components/SaveToHistory/RecordTabBar';
import RecordBottomBar from '../components/SaveToHistory/RecordBottomBar';
import SearchableDropdown from '../components/common/SearchableDropdown';
import RecordMap from '../components/SaveToHistory/RecordMap';
import { IoMapOutline } from "react-icons/io5";
import { useGeoGraphy } from '../hooks/useGeoGraphy';

/* ========================= CONSTANTS ========================= */
const MAP_API_KEY = import.meta.env.VITE_LONGDO_MAP_API_KEY;
const TAB_BAR_HEIGHT = 56;
const BOTTOM_BAR_HEIGHT = 72;

/* ========================= UTILS ========================= */
const toOption = (v, id) => ({ value: v, label: v, id });

const findByNameLoose = (list = [], nameKey, targetName = '') =>
  list.find(item => {
    const val = item[nameKey] || '';
    return (
      val === targetName ||
      val.includes(targetName) ||
      targetName.includes(val)
    );
  });

/* ========================= CUSTOM HOOKS ========================= */
function useGeographyData() {
  // compose existing geo hook
  const {
    provinces: hookProvinces = [],
    districts: hookDistricts = [],
    subdistricts: hookSubdistricts = [],
    loading: hookLoading = {}
  } = useGeoGraphy();

  const [loading, setLoading] = useState(false);
  const [apiBusy, setApiBusy] = useState(false);

  // clear, descriptive internal names
  const [provincesRaw, setProvincesRaw] = useState([]);
  const [districtsRaw, setDistrictsRaw] = useState([]);
  const [subdistrictsRaw, setSubdistrictsRaw] = useState([]);

  const [provinceOptions, setProvinceOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState([]);
  const [zipcodeOptions, setZipcodeOptions] = useState([]);

  // mirror hook data -> internal state & options
  useEffect(() => {
    const provs = hookProvinces || [];
    setProvincesRaw(provs);
    setProvinceOptions(provs.map(p => toOption(p.province_name, p.id)));
  }, [hookProvinces]);

  useEffect(() => {
    setDistrictsRaw(hookDistricts || []);
  }, [hookDistricts]);

  useEffect(() => {
    setSubdistrictsRaw(hookSubdistricts || []);
  }, [hookSubdistricts]);

  // derive loading boolean from composed hook
  useEffect(() => {
    const anyLoading = Boolean(hookLoading?.provinces || hookLoading?.districts || hookLoading?.subdistricts);
    setLoading(anyLoading);
  }, [hookLoading]);

  const buildDistrictOptionsForProvince = useCallback((provinceObj) => {
    if (!provinceObj) {
      setDistrictOptions([]);
      return;
    }
    const matches = districtsRaw.filter(d => d.province_id === provinceObj.id);
    setDistrictOptions(matches.map(d => toOption(d.district_name || d.amphoe_t, d.id)));
  }, [districtsRaw]);

  const buildSubdistrictOptionsForDistrict = useCallback((districtObj) => {
    if (!districtObj) {
      setSubdistrictOptions([]);
      return;
    }
    const matches = subdistrictsRaw.filter(sd => sd.district_id === districtObj.id);
    setSubdistrictOptions(matches.map(sd => ({
      value: sd.subdistrict_name || sd.tambon_t,
      label: sd.subdistrict_name || sd.tambon_t,
      id: sd.id,
      zip_code: sd.zip_code
    })));
  }, [subdistrictsRaw]);

  const findAndAutoFillFromCoords = useCallback(async (lat, lng, updateLocationCallback) => {
    if (!lat || !lng) return;
    setApiBusy(true);
    try {
      const res = await fetch(`https://api.longdo.com/map/services/address?lon=${lng}&lat=${lat}&noelevation=1&key=${MAP_API_KEY}`);
      if (!res.ok) {
        // try to parse server message but continue gracefully
        let parsed = null;
        try { parsed = await res.json(); } catch (_) { parsed = null; }
        throw new Error(parsed?.message || parsed?.detail || res.statusText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const hasParts = data?.province && data?.district && data?.subdistrict;
      if (!hasParts) return;
      const provinceName = String(data.province).replace('จ.', '').trim();
      const districtName = String(data.district).replace(/^(เขต|อำเภอ|อ\.)\s*/i, '').trim();
      const subdistrictName = String(data.subdistrict).replace(/^(แขวง|ตำบล|ต\.)\s*/i, '').trim();
      updateLocationCallback({
        placeName: data.aoi || '',
        road: data.road || '',
        provinceName,
        districtName,
        subdistrictName
      });
    } catch (err) {
      console.error('findAndAutoFillFromCoords error', err);
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
    findAndAutoFillFromCoords
  };
}

/* ========================= PRESENTATIONAL SUBCOMPONENTS ========================= */
const LocationFormFields = React.memo(function LocationFormFields({
  provinces, districts, subdistricts, zipcodes,
  selectedProvince, selectedDistrict, selectedSubdistrict,
  onProvinceChange, onDistrictChange, onSubdistrictChange,
  placeName, setPlaceName, houseNumber, setHouseNumber,
  village, setVillage, soi, setSoi, road, setRoad,
  quantity, setQuantity, apiLoading
}) {
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
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          value={placeName}
          onChange={e => setPlaceName(e.target.value)}
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
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="จำนวน"
            aria-label="จำนวน"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">บ้านเลขที่</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={houseNumber}
            onChange={e => setHouseNumber(e.target.value)}
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
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={village}
            onChange={e => setVillage(e.target.value)}
            placeholder="หมู่ที่"
            aria-label="หมู่"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">ซอย</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={soi}
            onChange={e => setSoi(e.target.value)}
            placeholder="ซอย"
            aria-label="ซอย"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">ถนน</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={road}
            onChange={e => setRoad(e.target.value)}
            placeholder="ถนน"
            aria-label="ถนน"
          />
        </div>
      </div>
    </>
  );
});

/* ========================= MAIN COMPONENT ========================= */
function SaveToHistory() {
  const location = useLocation();

  // evidence / analysis
  const [evidenceData, setEvidenceData] = useState(location.state?.evidence);
  const [analysisResult, setAnalysisResult] = useState(location.state?.analysisResult);

  // time
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // coords
  const [coordinates, setCoordinates] = useState(null);

  // form selections
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('');
  const [selectedZipcode, setSelectedZipcode] = useState('');

  // address fields
  const [placeName, setPlaceName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [village, setVillage] = useState('');
  const [soi, setSoi] = useState('');
  const [road, setRoad] = useState('');
  const [quantity, setQuantity] = useState('');

  // geometry & geo data hook
  const geo = useGeographyData();

  // set initial date/time once
  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    setTime(now.toTimeString().slice(0, 5));
  }, []);

  // load/store evidence & analysis (unchanged logic but clearer names + safe guards)
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
            confidence_score: location.state.evidence.result.confidence_score,
            brandConfidence: location.state.evidence.result.brandConfidence,
            prediction: location.state.evidence.result.prediction
          } : null
        };
        localStorage.setItem('currentEvidenceData', JSON.stringify(minimal));
        const img = location.state.evidence.imageUrl || location.state.evidence.image_url || location.state.image;
        if (img) localStorage.setItem('analysisImage', img);
      } catch (err) {
        console.warn('save evidence localStorage failed', err);
      }
    } else {
      try {
        const saved = localStorage.getItem('currentEvidenceData');
        if (saved) {
          const parsed = JSON.parse(saved);
          const img = localStorage.getItem('analysisImage');
          if (img) { parsed.imageUrl = img; parsed.image_url = img; }
          setEvidenceData(parsed);
        }
      } catch (err) {
        console.error('read evidence localStorage failed', err);
      }
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
          exhibit_id: location.state.analysisResult.exhibit_id
        };
        localStorage.setItem('analysisResult', JSON.stringify(minimal));
      } catch (err) { console.warn('save analysis localStorage failed', err); }
    } else {
      try {
        const saved = localStorage.getItem('analysisResult');
        if (saved) setAnalysisResult(JSON.parse(saved));
      } catch (err) { console.error('read analysis localStorage failed', err); }
    }
  }, [location.state]);

  // handle coordinate changes -> fetch address via hook helper
  useEffect(() => {
    if (coordinates) {
      geo.findAndAutoFillFromCoords(coordinates.lat, coordinates.lng, ({ placeName: p, road: r, provinceName, districtName, subdistrictName }) => {
        setPlaceName(p || '');
        setRoad(r || '');
        // attempt to auto-select using raw lists
        const provObj = findByNameLoose(geo.rawProvinceList, 'province_name', provinceName);
        if (!provObj) return;
        setSelectedProvince(provObj.province_name);
        geo.buildDistrictOptionsForProvince(provObj);
        const distObj = findByNameLoose(geo.rawDistrictList, 'district_name', districtName) || findByNameLoose(geo.rawDistrictList, 'amphoe_t', districtName);
        if (!distObj) return;
        setSelectedDistrict(distObj.district_name || distObj.amphoe_t);
        geo.buildSubdistrictOptionsForDistrict(distObj);
        const subObj = findByNameLoose(geo.rawSubdistrictList, 'subdistrict_name', subdistrictName) || findByNameLoose(geo.rawSubdistrictList, 'tambon_t', subdistrictName);
        if (!subObj) return;
        setSelectedSubdistrict(subObj.subdistrict_name || subObj.tambon_t);
        const zip = subObj.zip_code;
        if (zip) { setSelectedZipcode(zip); geo.setZipcodeOptions([{ value: zip, label: zip }]); }
      });
    }
  }, [coordinates, geo]);

  // province/district/subdistrict handlers (kept simple, event-driven to match SearchableDropdown)
  const handleProvinceChange = useCallback((e) => {
    const value = e?.target?.value ?? '';
    setSelectedProvince(value);
    setSelectedDistrict('');
    setSelectedSubdistrict('');
    setSelectedZipcode('');
    setSubdistrictOptions([]);
    geo.setZipcodeOptions([]);
    const provObj = geo.rawProvinceList.find(p => p.province_name === value);
    if (provObj) geo.buildDistrictOptionsForProvince(provObj);
  }, [geo]);

  const handleDistrictChange = useCallback((e) => {
    const value = e?.target?.value ?? '';
    setSelectedDistrict(value);
    setSelectedSubdistrict('');
    setSelectedZipcode('');
    geo.setZipcodeOptions([]);
    const distObj = geo.rawDistrictList.find(d => (d.district_name || d.amphoe_t) === value);
    if (distObj) geo.buildSubdistrictOptionsForDistrict(distObj);
  }, [geo]);

  const handleSubdistrictChange = useCallback((e) => {
    const value = e?.target?.value ?? '';
    setSelectedSubdistrict(value);
    setSelectedZipcode('');
    const subObj = geo.rawSubdistrictList.find(sd => (sd.subdistrict_name || sd.tambon_t) === value);
    if (subObj) {
      const zip = subObj.zip_code;
      geo.setZipcodeOptions(zip ? [{ value: zip, label: zip }] : []);
      if (zip) setSelectedZipcode(zip);
    }
  }, [geo]);

  const selectedProvinceObj = useMemo(() => geo.rawProvinceList.find(p => p.province_name === selectedProvince), [geo.rawProvinceList, selectedProvince]);
  const selectedDistrictObj = useMemo(() => geo.rawDistrictList.find(d => (d.district_name || d.amphoe_t) === selectedDistrict), [geo.rawDistrictList, selectedDistrict]);
  const selectedSubdistrictObj = useMemo(() => geo.rawSubdistrictList.find(sd => (sd.subdistrict_name || sd.tambon_t) === selectedSubdistrict), [geo.rawSubdistrictList, selectedSubdistrict]);

  // layout components (Desktop / Mobile) re-used but declared inline for single-file requirement
  const DesktopLayout = useMemo(() => (props) => (
    <div className='flex-1 flex flex-col overflow-hidden'>
      <RecordTabBar />
      <div className='flex flex-1 overflow-auto justify-center items-center bg-gray-50'>
        <div className="flex w-full max-w-6xl mx-auto bg-white ring-1 ring-gray-200 rounded-2xl shadow-sm" style={{ minHeight: 400 }}>
          <div className="w-full md:w-1/2 pt-8 pr-6 pb-8 pl-8 flex flex-col max-h-[550px]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">ระบุตำแหน่ง</h2>
            <div className="flex-1 overflow-y-auto">
              {props.loading ? (
                <div className="p-4 text-center text-gray-600">กำลังโหลดข้อมูล...</div>
              ) : (
                <LocationFormFields {...props} />
              )}
            </div>
          </div>
          <div className="hidden md:block md:w-1/2 pt-8 pr-8 pb-8 pl-4">
            <div className="w-full h-full" style={{ minHeight: 400 }}>
              <RecordMap setCoordinates={setCoordinates} />
            </div>
          </div>
        </div>
      </div>
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
  ), [evidenceData, analysisResult, selectedProvinceObj, selectedDistrictObj, selectedSubdistrictObj, houseNumber, village, soi, road, placeName, coordinates, date, time, quantity]);

  const MobileLayout = useMemo(() => (props) => {
    const [showMapModal, setShowMapModal] = useState(false);
    const mapContainerRef = useRef(null);

    useEffect(() => {
      if (showMapModal && mapContainerRef.current) {
        mapContainerRef.current.style.height = '100%';
        mapContainerRef.current.style.width = '100%';
      }
    }, [showMapModal]);

    return (
      <div className="flex flex-col min-h-screen bg-white relative">
        <div className="fixed top-0 left-0 w-full z-20" style={{ height: TAB_BAR_HEIGHT }}>
          <RecordTabBar />
        </div>
        <div className="flex-1 overflow-auto bg-white px-4 py-6" style={{ paddingTop: TAB_BAR_HEIGHT + 8, paddingBottom: BOTTOM_BAR_HEIGHT + 8 }}>
          <div className="flex justify-end">
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

        <div className="fixed bottom-0 left-0 w-full z-20 bg-white ring-1 ring-gray-50 shadow-sm" style={{ height: BOTTOM_BAR_HEIGHT }}>
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

        {showMapModal && (
          <div className="fixed inset-0 z-50 flex flex-col">
            <div className="flex justify-between items-right p-4 absolute top-0 right-0 z-10">
              <button className="text-2xl text-black bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md" onClick={() => setShowMapModal(false)}>X</button>
            </div>
            <div className="flex-1 w-full h-full">
              <RecordMap setCoordinates={setCoordinates} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-5 shadow-lg border-t border-gray-100">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">เลือกตำแหน่ง</h2>
              <p className="text-gray-500 text-sm mb-1">ตำแหน่งของคุณ</p>
              <div className="text-gray-800 mb-4 text-base">
                <p className="mb-2 border-b border-gray-100 pb-2">
                  {coordinates ? (
                    <>
                      {placeName ? `${placeName}, ` : ''}
                      {road ? `${road}, ` : ''}
                      {selectedSubdistrict ? `ต.${selectedSubdistrict}, ` : ''} 
                      {selectedDistrict ? `อ.${selectedDistrict}, ` : ''} 
                      {selectedProvince ? `จ.${selectedProvince}` : 'กรุณาเลือกตำแหน่ง'}
                    </>
                  ) : 'กรุณาเลือกตำแหน่งบนแผนที่'}
                </p>
              </div>
              <div className='py-4'>
                <button
                  type="button"
                  aria-label="ยืนยันตำแหน่ง"
                  onClick={() => setShowMapModal(false)}
                  className="w-full py-3 bg-[#990000] hover:bg-[#7a0000] text-white rounded-md text-lg font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#990000]/40"
                >
                  ยืนยันตำแหน่ง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [evidenceData, analysisResult, selectedProvinceObj, selectedDistrictObj, selectedSubdistrictObj, houseNumber, village, soi, road, placeName, coordinates, date, time, quantity]);

  // render
  return (
    <div className="flex-1 h-full w-full overflow-auto">
      <div className="hidden md:flex h-full flex-col">
        <DesktopLayout
          loading={geo.loading}
          apiLoading={geo.apiBusy}
          provinces={geo.provinceOptions}
          districts={geo.districtOptions}
          subdistricts={geo.subdistrictOptions}
          zipcodes={[]}

          selectedProvince={selectedProvince}
          selectedDistrict={selectedDistrict}
          selectedSubdistrict={selectedSubdistrict}

          onProvinceChange={handleProvinceChange}
          onDistrictChange={handleDistrictChange}
          onSubdistrictChange={handleSubdistrictChange}

          placeName={placeName}
          setPlaceName={setPlaceName}
          houseNumber={houseNumber}
          setHouseNumber={setHouseNumber}
          village={village}
          setVillage={setVillage}
          soi={soi}
          setSoi={setSoi}
          road={road}
          setRoad={setRoad}

          date={date}
          time={time}

          coordinates={coordinates}
          setCoordinates={setCoordinates}

          quantity={quantity}
          setQuantity={setQuantity}
        />
      </div>

      <div className="md:hidden h-full">
        <MobileLayout
          apiLoading={geo.apiBusy}
          provinces={geo.provinceOptions}
          districts={geo.districtOptions}
          subdistricts={geo.subdistrictOptions}

          selectedProvince={selectedProvince}
          selectedDistrict={selectedDistrict}
          selectedSubdistrict={selectedSubdistrict}

          onProvinceChange={handleProvinceChange}
          onDistrictChange={handleDistrictChange}
          onSubdistrictChange={handleSubdistrictChange}

          placeName={placeName}
          setPlaceName={setPlaceName}
          houseNumber={houseNumber}
          setHouseNumber={setHouseNumber}
          village={village}
          setVillage={setVillage}
          soi={soi}
          setSoi={setSoi}
          road={road}
          setRoad={setRoad}

          date={date}
          time={time}

          coordinates={coordinates}
          setCoordinates={setCoordinates}

          quantity={quantity}
          setQuantity={setQuantity}
        />
      </div>
    </div>
  );
}

export default SaveToHistory;