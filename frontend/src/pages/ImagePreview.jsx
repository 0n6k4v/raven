import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RotateCcw, ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tutorial } from '../constants/tutorialData';

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const DEFAULT_MAX_SIZE = 1600;
const SUBMIT_TIMEOUT_MS = 180000;

// ==================== UTILS ====================
const resizeImageDataUrl = (dataUrl, maxWidth = DEFAULT_MAX_SIZE, maxHeight = DEFAULT_MAX_SIZE, quality = 0.95) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxWidth && height <= maxHeight) {
        resolve(dataUrl);
        return;
      }
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        const imageType = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        const resized = canvas.toDataURL(imageType, quality);
        resolve(resized);
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });

const dataUrlToBlob = async (dataUrl) => {
  const res = await fetch(dataUrl);
  return res.blob();
};

// ==================== SERVICES ====================
const submitImageService = async ({ blob, signal }) => {
  const formData = new FormData();
  formData.append('image', blob, 'image.jpg');

  const response = await fetch(`${BASE_URL}/object-classify`, {
    method: 'POST',
    body: formData,
    signal
  });

  if (!response.ok) {
    const err = new Error('Network response was not ok');
    err.status = response.status;
    throw err;
  }
  return response.json();
};

// ==================== CUSTOM HOOKS ====================
const useImagePreviewLogic = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [imageData, setImageData] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [mode, setMode] = useState(null);
  const [resolution, setResolution] = useState('');
  const [fromCamera, setFromCamera] = useState(false);
  const [fromUpload, setFromUpload] = useState(false);
  const [viewMode, setViewMode] = useState('contain');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    const state = location.state || {};
    if (state.imageData) {
      setImageData(state.imageData);
      setMode(state.mode || null);
      setResolution(state.resolution || '');
      setFromCamera(Boolean(state.fromCamera));
      setFromUpload(Boolean(state.uploadFromCamera));
      setViewMode(state.viewMode || 'contain');
    } else {
      navigate('/home', { replace: true });
    }
  }, [location.state, navigate]);

  const navigateToCandidateShow = useCallback((result, localImage) => {
    navigate('/candidateShow', {
      state: {
        result,
        image: localImage,
        fromCamera,
        uploadFromCameraPage: location.state?.uploadFromCameraPage || false,
        sourcePath: location.state?.sourcePath ?? -1
      }
    });
  }, [navigate, fromCamera, location.state]);

  const navigateToUnknownObject = useCallback(() => {
    const unknownResult = { isUnknown: true };
    navigate('/candidateShow', {
      state: {
        result: unknownResult,
        image: imageData,
        fromCamera,
        uploadFromCameraPage: location.state?.uploadFromCameraPage || false,
        sourcePath: location.state?.sourcePath ?? -1,
        imageData
      }
    });
  }, [navigate, imageData, fromCamera, location.state]);

  const handleRetake = useCallback(() => navigate('/camera'), [navigate]);
  const handleGoBack = useCallback(() => navigate(-1), [navigate]);
  const handleClose = useCallback(() => navigate('/home'), [navigate]);

  const submitAnalysis = useCallback(async () => {
    if (!imageData) return;
    setIsProcessing(true);
    setError(null);

    let imageToSend = imageData;
    const isLargeImage = imageData.length > 1000000;

    if (isLargeImage) {
      try {
        const resized = await resizeImageDataUrl(imageData, DEFAULT_MAX_SIZE, DEFAULT_MAX_SIZE, 0.95);
        if (resized.length < imageData.length * 0.9) {
          imageToSend = resized;
        } else {
          console.debug('Resize not effective, using original image');
        }
      } catch (resizeErr) {
        console.error('Resize failed', resizeErr);
      }
    }

    let blob;
    try {
      blob = await dataUrlToBlob(imageToSend);
    } catch (blobErr) {
      console.error('Blob creation failed', blobErr);
      navigateToUnknownObject();
      setIsProcessing(false);
      return;
    }

    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), SUBMIT_TIMEOUT_MS);

    try {
      const result = await submitImageService({ blob, signal: abortControllerRef.current.signal });
      clearTimeout(timeoutId);

      // Extract cropped image safely
      try {
        if (Array.isArray(result.objects) && result.objects.length) {
          const drugObj = result.objects.find(o => o.cropped_base64 && String(o.detection_type).toLowerCase() === 'drug');
          const anyCrop = result.objects.find(o => o.cropped_base64);
          const responseCrop = (drugObj && drugObj.cropped_base64) || (anyCrop && anyCrop.cropped_base64) || null;
          if (responseCrop) setCroppedImage(responseCrop);
        }
      } catch (e) {
        console.warn('Failed to extract cropped image from response', e);
      }

      // set cookie for detection type (best-effort)
      try {
        const detectionType = result.objects?.[0]?.detection_type || result.detectionType || '';
        document.cookie = `detectionType=${encodeURIComponent(detectionType)}; path=/; max-age=${60 * 60}`;
      } catch (cookieErr) {
        console.warn('Failed to set detectionType cookie', cookieErr);
      }

      if (!result) {
        console.error('Empty analysis result');
        navigateToUnknownObject();
        setIsProcessing(false);
        return;
      }

      navigateToCandidateShow(result, imageData);
    } catch (err) {
      console.error('Submit failed', err);
      if (err?.name === 'AbortError') {
        console.warn(`Request aborted after ${SUBMIT_TIMEOUT_MS}ms`);
      }
      navigateToUnknownObject();
    } finally {
      setIsProcessing(false);
      clearTimeout();
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  }, [imageData, navigateToCandidateShow, navigateToUnknownObject]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    isDesktop,
    imageData,
    croppedImage,
    mode,
    resolution,
    fromCamera,
    fromUpload,
    viewMode,
    isProcessing,
    error,
    setError,
    handleRetake,
    handleGoBack,
    handleClose,
    submitAnalysis
  };
};

// ==================== PRESENTATIONAL / SMALL COMPONENTS ====================
const ErrorBanner = React.memo(({ error, className = '' }) => {
  if (!error) return null;
  return (
    <div className={className}>
      <div className="bg-red-500 text-white p-3 rounded-lg text-center">{error}</div>
    </div>
  );
});

const MobileHeader = React.memo(({ fromCamera, onBack, resolution }) => (
  <div className="relative p-4 flex justify-start items-center bg-white">
    <button
      onClick={onBack}
      className="p-2 rounded-full hover:bg-gray-800/50 transition-colors"
      aria-label={fromCamera ? 'Retake photo' : 'Go back'}
    >
      <ArrowLeft className="w-6 h-6 text-black" />
    </button>
    <span className="text-black font-normal ml-2">ตรวจสอบภาพ</span>
    {resolution && <span className="ml-auto text-xs text-gray-400">{resolution}</span>}
  </div>
));

const MobileImageBlock = React.memo(({ title, src, alt, tutorial }) => (
  <div className="flex flex-col bg-white rounded-lg shadow-lg p-3 m-4 mb-0">
    <span className="text-gray-500 text-xl mb-2">{title}</span>
    <div className="flex justify-center items-center mb-4 h-auto overflow-y-auto">
      <img src={src} alt={alt} className="border-2 border-dashed border-red-800 px-4 py-3 w-full object-contain rounded-lg" />
    </div>
    {tutorial && (
      <>
        <span className="ml-auto text-xs text-gray-400">{tutorial.description}</span>
        <ul className="list-disc text-xs pl-5 mt-2 text-gray-400">
          {tutorial.bullets.map((b, i) => <li key={i} className="mb-1">{b}</li>)}
        </ul>
      </>
    )}
  </div>
));

const MobileFooter = React.memo(({ isProcessing, onSubmit, onRetake, fromCamera }) => (
  <div className="p-6 bg-gray-900 space-y-4 w-full flex flex-col">
    <button
      onClick={onSubmit}
      disabled={isProcessing}
      className={`w-full py-4 ${isProcessing ? 'bg-gray-500' : 'bg-[#990000] hover:bg-red-800'} rounded-full text-white font-medium flex items-center justify-center space-x-2 transition-colors`}
      aria-busy={isProcessing}
      aria-label="Submit image for analysis"
    >
      <Send className="w-5 h-5" />
      <span>{isProcessing ? 'กำลังวิเคราะห์...' : 'ส่งภาพให้ AI วิเคราะห์'}</span>
    </button>

    <button
      onClick={onRetake}
      disabled={isProcessing}
      className="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-full text-white font-medium flex items-center justify-center space-x-2 transition-colors"
      aria-label={fromCamera ? 'Retake photo' : 'Choose another image'}
    >
      <RotateCcw className="w-5 h-5" />
      <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
    </button>
  </div>
));

const DesktopHeader = React.memo(({ onBack, fromCamera, resolution }) => (
  <div className="p-4 flex justify-start items-center bg-black">
    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800/50 transition-colors" aria-label={fromCamera ? 'Retake photo' : 'Go back'}>
      <ArrowLeft className="w-6 h-6 text-white" />
    </button>
    <span className="text-white font-medium text-xl ml-4">ตรวจสอบภาพ</span>
    {resolution && <span className="ml-auto text-sm text-gray-400">{resolution}</span>}
  </div>
));

const DesktopBody = React.memo(({ imageData, viewMode, mode, fromCamera }) => (
  <div className="w-8/12 bg-black flex items-center justify-center p-4 overflow-hidden">
    <div className="relative h-full w-full flex items-center justify-center">
      <img src={imageData} alt="Preview" className={`max-h-full max-w-full object-${viewMode} border border-gray-800`} />
      {mode && !fromCamera && (
        <div className="absolute top-4 right-4">
          <span className="px-4 py-2 rounded-full bg-black/50 text-white">{mode === 'ยาเสพติด' ? '🔍 ตรวจจับยาเสพติด' : '🔍 ตรวจจับอาวุธปืน'}</span>
        </div>
      )}
    </div>
  </div>
));

const DesktopSidebar = React.memo(({ isProcessing, onSubmit, onRetake, fromCamera }) => (
  <div className="w-4/12 bg-gray-900 p-6 flex flex-col">
    <div className="flex-1" />
    <div className="space-y-4">
      <button
        onClick={onSubmit}
        disabled={isProcessing}
        className={`w-full py-4 ${isProcessing ? 'bg-gray-500' : 'bg-[#990000] hover:bg-red-800'} rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-colors`}
        aria-busy={isProcessing}
        aria-label="Submit image for analysis"
      >
        <Send className="w-5 h-5" />
        <span>{isProcessing ? 'กำลังวิเคราะห์...' : 'ส่งภาพให้ AI วิเคราะห์'}</span>
      </button>

      <button
        onClick={onRetake}
        disabled={isProcessing}
        className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-colors"
        aria-label={fromCamera ? 'Retake photo' : 'Choose another image'}
      >
        <RotateCcw className="w-5 h-5" />
        <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
      </button>
    </div>
  </div>
));

// ==================== COMPOSITE PRESENTATIONALS ====================
const MobilePreview = React.memo(function MobilePreview({
  imageData, resolution, isProcessing, error, fromCamera, handleRetakeOrBack, onSubmit, tutorial
}) {
  return (
    <div className="bg-slate-100 fixed inset-0 flex flex-col h-screen justify-between" role="main" aria-label="Image preview mobile">
      <MobileHeader fromCamera={fromCamera} onBack={handleRetakeOrBack} resolution={resolution} />

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="absolute left-0 right-0 mx-auto w-full max-w-md px-4">
            <ErrorBanner error={error} />
          </div>
        )}

        <MobileImageBlock title="ภาพที่จะทำการวิเคราะห์" src={imageData} alt="Preview" />
        <div className="mt-2" />
        <MobileImageBlock title="ภาพตัวอย่าง" src={tutorial.image} alt="Tutorial example" tutorial={tutorial} />
      </div>

      <MobileFooter isProcessing={isProcessing} onSubmit={onSubmit} onRetake={handleRetakeOrBack} fromCamera={fromCamera} />
    </div>
  );
});

const DesktopPreview = React.memo(function DesktopPreview({
  imageData, viewMode, mode, fromCamera, resolution, isProcessing, error, onSubmit, handleRetakeOrBack
}) {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col h-screen" role="main" aria-label="Image preview desktop">
      <DesktopHeader onBack={handleRetakeOrBack} fromCamera={fromCamera} resolution={resolution} />

      <div className="flex-1 flex overflow-hidden">
        <DesktopBody imageData={imageData} viewMode={viewMode} mode={mode} fromCamera={fromCamera} />
        <DesktopSidebar isProcessing={isProcessing} onSubmit={onSubmit} onRetake={handleRetakeOrBack} fromCamera={fromCamera} />
      </div>

      {error && (
        <div className="absolute bottom-20 left-0 right-0 mx-auto w-full max-w-md">
          <ErrorBanner error={error} />
        </div>
      )}
    </div>
  );
});

// ==================== MAIN COMPONENT ====================
const ImagePreview = () => {
  const {
    isDesktop,
    imageData,
    mode,
    resolution,
    fromCamera,
    viewMode,
    isProcessing,
    error,
    setError,
    handleRetake,
    handleGoBack,
    handleClose,
    submitAnalysis
  } = useImagePreviewLogic();

  const handleRetakeOrBack = useCallback(() => {
    if (fromCamera) handleRetake();
    else handleGoBack();
  }, [fromCamera, handleRetake, handleGoBack]);

  const commonProps = useMemo(() => ({
    imageData,
    resolution,
    isProcessing,
    error,
    fromCamera,
    handleRetakeOrBack,
    onSubmit: submitAnalysis,
    mode,
    viewMode
  }), [imageData, resolution, isProcessing, error, fromCamera, handleRetakeOrBack, submitAnalysis, mode, viewMode]);

  if (!imageData) return null;

  return isDesktop ? (
    <DesktopPreview {...commonProps} />
  ) : (
    <MobilePreview {...commonProps} tutorial={Tutorial} />
  );
};
export default ImagePreview;