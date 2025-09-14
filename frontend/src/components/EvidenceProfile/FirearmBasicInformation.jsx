import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
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

const readAnalysisImage = () => {
  try {
    return localStorage.getItem('analysisImage') || null;
  } catch {
    return null;
  }
};

// ==================== CUSTOM HOOKS ====================
function useFirearmBasicViewModel(analysisResult) {
  const imageUrl = useMemo(() => readAnalysisImage(), []);
  const confidence = useMemo(() => {
    const raw = analysisResult && typeof analysisResult.confidence === 'number' ? analysisResult.confidence : 0;
    return Math.round(raw * 100);
  }, [analysisResult]);

  return { imageUrl, confidence };
}

// ==================== PRESENTATIONAL COMPONENTS ====================
const NoImageDisplay = React.memo(({ message = 'การแสดงผลภาพถ่ายมีปัญหา' }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200 h-64 w-full">
    <PiImageBroken className="text-gray-400 text-5xl mb-2" />
    <p className="text-gray-500 text-center">{message}</p>
  </div>
));
NoImageDisplay.propTypes = { message: PropTypes.string };

const LoadingState = React.memo(() => (
  <div className="flex justify-center items-center p-4" role="status" aria-live="polite">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#990000]" />
    <span className="ml-3 text-gray-600">กำลังค้นหาข้อมูลอาวุธ...</span>
  </div>
));

const ErrorState = React.memo(({ message }) => (
  <div className="p-4 text-red-600 text-sm" role="alert">เกิดข้อผิดพลาดในการค้นหาข้อมูล: {message}</div>
));
ErrorState.propTypes = { message: PropTypes.string.isRequired };

const ConfidenceMeter = React.memo(({ percent }) => {
  const offset = useMemo(() => calculateOffset(percent), [percent]);
  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 relative" aria-hidden="true">
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
ConfidenceMeter.propTypes = { percent: PropTypes.number.isRequired };

const ImageView = React.memo(({ src, alt, maxHeight, onClick }) => {
  if (!src) return <NoImageDisplay />;
  return (
    <img
      src={src}
      alt={alt || 'ภาพหลักฐาน'}
      className={`max-w-full h-auto object-contain cursor-pointer`}
      style={{ maxHeight }}
      onClick={onClick}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
});
ImageView.propTypes = { src: PropTypes.string, alt: PropTypes.string, maxHeight: PropTypes.number, onClick: PropTypes.func };

// ==================== MAIN COMPONENT ====================
const FirearmBasicInformation = ({ evidence, analysisResult, isLoading, apiError }) => {
  const { imageUrl, confidence } = useFirearmBasicViewModel(analysisResult);
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  const handleDownload = useCallback(() => {
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 2000);
  }, []);

  const renderDetails = useCallback(() => {
    if (isLoading) return <LoadingState />;
    if (apiError) return <ErrorState message={String(apiError)} />;
    if (!evidence) {
      return (
        <div className="mt-6">
          <h4 className="font-medium mb-2 text-red-600">ไม่พบข้อมูลในฐานข้อมูล</h4>
          <p className="text-gray-500 text-sm">ไม่สามารถค้นหาข้อมูลอาวุธปืนนี้ จากฐานข้อมูลได้ อาจเป็นเพราะ:</p>
          <ul className="text-gray-500 text-sm list-disc list-inside ml-2 mt-2">
            <li>อาวุธนี้ไม่มีอยู่ในฐานข้อมูล</li>
            <li>ชื่อยี่ห้อหรือรุ่นไม่ตรงกับในฐานข้อมูล</li>
            <li>อาจมีปัญหาในการเชื่อมต่อกับฐานข้อมูล</li>
          </ul>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <div className="py-2 flex"><span className="text-gray-600 w-40">ยี่ห้อ:</span> <span>{evidence.brand}</span></div>
        <div className="py-2 flex"><span className="text-gray-600 w-40">ซีรีส์:</span> <span>{evidence.series || '-'}</span></div>
        <div className="py-2 flex"><span className="text-gray-600 w-40">รุ่น:</span> <span>{evidence.model}</span></div>
        <div className="py-2 flex"><span className="text-gray-600 w-40">กลไก:</span> <span>{evidence.mechanism}</span></div>
        {evidence.exhibit && (
          <>
            <div className="py-2 flex"><span className="text-gray-600 w-40">หมวดหมู่:</span> <span>{evidence.exhibit.category}</span></div>
            <div className="py-2 flex"><span className="text-gray-600 w-40">ประเภทย่อย:</span> <span>{evidence.exhibit.subcategory}</span></div>
          </>
        )}
      </div>
    );
  }, [isLoading, apiError, evidence]);

  const DesktopView = useMemo(() => (
    <div className="hidden md:flex flex-row h-full w-full">
      <div className="w-1/2 p-6 flex justify-center items-center">
        <ImageView src={imageUrl} alt="อาวุธปืน" maxHeight={DEFAULT_IMAGE_MAX_HEIGHT_DESKTOP} onClick={() => setFullScreen(true)} />
      </div>

      <div className="w-1/2 p-6 flex flex-col h-full">
        <div>
          {evidence ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-500">{evidence.brand}</h2>
                <DownloadButton onClick={handleDownload} />
              </div>
              <h2 className="text-3xl font-bold mt-1 tracking-wider uppercase">{[evidence.series, evidence.model].filter(Boolean).join(' ')}</h2>
            </>
          ) : (
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold tracking-wider uppercase">{evidence?.brandName || ''}</h2>
              <DownloadButton onClick={handleDownload} />
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-medium mb-4">รายละเอียด</h3>
            {renderDetails()}
          </div>

          <div className="flex items-start justify-center">
            <ConfidenceMeter percent={confidence} />
          </div>
        </div>

        {!isLoading && !apiError && evidence && evidence.ammunitions && evidence.ammunitions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-600 mb-3">กระสุนที่ใช้ร่วมกัน</h3>
            <div className="flex gap-2 mt-2 flex-wrap">
              {evidence.ammunitions.map((ammo, idx) => (
                <button key={idx} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 text-gray-700">
                  {ammo.caliber}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  ), [imageUrl, evidence, renderDetails, confidence, isLoading, apiError, handleDownload]);

  const MobileView = useMemo(() => (
    <div className="flex md:hidden flex-col h-full px-4">
      <div className="p-4 flex justify-center items-center">
        <ImageView src={imageUrl} alt="อาวุธปืน" maxHeight={DEFAULT_IMAGE_MAX_HEIGHT_MOBILE} onClick={() => setFullScreen(true)} />
      </div>

      {evidence ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-gray-500 font-medium">{evidence.brand}</h2>
            <DownloadButton onClick={handleDownload} />
          </div>
          <h1 className="text-2xl uppercase font-bold mt-1">{evidence.model}</h1>
        </>
      ) : (
        <>{evidence?.brandName && <span>{evidence.brandName}</span>}</>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2">รายละเอียด</h3>
            {isLoading ? <LoadingState /> : apiError ? <ErrorState message={String(apiError)} /> : renderDetails()}
          </div>

          <div className="ml-4 flex-shrink-0">
            <ConfidenceMeter percent={confidence} />
          </div>
        </div>
      </div>

      {!isLoading && !apiError && evidence && evidence.ammunitions && evidence.ammunitions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-3">กระสุนที่ใช้ร่วมกัน</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {evidence.ammunitions.map((ammo, index) => (
              <button key={index} className="px-4 py-2 rounded-full border text-sm bg-white text-black">
                {ammo.caliber}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  ), [imageUrl, evidence, isLoading, apiError, renderDetails, confidence, handleDownload]);

  return (
    <div className="bg-white h-full flex flex-col relative">
      {DesktopView}
      {MobileView}

      {fullScreen && imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50" role="dialog" aria-modal="true">
          <button className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full" onClick={() => setFullScreen(false)} aria-label="Close">
            <IoClose />
          </button>
          <img src={imageUrl} alt="Full Screen" className="max-w-full max-h-[80vh] object-contain mb-4 px-4" />
        </div>
      )}

      {showShareNotification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
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
  apiError: PropTypes.any
};

export default React.memo(FirearmBasicInformation);