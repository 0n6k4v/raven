import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronDown, HelpCircle } from 'lucide-react';
import { PiImageBroken } from 'react-icons/pi';
import { IoClose } from 'react-icons/io5';
import { readCookie } from '../utils/cookies';
import { NarcoticApiService } from '../services/api/narcoticApiService';
// import { fetchGunReferenceImages, getGunReferenceImage } from '../../services/gunReferenceService';

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
  models,
  getModelImage,
  isLoadingImages,
  selectedIndex,
  candidates,
  onSelect
}) => (
  <div key={`brand-${brandIdx}`} className="border border-gray-300 rounded-lg overflow-hidden">
    <div
      onClick={() => toggle(brand.name)}
      className={`p-4 bg-gray-50 flex items-center justify-between cursor-pointer ${expanded ? 'border-b border-gray-300' : ''}`}
    >
      <div className="flex-1">
        <div className="font-medium">{brand.name}</div>
        <div className={`text-sm text-gray-500`}>
          ความมั่นใจ: {formatConfidence(brand.confidence)}
          {brand.models.length > 0 && ` • ${brand.models.length} รุ่น`}
        </div>
      </div>
      {expanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
    </div>

    {expanded && brand.models.length > 0 && (
      <div className="bg-white divide-y divide-gray-100">
        {brand.models.map((model, modelIdx) => {
          const candidateIndex = candidates.findIndex(
            c => c.brandName === brand.name && c.modelName === model.name
          );
          const referenceImage = getModelImage(brand.name, model.name);
          return (
            <div
              key={`model-${brandIdx}-${modelIdx}`}
              className={`p-4 flex items-center justify-between ${selectedIndex === candidateIndex ? 'bg-red-50' : ''}`}
              onClick={() => onSelect(candidateIndex)}
            >
              <div className="flex-1 flex items-center">
                {isLoadingImages ? (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  </div>
                ) : referenceImage ? (
                  <img
                    src={referenceImage}
                    alt={`${brand.name} ${model.name}`}
                    className="w-14 h-14 object-contain rounded-lg mr-3 flex-shrink-0 border border-gray-300"
                    onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 border border-gray-300">
                    <PiImageBroken className="text-gray-400 text-xl" />
                  </div>
                )}

                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className={`text-sm text-gray-500`}>
                    ความมั่นใจ: {formatConfidence(model.confidence)}
                  </div>
                </div>
              </div>

              {selectedIndex === candidateIndex && (
                <div className="w-6 h-6 rounded-full bg-[#990000] flex items-center justify-center ml-2 flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
));

// ==================== MAIN COMPONENTS ====================
const CandidateShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const narcoticApiService = new NarcoticApiService();
  // const { isMobile, isDesktop, isTablet } = useDevice();
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
  const candidatesCount = useMemo(() => Array.isArray(candidates) ? candidates.length : 0, [candidates]);
  const cookieDt = (readCookie('detectionType') || '').toLowerCase();

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

              const similarityMap = new Map();
              if (Array.isArray(similarResults)) {
                similarResults.forEach(r => {
                  if (r?.narcotic_id != null) similarityMap.set(r.narcotic_id, r.similarity ?? 0);
                });
              }

              const formattedCandidates = (narcoticDetails || []).filter(Boolean).map(detail => {
                const firstExampleUrl = Array.isArray(detail.example_images) && detail.example_images.length > 0
                   ?detail.example_images[0]?.image_url || ''
                  : '';
                return {
                  label: detail.characteristics || detail.drug_type || `ยาเสพติด ${detail.id}`,
                  displayName: detail.characteristics || detail.drug_type || `ยาเสพติด ${detail.id}`,
                  confidence: similarityMap.get(detail.id) ?? 0,
                  narcotic_id: detail.id,
                  drug_type: detail.drug_type || '',
                  drug_category: detail.drug_category || '',
                  characteristics: detail.characteristics || '',
                  similarity: similarityMap.get(detail.id) ?? 0,
                  example_images: firstExampleUrl,
                };
              });

              formattedCandidates.push({
                label: 'ยาเสพติดประเภทไม่ทราบชนิด',
                displayName: 'ยาเสพติดประเภทไม่ทราบชนิด',
                confidence: 0,
                isUnknownDrug: true,
                characteristics: 'ไม่ทราบอัตลักษณ์',
                exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_DRUG,
                drug_type: 'ไม่ทราบชนิด',
                drug_category: 'ไม่ทราบประเภท',
                example_images: ''
              });

              setDetectionType('Drug');
              setCandidates(formattedCandidates);
            } catch (apiErr) {
              setSimilarNarcoticIds([]);
            }
          } else {
            setSimilarNarcoticIds([]);
          }
        } catch (err) {
          setSimilarNarcoticIds([]);
        }
      })();
    }

    else if (cookieDt === 'gun') {
      (async () => {
        try {
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
          setCandidates(flatCandidates);
          setDetectionType('Gun');

          // send each top3 brand + cropped image to backend model-classify and log responses
          if (top3.length > 0 && chosenVectorImage) {
            const tasks = top3.map(async (b) => {
              try {
                const modelResp = await classifyFirearmModel(b.label, chosenVectorImage);
                console.log(`[CandidateShow] classifyFirearmModel response for "${b.label}":`, modelResp);

                // --- NEW: build normalized names (brand + model) and log them ---
                const normalizeName = (s = '') =>
                  String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

                const modelEntries = Array.isArray(modelResp?.model_top3) ? modelResp.model_top3 : [];
                const normalized = modelEntries.map(m => normalizeName(`${b.label}${m.label}`));

                // if there is a selected_model but no model_top3, include it
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

            // run in parallel and wait for all to settle (non-blocking for UI rendering)
            const results = await Promise.allSettled(tasks);
            // optional: compact logging of all results
            console.log('[CandidateShow] classifyFirearmModel all settled:', results);
          }
        } catch (err) {
          console.error('[CandidateShow] classifyFirearmBrand error:', err);
        }
      })();
    }

    /* LEGACY LOGIC COMMENTED OUT
    const dt = ('').toString().toLowerCase();

    if (dt === 'narcotic' || dt === 'drug' || data.drugCandidates || data.similarNarcotics) {
      setDetectionType('Drug');

      if (Array.isArray(data.drugCandidates) && data.drugCandidates.length > 0) {
        setCandidates(data.drugCandidates);
        return;
      }

      if (Array.isArray(data.similarNarcotics) && data.similarNarcotics.length > 0) {
        const formatted = data.similarNarcotics.map(n => ({
          label: n.characteristics || 'ยาเสพติดไม่ทราบลักษณะ',
          displayName: n.characteristics || 'ยาเสพติดไม่ทราบลักษณะ',
          confidence: n.similarity || 0,
          narcotic_id: n.narcotic_id,
          drug_type: n.drug_type || 'ยาเสพติดไม่ทราบชนิด',
          drug_category: n.drug_category || 'ยาเสพติดไม่ทราบประเภท',
          characteristics: n.characteristics || 'ไม่ทราบอัตลักษณ์',
          similarity: n.similarity || 0
        }));
        formatted.push({
          label: 'ยาเสพติดประเภทไม่ทราบชนิด',
          displayName: 'ยาเสพติดประเภทไม่ทราบชนิด',
          confidence: 0,
          isUnknownDrug: true,
          characteristics: 'ไม่ทราบอัตลักษณ์',
          exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_DRUG,
          drug_type: 'ไม่ทราบชนิด',
          drug_category: 'ไม่ทราบประเภท'
        });
        setCandidates(formatted);
        return;
      }

      if (Array.isArray(data.details) && data.details.length > 0) {
        const limited = data.details.slice(0, 3).map(d => ({
          label: d.pill_name,
          confidence: d.confidence || data.confidence || 0
        }));
        limited.push({ label: 'ยาเสพติดประเภทไม่ทราบชนิด', confidence: 0, isUnknownDrug: true });
        setCandidates(limited);
        return;
      }

      setCandidates([
        { label: data.prediction || '', confidence: data.confidence || 0 },
        { label: 'ยาเสพติดประเภทไม่ทราบชนิด', confidence: 0, isUnknownDrug: true }
      ]);
      return;
    }

    if (dt === 'firearm' || dt === 'gun' || dt === 'weapon' || data.brandData) {
      setDetectionType('Gun');

      if (Array.isArray(data.brandData) && data.brandData.length > 0) {
        setBrandData(data.brandData);
        const flat = [];
        data.brandData.forEach(brand => {
          (brand.models || []).forEach(model => {
            flat.push({
              label: `${brand.name} ${model.name}`,
              confidence: model.confidence,
              brandName: brand.name,
              modelName: model.name
            });
          });
        });
        flat.push({
          label: 'อาวุธปืนไม่ทราบชนิด',
          confidence: 0,
          brandName: 'Unknown',
          modelName: 'Unknown',
          isUnknownWeapon: true
        });
        setCandidates(flat);
        return;
      }

      if (Array.isArray(data.candidates) && data.candidates.length > 0) {
        setCandidates(data.candidates);
        const brandMap = {};
        data.candidates.forEach(c => {
          if (c.brandName && c.brandName !== 'Unknown') {
            if (!brandMap[c.brandName]) brandMap[c.brandName] = { name: c.brandName, confidence: c.confidence, models: [] };
            if (c.modelName) brandMap[c.brandName].models.push({ name: c.modelName, confidence: c.confidence });
          }
        });
        setBrandData(Object.values(brandMap));
        return;
      }

      setCandidates([{
        label: 'อาวุธปืนไม่ทราบชนิด',
        confidence: 0,
        brandName: 'Unknown',
        modelName: 'Unknown',
        isUnknownWeapon: true
      }]);
      setBrandData([]);
      return;
    }

    setIsUnknownObject(true);
    setDetectionType('Unknown');
    setCandidates([{
      label: 'วัตถุพยานที่ไม่รู้จัก',
      confidence: 0,
      isUnknown: true,
      exhibit_id: UNKNOWN_EXHIBIT_IDS.UNKNOWN_OBJECT
    }]);
    */
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
        <h2 className={`text-lg mb-3`}>
          ผลการตรวจพบ <span className="font-semibold text-red-800">{candidatesCount}</span> รายการ
        </h2>

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
            {brandData && brandData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {brandData.map((b, idx) => (
                  <BrandCard key={`brand-${idx}`} label={b.label} confidence={b.confidence} />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                ยังไม่มีผลยี่ห้อ — กรุณาลองใหม่หรือรอการประมวลผล
              </div>
            )}
          </div>
         ) : (
          <div className={`space-y-3`}>
            {candidates.length > 0 ? (
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
          disabled={candidates.length === 0}
          className={`w-full py-4 rounded-lg ${candidates.length > 0 ? 'bg-[#990000] text-white' : 'bg-gray-200 text-gray-500'} font-medium`}
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