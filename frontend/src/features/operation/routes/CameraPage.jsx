import React, { useState, useRef, useEffect, useCallback, useTransition, memo } from 'react';
import { X, Image as ImageIcon, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../../components/ui/Loading';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const CAMERA_CONFIG = {
  VIDEO_CONSTRAINTS: {
    width: { ideal: 4096 },
    height: { ideal: 3072 },
    frameRate: { ideal: 30 },
    advanced: [
      { focusMode: 'continuous', exposureMode: 'continuous', whiteBalanceMode: 'continuous' },
    ],
  },
  IMAGE_QUALITY: 0.95,
  IMAGE_TYPE: 'image/jpeg',
};

class CameraService {
  static getConstraints(facingMode) {
    return {
      video: {
        ...CAMERA_CONFIG.VIDEO_CONSTRAINTS,
        facingMode: { ideal: facingMode },
      },
    };
  }

  static async startStream(facingMode) {
    const constraints = this.getConstraints(facingMode);
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  static stopStream(stream) {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  static captureImage(videoElement, canvasElement) {
    if (!videoElement || !canvasElement) return null;

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    
    const context = canvasElement.getContext('2d', { alpha: false });
    context.drawImage(videoElement, 0, 0);

    return {
      imageData: canvasElement.toDataURL(CAMERA_CONFIG.IMAGE_TYPE, CAMERA_CONFIG.IMAGE_QUALITY),
      resolution: `${canvasElement.width}x${canvasElement.height}`
    };
  }
}

class FileService {
  static openGallery(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => callback(event.target.result);
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useCameraStream = (facingMode) => {
  const [stream, setStream] = useState(null);
  const [resolution, setResolution] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const cleanup = useCallback(() => {
    CameraService.stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }, []);

  const initialize = useCallback(async () => {
    setIsInitializing(true);
    cleanup();

    try {
      const mediaStream = await CameraService.startStream(facingMode);
      setStream(mediaStream);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const [videoTrack] = mediaStream.getVideoTracks();
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        setResolution(`${settings.width}x${settings.height}`);
        
        try {
          await videoTrack.applyConstraints({ 
             advanced: [{ focusMode: 'continuous' }] 
          }); 
        } catch (e) {}
      }
    } catch (err) {
      console.error('Camera Error:', err);
      alert('ไม่สามารถเข้าถึงกล้องได้ โปรดใช้การอัพโหลดภาพแทน');
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, cleanup]);

  useEffect(() => {
    initialize();
    return cleanup;
  }, [facingMode, initialize, cleanup]);

  return {
    stream,
    resolution,
    isInitializing,
    videoRef,
    stopCamera: cleanup
  };
};

const useCameraNavigation = () => {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const navigateToPreview = useCallback((payload) => {
    startTransition(() => {
      navigate('/imagePreview', { state: payload });
    });
  }, [navigate]);

  const closeCamera = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  return { navigateToPreview, closeCamera, isPending };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const CameraHeader = memo(({ onClose, resolution }) => (
  <>
    <div className="absolute top-4 left-4 z-30">
      <button
        onClick={onClose}
        className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        type="button"
        aria-label="ปิดกล้อง"
      >
        <X className="w-6 h-6 text-white" />
      </button>
    </div>
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
      <div className="text-xs text-white bg-black/50 px-2 py-1 rounded font-mono">
        {resolution || 'Initializing...'}
      </div>
    </div>
  </>
));

const CameraFooter = memo(({ onGallery, onCapture, onSwitch, disabled }) => (
  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pb-8 pt-12 z-30">
    <div className="flex justify-around items-center px-8 max-w-md mx-auto">
      <button onClick={onGallery} className="p-3 rounded-full hover:bg-white/10 transition-colors" type="button" aria-label="แกลเลอรี่">
        <ImageIcon className="w-8 h-8 text-white" />
      </button>
      
      <button
        onClick={onCapture}
        disabled={disabled}
        className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
        aria-label="ถ่ายภาพ"
      >
        <div className="w-16 h-16 rounded-full bg-white" />
      </button>
      
      <button onClick={onSwitch} className="p-3 rounded-full hover:bg-white/10 transition-colors" type="button" aria-label="สลับกล้อง">
        <RotateCw className="w-8 h-8 text-white" />
      </button>
    </div>
  </div>
));

const VideoViewport = memo(({ videoRef }) => (
  <div className="relative h-full w-full bg-black">
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="h-full w-full object-cover"
      muted
    />
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const CameraPage = () => {
  const [facingMode, setFacingMode] = useState('environment');
  const canvasRef = useRef(null);

  const { resolution, isInitializing, videoRef, stopCamera } = useCameraStream(facingMode);
  const { navigateToPreview, closeCamera } = useCameraNavigation();

  const handleSwitchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    closeCamera();
  }, [stopCamera, closeCamera]);

  const handleCapture = useCallback(() => {
    if (isInitializing) return;
    
    const result = CameraService.captureImage(videoRef.current, canvasRef.current);
    if (result) {
      navigateToPreview({
        imageData: result.imageData,
        resolution: result.resolution,
        fromCamera: true,
        sourcePath: '/camera',
        viewMode: 'cover',
      });
    }
  }, [isInitializing, videoRef, navigateToPreview]);

  const handleGallerySelect = useCallback(() => {
    FileService.openGallery((imageData) => {
      navigateToPreview({
        imageData,
        fromCamera: false,
        uploadFromCameraPage: true,
        sourcePath: '/camera',
      });
    });
  }, [navigateToPreview]);

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {isInitializing && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center">
          <Loading />
        </div>
      )}

      <CameraHeader onClose={handleClose} resolution={resolution} />
      
      <VideoViewport videoRef={videoRef} />

      <canvas ref={canvasRef} className="hidden" />

      <CameraFooter 
        onGallery={handleGallerySelect}
        onCapture={handleCapture}
        onSwitch={handleSwitchCamera}
        disabled={isInitializing}
      />
    </div>
  );
};

export default CameraPage;