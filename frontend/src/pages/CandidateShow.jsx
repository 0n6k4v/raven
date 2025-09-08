import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronDown, HelpCircle } from 'lucide-react';
import { PiImageBroken } from 'react-icons/pi';
import { IoClose } from 'react-icons/io5';
import { readCookie } from '../utils/cookies';
import { NarcoticApiService } from '../services/api/narcoticApiService';

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const UNKNOWN_EXHIBIT_IDS = {
  UNKNOWN_GUN: 93,
  UNKNOWN_DRUG: 94,
  UNKNOWN_OBJECT: null
};

// ==================== UTILS ====================
async function convertImgRefToVector(dataUrl, opts = { timeoutMs: 120000 }) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const imgDataUrl = dataUrl;
    if (!imgDataUrl) {
      clearTimeout(id);
      return null;
    }
    async function dataUrlToBlob(dUrl) {
      const res = await fetch(dUrl);
      return await res.blob();
    }

    const blob = await dataUrlToBlob(imgDataUrl);
    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');

    const res = await fetch(`${BASE_URL}/convert_image_ref_to_vector`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(id);
    let payload;
    try { payload = await res.json(); } catch { payload = await res.text(); }
    return payload;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

const formatConfidence = (confidence, isUnknown) => {
  if (isUnknown === true || confidence === undefined || confidence === null) return '0%';
  return `${Math.round(confidence * 100)}%`;
};

const normalizeSearchKey = (brandName = '', modelName = '') =>
  (brandName + modelName).toLowerCase().replace(/[^a-z0-9]/g, '');

const findExhibitByBrandModel = async (brandName, modelName) => {
  try {
    const res = await fetch(`${BASE_URL}/exhibits`);
    if (!res.ok) {
      console.error('Failed to fetch exhibits:', res.status, res.statusText);
      return null;
    }
    const exhibits = await res.json();
    if (Array.isArray(exhibits)) {
      const normalized = normalizeSearchKey(brandName, modelName);
      return exhibits.find(exhibit =>
        exhibit.firearm &&
        exhibit.category === 'อาวุธปืน' &&
        exhibit.firearm.normalized_name === normalized
      );
    }
  } catch (error) {
    console.error('Error finding exhibit:', error);
  }
  return null;
};

const findExhibitByNarcoticId = async (narcoticId) => {
  try {
    const res = await fetch(`${BASE_URL}/exhibits`);
    if (!res.ok) {
      console.error('Failed to fetch exhibits:', res.status, res.statusText);
      return null;
    }
    const exhibits = await res.json();
    if (Array.isArray(exhibits)) {
      return exhibits.find(exhibit =>
        exhibit.category === 'ยาเสพติด' &&
        exhibit.narcotic &&
        exhibit.narcotic.id === narcoticId
      );
    }
  } catch (error) {
    console.error('Error finding exhibit by narcotic ID:', error);
  }
  return null;
};

// ==================== CUSTOM HOOKS ====================
const getImageHeight = () => 'h-64';

// ==================== SERVICES ====================
async function classifyFirearmBrand(dataUrl, opts = { timeoutMs: 180000 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    if (!dataUrl) {
      clearTimeout(timeoutId);
      return null;
    }

    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');

    const resp = await fetch(`${BASE_URL}/firearm-brand-classify`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`Backend returned ${resp.status}: ${txt}`);
    }

    try {
      return await resp.json();
    } catch {
      return await resp.text();
    }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function classifyFirearmModel(brand, dataUrl, opts = { timeoutMs: 180000 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    if (!brand || !dataUrl) {
      clearTimeout(timeoutId);
      return null;
    }

    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const formData = new FormData();

    formData.append('file', blob, 'image.jpg');
    formData.append('brand', brand);

    const resp = await fetch(`${BASE_URL}/firearm-model-classify`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`Backend returned ${resp.status}: ${txt}`);
    }

    try {
      return await resp.json();
    } catch {
      return await resp.text();
    }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function getFirearmByNormalized(normalizedName, { signal } = {}) {
  if (!normalizedName) return null;

  const url = new URL(`${BASE_URL}/firearm/get-by-normalized`);
  url.searchParams.set('normalized_name', normalizedName);

  const res = await fetch(url.toString(), { method: 'GET', signal });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`getFirearmByNormalized failed: ${res.status} ${text}`);
  }

  if (res.status === 204) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ==================== PRESENTATIONAL COMPONENTS ====================
const BrandCard = React.memo(({ label, confidence = 0 }) => (
  <div className="p-3 border border-gray-200 rounded-lg bg-white flex items-center justify-between shadow-sm">
    <div className="text-base font-medium text-gray-800">{label}</div>
    <div className="text-sm text-gray-600">{`${Math.round((confidence || 0) * 100)}%`}</div>
  </div>
));

const NoImageDisplay = React.memo(({ message = "การแสดงผลภาพถ่ายมีปัญหา" }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-300 h-64 w-full">
    <PiImageBroken className="text-gray-400 text-5xl mb-2" />
    <p className="text-gray-500 text-center">{message}</p>
  </div>
));

const ImagePreview = React.memo(({ imageUrl, onClick, typeTag, getHeightClass }) => (
  imageUrl ? (
    <div className={`relative w-full ${getHeightClass()}`}>
      <img
        src={imageUrl}
        alt="Evidence"
        className="w-full h-full object-contain rounded-lg cursor-pointer"
        onClick={onClick}
      />
      <div className={`absolute top-2 right-2 px-3 py-1 bg-black/50 text-white rounded-full text-sm`}>
        {typeTag}
      </div>
    </div>
  ) : <NoImageDisplay />
));

const GunBrandPanel = React.memo(({
  brand,
  brandIdx,
  expanded,
  toggle,
  models = [],
  getModelImage,
  isLoadingImages,
  selectedIndex,
  candidates = [],
  onSelect,
  dbCandidates = [],
  firearmReady = false
}) => {
  const brandName = brand.name || brand.label || '';
  const modelList = Array.isArray(models) && models.length > 0 ? models : (brand.models || []);

  // note: models in brand are expected to already include example_images, normalized and foundInDb flags

  return (
    <div key={`brand-${brandIdx}`} className="border border-gray-300 rounded-lg overflow-hidden">
      <div
        onClick={() => toggle(brandName)}
        className={`p-4 bg-gray-50 flex items-center justify-between cursor-pointer ${expanded ? 'border-b border-gray-300' : ''}`}
      >
        <div className="flex-1">
          <div className="font-medium">{brandName}</div>
          <div className={`text-sm text-gray-500`}>
            ความมั่นใจ: {formatConfidence(brand.confidence)}
            {modelList.length > 0 && ` • ${modelList.length} รุ่น`}
          </div>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </div>

      {expanded && modelList.length > 0 && (
        <div className="bg-white divide-y divide-gray-100 p-3 space-y-2">
          {modelList.map((model, modelIdx) => {
            const modelName = model.name || model.label || '';
            const candidateIndex = candidates.findIndex(
              c => String(c.brandName || '').toLowerCase() === String(brandName).toLowerCase() &&
                   String(c.modelName || '').toLowerCase() === String(modelName).toLowerCase()
            );
            const cand = {
              label: `${brandName} ${modelName}`.trim(),
              confidence: model.confidence ?? 0,
              brandName,
              modelName,
              example_images: model.example_images || '',
              exhibit_id: model.exhibit_id || null,
              normalized: model.normalized || '',
              notFoundInDb: model.foundInDb === false
            };
            return (
              <div key={`model-${brandIdx}-${modelIdx}`}>
                <FirearmCandidateCard
                  candidate={cand}
                  selected={selectedIndex !== undefined && candidates[selectedIndex] && candidates[selectedIndex].normalized === cand.normalized}
                  onClick={() => {
                    if (candidateIndex !== -1) onSelect(candidateIndex);
                  }}
                />
                {model.foundInDb === false && (
                  <div className="text-xs text-gray-500 mt-1 ml-1">* ไม่พบในฐานข้อมูล</div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
});

const FirearmCandidateCard = React.memo(({ candidate, selected = false, onClick }) => (
  <div
    className={`p-4 border border-gray-300 rounded-lg flex items-start cursor-pointer ${selected ? 'border-[#990000] bg-red-50' : ''}`}
    onClick={onClick}
    role="button"
  >
    <div className="mr-3 flex-shrink-0">
      {candidate.example_images ? (
        <img
          src={candidate.example_images}
          alt={candidate.label}
          className="w-16 h-16 object-contain rounded-lg border border-gray-300"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/64?text=No+Image"; }}
        />
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
          <PiImageBroken className="text-gray-400 text-xl" />
        </div>
      )}
    </div>

    <div className="flex-1">
      <div className="font-medium">{candidate.label || `${candidate.brandName || ''} ${candidate.modelName || ''}`}</div>
      <div className="text-sm text-gray-500 mt-1">
        ความมั่นใจ: {formatConfidence(candidate.confidence)}
      </div>
    </div>

    {selected && (
      <div className="w-6 h-6 rounded-full bg-[#990000] flex items-center justify-center ml-2 flex-shrink-0">
        <Check className="w-4 h-4 text-white" />
      </div>
    )}
  </div>
));

// --- ADD: Skeleton card used while waiting API responses ---
const SkeletonCandidateCard = React.memo(() => (
  <div className="p-4 border border-gray-200 rounded-lg flex items-start animate-pulse">
    <div className="mr-3 flex-shrink-0">
      <div className="w-16 h-16 bg-gray-200 rounded-lg" />
    </div>
    <div className="flex-1 space-y-2 py-1">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
    </div>
  </div>
));
// ==================== MAIN COMPONENTS ====================
const CandidateShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const narcoticApiService = new NarcoticApiService();
  // const { isMobile, isDesktop, isTablet } = useDevice();
  // compute cookie/detection type early so state initializers can use it and avoid initial flash
  const cookieDt = (readCookie('detectionType') || '').toLowerCase();

  // initialize loading flags based on whether we have input (location.state) and detectionType
  // this ensures Skeleton is shown immediately on first render when processing will start
   const [selectedIndex, setSelectedIndex] = useState(0);
   const [imageUrl, setImageUrl] = useState('');
   const [vectorImage, setVectorImage] = useState('');
   const [fromCamera, setFromCamera] = useState(false);
   const [sourcePath, setSourcePath] = useState('');
   const [expandedBrands, setExpandedBrands] = useState({});
   const [brandData, setBrandData] = useState([]);
   const [isUnknownObject, setIsUnknownObject] = useState(false);
   const [fullScreen, setFullScreen] = useState(false);
 
   const [candidates, setCandidates] = useState([]);
   const [detectionType, setDetectionType] = useState('');
   const [similarNarcoticIds, setSimilarNarcoticIds] = useState([]);
   const [dbFirearmCandidates, setDbFirearmCandidates] = useState([]);
   const [firearmLoading, setFirearmLoading] = useState(() => !!(location?.state && cookieDt === 'gun'));
   const [firearmReady, setFirearmReady] = useState(false);
   const [drugLoading, setDrugLoading] = useState(() => !!(location?.state && (cookieDt === 'drug' || cookieDt === 'packagedrug')));
   const [drugReady, setDrugReady] = useState(false);
   const candidatesCount = useMemo(() => Array.isArray(candidates) ? candidates.length : 0, [candidates]);

  // show header/list skeleton until the relevant detection APIs are fully done
  const resultsLoading = useMemo(() => {
    if (cookieDt === 'gun') return !!firearmLoading;
    if (cookieDt === 'drug' || cookieDt === 'packagedrug') return !!drugLoading;
    return false;
  }, [cookieDt, firearmLoading, drugLoading]);

  useEffect(() => {
    if (!location.state) return;
    const { analysisResult, result, image, croppedImage: stateCroppedImage, fromCamera: fc, sourcePath: sp } = location.state;
    const data = analysisResult || result || {};
    const displayImage = image || '';
    let chosenVectorImage = image || '';
    try {
      const objects = data.objects || result?.objects || [];
      const drugObj = Array.isArray(objects) ? objects.find(o => o.cropped_base64 && String(o.detection_type).toLowerCase() === 'drug') : null;
      const anyCrop = Array.isArray(objects) ? objects.find(o => o.cropped_base64) : null;
      chosenVectorImage = stateCroppedImage || (drugObj && drugObj.cropped_base64) || (anyCrop && anyCrop.cropped_base64) || image || '';
    } catch (e) {
      chosenVectorImage = image || '';
    }
    setImageUrl(displayImage);
    setVectorImage(chosenVectorImage);
    setFromCamera(!!fc);
    setSourcePath(sp || '');
    setIsUnknownObject(false);
    setDetectionType('');
    setCandidates([]);
    setBrandData([]);
    setSelectedIndex(0);

    if ((cookieDt === 'drug' && chosenVectorImage ) || (cookieDt === 'packagedrug' && chosenVectorImage)) {
      (async () => {
        try {
          const payload = await convertImgRefToVector(chosenVectorImage);
          const imgRefVector = payload?.vector_base64;
          if (imgRefVector) {
            try {
              setDrugLoading(true);
              setDrugReady(false);
               const similarResults = await narcoticApiService.findSimilarNarcoticsWithBase64(imgRefVector);
               const narcoticIds = Array.isArray(similarResults)
                 ? similarResults.map(r => r?.narcotic_id).filter(id => id !== undefined && id !== null)
                 : [];
               setSimilarNarcoticIds(narcoticIds);
               
               let narcoticDetails = [];
               if (narcoticIds.length > 0) {
                 try {
                   narcoticDetails = await Promise.all(
                     narcoticIds.map(id => narcoticApiService.fetchNarcoticById(id).catch(() => null))
                   );
                 } catch {
                   narcoticDetails = [];
                 }
               }
              setDrugLoading(false);
              setDrugReady(true);
            } catch (apiErr) {
              setSimilarNarcoticIds([]);
              setDrugLoading(false);
              setDrugReady(true);
            }
          } else {
            setSimilarNarcoticIds([]);
            setDrugLoading(false);
            setDrugReady(true);
          }
        } catch (err) {
          setSimilarNarcoticIds([]);
          setDrugLoading(false);
          setDrugReady(true);
        }
      })();
    }

    else if (cookieDt === 'gun') {
      (async () => {
        try {
          // เริ่มแสดง Skeleton ตั้งแต่ก่อนเรียก API ตัวแรก
              // ensure flags set (safe even if already true)
              setFirearmLoading(true);
              setFirearmReady(false);
            const resp = await classifyFirearmBrand(chosenVectorImage);
           console.log('[CandidateShow] classifyFirearmBrand response:', resp);
           const top3 = Array.isArray(resp?.brand_top3) ? resp.brand_top3 : [];
           setBrandData(top3);

           const flatCandidates = top3.map((b, i) => ({
             label: b.label,
             confidence: b.confidence ?? 0,
             brandName: b.label,
             modelName: '',
             index: i
           }));
           // เพิ่มตัวเลือก Unknown สำหรับปืน แบบเดียวกับยา
           flatCandidates.push({
             label: 'อาวุธปืนประเภทไม่ทราบชนิด',
             confidence: 0,
             isUnknownWeapon: true,
             brandName: 'Unknown',
             modelName: 'Unknown',
             exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_GUN,
             example_images: ''
           });
           setCandidates(flatCandidates);
           setDetectionType('Gun');

           if (top3.length > 0 && chosenVectorImage) {
             // show skeleton while performing model classification + DB lookup
             setFirearmLoading(true);
             setFirearmReady(false);
             const tasks = top3.map(async (b) => {
               try {
                 const modelResp = await classifyFirearmModel(b.label, chosenVectorImage);
                 console.log(`[CandidateShow] classifyFirearmModel response for "${b.label}":`, modelResp);
 
                 const normalizeName = (s = '') =>
                   String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
 
                 const modelEntries = Array.isArray(modelResp?.model_top3) ? modelResp.model_top3 : [];
                 const normalized = modelEntries.map(m => normalizeName(`${b.label}${m.label}`));
 
                 if (normalized.length === 0 && modelResp?.selected_model) {
                   normalized.push(normalizeName(`${b.label}${modelResp.selected_model}`));
                 }
 
                 console.log(`[CandidateShow] normalized names for brand "${b.label}":`, normalized);
 
                 return { brand: b.label, ok: true, resp: modelResp, normalized };
               } catch (err) {
                 console.error(`[CandidateShow] classifyFirearmModel error for "${b.label}":`, err);
                 return { brand: b.label, ok: false, error: err };
               }
             });
 
             const results = await Promise.allSettled(tasks);
             try {
               // ผนวกความมั่นใจของ model จากผล classifyFirearmModel เข้าใน brandData
               const modelMap = new Map();
               results.forEach(r => {
                 if (r.status === 'fulfilled' && r.value?.resp) {
                   const resp = r.value.resp;
                   if (Array.isArray(resp.model_top3) && resp.model_top3.length > 0) {
                     modelMap.set(r.value.brand, resp.model_top3.map(m => ({ name: m.label, confidence: m.confidence ?? 0 })));
                   } else if (resp.selected_model) {
                     modelMap.set(r.value.brand, [{ name: resp.selected_model, confidence: 0 }]);
                   }
                 }
               });

               // เตรียมชื่อ normalized ทั้งหมดเพื่อค้นหาใน DB
               const normalizeName = (s = '') =>
                 String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
              const allNormalized = results
                .filter(r => r.status === 'fulfilled' && Array.isArray(r.value?.normalized))
                .flatMap(r => r.value.normalized);

              // ถ้ามี normalized ให้ไปค้นหา DB เพื่อดึงรูป/ข้อมูลตัวอย่าง
              let normalizedFetches = [];
              if (allNormalized.length > 0) {
                setFirearmLoading(true);
                setFirearmReady(false);
                try {
                  normalizedFetches = await Promise.all(
                    allNormalized.map(n =>
                      getFirearmByNormalized(n)
                        .then(resp => ({ normalized: n, resp }))
                        .catch(err => ({ normalized: n, error: err?.message || String(err) }))
                    )
                  );
                } catch (e) {
                  console.error('[CandidateShow] getFirearmByNormalized batch error:', e);
                } finally {
                  setFirearmLoading(false);
                  setFirearmReady(true);
                }
              } else {
                setFirearmLoading(false);
                setFirearmReady(true);
              }

              const dbMap = new Map();
              (normalizedFetches || []).forEach(item => {
                if (item && item.resp && !item.error) {
                  dbMap.set(item.normalized, item.resp);
                }
              });

              // สร้าง brandData ใหม่ที่รวม models พร้อม confidence และรูปจาก DB (ถ้ามี)
              const updatedBrandData = (top3 || []).map(b => {
                const modelsFromResp = modelMap.get(b.label) || [];
                const modelsFormatted = modelsFromResp.map(m => {
                  const normalized = normalizeName(`${b.label}${m.name}`);
                  const db = dbMap.get(normalized) || null;
                  const example_images = Array.isArray(db?.example_images) && db.example_images.length > 0
                    ? db.example_images[0]?.image_url || ''
                    : '';
                  return {
                    name: m.name,
                    confidence: m.confidence ?? 0,
                    normalized,
                    example_images,
                    exhibit_id: db?.exhibit_id ?? db?.id ?? null,
                    foundInDb: !!db
                  };
                });
                // ถ้า brand response เดิมมี models ในรูปแบบอื่น ให้รวมด้วย (fallback)
                if ((!modelsFromResp || modelsFromResp.length === 0) && Array.isArray(b.models)) {
                  const fb = b.models.map(m => {
                    const name = m.name || m.label || String(m);
                    const normalized = normalizeName(`${b.label}${name}`);
                    const db = dbMap.get(normalized) || null;
                    const example_images = Array.isArray(db?.example_images) && db.example_images.length > 0
                      ? db.example_images[0]?.image_url || ''
                      : '';
                    return {
                      name,
                      confidence: m.confidence ?? 0,
                      normalized,
                      example_images,
                      exhibit_id: db?.exhibit_id ?? db?.id ?? null,
                      foundInDb: !!db
                    };
                  });
                  return { ...b, models: fb };
                }
                return { ...b, models: modelsFormatted };
              });

              // สร้าง candidates แบบ flat list จาก brandData (ชื่อจาก model, confidence จาก model, รูปจาก DB)
              const mergedCandidates = (updatedBrandData || []).flatMap(b =>
                (b.models || []).map(m => ({
                  label: `${b.label} ${m.name}`.trim(),
                  confidence: m.confidence ?? 0,
                  brandName: b.label,
                  modelName: m.name,
                  exhibit_id: m.exhibit_id || null,
                  example_images: m.example_images || '',
                  normalized: m.normalized || '',
                  isUnknownWeapon: false,
                  isUnknown: false,
                  notFoundInDb: m.foundInDb === false
                }))
              );
              // เพิ่มตัวเลือก Unknown สำหรับปืน หลังรวมข้อมูล model+DB
              mergedCandidates.push({
                label: 'อาวุธปืนประเภทไม่ทราบชนิด',
                confidence: 0,
                isUnknownWeapon: true,
                brandName: 'Unknown',
                modelName: 'Unknown',
                exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_GUN,
                example_images: ''
              });

              // --- เพิ่ม Unknown เป็น brand เพื่อให้แสดงใน BrandPanel ด้วย (จะมี model เดียวชื่อ Unknown) ---
              const hasUnknownBrand = (updatedBrandData || []).some(b =>
                String(b.label).includes('ไม่ทราบชนิด') || String(b.label).toLowerCase().includes('unknown')
              );
              if (!hasUnknownBrand) {
                updatedBrandData.push({
                  label: 'อาวุธปืนประเภทไม่ทราบชนิด',
                  confidence: 0,
                  models: [{
                    name: 'Unknown',
                    confidence: 0,
                    normalized: '',
                    example_images: '',
                    exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_GUN,
                    foundInDb: false
                  }]
                });
              }
 
              setBrandData(updatedBrandData);
              setDbFirearmCandidates([]); // no separate DB list needed now
              setCandidates(mergedCandidates);
              // finished loading -> hide skeleton and show results
              setFirearmLoading(false);
              setFirearmReady(true);
             } catch (err) {
               console.error('[CandidateShow] error merging model+db results:', err);
              // ensure loading state cleared on error as well
              setFirearmLoading(false);
              setFirearmReady(true);
             }
           }
        } catch (err) {
          console.error('[CandidateShow] classifyFirearmBrand error:', err);
          // clear loading so UI stops showing indefinite skeleton; mark ready to allow user interaction
          setFirearmLoading(false);
          setFirearmReady(true);
         }
       })();
     }
   }, [location.state]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const toggleBrand = useCallback((brandName) => {
    setExpandedBrands(prev => ({ ...prev, [brandName]: !prev[brandName] }));
  }, []);

  const handleSelectCandidate = useCallback((index) => {
    if (index === -1 || index === undefined) return;
    setSelectedIndex(index);
  }, [candidates, detectionType]);

  // single unknown-gun candidate (show as model-level entry, no brand panel)
  const unknownGunCandidate = useMemo(() => {
    return (Array.isArray(candidates) ? candidates.find(c => c.isUnknownWeapon) : null) || null;
  }, [candidates]);
 
  const handleConfirm = useCallback(async () => {
    if (candidates.length === 0) return;
    const selected = candidates[selectedIndex];
    let result = null;
    const evidenceType = isUnknownObject ? 'Unknown' : detectionType;

    if (isUnknownObject) {
      result = {
        exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_OBJECT,
        isUnknown: true,
        prediction: 'Unknown',
        confidence: 0,
        exhibit: { category: 'ไม่ทราบชนิด', subcategory: 'unknown', type: 'unknown', classification: 'unidentified' }
      };
    } else if (cookieDt === 'gun') {
      if (selected.isUnknownWeapon) {
        result = {
          exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_GUN,
          weaponType: 'อาวุธปืนประเภทไม่ทราบชนิด',
          brandName: 'Unknown',
          modelName: 'Unknown',
          confidence: 0,
          isUnknownWeapon: true,
          isUnknown: false
        };
      } else {
        const matchingExhibit = await findExhibitByBrandModel(selected.brandName, selected.modelName);
        result = {
          exhibit_id: matchingExhibit?.firearm?.exhibit_id || null,
          weaponType: selected.label,
          confidence: selected.confidence,
          brandName: selected.brandName,
          modelName: selected.modelName,
          exhibit: {
            category: 'อาวุธปืน',
            subcategory: selected.brandName || 'unknown',
            type: 'firearm',
            classification: 'identified',
            firearms: [{
              name: `${selected.brandName} ${selected.modelName}`,
              brand: selected.brandName,
              model: selected.modelName,
              mechanism: '',
              series: '',
              description: `${selected.brandName} ${selected.modelName} ตรวจพบด้วย AI ความมั่นใจ ${formatConfidence(selected.confidence)}`
            }]
          }
        };
      }

      if (brandData.length > 0) {
        const sb = brandData.find(b => b.name === selected.brandName);
        if (sb) {
          result.brandConfidence = sb.confidence;
          result.availableModels = (sb.models || []).map(m => ({ name: m.name, confidence: m.confidence }));
        }
      }
    } else if (detectionType === 'Drug') {
      if (selected.isUnknownDrug) {
        result = {
          exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_DRUG,
          prediction: 'ยาเสพติดประเภทไม่ทราบชนิด',
          confidence: 0,
          drug_type: 'ไม่ทราบชนิด',
          drug_category: 'ไม่ทราบประเภท',
          characteristics: 'ไม่ทราบอัตลักษณ์',
          details: [{ pill_name: 'ยาเสพติดไม่ทราบชนิด', confidence: 0, narcotic_id: null }]
        };
      } else {
        const narcoticDetail = null;
        const drugExhibit = await findExhibitByNarcoticId(selected.narcotic_id);
        result = {
          exhibit_id: drugExhibit?.id || null,
          prediction: selected.displayName || selected.label,
          confidence: selected.confidence,
          narcotic_id: selected.narcotic_id,
          similarity: selected.similarity,
          details: [{ pill_name: selected.displayName || selected.label, confidence: selected.confidence, narcotic_id: selected.narcotic_id }]
        };
        if (narcoticDetail) {
          result.exhibit = {
            category: 'ยาเสพติด',
            subcategory: narcoticDetail.drug_category || 'unknown',
            type: 'narcotic',
            classification: 'identified'
          };
        }
      }
    } else {
      result = {
        exhibit_id: null,
        prediction: selected.label,
        confidence: selected.confidence,
        details: [{ pill_name: selected.label, confidence: selected.confidence }],
        exhibit: { category: 'อื่นๆ', subcategory: 'unknown', type: 'other', classification: 'unidentified' }
      };
    }

    localStorage.setItem('analysisResult', JSON.stringify(result));
    localStorage.setItem('selectedEvidenceType', evidenceType);

    const evidenceData = {
      type: evidenceType,
      result,
      imageUrl,
      selectedCandidateIndex: selectedIndex,
      allCandidates: candidates
    };

    navigate('/evidenceProfile', {
      state: { type: evidenceType, result, evidence: evidenceData, fromCamera, sourcePath }
    });
  }, [candidates, selectedIndex, detectionType, isUnknownObject, brandData, navigate, imageUrl, fromCamera, sourcePath]);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white">
      <div className="p-4 flex items-center border-b border-gray-300 shrink-0">
        <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-gray-100" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`ml-2 text-xl font-semibold`}>เลือกวัตถุพยานที่ตรวจพบ</h1>
      </div>

      <div className="p-4 border-b border-gray-300 shrink-0">
        <ImagePreview
          imageUrl={imageUrl}
          onClick={() => setFullScreen(true)}
          typeTag={cookieDt === 'gun' ? '🔫 อาวุธปืน' : cookieDt === 'drug' ? '💊 ยาเสพติด' : '❓ วัตถุพยานที่ไม่รู้จัก'}
          getHeightClass={getImageHeight}
        />
      </div>

      <div className={`flex-1 p-4 overflow-y-auto`}>
        {resultsLoading ? (
          <div className="mb-3 flex items-center space-x-3" aria-hidden="true">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
          </div>
        ) : (
          <h2 className={`text-lg mb-3`}>
            ผลการตรวจพบ <span className="font-semibold text-red-800">{candidatesCount}</span> รายการ
          </h2>
        )}

        {isUnknownObject ? (
          <div className={`p-6 bg-gray-50 border border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-3`}>
            <HelpCircle className={`w-12 h-12 text-gray-400`} />
            <div className="text-center">
              <h3 className={`text-lg font-medium`}>วัตถุพยานที่ไม่รู้จัก</h3>
              <p className={`text-gray-500 text-base`}>
                ไม่สามารถระบุชนิดของวัตถุพยานได้ หรือความมั่นใจในการระบุต่ำเกินไป
              </p>
            </div>
          </div>
        ) : cookieDt === 'gun' ? (
          <div className="space-y-3">
            {firearmLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <SkeletonCandidateCard key={`s-gun-${i}`} />)}
              </div>
            ) : firearmReady ? (
               brandData && brandData.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {brandData.map((b, idx) => (
                     <GunBrandPanel
                       key={`brand-${idx}`}
                       brand={{ name: b.label, confidence: b.confidence, models: b.models || [] }}
                       brandIdx={idx}
                       expanded={!!expandedBrands[b.label]}
                       toggle={(name) => toggleBrand(name)}
                       models={b.models || []}
                       getModelImage={() => ''}
                       isLoadingImages={false}
                       selectedIndex={selectedIndex}
                       candidates={candidates}
                       onSelect={(i) => handleSelectCandidate(i)}
                       dbCandidates={dbFirearmCandidates}
                       firearmReady={firearmReady}
                     />
                   ))}

                   {/* show unknown-gun as a model-level card (no brand panel) */}
                   {unknownGunCandidate && (
                     <div>
                       <FirearmCandidateCard
                         candidate={unknownGunCandidate}
                         selected={selectedIndex !== undefined && candidates[selectedIndex] && candidates[selectedIndex].isUnknownWeapon}
                         onClick={() => {
                           const idx = candidates.findIndex(c => c.isUnknownWeapon);
                           if (idx !== -1) handleSelectCandidate(idx);
                         }}
                       />
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="p-4 text-center text-gray-500">ยังไม่มีผลยี่ห้อที่ชัดเจน</div>
               )
             ) : (
               <div className="p-4 text-center text-gray-500">ยังไม่มีผลยี่ห้อ — กรุณาลองใหม่หรือรอการประมวลผล</div>
             )}
           </div>
          ) : (
           <div className={`space-y-3`}>
            {drugLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <SkeletonCandidateCard key={`s-drug-${i}`} />)}
              </div>
            ) : (candidates.length > 0) ? (
               candidates.map((candidate, index) => {
                 return (
                   <div
                     key={`${candidate.label}-${index}`}
                     className={`p-4 border border-gray-300 rounded-lg flex items-start ${selectedIndex === index ? 'border-[#990000] bg-red-50' : ''}`}
                     onClick={() => setSelectedIndex(index)}
                   >
                     {(candidate.narcotic_id && candidate.example_images) ? (
                       <div className="mr-3 flex-shrink-0">
                         <img
                           src={candidate.example_images}
                           alt={candidate.label}
                           className="w-16 h-16 object-contain rounded-lg border border-gray-300"
                           onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/64?text=No+Image"; }}
                         />
                       </div>
                     ) : false && !candidate.isUnknownDrug ? (
                       <div className="mr-3 flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                         <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                       </div>
                     ) : !candidate.isUnknownDrug ? (
                       <div className="mr-3 flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                         <PiImageBroken className="text-gray-400 text-xl" />
                       </div>
                     ) : null}

                    <div className="flex-1">
                      {!candidate.isUnknownDrug ? (
                        <>
                          <div className="font-medium">{candidate.characteristics || 'ไม่ทราบอัตลักษณ์'}</div>
                          <div className={`text-sm text-gray-500`}>
                            {candidate.similarity !== undefined ? (
                              <div className="mb-1">ความคล้ายคลึง: {Math.round((candidate.similarity || 0) * 100)}%</div>
                            ) : (
                              <div className="mb-1">ความมั่นใจ: {formatConfidence(candidate.confidence)}</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="font-medium">{candidate.label}</div>
                      )}
                    </div>

                    {selectedIndex === index && (
                      <div className="w-6 h-6 rounded-full bg-[#990000] flex items-center justify-center ml-2 flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })
             ) : (
               <div className={`p-4 text-center text-gray-500`}>ไม่พบวัตถุพยานที่ตรงกับเงื่อนไข</div>
             )}
           </div>
        )}

        <div className="h-4" />
      </div>

      <div className={`p-4 border-t border-gray-300 bg-white shrink-0`}>
        <button
          onClick={handleConfirm}
          // disable until candidates exist AND current detection's APIs are finished
          disabled={
            candidates.length === 0 ||
            (cookieDt === 'gun' ? !firearmReady : (cookieDt === 'drug' || cookieDt === 'packagedrug') ? !drugReady : false)
          }
          className={`w-full py-4 rounded-lg ${(candidates.length > 0 && (cookieDt === 'gun' ? firearmReady : (cookieDt === 'drug' || cookieDt === 'packagedrug') ? drugReady : true)) ? 'bg-[#990000] text-white' : 'bg-gray-200 text-gray-500'} font-medium`}
        >
          {isUnknownObject ? 'ยืนยันวัตถุไม่ทราบชนิด' : 'ยืนยันการเลือก'}
        </button>
      </div>

      {fullScreen && imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50" role="dialog" aria-modal="true">
          <button className={`absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full`} onClick={() => setFullScreen(false)} aria-label="Close">
            <IoClose />
          </button>
          <img src={imageUrl} alt="Full Screen" className={`max-w-full max-h-[80vh] object-contain mb-4 px-4`} />
          <div className={`px-3 py-1 bg-black/70 text-white rounded-full text-sm`}>
            {cookieDt === 'gun' ? '🔫 อาวุธปืน' : cookieDt === 'drug' ? '💊 ยาเสพติด' : '❓ วัตถุพยานที่ไม่รู้จัก'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateShow;