import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import Loading from '../../../common/Loading';

/* CONSTANTS */
const CAMERA_CONSTRAINTS = {
  video: {
    facingMode: { ideal: 'user' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
};

/* CUSTOM HOOKS */
function useProfileCamera() {
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
      const mediaStream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access the camera. Please use an upload option instead.');
    } finally {
      setIsInitializing(false);
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  return {
    stream,
    isInitializing,
    videoRef,
    canvasRef,
    stopStream,
  };
}

/* MAIN COMPONENT */
const ProfileCamera = ({ onCapture, onClose }) => {
  const { isInitializing, videoRef, canvasRef, stopStream } = useProfileCamera();

  const captureImage = useCallback(() => {
    if (isInitializing) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    if (typeof onCapture === 'function') onCapture(imageData);
    stopStream();
    if (typeof onClose === 'function') onClose();
  }, [isInitializing, videoRef, canvasRef, onCapture, onClose, stopStream]);

  const handleClose = useCallback(() => {
    stopStream();
    if (typeof onClose === 'function') onClose();
  }, [stopStream, onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="relative h-screen w-full bg-black">
        {isInitializing && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
            <Loading />
          </div>
        )}
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-gray-800/50"
            type="button"
            aria-label="Close camera"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 pb-6 pt-4 z-30">
          <div className="flex justify-center">
            <button
              onClick={captureImage}
              className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center"
              type="button"
              aria-label="Capture image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCamera;