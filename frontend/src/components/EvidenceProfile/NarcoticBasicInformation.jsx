import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';
import { PiImageBroken } from 'react-icons/pi';
import DownloadButton from '../common/DownloadButton';

// ==================== CONSTANTS ====================
const DEFAULT_IMAGE_MAX_HEIGHT_DESKTOP = 384;
const DEFAULT_IMAGE_MAX_HEIGHT_MOBILE = 240;

// ==================== UTILS ====================
const calculateOffset = (percent) => {
  const circumference = 2 * Math.PI * 45;
  return circumference - (circumference * (percent / 100));
};

const safeGetLocalImage = () => {
  try {
    return localStorage.getItem('analysisImage') || '';
  } catch {
    return '';
  }
};

const ensureArray = (v) => (Array.isArray(v) ? v : (v ? [v] : []));

// ==================== CUSTOM HOOKS ====================
function useNarcoticViewModel({ analysisResult, evidence }) {
  const imageUrl = useMemo(() => safeGetLocalImage(), []);
  const confidence = useMemo(() => {
    const c = analysisResult && typeof analysisResult.confidence === 'number' ? analysisResult.confidence : null;
    return c === null ? null : Math.round(c * 100);
  }, [analysisResult]);

  const drugData = useMemo(() => {
    if (!evidence) return null;
    return {
      id: evidence.id || '',
      category: evidence.drug_category || 'ไม่ระบุหมวดหมู่',
      images: ensureArray(evidence.example_images).map(i => i.image_url || i.url).filter(Boolean),
      form: evidence.drug_form?.name || 'ไม่ระบุรูปแบบ',
      characteristics: evidence.characteristics || 'ไม่ระบุลักษณะ',
      consumption_method: evidence.consumption_method || 'ไม่ระบุกวิธีการใช้',
      effect: evidence.effect || 'ไม่ระบุผลต่อร่างกาย',
      weight_grams: evidence.weight_grams || 'ไม่ระบุน้ำหนัก',
      color: evidence.pill_info?.color || 'ไม่ระบุสี',
      diameter_mm: evidence.pill_info?.diameter_mm || 'ไม่ระบุเส้นผ่านศูนย์กลาง',
      thickness_mm: evidence.pill_info?.thickness_mm || 'ไม่ระบุความหนา',
      edge_shape: evidence.pill_info?.edge_shape || 'ไม่ระบุรูปทรงขอบ',
      confidence: analysisResult?.confidence ?? null,
      raw: evidence
    };
  }, [evidence, analysisResult]);

  return { imageUrl, confidence, drugData };
}

// ==================== PRESENTATIONAL COMPONENTS ====================
const NoImageDisplay = React.memo(function NoImageDisplay({ message = 'การแสดงผลภาพถ่ายมีปัญหา' }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-300 h-64 w-full">
      <PiImageBroken className="text-gray-400 text-5xl mb-2" />
      <p className="text-gray-600 text-center">{message}</p>
    </div>
  );
});
NoImageDisplay.propTypes = { message: PropTypes.string };

const LoadingState = React.memo(function LoadingState() {
  return (
    <div className="flex justify-center items-center p-4" role="status" aria-live="polite">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#990000]" />
      <span className="ml-3 text-gray-700">กำลังค้นหาข้อมูลยาเสพติด...</span>
    </div>
  );
});

const ErrorState = React.memo(function ErrorState({ message }) {
  return <div className="p-4 text-red-600 text-sm" role="alert">เกิดข้อผิดพลาดในการค้นหาข้อมูล: {message}</div>;
});
ErrorState.propTypes = { message: PropTypes.string.isRequired };

const ConfidenceMeter = React.memo(function ConfidenceMeter({ percent = 0 }) {
  const offset = calculateOffset(percent);
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <div className="w-24 h-24 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#8B0000" strokeWidth="8"
            strokeDasharray={2 * Math.PI * 45} strokeDashoffset={offset} transform="rotate(-90 50 50)" />
          <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill="#8B0000">
            {percent}%
          </text>
        </svg>
      </div>
      <div className="mt-2"><p className="text-gray-600">ความมั่นใจ</p></div>
    </div>
  );
});
ConfidenceMeter.propTypes = { percent: PropTypes.number };

const ImageView = React.memo(function ImageView({ src, alt, maxHeight, onClick }) {
  const handleKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(); } };
  if (!src) return <NoImageDisplay />;
  return (
    <img
      src={src}
      alt={alt || 'ภาพหลักฐาน'}
      className="max-w-full h-auto object-contain cursor-pointer"
      style={{ maxHeight }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="เปิดภาพขนาดเต็ม"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
});
ImageView.propTypes = { src: PropTypes.string, alt: PropTypes.string, maxHeight: PropTypes.number, onClick: PropTypes.func };

// ==================== MAIN COMPONENT ====================
const NarcoticBasicInformation = ({ analysisResult, evidence, fromCamera, sourcePath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [catalogData] = useState(null);
  const [loading] = useState(false);
  // store the URL of the image to show full-screen (null = closed)
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const { imageUrl, confidence, drugData } = useNarcoticViewModel({ analysisResult, evidence });

  const handleOpenFull = useCallback((src) => { if (src) setFullScreenImage(src); }, []);
  const handleCloseFull = useCallback(() => setFullScreenImage(null), []);

  // close on Escape
  useEffect(() => {
    if (!fullScreenImage) return;
    const onKey = (e) => { if (e.key === 'Escape') setFullScreenImage(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullScreenImage]);

  const handleDownload = useCallback(() => {
  }, []);

  const RenderDetails = () => {
    if (!drugData) return <div className="p-4 text-gray-500">ไม่พบข้อมูล</div>;

    return (
      <div className="pt-2">
        {/* Top block (no outer divider, just padded content) */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <span className="text-gray-700 font-medium">รูปแบบ:</span>
            <span className="text-gray-600 col-span-2">{drugData.form}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-3">
            <span className="text-gray-700 font-medium">ลักษณะ:</span>
            <span className="text-gray-600 col-span-2">{drugData.characteristics}</span>
          </div>
        </div>

        {/* Divider remains full-width, inner content padded */}
        <div className="mt-4 border-t border-gray-300">
          <div className="pt-3 p-4 space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-700 font-medium">สี:</span>
              <span className="text-gray-600 col-span-2">{drugData.color}</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-700 font-medium">เส้นผ่านศูนย์กลาง:</span>
              <span className="text-gray-600 col-span-2">{drugData.diameter_mm} มม.</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-700 font-medium">ความหนา:</span>
              <span className="text-gray-600 col-span-2">{drugData.thickness_mm} มม.</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-700 font-medium">รูปทรงขอบ:</span>
              <span className="text-gray-600 col-span-2">{drugData.edge_shape}</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-700 font-medium">น้ำหนัก:</span>
              <span className="text-gray-600 col-span-2">{drugData.weight_grams} กรัม</span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-300">
          <div className="pt-3 p-4">
            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-700 font-medium">วิธีการใช้:</span>
              <span className="text-gray-600 col-span-2">{drugData.consumption_method}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-300">
          <div className="pt-3 p-4">
            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-700 font-medium">ผลต่อร่างกาย:</span>
              <span className="text-gray-600 col-span-2">{drugData.effect}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white h-full flex flex-col relative">
      {/* Desktop */}
      <div className="hidden md:flex flex-col relative md:flex-row items-center p-6 bg-white h-full">
        <div className="w-1/2 p-6 flex justify-center items-center">
          <ImageView
            src={imageUrl || (drugData?.images?.[0])}
            alt="ยาเสพติด"
            maxHeight={DEFAULT_IMAGE_MAX_HEIGHT_DESKTOP}
            onClick={() => handleOpenFull(imageUrl || (drugData?.images?.[0]))}
          />
        </div>

        <div className="w-1/2 p-6 flex flex-col h-full scrollbar-hide">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">{drugData?.category || 'ยาเสพติด'}</h2>
              <DownloadButton onClick={handleDownload} aria-label="ดาวน์โหลดภาพ" />
            </div>
            <h1 className="text-3xl uppercase font-bold text-gray-900 mt-3 break-words leading-tight max-w-[60%]">
              {drugData?.characteristics || 'ไม่ทราบลักษณะ'}
            </h1>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <div className="flex flex-row">
              <div className="space-y-4 w-1/2">
                <RenderDetails />
              </div>

              <div className="flex flex-col items-center justify-start w-1/2">
                <ConfidenceMeter percent={confidence ?? 0} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden flex-col h-full px-4">
        <div className="p-4 flex justify-center items-center">
          <ImageView
            src={imageUrl || (drugData?.images?.[0])}
            alt="ยาเสพติด"
            maxHeight={DEFAULT_IMAGE_MAX_HEIGHT_MOBILE}
            onClick={() => handleOpenFull(imageUrl || (drugData?.images?.[0]))}
          />
        </div>

        <div className="flex items-center justify-between px-4">
          <h2 className="text-gray-700 font-medium">{drugData?.category || 'ยาเสพติด'}</h2>
          <DownloadButton onClick={handleDownload} aria-label="ดาวน์โหลดภาพ" />
        </div>

        <h1 className="text-2xl uppercase font-bold text-gray-900 mt-1 px-4">{drugData?.characteristics}</h1>

        <div className="pt-4 border-t border-gray-300">
          <div className="flex items-start">
            <div className="flex-1">
              <RenderDetails />
            </div>

            <div className="ml-4 flex-shrink-0">
              <ConfidenceMeter percent={confidence ?? 0} />
            </div>
          </div>
        </div>
      </div>

      {/* Full screen modal */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseFull(); }}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full"
            onClick={handleCloseFull}
            aria-label="ปิด"
          >
            <IoClose />
          </button>
          <img src={fullScreenImage} alt="Full Screen" className="max-w-full max-h-[90vh] object-contain mb-4 px-4" />
        </div>
      )}
    </div>
  );
};

NarcoticBasicInformation.propTypes = {
  analysisResult: PropTypes.object,
  evidence: PropTypes.object,
  fromCamera: PropTypes.bool,
  sourcePath: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
};

export default NarcoticBasicInformation;