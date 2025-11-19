import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TabBar from "../components/EvidenceProfile/TabBar";
import BottomBar from "../components/EvidenceProfile/BottomBar";
import FirearmBasicInformation from "../components/EvidenceProfile/FirearmBasicInformation";
import NarcoticBasicInformation from "../components/EvidenceProfile/NarcoticBasicInformation";
import Gallery from "../components/EvidenceProfile/Gallery";
import History from "../components/EvidenceProfile/History";
import Map from "../components/EvidenceProfile/Map";

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const UNKNOWN_GUN_EXHIBIT_ID = 93;

let inMemoryEvidenceStore = null;

// ==================== UTILS ====================
const normalizeNameForSearch = (brandName, modelName) => {
  if (!brandName && !modelName) return "";
  const normalize = (s) =>
    s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return `${normalize(brandName)}${normalize(modelName)}`;
};

async function getFirearmByNormalized(normalizedName, { signal } = {}) {
  if (!normalizedName) return null;

  const url = new URL(`${BASE_URL}/firearm/get-by-normalized`);
  url.searchParams.set("normalized_name", normalizedName);

  const res = await fetch(url.toString(), { method: "GET", signal });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`getFirearmByNormalized failed: ${res.status} ${text}`);
  }

  if (res.status === 204) return null;

  try {
    return await res.json();
  } catch {
    return null;
  }
}



// ==================== CUSTOM HOOK (Optimized) ====================
const useEvidenceProfile = (location) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [evidence, setEvidence] = useState(() => {
    try {
      const stateEvidence = location.state?.evidence;
      const stateType = location.state?.type;

      if (stateEvidence) {
        inMemoryEvidenceStore = stateEvidence;
        return stateEvidence;
      }

      if (stateType) {
        const data = {
          type: stateType,
          result: location.state.result || null,
          imageUrl: location.state.evidence?.imageUrl || null
        };
        inMemoryEvidenceStore = data;
        return data;
      }

      const savedResult = localStorage.getItem("minimalEvidenceResult");
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        const type =
          localStorage.getItem("selectedEvidenceType") ||
          localStorage.getItem("evidenceType") ||
          (parsed?.prediction ? "Drug" : "Gun");

        return {
          type,
          result: parsed,
          imageUrl: location.state?.evidence?.imageUrl || null
        };
      }

      const type = localStorage.getItem("evidenceType");
      const img = location.state?.evidence?.imageUrl;
      return { type: type || "", result: null, imageUrl: img || null };
    } catch (err) {
      console.warn("Init Evidence Error:", err);
      return { type: "", result: null, imageUrl: null };
    }
  });

  const drugControllerRef = useRef(null);


  // ==================== FETCH FIREARM DETAILS ====================
  const fetchFirearmDetails = useCallback(
    async (brandName, modelName) => {
      if (!brandName && !modelName) return false;

      setIsLoading(true);
      setApiError(null);

      const normalizedKey = normalizeNameForSearch(brandName, modelName);
      const controller = new AbortController();

      try {
        if (brandName === "Unknown" && modelName === "Unknown") {
          const resp = await fetch(
            `${BASE_URL}/exhibits/${UNKNOWN_GUN_EXHIBIT_ID}`,
            { signal: controller.signal }
          );

          if (!resp.ok) {
            if (resp.status === 404) return false;
            throw new Error(`Failed to fetch unknown exhibit`);
          }

          const exhibit = await resp.json();
          setEvidence((prev) => ({
            ...prev,
            details: {
              id: UNKNOWN_GUN_EXHIBIT_ID,
              brand: "Unknown",
              model: "",
              type: "อาวุธปืนประเภทไม่ทราบชนิด",
              exhibit
            }
          }));
          return true;
        }

        const firearm = await getFirearmByNormalized(normalizedKey, {
          signal: controller.signal
        });
        if (!firearm) return false;

        let exhibitMeta = { id: firearm.exhibit_id, category: null, subcategory: null };

        if (firearm.exhibit_id) {
          const exhibitResp = await fetch(
            `${BASE_URL}/exhibits/${firearm.exhibit_id}`,
            { signal: controller.signal }
          );

          if (exhibitResp.ok) {
            const data = await exhibitResp.json().catch(() => null);
            if (data) {
              exhibitMeta.category = data.category;
              exhibitMeta.subcategory = data.subcategory;
            }
          }
        }

        setEvidence((prev) => ({
          ...prev,
          details: {
            ...firearm,
            exhibit: exhibitMeta,
            images: Array.isArray(firearm.example_images)
              ? firearm.example_images
              : firearm.example_images
              ? [firearm.example_images]
              : []
          }
        }));

        return true;
      } catch (err) {
        if (err.name === "AbortError") return false;

        console.error("fetchFirearmDetails error:", err);
        setApiError(err.message || "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
        controller.abort();
      }
    },
    []
  );


  // ==================== FETCH NARCOTIC DETAILS ====================
  const fetchDrugDetails = useCallback(async (narcoticId) => {
    if (!narcoticId) return false;

    if (drugControllerRef.current) {
      drugControllerRef.current.abort();
    }

    const controller = new AbortController();
    drugControllerRef.current = controller;

    setIsLoading(true);
    setApiError(null);

    try {
      const resp = await fetch(`${BASE_URL}/narcotics/${narcoticId}`, {
        signal: controller.signal
      });

      if (!resp.ok) {
        throw new Error(`Failed to fetch narcotic: ${resp.status}`);
      }

      const drug = await resp.json();

      setEvidence((prev) => ({
        ...prev,
        details: drug,
        result: {
          ...prev.result,
          exhibit_id: drug.exhibit_id || drug.exhibit?.id
        }
      }));

      return true;
    } catch (err) {
      if (err.name === "AbortError") return false;
      console.error("Drug fetch error", err);
      setApiError(err.message || "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
      drugControllerRef.current = null;
    }
  }, []);


  // ==================== AUTO-FETCH WHEN EVIDENCE CHANGES ====================
  useEffect(() => {
    const r = evidence?.result;
    if (!r) return;

    if (evidence.type === "Gun" && r.brandName && r.modelName) {
      fetchFirearmDetails(r.brandName, r.modelName);
    }

    if (evidence.type === "Drug" && r.narcotic_id) {
      fetchDrugDetails(r.narcotic_id);
    }
  }, [
    evidence?.type,
    evidence?.result?.brandName,
    evidence?.result?.modelName,
    evidence?.result?.narcotic_id,
    fetchFirearmDetails,
    fetchDrugDetails
  ]);


  // ==================== PERSIST MINIMAL RESULT ====================
  useEffect(() => {
    if (!evidence) return;

    try {
      inMemoryEvidenceStore = evidence;

      if (evidence.type) localStorage.setItem("evidenceType", evidence.type);

      if (evidence.result) {
        const minimal = {
          prediction: evidence.result.prediction,
          confidence: evidence.result.confidence
        };

        localStorage.setItem("minimalEvidenceResult", JSON.stringify(minimal));
      }
    } catch (err) {
      console.warn("Persist failed", err);
    }
  }, [evidence]);


  return {
    evidence,
    setEvidence,
    isLoading,
    apiError,
    fetchFirearmDetails,
    fetchDrugDetails
  };
};


// ==================== MAIN COMPONENT ====================

const EvidenceProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isMobile = false;
  const isTablet = false;

  const { evidence, isLoading, apiError } = useEvidenceProfile(location);

  const activeTab = useMemo(() => {
    const path = location.pathname || "";
    if (path.includes("/gallery")) return 1;
    if (path.includes("/history")) return 2;
    if (path.includes("/map")) return 3;
    return 0;
  }, [location.pathname]);


  const renderBasicInfo = useCallback(() => {
    if (!evidence) {
      return <div className="p-4 text-red-600">ไม่พบข้อมูลวัตถุพยาน</div>;
    }

    const type =
      evidence.type ||
      (evidence.result?.prediction ? "Drug" : "Gun");

    switch (type) {
      case "Gun":
        return (
          <FirearmBasicInformation
            evidence={evidence.details}
            analysisResult={evidence.result}
            isLoading={isLoading}
            apiError={apiError}
            userImageUrl={evidence.imageUrl}
            isMobile={isMobile}
          />
        );

      case "Drug":
        return (
          <NarcoticBasicInformation
            evidence={evidence.details}
            analysisResult={evidence.result}
            isMobile={isMobile}
          />
        );

      default:
        return <div className="p-4 text-red-600">ไม่พบข้อมูลวัตถุพยาน</div>;
    }
  }, [evidence, isLoading, apiError]);


  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderBasicInfo();
      case 1:
        return (
          <Gallery
            evidence={evidence?.details}
            userImage={evidence?.imageUrl}
            isMobile={isMobile}
          />
        );
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
        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }


  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TabBar />

      <div className="flex-1 overflow-auto">{renderContent()}</div>

      <BottomBar
        analysisResult={evidence?.result}
        evidence={evidence?.details}
        imageUrl={evidence?.imageUrl}
        fromCamera={location.state?.fromCamera}
        sourcePath={location.state?.sourcePath}
        isMobile={isMobile}
      />
    </div>
  );
};

export default EvidenceProfile;