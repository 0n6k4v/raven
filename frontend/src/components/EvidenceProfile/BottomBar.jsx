import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ==================== CONSTANTS ====================
const SAVE_ROUTE = '/evidenceProfile/save-to-record';

// ==================== UTILS ====================
const resolveSourcePath = (propSource, locationState) =>
  propSource ?? locationState?.sourcePath;

// ==================== CUSTOM HOOK ====================
function useBottomBarLogic({ evidence, analysisResult, imageUrl, fromCamera, sourcePath }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isFromCamera = Boolean(fromCamera || location.state?.fromCamera);
  const uploadFromCameraPage = Boolean(location.state?.uploadFromCameraPage);
  const resolvedSource = resolveSourcePath(sourcePath, location.state);

  const getButtonText = useMemo(() => {
    if (isFromCamera) return 'ถ่ายใหม่';
    if (uploadFromCameraPage) return 'เลือกรูปใหม่';
    return 'เลือกรูปใหม่';
  }, [isFromCamera, uploadFromCameraPage]);

  const handleRetakeOrGoBack = useCallback(() => {
    if (uploadFromCameraPage || isFromCamera) {
      navigate('/camera');
      return;
    }

    if (resolvedSource !== undefined && resolvedSource !== null) {
      navigate(resolvedSource);
      return;
    }

    navigate(-1);
  }, [navigate, uploadFromCameraPage, isFromCamera, resolvedSource]);

  const handleSave = useCallback(() => {
    if (!evidence) return;

    navigate(SAVE_ROUTE, {
      state: {
        evidence,
        analysisResult,
        imageUrl,
        fromEvidence: true,
        fromCamera: isFromCamera,
        uploadFromCameraPage,
        sourcePath: resolvedSource
      }
    });
  }, [navigate, evidence, analysisResult, imageUrl, isFromCamera, uploadFromCameraPage, resolvedSource]);

  return {
    getButtonText,
    handleRetakeOrGoBack,
    handleSave
  };
}

// ==================== PRESENTATIONAL COMPONENTS ====================
const ActionButton = React.memo(function ActionButton({ onClick, children, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="
        px-7 py-1.5 border border-t-2 border-r-2 border-l-2 border-b-4 
        border-[#6B0000] rounded-lg text-[#900B09]
        focus:outline-none focus:ring-2 focus:ring-[#990000]/30
      "
    >
      {children}
    </button>
  );
});

const PrimaryButton = React.memo(function PrimaryButton({ onClick, children, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="
        px-4 py-1.5 border-[#6B0000] border-b-4 
        bg-[#990000] rounded-lg text-white
        focus:outline-none focus:ring-2 focus:ring-black/20
      "
    >
      {children}
    </button>
  );
});

// ==================== MAIN COMPONENT ====================
const BottomBar = ({ analysisResult, evidence, imageUrl, fromCamera, sourcePath }) => {
  const { getButtonText, handleRetakeOrGoBack, handleSave } =
    useBottomBarLogic({ analysisResult, evidence, imageUrl, fromCamera, sourcePath });

  return (
    <div
      className="
        w-full py-4 px-4 flex justify-between 
        border-t border-gray-200 
        sm:justify-end sm:space-x-4
      "
      role="toolbar"
      aria-label="Evidence actions"
    >
      <ActionButton onClick={handleRetakeOrGoBack} ariaLabel="Retake or choose another image">
        {getButtonText}
      </ActionButton>

      <PrimaryButton onClick={handleSave} ariaLabel="Save evidence record">
        บันทึกประวัติ
      </PrimaryButton>
    </div>
  );
};

export default BottomBar;