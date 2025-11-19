import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react';

import { RotateCcw, ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tutorial } from '../constants/tutorialData';

// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const DEFAULT_MAX_SIZE = 1600;
const SUBMIT_TIMEOUT_MS = 180000;

// ============================================================
// UTIL FUNCTIONS
// ============================================================
const resizeImageDataUrl = (dataUrl, maxWidth = DEFAULT_MAX_SIZE, maxHeight = DEFAULT_MAX_SIZE, quality = 0.95) =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      const shouldResize = width > maxWidth || height > maxHeight;
      if (!shouldResize) return resolve(dataUrl);

      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context not available"));

      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const type = dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";
      resolve(canvas.toDataURL(type, quality));
    };

    img.onerror = reject;
    img.src = dataUrl;
  });

const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob();

// ============================================================
// SERVICE LAYER
// ============================================================
const submitImageService = async ({ blob, signal }) => {
  const formData = new FormData();
  formData.append("image", blob, "image.jpg");

  const res = await fetch(`${BASE_URL}/object-classify`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!res.ok) {
    const err = new Error("Network response was not ok");
    err.status = res.status;
    throw err;
  }

  return res.json();
};

// ============================================================
// CUSTOM HOOK
// ============================================================
const useImagePreviewLogic = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
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
    if (!state.imageData) {
      navigate('/home', { replace: true });
      return;
    }

    setImageData(state.imageData);
    setMode(state.mode || null);
    setResolution(state.resolution || '');
    setFromCamera(!!state.fromCamera);
    setFromUpload(!!state.fromUpload);
    setViewMode(state.viewMode || 'contain');
  }, [location.state, navigate]);

  const navigateToCandidateShow = useCallback(
    (result, originalImage) => {
      navigate('/candidateShow', {
        state: {
          result,
          image: originalImage,
          fromCamera,
          fromUpload,
          sourcePath: location.state?.sourcePath ?? -1,
        },
      });
    },
    [navigate, fromCamera, fromUpload, location.state]
  );

  const navigateToUnknownObject = useCallback(() => {
    navigate('/candidateShow', {
      state: {
        result: { isUnknown: true },
        image: imageData,
        fromCamera,
        fromUpload,
        sourcePath: location.state?.sourcePath ?? -1,
      },
    });
  }, [navigate, imageData, fromCamera, fromUpload, location.state]);

  const handleRetake = useCallback(() => navigate('/camera'), [navigate]);
  const handleGoBack = useCallback(() => navigate(-1), [navigate]);

  const submitAnalysis = useCallback(async () => {
    if (!imageData) return;

    setIsProcessing(true);
    setError(null);

    let processedImage = imageData;

    try {
      if (imageData.length > 1_000_000) {
        processedImage = await resizeImageDataUrl(imageData);
      }
    } catch (e) {
      console.warn("Resize failed", e);
    }

    let blob;
    try {
      blob = await dataUrlToBlob(processedImage);
    } catch (e) {
      console.error("Blob creation failed", e);
      navigateToUnknownObject();
      setIsProcessing(false);
      return;
    }

    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, SUBMIT_TIMEOUT_MS);

    try {
      const res = await submitImageService({
        blob,
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      try {
        const detectionType = res.objects?.[0]?.detection_type || res.detectionType || '';
        document.cookie = `detectionType=${encodeURIComponent(detectionType)}; path=/; max-age=${60 * 60}`;
      } catch (cookieErr) {
        console.warn('Failed to set detectionType cookie', cookieErr);
      }

      try {
        if (Array.isArray(res.objects) && res.objects.length) {
          const drugObj = res.objects.find(o => o.cropped_base64 && String(o.detection_type).toLowerCase() === 'drug');
          const anyCrop = res.objects.find(o => o.cropped_base64);
          const responseCrop = (drugObj && drugObj.cropped_base64) || (anyCrop && anyCrop.cropped_base64) || null;
          if (responseCrop) setCroppedImage(responseCrop);
        }
      } catch (e) {
        console.warn('Failed to extract cropped image from response', e);
      }

      navigateToCandidateShow(res, imageData);

    } catch (err) {
      console.error(err);
      navigateToUnknownObject();
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [imageData, navigateToUnknownObject, navigateToCandidateShow]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
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
    submitAnalysis,
  };
};

// ============================================================
// UI COMPONENTS
// ============================================================
const ErrorBanner = React.memo(({ error }) => {
  if (!error) return null;
  return (
    <div className="bg-red-500 text-white p-3 rounded-lg text-center">
      {error}
    </div>
  );
});

// -------- Mobile Components --------
const MobileHeader = React.memo(({ fromCamera, onBack, resolution }) => (
  <div className="relative p-4 flex items-center bg-white">
    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200">
      <ArrowLeft className="w-6 h-6 text-black" />
    </button>
    <span className="ml-2 text-black">ตรวจสอบภาพ</span>
    {resolution && <span className="ml-auto text-xs text-gray-400">{resolution}</span>}
  </div>
));

const MobileImageBlock = React.memo(({ title, src, alt, tutorial }) => (
  <div className="bg-white rounded-lg shadow-lg p-3 m-4 mb-0">
    <span className="text-gray-500 text-xl mb-2">{title}</span>
    <div className="flex justify-center mb-4">
      <img src={src} alt={alt} className="border-2 border-dashed border-red-800 px-4 py-3 w-full object-contain rounded-lg" />
    </div>

    {tutorial && (
      <>
        <span className="ml-auto text-xs text-gray-400">{tutorial.description}</span>
        <ul className="list-disc text-xs pl-5 mt-2 text-gray-400">
          {tutorial.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </>
    )}
  </div>
));

const MobileFooter = React.memo(({ isProcessing, onSubmit, onRetake, fromCamera }) => (
  <div className="p-6 bg-gray-900 space-y-4">
    <button
      onClick={onSubmit}
      disabled={isProcessing}
      className={`w-full py-4 rounded-full text-white font-medium flex items-center justify-center space-x-2 transition-colors ${
        isProcessing ? 'bg-gray-500' : 'bg-[#990000] hover:bg-red-800'
      }`}
    >
      <Send className="w-5 h-5" />
      <span>{isProcessing ? 'กำลังวิเคราะห์...' : 'ส่งภาพให้ AI วิเคราะห์'}</span>
    </button>

    <button
      onClick={onRetake}
      disabled={isProcessing}
      className="w-full py-4 bg-gray-800 rounded-full text-white flex items-center justify-center space-x-2"
    >
      <RotateCcw className="w-5 h-5" />
      <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
    </button>
  </div>
));

const MobilePreview = React.memo(
  ({ imageData, resolution, isProcessing, error, fromCamera, handleRetakeOrBack, onSubmit, tutorial }) => (
    <div className="bg-slate-100 fixed inset-0 flex flex-col">
      <MobileHeader fromCamera={fromCamera} onBack={handleRetakeOrBack} resolution={resolution} />

      <div className="flex-1 overflow-y-auto">
        {error && <ErrorBanner error={error} />}
        <MobileImageBlock title="ภาพที่จะทำการวิเคราะห์" src={imageData} alt="Preview" />
        <MobileImageBlock title="ภาพตัวอย่าง" src={tutorial.image} alt="Tutorial" tutorial={tutorial} />
      </div>

      <MobileFooter
        isProcessing={isProcessing}
        onSubmit={onSubmit}
        onRetake={handleRetakeOrBack}
        fromCamera={fromCamera}
      />
    </div>
  )
);

// -------- Desktop Components --------
const DesktopPreview = React.memo(
  ({ imageData, viewMode, mode, fromCamera, resolution, isProcessing, error, onSubmit, handleRetakeOrBack }) => (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* HEADER */}
      <div className="p-4 flex items-center bg-black">
        <button onClick={handleRetakeOrBack} className="p-2 rounded-full hover:bg-gray-800/50">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <span className="ml-4 text-white text-xl">ตรวจสอบภาพ</span>
        {resolution && <span className="ml-auto text-sm text-gray-400">{resolution}</span>}
      </div>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-8/12 bg-black flex items-center justify-center p-4">
          <img
            src={imageData}
            alt="Preview"
            className={`max-h-full max-w-full object-${viewMode} border border-gray-800`}
          />
        </div>

        <div className="w-4/12 bg-gray-900 p-6 flex flex-col">
          <div className="flex-1" />
          <div className="space-y-4">
            <button
              onClick={onSubmit}
              disabled={isProcessing}
              className={`w-full py-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2 ${
                isProcessing ? 'bg-gray-500' : 'bg-[#990000] hover:bg-red-800'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>{isProcessing ? 'กำลังวิเคราะห์...' : 'ส่งภาพให้ AI วิเคราะห์'}</span>
            </button>

            <button
              onClick={handleRetakeOrBack}
              disabled={isProcessing}
              className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="absolute bottom-20 left-0 right-0 mx-auto"><ErrorBanner error={error} /></div>}
    </div>
  )
);

// ============================================================
// MAIN COMPONENT
// ============================================================

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
    submitAnalysis,
  } = useImagePreviewLogic();

  const handleRetakeOrBack = useCallback(() => {
    if (fromCamera) return handleRetake();
    return handleGoBack();
  }, [fromCamera, handleRetake, handleGoBack]);

  const commonProps = useMemo(
    () => ({
      imageData,
      resolution,
      isProcessing,
      error,
      fromCamera,
      handleRetakeOrBack,
      onSubmit: submitAnalysis,
      mode,
      viewMode,
    }),
    [
      imageData,
      resolution,
      isProcessing,
      error,
      fromCamera,
      handleRetakeOrBack,
      submitAnalysis,
      mode,
      viewMode,
    ]
  );

  if (!imageData) return null;

  return isDesktop ? (
    <DesktopPreview {...commonProps} />
  ) : (
    <MobilePreview {...commonProps} tutorial={Tutorial} />
  );
};

export default ImagePreview;