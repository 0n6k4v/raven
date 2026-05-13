import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class SaveEvidencePayload {
  constructor({ evidence, analysisResult, imageUrl, isFromCamera, uploadFromCameraPage, sourcePath }) {
    this.evidence = evidence;
    this.analysisResult = analysisResult;
    this.imageUrl = imageUrl;
    this.isFromCamera = isFromCamera;
    this.uploadFromCameraPage = uploadFromCameraPage;
    this.sourcePath = sourcePath;
  }

  toNavigationState() {
    return {
      evidence: this.evidence,
      analysisResult: this.analysisResult,
      imageUrl: this.imageUrl,
      fromEvidence: true,
      fromCamera: this.isFromCamera,
      uploadFromCameraPage: this.uploadFromCameraPage,
      sourcePath: this.sourcePath
    };
  }
}

class EvidenceNavigationService {
  static SAVE_ROUTE = '/evidenceProfile/save-to-record';
  static CAMERA_ROUTE = '/camera';

  static getRetakeButtonLabel(isFromCamera, uploadFromCameraPage) {
    if (isFromCamera) return 'ถ่ายใหม่';
    return 'เลือกรูปใหม่';
  }

  static resolveBackPath(isFromCamera, uploadFromCameraPage, resolvedSource) {
    if (uploadFromCameraPage || isFromCamera) {
      return this.CAMERA_ROUTE;
    }
    return resolvedSource ?? -1;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useBottomBar({ evidence, analysisResult, imageUrl, fromCamera, sourcePath }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isFromCamera = useMemo(() => 
    Boolean(fromCamera || location.state?.fromCamera), 
    [fromCamera, location.state]
  );
  
  const uploadFromCameraPage = useMemo(() => 
    Boolean(location.state?.uploadFromCameraPage), 
    [location.state]
  );

  const resolvedSource = useMemo(() => 
    sourcePath ?? location.state?.sourcePath, 
    [sourcePath, location.state]
  );

  const buttonText = useMemo(() => 
    EvidenceNavigationService.getRetakeButtonLabel(isFromCamera, uploadFromCameraPage),
    [isFromCamera, uploadFromCameraPage]
  );

  const handleRetakeOrGoBack = useCallback(() => {
    const destination = EvidenceNavigationService.resolveBackPath(
      isFromCamera, 
      uploadFromCameraPage, 
      resolvedSource
    );
    
    if (destination === -1) {
      navigate(-1);
    } else {
      navigate(destination);
    }
  }, [navigate, isFromCamera, uploadFromCameraPage, resolvedSource]);

  const handleSave = useCallback(() => {
    if (!evidence) return;

    const payload = new SaveEvidencePayload({
      evidence,
      analysisResult,
      imageUrl,
      isFromCamera,
      uploadFromCameraPage,
      sourcePath: resolvedSource
    });

    navigate(EvidenceNavigationService.SAVE_ROUTE, {
      state: payload.toNavigationState()
    });
  }, [navigate, evidence, analysisResult, imageUrl, isFromCamera, uploadFromCameraPage, resolvedSource]);

  return {
    buttonText,
    handleRetakeOrGoBack,
    handleSave
  };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

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

const BarContainer = React.memo(function BarContainer({ children }) {
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
      {children}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const BottomBar = ({ analysisResult, evidence, imageUrl, fromCamera, sourcePath }) => {
  const { buttonText, handleRetakeOrGoBack, handleSave } =
    useBottomBar({ analysisResult, evidence, imageUrl, fromCamera, sourcePath });

  return (
    <BarContainer>
      <ActionButton 
        onClick={handleRetakeOrGoBack} 
        ariaLabel="Retake or choose another image"
      >
        {buttonText}
      </ActionButton>

      <PrimaryButton 
        onClick={handleSave} 
        ariaLabel="Save evidence record"
      >
        บันทึกประวัติ
      </PrimaryButton>
    </BarContainer>
  );
};

export default BottomBar;