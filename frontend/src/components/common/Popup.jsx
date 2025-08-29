import React, { useEffect, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { FiX } from "react-icons/fi";

/* ========================= CONSTANTS ========================= */
const DEFAULT_COUNTDOWN = 5;

/* ========================= UTILS ========================= */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/* ========================= CUSTOM HOOKS ========================= */
const useAutoCountdown = (initial, isActive, onFinish) => {
  const [count, setCount] = useState(() => clamp(Number(initial) || 0, 0, 9999));
  useEffect(() => {
    setCount(clamp(Number(initial) || 0, 0, 9999));
  }, [initial]);

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

  return [count, setCount];
};

/* ========================= PRESENTATIONAL / MAIN COMPONENT ========================= */
const Popup = ({ open, type, message, countdown, onClose }) => {
  const closeBtnRef = useRef(null);

  const [countdownLeft] = useAutoCountdown(countdown ?? DEFAULT_COUNTDOWN, open && (countdown ?? DEFAULT_COUNTDOWN) > 0, () => {
    try { onClose?.(); } catch (_) {}
  });

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = type === 'success';
  const colorClass = isSuccess ? 'text-green-600' : 'text-red-600';
  const icon = isSuccess
    ? (<svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>)
    : (<svg className="w-8 h-8 text-red-600 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div className="bg-white rounded-lg shadow-lg flex flex-col items-center justify-center w-80 h-64 relative p-4">
        <button
          ref={closeBtnRef}
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#b30000] rounded"
          aria-label="ปิด"
        >
          <FiX size={22} />
        </button>

        {icon}
        <div id="popup-title" className={`font-semibold text-lg mb-4 mt-2 text-center ${colorClass}`} aria-live="polite">
          {message}
        </div>

        <div className="mt-4 text-gray-500 text-sm" aria-hidden={false}>
          ปิดอัตโนมัติใน {String(countdownLeft ?? 0)} วินาที
        </div>
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
  countdown: DEFAULT_COUNTDOWN,
  onClose: () => {},
};

export default Popup;