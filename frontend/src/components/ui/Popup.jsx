import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiX } from "react-icons/fi";

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const POPUP_CONSTANTS = {
  DEFAULT_COUNTDOWN: 5,
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  }
};

class PopupMathService {
  static clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
}

class PopupEntity {
  constructor(type, message) {
    this.type = type;
    this.message = message;
  }

  get isSuccess() {
    return this.type === POPUP_CONSTANTS.TYPES.SUCCESS;
  }

  get colorClass() {
    return this.isSuccess ? 'text-green-600' : 'text-red-600';
  }

  get iconTemplate() {
    if (this.isSuccess) {
      return (
        <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-red-600 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const usePopupTimer = (initialCountdown, isActive, onFinish) => {
  const [count, setCount] = useState(() => 
    PopupMathService.clamp(Number(initialCountdown) || 0, 0, 9999)
  );

  useEffect(() => {
    setCount(PopupMathService.clamp(Number(initialCountdown) || 0, 0, 9999));
  }, [initialCountdown]);

  useEffect(() => {
    if (!isActive || count <= 0) return undefined;
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          try { onFinish?.(); } catch (_) {}
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, count, onFinish]);

  return count;
};

const usePopupInteraction = (isOpen, onClose, closeBtnRef) => {
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen, closeBtnRef]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { 
      if (e.key === 'Escape') {
        try { onClose?.(); } catch (_) {}
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
};

// ============================================================================
// PRESENTATION LAYER - UI Components (Atomic Design)
// ============================================================================

const CloseButton = memo(React.forwardRef(({ onClick }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#b30000] rounded"
    aria-label="ปิด"
  >
    <FiX size={22} />
  </button>
)));

const CountdownDisplay = memo(({ timeLeft }) => (
  <div className="mt-4 text-gray-500 text-sm" aria-hidden={false}>
    ปิดอัตโนมัติใน {String(timeLeft ?? 0)} วินาที
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const Popup = ({ open, type, message, countdown, onClose }) => {
  const closeBtnRef = useRef(null);

  const entity = useMemo(() => new PopupEntity(type, message), [type, message]);
  const initialTime = countdown ?? POPUP_CONSTANTS.DEFAULT_COUNTDOWN;

  const countdownLeft = usePopupTimer(
    initialTime, 
    open && initialTime > 0, 
    onClose
  );

  usePopupInteraction(open, onClose, closeBtnRef);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div className="bg-white rounded-lg shadow-lg flex flex-col items-center justify-center w-80 h-64 relative p-4">
        <CloseButton ref={closeBtnRef} onClick={onClose} />

        {entity.iconTemplate}

        <div 
          id="popup-title" 
          className={`font-semibold text-lg mb-4 mt-2 text-center ${entity.colorClass}`} 
          aria-live="polite"
        >
          {entity.message}
        </div>

        <CountdownDisplay timeLeft={countdownLeft} />
      </div>
    </div>
  );
};

Popup.propTypes = {
  open: PropTypes.bool,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  message: PropTypes.node,
  countdown: PropTypes.number,
  onClose: PropTypes.func,
};

Popup.defaultProps = {
  open: false,
  type: 'info',
  message: '',
  countdown: POPUP_CONSTANTS.DEFAULT_COUNTDOWN,
  onClose: () => {},
};

export default memo(Popup);