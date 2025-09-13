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
async function fetchBlobFromDataUrl(dataUrl, signal) {
  if (!dataUrl) return null;
  const res = await fetch(dataUrl, { signal });
  return await res.blob();
}

async function convertImgRefToVector(dataUrl, opts = { timeoutMs: 120000 }) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    if (!dataUrl) {
      clearTimeout(id);
      return null;
    }
    const blob = await fetchBlobFromDataUrl(dataUrl, controller.signal);
    if (!blob) { clearTimeout(id); return null; }

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
  try { return await res.json(); } catch { return null; }
}

// ==================== SERVICES ====================
async function classifyFirearmBrand(dataUrl, opts = { timeoutMs: 180000 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    if (!dataUrl) { clearTimeout(timeoutId); return null; }
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
    try { return await resp.json(); } catch { return await resp.text(); }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function classifyFirearmModel(brand, dataUrl, opts = { timeoutMs: 180000 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    if (!brand || !dataUrl) { clearTimeout(timeoutId); return null; }
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
    try { return await resp.json(); } catch { return await resp.text(); }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ==================== CUSTOM HOOKS ====================
function useInitFromLocation(location) {
  const cookieDt = (readCookie('detectionType') || '').toLowerCase();
  const [imageUrl, setImageUrl] = useState('');
  const [vectorImage, setVectorImage] = useState('');
  const [fromCamera, setFromCamera] = useState(false);
  const [sourcePath, setSourcePath] = useState('');
  const [isUnknownObject, setIsUnknownObject] = useState(false);

  useEffect(() => {
    if (!location?.state) return;
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
  }, [location?.state]);

  return { cookieDt, imageUrl, vectorImage, fromCamera, sourcePath, isUnknownObject, setIsUnknownObject };
}

function useFirearmPipeline(vectorImage, initialTopBrands = [], onCandidatesReady) {
  const [brandData, setBrandData] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [firearmLoading, setFirearmLoading] = useState(false);
  const [firearmReady, setFirearmReady] = useState(false);

  useEffect(() => {
    if (!vectorImage) return;
    let mounted = true;
    (async () => {
      try {
        setFirearmLoading(true);
        setFirearmReady(false);
        const brandResp = await classifyFirearmBrand(vectorImage);
        const top3 = Array.isArray(brandResp?.brand_top3) ? brandResp.brand_top3 : [];
        if (!mounted) return;
        setBrandData(top3);

        const baseCandidates = top3.map((b, i) => ({
          label: b.label, confidence: b.confidence ?? 0, brandName: b.label, modelName: '', index: i
        }));
        baseCandidates.push({
          label: 'อาวุธปืนประเภทไม่ทราบชนิด',
          confidence: 0,
          isUnknownWeapon: true,
          brandName: 'Unknown',
          modelName: 'Unknown',
          exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_GUN,
          example_images: ''
        });
        setCandidates(baseCandidates);

        if (top3.length === 0) { setFirearmLoading(false); setFirearmReady(true); onCandidatesReady && onCandidatesReady(baseCandidates); return; }

        // classify models in parallel and fetch DB info
        const modelTasks = top3.map(async (b) => {
          try {
            const modelResp = await classifyFirearmModel(b.label, vectorImage);
            const modelEntries = Array.isArray(modelResp?.model_top3) ? modelResp.model_top3 : [];
            const selectedModel = modelResp?.selected_model;
            return { brand: b.label, models: modelEntries, selectedModel };
          } catch (err) {
            console.error('classifyFirearmModel error', err);
            return { brand: b.label, models: [], selectedModel: null };
          }
        });

        const results = await Promise.allSettled(modelTasks);
        if (!mounted) return;

        const normalize = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
        const allNormalized = [];
        const modelMap = new Map();
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value) {
            const { brand, models, selectedModel } = r.value;
            const entries = Array.isArray(models) && models.length > 0
              ? models.map(m => ({ name: m.label, confidence: m.confidence ?? 0 }))
              : (selectedModel ? [{ name: selectedModel, confidence: 0 }] : []);
            modelMap.set(brand, entries);
            entries.forEach(e => allNormalized.push(normalize(`${brand}${e.name}`)));
          }
        });

        // fetch DB results for normalized names
        const normalizedFetches = await Promise.all(
          allNormalized.map(n => getFirearmByNormalized(n).then(resp => ({ normalized: n, resp })).catch(err => ({ normalized: n, error: err })))
        );
        const dbMap = new Map();
        normalizedFetches.forEach(item => {
          if (item && item.resp && !item.error) dbMap.set(item.normalized, item.resp);
        });

        // assemble updated brandData and merged candidates
        const updatedBrandData = (top3 || []).map(b => {
          const modelsFromResp = modelMap.get(b.label) || [];
          const modelsFormatted = modelsFromResp.map(m => {
            const normalized = normalize(`${b.label}${m.name}`);
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
          if ((!modelsFromResp || modelsFromResp.length === 0) && Array.isArray(b.models)) {
            const fb = b.models.map(m => {
              const name = m.name || m.label || String(m);
              const normalized = normalize(`${b.label}${name}`);
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
        mergedCandidates.push({
          label: 'อาวุธปืนประเภทไม่ทราบชนิด',
          confidence: 0,
          isUnknownWeapon: true,
          brandName: 'Unknown',
          modelName: 'Unknown',
          exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_GUN,
          example_images: ''
        });

        // ensure Unknown brand present for panel UI
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

        if (!mounted) return;
        setBrandData(updatedBrandData);
        setCandidates(mergedCandidates);
        setFirearmLoading(false);
        setFirearmReady(true);
        onCandidatesReady && onCandidatesReady(mergedCandidates);
      } catch (err) {
        console.error('[useFirearmPipeline] error:', err);
        setFirearmLoading(false);
        setFirearmReady(true);
        onCandidatesReady && onCandidatesReady([]);
      }
    })();
    return () => { mounted = false; };
  }, [vectorImage]);

  return { brandData, candidates, firearmLoading, firearmReady };
}

function useDrugPipeline(vectorImage, narcoticApiService, onCandidatesReady) {
  const [drugLoading, setDrugLoading] = useState(false);
  const [drugReady, setDrugReady] = useState(false);
  const [similarNarcoticIds, setSimilarNarcoticIds] = useState([]);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    if (!vectorImage) return;
    let mounted = true;
    (async () => {
      try {
        setDrugLoading(true);
        setDrugReady(false);
        const payload = await convertImgRefToVector(vectorImage);
        const imgRefVector = payload?.vector_base64;
        if (!imgRefVector) {
          if (!mounted) return;
          setSimilarNarcoticIds([]);
          setDrugLoading(false);
          setDrugReady(true);
          onCandidatesReady && onCandidatesReady([]);
          return;
        }
        const similarResults = await narcoticApiService.findSimilarNarcoticsWithBase64(imgRefVector);
        const narcoticIds = Array.isArray(similarResults) ? similarResults.map(r => r?.narcotic_id).filter(Boolean) : [];
        if (!mounted) return;
        setSimilarNarcoticIds(narcoticIds);

        let narcoticDetails = [];
        if (narcoticIds.length > 0) {
          narcoticDetails = await Promise.all(narcoticIds.map(id => narcoticApiService.fetchNarcoticById(id).catch(() => null)));
        }
        if (!mounted) return;
        
        // build candidates from narcoticDetails
        const built = (narcoticDetails || []).filter(Boolean).map((d, i) => ({
          label: d.characteristics || `รายการ ${i + 1}`,
          displayName: d.characteristics || '',
          narcotic_id: d.id || null,
          example_images: d.example_images[0].image_url || '',
          similarity: similarResults?.[i]?.similarity ?? 0,
          confidence: similarResults?.[i]?.similarity ?? 0
        }));
        // add unknown drug option
        built.push({
          label: 'ยาเสพติดประเภทไม่ทราบชนิด',
          isUnknownDrug: true,
          confidence: 0
        });
        setCandidates(built);
        setDrugLoading(false);
        setDrugReady(true);
        onCandidatesReady && onCandidatesReady(built);
      } catch (err) {
        console.error('[useDrugPipeline] error:', err);
        setSimilarNarcoticIds([]);
        setDrugLoading(false);
        setDrugReady(true);
        onCandidatesReady && onCandidatesReady([]);
      }
    })();
    return () => { mounted = false; };
  }, [vectorImage]);

  return { drugLoading, drugReady, similarNarcoticIds, candidates };
}

// ==================== PRESENTATIONAL COMPONENTS ====================
const getImageHeight = () => 'h-64';

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
      <img src={imageUrl} alt="Evidence" className="w-full h-full object-contain rounded-lg cursor-pointer" onClick={onClick} />
      <div className={`absolute top-2 right-2 px-3 py-1 bg-black/50 text-white rounded-full text-sm`}>{typeTag}</div>
    </div>
  ) : <NoImageDisplay />
));

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
      <div className="text-sm text-gray-500 mt-1">ความมั่นใจ: {formatConfidence(candidate.confidence)}</div>
    </div>

    {selected && (
      <div className="w-6 h-6 rounded-full bg-[#990000] flex items-center justify-center ml-2 flex-shrink-0">
        <Check className="w-4 h-4 text-white" />
      </div>
    )}
  </div>
));

const SkeletonCandidateCard = React.memo(() => (
  <div className="p-4 border border-gray-200 rounded-lg flex items-start animate-pulse">
    <div className="mr-3 flex-shrink-0"><div className="w-16 h-16 bg-gray-200 rounded-lg" /></div>
    <div className="flex-1 space-y-2 py-1"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/4" /></div>
  </div>
));

const GunBrandPanel = React.memo(({
  brand,
  brandIdx,
  expanded,
  toggle,
  models = [],
  selectedIndex,
  candidates = [],
  onSelect,
  firearmReady = false
}) => {
  const brandName = brand.name || brand.label || '';
  const modelList = Array.isArray(models) && models.length > 0 ? models : (brand.models || []);
  return (
    <div key={`brand-${brandIdx}`} className="border border-gray-300 rounded-lg overflow-hidden">
      <div onClick={() => toggle(brandName)} className={`p-4 bg-gray-50 flex items-center justify-between cursor-pointer ${expanded ? 'border-b border-gray-300' : ''}`}>
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
                  onClick={() => { if (candidateIndex !== -1) onSelect(candidateIndex); }}
                />
                {model.foundInDb === false && <div className="text-xs text-gray-500 mt-1 ml-1">* ไม่พบในฐานข้อมูล</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ==================== MAIN COMPONENT ====================
const CandidateShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const narcoticApiService = new NarcoticApiService();
  const cookieDt = (readCookie('detectionType') || '').toLowerCase();

  // init source state from location
  const { imageUrl, vectorImage, fromCamera, sourcePath, isUnknownObject, setIsUnknownObject } = useInitFromLocation(location);

  // UI state
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedBrands, setExpandedBrands] = useState({});
  const [fullScreen, setFullScreen] = useState(false);

  // pipelines
  const { brandData, candidates: firearmCandidates, firearmLoading, firearmReady } = useFirearmPipeline(vectorImage, [], (cands) => { /* callback */ });
  const { drugLoading, drugReady, candidates: drugCandidates } = useDrugPipeline(vectorImage, narcoticApiService, (cands) => { /* callback */ });

  // selected candidate list source depends on cookieDt
  const candidates = useMemo(() => {
    if (cookieDt === 'gun') return firearmCandidates;
    if (cookieDt === 'drug' || cookieDt === 'packagedrug') return drugCandidates;
    return [];
  }, [cookieDt, firearmCandidates, drugCandidates]);

  const candidatesCount = useMemo(() => Array.isArray(candidates) ? candidates.length : 0, [candidates]);
  const resultsLoading = useMemo(() => {
    if (cookieDt === 'gun') return !!firearmLoading;
    if (cookieDt === 'drug' || cookieDt === 'packagedrug') return !!drugLoading;
    return false;
  }, [cookieDt, firearmLoading, drugLoading]);

  useEffect(() => {
    // reset selection when candidate list changes
    setSelectedIndex(0);
  }, [candidates]);

  const handleGoBack = useCallback(() => navigate(-1), [navigate]);
  const toggleBrand = useCallback((brandName) => setExpandedBrands(prev => ({ ...prev, [brandName]: !prev[brandName] })), []);
  const handleSelectCandidate = useCallback((index) => { if (index === -1 || index === undefined) return; setSelectedIndex(index); }, []);

  const unknownGunCandidate = useMemo(() => (Array.isArray(candidates) ? candidates.find(c => c.isUnknownWeapon) : null) || null, [candidates]);

  const handleConfirm = useCallback(async () => {
    if (candidates.length === 0) return;
    const selected = candidates[selectedIndex];
    let result = null;
    const evidenceType = isUnknownObject ? 'Unknown' : cookieDt === 'gun' ? 'Gun' : cookieDt === 'drug' || cookieDt === 'packagedrug' ? 'Drug' : 'Other';

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
    } else if (cookieDt === 'drug' || cookieDt === 'packagedrug') {
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
        const drugExhibit = await findExhibitByNarcoticId(selected.narcotic_id);
        result = {
          exhibit_id: drugExhibit?.id || null,
          prediction: selected.displayName || selected.label,
          confidence: selected.confidence,
          narcotic_id: selected.narcotic_id,
          similarity: selected.similarity,
          details: [{ pill_name: selected.displayName || selected.label, confidence: selected.confidence, narcotic_id: selected.narcotic_id }]
        };
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

    const evidenceData = { type: evidenceType, result, imageUrl, selectedCandidateIndex: selectedIndex, allCandidates: candidates };
    navigate('/evidenceProfile', { state: { type: evidenceType, result, evidence: evidenceData, fromCamera, sourcePath } });
  }, [candidates, selectedIndex, cookieDt, isUnknownObject, brandData, navigate, imageUrl, fromCamera, sourcePath]);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white">
      <div className="p-4 flex items-center border-b border-gray-300 shrink-0">
        <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-gray-100" aria-label="Go back"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className={`ml-2 text-xl font-semibold`}>เลือกวัตถุพยานที่ตรวจพบ</h1>
      </div>

      <div className="p-4 border-b border-gray-300 shrink-0">
        <ImagePreview
          imageUrl={imageUrl}
          onClick={() => setFullScreen(true)}
          typeTag={cookieDt === 'gun' ? '🔫 อาวุธปืน' : (cookieDt === 'drug' || cookieDt === 'packagedrug') ? '💊 ยาเสพติด' : '❓ วัตถุพยานที่ไม่รู้จัก'}
          getHeightClass={getImageHeight}
        />
      </div>

      <div className={`flex-1 p-4 overflow-y-auto`}>
        {resultsLoading ? (
          <div className="mb-3 flex items-center space-x-3" aria-hidden="true"><div className="h-6 bg-gray-200 rounded animate-pulse w-48" /></div>
        ) : (
          <h2 className={`text-lg mb-3`}>ผลการตรวจพบ <span className="font-semibold text-red-800">{candidatesCount}</span> รายการ</h2>
        )}

        {isUnknownObject ? (
          <div className={`p-6 bg-gray-50 border border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-3`}>
            <HelpCircle className={`w-12 h-12 text-gray-400`} />
            <div className="text-center">
              <h3 className={`text-lg font-medium`}>วัตถุพยานที่ไม่รู้จัก</h3>
              <p className={`text-gray-500 text-base`}>ไม่สามารถระบุชนิดของวัตถุพยานได้ หรือความมั่นใจในการระบุต่ำเกินไป</p>
            </div>
          </div>
        ) : cookieDt === 'gun' ? (
          <div className="space-y-3">
            {firearmLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <SkeletonCandidateCard key={`s-gun-${i}`} />)}</div>
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
                      selectedIndex={selectedIndex}
                      candidates={candidates}
                      onSelect={(i) => handleSelectCandidate(i)}
                      firearmReady={firearmReady}
                    />
                  ))}

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
              ) : <div className="p-4 text-center text-gray-500">ยังไม่มีผลยี่ห้อที่ชัดเจน</div>
            ) : <div className="p-4 text-center text-gray-500">ยังไม่มีผลยี่ห้อ — กรุณาลองใหม่หรือรอการประมวลผล</div>}
          </div>
        ) : (
          <div className={`space-y-3`}>
            {drugLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCandidateCard key={`s-drug-${i}`} />)}</div>
            ) : (candidates.length > 0) ? (
              candidates.map((candidate, index) => (
                <div key={`${candidate.label}-${index}`} className={`p-4 border border-gray-300 rounded-lg flex items-start ${selectedIndex === index ? 'border-[#990000] bg-red-50' : ''}`} onClick={() => setSelectedIndex(index)}>
                  {(candidate.narcotic_id && candidate.example_images) ? (
                    <div className="mr-3 flex-shrink-0">
                      <img src={candidate.example_images} alt={candidate.label} className="w-16 h-16 object-contain rounded-lg border border-gray-300" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/64?text=No+Image"; }} />
                    </div>
                  ) : !candidate.isUnknownDrug ? (
                    <div className="mr-3 flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                      <PiImageBroken className="text-gray-400 text-xl" />
                    </div>
                  ) : null}

                  <div className="flex-1">
                    {!candidate.isUnknownDrug ? (
                      <>
                        <div className="font-medium">{candidate.characteristics || candidate.label || 'ไม่ทราบอัตลักษณ์'}</div>
                        <div className={`text-sm text-gray-500`}>
                          {candidate.similarity !== undefined ? <div className="mb-1">ความคล้ายคลึง: {Math.round((candidate.similarity || 0) * 100)}%</div> : <div className="mb-1">ความมั่นใจ: {formatConfidence(candidate.confidence)}</div>}
                        </div>
                      </>
                    ) : (<div className="font-medium">{candidate.label}</div>)}
                  </div>

                  {selectedIndex === index && (
                    <div className="w-6 h-6 rounded-full bg-[#990000] flex items-center justify-center ml-2 flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            ) : <div className={`p-4 text-center text-gray-500`}>ไม่พบวัตถุพยานที่ตรงกับเงื่อนไข</div>}
          </div>
        )}

        <div className="h-4" />
      </div>

      <div className={`p-4 border-t border-gray-300 bg-white shrink-0`}>
        <button
          onClick={handleConfirm}
          disabled={candidates.length === 0 || (cookieDt === 'gun' ? !firearmReady : (cookieDt === 'drug' || cookieDt === 'packagedrug') ? !drugReady : false)}
          className={`w-full py-4 rounded-lg ${(candidates.length > 0 && (cookieDt === 'gun' ? firearmReady : (cookieDt === 'drug' || cookieDt === 'packagedrug') ? drugReady : true)) ? 'bg-[#990000] text-white' : 'bg-gray-200 text-gray-500'} font-medium`}
        >
          {isUnknownObject ? 'ยืนยันวัตถุไม่ทราบชนิด' : 'ยืนยันการเลือก'}
        </button>
      </div>

      {fullScreen && imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50" role="dialog" aria-modal="true">
          <button className={`absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full`} onClick={() => setFullScreen(false)} aria-label="Close"><IoClose /></button>
          <img src={imageUrl} alt="Full Screen" className={`max-w-full max-h-[80vh] object-contain mb-4 px-4`} />
          <div className={`px-3 py-1 bg-black/70 text-white rounded-full text-sm`}>{cookieDt === 'gun' ? '🔫 อาวุธปืน' : (cookieDt === 'drug' || cookieDt === 'packagedrug') ? '💊 ยาเสพติด' : '❓ วัตถุพยานที่ไม่รู้จัก'}</div>
        </div>
      )}
    </div>
  );
};

export default CandidateShow;