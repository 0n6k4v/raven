import React, { useMemo, memo, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiZoomIn } from 'react-icons/fi'; 
import DownloadButton from '../../../../components/ui/DownloadButton';
import { EvidenceMeterService } from '../../services';
import { HistoryItemEntity } from '../../../history/entities';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const CONFIG = { BORDER_COLOR: "#e5e7eb", ACCENT_COLOR: "#b91c1c" };

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useImageViewer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  const openImage = useCallback((imgSrc) => {
    if (imgSrc) {
      setCurrentImage(imgSrc);
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const closeImage = useCallback(() => {
    setIsOpen(false);
    setCurrentImage(null);
    document.body.style.overflow = 'unset';
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeImage();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeImage]);

  return { isOpen, currentImage, openImage, closeImage };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const ImageViewerModal = memo(({ isOpen, imageSrc, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
        aria-label="Close full screen"
      >
        <FiX size={24} />
      </button>
      
      <img 
        src={imageSrc} 
        alt="Full screen view" 
        className="max-w-[95vw] max-h-[95vh] object-contain shadow-2xl transition-transform duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
});

const DetailRow = memo(({ label, children }) => (
  // ✅ แก้ไข: ใช้ items-end เพื่อให้ Value อยู่ระนาบเดียวกับบรรทัดสุดท้ายของ Label (ตามความต้องการข้อ 2)
  <div className="flex items-end py-0.5">
    <span className="text-gray-600 w-24 flex-shrink-0 text-sm">{label}</span>
    <span className="font-medium text-gray-900 text-sm break-words">{children || '-'}</span>
  </div>
));

const ConfidenceMeter = memo(({ confidencePercent, size = 24 }) => (
  <div className={`w-${size} h-${size} flex flex-col items-center justify-center`} aria-label="AI confidence meter" role="img">
    <div className="relative w-full h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke={CONFIG.BORDER_COLOR} strokeWidth="8" />
        <circle
            cx="50" cy="50" r="45" fill="none" stroke={CONFIG.ACCENT_COLOR}
            strokeWidth="8" strokeDasharray={EvidenceMeterService.circumference}
            strokeDashoffset={EvidenceMeterService.calculateOffset(confidencePercent)}
            transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill={CONFIG.ACCENT_COLOR}>
            {confidencePercent}%
        </text>
        </svg>
    </div>
    <p className="text-gray-500 text-[10px] text-center mt-1 font-medium leading-none whitespace-nowrap">ความมั่นใจ AI</p>
  </div>
));

const DesktopLayout = memo(({ entity, onImageClick }) => {
  const firearm = (Array.isArray(entity.exhibit.firearms) ? entity.exhibit.firearms[0] : entity.exhibit.firearm) || {};
  const displayName = entity._determineDisplayName(entity);
  const confidencePercent = entity._confidencePercent(entity)

  return (
    <div className="hidden md:flex flex-row h-full w-full">
      <div className="w-1/2 p-6 flex justify-center items-center relative group border-r border-gray-100">
        <div 
          className="relative cursor-zoom-in transition-transform hover:scale-[1.01]" 
          onClick={() => onImageClick(entity.image)}
        >
          <img 
            src={entity.image} 
            alt={entity.altText} 
            className="max-w-full h-auto object-contain max-h-96 rounded-lg shadow-sm" 
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-lg">
             <div className="bg-white/90 p-3 rounded-full shadow-lg text-gray-800">
               <FiZoomIn size={24} />
             </div>
          </div>
        </div>
      </div>
      
      <div className="w-1/2 p-6 flex flex-col justify-between h-full overflow-y-auto">
        <div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
            <DownloadButton />
          </div>
          <div className="mb-8">
            <div className="flex flex-row">
              <div className="space-y-4 w-2/3">
                <h3 className="text-lg font-bold text-red-900 border-l-4 border-red-800 pl-3 mb-4 uppercase tracking-wider">รายละเอียดวัตถุพยาน</h3>
                <DetailRow label="ประเภท:">{entity.exhibit.subcategory || entity.category}</DetailRow>
                <DetailRow label="กลไก:">{firearm.mechanism}</DetailRow>
                <DetailRow label="ยี่ห้อ:">{firearm.brand}</DetailRow>
                <DetailRow label="ซีรี่ส์:">{firearm.series}</DetailRow>
                <DetailRow label="โมเดล:">{firearm.model}</DetailRow>

                <h3 className="text-lg font-bold text-red-900 border-l-4 border-red-800 pl-3 mb-4 mt-8 uppercase tracking-wider">สถานที่พบ</h3>
                <DetailRow label="จังหวัด:">{entity.province_name}</DetailRow>
                <DetailRow label="อำเภอ:">{entity.district_name}</DetailRow>
                <DetailRow label="ตำบล:">{entity.subdistrict_name}</DetailRow>
                
                <h3 className="text-lg font-bold text-red-900 border-l-4 border-red-800 pl-3 mb-4 mt-8 uppercase tracking-wider">ข้อมูลการค้นพบ</h3>
                <DetailRow label="ผู้ค้นพบ:">{entity.discoverer_name}</DetailRow>
                <DetailRow label="วันที่พบ:">{entity.date}</DetailRow>
                <DetailRow label="เวลาที่พบ:">{entity.time} น.</DetailRow>
              </div>
              <div className="flex flex-col items-center justify-start w-1/3 pt-10">
                <ConfidenceMeter confidencePercent={confidencePercent || 0} size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const MobileLayout = memo(({ entity, onImageClick }) => {
  const firearm = (Array.isArray(entity.exhibit.firearms) ? entity.exhibit.firearms[0] : entity.exhibit.firearm) || {};
  const displayName = entity._determineDisplayName(entity);
  const confidencePercent = entity._confidencePercent(entity)

  return (
    <div className="flex md:hidden flex-col min-h-screen bg-white w-full">
      <div className="p-4 flex justify-center items-center bg-gray-50 border-b border-gray-100">
        <div className="relative" onClick={() => onImageClick(entity.image)}>
          <img src={entity.image} alt={entity.altText} className="max-w-full h-auto object-contain max-h-60 rounded-lg shadow-sm" />
          <div className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm text-gray-600">
             <FiZoomIn size={16} />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 className="text-xl font-bold text-gray-800 leading-tight">{displayName}</h2>
        <DownloadButton />
      </div>

      <div className="px-4 pt-6 pb-24">
        {/* ✅ ปรับใหม่: แบ่งสัดส่วนรายละเอียดกับ Meter ไม่ให้ทับกัน (เลย์เอาต์เดียวกับหน้าประวัติยาเสพติดที่พอใจแล้ว) */}
        <div className="flex flex-row items-start gap-4 mb-8">
          <div className="flex-1 space-y-3">
            <h3 className="text-md font-bold text-red-900 border-l-4 border-red-800 pl-2 mb-3">รายละเอียด</h3>
            <DetailRow label="ประเภท:">{entity.exhibit.subcategory || entity.category}</DetailRow>
            <DetailRow label="กลไก:">{firearm.mechanism}</DetailRow>
            <DetailRow label="ยี่ห้อ:">{firearm.brand}</DetailRow>
            <DetailRow label="โมเดล:">{firearm.model}</DetailRow>
          </div>
          <div className="flex-shrink-0 pt-2">
            <ConfidenceMeter confidencePercent={confidencePercent || 0} size={20} />
          </div>
        </div>

        {/* ส่วนสถานที่พบและข้อมูลการค้นพบแสดงเต็มความกว้างปกติ */}
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-md font-bold text-red-900 border-l-4 border-red-800 pl-2 mb-3">สถานที่พบ</h3>
            <DetailRow label="จังหวัด:">{entity.province_name}</DetailRow>
            <DetailRow label="อำเภอ:">{entity.district_name}</DetailRow>
            <DetailRow label="ตำบล:">{entity.subdistrict_name}</DetailRow>
          </div>

          <div className="space-y-3">
            <h3 className="text-md font-bold text-red-900 border-l-4 border-red-800 pl-2 mb-3">ข้อมูลการค้นพบ</h3>
            <DetailRow label="ผู้ค้นพบ:">{entity.discoverer_name}</DetailRow>
            <DetailRow label="วันที่พบ:">{entity.date}</DetailRow>
            <DetailRow label="เวลาที่พบ:">{entity.time} น.</DetailRow>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const GunHistoryProfile = ({ item: rawItem }) => {
  const { isOpen, currentImage, openImage, closeImage } = useImageViewer();
  
  const entity = useMemo(() => HistoryItemEntity.fromApi(rawItem), [rawItem]);

  return (
    <>
      <div className="bg-white w-full min-h-full flex flex-col relative" id="capture-area">
        <DesktopLayout entity={entity} onImageClick={openImage} />
        <MobileLayout entity={entity} onImageClick={openImage} />
      </div>

      <ImageViewerModal 
        isOpen={isOpen} 
        imageSrc={currentImage} 
        onClose={closeImage} 
      />
    </>
  );
};

GunHistoryProfile.propTypes = { item: PropTypes.object.isRequired };

export default memo(GunHistoryProfile);