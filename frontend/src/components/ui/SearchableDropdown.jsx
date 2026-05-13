import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class DropdownOptionEntity {
  static getLabel(options, value) {
    if (!value) return '';
    const found = options.find(o => o.value === value);
    return found ? String(found.label) : String(value);
  }

  static filter(options, query) {
    const term = (query || '').trim().toLowerCase();
    if (!term) return options;
    return options.filter(opt => 
      String(opt.label || '').toLowerCase().includes(term)
    );
  }
}

class DropdownPayload {
  static toApiEvent(value) {
    return { target: { value } };
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useDropdownPortal(open) {
  const inputRef = useRef(null);
  const popupRef = useRef(null);
  const containerRef = useRef(null);
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0 });

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
      if (containerRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return { inputRef, popupRef, containerRef, rect };
}

function useSearchableDropdownLogic(options, value, onChange, open, setOpen) {
  const [query, setQuery] = useState(() => DropdownOptionEntity.getLabel(options, value));
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filtered = useMemo(() => DropdownOptionEntity.filter(options, query), [options, query]);

  useEffect(() => {
    setQuery(DropdownOptionEntity.getLabel(options, value));
  }, [options, value]);

  const selectOption = useCallback((opt) => {
    onChange?.(DropdownPayload.toApiEvent(opt.value));
    setQuery(opt.label);
    setOpen(false);
    setHighlightedIndex(-1);
  }, [onChange, setOpen]);

  const clearSelection = useCallback(() => {
    onChange?.(DropdownPayload.toApiEvent(''));
    setQuery('');
    setOpen(false);
    setHighlightedIndex(-1);
  }, [onChange, setOpen]);

  return { query, setQuery, filtered, highlightedIndex, setHighlightedIndex, selectOption, clearSelection };
}

// ============================================================================
// PRESENTATION LAYER - UI Components (Atomic Design)
// ============================================================================

const SearchableOptionItem = React.memo(({ opt, isSelected, isHighlighted, onSelect, onHover }) => (
  <div
    className={`px-4 py-2 cursor-pointer ${isSelected ? 'bg-blue-50 text-blue-700' : ''} ${isHighlighted ? 'bg-gray-100' : ''}`}
    onMouseDown={(ev) => { ev.preventDefault(); onSelect(opt); }}
    onMouseEnter={onHover}
    role="option"
    aria-selected={isSelected}
  >
    {opt.label}
  </div>
));

const SearchableOptionList = React.memo(({ options, value, highlightedIndex, onSelect, setHighlightedIndex, listRef, maxHeight }) => {
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const node = listRef.current.children[highlightedIndex];
    if (node?.scrollIntoView) node.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, listRef]);

  return (
    <div
      ref={listRef}
      style={{ maxHeight, overflowY: 'auto' }}
      className="bg-white border border-gray-300 rounded-md shadow-lg"
      role="listbox"
      aria-label="options"
    >
      {options.length === 0 ? (
        <div className="px-4 py-2 text-gray-500">ไม่พบผลการค้นหา</div>
      ) : (
        options.map((opt, idx) => (
          <SearchableOptionItem
            key={opt.id ?? opt.value ?? idx}
            opt={opt}
            isSelected={value === opt.value}
            isHighlighted={idx === highlightedIndex}
            onSelect={onSelect}
            onHover={() => setHighlightedIndex(idx)}
          />
        ))
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const SearchableDropdown = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = '', 
  disabled = false 
}) => {
  const [open, setOpen] = useState(false);
  const { inputRef, popupRef, containerRef, rect } = useDropdownPortal(open);
  
  const { 
    query, setQuery, filtered, 
    highlightedIndex, setHighlightedIndex, 
    selectOption, clearSelection 
  } = useSearchableDropdownLogic(options, value, onChange, open, setOpen);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (!containerRef.current?.contains(e.target) && !popupRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, containerRef, popupRef]);

  const onInputChange = useCallback((e) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
    setHighlightedIndex(-1);
  }, [open]);

  const onToggle = useCallback((e) => {
    e?.stopPropagation();
    if (disabled) return;
    setOpen(prev => !prev);
    if (!open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled, open]);

  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    const actions = {
      ArrowDown: () => {
        setOpen(true);
        setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
      },
      ArrowUp: () => setHighlightedIndex(i => Math.max(i - 1, 0)),
      Enter: () => {
        if (open && highlightedIndex >= 0 && filtered[highlightedIndex]) {
          selectOption(filtered[highlightedIndex]);
        }
      },
      Escape: () => {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (actions[e.key]) {
      e.preventDefault();
      actions[e.key]();
    }
  }, [disabled, open, highlightedIndex, filtered, selectOption]);

  const popupNode = useMemo(() => {
    if (!open || disabled) return null;
    const popupStyle = {
      position: 'absolute',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 9999
    };
    return createPortal(
      <div style={popupStyle}>
        <SearchableOptionList
          options={filtered}
          value={value}
          highlightedIndex={highlightedIndex}
          onSelect={selectOption}
          setHighlightedIndex={setHighlightedIndex}
          listRef={popupRef}
          maxHeight={240}
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
          onKeyDown={handleKeyDown}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
        />

        <div
          className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer"
          onClick={(e) => {
            if (value) {
              e.stopPropagation();
              clearSelection();
              inputRef.current?.focus();
            } else {
              onToggle(e);
            }
          }}
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