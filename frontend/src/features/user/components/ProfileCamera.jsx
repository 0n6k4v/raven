import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X } from 'lucide-react';
import Loading from '../../../components/ui/Loading';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic & Services
// ============================================================================

const CAMERA_CONFIG = {
  constraints: {
    video: {
      facingMode: { ideal: 'user' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
  },
  imageFormat: 'image/jpeg',
  imageQuality: 0.95
};

class CameraService {
  static async getStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API not supported');
    }
    return navigator.mediaDevices.getUserMedia(CAMERA_CONFIG.constraints);
  }

  static stopStream(stream) {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  static captureImage(videoElement) {
    if (!videoElement) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return null;

    context.drawImage(videoElement, 0, 0);
    return canvas.toDataURL(CAMERA_CONFIG.imageFormat, CAMERA_CONFIG.imageQuality);
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useCameraStream = () => {
  const [stream, setStream] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef(null);

  const stop = useCallback(() => {
    if (stream) {
      CameraService.stopStream(stream);
      setStream(null);
    }
  }, [stream]);

  const start = useCallback(async () => {
    setIsInitializing(true);
    try {
      const mediaStream = await CameraService.getStream();
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('[Camera] Access error:', err);
      alert('Unable to access the camera. Please use an upload option instead.');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    start();
    return () => {};
  }, [start]);

  useEffect(() => {
      return () => {
          if (videoRef.current && videoRef.current.srcObject) {
              CameraService.stopStream(videoRef.current.srcObject);
          }
      };
  }, []);

  return { videoRef, stream, isInitializing, stop };
};

const useCameraCapture = (videoRef, isInitializing, onCapture, onClose, stopStream) => {
  const takePhoto = useCallback(() => {
    if (isInitializing || !videoRef.current) return;
    
    const imageData = CameraService.captureImage(videoRef.current);
    if (imageData && typeof onCapture === 'function') {
      onCapture(imageData);
    }
    
    stopStream();
    if (typeof onClose === 'function') onClose();
  }, [isInitializing, videoRef, onCapture, onClose, stopStream]);

  const closeCamera = useCallback(() => {
    stopStream();
    if (typeof onClose === 'function') onClose();
  }, [stopStream, onClose]);

  return { takePhoto, closeCamera };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const CameraView = memo(({ videoRef, isInitializing }) => (
  <>
    {isInitializing && (
      <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
        <Loading />
      </div>
    )}
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="h-full w-full object-cover"
      muted
    />
  </>
));

const CameraControls = memo(({ onCapture, onClose }) => (
  <>
    <div className="absolute top-4 left-4 z-30">
      <button
        onClick={onClose}
        className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        type="button"
        aria-label="Close camera"
      >
        <X className="w-6 h-6 text-white" />
      </button>
    </div>
    <div className="absolute bottom-0 left-0 right-0 bg-black/80 pb-6 pt-4 z-30">
      <div className="flex justify-center">
        <button
          onClick={onCapture}
          className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center"
          type="button"
          aria-label="Capture image"
        />
      </div>
    </div>
  </>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const ProfileCamera = ({ onCapture, onClose }) => {
  const { videoRef, isInitializing, stop } = useCameraStream();
  const { takePhoto, closeCamera } = useCameraCapture(videoRef, isInitializing, onCapture, onClose, stop);

  return (
    <div className="fixed inset-0 z-50">
      <div className="relative h-screen w-full bg-black">
        <CameraView videoRef={videoRef} isInitializing={isInitializing} />
        <CameraControls onCapture={takePhoto} onClose={closeCamera} />
      </div>
    </div>
  );
};

export default ProfileCamera;