import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class ErrorMessageVO {
  constructor(message) {
    this.content = message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง';
  }

  get value() {
    return this.content;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useErrorHandlers = (onRetry) => {
  const handleRetry = useCallback((e) => {
    e?.preventDefault?.();
    if (typeof onRetry !== 'function') return;
    
    try {
      onRetry();
    } catch (error) {
      console.error("[ErrorDisplay] Retry failed:", error);
    }
  }, [onRetry]);

  return { handleRetry };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const ErrorText = memo(({ children }) => (
  <p className="max-w-lg">{children}</p>
));

const RetryButton = memo(({ onClick }) => (
  <button
    onClick={onClick}
    className="mt-4 px-4 py-2 bg-[#b30000] text-white rounded hover:bg-[#990000] focus:outline-none focus:ring-2 focus:ring-[#b30000] focus:ring-offset-2 transition-colors"
    type="button"
    aria-label="ลองใหม่"
  >
    ลองใหม่
  </button>
));

const ErrorContainer = memo(({ children }) => (
  <div
    className="flex flex-col justify-center items-center min-h-[65vh] text-center text-red-500 md:py-10 px-4"
    role="status"
    aria-live="polite"
  >
    {children}
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const ErrorDisplay = ({ message, onRetry }) => {
  const errorVO = useMemo(() => new ErrorMessageVO(message), [message]);

  const { handleRetry } = useErrorHandlers(onRetry);

  return (
    <ErrorContainer>
      <ErrorText>{errorVO.value}</ErrorText>
      <RetryButton onClick={handleRetry} />
    </ErrorContainer>
  );
};

ErrorDisplay.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onRetry: PropTypes.func,
};

ErrorDisplay.defaultProps = {
  message: '',
  onRetry: () => {},
};

export default memo(ErrorDisplay);