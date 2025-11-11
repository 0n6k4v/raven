import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ========================= CONSTANTS ========================= */
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const DEBUG = false;

const UNKNOWN_EXHIBIT_IDS = {
  UNKNOWN_GUN: 93,
  UNKNOWN_DRUG: 94,
  UNKNOWN_OBJECT: null
};

/* ========================= UTILS ========================= */
const getExhibitId = (evidenceData, analysisResult) =>
  evidenceData?.result?.exhibit_id ?? analysisResult?.exhibit_id ?? null;

const validateRequiredFields = ({ subdistrict, coordinates }) => {
  if (!subdistrict?.id) return 'กรุณาเลือกตำบล/แขวง';
  if (!coordinates?.lat || !coordinates?.lng) return 'ไม่พบข้อมูลพิกัด กรุณาเลือกตำแหน่งบนแผนที่';
  return null;
};

const dataURLtoFile = (dataUrl, filename) => {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  try {
    const [, base64] = dataUrl.split(',');
    const mime = (dataUrl.match(/:(.*?);/) || [])[1] || 'image/jpeg';
    const bin = atob(base64 || '');
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], filename, { type: mime });
  } catch (err) {
    console.error('dataURLtoFile error', err);
    return null;
  }
};

const buildFormData = ({
  exhibitId,
  userId,
  imageBase64,
  subdistrict,
  date,
  time,
  quantity,
  coordinates,
  placeName,
  houseNumber,
  village,
  soi,
  road,
  aiConfidence
}) => {
  const fd = new FormData();
  if (exhibitId) fd.append('exhibit_id', exhibitId);
  fd.append('user_id', userId);
  if (imageBase64) {
    const file = dataURLtoFile(imageBase64, 'evidence.jpg');
    if (file) fd.append('image', file);
  }
  if (subdistrict?.id) fd.append('subdistrict_id', subdistrict.id);
  if (date) fd.append('discovery_date', date);
  if (time) fd.append('discovery_time', time);
  if (quantity !== undefined && quantity !== '') fd.append('quantity', quantity);
  if (coordinates?.lat != null) fd.append('latitude', coordinates.lat);
  if (coordinates?.lng != null) fd.append('longitude', coordinates.lng);
  if (placeName) fd.append('place_name', placeName);
  if (houseNumber) fd.append('house_number', houseNumber);
  if (village) fd.append('village', village);
  if (soi) fd.append('soi', soi);
  if (road) fd.append('road', road);
  if (aiConfidence !== undefined) fd.append('ai_confidence', aiConfidence);
  return fd;
};

const extractErrorMessage = (errOrMsg) => {
  if (!errOrMsg) return 'ไม่สามารถบันทึกประวัติได้ โปรดลองอีกครั้ง';
  if (typeof errOrMsg === 'string') return errOrMsg;
  if (errOrMsg?.message) return errOrMsg.message;
  if (errOrMsg?.detail) return errOrMsg.detail;
  if (errOrMsg?.error) return errOrMsg.error;
  if (errOrMsg?.data?.message) return errOrMsg.data.message;
  return 'ไม่สามารถบันทึกประวัติได้ โปรดลองอีกครั้ง';
};

/* ========================= CUSTOM HOOKS ========================= */
function useLocalBase64Image(key = 'analysisImage') {
  const [base64Image, setBase64Image] = useState(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setBase64Image(saved);
    } catch (err) {
      console.warn('useLocalBase64Image read failed', err);
    }
  }, [key]);
  return base64Image;
}

/* ========================= MAIN COMPONENT ========================= */
const RecordBottomBar = ({
  evidenceData,
  analysisResult,
  province,
  district,
  subdistrict,
  houseNumber,
  village,
  soi,
  road,
  placeName,
  coordinates,
  date,
  time,
  quantity
}) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const base64Image = useLocalBase64Image('analysisImage');

  const handleBack = useCallback(() => {
    navigate(-1);
    setTimeout(() => {
      window.history.replaceState({
        fromRecord: true,
        type: evidenceData?.type ?? 'Gun',
        result: evidenceData?.result ?? evidenceData
      }, '');
    }, 100);
  }, [navigate, evidenceData]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    const exhibitId = getExhibitId(evidenceData, analysisResult);
    if (DEBUG) console.debug('exhibitId', exhibitId, 'evidenceType', evidenceData?.type);

    const validationError = validateRequiredFields({ subdistrict, coordinates });
    if (validationError) {
      setSaveError(validationError);
      setIsSaving(false);
      return;
    }

    const userId = 1;
    const formData = buildFormData({
      exhibitId,
      userId,
      imageBase64: base64Image,
      subdistrict,
      date,
      time,
      quantity,
      coordinates,
      placeName,
      houseNumber,
      village,
      soi,
      road,
      aiConfidence: analysisResult?.confidence
    });

    if (DEBUG) {
      console.debug('Submitting history formData keys:');
      for (const key of formData.keys()) console.debug('-', key);
    }

    try {
      const res = await fetch(`${BASE_URL}/history`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      let body = null;
      try { body = await res.clone().json(); } catch (_) { body = null; }

      if (!res.ok) {
        const serverMsg = body?.detail || body?.error || body?.message || res.statusText || `HTTP ${res.status}`;
        throw new Error(serverMsg);
      }

      if (DEBUG) console.debug('history saved', body);
      navigate('/history', { state: { popup: { open: true, type: 'success', message: 'บันทึกประวัติสำเร็จ' } } });
    } catch (err) {
      const message = extractErrorMessage(err);
      console.error('Save history error', message, err);
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    evidenceData, analysisResult, subdistrict, coordinates, date, time, quantity,
    base64Image, placeName, houseNumber, village, soi, road, navigate
  ]);

  return (
    <div className="w-full h-full px-4 flex items-center justify-between gap-4 sm:justify-end sm:space-x-4 bg-white ring-1 ring-gray-50 shadow-sm rounded-t-lg">
      {saveError && (
        <div className="mr-4 self-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-700 text-sm font-medium">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{saveError}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleBack}
        disabled={isSaving}
        aria-disabled={isSaving}
        className="px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-60"
      >
        ย้อนกลับ
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        aria-disabled={isSaving}
        className={`px-6 py-2 rounded-md text-white font-semibold shadow-sm transition focus:outline-none ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#990000] hover:bg-[#7a0000] focus:ring-2 focus:ring-[#990000]/40'}`}
      >
        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
      </button>
    </div>
  );
};

export default RecordBottomBar;