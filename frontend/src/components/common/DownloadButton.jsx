import React, { useCallback } from "react";
import { FaDownload } from "react-icons/fa";
import html2canvas from "html2canvas";

/* ========================= CONSTANTS ========================= */
const DEFAULT_FILENAME = "capture.png";
const CAPTURE_ELEMENT_ID = "capture-area";

/* ========================= UTILS ========================= */
const createAndTriggerDownload = (blob, filename = DEFAULT_FILENAME) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* ========================= MAIN COMPONENT ========================= */
function DownloadButton() {
  const handleDownload = useCallback(async () => {
    const el = document.getElementById(CAPTURE_ELEMENT_ID);
    if (!el) {
      console.error(`Element with id="${CAPTURE_ELEMENT_ID}" not found`);
      return;
    }

    try {
      const scale = Math.max(1, window.devicePixelRatio || 1);
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: false,
        scale,
        logging: false,
        backgroundColor: null
      });

      canvas.toBlob(
        (blob) => {
          if (blob) {
            createAndTriggerDownload(blob, DEFAULT_FILENAME);
          } else {
            const dataUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = DEFAULT_FILENAME;
            document.body.appendChild(a);
            a.click();
            a.remove();
          }
        },
        "image/png"
      );
    } catch (err) {
      console.error("Failed to capture element:", err);
    }
  }, []);

  return (
    <button
      type="button"
      aria-label="ดาวน์โหลดภาพหน้าจอ"
      title="ดาวน์โหลดภาพหน้าจอ"
      onClick={handleDownload}
      className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition cursor-pointer"
    >
      <FaDownload size={18} aria-hidden="true" />
      <span className="text-sm font-medium">Save รูปภาพ</span>
    </button>
  );
}

export default DownloadButton;