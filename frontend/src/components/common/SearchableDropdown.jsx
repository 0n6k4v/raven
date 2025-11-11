import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

/* ========================= CONSTANTS ========================= */
const MAX_POPUP_HEIGHT = 240;
const POPUP_Z_INDEX = 9999;

/* ========================= UTILS ========================= */
const getLabelForValue = (options = [], value) => {
  if (!value) return '';
  const found = options.find(o => o.value === value);
  return found ? String(found.label) : String(value);
};

const filterOptions = (options = [], q = '') => {
  const term = (q || '').trim().toLowerCase();
  if (!term) return options;
  return options.filter(opt => String(opt.label || '').toLowerCase().includes(term));
};

/* ========================= CUSTOM HOOKS ========================= */
function useDropdownPosition() {
  const inputRef = useRef(null);
  const popupRef = useRef(null);
  const containerRef = useRef(null);
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0 });
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (!open || !inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setRect({
      top: r.bottom + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      const c = containerRef.current;
      if (!c) return;
      if (!c.contains(e.target) && !(popupRef.current && popupRef.current.contains(e.target))) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return {
    inputRef,
    popupRef,
    containerRef,
    rect,
    open,
    setOpen
  };
}

/* ========================= PRESENTATIONAL SUBCOMPONENTS ========================= */
const OptionItem = React.memo(function OptionItem({ opt, selected, highlighted, onSelect, onHover }) {
  const keyId = opt.id ?? opt.value;
  return (
    <div
      key={keyId}
      className={`px-4 py-2 cursor-pointer ${selected ? 'bg-blue-50 text-blue-700' : ''} ${highlighted ? 'bg-gray-100' : ''}`}
      onMouseDown={(ev) => { ev.preventDefault(); onSelect(opt); }}
      onMouseEnter={onHover}
      role="option"
      aria-selected={selected}
    >
      {opt.label}
    </div>
  );
});

function OptionList({ options, value, highlightedIndex, onSelect, setHighlightedIndex, popupRef, maxHeight }) {
  useEffect(() => {
    if (highlightedIndex < 0 || !popupRef.current) return;
    const node = popupRef.current.children[highlightedIndex];
    if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, popupRef]);

  return (
    <div
      ref={popupRef}
      style={{ maxHeight: maxHeight, overflowY: 'auto' }}
      className="bg-white border border-gray-300 rounded-md shadow-lg"
      role="listbox"
      aria-label="options"
    >
      {options.length === 0 ? (
        <div className="px-4 py-2 text-gray-500">ไม่พบผลการค้นหา</div>
      ) : options.map((opt, idx) => (
        <OptionItem
          key={opt.id ?? opt.value ?? idx}
          opt={opt}
          selected={value === opt.value}
          highlighted={idx === highlightedIndex}
          onSelect={onSelect}
          onHover={() => setHighlightedIndex(idx)}
        />
      ))}
    </div>
  );
}

/* ========================= MAIN COMPONENT ========================= */
const SearchableDropdown = ({ options = [], value = '', onChange, placeholder = '', disabled = false }) => {
  const { inputRef, popupRef, containerRef, rect, open, setOpen } = useDropdownPosition();

  const [query, setQuery] = useState(() => getLabelForValue(options, value));
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => setQuery(getLabelForValue(options, value)), [options, value]);

  const filtered = useMemo(() => filterOptions(options, query), [options, query]);

  const selectOption = useCallback((opt) => {
    onChange?.({ target: { value: opt.value } });
    setQuery(opt.label);
    setOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onChange, setOpen, inputRef]);

  const clearSelection = useCallback((e) => {
    e?.stopPropagation();
    if (disabled) return;
    onChange?.({ target: { value: '' } });
    setQuery('');
    setOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onChange, disabled, setOpen, inputRef]);

  const onInputChange = useCallback((e) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
    setHighlightedIndex(-1);
  }, [open, setOpen]);

  const onToggle = useCallback((e) => {
    e?.stopPropagation();
    if (disabled) return;
    setOpen(prev => !prev);
    if (!open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled, open, setOpen, inputRef]);

  const onKeyDown = useCallback((e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      if (open && highlightedIndex >= 0 && filtered[highlightedIndex]) {
        e.preventDefault();
        selectOption(filtered[highlightedIndex]);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setHighlightedIndex(-1);
      return;
    }
  }, [disabled, open, highlightedIndex, filtered, selectOption, setOpen]);

  const popupNode = useMemo(() => {
    if (!open || disabled) return null;
    const popupStyle = {
      position: 'absolute',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: POPUP_Z_INDEX
    };
    return createPortal(
      <div style={popupStyle}>
        <OptionList
          options={filtered}
          value={value}
          highlightedIndex={highlightedIndex}
          onSelect={selectOption}
          setHighlightedIndex={setHighlightedIndex}
          popupRef={popupRef}
          maxHeight={MAX_POPUP_HEIGHT}
        />
      </div>,
      document.body
    );
  }, [open, disabled, rect, filtered, value, highlightedIndex, selectOption, popupRef]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={query}
          onChange={onInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
        />

        <div
          className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer"
          onClick={value ? clearSelection : onToggle}
        >
          {value ? (
            <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          )}
        </div>
      </div>

      {popupNode}
    </div>
  );
};

export default React.memo(SearchableDropdown);