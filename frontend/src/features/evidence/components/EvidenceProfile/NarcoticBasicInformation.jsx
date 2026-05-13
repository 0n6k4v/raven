import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { PiImageBroken } from 'react-icons/pi';
import DownloadButton from '../../../../components/ui/DownloadButton';
import { NarcoticEntity } from '../../../narcotic/entities'; 
import { EvidenceMeterService, StorageService } from '../../services';
import { NarcoticMapper } from '../../../narcotic/utils';

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useNarcoticLogic({ analysisResult, evidence }) {
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const imageUrl = useMemo(() => StorageService.getAnalysisImage(), []);
  
  const confidence = useMemo(() => {
    const c = analysisResult?.confidence;
    return typeof c === 'number' ? Math.round(c * 100) : 0;
  }, [analysisResult]);

  const drug = useMemo(() => NarcoticEntity.fromApiResponse(evidence), [evidence]);

  const handleOpenFull = useCallback((src) => src && setFullScreenImage(src), []);
  const handleCloseFull = useCallback(() => setFullScreenImage(null), []);

  useEffect(() => {
    if (!fullScreenImage) return;
    const onKey = (e) => e.key === 'Escape' && handleCloseFull();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullScreenImage, handleCloseFull]);

  return { imageUrl, confidence, drug, fullScreenImage, handleOpenFull, handleCloseFull };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const InfoRow = memo(({ label, value, unit = '' }) => (
  <div className="grid grid-cols-3 gap-4 items-end py-1">
    <span className="text-gray-700 font-medium">{label}:</span>
    <span className="text-gray-600 col-span-2">
      {value}{value && unit ? ` ${unit}` : ''}
    </span>
  </div>
));

const ConfidenceMeterUI = memo(({ percent }) => {
  const offset = EvidenceMeterService.calculateOffset(percent);
  return (
    <div className="flex flex-col items-center justify-center mt-4" aria-hidden="true">
      <div className="w-24 h-24 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#8B0000" strokeWidth="8"
            strokeDasharray={EvidenceMeterService.circumference} 
            strokeDashoffset={offset} transform="rotate(-90 50 50)" />
          <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill="#8B0000">
            {percent}%
          </text>
        </svg>
      </div>
      <div className="mt-2 text-gray-600 text-sm">ความมั่นใจ</div>
    </div>
  );
});

const ImageViewer = memo(({ src, maxHeight, onExpand }) => {
  if (!src) return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-300 h-64 w-full">
      <PiImageBroken className="text-gray-400 text-5xl mb-2" />
      <p className="text-gray-600 text-center">การแสดงผลภาพถ่ายมีปัญหา</p>
    </div>
  );
  return (
    <img
      src={src}
      alt="ยาเสพติด"
      className="max-w-full h-auto object-contain cursor-pointer"
      style={{ maxHeight }}
      onClick={onExpand}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
});

const NarcoticDetailSection = memo(({ drug, confidencePercent }) => (
  <div className="w-full">
    <div className="flex flex-row items-stretch">
      <div className="w-2/3 p-4 space-y-3 border-b border-gray-300">
        <InfoRow label="รูปแบบ" value={drug.drug_form?.name || '-'} />
        <InfoRow label="ลักษณะ" value={drug.characteristics} />
      </div>
      <div className="w-1/3 flex flex-col items-center justify-start">
        <ConfidenceMeterUI percent={confidencePercent} />
      </div>
    </div>

    <div className="p-4 space-y-3 border-b border-gray-300">
      <InfoRow label="สี" value={drug.pill_info?.color || '-'} />
      <InfoRow label="เส้นผ่านศูนย์กลาง" value={drug.pill_info?.diameter_mm} unit="มม." />
      <InfoRow label="ความหนา" value={drug.pill_info?.thickness_mm} unit="มม." />
      <InfoRow label="รูปทรงขอบ" value={drug.pill_info?.edge_shape || '-'} />
      <InfoRow label="น้ำหนัก" value={drug.weight_grams} unit="กรัม" />
    </div>

    <div className="p-4 border-b border-gray-300">
      <InfoRow label="วิธีการใช้" value={NarcoticMapper.mapConsumptionMethods(drug.consumption_method)} />
    </div>

    <div className="p-4">
      <InfoRow label="ผลต่อร่างกาย" value={NarcoticMapper.mapCombinedEffects(drug.effect)} />
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const NarcoticBasicInformation = ({ analysisResult, evidence }) => {
  const { imageUrl, confidence, drug, fullScreenImage, handleOpenFull, handleCloseFull } = 
    useNarcoticLogic({ analysisResult, evidence });

  const displaySrc = imageUrl || drug.imageUrl;

  return (
    <div className="bg-white h-full flex flex-col relative">
      {/* Desktop View */}
      <div className="hidden md:flex flex-row items-start p-6 bg-white h-full">
        <div className="w-1/2 p-6 flex justify-center items-center sticky top-0">
          <ImageViewer src={displaySrc} maxHeight={384} onExpand={() => handleOpenFull(displaySrc)} />
        </div>

        <div className="w-1/2 p-6 flex flex-col h-full scrollbar-hide">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">{drug.drug_category}</h2>
            <DownloadButton aria-label="ดาวน์โหลดภาพ" />
          </div>
          <h1 className="text-3xl uppercase font-bold text-gray-900 mb-6 break-words leading-tight">
            {drug.characteristics}
          </h1>

          <div className="border-t border-gray-200">
             <NarcoticDetailSection drug={drug} confidencePercent={confidence} />
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="flex md:hidden flex-col h-full px-4 overflow-y-auto">
        <div className="p-4 flex justify-center items-center">
          <ImageViewer src={displaySrc} maxHeight={240} onExpand={() => handleOpenFull(displaySrc)} />
        </div>

        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="text-gray-700 font-medium">{drug.drug_category}</h2>
          <DownloadButton aria-label="ดาวน์โหลดภาพ" />
        </div>
        <h1 className="text-2xl uppercase font-bold text-gray-900 px-4 mb-4">{drug.characteristics}</h1>

        <div className="border-t border-gray-300">
           <NarcoticDetailSection drug={drug} confidencePercent={confidence} />
        </div>
      </div>

      {/* Modal Overlay */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-[9999]" 
             role="dialog" aria-modal="true" onClick={handleCloseFull}>
          <button className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full" 
                  onClick={handleCloseFull} aria-label="ปิด"><IoClose /></button>
          <img src={fullScreenImage} alt="ขยายรูป" className="max-w-full max-h-[80vh] object-contain px-4" 
               onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

NarcoticBasicInformation.propTypes = {
  analysisResult: PropTypes.object,
  evidence: PropTypes.object,
};

export default memo(NarcoticBasicInformation);