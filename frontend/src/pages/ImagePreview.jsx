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
      setFromUpload(Boolean(state.uploadFromCameraPage));
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

    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');

    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), SUBMIT_TIMEOUT_MS);

    try {
      const response = await fetch(`${BASE_URL}/object-classify`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Analysis request failed', response.status, response.statusText);
        navigateToUnknownObject();
        setIsProcessing(false);
        return;
      }

      const result = await response.json();

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

      try {
        const detectionType = result.objects[0]?.detection_type || '';
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

      if (result.detectionType === 'firearm' && Array.isArray(result.detected_objects)) {
        const brands = {};
        const gunClasses = ['BigGun', 'Pistol', 'Revolver'];

        result.detected_objects.forEach(detection => {
          if (gunClasses.includes(detection.class) && Array.isArray(detection.brand_top3)) {
            const limited = detection.brand_top3.slice(0, 3);
            limited.forEach(brand => {
              if (brand.confidence > 0) {
                if (!brands[brand.label]) {
                  brands[brand.label] = { name: brand.label, confidence: brand.confidence, models: [] };
                }
                if (Array.isArray(detection.model_top3) && detection.brand_top3[0]?.label === brand.label) {
                  detection.model_top3.slice(0, 3).forEach(model => {
                    if (model.confidence > 0) {
                      brands[brand.label].models.push({
                        name: model.label,
                        confidence: model.confidence,
                        brandName: brand.label
                      });
                    }
                  });
                }
              }
            });
          }
        });

        const brandArray = Object.values(brands)
          .filter(b => b.models.length > 0)
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3);

        result.brandData = brandArray;

        const flatCandidates = [];
        brandArray.forEach(brand => {
          brand.models.forEach(model => {
            flatCandidates.push({
              label: `${brand.name} ${model.name}`,
              confidence: model.confidence,
              brandName: brand.name,
              modelName: model.name
            });
          });
        });

        flatCandidates.push({
          label: 'อาวุธปืนไม่ทราบชนิด',
          confidence: 0,
          brandName: 'Unknown',
          modelName: 'Unknown',
          isUnknownWeapon: true
        });

        result.candidates = flatCandidates;
      }

      else if (result.detectionType === 'narcotic' && Array.isArray(result.detected_objects)) {
        const drugCandidates = [];
        for (const detection of result.detected_objects) {
          if (detection.class !== 'Drug') continue;

          if (Array.isArray(detection.similar_narcotics) && detection.similar_narcotics.length > 0) {
            detection.similar_narcotics.forEach(n => {
              drugCandidates.push({
                label: n.characteristics || n.name || 'ยาเสพติดไม่ทราบลักษณะ',
                displayName: n.characteristics || n.name || 'ยาเสพติดไม่ทราบลักษณะ',
                confidence: n.similarity || detection.confidence || 0,
                narcotic_id: n.narcotic_id,
                drug_type: n.drug_type || 'ไม่ทราบชนิด',
                drug_category: n.drug_category || 'ไม่ทราบประเภท',
                characteristics: n.characteristics || 'ไม่ทราบอัตลักษณ์',
                similarity: n.similarity || 0,
                source: 'backend_search'
              });
            });
          } else if (detection.vector_base64) {
            drugCandidates.push({
              label: detection.drug_type !== 'Unknown' ? detection.drug_type : 'ยาเสพติดไม่ทราบลักษณะ',
              displayName: detection.drug_type !== 'Unknown' ? detection.drug_type : 'ยาเสพติดไม่ทราบลักษณะ',
              confidence: detection.confidence || 0,
              drug_type: detection.drug_type || 'ไม่ทราบชนิด',
              drug_category: 'ยาเสพติดไม่ทราบประเภท',
              characteristics: detection.drug_type || 'ไม่ทราบอัตลักษณ์',
              vector_base64: detection.vector_base64,
              source: 'ai_detection'
            });
          } else {
            drugCandidates.push({
              label: detection.drug_type !== 'Unknown' ? detection.drug_type : 'ยาเสพติดไม่ทราบลักษณะ',
              displayName: detection.drug_type !== 'Unknown' ? detection.drug_type : 'ยาเสพติดไม่ทราบลักษณะ',
              confidence: detection.confidence || 0,
              drug_type: detection.drug_type || 'ไม่ทราบชนิด',
              drug_category: 'ยาเสพติดไม่ทราบประเภท',
              characteristics: detection.drug_type || 'ไม่ทราบอัตลักษณ์',
              source: 'basic_detection'
            });
          }
        }

        drugCandidates.push({
          label: 'ยาเสพติดประเภทไม่ทราบชนิด',
          displayName: 'ยาเสพติดประเภทไม่ทราบชนิด',
          confidence: 0,
          isUnknownDrug: true,
          characteristics: 'ไม่ทราบอัตลักษณ์',
          exhibit_id: 94,
          drug_type: 'ไม่ทราบชนิด',
          drug_category: 'ไม่ทราบประเภท',
          source: 'manual_option'
        });

        result.drugCandidates = drugCandidates;
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

// ==================== PRESENTATIONAL / PERFORMANCE ====================
const MobilePreview = React.memo(function MobilePreview({
  imageData, resolution, isProcessing, error, fromCamera, handleRetakeOrBack, onSubmit, Tutorial
}) {
  return (
    <div className="bg-slate-100 fixed inset-0 flex flex-col h-screen justify-between" role="main" aria-label="Image preview mobile">
      <div className="relative p-4 flex justify-start items-center bg-white">
        <button
          onClick={handleRetakeOrBack}
          className="p-2 rounded-full hover:bg-gray-800/50 transition-colors"
          aria-label={fromCamera ? 'Retake photo' : 'Go back'}
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <span className="text-black font-normal ml-2">ตรวจสอบภาพ</span>
        {resolution && <span className="ml-auto text-xs text-gray-400">{resolution}</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="absolute left-0 right-0 mx-auto w-full max-w-md px-4">
            <div className="bg-red-500 text-white p-3 rounded-lg text-center">{error}</div>
          </div>
        )}

        <div className="flex flex-col bg-white rounded-lg shadow-lg p-3 m-4 mb-0">
          <span className="text-gray-500 text-xl mb-2">ภาพที่จะทำการวิเคราะห์</span>
          <div className="flex justify-center items-center mb-4 h-auto overflow-y-auto">
            <img src={imageData} alt="Preview" className="border-2 border-dashed border-red-800 px-4 py-3 w-full object-contain rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-lg shadow-lg p-3 m-4 mb-0">
          <span className="text-gray-500 text-xl mb-2">ภาพตัวอย่าง</span>
          <div className="flex justify-center items-center mb-4 h-auto overflow-y-auto">
            <img src={Tutorial.image} alt="Tutorial example" className="border-2 border-gray-300 px-4 py-3 w-full object-contain rounded-lg" />
          </div>
          <span className="ml-auto text-xs text-gray-400">{Tutorial.description}</span>
          <ul className="list-disc text-xs pl-5 mt-2 text-gray-400">
            {Tutorial.bullets.map((b, i) => <li key={i} className="mb-1">{b}</li>)}
          </ul>
        </div>
      </div>

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
          onClick={handleRetakeOrBack}
          disabled={isProcessing}
          className="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-full text-white font-medium flex items-center justify-center space-x-2 transition-colors"
          aria-label={fromCamera ? 'Retake photo' : 'Choose another image'}
        >
          <RotateCcw className="w-5 h-5" />
          <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
        </button>
      </div>
    </div>
  );
});

const DesktopPreview = React.memo(function DesktopPreview({
  imageData, viewMode, mode, fromCamera, resolution, isProcessing, error, onSubmit, handleRetakeOrBack
}) {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col h-screen" role="main" aria-label="Image preview desktop">
      <div className="p-4 flex justify-start items-center bg-black">
        <button onClick={handleRetakeOrBack} className="p-2 rounded-full hover:bg-gray-800/50 transition-colors" aria-label={fromCamera ? 'Retake photo' : 'Go back'}>
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-medium text-xl ml-4">ตรวจสอบภาพ</span>
        {resolution && <span className="ml-auto text-sm text-gray-400">{resolution}</span>}
      </div>

      <div className="flex-1 flex overflow-hidden">
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
              onClick={handleRetakeOrBack}
              disabled={isProcessing}
              className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-colors"
              aria-label={fromCamera ? 'Retake photo' : 'Choose another image'}
            >
              <RotateCcw className="w-5 h-5" />
              <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="absolute bottom-20 left-0 right-0 mx-auto w-full max-w-md">
          <div className="bg-red-500 text-white p-3 rounded-lg text-center">{error}</div>
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
    <MobilePreview {...commonProps} Tutorial={Tutorial} />
  );
};
export default ImagePreview;