import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronDown, HelpCircle } from 'lucide-react';
import { PiImageBroken } from 'react-icons/pi';
import { IoClose } from 'react-icons/io5';
// import { fetchGunReferenceImages, getGunReferenceImage } from '../../services/gunReferenceService';
// import { fetchNarcoticById } from '../../services/narcoticReferenceService';

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const UNKNOWN_EXHIBIT_IDS = {
  UNKNOWN_GUN: 93,
  UNKNOWN_DRUG: 94,
  UNKNOWN_OBJECT: null
};

// ==================== UTILS ====================
const readCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.split('; ').find(c => c.trim().startsWith(`${name}=`));
  return m ? decodeURIComponent(m.split('=')[1]) : null;
};

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

const useGunReferenceImages = () => {
  const [images, setImages] = useState({ default: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const map = await fetchGunReferenceImages();
        if (mounted) setImages(map || { default: '' });
      } catch (err) {
        console.error('Failed to load gun reference images:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getModelImage = useCallback((brandName, modelName) => {
    if (loading) return null;
    return getGunReferenceImage(images, brandName, modelName);
  }, [images, loading]);

  return { images, loading, getModelImage };
};

const useNarcoticsDetails = (candidates, detectionType) => {
  const [detailsMap, setDetailsMap] = useState({});
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async (inputCandidates) => {
    if (!inputCandidates || inputCandidates.length === 0) return;
    setLoading(true);
    const resultMap = { ...detailsMap };
    try {
      const valid = inputCandidates.filter(c => c.narcotic_id && !c.isUnknownDrug);
      const promises = valid.map(async (c) => {
        if (!resultMap[c.narcotic_id]) {
          const data = await fetchNarcoticById(c.narcotic_id);
          if (data) resultMap[c.narcotic_id] = data;
        }
      });
      await Promise.all(promises);
      setDetailsMap(resultMap);
    } catch (err) {
      console.error('Error loading narcotics details:', err);
    } finally {
      setLoading(false);
    }
  }, [detailsMap]);

  useEffect(() => {
    if (detectionType === 'Drug' && candidates && candidates.length > 0) {
      loadAll(candidates);
    }
  }, [candidates, detectionType, loadAll]);

  return { detailsMap, loading, loadAll };
};

// ==================== PRESENTATIONAL COMPONENTS ====================
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
  // removed useDevice
  // const { isMobile, isDesktop, isTablet } = useDevice();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [fromCamera, setFromCamera] = useState(false);
  const [sourcePath, setSourcePath] = useState('');
  const [expandedBrands, setExpandedBrands] = useState({});
  const [brandData, setBrandData] = useState([]);
  const [isUnknownObject, setIsUnknownObject] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [detectionType, setDetectionType] = useState('');

  const dt_cook = readCookie('detectionType');
  console.log(dt_cook);

  const { images: gunReferenceImages, loading: isLoadingImages, getModelImage } = useGunReferenceImages();
  const { detailsMap: narcoticsDetails, loading: isLoadingNarcotics, loadAll: loadAllNarcoticsDetails } = useNarcoticsDetails(candidates, detectionType);

  const candidatesCount = useMemo(() => Math.max(0, candidates.length - 1), [candidates]);

  const getImageHeight = useCallback(() => {
    return 'h-72';
  }, []);

  useEffect(() => {
    if (!location.state) return;
    const { analysisResult, result, image, fromCamera: fc, sourcePath: sp } = location.state;
    console.log(result);
    const data = analysisResult || result || {};
    setImageUrl(image || localStorage.getItem('analysisImage') || '');
    setFromCamera(!!fc);
    setSourcePath(sp || '');
    setIsUnknownObject(false);
    setDetectionType('');
    setCandidates([]);
    setBrandData([]);
    setSelectedIndex(0);

    const dt = (data.detectionType || '').toString().toLowerCase();

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
    const candidate = candidates[index];
    if (detectionType === 'Drug' && candidate?.narcotic_id) {
      fetchNarcoticById(candidate.narcotic_id).then(d => {
      }).catch(() => {});
    }
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
    } else if (detectionType === 'Gun') {
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
        const narcoticDetail = narcoticsDetails[selected.narcotic_id];
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
  }, [candidates, selectedIndex, detectionType, isUnknownObject, brandData, narcoticsDetails, navigate, imageUrl, fromCamera, sourcePath]);

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
          typeTag={detectionType === 'Gun' ? '🔫 อาวุธปืน' : detectionType === 'Drug' ? '💊 ยาเสพติด' : '❓ วัตถุพยานที่ไม่รู้จัก'}
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
        ) : detectionType === 'Gun' ? (
          <div className={`space-y-3`}>
            {brandData.length > 0 ? (
              <>
                {brandData.filter(b => b.name !== 'Unknown').map((brand, idx) => (
                  <GunBrandPanel
                    key={brand.name + idx}
                    brand={brand}
                    brandIdx={idx}
                    expanded={!!expandedBrands[brand.name]}
                    toggle={toggleBrand}
                    getModelImage={getModelImage}
                    isLoadingImages={isLoadingImages}
                    selectedIndex={selectedIndex}
                    candidates={candidates}
                    onSelect={(i) => setSelectedIndex(i)}
                  />
                ))}

                {/* Unknown weapon option if exists in brandData */}
                {brandData.find(b => b.name === 'Unknown') && (
                  <div
                    className={`p-4 border border-gray-300 rounded-lg flex items-center justify-between ${selectedIndex === candidates.findIndex(c => c.isUnknownWeapon) ? 'border-[#990000] bg-red-50' : ''}`}
                    onClick={() => setSelectedIndex(candidates.findIndex(c => c.isUnknownWeapon))}
                  >
                    <div className="flex-1">
                      <div className="font-medium">อาวุธปืนไม่ทราบชนิด</div>
                      <div className={`text-sm text-gray-500`}>
                        ตัวเลือกสำหรับอาวุธปืนที่ไม่สามารถระบุยี่ห้อหรือรุ่นได้
                      </div>
                    </div>
                    {selectedIndex === candidates.findIndex(c => c.isUnknownWeapon) && (
                      <div className="w-6 h-6 rounded-full bg-[#990000] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div
                className={`p-4 border border-gray-300 rounded-lg flex items-center justify-between ${selectedIndex === 0 ? 'border-[#990000] bg-red-50' : ''}`}
                onClick={() => setSelectedIndex(0)}
              >
                <div className="flex-1">
                  <div className="font-medium">อาวุธปืนไม่ทราบชนิด</div>
                  <div className={`text-sm text-gray-500`}>
                    ตัวเลือกสำหรับอาวุธปืนที่ไม่สามารถระบุยี่ห้อหรือรุ่นได้
                  </div>
                </div>
                {selectedIndex === 0 && (
                  <div className="w-6 h-6 rounded-full bg-[#990000] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={`space-y-3`}>
            {candidates.length > 0 ? (
              candidates.map((candidate, index) => {
                const narcoticDetail = candidate.narcotic_id ? narcoticsDetails[candidate.narcotic_id] : null;
                return (
                  <div
                    key={`${candidate.label}-${index}`}
                    className={`p-4 border border-gray-300 rounded-lg flex items-start ${selectedIndex === index ? 'border-[#990000] bg-red-50' : ''}`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    {(candidate.narcotic_id && narcoticDetail && narcoticDetail.example_images && narcoticDetail.example_images.length > 0) ? (
                      <div className="mr-3 flex-shrink-0">
                        <img
                          src={narcoticDetail.example_images[0].image_url}
                          alt={narcoticDetail.drug_type || candidate.label}
                          className="w-16 h-16 object-contain rounded-lg border border-gray-300"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/64?text=No+Image"; }}
                        />
                      </div>
                    ) : isLoadingNarcotics && !candidate.isUnknownDrug ? (
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

        {!isLoadingNarcotics && candidates.some(c => c.narcotic_id && !narcoticsDetails[c.narcotic_id]) && (
          <button onClick={() => loadAllNarcoticsDetails(candidates)} className="mt-2 p-2 text-xs text-blue-600 hover:underline">
            โหลดข้อมูลเพิ่มเติมอีกครั้ง
          </button>
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
            {detectionType === 'Gun' ? '🔫 อาวุธปืน' : detectionType === 'Drug' ? '💊 ยาเสพติด' : '❓ วัตถุพยานที่ไม่รู้จัก'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateShow;