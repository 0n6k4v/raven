import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { PiImageBroken } from 'react-icons/pi';
import DownloadButton from '../../../../components/ui/DownloadButton';
import { FirearmEntity } from '../../entities';
import { EvidenceMeterService, StorageService } from '../../services';

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useFirearmLogic({ analysisResult, userImageUrl, firearm }) {
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  const imageUrl = useMemo(() => {
    return userImageUrl || firearm.mainImageUrl || StorageService.getAnalysisImage();
  }, [userImageUrl, firearm.mainImageUrl]);

  const confidence = useMemo(() => {
    return EvidenceMeterService.toPercentage(analysisResult?.confidence);
  }, [analysisResult]);

  const handleDownloadAction = useCallback(() => {
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 2000);
  }, []);

  const toggleFullScreen = useCallback((isOpen) => {
    setFullScreen(isOpen);
  }, []);

  return { imageUrl, fullScreen, showShareNotification, confidence, handleDownloadAction, toggleFullScreen };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const InfoRow = React.memo(({ label, value }) => (
  <div className="py-2 flex">
    <span className="text-gray-600 w-40">{label}:</span>
    <span className="text-gray-900">{value || '-'}</span>
  </div>
));

const LoadingUI = React.memo(() => (
  <div className="flex justify-center items-center p-10" role="status">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#990000]" />
    <span className="ml-3 text-gray-600">กำลังค้นหาข้อมูลอาวุธ...</span>
  </div>
));

const ConfidenceMeterUI = React.memo(({ percent }) => {
  const offset = EvidenceMeterService.calculateOffset(percent);
  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 relative" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r={EvidenceMeterService.RADIUS} fill="none" stroke="#e6e6e6" strokeWidth="8" />
          <circle 
            cx="50" cy="50" r={EvidenceMeterService.RADIUS} fill="none" stroke="#8B0000" strokeWidth="8"
            strokeDasharray={EvidenceMeterService.circumference} 
            strokeDashoffset={offset} 
            transform="rotate(-90 50 50)" 
          />
          <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill="#8B0000">
            {percent}%
          </text>
        </svg>
      </div>
      <div className="mt-2 text-gray-600 text-sm">ความมั่นใจ</div>
    </div>
  );
});

const ImageViewer = React.memo(({ src, maxHeight, onExpand }) => {
  if (!src) return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200 h-64 w-full">
      <PiImageBroken className="text-gray-400 text-5xl mb-2" />
      <p className="text-gray-500 text-center text-sm">การแสดงผลภาพถ่ายมีปัญหา</p>
    </div>
  );
  return (
    <img
      src={src}
      alt="ภาพหลักฐาน"
      className="max-w-full h-auto object-contain cursor-pointer transition-opacity hover:opacity-90"
      style={{ maxHeight }}
      onClick={onExpand}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
});

const DetailSection = React.memo(({ firearm }) => (
  <div className="mt-6">
    <InfoRow label="ยี่ห้อ" value={firearm.brand} />
    <InfoRow label="ซีรีส์" value={firearm.series} />
    <InfoRow label="รุ่น" value={firearm.model} />
    <InfoRow label="กลไก" value={firearm.mechanism} />
    {firearm.exhibit && (
      <>
        <InfoRow label="หมวดหมู่" value={firearm.exhibit.category} />
        <InfoRow label="ประเภทย่อย" value={firearm.exhibit.subcategory} />
      </>
    )}
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const FirearmBasicInformation = ({ evidence, analysisResult, isLoading, apiError, userImageUrl }) => {
  const firearm = useMemo(() => FirearmEntity.fromApi(evidence), [evidence]);
  const logic = useFirearmLogic({ analysisResult, userImageUrl, firearm });

  if (isLoading) return <LoadingUI />;
  if (apiError) return <div className="p-4 text-red-600">ข้อผิดพลาด: {String(apiError)}</div>;

  return (
    <div className="bg-white h-full flex flex-col relative" id="capture-area">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-row h-full w-full">
        <div className="w-1/2 p-6 flex justify-center items-center">
          <ImageViewer src={logic.imageUrl} maxHeight={384} onExpand={() => logic.toggleFullScreen(true)} />
        </div>

        <div className="w-1/2 p-6 flex flex-col h-full">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-500">{firearm.brand}</h2>
              <DownloadButton onClick={logic.handleDownloadAction} />
            </div>
            <h2 className="text-3xl font-bold mt-1 tracking-wider uppercase">{firearm.displayName}</h2>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-medium mb-4">รายละเอียด</h3>
              <DetailSection firearm={firearm} />
            </div>
            <div className="flex items-start justify-center">
              <ConfidenceMeterUI percent={logic.confidence} />
            </div>
          </div>

          {firearm.ammunitions && firearm.ammunitions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-600 mb-3 text-sm">กระสุนที่ใช้ร่วมกัน</h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                {firearm.ammunitions.map((ammo, idx) => (
                  <button key={idx} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 text-gray-700 text-xs">
                    {ammo.caliber}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col h-full px-4 pb-6">
        <div className="p-4 flex justify-center items-center">
          <ImageViewer src={logic.imageUrl} maxHeight={240} onExpand={() => logic.toggleFullScreen(true)} />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-gray-500 font-medium text-sm">{firearm.brand}</h2>
          <DownloadButton onClick={logic.handleDownloadAction} />
        </div>
        <h1 className="text-2xl uppercase font-bold mt-1">{firearm.displayName}</h1>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">รายละเอียด</h3>
              <DetailSection firearm={firearm} />
            </div>
            <div className="ml-4 flex-shrink-0">
              <ConfidenceMeterUI percent={logic.confidence} />
            </div>
          </div>
        </div>
      </div>

      {logic.fullScreen && logic.imageUrl && (
        <div className="fixed inset-0 bg-black/90 flex flex-center items-center justify-center z-50" role="dialog" aria-modal="true" onClick={() => logic.toggleFullScreen(false)}>
          <button className="absolute top-4 right-4 text-white text-3xl p-2 hover:bg-white/10 rounded-full transition-colors"><IoClose /></button>
          <img src={logic.imageUrl} alt="ขยายรูป" className="max-w-full max-h-[80vh] object-contain px-4" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {logic.showShareNotification && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-2 rounded-full shadow-2xl z-50 animate-bounce text-sm">
          คัดลอกลิงก์สำเร็จแล้ว
        </div>
      )}
    </div>
  );
};

FirearmBasicInformation.propTypes = {
  evidence: PropTypes.object,
  analysisResult: PropTypes.object,
  isLoading: PropTypes.bool,
  apiError: PropTypes.any,
  userImageUrl: PropTypes.string
};

export default React.memo(FirearmBasicInformation);