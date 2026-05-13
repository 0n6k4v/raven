import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { RotateCcw, ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tutorial } from '../../../constants/tutorialData';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const CONFIG = {
  BASE_URL: `${import.meta.env.VITE_API_URL}/api`,
  MAX_IMAGE_SIZE: 1600,
  SUBMIT_TIMEOUT_MS: 180000,
};

class ImageProcessor {
  static resize(dataUrl, maxWidth = CONFIG.MAX_IMAGE_SIZE, maxHeight = CONFIG.MAX_IMAGE_SIZE, quality = 0.95) {
    return new Promise((resolve, reject) => {
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
  }

  static async toBlob(dataUrl) {
    return (await fetch(dataUrl)).blob();
  }
}

class AnalysisService {
  static async submitImage(blob, signal) {
    const formData = new FormData();
    formData.append("image", blob, "image.jpg");

    const res = await fetch(`${CONFIG.BASE_URL}/object-classify`, {
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
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useImageState = (location) => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    imageData: null,
    mode: null,
    resolution: '',
    fromCamera: false,
    fromUpload: false,
    viewMode: 'contain',
    sourcePath: -1
  });

  useEffect(() => {
    const locState = location.state || {};
    if (!locState.imageData) {
      navigate('/home', { replace: true });
      return;
    }
    setState({
      imageData: locState.imageData,
      mode: locState.mode || null,
      resolution: locState.resolution || '',
      fromCamera: !!locState.fromCamera,
      fromUpload: !!locState.fromUpload,
      viewMode: locState.viewMode || 'contain',
      sourcePath: locState.sourcePath ?? -1
    });
  }, [location.state, navigate]);

  return state;
};

const useAnalysisSubmission = (imageState) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ isProcessing: false, error: null });
  const abortControllerRef = useRef(null);

  const navigateToResult = useCallback((result, originalImage) => {
    navigate('/candidateShow', {
      state: {
        result,
        image: originalImage,
        fromCamera: imageState.fromCamera,
        fromUpload: imageState.fromUpload,
        sourcePath: imageState.sourcePath,
      },
    });
  }, [navigate, imageState]);

  const submitAnalysis = useCallback(async () => {
    if (!imageState.imageData) return;

    setStatus({ isProcessing: true, error: null });
    let processedImage = imageState.imageData;

    try {
      if (imageState.imageData.length > 1_000_000) {
        processedImage = await ImageProcessor.resize(imageState.imageData);
      }
      
      const blob = await ImageProcessor.toBlob(processedImage);
      
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), CONFIG.SUBMIT_TIMEOUT_MS);

      const res = await AnalysisService.submitImage(blob, abortControllerRef.current.signal);
      clearTimeout(timeoutId);

      const detectionType = res.objects?.[0]?.detection_type || res.detectionType || '';
      document.cookie = `detectionType=${encodeURIComponent(detectionType)}; path=/; max-age=${3600}`;

      navigateToResult(res, imageState.imageData);

    } catch (err) {
      console.error("Submission failed:", err);
      navigateToResult({ isUnknown: true }, imageState.imageData);
    } finally {
      setStatus({ isProcessing: false, error: null });
      abortControllerRef.current = null;
    }
  }, [imageState, navigateToResult]);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  return { ...status, submitAnalysis };
};

const useResponsiveLayout = () => {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 1024 : true);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const ErrorBanner = memo(({ error }) => {
  if (!error) return null;
  return <div className="bg-red-500 text-white p-3 rounded-lg text-center shadow-lg">{error}</div>;
});

const MobileHeader = memo(({ onBack, resolution }) => (
  <div className="relative p-4 flex items-center bg-white shadow-sm z-10">
    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
      <ArrowLeft className="w-6 h-6 text-black" />
    </button>
    <span className="ml-2 text-black font-medium">ตรวจสอบภาพ</span>
    {resolution && <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{resolution}</span>}
  </div>
));

const MobileImageCard = memo(({ title, src, alt, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 m-4 mb-0">
    <h3 className="text-gray-700 text-lg font-medium mb-3">{title}</h3>
    <div className="flex justify-center mb-4 bg-gray-50 rounded-lg p-2">
      <img src={src} alt={alt} className="max-h-[300px] w-full object-contain rounded" />
    </div>
    {children}
  </div>
));

const MobileLayout = memo(({ imageData, resolution, isProcessing, error, handleRetake, onSubmit, fromCamera }) => (
  <div className="bg-slate-50 fixed inset-0 flex flex-col">
    <MobileHeader onBack={handleRetake} resolution={resolution} />
    
    <div className="flex-1 overflow-y-auto pb-4">
      {error && <div className="m-4"><ErrorBanner error={error} /></div>}
      <MobileImageCard title="ภาพที่จะทำการวิเคราะห์" src={imageData} alt="Preview" />
      <MobileImageCard title="ภาพตัวอย่างที่ถูกต้อง" src={Tutorial.image} alt="Tutorial">
        <div className="mt-2 border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-600 mb-2">{Tutorial.description}</p>
          <ul className="list-disc pl-5 space-y-1">
            {Tutorial.bullets.map((b, i) => <li key={i} className="text-xs text-gray-500">{b}</li>)}
          </ul>
        </div>
      </MobileImageCard>
    </div>

    <div className="p-4 bg-white border-t border-gray-200 space-y-3">
      <button 
        onClick={onSubmit} 
        disabled={isProcessing} 
        className={`w-full py-4 rounded-full text-white font-medium flex items-center justify-center space-x-2 transition-colors ${isProcessing ? 'bg-gray-500' : 'bg-[#990000] hover:bg-red-800'}`}
      >
        <Send className="w-5 h-5" />
        <span>{isProcessing ? 'กำลังวิเคราะห์...' : 'ส่งภาพให้ AI วิเคราะห์'}</span>
      </button>
      <button 
        onClick={handleRetake} 
        disabled={isProcessing} 
        className="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-full text-white font-medium flex items-center justify-center space-x-2 transition-colors"
      >
        <RotateCcw className="w-5 h-5" />
        <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
      </button>
    </div>
  </div>
));

// --- Desktop Components ---

const DesktopLayout = memo(({ imageData, resolution, isProcessing, error, handleRetake, onSubmit, viewMode, fromCamera }) => (
  <div className="fixed inset-0 bg-gray-900 flex flex-col">
    <div className="p-4 flex items-center bg-black">
      <button onClick={handleRetake} className="p-2 rounded-full hover:bg-gray-800/50 transition-colors">
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>
      <span className="ml-4 text-white text-xl">ตรวจสอบภาพ</span>
      {resolution && <span className="ml-auto text-sm text-gray-400">{resolution}</span>}
    </div>

    <div className="flex-1 flex overflow-hidden">
      <div className="w-8/12 bg-black flex items-center justify-center p-4 relative">
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
            className={`w-full py-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-colors ${
              isProcessing ? 'bg-gray-500' : 'bg-[#990000] hover:bg-red-800'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>{isProcessing ? 'กำลังวิเคราะห์...' : 'ส่งภาพให้ AI วิเคราะห์'}</span>
          </button>

          <button
            onClick={handleRetake}
            disabled={isProcessing}
            className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex items-center justify-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
          </button>
        </div>
      </div>
    </div>

    {error && (
      <div className="absolute bottom-20 left-0 right-0 mx-auto w-max max-w-md px-4">
        <ErrorBanner error={error} />
      </div>
    )}
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const ImagePreviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const imageState = useImageState(location);
  const isDesktop = useResponsiveLayout();

  const { isProcessing, error, submitAnalysis } = useAnalysisSubmission(imageState);

  const handleRetakeOrBack = useCallback(() => {
    if (imageState.fromCamera) return navigate('/camera');
    return navigate(-1);
  }, [imageState.fromCamera, navigate]);

  if (!imageState.imageData) return null;

  const layoutProps = {
    imageData: imageState.imageData,
    resolution: imageState.resolution,
    fromCamera: imageState.fromCamera,
    viewMode: imageState.viewMode,
    isProcessing,
    error,
    onSubmit: submitAnalysis,
    handleRetake: handleRetakeOrBack,
  };

  return isDesktop 
    ? <DesktopLayout {...layoutProps} />
    : <MobileLayout {...layoutProps} />;
};

export default ImagePreviewPage;