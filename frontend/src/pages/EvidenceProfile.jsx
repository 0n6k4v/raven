import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TabBar from '../components/EvidenceProfile/TabBar';
import BottomBar from '../components/EvidenceProfile/BottomBar';
import FirearmBasicInformation from '../components/EvidenceProfile/FirearmBasicInformation';
import NarcoticBasicInformation from '../components/EvidenceProfile/NarcoticBasicInformation';
import Gallery from '../components/EvidenceProfile/Gallery';
import History from '../components/EvidenceProfile/History';
import Map from '../components/EvidenceProfile/Map';

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
let inMemoryEvidenceStore = null;

// ==================== UTILS ====================
const normalizeNameForSearch = (brandName, modelName) => {
  if (!brandName && !modelName) return '';
  const normalizedBrand = brandName ? String(brandName).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const normalizedModel = modelName ? String(modelName).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return `${normalizedBrand}${normalizedModel}`;
};

// ==================== CUSTOM HOOK ====================
const useEvidenceProfile = (location) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [evidence, setEvidence] = useState(() => {
    let initialData = { type: '', result: null, details: null, imageUrl: null };

    try {
      if (location.state?.evidence) {
        inMemoryEvidenceStore = location.state.evidence;
        return location.state.evidence;
      }

      if (location.state?.type) {
        initialData = {
          type: location.state.type,
          result: location.state.result || null,
          imageUrl: localStorage.getItem('analysisImage') || null
        };
        inMemoryEvidenceStore = initialData;
        return initialData;
      }

      const savedMinimal = localStorage.getItem('minimalEvidenceResult');
      if (savedMinimal) {
        const result = JSON.parse(savedMinimal);
        const typeFromStorage = localStorage.getItem('selectedEvidenceType')
          || localStorage.getItem('evidenceType')
          || (result?.hasOwnProperty('prediction') ? 'Drug' : 'Gun');
        return { type: typeFromStorage, result, imageUrl: localStorage.getItem('analysisImage') || null };
      }

      const evidenceType = localStorage.getItem('evidenceType');
      const imageUrl = localStorage.getItem('analysisImage');
      if (evidenceType || imageUrl) {
        return { type: evidenceType || '', result: null, imageUrl: imageUrl || null };
      }
    } catch (err) {
      console.warn('useEvidenceProfile init error:', err);
    }

    return initialData;
  });

  // Fetch firearm details
  const fetchFirearmDetails = useCallback(async (brandName, modelName) => {
    if (!brandName && !modelName) return false;
    setIsLoading(true);
    setApiError(null);
    try {
      // Special-case unknowns
      if (brandName === 'Unknown' && modelName === 'Unknown') {
        const resp = await fetch(`${BASE_URL}/exhibits`);
        if (!resp.ok) throw new Error(`Failed to fetch exhibits: ${resp.status}`);
        const exhibits = await resp.json();
        const unknownWeapon = Array.isArray(exhibits) ? exhibits.find(e => e.id === 21) : null;
        if (unknownWeapon) {
          setEvidence(prev => ({
            ...prev,
            details: {
              id: 21,
              brand: 'Unknown',
              model: '',
              type: 'อาวุธปืนประเภทไม่ทราบชนิด',
              exhibit: { id: 21, category: unknownWeapon.category, subcategory: unknownWeapon.subcategory }
            }
          }));
          return true;
        }
        return false;
      }

      const normalizedName = normalizeNameForSearch(brandName, modelName);
      const resp = await fetch(`${BASE_URL}/exhibits`);
      if (!resp.ok) throw new Error(`Failed to fetch exhibits: ${resp.status}`);
      const exhibits = await resp.json();
      if (!Array.isArray(exhibits)) return false;

      const matchingExhibit = exhibits.find(exhibit =>
        exhibit.firearm &&
        exhibit.category === 'อาวุธปืน' &&
        normalizeNameForSearch(exhibit.firearm.brand, exhibit.firearm.model) === normalizedName
      );

      if (matchingExhibit) {
        setEvidence(prev => ({
          ...prev,
          details: {
            ...matchingExhibit.firearm,
            exhibit: { id: matchingExhibit.id, category: matchingExhibit.category, subcategory: matchingExhibit.subcategory },
            images: matchingExhibit.firearm?.example_images || []
          }
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('fetchFirearmDetails error:', error);
      setApiError(error?.message || 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch drug details
  const lastDrugFetchRef = useRef(null);
  const drugFetchControllerRef = useRef(null);

  const fetchDrugDetails = useCallback(async (narcoticId) => {
    if (!narcoticId) return false;

    // guard: avoid re-fetching the same narcotic id repeatedly
    if (lastDrugFetchRef.current === narcoticId) {
      // already fetched (or fetching) this id — skip
      return true;
    }

    // abort previous in-flight drug fetch (if any)
    try {
      if (drugFetchControllerRef.current) {
        drugFetchControllerRef.current.abort();
      }
    } catch (e) {
      /* ignore */
    }

    const controller = new AbortController();
    drugFetchControllerRef.current = controller;
    lastDrugFetchRef.current = narcoticId;

    setIsLoading(true);
    setApiError(null);
    try {
      const resp = await fetch(`${BASE_URL}/narcotics/${narcoticId}`, { signal: controller.signal });
      if (!resp.ok) throw new Error(`Failed to fetch narcotic ${narcoticId}: ${resp.status}`);
      const drugData = await resp.json();

      setEvidence(prev => {
        const existingId = prev?.details?.id;
        if (existingId && Number(existingId) === Number(drugData.id)) {
          return {
            ...prev,
            result: {
              ...prev.result,
              exhibit_id: drugData.exhibit_id || drugData.exhibit?.id || prev.result?.exhibit_id,
            }
          };
        }

        return {
          ...prev,
          details: drugData,
          result: {
            ...prev.result,
            exhibit_id: drugData.exhibit_id || drugData.exhibit?.id || prev.result?.exhibit_id,
            prediction: prev.result?.prediction,
            confidence: prev.result?.confidence,
            narcotic_id: prev.result?.narcotic_id,
            similarity: prev.result?.similarity
          }
        };
      });

      return true;
    } catch (error) {
      // if aborted, do not treat as real error
      if (error.name === 'AbortError') {
        // clear controller but keep lastDrugFetchRef to prevent immediate retry loops
        drugFetchControllerRef.current = null;
        return false;
      }
      console.error('fetchDrugDetails error:', error);
      setApiError(error?.message || 'Unknown error');
      // clear guard so future attempts possible
      lastDrugFetchRef.current = null;
      return false;
    } finally {
      setIsLoading(false);
      // clear controller when finished
      drugFetchControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const result = evidence?.result;
    if (!result) return;

    const narcoticId = result?.narcotic_id;
    const brandName = result?.brandName;
    const modelName = result?.modelName;

    if (evidence.type === 'Gun' && brandName && modelName) {
      fetchFirearmDetails(brandName, modelName);
    } else if (evidence.type === 'Drug' && narcoticId) {
      fetchDrugDetails(narcoticId);
    }
  }, [
    evidence?.type,
    evidence?.result?.brandName,
    evidence?.result?.modelName,
    evidence?.result?.narcotic_id,
    fetchFirearmDetails,
    fetchDrugDetails
  ]);

  useEffect(() => {
    if (!evidence) return;
    try {
      inMemoryEvidenceStore = evidence;
      if (evidence.type) localStorage.setItem('evidenceType', evidence.type);
      if (evidence.result) {
        const minimalResult = {
          className: evidence.result.className,
          confidence: evidence.result.confidence,
          prediction: evidence.result.prediction
        };
        try {
          localStorage.setItem('minimalEvidenceResult', JSON.stringify(minimalResult));
        } catch {
          localStorage.setItem('hasEvidenceResult', 'true');
        }
      }
    } catch (err) {
      console.warn('Persist minimal references failed:', err);
    }
  }, [evidence]);

  // Persist minimal details
  useEffect(() => {
    if (!evidence?.details) return;
    try {
      const minimalInfo = { type: evidence.type, id: evidence.details.id };
      if (evidence.type === 'Gun') {
        minimalInfo.model = evidence.details.model;
        minimalInfo.brand = evidence.details.brand;
      } else if (evidence.type === 'Drug') {
        minimalInfo.drug_type = evidence.details.drug_type;
        minimalInfo.narcotic_id = evidence.details.id;
      }
      localStorage.setItem('evidenceDetails', JSON.stringify(minimalInfo));
    } catch (err) {
      console.warn('Persist minimal details failed:', err);
    }
  }, [evidence?.details, evidence?.type]);

  return {
    evidence,
    setEvidence,
    isLoading,
    apiError,
    fetchFirearmDetails,
    fetchDrugDetails
  };
};

// ==================== MAIN COMPONENTS ====================
const EvidenceProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // removed useDevice usage to decouple device context
  const isMobile = false;
  const isTablet = false;

  const { evidence, setEvidence, isLoading, apiError } = useEvidenceProfile(location);

  // derive active tab from path (memoized)
  const activeTab = useMemo(() => {
    const path = location.pathname || '';
    if (path.includes('/gallery')) return 1;
    if (path.includes('/history')) return 2;
    if (path.includes('/map')) return 3;
    return 0;
  }, [location.pathname]);

  // Render helpers
  const renderBasicInfo = useCallback(() => {
    if (!evidence || (!evidence.type && !evidence.result)) {
      return <div className="p-4 text-red-600">ไม่พบข้อมูลวัตถุพยาน</div>;
    }
    const evidenceType = evidence.type || (evidence.result?.hasOwnProperty('prediction') && !evidence.result?.isUnknown ? 'Drug' : 'Gun');

    switch (evidenceType) {
      case 'Gun':
        return (
          <FirearmBasicInformation
            evidence={evidence.details}
            analysisResult={evidence.result}
            isLoading={isLoading}
            apiError={apiError}
            isMobile={isMobile}
          />
        );
      case 'Drug':
        return (
          <NarcoticBasicInformation
            evidence={evidence.details}
            analysisResult={evidence.result}
            isMobile={isMobile}
          />
        );
      case 'Unknown':
        return (
          <div className="p-4 text-gray-600">
            <h3 className="text-lg font-medium mb-2">วัตถุพยานไม่ทราบชนิด</h3>
            <p>ไม่สามารถระบุชนิดของวัตถุพยานนี้ได้</p>
            {evidence.imageUrl && (
              <div className="mt-4">
                
                <img src={evidence.imageUrl} alt="Unknown evidence" className={`${isMobile ? 'w-full max-h-48' : 'w-full max-h-64'} object-contain rounded-lg`} />
              </div>
            )}
          </div>
        );
      default:
        return <div className="p-4 text-red-600">ไม่พบข้อมูลวัตถุพยาน</div>;
    }
  }, [evidence, isLoading, apiError, isMobile]);

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderBasicInfo();
      case 1:
        // pass down top-level evidence.imageUrl (if present) so Gallery can show user-supplied image
        return <Gallery evidence={evidence?.details} firearmInfo={evidence?.details} userImage={evidence?.imageUrl} isMobile={isMobile} />;
      case 2:
        return <History evidence={evidence?.details} isMobile={isMobile} />;
      case 3:
        return <Map evidence={evidence?.details} isMobile={isMobile} />;
      default:
        return null;
    }
  };

  if (!evidence) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-gray-600">กำลังโหลดข้อมูลวัตถุพยาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TabBar />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
      <BottomBar
        analysisResult={evidence?.result}
        evidence={evidence?.details}
        fromCamera={location.state?.fromCamera}
        sourcePath={location.state?.sourcePath}
        isMobile={isMobile}
      />
    </div>
  );
};

export default EvidenceProfile;