import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';

const ErrorDisplay = ({ message, onRetry }) => {
  const handleRetry = useCallback((e) => {
    e?.preventDefault?.();
    try { onRetry?.(); } catch (_) {}
  }, [onRetry]);

  return (
    <div
      className="flex flex-col justify-center items-center min-h-[65vh] text-center text-red-500 md:py-10 px-4"
      role="status"
      aria-live="polite"
    >
      <p className="max-w-lg">{message}</p>
      <button
        onClick={handleRetry}
        className="mt-4 px-4 py-2 bg-[#b30000] text-white rounded hover:bg-[#990000] focus:outline-none focus:ring-2 focus:ring-[#b30000] focus:ring-offset-2"
        type="button"
        aria-label="ลองใหม่"
      >
        ลองใหม่
      </button>
    </div>
  );
};

ErrorDisplay.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onRetry: PropTypes.func,
};

ErrorDisplay.defaultProps = {
  message: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
  onRetry: () => {},
};

export default memo(ErrorDisplay);