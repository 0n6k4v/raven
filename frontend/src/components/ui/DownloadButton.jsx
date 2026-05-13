import React, { useCallback } from "react"; 
import { FaDownload } from "react-icons/fa";
import html2canvas from "html2canvas";

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class ImageFilePayload {
  constructor(source, filename = "capture.png") {
    this.source = source;
    this.filename = filename;
    this.isBlob = source instanceof Blob;
  }

  createUrl() {
    return this.isBlob ? URL.createObjectURL(this.source) : this.source;
  }

  revokeUrl(url) {
    if (this.isBlob && url) URL.revokeObjectURL(url);
  }
}

class ScreenCaptureService {
  static CAPTURE_CONFIG = { 
    useCORS: true, 
    allowTaint: false, 
    logging: false, 
    backgroundColor: null 
  };

  static async captureElement(element) {
    const scale = Math.max(1, window.devicePixelRatio || 1);
    return await html2canvas(element, { ...this.CAPTURE_CONFIG, scale });
  }

  static triggerDownload(payload) {
    if (!(payload instanceof ImageFilePayload)) return;

    const url = payload.createUrl();
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = payload.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    
    setTimeout(() => payload.revokeUrl(url), 100);
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useScreenExport() {
  const exportAsImage = useCallback(async (elementId, filename) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const canvas = await ScreenCaptureService.captureElement(element);
      
      canvas.toBlob((blob) => {
        const source = blob || canvas.toDataURL("image/png");
        const payload = new ImageFilePayload(source, filename);
        ScreenCaptureService.triggerDownload(payload);
      }, "image/png");
    } catch (err) {
      console.error("Capture failed:", err);
    }
  }, []);

  return { exportAsImage };
}

// ============================================================================
// PRESENTATION LAYER - UI Components (Plain Function Components)
// ============================================================================

const SaveButtonUI = ({ onClick }) => (
  <button
    type="button"
    aria-label="ดาวน์โหลดภาพหน้าจอ"
    title="ดาวน์โหลดภาพหน้าจอ"
    onClick={onClick}
    className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition cursor-pointer"
  >
    <FaDownload size={18} aria-hidden="true" />
    <span className="text-sm font-medium">Save รูปภาพ</span>
  </button>
);

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const DownloadButton = () => {
  const { exportAsImage } = useScreenExport();
  
  const CONFIG = {
    DEFAULT_FILENAME: "capture.png",
    CAPTURE_ID: "capture-area"
  };

  const handleDownload = () => {
    exportAsImage(CONFIG.CAPTURE_ID, CONFIG.DEFAULT_FILENAME);
  };

  return <SaveButtonUI onClick={handleDownload} />;
};

export default DownloadButton;