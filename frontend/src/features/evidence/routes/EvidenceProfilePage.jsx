import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import TabBar from "../components/EvidenceProfile/TabBar";
import BottomBar from "../components/EvidenceProfile/BottomBar";
import FirearmBasicInformation from "../components/EvidenceProfile/FirearmBasicInformation";
import NarcoticBasicInformation from "../components/EvidenceProfile/NarcoticBasicInformation";
import Gallery from "../components/EvidenceProfile/Gallery";
import History from "../../history/components/History";
import Map from "../components/EvidenceProfile/Map";

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const CONFIG = {
  BASE_URL: `${import.meta.env.VITE_API_URL}/api`,
  UNKNOWN_GUN_EXHIBIT_ID: 93,
};

class EvidenceType {
  static GUN = 'Gun';
  static DRUG = 'Drug';
  
  static inferFromPrediction(prediction) {
    return prediction ? this.DRUG : this.GUN;
  }
}

class EvidenceSearchDTO {
  constructor(brand, model) {
    this.brand = brand;
    this.model = model;
    this.normalizedName = this._normalize(brand, model);
  }

  _normalize(brand, model) {
    if (!brand && !model) return "";
    const normalize = (s) => s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    return `${normalize(brand)}${normalize(model)}`;
  }

  static fromResult(result) {
    return new EvidenceSearchDTO(result?.brandName, result?.modelName);
  }
}

class EvidenceEntity {
  static create(data) {
    return {
      type: data.type || '',
      result: data.result || null,
      imageUrl: data.imageUrl || null,
      details: data.details || null,
    };
  }

  static mapFirearmDetail(firearm, exhibitData = null) {
    const images = Array.isArray(firearm.example_images)
      ? firearm.example_images
      : firearm.example_images
      ? [firearm.example_images]
      : [];

    return {
      ...firearm,
      exhibit: exhibitData ? { category: exhibitData.category, subcategory: exhibitData.subcategory } : { id: firearm.exhibit_id },
      images: images,
    };
  }

  static mapUnknownGun(exhibit) {
    return {
      id: CONFIG.UNKNOWN_GUN_EXHIBIT_ID,
      brand: "Unknown",
      model: "",
      type: "อาวุธปืนประเภทไม่ทราบชนิด",
      exhibit
    };
  }
}

class EvidenceRepository {
  static async getFirearmByNormalized(normalizedName, signal) {
    if (!normalizedName) return null;
    const url = new URL(`${CONFIG.BASE_URL}/firearm/get-by-normalized`);
    url.searchParams.set("normalized_name", normalizedName);

    const res = await fetch(url.toString(), { method: "GET", signal });
    if (!res.ok) throw new Error(`getFirearmByNormalized failed: ${res.status}`);
    if (res.status === 204) return null;
    return res.json().catch(() => null);
  }

  static async getExhibitById(id, signal) {
    const res = await fetch(`${CONFIG.BASE_URL}/exhibits/${id}`, { signal });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch exhibit ${id}`);
    }
    return res.json();
  }

  static async getNarcoticById(id, signal) {
    const res = await fetch(`${CONFIG.BASE_URL}/narcotics/${id}`, { signal });
    if (!res.ok) throw new Error(`Failed to fetch narcotic: ${res.status}`);
    return res.json();
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

let _memoryCache = null;

const useEvidenceInitialization = (location) => {
  const [evidenceState, setEvidenceState] = useState(() => {
    try {
      if (location.state?.evidence) {
        _memoryCache = location.state.evidence;
        return EvidenceEntity.create(location.state.evidence);
      }

      if (location.state?.type) {
        const data = EvidenceEntity.create({
          type: location.state.type,
          result: location.state.result,
          imageUrl: location.state.evidence?.imageUrl
        });
        _memoryCache = data;
        return data;
      }

      const savedResult = localStorage.getItem("minimalEvidenceResult");
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        const type = localStorage.getItem("selectedEvidenceType") || 
                     localStorage.getItem("evidenceType") || 
                     EvidenceType.inferFromPrediction(parsed?.prediction);
        
        return EvidenceEntity.create({
          type,
          result: parsed,
          imageUrl: location.state?.evidence?.imageUrl
        });
      }

      return EvidenceEntity.create({
        type: localStorage.getItem("evidenceType"),
        imageUrl: location.state?.evidence?.imageUrl
      });

    } catch (err) {
      console.warn("Init Error:", err);
      return EvidenceEntity.create({});
    }
  });

  useEffect(() => {
    if (!evidenceState) return;
    _memoryCache = evidenceState;
    
    if (evidenceState.type) {
        localStorage.setItem("evidenceType", evidenceState.type);
    }
    if (evidenceState.result) {
        const minimal = {
            prediction: evidenceState.result.prediction,
            confidence: evidenceState.result.confidence
        };
        localStorage.setItem("minimalEvidenceResult", JSON.stringify(minimal));
    }
  }, [evidenceState]);

  return [evidenceState, setEvidenceState];
};

const useEvidenceFetcher = (evidence, setEvidence) => {
  const [status, setStatus] = useState({ loading: false, error: null });

  const fetchGunData = useCallback(async (brand, model, signal) => {
    if (brand === "Unknown" && model === "Unknown") {
      const exhibit = await EvidenceRepository.getExhibitById(CONFIG.UNKNOWN_GUN_EXHIBIT_ID, signal);
      return EvidenceEntity.mapUnknownGun(exhibit);
    }

    const searchDTO = new EvidenceSearchDTO(brand, model);
    const firearm = await EvidenceRepository.getFirearmByNormalized(searchDTO.normalizedName, signal);
    
    if (!firearm) return null;

    let exhibitData = null;
    if (firearm.exhibit_id) {
        exhibitData = await EvidenceRepository.getExhibitById(firearm.exhibit_id, signal);
    }

    return EvidenceEntity.mapFirearmDetail(firearm, exhibitData);
  }, []);

  const fetchDrugData = useCallback(async (narcoticId, signal) => {
    const drug = await EvidenceRepository.getNarcoticById(narcoticId, signal);
    return {
        ...drug,
        exhibit_id: drug.exhibit_id || drug.exhibit?.id
    };
  }, []);

  useEffect(() => {
    const result = evidence?.result;
    if (!result) return;

    const controller = new AbortController();
    
    const executeFetch = async () => {
        setStatus({ loading: true, error: null });
        try {
            let details = null;

            if (evidence.type === EvidenceType.GUN && result.brandName) {
                details = await fetchGunData(result.brandName, result.modelName, controller.signal);
            } else if (evidence.type === EvidenceType.DRUG && result.narcotic_id) {
                details = await fetchDrugData(result.narcotic_id, controller.signal);
            }

            if (details) {
                setEvidence(prev => ({ ...prev, details }));
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setStatus({ loading: false, error: err.message || 'Unknown error' });
            }
        } finally {
            if (!controller.signal.aborted) {
                setStatus(prev => ({ ...prev, loading: false }));
            }
        }
    };

    executeFetch();
    return () => controller.abort();
  }, [evidence?.type, evidence?.result, fetchGunData, fetchDrugData, setEvidence]);

  return status;
};

const useTabNavigation = (location) => {
  return useMemo(() => {
    const path = location.pathname || "";
    if (path.includes("/gallery")) return 1;
    if (path.includes("/history")) return 2;
    if (path.includes("/map")) return 3;
    return 0;
  }, [location.pathname]);
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

// --- Molecules ---
const LoadingView = () => (
  <div className="flex-1 flex items-center justify-center">
    <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
  </div>
);

const ErrorView = ({ message }) => (
  <div className="p-4 text-red-600 bg-red-50 text-center">
    {message || 'ไม่พบข้อมูลวัตถุพยาน'}
  </div>
);

// --- Templates ---
const EvidenceContent = ({ tabIndex, evidence, isLoading, error }) => {
  if (!evidence) return <ErrorView />;
  
  if (tabIndex === 0) {
    if (evidence.type === EvidenceType.GUN) {
      return (
        <FirearmBasicInformation
          evidence={evidence.details}
          analysisResult={evidence.result}
          isLoading={isLoading}
          apiError={error}
          userImageUrl={evidence.imageUrl}
          isMobile={false}
        />
      );
    }
    if (evidence.type === EvidenceType.DRUG) {
      return (
        <NarcoticBasicInformation
          evidence={evidence.details}
          analysisResult={evidence.result}
          isMobile={false}
        />
      );
    }
    return <ErrorView />;
  }

  switch (tabIndex) {
    case 1:
      return <Gallery evidence={evidence.details} userImage={evidence.imageUrl} isMobile={false} />;
    case 2:
      return <History evidence={evidence.details} isMobile={false} />;
    case 3:
      return <Map evidence={evidence.details} isMobile={false} />;
    default:
      return null;
  }
};

const EvidenceLayout = ({ children, bottomBarProps }) => (
  <div className="flex-1 flex flex-col overflow-hidden">
    <TabBar />
    <div className="flex-1 overflow-auto">
      {children}
    </div>
    <BottomBar {...bottomBarProps} />
  </div>
);

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const EvidenceProfilePage = () => {
  const location = useLocation();
  const [evidence, setEvidence] = useEvidenceInitialization(location);
  
  const { loading, error } = useEvidenceFetcher(evidence, setEvidence);
  
  const activeTab = useTabNavigation(location);

  if (!evidence) return <LoadingView />;

  return (
    <EvidenceLayout
      bottomBarProps={{
        analysisResult: evidence.result,
        evidence: evidence.details,
        imageUrl: evidence.imageUrl,
        fromCamera: location.state?.fromCamera,
        sourcePath: location.state?.sourcePath,
        isMobile: false
      }}
    >
      <EvidenceContent 
        tabIndex={activeTab}
        evidence={evidence}
        isLoading={loading}
        error={error}
      />
    </EvidenceLayout>
  );
};

export default EvidenceProfilePage;