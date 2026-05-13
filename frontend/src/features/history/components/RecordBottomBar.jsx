import React, { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

/**
 * Domain Service: จัดการเกี่ยวกับไฟล์
 */
class FileService {
  static dataURLtoFile(dataUrl, filename = "evidence.jpg") {
    if (!dataUrl?.startsWith("data:")) return null;
    try {
      const [header, base64] = dataUrl.split(",");
      const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      const binary = atob(base64);
      const array = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new File([array], filename, { type: mime });
    } catch (err) {
      console.error("FileService.dataURLtoFile error:", err);
      return null;
    }
  }
}

/**
 * Validation Service: กฎทางธุรกิจสำหรับการบันทึก
 */
class HistoryValidationService {
  static validate(data) {
    if (!data.subdistrictId) return "กรุณาเลือกตำบล/แขวง";
    if (!data.lat || !data.lng) return "ไม่พบข้อมูลพิกัด กรุณาเลือกตำแหน่งบนแผนที่";
    if (data.exhibitId == null) return "กรุณาเลือกประเภทวัตถุพยาน (Exhibit)";
    if (!data.date) return "กรุณาระบุวันที่พบวัตถุพยาน";
    if (!data.time) return "กรุณาระบุเวลาที่พบวัตถุพยาน";
    if (data.aiConfidence == null) return "ไม่พบค่าความมั่นใจจาก AI";
    if (!data.base64Image) return "กรุณาแนบรูปภาพวัตถุพยานก่อนบันทึก";
    return null;
  }
}

/**
 * Payload (Write Model): จัดการข้อมูลขาออก (Request Body)
 */
class CreateHistoryPayload {
  constructor(data) {
    this.userId = data.userId || 1;
    this.exhibitId = data.exhibitId;
    this.subdistrictId = data.subdistrictId;
    this.lat = data.lat;
    this.lng = data.lng;
    this.base64Image = data.base64Image;
    this.date = data.date;
    this.time = data.time;
    this.quantity = data.quantity;
    this.placeName = data.placeName;
    this.houseNumber = data.houseNumber;
    this.village = data.village;
    this.soi = data.soi;
    this.road = data.road;
    this.aiConfidence = data.aiConfidence;
  }

  toFormData() {
    const fd = new FormData();
    fd.append("user_id", this.userId);
    fd.append("exhibit_id", this.exhibitId);
    
    if (this.base64Image) {
      const file = FileService.dataURLtoFile(this.base64Image);
      if (file) fd.append("image", file);
    }

    if (this.subdistrictId) fd.append("subdistrict_id", this.subdistrictId);
    if (this.lat) fd.append("latitude", this.lat);
    if (this.lng) fd.append("longitude", this.lng);
    if (this.date) fd.append("discovery_date", this.date);
    if (this.time) fd.append("discovery_time", this.time);
    
    if (this.quantity !== "" && this.quantity != null) {
      fd.append("quantity", this.quantity);
    }

    const fields = {
      place_name: this.placeName,
      house_number: this.houseNumber,
      village: this.village,
      soi: this.soi,
      road: this.road,
      ai_confidence: this.aiConfidence,
    };

    Object.entries(fields).forEach(([key, val]) => {
      if (val != null && val !== "") fd.append(key, val);
    });

    return fd;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

/**
 * Hook: useCreateHistoryUseCase
 * จัดการขั้นตอนการส่งข้อมูลประวัติ
 */
const useCreateHistoryUseCase = (onSuccess) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (formDataRaw) => {
    setIsSaving(true);
    setError(null);

    const payload = new CreateHistoryPayload({
      userId: 1, // API_CONFIG.DEFAULT_USER_ID
      exhibitId: formDataRaw.evidenceData?.exhibit_id,
      subdistrictId: formDataRaw.subdistrict?.id,
      lat: formDataRaw.coordinates?.lat,
      lng: formDataRaw.coordinates?.lng,
      base64Image: formDataRaw.base64Image,
      date: formDataRaw.date,
      time: formDataRaw.time,
      quantity: formDataRaw.quantity,
      placeName: formDataRaw.placeName,
      houseNumber: formDataRaw.houseNumber,
      village: formDataRaw.village,
      soi: formDataRaw.soi,
      road: formDataRaw.road,
      aiConfidence: formDataRaw.analysisResult?.confidence,
    });

    const validationMsg = HistoryValidationService.validate(payload);
    if (validationMsg) {
      setError(validationMsg);
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/history`, {
        method: "POST",
        credentials: "include",
        body: payload.toFormData(),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || body.error || body.message || "บันทึกไม่สำเร็จ");
      }

      onSuccess();
    } catch (err) {
      const isNetworkError = err.name === "TypeError" || !navigator.onLine;
      setError(isNetworkError ? "เกิดข้อผิดพลาดในการเชื่อมต่อ" : err.message);
    } finally {
      setIsSaving(false);
    }
  }, [onSuccess]);

  return { execute, isSaving, error };
};

// ============================================================================
// PRESENTATION LAYER - UI Components (Atoms/Molecules)
// ============================================================================

const ErrorBadge = memo(({ message }) => (
  <div className="text-red-700 text-sm bg-red-50 px-3 py-1 rounded-md">
    {message}
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const RecordBottomBar = (props) => {
  const navigate = useNavigate();
  const base64Image = props.imageUrl || localStorage.getItem("analysisImage") || null;

  // Callback เมื่อบันทึกสำเร็จ
  const handleSuccess = useCallback(() => {
    navigate("/history", {
      state: {
        popup: { open: true, type: "success", message: "บันทึกประวัติสำเร็จ" },
      },
    });
  }, [navigate]);

  const { execute, isSaving, error } = useCreateHistoryUseCase(handleSuccess);

  const handleBack = useCallback(() => {
    navigate(-1);
    // รักษาพฤติกรรมเดิมในการเคลียร์/เซ็ต state ประวัติ
    setTimeout(() => {
      window.history.replaceState(
        {
          fromRecord: true,
          type: props.evidenceData?.type ?? "Gun",
          result: props.evidenceData?.result ?? props.evidenceData,
        },
        ""
      );
    }, 80);
  }, [navigate, props.evidenceData]);

  return (
    <div
      className="w-full px-4 py-3 flex items-center justify-between sm:justify-end gap-4 bg-white shadow-sm border-t border-gray-200 rounded-t-lg"
      role="toolbar"
    >
      {error && <ErrorBadge message={error} />}

      <button
        onClick={handleBack}
        disabled={isSaving}
        className="px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-800 hover:bg-gray-50 disabled:opacity-50"
      >
        ย้อนกลับ
      </button>

      <button
        onClick={() => execute({ ...props, base64Image })}
        disabled={isSaving}
        className={`px-6 py-2 rounded-md text-white font-semibold shadow-sm transition-all
          ${isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-[#990000] hover:bg-[#7a0000] active:scale-95"}
        `}
      >
        {isSaving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </div>
  );
};

export default memo(RecordBottomBar);