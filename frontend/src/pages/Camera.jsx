import React, { useState, useRef, useEffect, useCallback, useTransition, memo } from 'react';
import { X, Image as ImageIcon, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/common/Loading';

/* CONSTANTS */
const CAMERA_CONSTRAINTS = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 4096 },
    height: { ideal: 3072 },
    frameRate: { ideal: 30 },
    advanced: [
      {
        focusMode: 'continuous',
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous',
      },
    ],
  },
};

/* UTILS */
function getCameraConstraints(facingMode) {
  return {
    ...CAMERA_CONSTRAINTS,
    video: {
      ...CAMERA_CONSTRAINTS.video,
      facingMode: { ideal: facingMode },
    },
  };
}

/* CUSTOM HOOKS */
function useCamera(facingMode) {
  const [stream, setStream] = useState(null);
  const [currentResolution, setCurrentResolution] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    stopStream();

    try {
      const constraints = getCameraConstraints(facingMode);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const [videoTrack] = mediaStream.getVideoTracks();
      if (videoTrack) {
        const initialSettings = videoTrack.getSettings();
        setCurrentResolution(`${initialSettings.width}x${initialSettings.height}`);

        const capabilities = videoTrack.getCapabilities?.() || {};
        const settings = {};

        if (capabilities.width?.max) settings.width = capabilities.width.max;
        if (capabilities.height?.max) settings.height = capabilities.height.max;
        if (capabilities.focusMode?.includes('continuous')) settings.focusMode = 'continuous';
        if (capabilities.sharpness) settings.sharpness = capabilities.sharpness.max;

        try {
          await videoTrack.applyConstraints(settings);
          const actualSettings = videoTrack.getSettings();
          setCurrentResolution(`${actualSettings.width}x${actualSettings.height}`);
        } catch {
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('ไม่สามารถเข้าถึงกล้องได้ โปรดใช้การอัพโหลดภาพแทน');
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    startCamera();
    return stopStream;
  }, [facingMode]);

  useEffect(() => stopStream, []);

  return {
    stream,
    currentResolution,
    isInitializing,
    videoRef,
    canvasRef,
    stopStream,
  };
}

/* PRESENTATIONAL COMPONENTS */
const CameraTopBar = memo(function CameraTopBar({ onClose, resolution }) {
  return (
    <>
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-800/50"
          type="button"
          aria-label="ปิดกล้อง"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="text-xs text-white bg-black/50 px-2 py-1 rounded">
          {resolution || 'กำลังโหลด...'}
        </div>
      </div>
    </>
  );
});

const CameraControls = memo(function CameraControls({
  onGallery,
  onCapture,
  onSwitch,
  isCaptureDisabled,
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/80 pb-6 pt-4 z-30">
      <div className="flex justify-around items-center px-4">
        <button
          onClick={onGallery}
          className="p-2"
          type="button"
          aria-label="เลือกจากแกลเลอรี่"
        >
          <ImageIcon className="w-8 h-8 text-white" />
        </button>
        <button
          onClick={onCapture}
          className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center"
          type="button"
          aria-label="ถ่ายภาพ"
          disabled={isCaptureDisabled}
        />
        <button
          onClick={onSwitch}
          className="p-2"
          type="button"
          aria-label="สลับกล้อง"
        >
          <RotateCw className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
});

const CameraVideo = memo(function CameraVideo({ videoRef, canvasRef }) {
  return (
    <div className="relative h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
        muted
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});

/* MAIN COMPONENT */
const CameraPage = () => {
  const navigate = useNavigate();
  const [facingMode, setFacingMode] = useState('environment');
  const [, startTransition] = useTransition();

  const {
    currentResolution,
    isInitializing,
    videoRef,
    canvasRef,
    stopStream,
  } = useCamera(facingMode);

  const handleClose = useCallback(() => {
    stopStream();
    navigate('/home');
  }, [navigate, stopStream]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  const captureImage = useCallback(() => {
    if (isInitializing) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d', { alpha: false });
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    const resolution = `${canvas.width}x${canvas.height}`;

    startTransition(() => {
      navigate('/imagePreview', {
        state: {
          imageData,
          resolution,
          fromCamera: true,
          sourcePath: '/camera',
          viewMode: 'cover',
        },
      });
    });
  }, [isInitializing, navigate, startTransition, videoRef, canvasRef]);

  const selectFromGallery = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          startTransition(() => {
            navigate('/imagePreview', {
              state: {
                imageData: event.target.result,
                fromCamera: false,
                uploadFromCameraPage: true,
                sourcePath: '/camera',
              },
            });
          });
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  }, [navigate, startTransition]);

  return (
    <div className="relative h-screen w-full bg-black">
      {isInitializing && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
          <Loading />
        </div>
      )}

      <CameraTopBar onClose={handleClose} resolution={currentResolution} />
      <CameraVideo videoRef={videoRef} canvasRef={canvasRef} />
      <CameraControls
        onGallery={selectFromGallery}
        onCapture={captureImage}
        onSwitch={switchCamera}
        isCaptureDisabled={isInitializing}
      />
    </div>
  );
};

export default CameraPage;
