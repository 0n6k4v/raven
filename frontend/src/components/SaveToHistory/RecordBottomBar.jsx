import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ============================================================
   CONSTANTS
   ============================================================ */
const API_CONFIG = {
  BASE_URL: `${import.meta.env.VITE_API_URL}/api`,
  ENDPOINTS: {
    HISTORY: "/history",
  },
  DEFAULT_USER_ID: 1,
};

const ERROR_MESSAGES = {
  MISSING_SUBDISTRICT: "กรุณาเลือกตำบล/แขวง",
  MISSING_COORDINATES: "ไม่พบข้อมูลพิกัด กรุณาเลือกตำแหน่งบนแผนที่",
  SAVE_FAILED: "ไม่สามารถบันทึกประวัติได้ โปรดลองอีกครั้ง",
  NETWORK_ERROR: "เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดลองอีกครั้ง",
};

const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: "บันทึกประวัติสำเร็จ",
};

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

const getExhibitId = (evidenceData) => evidenceData?.exhibit_id ?? null;

const validateRequiredFields = ({
  subdistrict,
  coordinates,
  exhibitId,
  date,
  time,
  aiConfidence,
  base64Image,
}) => {
  if (!subdistrict?.id) return ERROR_MESSAGES.MISSING_SUBDISTRICT;
  if (!coordinates?.lat || !coordinates?.lng)
    return ERROR_MESSAGES.MISSING_COORDINATES;
  if (exhibitId == null) return "กรุณาเลือกประเภทวัตถุพยาน (Exhibit)";
  if (!date) return "กรุณาระบุวันที่พบวัตถุพยาน";
  if (!time) return "กรุณาระบุเวลาที่พบวัตถุพยาน";
  if (aiConfidence == null) return "ไม่พบค่าความมั่นใจจาก AI";
  if (!base64Image) return "กรุณาแนบรูปภาพวัตถุพยานก่อนบันทึก";

  return null;
};

const dataURLtoFile = (dataUrl, filename) => {
  if (!dataUrl?.startsWith("data:")) return null;

  try {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";

    const binary = atob(base64);
    const array = Uint8Array.from(binary, (c) => c.charCodeAt(0));

    return new File([array], filename, { type: mime });
  } catch (err) {
    console.error("dataURLtoFile() error:", err);
    return null;
  }
};

const buildFormData = ({
  exhibitId,
  userId,
  subdistrict,
  coordinates,
  imageBase64,
  date,
  time,
  quantity,
  placeName,
  houseNumber,
  village,
  soi,
  road,
  aiConfidence,
}) => {
  const fd = new FormData();

  fd.append("user_id", userId);
  fd.append("exhibit_id", exhibitId);

  if (imageBase64) {
    const file = dataURLtoFile(imageBase64, "evidence.jpg");
    if (file) fd.append("image", file);
  }

  if (subdistrict?.id) fd.append("subdistrict_id", subdistrict.id);
  if (coordinates?.lat) fd.append("latitude", coordinates.lat);
  if (coordinates?.lng) fd.append("longitude", coordinates.lng);

  if (date) fd.append("discovery_date", date);
  if (time) fd.append("discovery_time", time);
  if (quantity !== "" && quantity != null) fd.append("quantity", quantity);

  if (placeName) fd.append("place_name", placeName);
  if (houseNumber) fd.append("house_number", houseNumber);
  if (village) fd.append("village", village);
  if (soi) fd.append("soi", soi);
  if (road) fd.append("road", road);

  if (aiConfidence != null) fd.append("ai_confidence", aiConfidence);

  return fd;
};

const extractErrorMessage = (err) => {
  if (!err) return ERROR_MESSAGES.SAVE_FAILED;
  if (typeof err === "string") return err;

  return (
    err?.message ||
    err?.detail ||
    err?.error ||
    err?.data?.message ||
    ERROR_MESSAGES.SAVE_FAILED
  );
};

/* ============================================================
   CUSTOM HOOK
   ============================================================ */
const useFormSubmission = (formData) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSubmit = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    const {
      evidenceData,
      analysisResult,
      subdistrict,
      coordinates,
      date,
      time,
      quantity,
      base64Image,
      placeName,
      houseNumber,
      village,
      soi,
      road,
    } = formData;

    const exhibitId = getExhibitId(evidenceData);

    const validationError = validateRequiredFields({
      subdistrict,
      coordinates,
      exhibitId,
      date,
      time,
      base64Image,
      aiConfidence: analysisResult?.confidence,
    });

    if (validationError) {
      setSaveError(validationError);
      setIsSaving(false);
      return;
    }

    const apiFormData = buildFormData({
      exhibitId,
      userId: API_CONFIG.DEFAULT_USER_ID,
      subdistrict,
      coordinates,
      imageBase64: base64Image,
      date,
      time,
      quantity,
      placeName,
      houseNumber,
      village,
      soi,
      road,
      aiConfidence: analysisResult?.confidence,
    });

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HISTORY}`,
        {
          method: "POST",
          credentials: "include",
          body: apiFormData,
        }
      );

      let body = null;
      try {
        body = await response.clone().json();
      } catch (_) {
        body = await response.text();
      }

      if (!response.ok) {
        throw new Error(
          body?.detail || body?.error || body?.message || response.statusText
        );
      }

      navigate("/history", {
        state: {
          popup: {
            open: true,
            type: "success",
            message: SUCCESS_MESSAGES.SAVE_SUCCESS,
          },
        },
      });
    } catch (err) {
      const isNetworkError = err.name === "TypeError" || !navigator.onLine;
      setSaveError(
        isNetworkError ? ERROR_MESSAGES.NETWORK_ERROR : extractErrorMessage(err)
      );

      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [formData, navigate]);

  return { isSaving, saveError, handleSubmit };
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const RecordBottomBar = (props) => {
  const {
    evidenceData,
    analysisResult,
    subdistrict,
    coordinates,
    date,
    time,
    quantity,
    imageUrl,
    placeName,
    houseNumber,
    village,
    soi,
    road,
  } = props;

  const navigate = useNavigate();
  const storedImage = localStorage.getItem("analysisImage");
  const base64Image = imageUrl || storedImage || null;

  const formData = useMemo(
    () => ({
      evidenceData,
      analysisResult,
      subdistrict,
      coordinates,
      date,
      time,
      quantity,
      base64Image,
      placeName,
      houseNumber,
      village,
      soi,
      road,
    }),
    [
      evidenceData,
      analysisResult,
      subdistrict,
      coordinates,
      date,
      time,
      quantity,
      base64Image,
      placeName,
      houseNumber,
      village,
      soi,
      road,
    ]
  );

  const { isSaving, saveError, handleSubmit } = useFormSubmission(formData);

  const handleBack = useCallback(() => {
    navigate(-1);

    setTimeout(() => {
      window.history.replaceState(
        {
          fromRecord: true,
          type: evidenceData?.type ?? "Gun",
          result: evidenceData?.result ?? evidenceData,
        },
        ""
      );
    }, 80);
  }, [navigate, evidenceData]);

  return (
    <div
      className="w-full px-4 py-3 flex items-center justify-between sm:justify-end gap-4 bg-white shadow-sm border-t border-gray-200 rounded-t-lg"
      role="toolbar"
    >
      {saveError && (
        <div className="text-red-700 text-sm bg-red-50 px-3 py-1 rounded-md">
          {saveError}
        </div>
      )}

      {/* BACK BUTTON */}
      <button
        onClick={handleBack}
        disabled={isSaving}
        className="px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-800 hover:bg-gray-50 disabled:opacity-50"
      >
        ย้อนกลับ
      </button>

      {/* SUBMIT BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={isSaving}
        className={`px-6 py-2 rounded-md text-white font-semibold shadow-sm transition-all
          ${
            isSaving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#990000] hover:bg-[#7a0000] active:scale-95"
          }
        `}
      >
        {isSaving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </div>
  );
};

export default RecordBottomBar;